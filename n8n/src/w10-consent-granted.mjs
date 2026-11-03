/**
 * Workflow 10 — consent granted
 *
 * The missing half of the consent story. Workflow 07 revokes; until now nothing
 * *granted*, which meant the only consent records in the system came from the
 * seeder. Workflow 01 refuses to process an assessment without a live
 * `ASSESSMENT` consent, so a real user could never get past the front door.
 *
 * This runs when someone accepts a consent sheet in the web app. It:
 *
 *   1. registers the anonymous subject on first use (no account, no contact
 *      details, banded age and coarse geography only)
 *   2. writes one append-only ledger entry per granted scope
 *   3. audits the grant, with the exact consent wording version shown
 *
 * Two rules enforced here rather than trusted to the client:
 *
 *   - **An erased subject is never resurrected.** If `subjects.erasedAt` is set,
 *     the grant is refused. Someone who asked to be erased and whose device
 *     still holds a pseudonym id must not be silently re-enrolled.
 *   - **Consent always expires.** The client cannot choose the lifetime; it is
 *     set here, per scope.
 */

import {
  workflow, webhook, code, ifNode, cond, respond,
  mongoFind, mongoInsert, mongoUpdate, sticky,
} from "./lib.mjs";
import { js } from "./shared.mjs";

const SCOPES = `
const ALL_SCOPES = [
  'ASSESSMENT',
  'STORE_RESULTS',
  'SHARE_WITH_CLINICIAN',
  'SHARE_WITH_FERTILITY_SERVICE',
  'AT_HOME_TESTING',
  'CONTACT_REMINDERS',
  'RESEARCH_AGGREGATE',
];

// Lifetimes are a policy decision, not a client input. Sharing scopes are
// deliberately the shortest: they are the ones that move data out of the system.
const SCOPE_TTL_DAYS = {
  ASSESSMENT:                   180,
  STORE_RESULTS:                365,
  SHARE_WITH_CLINICIAN:          30,
  SHARE_WITH_FERTILITY_SERVICE:  30,
  AT_HOME_TESTING:               90,
  CONTACT_REMINDERS:            180,
  RESEARCH_AGGREGATE:           365,
};
`;

const nodes = [
  sticky(
    "## 10 · Consent granted\n" +
      "The entry point for a real user. Registers the anonymous subject on first use " +
      "and writes one append-only ledger entry per scope.\n\n" +
      "**Refuses to resurrect an erased subject.** Expiry is set here, never by the client.\n\n" +
      "Workflow 01 reads what this writes, so without it no real assessment can start.",
    { pos: [0, -2], width: 520, height: 260, color: 5 },
  ),

  webhook("Webhook consent.granted", { path: "vigor/consent-granted", pos: [0, 0] }),

  code("Validate grant", {
    pos: [1, 0],
    js: js(
      SCOPES,
      `
const b = $json.body ?? $json;
const problems = [];

if (!b.pseudonymId || !/^psn_[a-z0-9]{6,32}$/.test(b.pseudonymId)) {
  problems.push('invalid:pseudonymId');
}
const scopes = Array.isArray(b.scopes) ? b.scopes : [];
if (scopes.length === 0) problems.push('missing:scopes');
const unknown = scopes.filter((s) => !ALL_SCOPES.includes(s));
if (unknown.length) problems.push('unknown_scope:' + unknown.join('|'));
if (!b.version) problems.push('missing:version');

// ASSESSMENT is the floor. Granting a sharing scope without it would let data
// leave for a case that was never allowed to be processed.
if (scopes.length && !scopes.includes('ASSESSMENT')) {
  const sharing = scopes.some((s) => s.startsWith('SHARE_') || s === 'AT_HOME_TESTING');
  if (sharing) problems.push('invalid:sharing_without_assessment_consent');
}

const AGE_BANDS = ['18-24', '25-29', '30-34', '35-39', '40+'];

return [{ json: {
  ok: problems.length === 0,
  problems,
  runId: $execution.id,
  pseudonymId: b.pseudonymId ?? null,
  scopes,
  version: b.version ?? null,
  locale: b.locale === 'ar' ? 'ar' : 'en',
  ageBand: AGE_BANDS.includes(b.ageBand) ? b.ageBand : 'unknown',
  emirate: typeof b.emirate === 'string' ? b.emirate.slice(0, 60) : 'Abu Dhabi',
  uiSurface: b.uiSurface ?? 'consent_sheet_v1',
} }];
`,
    ),
  }),

  ifNode("Grant valid?", {
    pos: [2, 0],
    when: [cond("={{ $json.ok }}", "boolean:true")],
  }),

  code("Build 400 · grant", {
    pos: [3, -1],
    js: js(`
const s = $('Validate grant').first().json;
return [{ json: { accepted: false, error: 'invalid_consent_grant', problems: s.problems } }];
`),
  }),

  respond("Respond 400 · grant", { pos: [4, -1], code: 400 }),

  mongoFind("Load subject", {
    pos: [3, 0],
    collection: "subjects",
    query: "={{ JSON.stringify({ pseudonymId: $json.pseudonymId }) }}",
    limit: 1,
  }),

  code("Decide subject state", {
    pos: [4, 0],
    notes: "An erased subject is never silently re-enrolled.",
    js: js(`
const s = $('Validate grant').first().json;
const subject = $('Load subject').first().json;
const exists = Boolean(subject && subject.pseudonymId);

if (exists && subject.erasedAt) {
  return [{ json: { ...s, blocked: true, reason: 'subject_erased', isNew: false } }];
}

return [{ json: { ...s, blocked: false, isNew: !exists } }];
`),
  }),

  ifNode("Subject usable?", {
    pos: [5, 0],
    when: [cond("={{ $json.blocked }}", "boolean:false")],
  }),

  code("Build 410 · erased", {
    pos: [6, 2],
    js: js(`
const s = $('Decide subject state').first().json;
return [{ json: {
  accepted: false,
  error: 'subject_erased',
  userMessage: s.locale === 'ar'
    ? 'تم حذف بياناتك بناءً على طلبك. يرجى البدء من جديد بجلسة جديدة.'
    : 'Your data was erased at your request. Please start again with a new session.',
} }];
`),
  }),

  respond("Respond 410", { pos: [7, 2], code: 410 }),

  ifNode("New subject?", {
    pos: [6, 0],
    when: [cond("={{ $json.isNew }}", "boolean:true")],
  }),

  code("Doc · new subject", {
    pos: [7, -1],
    js: js(`
const s = $('Decide subject state').first().json;
return [{ json: {
  pseudonymId: s.pseudonymId,
  locale: s.locale,
  accountLinked: false,
  ageBand: s.ageBand,
  emirate: s.emirate,
  createdAt: nowIso(),
  lastSeenAt: nowIso(),
  erasedAt: null,
} }];
`),
  }),

  mongoInsert("Write subject", {
    pos: [8, -1],
    collection: "subjects",
    fields: ["pseudonymId", "locale", "accountLinked", "ageBand", "emirate", "createdAt", "lastSeenAt", "erasedAt"],
  }),

  code("Doc · touch subject", {
    pos: [7, 1],
    js: js(`
const s = $('Decide subject state').first().json;
return [{ json: { pseudonymId: s.pseudonymId, lastSeenAt: nowIso(), locale: s.locale } }];
`),
  }),

  mongoUpdate("Update subject · seen", {
    pos: [8, 1],
    collection: "subjects",
    updateKey: "pseudonymId",
    fields: ["lastSeenAt", "locale"],
  }),

  code("Doc · consent entries", {
    pos: [9, 0],
    notes: "One append-only row per scope, each with its own expiry.",
    js: js(
      SCOPES,
      `
const s = $('Decide subject state').first().json;
const now = Date.now();

return s.scopes.map((scope) => ({ json: {
  consentId: newId('cns'),
  pseudonymId: s.pseudonymId,
  scope,
  granted: true,
  version: s.version,
  lawfulBasis: 'explicit_consent',
  locale: s.locale,
  grantedAt: nowIso(),
  expiresAt: new Date(now + (SCOPE_TTL_DAYS[scope] ?? 90) * 86400000).toISOString(),
  revokedAt: null,
  supersedes: null,
  evidence: { uiSurface: s.uiSurface, workflowRunId: s.runId },
} }));
`,
    ),
  }),

  mongoInsert("Write consents", {
    pos: [10, 0],
    collection: "consents",
    fields: [
      "consentId", "pseudonymId", "scope", "granted", "version", "lawfulBasis",
      "locale", "grantedAt", "expiresAt", "revokedAt", "supersedes", "evidence",
    ],
  }),

  code("Doc · audit grant", {
    pos: [11, 0],
    js: js(`
const s = $('Decide subject state').first().json;
return [{ json: auditDoc({
  actor: 'subject',
  action: 'CONSENT_GRANTED',
  pseudonymId: s.pseudonymId,
  subjectRef: { collection: 'consents', id: null },
  runId: s.runId,
  meta: {
    scopes: s.scopes,
    version: s.version,
    uiSurface: s.uiSurface,
    newSubject: s.isNew,
  },
}) }];
`),
  }),

  mongoInsert("Write audit · grant", {
    pos: [12, 0],
    collection: "audit_log",
    fields: ["at", "actor", "action", "pseudonymId", "subjectRef", "consentId", "workflowRunId", "outcome", "meta"],
  }),

  code("Build 201 · granted", {
    pos: [13, 0],
    js: js(`
const s = $('Decide subject state').first().json;
const written = $('Write consents').all().map((i) => i.json);

return [{ json: {
  accepted: true,
  pseudonymId: s.pseudonymId,
  newSubject: s.isNew,
  consents: written.map((c) => ({ consentId: c.consentId, scope: c.scope, expiresAt: c.expiresAt })),
  // The id workflow 01 needs on the next call.
  assessmentConsentId: (written.find((c) => c.scope === 'ASSESSMENT') || {}).consentId ?? null,
} }];
`),
  }),

  respond("Respond 201 · granted", { pos: [14, 0], code: 201 }),
];

const edges = [
  ["Webhook consent.granted", "Validate grant"],
  ["Validate grant", "Grant valid?"],
  ["Grant valid?", "Load subject", 0],
  ["Grant valid?", "Build 400 · grant", 1],
  ["Build 400 · grant", "Respond 400 · grant"],

  ["Load subject", "Decide subject state"],
  ["Decide subject state", "Subject usable?"],
  ["Subject usable?", "New subject?", 0],
  ["Subject usable?", "Build 410 · erased", 1],
  ["Build 410 · erased", "Respond 410"],

  ["New subject?", "Doc · new subject", 0],
  ["Doc · new subject", "Write subject"],
  ["Write subject", "Doc · consent entries"],
  ["New subject?", "Doc · touch subject", 1],
  ["Doc · touch subject", "Update subject · seen"],
  ["Update subject · seen", "Doc · consent entries"],

  ["Doc · consent entries", "Write consents"],
  ["Write consents", "Doc · audit grant"],
  ["Doc · audit grant", "Write audit · grant"],
  ["Write audit · grant", "Build 201 · granted"],
  ["Build 201 · granted", "Respond 201 · granted"],
];

export default workflow({
  name: "Vigor 10 · Consent Granted",
  tags: ["vigor", "privacy", "consent"],
  nodes,
  edges,
});
