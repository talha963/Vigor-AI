/**
 * Workflow 05 — lab result ingestion
 *
 * A result arrives from the lab, is flagged against the WHO 2021 (6th edition)
 * lower reference limits, stored append-only, and fed back into the risk engine
 * so the pathway updates itself. If the result changes the tier, a new triage
 * decision is written and — where the result is one that must not be delivered
 * cold — the case goes to a clinician before the user sees a number.
 *
 * Two deliberate choices:
 *
 *  - **A single abnormal sample is not a diagnosis.** WHO guidance is to repeat
 *    before concluding, so the pathway asks for a confirmatory sample instead of
 *    labelling anyone.
 *  - **Azoospermia and severe oligozoospermia are never auto-delivered.** The
 *    user is told their result is ready and that a clinician will go through it
 *    with them. Finding out you have no measurable sperm from a push
 *    notification is the kind of harm this project exists to avoid.
 */

import {
  workflow, webhook, code, ifNode, cond, respond,
  mongoInsert, mongoUpdate, http, sticky, configNode,
} from "./lib.mjs";
import { js, SEMEN_REFERENCE } from "./shared.mjs";

const nodes = [
  sticky(
    "## 05 · Lab result ingestion\n" +
      "Flag against WHO 2021 lower reference limits → store append-only → re-score → " +
      "update the pathway.\n\n" +
      "**Never auto-delivered:** azoospermia and severe oligozoospermia. The user is told " +
      "the result is ready and a clinician walks them through it.\n\n" +
      "One abnormal sample asks for a repeat, it does not label anyone.",
    { pos: [0, -2], width: 540, height: 280, color: 2 },
  ),

  webhook("Webhook lab.result", { path: "vigor/lab-result", pos: [0, 0] }),

  configNode("Vigor config", { pos: [0.5, -0.8] }),

  code("Authenticate lab & validate", {
    pos: [1, 0],
    notes: "The lab presents a shared key. Results are rejected, never queued, without it.",
    js: js(`
const CFG = $('Vigor config').first().json.vigorConfig;
const headers = $json.headers ?? {};
const b = $json.body ?? $json;

const presented = headers['x-vigor-lab-key'] ?? headers['X-Vigor-Lab-Key'] ?? null;
const expected = CFG.internalToken || null;
const authenticated = Boolean(expected) && presented === expected;

const problems = [];
if (!authenticated) problems.push('auth:lab_key_invalid');
if (!b.pseudonymId) problems.push('missing:pseudonymId');
if (!b.panel) problems.push('missing:panel');
if (!b.values || typeof b.values !== 'object') problems.push('missing:values');

return [{ json: {
  ok: problems.length === 0,
  authenticated,
  problems,
  runId: $execution.id,
  pseudonymId: b.pseudonymId ?? null,
  kitOrderId: b.kitOrderId ?? null,
  assessmentId: b.assessmentId ?? null,
  panel: b.panel ?? null,
  values: b.values ?? {},
  collectedAt: b.collectedAt ?? null,
  locale: b.locale === 'ar' ? 'ar' : 'en',
  labRef: b.labRef ?? null,
} }];
`),
  }),

  ifNode("Lab request valid?", {
    pos: [2, 0],
    when: [cond("={{ $json.ok }}", "boolean:true")],
  }),

  code("Build lab error response", {
    pos: [3, -1],
    js: js(`
const s = $('Authenticate lab & validate').first().json;
return [{ json: { accepted: false, error: s.authenticated ? 'invalid_result' : 'unauthorised',
                  problems: s.problems } }];
`),
  }),

  respond("Respond 401 · lab", { pos: [4, -1], code: 401 }),

  code("Flag against WHO 2021", {
    pos: [3, 0],
    notes:
      "Pure, deterministic, and the only place reference limits are written down. " +
      "Values live in n8n/src/shared.mjs under SEMEN_REFERENCE.",
    js: js(
      SEMEN_REFERENCE,
      `
const s = $('Authenticate lab & validate').first().json;

const flags = s.panel === 'semen_analysis' ? flagSemenResult(s.values) : [];
const nextStep = s.panel === 'semen_analysis'
  ? semenNextStep(flags)
  : { tier: 'PRIMARY_CARE', requiresHumanReview: false, action: 'reviewed_with_other_results' };

// Results that must not land as a notification.
const sensitiveFinding = flags.includes('AZOOSPERMIA') || flags.includes('SEVERE_OLIGOZOOSPERMIA');

const result = {
  resultId: newId('lab'),
  pseudonymId: s.pseudonymId,
  kitOrderId: s.kitOrderId,
  assessmentId: s.assessmentId,
  panel: s.panel,
  whoRefVersion: 'WHO-2021-6th',
  values: s.values,
  flags,
  labRef: s.labRef,
  collectedAt: s.collectedAt,
  receivedAt: nowIso(),
  supersedes: null,
};

return [{ json: { ...s, result, flags, nextStep, sensitiveFinding } }];
`,
    ),
  }),

  code("Doc · lab result", {
    pos: [4, 0],
    js: js(`return [{ json: $('Flag against WHO 2021').first().json.result }];`),
  }),

  mongoInsert("Write lab result", {
    pos: [5, 0],
    collection: "lab_results",
    fields: [
      "resultId", "pseudonymId", "kitOrderId", "assessmentId", "panel",
      "whoRefVersion", "values", "flags", "labRef", "collectedAt", "receivedAt",
      "supersedes",
    ],
    notes: "Append-only. A correction is a new document with `supersedes` set.",
  }),

  code("Doc · close kit order", {
    pos: [6, 0],
    js: js(`
const s = $('Flag against WHO 2021').first().json;
// No kit order (for example a walk-in lab result) is a normal case, not an error.
if (!s.kitOrderId) return [{ json: { kitOrderId: null, skip: true } }];
return [{ json: {
  kitOrderId: s.kitOrderId,
  status: 'resulted',
  labRef: s.labRef,
  returnedAt: nowIso(),
  remindersStopped: true,
} }];
`),
  }),

  ifNode("Has kit order?", {
    pos: [7, 0],
    when: [cond("={{ $json.kitOrderId }}", "string:exists")],
  }),

  mongoUpdate("Update kit order · resulted", {
    pos: [8, -1],
    collection: "kit_orders",
    updateKey: "kitOrderId",
    fields: ["status", "labRef", "returnedAt", "remindersStopped"],
  }),

  http("Agent service · re-score", {
    pos: [8, 1],
    method: "POST",
    url: "={{ $('Vigor config').first().json.vigorConfig.agentServiceUrl }}/internal/v1/rescore-with-result",
    headers: {
      "X-Vigor-Signature": "={{ $('Vigor config').first().json.vigorConfig.internalToken }}",
      "Content-Type": "application/json",
    },
    body:
      "={{ JSON.stringify({ pseudonymId: $('Flag against WHO 2021').first().json.pseudonymId, assessmentId: $('Flag against WHO 2021').first().json.assessmentId, panel: $('Flag against WHO 2021').first().json.panel, values: $('Flag against WHO 2021').first().json.values, flags: $('Flag against WHO 2021').first().json.flags }) }}",
    retry: { tries: 2, waitMs: 2000 },
    onError: "continueRegularOutput",
  }),

  code("Reconcile result → tier", {
    pos: [9, 1],
    notes: "Same escalate-only rule as workflow 01. The lab finding can raise the tier.",
    js: js(`
const s = $('Flag against WHO 2021').first().json;
const raw = $('Agent service · re-score').first().json ?? {};
const engine = raw && raw.triage ? raw : null;

const engineTier = engine ? engine.triage.tier : null;
let tier = engineTier ?? s.nextStep.tier;
tier = escalateOnly(tier, s.nextStep.tier);

const requiresHumanReview =
  s.nextStep.requiresHumanReview
  || s.sensitiveFinding
  || (engine ? Boolean(engine.triage.requiresHumanReview) : false);

const decision = {
  decisionId: newId('trg'),
  assessmentId: s.assessmentId,
  pseudonymId: s.pseudonymId,
  scoreId: engine ? (engine.scoreId ?? null) : null,
  tier,
  redFlags: s.flags.filter((f) => f === 'AZOOSPERMIA' || f === 'SEVERE_OLIGOZOOSPERMIA'),
  rationale: engine
    ? (engine.triage.rationale ?? '')
    : 'Routed from the laboratory result against WHO 2021 reference limits.',
  rationaleLocale: s.locale,
  requiresHumanReview,
  source: engine ? 'engine_with_lab_result' : 'lab_result_rules',
  clamped: engineTier !== null && engineTier !== tier,
  tierBeforeClamp: engineTier ?? tier,
  triggeredByResultId: s.result.resultId,
  reviewedBy: null,
  reviewedAt: null,
  reviewOutcome: null,
  reviewNote: null,
  status: requiresHumanReview ? 'pending_review' : 'final',
  createdAt: nowIso(),
};

return [{ json: { ...s, decision, deliverResultDirectly: !s.sensitiveFinding } }];
`),
  }),

  code("Doc · triage from result", {
    pos: [10, 1],
    js: js(`return [{ json: $('Reconcile result → tier').first().json.decision }];`),
  }),

  mongoInsert("Write triage from result", {
    pos: [11, 1],
    collection: "triage_decisions",
    fields: [
      "decisionId", "assessmentId", "pseudonymId", "scoreId", "tier", "redFlags",
      "rationale", "rationaleLocale", "requiresHumanReview", "source", "clamped",
      "tierBeforeClamp", "triggeredByResultId", "reviewedBy", "reviewedAt",
      "reviewOutcome", "reviewNote", "status", "createdAt",
    ],
  }),

  ifNode("Needs clinician first?", {
    pos: [12, 1],
    when: [cond("={{ $('Reconcile result → tier').first().json.decision.requiresHumanReview }}", "boolean:true")],
  }),

  code("Build escalation from result", {
    pos: [13, 0],
    js: js(`
const s = $('Reconcile result → tier').first().json;
const severe = s.flags.includes('AZOOSPERMIA') || s.flags.includes('SEVERE_OLIGOZOOSPERMIA');
return [{ json: {
  eventId: newId('evt'),
  eventType: 'triage.red_flag',
  occurredAt: nowIso(),
  pseudonymId: s.pseudonymId,
  locale: s.locale,
  decisionId: s.decision.decisionId,
  assessmentId: s.assessmentId,
  redFlags: s.decision.redFlags,
  severity: 'ROUTINE_REVIEW',
  slaMinutes: severe ? 1440 : 2880,
  reasons: [{
    code: severe ? 'RF_SEVERE_SEMEN_FINDING' : 'RF_SEMEN_BELOW_REF',
    severity: 'ROUTINE_REVIEW',
    reason: severe
      ? 'Semen analysis shows no measurable or severely reduced sperm concentration. A clinician must deliver and interpret this result.'
      : 'Semen parameters below WHO 2021 reference limits. A confirmatory sample is indicated.',
  }],
  sourceRunId: s.runId,
} }];
`),
  }),

  http("Hand off to 02 · result review", {
    pos: [14, 0],
    method: "POST",
    url: "={{ $('Vigor config').first().json.vigorConfig.webhookBase }}/webhook/vigor/red-flag-escalation",
    headers: { "Content-Type": "application/json" },
    body: "={{ JSON.stringify($json) }}",
    retry: { tries: 3, waitMs: 2000 },
  }),

  code("Doc · notification result", {
    pos: [13, 2],
    notes:
      "No values, no flags, no numbers in the message body. The result is read in the " +
      "app, behind authentication, or with a clinician.",
    js: js(`
const s = $('Reconcile result → tier').first().json;

const TEXT = {
  direct: {
    en: 'Your test result is ready to view in the app.',
    ar: 'نتيجة تحليلك جاهزة للعرض في التطبيق.',
  },
  withClinician: {
    en: 'Your test result is ready. A clinician will go through it with you before you see the detail, so nothing important lands without context.',
    ar: 'نتيجة تحليلك جاهزة. سيقوم أحد الأطباء بمراجعتها معك قبل عرض التفاصيل، حتى لا تصلك معلومة مهمة بدون شرح.',
  },
};
const kind = s.deliverResultDirectly ? 'direct' : 'withClinician';

return [{ json: {
  notificationId: newId('ntf'),
  pseudonymId: s.pseudonymId,
  template: 'result_ready',
  locale: s.locale,
  channel: 'in_app',
  discreet: true,
  subject: s.locale === 'ar' ? 'تحديث من فيجور' : 'Your Vigor update',
  consentId: null,
  status: 'sent',
  attempt: 1,
  sentAt: nowIso(),
  createdAt: nowIso(),
  bodyText: TEXT[kind][s.locale] ?? TEXT[kind].en,
  withholdsDetail: !s.deliverResultDirectly,
  relatedResultId: s.result.resultId,
} }];
`),
  }),

  mongoInsert("Write notification · result", {
    pos: [14, 2],
    collection: "notifications",
    fields: [
      "notificationId", "pseudonymId", "template", "locale", "channel", "discreet",
      "subject", "consentId", "status", "attempt", "sentAt", "createdAt", "bodyText",
      "withholdsDetail", "relatedResultId",
    ],
  }),

  code("Doc · audit lab result", {
    pos: [15, 1],
    js: js(`
const s = $('Reconcile result → tier').first().json;
return [{ json: auditDoc({
  actor: 'lab:ingestion',
  action: 'LAB_RESULT_INGESTED',
  pseudonymId: s.pseudonymId,
  subjectRef: { collection: 'lab_results', id: s.result.resultId },
  runId: s.runId,
  meta: {
    panel: s.panel,
    whoRefVersion: 'WHO-2021-6th',
    flagCount: s.flags.length,
    flags: s.flags,
    newTier: s.decision.tier,
    requiresHumanReview: s.decision.requiresHumanReview,
    detailWithheld: !s.deliverResultDirectly,
  },
}) }];
`),
  }),

  mongoInsert("Write audit · lab result", {
    pos: [16, 1],
    collection: "audit_log",
    fields: ["at", "actor", "action", "pseudonymId", "subjectRef", "consentId", "workflowRunId", "outcome", "meta"],
  }),

  code("Build 202 · lab", {
    pos: [17, 1],
    js: js(`
const s = $('Reconcile result → tier').first().json;
return [{ json: {
  accepted: true,
  resultId: s.result.resultId,
  flags: s.flags,
  whoRefVersion: 'WHO-2021-6th',
  nextStep: s.nextStep,
  tier: s.decision.tier,
  requiresHumanReview: s.decision.requiresHumanReview,
  boundary: {
    isDiagnosis: false,
    statement: 'A single semen analysis is not a diagnosis. WHO guidance is to confirm with a repeat sample.',
  },
} }];
`),
  }),

  respond("Respond 202 · lab", { pos: [18, 1], code: 202 }),
];

const edges = [
  ["Webhook lab.result", "Vigor config"],
  ["Vigor config", "Authenticate lab & validate"],
  ["Authenticate lab & validate", "Lab request valid?"],
  ["Lab request valid?", "Flag against WHO 2021", 0],
  ["Lab request valid?", "Build lab error response", 1],
  ["Build lab error response", "Respond 401 · lab"],

  ["Flag against WHO 2021", "Doc · lab result"],
  ["Doc · lab result", "Write lab result"],
  ["Write lab result", "Doc · close kit order"],
  ["Doc · close kit order", "Has kit order?"],
  ["Has kit order?", "Update kit order · resulted", 0],
  ["Has kit order?", "Agent service · re-score", 1],
  ["Update kit order · resulted", "Agent service · re-score"],

  ["Agent service · re-score", "Reconcile result → tier"],
  ["Reconcile result → tier", "Doc · triage from result"],
  ["Doc · triage from result", "Write triage from result"],
  ["Write triage from result", "Needs clinician first?"],

  ["Needs clinician first?", "Build escalation from result", 0],
  ["Build escalation from result", "Hand off to 02 · result review"],
  ["Hand off to 02 · result review", "Doc · notification result"],

  ["Needs clinician first?", "Doc · notification result", 1],
  ["Doc · notification result", "Write notification · result"],
  ["Write notification · result", "Doc · audit lab result"],
  ["Doc · audit lab result", "Write audit · lab result"],
  ["Write audit · lab result", "Build 202 · lab"],
  ["Build 202 · lab", "Respond 202 · lab"],
];

export default workflow({
  name: "Vigor 05 · Lab Result Ingestion & Re-score",
  tags: ["vigor", "clinical-safety", "labs"],
  nodes,
  edges,
});
