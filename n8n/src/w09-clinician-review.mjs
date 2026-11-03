/**
 * Workflow 09 — clinician review (human in the loop)
 *
 * This is where "human oversight is made explicit" stops being a slide and
 * becomes a gate. Workflow 03 refuses to dispatch a referral for any decision
 * flagged `requiresHumanReview` until this workflow has released it.
 *
 * The interesting rule is what a clinician is NOT allowed to do casually.
 * Overriding upward is always permitted. Overriding downward is permitted too —
 * a clinician who has spoken to the patient knows more than the engine — but:
 *
 *  - de-escalation requires a written justification, recorded against their id
 *  - a de-escalation that crosses an emergency red flag (torsion, mass,
 *    priapism, trauma, retention) is refused outright by this workflow; that
 *    conversation belongs in a clinical system with a named accountable
 *    clinician, not in a screening tool's API
 *
 * The refusal is itself audited, so a pattern of attempts is visible.
 */

import {
  workflow, webhook, code, ifNode, cond, respond,
  mongoFind, mongoInsert, mongoUpdate, sticky, configNode,
} from "./lib.mjs";
import { js } from "./shared.mjs";

const OVERRIDE_RULES = `
// Red flags that a screening tool must never allow to be waved away remotely.
const NON_DEESCALATABLE = new Set([
  'RF_ACUTE_SCROTAL_PAIN',
  'RF_TESTICULAR_MASS',
  'RF_PRIAPISM',
  'RF_GU_TRAUMA',
  'RF_ACUTE_URINARY_RETENTION',
]);

const VALID_OUTCOMES = ['approved', 'escalated', 'de_escalated'];
const VALID_TIERS = [
  'SELF_CARE', 'PRIMARY_CARE', 'FERTILITY_SERVICES', 'ANDROLOGY_UROLOGY', 'URGENT',
];
`;

const nodes = [
  sticky(
    "## 09 · Clinician review\n" +
      "The gate workflow 03 waits on.\n\n" +
      "Escalating is always allowed. De-escalating needs a written justification against " +
      "the clinician's id — and is **refused outright** when it crosses an emergency red " +
      "flag (torsion, mass, priapism, trauma, retention).\n\n" +
      "Refused attempts are audited, so a pattern is visible.",
    { pos: [0, -2], width: 540, height: 280, color: 5 },
  ),

  webhook("Webhook clinician.review", { path: "vigor/clinician-review", pos: [0, 0] }),

  configNode("Vigor config", { pos: [0.5, -0.8] }),

  code("Authenticate clinician", {
    pos: [1, 0],
    notes:
      "A shared key is enough for a hackathon build; production needs the clinician's own " +
      "federated identity, which is noted in docs/06-clinical-safety.md.",
    js: js(
      OVERRIDE_RULES,
      `
const CFG = $('Vigor config').first().json.vigorConfig;
const headers = $json.headers ?? {};
const b = $json.body ?? $json;

const presented = headers['x-vigor-clinician-key'] ?? headers['X-Vigor-Clinician-Key'] ?? null;
const expected = CFG.internalToken || null;
const authenticated = Boolean(expected) && presented === expected;

const problems = [];
if (!authenticated) problems.push('auth:clinician_key_invalid');
if (!b.clinicianId) problems.push('missing:clinicianId');
if (!b.decisionId) problems.push('missing:decisionId');
if (!VALID_OUTCOMES.includes(b.outcome)) problems.push('invalid:outcome');
if (b.outcome === 'de_escalated') {
  if (!b.overrideTier || !VALID_TIERS.includes(b.overrideTier)) problems.push('invalid:overrideTier');
  if (!b.justification || String(b.justification).trim().length < 20) {
    problems.push('missing:justification');
  }
}
if (b.outcome === 'escalated' && (!b.overrideTier || !VALID_TIERS.includes(b.overrideTier))) {
  problems.push('invalid:overrideTier');
}

return [{ json: {
  ok: problems.length === 0,
  authenticated,
  problems,
  runId: $execution.id,
  clinicianId: b.clinicianId ?? null,
  decisionId: b.decisionId ?? null,
  outcome: b.outcome ?? null,
  overrideTier: b.overrideTier ?? null,
  justification: b.justification ?? null,
  note: b.note ?? null,
} }];
`,
    ),
  }),

  ifNode("Review request valid?", {
    pos: [2, 0],
    when: [cond("={{ $json.ok }}", "boolean:true")],
  }),

  code("Build review error", {
    pos: [3, -1],
    js: js(`
const s = $('Authenticate clinician').first().json;
return [{ json: {
  accepted: false,
  error: s.authenticated ? 'invalid_review' : 'unauthorised',
  problems: s.problems,
  hint: s.problems.includes('missing:justification')
    ? 'De-escalation requires a written justification of at least 20 characters.'
    : undefined,
} }];
`),
  }),

  respond("Respond 400 · review", { pos: [4, -1], code: 400 }),

  mongoFind("Load decision", {
    pos: [3, 0],
    collection: "triage_decisions",
    query: "={{ JSON.stringify({ decisionId: $json.decisionId }) }}",
    limit: 1,
  }),

  code("Evaluate override", {
    pos: [4, 0],
    notes: "The one rule a clinician cannot talk their way past, enforced in code.",
    js: js(
      OVERRIDE_RULES,
      `
const req = $('Authenticate clinician').first().json;
const d = $('Load decision').first().json;

if (!d || !d.decisionId) {
  return [{ json: { permitted: false, reason: 'decision_not_found', runId: req.runId } }];
}
if (d.status === 'final' && d.reviewedAt) {
  return [{ json: { permitted: false, reason: 'already_reviewed',
                    decisionId: d.decisionId, pseudonymId: d.pseudonymId, runId: req.runId } }];
}

const currentTier = d.tier;
const redFlags = d.redFlags ?? [];
const blockingFlags = redFlags.filter((f) => NON_DEESCALATABLE.has(f));

let finalTier = currentTier;
if (req.outcome === 'escalated' || req.outcome === 'de_escalated') finalTier = req.overrideTier;

const isDeEscalation =
  ['SELF_CARE', 'PRIMARY_CARE', 'FERTILITY_SERVICES', 'ANDROLOGY_UROLOGY', 'URGENT']
    .indexOf(finalTier) <
  ['SELF_CARE', 'PRIMARY_CARE', 'FERTILITY_SERVICES', 'ANDROLOGY_UROLOGY', 'URGENT']
    .indexOf(currentTier);

if (isDeEscalation && blockingFlags.length > 0) {
  return [{ json: {
    permitted: false,
    reason: 'deescalation_blocked_by_red_flag',
    blockingFlags,
    decisionId: d.decisionId,
    pseudonymId: d.pseudonymId,
    clinicianId: req.clinicianId,
    attemptedTier: finalTier,
    currentTier,
    runId: req.runId,
  } }];
}

return [{ json: {
  permitted: true,
  decisionId: d.decisionId,
  pseudonymId: d.pseudonymId,
  assessmentId: d.assessmentId ?? null,
  locale: d.rationaleLocale === 'ar' ? 'ar' : 'en',
  clinicianId: req.clinicianId,
  outcome: req.outcome,
  currentTier,
  finalTier,
  isDeEscalation,
  redFlags,
  justification: req.justification,
  note: req.note,
  runId: req.runId,
} }];
`,
    ),
  }),

  ifNode("Override permitted?", {
    pos: [5, 0],
    when: [cond("={{ $json.permitted }}", "boolean:true")],
  }),

  code("Doc · audit blocked override", {
    pos: [6, 2],
    notes: "A refused de-escalation is a clinical-governance signal and is never silent.",
    js: js(`
const e = $('Evaluate override').first().json;
return [{ json: auditDoc({
  actor: 'clinician:' + (e.clinicianId ?? 'unknown'),
  action: 'REVIEW_OVERRIDE_REFUSED',
  pseudonymId: e.pseudonymId ?? null,
  subjectRef: { collection: 'triage_decisions', id: e.decisionId ?? null },
  runId: e.runId,
  outcome: 'refused',
  meta: {
    reason: e.reason,
    blockingFlags: e.blockingFlags ?? [],
    attemptedTier: e.attemptedTier ?? null,
    currentTier: e.currentTier ?? null,
  },
}) }];
`),
  }),

  mongoInsert("Write audit · blocked", {
    pos: [7, 2],
    collection: "audit_log",
    fields: ["at", "actor", "action", "pseudonymId", "subjectRef", "consentId", "workflowRunId", "outcome", "meta"],
  }),

  code("Build 422 · blocked", {
    pos: [8, 2],
    js: js(`
const e = $('Evaluate override').first().json;
const MESSAGES = {
  decision_not_found: 'No such triage decision.',
  already_reviewed: 'This decision has already been reviewed.',
  deescalation_blocked_by_red_flag:
    'This decision carries an emergency red flag and cannot be de-escalated through the screening API. ' +
    'Manage it in the clinical record with a named accountable clinician.',
};
return [{ json: {
  accepted: false,
  error: e.reason,
  message: MESSAGES[e.reason] ?? 'Override refused.',
  blockingFlags: e.blockingFlags ?? [],
} }];
`),
  }),

  respond("Respond 422", { pos: [9, 2], code: 422 }),

  code("Doc · finalise decision", {
    pos: [6, 0],
    js: js(`
const e = $('Evaluate override').first().json;
return [{ json: {
  decisionId: e.decisionId,
  tier: e.finalTier,
  source: e.outcome === 'approved' ? 'engine' : 'clinician_override',
  reviewedBy: 'clinician:' + e.clinicianId,
  reviewedAt: nowIso(),
  reviewOutcome: e.outcome,
  reviewNote: e.note,
  reviewJustification: e.justification,
  tierBeforeReview: e.currentTier,
  status: 'final',
  requiresHumanReview: false,
} }];
`),
  }),

  mongoUpdate("Update decision · final", {
    pos: [7, 0],
    collection: "triage_decisions",
    updateKey: "decisionId",
    fields: [
      "tier", "source", "reviewedBy", "reviewedAt", "reviewOutcome", "reviewNote",
      "reviewJustification", "tierBeforeReview", "status", "requiresHumanReview",
    ],
  }),

  mongoFind("Find open escalation", {
    pos: [8, 0],
    collection: "escalations",
    query:
      "={{ JSON.stringify({ decisionId: $('Evaluate override').first().json.decisionId, status: { $in: ['open','breached'] } }) }}",
    limit: 5,
  }),

  code("Doc · acknowledge escalation", {
    pos: [9, 0],
    notes:
      "Acknowledgement is what stops the SLA sweep in workflow 02. A breached " +
      "escalation keeps its breach record and is closed, not quietly reset.",
    js: js(`
const e = $('Evaluate override').first().json;
const open = $('Find open escalation').all().map((i) => i.json).filter((x) => x && x.escalationId);

if (open.length === 0) {
  return [{ json: { escalationId: '__noop__', status: null, acknowledgedBy: null,
                    acknowledgedAt: null, closedAt: null } }];
}

return open.map((x) => ({ json: {
  escalationId: x.escalationId,
  status: 'closed',
  wasBreached: x.status === 'breached',
  acknowledgedBy: 'clinician:' + e.clinicianId,
  acknowledgedAt: nowIso(),
  closedAt: nowIso(),
} }));
`),
  }),

  mongoUpdate("Update escalation · closed", {
    pos: [10, 0],
    collection: "escalations",
    updateKey: "escalationId",
    fields: ["status", "wasBreached", "acknowledgedBy", "acknowledgedAt", "closedAt"],
  }),

  code("Doc · notification reviewed", {
    pos: [11, 0],
    js: js(`
const e = $('Evaluate override').first().json;

const TEXT = {
  en: 'A clinician has reviewed your result. You can now see your next step in the app.',
  ar: 'قام أحد الأطباء بمراجعة نتيجتك. يمكنك الآن الاطلاع على الخطوة التالية في التطبيق.',
};

return [{ json: {
  notificationId: newId('ntf'),
  pseudonymId: e.pseudonymId,
  template: 'review_complete',
  locale: e.locale,
  channel: 'in_app',
  discreet: true,
  subject: e.locale === 'ar' ? 'تحديث من فيجور' : 'Your Vigor update',
  consentId: null,
  status: 'sent',
  attempt: 1,
  sentAt: nowIso(),
  createdAt: nowIso(),
  bodyText: TEXT[e.locale] ?? TEXT.en,
  relatedDecisionId: e.decisionId,
} }];
`),
  }),

  mongoInsert("Write notification · reviewed", {
    pos: [12, 0],
    collection: "notifications",
    fields: [
      "notificationId", "pseudonymId", "template", "locale", "channel", "discreet",
      "subject", "consentId", "status", "attempt", "sentAt", "createdAt", "bodyText",
      "relatedDecisionId",
    ],
  }),

  code("Doc · audit review", {
    pos: [13, 0],
    js: js(`
const e = $('Evaluate override').first().json;
return [{ json: auditDoc({
  actor: 'clinician:' + e.clinicianId,
  action: 'TRIAGE_REVIEWED',
  pseudonymId: e.pseudonymId,
  subjectRef: { collection: 'triage_decisions', id: e.decisionId },
  runId: e.runId,
  meta: {
    outcome: e.outcome,
    tierBeforeReview: e.currentTier,
    tierAfterReview: e.finalTier,
    isDeEscalation: e.isDeEscalation,
    redFlags: e.redFlags,
    justificationProvided: Boolean(e.justification),
  },
}) }];
`),
  }),

  mongoInsert("Write audit · review", {
    pos: [14, 0],
    collection: "audit_log",
    fields: ["at", "actor", "action", "pseudonymId", "subjectRef", "consentId", "workflowRunId", "outcome", "meta"],
  }),

  code("Build 200 · reviewed", {
    pos: [15, 0],
    js: js(`
const e = $('Evaluate override').first().json;
return [{ json: {
  accepted: true,
  decisionId: e.decisionId,
  tier: e.finalTier,
  tierBeforeReview: e.currentTier,
  outcome: e.outcome,
  reviewedBy: 'clinician:' + e.clinicianId,
  referralUnblocked: true,
} }];
`),
  }),

  respond("Respond 200 · reviewed", { pos: [16, 0] }),
];

const edges = [
  ["Webhook clinician.review", "Vigor config"],
  ["Vigor config", "Authenticate clinician"],
  ["Authenticate clinician", "Review request valid?"],
  ["Review request valid?", "Load decision", 0],
  ["Review request valid?", "Build review error", 1],
  ["Build review error", "Respond 400 · review"],

  ["Load decision", "Evaluate override"],
  ["Evaluate override", "Override permitted?"],
  ["Override permitted?", "Doc · finalise decision", 0],
  ["Override permitted?", "Doc · audit blocked override", 1],
  ["Doc · audit blocked override", "Write audit · blocked"],
  ["Write audit · blocked", "Build 422 · blocked"],
  ["Build 422 · blocked", "Respond 422"],

  ["Doc · finalise decision", "Update decision · final"],
  ["Update decision · final", "Find open escalation"],
  ["Find open escalation", "Doc · acknowledge escalation"],
  ["Doc · acknowledge escalation", "Update escalation · closed"],
  ["Update escalation · closed", "Doc · notification reviewed"],
  ["Doc · notification reviewed", "Write notification · reviewed"],
  ["Write notification · reviewed", "Doc · audit review"],
  ["Doc · audit review", "Write audit · review"],
  ["Write audit · review", "Build 200 · reviewed"],
  ["Build 200 · reviewed", "Respond 200 · reviewed"],
];

export default workflow({
  name: "Vigor 09 · Clinician Review (Human in the Loop)",
  tags: ["vigor", "human-oversight", "clinical-safety"],
  nodes,
  edges,
});
