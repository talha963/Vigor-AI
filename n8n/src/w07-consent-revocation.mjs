/**
 * Workflow 07 — consent revocation cascade
 *
 * "You can withdraw consent at any time" is worth nothing if withdrawing it
 * leaves a share token live in a clinic inbox and a reminder queued for Tuesday.
 * This workflow is the cascade that makes the promise true, and it finishes by
 * handing the user a receipt listing exactly what was stopped.
 *
 * In order:
 *   1. write an append-only revocation entry (the ledger is never edited)
 *   2. stamp `revokedAt` on every live consent in the revoked scope
 *   3. revoke every outstanding share token, so facility callbacks start failing
 *   4. stop reminders on open kit orders and unfinished assessments
 *   5. if erasure was asked for, drop contact details and redact stored answers
 *   6. write the receipt and audit every step
 *
 * A note on the sentinel rows below: an n8n branch stops when a node emits zero
 * items, which would silently skip later steps of the cascade. Each step
 * therefore always emits at least one row, using a key that matches no document
 * when there is nothing to do. The update is then a no-op and the cascade
 * continues to the end — which is the behaviour you want in the one workflow
 * that must never half-complete.
 */

import {
  workflow, webhook, code, ifNode, cond, respond,
  mongoAggregate, mongoInsert, mongoUpdate, sticky,
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

// Scopes whose withdrawal must kill outstanding share tokens.
const SHARING_SCOPES = new Set(['SHARE_WITH_CLINICIAN', 'SHARE_WITH_FERTILITY_SERVICE']);
`;

const NOOP = "__noop__";

const nodes = [
  sticky(
    "## 07 · Revocation cascade\n" +
      "The workflow that makes “withdraw at any time” real.\n\n" +
      "Append-only revocation entry → stamp live consents → **kill share tokens** → stop " +
      "reminders → optional erasure → receipt.\n\n" +
      "Each step always emits a row (sentinel `__noop__` when there is nothing to do) so " +
      "the cascade can never half-complete.",
    { pos: [0, -2], width: 560, height: 280, color: 3 },
  ),

  webhook("Webhook consent.revoked", { path: "vigor/consent-revoked", pos: [0, 0] }),

  code("Validate revocation", {
    pos: [1, 0],
    js: js(
      SCOPES,
      `
const b = $json.body ?? $json;
const problems = [];
if (!b.pseudonymId) problems.push('missing:pseudonymId');

const requested = b.scope === 'ALL' || !b.scope ? ALL_SCOPES : [].concat(b.scope);
const unknown = requested.filter((s) => !ALL_SCOPES.includes(s));
if (unknown.length) problems.push('unknown_scope:' + unknown.join('|'));

return [{ json: {
  ok: problems.length === 0,
  problems,
  runId: $execution.id,
  pseudonymId: b.pseudonymId ?? null,
  scopes: requested,
  revokeAll: b.scope === 'ALL' || !b.scope,
  // Erasure is a separate, explicit ask. Withdrawing consent does not silently
  // delete someone's results, because they may want them later.
  eraseData: b.eraseData === true,
  locale: b.locale === 'ar' ? 'ar' : 'en',
  reason: b.reason ?? null,
} }];
`,
    ),
  }),

  ifNode("Revocation valid?", {
    pos: [2, 0],
    when: [cond("={{ $json.ok }}", "boolean:true")],
  }),

  respond("Respond 400 · revocation", { pos: [3, -1], code: 400 }),

  mongoAggregate("Gather affected records", {
    pos: [3, 0],
    collection: "subjects",
    notes: "One read of everything the cascade has to touch.",
    pipeline:
      "={{ JSON.stringify([" +
      "{ $match: { pseudonymId: $json.pseudonymId } }," +
      "{ $lookup: { from: 'consents',    localField: 'pseudonymId', foreignField: 'pseudonymId', as: 'consentDocs' } }," +
      "{ $lookup: { from: 'referrals',   localField: 'pseudonymId', foreignField: 'pseudonymId', as: 'referralDocs' } }," +
      "{ $lookup: { from: 'kit_orders',  localField: 'pseudonymId', foreignField: 'pseudonymId', as: 'kitDocs' } }," +
      "{ $lookup: { from: 'assessments', localField: 'pseudonymId', foreignField: 'pseudonymId', as: 'assessmentDocs' } }," +
      "{ $project: { _id: 0, pseudonymId: 1, locale: 1, erasedAt: 1, accountLinked: 1," +
      " consentDocs: 1, referralDocs: 1, kitDocs: 1, assessmentDocs: 1 } }" +
      "]) }}",
  }),

  code("Plan cascade", {
    pos: [4, 0],
    notes: "Decides everything up front, so the receipt matches what actually happens.",
    js: js(
      SCOPES,
      `
const req = $('Validate revocation').first().json;
const subject = $input.all().map((i) => i.json).find((d) => d && d.pseudonymId) ?? null;

const scopeSet = new Set(req.scopes);
const consents = (subject && subject.consentDocs) || [];
const referrals = (subject && subject.referralDocs) || [];
const kits = (subject && subject.kitDocs) || [];
const assessments = (subject && subject.assessmentDocs) || [];

const liveConsents = consents.filter(
  (c) => c.granted === true && !c.revokedAt && scopeSet.has(c.scope)
);

const killTokens = req.revokeAll || req.scopes.some((s) => SHARING_SCOPES.has(s));
const liveTokens = killTokens
  ? referrals.filter((r) => r.shareToken && !r.shareToken.revokedAt)
  : [];

const stopReminders = req.revokeAll || scopeSet.has('CONTACT_REMINDERS');
const openKits = stopReminders
  ? kits.filter((k) => k.remindersStopped !== true)
  : [];
const openAssessments = stopReminders
  ? assessments.filter((a) => a.status === 'started' && a.nudgeStopped !== true)
  : [];

const redactable = req.eraseData
  ? assessments.filter((a) => a.answers && !a.redactedAt)
  : [];

return [{ json: {
  runId: req.runId,
  pseudonymId: req.pseudonymId,
  locale: req.locale,
  subjectFound: Boolean(subject),
  scopes: req.scopes,
  revokeAll: req.revokeAll,
  eraseData: req.eraseData,
  reason: req.reason,
  plan: {
    revocationEntryScopes: req.scopes,
    consentIds: liveConsents.map((c) => c.consentId),
    referralIds: liveTokens.map((r) => r.referralId),
    kitOrderIds: openKits.map((k) => k.kitOrderId),
    assessmentIds: openAssessments.map((a) => a.assessmentId),
    redactAssessmentIds: redactable.map((a) => a.assessmentId),
  },
  counts: {
    consentsRevoked: liveConsents.length,
    shareTokensRevoked: liveTokens.length,
    kitRemindersStopped: openKits.length,
    assessmentNudgesStopped: openAssessments.length,
    assessmentsRedacted: redactable.length,
  },
} }];
`,
    ),
  }),

  code("Doc · revocation entries", {
    pos: [5, 0],
    notes: "The ledger grows; nothing in it is ever rewritten.",
    js: js(`
const p = $('Plan cascade').first().json;
return p.plan.revocationEntryScopes.map((scope) => ({ json: {
  consentId: newId('cns'),
  pseudonymId: p.pseudonymId,
  scope,
  granted: false,
  version: 'revocation-v1',
  lawfulBasis: 'withdrawal_of_consent',
  locale: p.locale,
  grantedAt: null,
  expiresAt: null,
  revokedAt: nowIso(),
  supersedes: null,
  revocationReason: p.reason,
  evidence: { uiSurface: 'privacy_centre', workflowRunId: p.runId },
} }));
`),
  }),

  mongoInsert("Write revocation entries", {
    pos: [6, 0],
    collection: "consents",
    fields: [
      "consentId", "pseudonymId", "scope", "granted", "version", "lawfulBasis",
      "locale", "grantedAt", "expiresAt", "revokedAt", "supersedes",
      "revocationReason", "evidence",
    ],
  }),

  code("Doc · stamp live consents", {
    pos: [7, 0],
    js: js(`
const p = $('Plan cascade').first().json;
const ids = p.plan.consentIds;
if (ids.length === 0) return [{ json: { consentId: '${NOOP}', revokedAt: null, granted: false } }];
return ids.map((consentId) => ({ json: { consentId, revokedAt: nowIso(), granted: false } }));
`),
  }),

  mongoUpdate("Update consents · revoked", {
    pos: [8, 0],
    collection: "consents",
    updateKey: "consentId",
    fields: ["revokedAt", "granted"],
  }),

  code("Doc · revoke share tokens", {
    pos: [9, 0],
    notes:
      "The single most important write in the system. After this, a facility " +
      "presenting the token to workflow 03 is refused.",
    js: js(`
const p = $('Plan cascade').first().json;
const ids = p.plan.referralIds;
if (ids.length === 0) {
  return [{ json: { referralId: '${NOOP}', shareToken: null, status: null, shareRevokedAt: null } }];
}
return ids.map((referralId) => ({ json: {
  referralId,
  // The token object is replaced wholesale so no stale expiry survives.
  shareToken: { token: null, expiresAt: null, scope: [], revokedAt: nowIso(), accessCount: 0 },
  status: 'share_revoked',
  shareRevokedAt: nowIso(),
} }));
`),
  }),

  mongoUpdate("Update referrals · token revoked", {
    pos: [10, 0],
    collection: "referrals",
    updateKey: "referralId",
    fields: ["shareToken", "status", "shareRevokedAt"],
  }),

  code("Doc · stop kit reminders", {
    pos: [11, 0],
    js: js(`
const p = $('Plan cascade').first().json;
const ids = p.plan.kitOrderIds;
if (ids.length === 0) return [{ json: { kitOrderId: '${NOOP}', remindersStopped: true } }];
return ids.map((kitOrderId) => ({ json: { kitOrderId, remindersStopped: true } }));
`),
  }),

  mongoUpdate("Update kit orders · reminders off", {
    pos: [12, 0],
    collection: "kit_orders",
    updateKey: "kitOrderId",
    fields: ["remindersStopped"],
  }),

  code("Doc · stop nudges & redact", {
    pos: [13, 0],
    notes:
      "Redaction keeps the assessment row (so counts and fairness metrics survive) " +
      "but removes every answer value.",
    js: js(`
const p = $('Plan cascade').first().json;
const stop = new Set(p.plan.assessmentIds);
const redact = new Set(p.plan.redactAssessmentIds);
const all = new Set([...stop, ...redact]);

if (all.size === 0) {
  return [{ json: { assessmentId: '${NOOP}', nudgeStopped: true, answers: null, redactedAt: null } }];
}

return [...all].map((assessmentId) => ({ json: {
  assessmentId,
  nudgeStopped: stop.has(assessmentId) ? true : undefined,
  answers: redact.has(assessmentId) ? null : undefined,
  redactedAt: redact.has(assessmentId) ? nowIso() : undefined,
} }));
`),
  }),

  mongoUpdate("Update assessments · stop & redact", {
    pos: [14, 0],
    collection: "assessments",
    updateKey: "assessmentId",
    fields: ["nudgeStopped", "answers", "redactedAt"],
  }),

  ifNode("Erasure requested?", {
    pos: [15, 0],
    when: [cond("={{ $('Plan cascade').first().json.eraseData }}", "boolean:true")],
  }),

  code("Doc · erase contact details", {
    pos: [16, -1],
    notes: "Contact details are the only link to a person, so erasure starts here.",
    js: js(`
const p = $('Plan cascade').first().json;
return [{ json: {
  pseudonymId: p.pseudonymId,
  contact: null,
  accountLinked: false,
  erasedAt: nowIso(),
} }];
`),
  }),

  mongoUpdate("Update subject · erased", {
    pos: [17, -1],
    collection: "subjects",
    updateKey: "pseudonymId",
    fields: ["contact", "accountLinked", "erasedAt"],
  }),

  code("Build receipt", {
    pos: [16, 1],
    notes:
      "The user gets a specific, checkable list. Vague reassurance is what erodes " +
      "trust in exactly this kind of service.",
    js: js(`
const p = $('Plan cascade').first().json;

const lines = {
  en: [
    p.counts.consentsRevoked + ' consent(s) withdrawn',
    p.counts.shareTokensRevoked + ' active data share(s) revoked - any clinic link now fails',
    p.counts.kitRemindersStopped + ' kit reminder schedule(s) stopped',
    p.counts.assessmentNudgesStopped + ' unfinished check(s) will no longer be followed up',
  ],
  ar: [
    'تم سحب ' + p.counts.consentsRevoked + ' موافقة',
    'تم إلغاء ' + p.counts.shareTokensRevoked + ' عملية مشاركة بيانات نشطة - أي رابط للعيادة لم يعد يعمل',
    'تم إيقاف ' + p.counts.kitRemindersStopped + ' جدول تذكير',
    'لن تتم متابعة ' + p.counts.assessmentNudgesStopped + ' فحص غير مكتمل',
  ],
};
if (p.eraseData) {
  lines.en.push(p.counts.assessmentsRedacted + ' stored assessment(s) had their answers erased');
  lines.en.push('Your contact details were deleted');
  lines.ar.push('تم حذف إجابات ' + p.counts.assessmentsRedacted + ' تقييم محفوظ');
  lines.ar.push('تم حذف بيانات الاتصال الخاصة بك');
}

return [{ json: {
  receiptId: newId('rcp'),
  pseudonymId: p.pseudonymId,
  issuedAt: nowIso(),
  scopesRevoked: p.scopes,
  erasureRequested: p.eraseData,
  counts: p.counts,
  lines: lines[p.locale] ?? lines.en,
  retained: p.eraseData
    ? ['An audit record that these actions happened, which is required and contains no answers.']
    : ['Your results remain available to you until you ask for them to be erased.'],
  locale: p.locale,
  runId: p.runId,
} }];
`),
  }),

  code("Doc · audit revocation", {
    pos: [17, 1],
    js: js(`
const r = $('Build receipt').first().json;
return [{ json: auditDoc({
  actor: 'subject',
  action: r.erasureRequested ? 'CONSENT_REVOKED_AND_ERASED' : 'CONSENT_REVOKED',
  pseudonymId: r.pseudonymId,
  subjectRef: { collection: 'subjects', id: r.pseudonymId },
  runId: r.runId,
  meta: { scopes: r.scopesRevoked, counts: r.counts, receiptId: r.receiptId },
}) }];
`),
  }),

  mongoInsert("Write audit · revocation", {
    pos: [18, 1],
    collection: "audit_log",
    fields: ["at", "actor", "action", "pseudonymId", "subjectRef", "consentId", "workflowRunId", "outcome", "meta"],
  }),

  code("Doc · notification receipt", {
    pos: [19, 1],
    js: js(`
const r = $('Build receipt').first().json;
return [{ json: {
  notificationId: newId('ntf'),
  pseudonymId: r.pseudonymId,
  template: 'erasure_complete',
  locale: r.locale,
  channel: 'in_app',
  discreet: true,
  subject: r.locale === 'ar' ? 'تحديث من فيجور' : 'Your Vigor update',
  consentId: null,
  status: 'sent',
  attempt: 1,
  sentAt: nowIso(),
  createdAt: nowIso(),
  bodyText: r.lines.join(' · '),
  relatedReceiptId: r.receiptId,
} }];
`),
  }),

  mongoInsert("Write notification · receipt", {
    pos: [20, 1],
    collection: "notifications",
    fields: [
      "notificationId", "pseudonymId", "template", "locale", "channel", "discreet",
      "subject", "consentId", "status", "attempt", "sentAt", "createdAt", "bodyText",
      "relatedReceiptId",
    ],
  }),

  code("Build 200 · receipt", {
    pos: [21, 1],
    js: js(`
const r = $('Build receipt').first().json;
return [{ json: { accepted: true, receipt: r } }];
`),
  }),

  respond("Respond 200 · receipt", { pos: [22, 1] }),
];

const edges = [
  ["Webhook consent.revoked", "Validate revocation"],
  ["Validate revocation", "Revocation valid?"],
  ["Revocation valid?", "Gather affected records", 0],
  ["Revocation valid?", "Respond 400 · revocation", 1],

  ["Gather affected records", "Plan cascade"],
  ["Plan cascade", "Doc · revocation entries"],
  ["Doc · revocation entries", "Write revocation entries"],
  ["Write revocation entries", "Doc · stamp live consents"],
  ["Doc · stamp live consents", "Update consents · revoked"],
  ["Update consents · revoked", "Doc · revoke share tokens"],
  ["Doc · revoke share tokens", "Update referrals · token revoked"],
  ["Update referrals · token revoked", "Doc · stop kit reminders"],
  ["Doc · stop kit reminders", "Update kit orders · reminders off"],
  ["Update kit orders · reminders off", "Doc · stop nudges & redact"],
  ["Doc · stop nudges & redact", "Update assessments · stop & redact"],
  ["Update assessments · stop & redact", "Erasure requested?"],

  ["Erasure requested?", "Doc · erase contact details", 0],
  ["Doc · erase contact details", "Update subject · erased"],
  ["Update subject · erased", "Build receipt"],
  ["Erasure requested?", "Build receipt", 1],

  ["Build receipt", "Doc · audit revocation"],
  ["Doc · audit revocation", "Write audit · revocation"],
  ["Write audit · revocation", "Doc · notification receipt"],
  ["Doc · notification receipt", "Write notification · receipt"],
  ["Write notification · receipt", "Build 200 · receipt"],
  ["Build 200 · receipt", "Respond 200 · receipt"],
];

export default workflow({
  name: "Vigor 07 · Consent Revocation Cascade",
  tags: ["vigor", "privacy", "compliance"],
  nodes,
  edges,
});
