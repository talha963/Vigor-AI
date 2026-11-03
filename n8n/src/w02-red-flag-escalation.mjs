/**
 * Workflow 02 — red-flag escalation
 *
 * Owns the escalation lifecycle, both halves of it:
 *
 *   webhook   → raise an escalation, start an SLA clock, give the user urgent
 *               care instructions immediately and alert the on-call clinician
 *   schedule  → sweep for escalations whose SLA has expired without being
 *               acknowledged, mark them breached and escalate the escalation
 *
 * The sweep is the part that makes "human oversight" more than a word: an
 * urgent case that nobody looked at produces a visible, auditable breach.
 *
 * Urgent care instructions are the one message class that ignores quiet hours
 * and the CONTACT_REMINDERS consent scope. Withholding "go to an emergency
 * department now" because it is 22:00 would be indefensible, and that exception
 * is written down in docs/05-privacy-and-consent.md rather than buried here.
 */

import {
  workflow, webhook, schedule, code, ifNode, cond, respond,
  mongoFind, mongoInsert, mongoUpdate, http, sticky, configNode,
} from "./lib.mjs";
import { js, NOTIFY_POLICY } from "./shared.mjs";

const URGENT_INSTRUCTIONS = `
const URGENT_GUIDANCE = {
  URGENT: {
    en: 'Your answers describe something that needs to be seen today. Please go to an emergency department or call emergency services now. Do not wait for an appointment.',
    ar: 'تشير إجاباتك إلى حالة تحتاج إلى تقييم فوري اليوم. يرجى التوجه إلى قسم الطوارئ أو الاتصال بخدمات الإسعاف الآن، ولا تنتظر موعداً.',
  },
  SAME_DAY: {
    en: 'Your answers describe something that should be assessed today. Please contact a clinic or urgent care service today.',
    ar: 'تشير إجاباتك إلى حالة ينبغي تقييمها اليوم. يرجى التواصل مع عيادة أو خدمة رعاية عاجلة اليوم.',
  },
  ROUTINE_REVIEW: {
    en: 'A clinician will review your answers before you are referred. You do not need to do anything right now.',
    ar: 'سيقوم أحد الأطباء بمراجعة إجاباتك قبل إحالتك. لا يلزمك فعل أي شيء في الوقت الحالي.',
  },
};
`;

const nodes = [
  sticky(
    "## 02 · Red-flag escalation\n" +
      "Two triggers, one lifecycle.\n\n" +
      "**Top:** raise an escalation, start the SLA clock, tell the user what to do *now*, " +
      "alert the on-call clinician.\n\n" +
      "**Bottom:** every 5 minutes, find escalations past `dueAt` that nobody acknowledged " +
      "and mark them breached. An unseen urgent case must be loud.",
    { pos: [0, -2], width: 520, height: 280, color: 3 },
  ),

  /* ----------------------------------------------------- raise an escalation */

  webhook("Webhook triage.red_flag", {
    path: "vigor/red-flag-escalation",
    pos: [0, 0],
    notes: "Called by workflow 01, or directly by the agent service.",
  }),

  configNode("Vigor config", { pos: [0.5, -0.8] }),

  code("Build escalation", {
    pos: [1, 0],
    js: js(
      URGENT_INSTRUCTIONS,
      `
const CFG = $('Vigor config').first().json.vigorConfig;
const b = $json.body ?? $json;

if (!b.pseudonymId || !b.decisionId) {
  return [{ json: { ok: false, error: 'invalid_event', problems: ['missing:pseudonymId|decisionId'] } }];
}

const severity = ['URGENT', 'SAME_DAY', 'ROUTINE_REVIEW'].includes(b.severity)
  ? b.severity
  : 'URGENT';
const slaMinutes = Number(b.slaMinutes) > 0
  ? Number(b.slaMinutes)
  : CFG.escalationSlaMinutes;

const locale = b.locale === 'ar' ? 'ar' : 'en';

const escalation = {
  escalationId: newId('esc'),
  pseudonymId: b.pseudonymId,
  decisionId: b.decisionId,
  assessmentId: b.assessmentId ?? null,
  redFlags: b.redFlags ?? [],
  reasons: b.reasons ?? [],
  severity,
  slaMinutes,
  dueAt: new Date(Date.now() + slaMinutes * 60000).toISOString(),
  status: 'open',
  acknowledgedBy: null,
  acknowledgedAt: null,
  createdAt: nowIso(),
  closedAt: null,
  sourceRunId: b.sourceRunId ?? null,
};

return [{ json: {
  ok: true,
  runId: $execution.id,
  locale,
  escalation,
  guidance: URGENT_GUIDANCE[severity][locale],
} }];
`,
    ),
  }),

  ifNode("Escalation valid?", {
    pos: [2, 0],
    when: [cond("={{ $json.ok }}", "boolean:true")],
  }),

  respond("Respond 400 · escalation", { pos: [3, -1], code: 400 }),

  code("Doc · escalation", {
    pos: [3, 0],
    js: js(`return [{ json: $('Build escalation').first().json.escalation }];`),
  }),

  mongoInsert("Write escalation", {
    pos: [4, 0],
    collection: "escalations",
    fields: [
      "escalationId", "pseudonymId", "decisionId", "assessmentId", "redFlags",
      "reasons", "severity", "slaMinutes", "dueAt", "status", "acknowledgedBy",
      "acknowledgedAt", "createdAt", "closedAt", "sourceRunId",
    ],
  }),

  code("Doc · urgent instructions", {
    pos: [5, 0],
    notes:
      "Safety-critical template. Quiet hours and the reminder consent scope do not " +
      "apply, and that exception is recorded on the notification document itself.",
    js: js(
      NOTIFY_POLICY,
      `
const CFG = $('Vigor config').first().json.vigorConfig;
const s = $('Build escalation').first().json;
const doc = notificationDoc({
  pseudonymId: s.escalation.pseudonymId,
  template: 'urgent_care_instructions',
  locale: s.locale,
  channel: 'in_app',
  consentId: null,
  status: CFG.notifyMode === 'DEMO' ? 'queued' : 'sent',
});

return [{ json: {
  ...doc,
  safetyCritical: true,
  quietHoursOverridden: quietHoursBlock(new Date(), CFG.quietHoursStart, CFG.quietHoursEnd),
  consentOverrideBasis: 'vital_interests',
  bodyText: s.guidance,
  relatedEscalationId: s.escalation.escalationId,
} }];
`,
    ),
  }),

  mongoInsert("Write notification · urgent", {
    pos: [6, 0],
    collection: "notifications",
    fields: [
      "notificationId", "pseudonymId", "template", "locale", "channel", "discreet",
      "subject", "consentId", "status", "attempt", "sentAt", "createdAt",
      "safetyCritical", "quietHoursOverridden", "consentOverrideBasis", "bodyText",
      "relatedEscalationId",
    ],
  }),

  code("Build clinician alert", {
    pos: [7, 0],
    notes: "The alert carries no answers, only the codes and a link. Minimisation applies to clinicians too.",
    js: js(`
const CFG = $('Vigor config').first().json.vigorConfig;
const s = $('Build escalation').first().json;
return [{ json: {
  to: CFG.oncallEmail,
  severity: s.escalation.severity,
  escalationId: s.escalation.escalationId,
  decisionId: s.escalation.decisionId,
  pseudonymId: s.escalation.pseudonymId,
  redFlags: s.escalation.redFlags,
  reasons: s.escalation.reasons,
  dueAt: s.escalation.dueAt,
  reviewUrl: '/clinician/review/' + s.escalation.decisionId,
} }];
`),
  }),

  http("Notify on-call clinician", {
    pos: [8, 0],
    method: "POST",
    url: "={{ $('Vigor config').first().json.vigorConfig.agentServiceUrl }}/internal/v1/notify-clinician",
    headers: {
      "X-Vigor-Signature": "={{ $('Vigor config').first().json.vigorConfig.internalToken }}",
      "Content-Type": "application/json",
    },
    body: "={{ JSON.stringify($json) }}",
    retry: { tries: 3, waitMs: 3000 },
    onError: "continueRegularOutput",
    notes:
      "Failure here does NOT swallow the escalation: the SLA sweep below will find it " +
      "unacknowledged and raise a breach.",
  }),

  code("Doc · audit escalation", {
    pos: [9, 0],
    js: js(`
const s = $('Build escalation').first().json;
const alert = $('Notify on-call clinician').first().json ?? {};
const alertFailed = Boolean(alert.error) || alert.ok === false;
return [{ json: auditDoc({
  actor: 'workflow:02-red-flag-escalation',
  action: 'ESCALATION_RAISED',
  pseudonymId: s.escalation.pseudonymId,
  subjectRef: { collection: 'escalations', id: s.escalation.escalationId },
  runId: $execution.id,
  outcome: alertFailed ? 'alert_delivery_failed' : 'ok',
  meta: {
    severity: s.escalation.severity,
    redFlags: s.escalation.redFlags,
    slaMinutes: s.escalation.slaMinutes,
    dueAt: s.escalation.dueAt,
  },
}) }];
`),
  }),

  mongoInsert("Write audit · escalation", {
    pos: [10, 0],
    collection: "audit_log",
    fields: ["at", "actor", "action", "pseudonymId", "subjectRef", "consentId", "workflowRunId", "outcome", "meta"],
  }),

  code("Build 202 response", {
    pos: [11, 0],
    js: js(`
const s = $('Build escalation').first().json;
return [{ json: {
  accepted: true,
  escalationId: s.escalation.escalationId,
  severity: s.escalation.severity,
  dueAt: s.escalation.dueAt,
  userGuidance: s.guidance,
  humanOversight: 'An on-call clinician has been alerted and must acknowledge this case.',
} }];
`),
  }),

  respond("Respond 202", { pos: [12, 0], code: 202 }),

  /* ------------------------------------------------------------- SLA sweep */

  schedule("Every 5 min · SLA sweep", {
    cron: "*/5 * * * *",
    pos: [0, 3],
    notes: "The clock that makes the SLA real.",
  }),

  configNode("Vigor config · sweep", { pos: [0.5, 2.2] }),

  mongoFind("Find overdue escalations", {
    pos: [1, 3],
    collection: "escalations",
    // dueAt is stored as an ISO-8601 UTC string, so lexicographic comparison is
    // chronological. That is deliberate: it keeps the query readable in n8n and
    // avoids BSON date coercion inside an expression.
    query:
      "={{ JSON.stringify({ status: 'open', dueAt: { $lt: new Date().toISOString() } }) }}",
    sort: { dueAt: 1 },
    limit: 100,
  }),

  code("Select breaches", {
    pos: [2, 3],
    js: js(`
const rows = $input.all().map((i) => i.json).filter((d) => d && d.escalationId);

if (rows.length === 0) {
  return [{ json: { breachCount: 0, breaches: [] } }];
}

const breaches = rows.map((d) => ({
  escalationId: d.escalationId,
  pseudonymId: d.pseudonymId,
  decisionId: d.decisionId,
  severity: d.severity,
  redFlags: d.redFlags ?? [],
  dueAt: d.dueAt,
  overdueMinutes: Math.round((Date.now() - new Date(d.dueAt).getTime()) / 60000),
}));

return [{ json: { breachCount: breaches.length, breaches } }];
`),
  }),

  ifNode("Any breaches?", {
    pos: [3, 3],
    when: [cond("={{ $json.breachCount }}", "number:gt", 0)],
  }),

  code("Doc · mark breached", {
    pos: [4, 3],
    js: js(`
return $('Select breaches').first().json.breaches.map((b) => ({ json: {
  escalationId: b.escalationId,
  status: 'breached',
  breachedAt: nowIso(),
  overdueMinutes: b.overdueMinutes,
} }));
`),
  }),

  mongoUpdate("Update escalations · breached", {
    pos: [5, 3],
    collection: "escalations",
    updateKey: "escalationId",
    fields: ["status", "breachedAt", "overdueMinutes"],
  }),

  code("Doc · breach notifications", {
    pos: [6, 3],
    js: js(
      NOTIFY_POLICY,
      `
const CFG = $('Vigor config · sweep').first().json.vigorConfig;
return $('Select breaches').first().json.breaches.map((b) => {
  const doc = notificationDoc({
    pseudonymId: b.pseudonymId,
    template: 'escalation_sla_breach',
    locale: 'en',
    channel: 'email',
    consentId: null,
    status: CFG.notifyMode === 'DEMO' ? 'queued' : 'sent',
  });
  return { json: {
    ...doc,
    safetyCritical: true,
    quietHoursOverridden: false,
    consentOverrideBasis: 'vital_interests',
    bodyText: 'Escalation ' + b.escalationId + ' breached its ' + b.severity +
              ' SLA by ' + b.overdueMinutes + ' minutes and is still unacknowledged.',
    relatedEscalationId: b.escalationId,
    recipientRole: 'clinical_lead',
  } };
});
`,
    ),
  }),

  mongoInsert("Write notification · breach", {
    pos: [7, 3],
    collection: "notifications",
    fields: [
      "notificationId", "pseudonymId", "template", "locale", "channel", "discreet",
      "subject", "consentId", "status", "attempt", "sentAt", "createdAt",
      "safetyCritical", "quietHoursOverridden", "consentOverrideBasis", "bodyText",
      "relatedEscalationId", "recipientRole",
    ],
  }),

  code("Doc · audit breaches", {
    pos: [8, 3],
    js: js(`
return $('Select breaches').first().json.breaches.map((b) => ({ json: auditDoc({
  actor: 'workflow:02-red-flag-escalation',
  action: 'ESCALATION_SLA_BREACHED',
  pseudonymId: b.pseudonymId,
  subjectRef: { collection: 'escalations', id: b.escalationId },
  runId: $execution.id,
  outcome: 'breach',
  meta: { severity: b.severity, dueAt: b.dueAt, overdueMinutes: b.overdueMinutes },
}) }));
`),
  }),

  mongoInsert("Write audit · breaches", {
    pos: [9, 3],
    collection: "audit_log",
    fields: ["at", "actor", "action", "pseudonymId", "subjectRef", "consentId", "workflowRunId", "outcome", "meta"],
  }),
];

const edges = [
  ["Webhook triage.red_flag", "Vigor config"],
  ["Vigor config", "Build escalation"],
  ["Build escalation", "Escalation valid?"],
  ["Escalation valid?", "Doc · escalation", 0],
  ["Escalation valid?", "Respond 400 · escalation", 1],
  ["Doc · escalation", "Write escalation"],
  ["Write escalation", "Doc · urgent instructions"],
  ["Doc · urgent instructions", "Write notification · urgent"],
  ["Write notification · urgent", "Build clinician alert"],
  ["Build clinician alert", "Notify on-call clinician"],
  ["Notify on-call clinician", "Doc · audit escalation"],
  ["Doc · audit escalation", "Write audit · escalation"],
  ["Write audit · escalation", "Build 202 response"],
  ["Build 202 response", "Respond 202"],

  ["Every 5 min · SLA sweep", "Vigor config · sweep"],
  ["Vigor config · sweep", "Find overdue escalations"],
  ["Find overdue escalations", "Select breaches"],
  ["Select breaches", "Any breaches?"],
  ["Any breaches?", "Doc · mark breached", 0],
  ["Doc · mark breached", "Update escalations · breached"],
  ["Update escalations · breached", "Doc · breach notifications"],
  ["Doc · breach notifications", "Write notification · breach"],
  ["Write notification · breach", "Doc · audit breaches"],
  ["Doc · audit breaches", "Write audit · breaches"],
];

export default workflow({
  name: "Vigor 02 · Red-flag Escalation & SLA Sweep",
  tags: ["vigor", "clinical-safety", "human-oversight"],
  nodes,
  edges,
});
