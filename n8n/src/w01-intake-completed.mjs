/**
 * Workflow 01 — intake.completed
 *
 * Owns the assessment lifecycle. A completed intake arrives, the consent gate
 * decides whether we may process it at all, the deterministic red-flag gate runs
 * BEFORE any model is consulted, the agent service produces the explainable risk
 * score and proposed tier, and the two are reconciled under an escalate-only
 * rule. Everything is persisted and audited, then the case is routed.
 *
 * The reconciliation step is the clinical-safety heart of the system: if the
 * agent service is unreachable, slow or returns something unusable, the
 * fallback gate still routes a red-flag case correctly. The model can never
 * lower the tier the deterministic gate asked for.
 */

import {
  workflow, webhook, code, ifNode, switchNode, cond, respond,
  mongoFind, mongoInsert, http, sticky, configNode,
} from "./lib.mjs";
import { js, RED_FLAG_GATE, CONSENT_GATE } from "./shared.mjs";

const nodes = [
  sticky(
    "## 01 · Intake → Risk → Triage\n" +
      "The entry point for every assessment.\n\n" +
      "**Order matters.** Consent gate → deterministic red-flag gate → agent service → " +
      "reconcile (escalate-only) → persist → route.\n\n" +
      "If the agent service is down the red-flag gate still routes urgent cases. " +
      "A model result can raise the tier, never lower it.",
    { pos: [0, -2], width: 520, height: 260, color: 4 },
  ),

  webhook("Webhook intake.completed", {
    path: "vigor/intake-completed",
    pos: [0, 0],
    notes: "POST /webhook/vigor/intake-completed — see packages/contracts/events.schema.json",
  }),

  configNode("Vigor config", { pos: [0.5, -0.8] }),

  code("Validate envelope", {
    pos: [1, 0],
    notes: "Rejects anything that does not match the event contract. No clinical logic here.",
    js: js(`
const body = $json.body ?? $json;

const problems = [];
const need = (k, v) => { if (v === undefined || v === null || v === '') problems.push('missing:' + k); };

need('eventType', body.eventType);
need('pseudonymId', body.pseudonymId);
need('assessmentId', body.assessmentId);
need('consentId', body.consentId);

if (body.eventType && body.eventType !== 'intake.completed') {
  problems.push('eventType:expected intake.completed');
}
if (!body.answers || typeof body.answers !== 'object') {
  problems.push('missing:answers');
}

const locale = body.locale === 'ar' ? 'ar' : 'en';

return [{
  json: {
    ok: problems.length === 0,
    problems,
    receivedAt: nowIso(),
    runId: $execution.id,
    idempotencyKey: body.idempotencyKey ?? (body.assessmentId + ':intake.completed'),
    pseudonymId: body.pseudonymId ?? null,
    assessmentId: body.assessmentId ?? null,
    consentId: body.consentId ?? null,
    locale,
    startedAt: body.startedAt ?? null,
    durationSec: body.durationSec ?? null,
    answers: body.answers ?? {},
    answeredItemCount: body.answers ? Object.keys(body.answers).length : 0,
    skippedSensitive: body.skippedSensitive ?? [],
  },
}];
`),
  }),

  ifNode("Envelope valid?", {
    pos: [2, 0],
    when: [cond("={{ $json.ok }}", "boolean:true")],
  }),

  code("Build 400 response", {
    pos: [3, -1],
    js: js(`
const v = $('Validate envelope').first().json;
return [{ json: { accepted: false, error: 'invalid_event', problems: v.problems, runId: v.runId } }];
`),
  }),

  respond("Respond 400", { pos: [4, -1], code: 400 }),

  mongoFind("Load consent ledger", {
    pos: [3, 1],
    collection: "consents",
    query: "={{ JSON.stringify({ pseudonymId: $json.pseudonymId }) }}",
    sort: { grantedAt: -1 },
    limit: 50,
    notes: "The ledger is append-only, so we read it all and let the gate decide.",
  }),

  code("Consent gate · ASSESSMENT", {
    pos: [4, 1],
    notes: "No consent, no processing. The refusal itself is audited.",
    js: js(
      CONSENT_GATE,
      `
const intake = $('Validate envelope').first().json;
const docs = $('Load consent ledger').all().map((i) => i.json).filter((d) => d && d.scope);
const verdict = evaluateConsent(docs, 'ASSESSMENT');

return [{ json: { ...intake, consent: verdict } }];
`,
    ),
  }),

  ifNode("Consent authorised?", {
    pos: [5, 1],
    when: [cond("={{ $json.consent.authorised }}", "boolean:true")],
  }),

  code("Doc · audit consent refusal", {
    pos: [6, 3],
    js: js(`
const s = $('Consent gate · ASSESSMENT').first().json;
return [{ json: auditDoc({
  actor: 'workflow:01-intake-completed',
  action: 'PROCESSING_REFUSED_NO_CONSENT',
  pseudonymId: s.pseudonymId,
  subjectRef: { collection: 'assessments', id: s.assessmentId },
  runId: s.runId,
  outcome: 'refused',
  meta: { requiredScope: 'ASSESSMENT', reason: s.consent.reason },
}) }];
`),
  }),

  mongoInsert("Write audit · refusal", {
    pos: [7, 3],
    collection: "audit_log",
    fields: ["at", "actor", "action", "pseudonymId", "subjectRef", "consentId", "workflowRunId", "outcome", "meta"],
  }),

  code("Build 403 response", {
    pos: [8, 3],
    js: js(`
const s = $('Consent gate · ASSESSMENT').first().json;
return [{ json: {
  accepted: false,
  error: 'consent_required',
  reason: s.consent.reason,
  requiredScope: 'ASSESSMENT',
  runId: s.runId,
} }];
`),
  }),

  respond("Respond 403", { pos: [9, 3], code: 403 }),

  code("Red-flag gate (deterministic)", {
    pos: [6, 1],
    notes:
      "Runs before any model call. Pure functions over the submitted answers. " +
      "Defined in n8n/src/shared.mjs and reviewed in docs/06-clinical-safety.md.",
    js: js(
      RED_FLAG_GATE,
      `
const s = $('Consent gate · ASSESSMENT').first().json;
const gate = runRedFlagGate(s.answers);

return [{ json: {
  ...s,
  gate,
  agentRequest: {
    assessmentId: s.assessmentId,
    pseudonymId: s.pseudonymId,
    locale: s.locale,
    answers: s.answers,
    // The service is told what the gate found so its narration cannot contradict it.
    deterministicGate: gate,
  },
} }];
`,
    ),
  }),

  http("Agent service · score & triage", {
    pos: [7, 1],
    method: "POST",
    url: "={{ $('Vigor config').first().json.vigorConfig.agentServiceUrl }}/internal/v1/score-and-triage",
    headers: {
      "X-Vigor-Signature": "={{ $('Vigor config').first().json.vigorConfig.internalToken }}",
      "X-Vigor-Run-Id": "={{ $execution.id }}",
      "Content-Type": "application/json",
    },
    body: "={{ JSON.stringify($json.agentRequest) }}",
    timeout: 25000,
    retry: { tries: 2, waitMs: 1500 },
    onError: "continueRegularOutput",
    notes:
      "Unavailability is expected, not exceptional. onError continues so the " +
      "reconcile step can fall back to the deterministic gate.",
  }),

  code("Reconcile · escalate only", {
    pos: [8, 1],
    notes:
      "The safety rule in one place: take the engine tier, then clamp it upward to " +
      "the deterministic minimum. Never downward. Record which source won.",
    js: js(
      RED_FLAG_GATE,
      `
const s = $('Red-flag gate (deterministic)').first().json;
const raw = $('Agent service · score & triage').first().json ?? {};
const engine = raw && raw.overall ? raw : (raw.body && raw.body.overall ? raw.body : null);

const engineAvailable = Boolean(engine && engine.triage && engine.triage.tier);
const degraded = !engineAvailable;

// Baseline tier when we have no engine output at all.
const fallbackTier = s.gate.minimumTier
  ?? (Number(s.answers.monthsTrying) >= 12 ? 'ANDROLOGY_UROLOGY' : 'PRIMARY_CARE');

let tier = engineAvailable ? engine.triage.tier : fallbackTier;
const tierBeforeClamp = tier;

if (s.gate.minimumTier) tier = escalateOnly(tier, s.gate.minimumTier);

const redFlags = Array.from(new Set([
  ...(s.gate.redFlags || []),
  ...((engineAvailable && engine.triage.redFlags) || []),
]));

const requiresHumanReview =
  redFlags.length > 0
  || tier === 'URGENT'
  || (engineAvailable ? Boolean(engine.triage.requiresHumanReview) : true);

const scoreId = newId('scr');
const decisionId = newId('trg');

const riskScore = {
  scoreId,
  assessmentId: s.assessmentId,
  pseudonymId: s.pseudonymId,
  modelVersion: engineAvailable ? (engine.modelVersion ?? 'unknown') : 'fallback-gate-only',
  computedAt: nowIso(),
  domains: engineAvailable ? (engine.domains ?? []) : [],
  overall: engineAvailable
    ? engine.overall
    : { score: null, band: 'unscored', confidence: 0 },
  missingInputs: engineAvailable ? (engine.missingInputs ?? []) : ['risk_engine_unavailable'],
  degraded,
};

const triage = {
  decisionId,
  assessmentId: s.assessmentId,
  pseudonymId: s.pseudonymId,
  scoreId,
  tier,
  redFlags,
  rationale: engineAvailable
    ? (engine.triage.rationale ?? '')
    : 'Routed by the deterministic safety gate because the risk engine was unavailable.',
  rationaleLocale: s.locale,
  requiresHumanReview,
  source: engineAvailable ? 'engine' : 'fallback_gate',
  clamped: tier !== tierBeforeClamp,
  tierBeforeClamp,
  reviewedBy: null,
  reviewedAt: null,
  reviewOutcome: null,
  reviewNote: null,
  status: requiresHumanReview ? 'pending_review' : 'final',
  createdAt: nowIso(),
};

const assessment = {
  assessmentId: s.assessmentId,
  pseudonymId: s.pseudonymId,
  locale: s.locale,
  consentId: s.consent.consentId,
  status: 'completed',
  startedAt: s.startedAt,
  completedAt: nowIso(),
  durationSec: s.durationSec,
  answers: s.answers,
  answeredItemCount: s.answeredItemCount,
  skippedSensitive: s.skippedSensitive,
  idempotencyKey: s.idempotencyKey,
};

return [{ json: {
  runId: s.runId,
  pseudonymId: s.pseudonymId,
  locale: s.locale,
  consentId: s.consent.consentId,
  gate: s.gate,
  assessment,
  riskScore,
  triage,
  degraded,
} }];
`,
    ),
  }),

  code("Doc · assessment", {
    pos: [9, 1],
    js: js(`return [{ json: $('Reconcile · escalate only').first().json.assessment }];`),
  }),

  mongoInsert("Write assessment", {
    pos: [10, 1],
    collection: "assessments",
    fields: [
      "assessmentId", "pseudonymId", "locale", "consentId", "status", "startedAt",
      "completedAt", "durationSec", "answers", "answeredItemCount",
      "skippedSensitive", "idempotencyKey",
    ],
  }),

  code("Doc · risk score", {
    pos: [11, 1],
    js: js(`return [{ json: $('Reconcile · escalate only').first().json.riskScore }];`),
  }),

  mongoInsert("Write risk score", {
    pos: [12, 1],
    collection: "risk_scores",
    fields: [
      "scoreId", "assessmentId", "pseudonymId", "modelVersion", "computedAt",
      "domains", "overall", "missingInputs", "degraded",
    ],
  }),

  code("Doc · triage decision", {
    pos: [13, 1],
    js: js(`return [{ json: $('Reconcile · escalate only').first().json.triage }];`),
  }),

  mongoInsert("Write triage decision", {
    pos: [14, 1],
    collection: "triage_decisions",
    fields: [
      "decisionId", "assessmentId", "pseudonymId", "scoreId", "tier", "redFlags",
      "rationale", "rationaleLocale", "requiresHumanReview", "source", "clamped",
      "tierBeforeClamp", "reviewedBy", "reviewedAt", "reviewOutcome", "reviewNote",
      "status", "createdAt",
    ],
  }),

  switchNode("Route by tier", {
    pos: [15, 1],
    notes: "Acuity routing. URGENT hands off to workflow 02 immediately.",
    routes: [
      {
        key: "URGENT",
        when: [cond("={{ $('Reconcile · escalate only').first().json.triage.tier }}", "string:equals", "URGENT")],
      },
      {
        key: "SPECIALIST",
        when: [
          cond(
            "={{ ['ANDROLOGY_UROLOGY','FERTILITY_SERVICES'].includes($('Reconcile · escalate only').first().json.triage.tier) }}",
            "boolean:true",
          ),
        ],
      },
      {
        key: "PRIMARY_CARE",
        when: [cond("={{ $('Reconcile · escalate only').first().json.triage.tier }}", "string:equals", "PRIMARY_CARE")],
      },
    ],
    fallback: "SELF_CARE",
  }),

  code("Build escalation event", {
    pos: [16, -1],
    js: js(`
const CFG = $('Vigor config').first().json.vigorConfig;
const r = $('Reconcile · escalate only').first().json;
return [{ json: {
  eventId: newId('evt'),
  eventType: 'triage.red_flag',
  occurredAt: nowIso(),
  pseudonymId: r.pseudonymId,
  locale: r.locale,
  decisionId: r.triage.decisionId,
  assessmentId: r.triage.assessmentId,
  redFlags: r.triage.redFlags,
  severity: r.gate.severity ?? 'URGENT',
  slaMinutes: r.gate.slaMinutes ?? CFG.escalationSlaMinutes,
  reasons: r.gate.reasons ?? [],
  sourceRunId: r.runId,
} }];
`),
  }),

  http("Hand off to 02 · escalation", {
    pos: [17, -1],
    method: "POST",
    url: "={{ $('Vigor config').first().json.vigorConfig.webhookBase }}/webhook/vigor/red-flag-escalation",
    headers: { "Content-Type": "application/json" },
    body: "={{ JSON.stringify($json) }}",
    retry: { tries: 3, waitMs: 2000 },
    notes:
      "Deliberately a webhook call, not a sub-workflow: the escalation becomes its own " +
      "execution record with its own retry and SLA clock.",
  }),

  code("Next step · specialist", {
    pos: [16, 1],
    js: js(`
const r = $('Reconcile · escalate only').first().json;
return [{ json: { ...r, nextStep: {
  kind: 'specialist_referral_offer',
  tier: r.triage.tier,
  // The referral is NOT created here. It needs its own explicit consent, which
  // the user gives on the results screen; workflow 03 then dispatches it.
  requiresConsentScope: r.triage.tier === 'FERTILITY_SERVICES'
    ? 'SHARE_WITH_FERTILITY_SERVICE'
    : 'SHARE_WITH_CLINICIAN',
  atHomeKitOffered: true,
} } }];
`),
  }),

  code("Next step · primary care", {
    pos: [16, 2],
    js: js(`
const r = $('Reconcile · escalate only').first().json;
return [{ json: { ...r, nextStep: {
  kind: 'primary_care',
  tier: r.triage.tier,
  requiresConsentScope: 'SHARE_WITH_CLINICIAN',
  atHomeKitOffered: true,
} } }];
`),
  }),

  code("Next step · self care", {
    pos: [16, 3],
    js: js(`
const r = $('Reconcile · escalate only').first().json;
return [{ json: { ...r, nextStep: {
  kind: 'self_care',
  tier: 'SELF_CARE',
  requiresConsentScope: null,
  atHomeKitOffered: false,
  // Modifiable drivers are what self-care advice is built from, so the user sees
  // something actionable rather than a reassuring dead end.
  modifiableDrivers: (r.riskScore.domains || [])
    .flatMap((d) => d.drivers || [])
    .filter((x) => x.modifiable)
    .map((x) => x.code),
} } }];
`),
  }),

  code("Doc · audit triage", {
    pos: [18, 1],
    js: js(`
const r = $('Reconcile · escalate only').first().json;
return [{ json: auditDoc({
  actor: 'workflow:01-intake-completed',
  action: 'TRIAGE_DECIDED',
  pseudonymId: r.pseudonymId,
  subjectRef: { collection: 'triage_decisions', id: r.triage.decisionId },
  consentId: r.consentId,
  runId: r.runId,
  meta: {
    tier: r.triage.tier,
    tierBeforeClamp: r.triage.tierBeforeClamp,
    clamped: r.triage.clamped,
    redFlagCount: (r.triage.redFlags || []).length,
    source: r.triage.source,
    degraded: r.degraded,
  },
}) }];
`),
  }),

  mongoInsert("Write audit · triage", {
    pos: [19, 1],
    collection: "audit_log",
    fields: ["at", "actor", "action", "pseudonymId", "subjectRef", "consentId", "workflowRunId", "outcome", "meta"],
  }),

  code("Build 200 response", {
    pos: [20, 1],
    notes: "The response is what the results screen renders. Screening, not diagnosis.",
    js: js(`
const r = $('Reconcile · escalate only').first().json;
// Whichever branch ran is the one that set nextStep.
const branches = ['Next step · specialist', 'Next step · primary care', 'Next step · self care'];
let nextStep = { kind: 'urgent', tier: 'URGENT', requiresConsentScope: null, atHomeKitOffered: false };
for (const b of branches) {
  try {
    const v = $(b).first().json;
    if (v && v.nextStep) { nextStep = v.nextStep; break; }
  } catch (e) { /* branch did not run */ }
}

return [{ json: {
  accepted: true,
  assessmentId: r.triage.assessmentId,
  decisionId: r.triage.decisionId,
  tier: r.triage.tier,
  redFlags: r.triage.redFlags,
  requiresHumanReview: r.triage.requiresHumanReview,
  explanation: {
    rationale: r.triage.rationale,
    domains: r.riskScore.domains,
    overall: r.riskScore.overall,
    missingInputs: r.riskScore.missingInputs,
  },
  nextStep,
  boundary: {
    isDiagnosis: false,
    statement: 'This is a screening result, not a diagnosis. A clinician makes the diagnosis.',
    humanOversight: r.triage.requiresHumanReview
      ? 'A clinician will review this result before any referral is sent.'
      : 'You can ask for a clinician to review this at any time.',
  },
  degraded: r.degraded,
  runId: r.runId,
} }];
`),
  }),

  respond("Respond 200", { pos: [21, 1] }),
];

const edges = [
  ["Webhook intake.completed", "Vigor config"],
  ["Vigor config", "Validate envelope"],
  ["Validate envelope", "Envelope valid?"],
  ["Envelope valid?", "Load consent ledger", 0],
  ["Envelope valid?", "Build 400 response", 1],
  ["Build 400 response", "Respond 400"],

  ["Load consent ledger", "Consent gate · ASSESSMENT"],
  ["Consent gate · ASSESSMENT", "Consent authorised?"],
  ["Consent authorised?", "Red-flag gate (deterministic)", 0],
  ["Consent authorised?", "Doc · audit consent refusal", 1],
  ["Doc · audit consent refusal", "Write audit · refusal"],
  ["Write audit · refusal", "Build 403 response"],
  ["Build 403 response", "Respond 403"],

  ["Red-flag gate (deterministic)", "Agent service · score & triage"],
  ["Agent service · score & triage", "Reconcile · escalate only"],
  ["Reconcile · escalate only", "Doc · assessment"],
  ["Doc · assessment", "Write assessment"],
  ["Write assessment", "Doc · risk score"],
  ["Doc · risk score", "Write risk score"],
  ["Write risk score", "Doc · triage decision"],
  ["Doc · triage decision", "Write triage decision"],
  ["Write triage decision", "Route by tier"],

  ["Route by tier", "Build escalation event", 0],
  ["Build escalation event", "Hand off to 02 · escalation"],
  ["Hand off to 02 · escalation", "Doc · audit triage"],

  ["Route by tier", "Next step · specialist", 1],
  ["Next step · specialist", "Doc · audit triage"],
  ["Route by tier", "Next step · primary care", 2],
  ["Next step · primary care", "Doc · audit triage"],
  ["Route by tier", "Next step · self care", 3],
  ["Next step · self care", "Doc · audit triage"],

  ["Doc · audit triage", "Write audit · triage"],
  ["Write audit · triage", "Build 200 response"],
  ["Build 200 response", "Respond 200"],
];

export default workflow({
  name: "Vigor 01 · Intake Completed → Risk & Triage",
  tags: ["vigor", "core", "clinical-safety"],
  nodes,
  edges,
});
