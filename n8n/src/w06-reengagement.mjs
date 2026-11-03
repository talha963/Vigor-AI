/**
 * Workflow 06 — re-engagement
 *
 * Roughly one in three men who start a reproductive-health intake never finish
 * it, and the drop-off clusters on the questions that feel most exposing. A
 * single, well-timed, genuinely discreet nudge is the cheapest intervention
 * available for "completed assessments" as an outcome measure.
 *
 * It is also the easiest thing in the whole system to get wrong, so the rules
 * are strict and all in one place:
 *
 *  - CONTACT_REMINDERS consent must be live. No consent, no nudge, ever.
 *  - Quiet hours are respected. A suppressed nudge is logged, not queued.
 *  - At most two nudges per assessment, at least 72 hours apart.
 *  - One opt-out stops everything for that subject, permanently.
 *  - The message never says what the assessment was about.
 *
 * The consent ledger, prior notifications and subject record are joined inside
 * one aggregation, so the sweep makes a single round trip no matter how many
 * assessments are open.
 */

import {
  workflow, schedule, code, ifNode, cond,
  mongoAggregate, mongoInsert, mongoUpdate, sticky, configNode,
} from "./lib.mjs";
import { js, CONSENT_GATE, NOTIFY_POLICY } from "./shared.mjs";

const NUDGE_COPY = `
// Deliberately says nothing about what the assessment covers. Someone else
// reading this over a shoulder learns only that an app has something saved.
const NUDGE_COPY = {
  first: {
    en: 'You have an unfinished check saved. It takes about four minutes to complete, and you can skip any question. Reply STOP to stop these messages.',
    ar: 'لديك فحص غير مكتمل محفوظ. يستغرق إكماله نحو أربع دقائق، ويمكنك تجاوز أي سؤال. أرسل "إيقاف" لإيقاف هذه الرسائل.',
  },
  second: {
    en: 'Your saved check is still there if you want it. We will not message you about it again. Reply STOP to stop all messages.',
    ar: 'الفحص المحفوظ لا يزال متاحاً إن أردت إكماله. لن نرسل لك رسالة أخرى بشأنه. أرسل "إيقاف" لإيقاف جميع الرسائل.',
  },
};
`;

const nodes = [
  sticky(
    "## 06 · Re-engagement\n" +
      "Runs every 2 hours, acts rarely.\n\n" +
      "Hard rules: live `CONTACT_REMINDERS` consent · quiet hours respected · max 2 nudges, " +
      "72h apart · one opt-out is permanent · the message never reveals the topic.\n\n" +
      "Consent ledger, prior nudges and subject record are joined in a single aggregation.",
    { pos: [0, -2], width: 540, height: 280, color: 7 },
  ),

  schedule("Every 2 hours · nudge sweep", { cron: "0 */2 * * *", pos: [0, 0] }),

  configNode("Vigor config", { pos: [0.5, -0.8] }),

  code("Quiet hours check", {
    pos: [1, 0],
    notes: "Checked before the query, so a quiet-hours run costs nothing.",
    js: js(
      NOTIFY_POLICY,
      `
const CFG = $('Vigor config').first().json.vigorConfig;
const start = CFG.quietHoursStart;
const end = CFG.quietHoursEnd;
const blocked = quietHoursBlock(new Date(), start, end);

return [{ json: {
  proceed: !blocked,
  quietHours: { start, end, blocked },
  // 24 hours is long enough that an interrupted session is genuinely abandoned
  // rather than someone who stepped away to find a number.
  abandonedBefore: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  runId: $execution.id,
} }];
`,
    ),
  }),

  ifNode("Outside quiet hours?", {
    pos: [2, 0],
    when: [cond("={{ $json.proceed }}", "boolean:true")],
  }),

  code("Log quiet-hours skip", {
    pos: [3, 2],
    js: js(`
const s = $('Quiet hours check').first().json;
return [{ json: auditDoc({
  actor: 'workflow:06-reengagement',
  action: 'NUDGE_SWEEP_SKIPPED_QUIET_HOURS',
  runId: s.runId,
  outcome: 'skipped',
  meta: { quietHours: s.quietHours },
}) }];
`),
  }),

  mongoInsert("Write audit · quiet skip", {
    pos: [4, 2],
    collection: "audit_log",
    fields: ["at", "actor", "action", "pseudonymId", "subjectRef", "consentId", "workflowRunId", "outcome", "meta"],
  }),

  mongoAggregate("Join abandoned intakes", {
    pos: [3, 0],
    collection: "assessments",
    notes:
      "One round trip: abandoned assessments joined to the consent ledger, prior " +
      "nudges and the subject record.",
    pipeline:
      "={{ JSON.stringify([" +
      "{ $match: { status: 'started', startedAt: { $lt: $json.abandonedBefore }, nudgeStopped: { $ne: true } } }," +
      "{ $sort: { startedAt: 1 } }," +
      "{ $limit: 200 }," +
      "{ $lookup: { from: 'consents', localField: 'pseudonymId', foreignField: 'pseudonymId', as: 'consentDocs' } }," +
      "{ $lookup: { from: 'subjects', localField: 'pseudonymId', foreignField: 'pseudonymId', as: 'subjectDocs' } }," +
      "{ $lookup: { from: 'notifications', let: { p: '$pseudonymId' }, pipeline: [" +
      "{ $match: { $expr: { $eq: ['$pseudonymId', '$$p'] }, template: { $in: ['reengagement_nudge'] } } }," +
      "{ $sort: { createdAt: -1 } }, { $limit: 5 } ], as: 'priorNudges' } }," +
      "{ $project: { _id: 0, assessmentId: 1, pseudonymId: 1, locale: 1, startedAt: 1," +
      " answeredItemCount: 1, nudgeCount: 1, lastNudgeAt: 1, consentDocs: 1, subjectDocs: 1, priorNudges: 1 } }" +
      "]) }}",
  }),

  code("Apply nudge policy", {
    pos: [4, 0],
    notes:
      "Every suppression reason is recorded, which is what lets workflow 08 report " +
      "fairness across locale and age band instead of guessing.",
    js: js(
      CONSENT_GATE,
      NUDGE_COPY,
      `
const MAX_NUDGES = 2;
const MIN_HOURS_BETWEEN = 72;

const rows = $input.all().map((i) => i.json).filter((d) => d && d.assessmentId);
const send = [];
const suppressed = [];

for (const a of rows) {
  const subject = (a.subjectDocs ?? [])[0] ?? {};
  if (subject.erasedAt) { suppressed.push({ a, reason: 'subject_erased' }); continue; }

  const verdict = evaluateConsent(a.consentDocs ?? [], 'CONTACT_REMINDERS');
  if (!verdict.authorised) { suppressed.push({ a, reason: 'no_reminder_consent:' + verdict.reason }); continue; }

  const sentCount = (a.priorNudges ?? []).length;
  if (sentCount >= MAX_NUDGES) { suppressed.push({ a, reason: 'nudge_cap_reached' }); continue; }

  const last = (a.priorNudges ?? [])[0];
  if (last && last.createdAt) {
    const hours = (Date.now() - new Date(last.createdAt).getTime()) / 3600000;
    if (hours < MIN_HOURS_BETWEEN) { suppressed.push({ a, reason: 'too_soon' }); continue; }
  }

  // Someone who answered nothing at all is bounce traffic, not an abandoned
  // assessment, and nudging them is noise.
  if ((a.answeredItemCount ?? 0) < 3) { suppressed.push({ a, reason: 'too_few_answers' }); continue; }

  send.push({
    assessmentId: a.assessmentId,
    pseudonymId: a.pseudonymId,
    locale: a.locale === 'ar' ? 'ar' : 'en',
    ageBand: subject.ageBand ?? 'unknown',
    channel: (subject.contact && subject.contact.preferredChannel) || 'in_app',
    consentId: verdict.consentId,
    nudgeNumber: sentCount + 1,
    answeredItemCount: a.answeredItemCount ?? 0,
  });
}

return [{ json: {
  sendCount: send.length,
  send,
  suppressedCount: suppressed.length,
  // Reasons only, never the rows, so the audit record stays minimised.
  suppressionReasons: suppressed.reduce((acc, s) => {
    const key = s.reason.split(':')[0];
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {}),
  // Fairness watch: if nudges skew hard by locale, the copy or the channel is
  // failing one group and workflow 08 surfaces it.
  localeMix: send.reduce((acc, s) => { acc[s.locale] = (acc[s.locale] ?? 0) + 1; return acc; }, {}),
  runId: $execution.id,
} }];
`,
    ),
  }),

  ifNode("Any nudges to send?", {
    pos: [5, 0],
    when: [cond("={{ $json.sendCount }}", "number:gt", 0)],
  }),

  code("Doc · nudge notifications", {
    pos: [6, 0],
    js: js(
      NUDGE_COPY,
      `
const CFG = $('Vigor config').first().json.vigorConfig;
return $('Apply nudge policy').first().json.send.map((s) => {
  const which = s.nudgeNumber === 1 ? 'first' : 'second';
  return { json: {
    notificationId: newId('ntf'),
    pseudonymId: s.pseudonymId,
    template: 'reengagement_nudge',
    locale: s.locale,
    channel: s.channel,
    discreet: true,
    subject: s.locale === 'ar' ? 'تحديث من فيجور' : 'Your Vigor update',
    consentId: s.consentId,
    status: CFG.notifyMode === 'DEMO' ? 'queued' : 'sent',
    attempt: 1,
    sentAt: CFG.notifyMode === 'DEMO' ? null : nowIso(),
    createdAt: nowIso(),
    bodyText: NUDGE_COPY[which][s.locale] ?? NUDGE_COPY[which].en,
    revealsTopic: false,
    nudgeNumber: s.nudgeNumber,
    relatedAssessmentId: s.assessmentId,
  } };
});
`,
    ),
  }),

  mongoInsert("Write notification · nudges", {
    pos: [7, 0],
    collection: "notifications",
    fields: [
      "notificationId", "pseudonymId", "template", "locale", "channel", "discreet",
      "subject", "consentId", "status", "attempt", "sentAt", "createdAt", "bodyText",
      "revealsTopic", "nudgeNumber", "relatedAssessmentId",
    ],
  }),

  code("Doc · mark nudged", {
    pos: [8, 0],
    js: js(`
return $('Apply nudge policy').first().json.send.map((s) => ({ json: {
  assessmentId: s.assessmentId,
  nudgeCount: s.nudgeNumber,
  lastNudgeAt: nowIso(),
  // The second nudge is the last one. Stop now rather than relying on the cap.
  nudgeStopped: s.nudgeNumber >= 2,
} }));
`),
  }),

  mongoUpdate("Update assessments · nudged", {
    pos: [9, 0],
    collection: "assessments",
    updateKey: "assessmentId",
    fields: ["nudgeCount", "lastNudgeAt", "nudgeStopped"],
  }),

  code("Doc · audit nudge sweep", {
    pos: [10, 0],
    js: js(`
const p = $('Apply nudge policy').first().json;
return [{ json: auditDoc({
  actor: 'workflow:06-reengagement',
  action: 'NUDGE_SWEEP_COMPLETED',
  runId: p.runId,
  meta: {
    sent: p.sendCount,
    suppressed: p.suppressedCount,
    suppressionReasons: p.suppressionReasons,
    localeMix: p.localeMix,
  },
}) }];
`),
  }),

  mongoInsert("Write audit · nudge sweep", {
    pos: [11, 0],
    collection: "audit_log",
    fields: ["at", "actor", "action", "pseudonymId", "subjectRef", "consentId", "workflowRunId", "outcome", "meta"],
  }),
];

const edges = [
  ["Every 2 hours · nudge sweep", "Vigor config"],
  ["Vigor config", "Quiet hours check"],
  ["Quiet hours check", "Outside quiet hours?"],
  ["Outside quiet hours?", "Join abandoned intakes", 0],
  ["Outside quiet hours?", "Log quiet-hours skip", 1],
  ["Log quiet-hours skip", "Write audit · quiet skip"],

  ["Join abandoned intakes", "Apply nudge policy"],
  ["Apply nudge policy", "Any nudges to send?"],
  ["Any nudges to send?", "Doc · nudge notifications", 0],
  ["Any nudges to send?", "Doc · audit nudge sweep", 1],
  ["Doc · nudge notifications", "Write notification · nudges"],
  ["Write notification · nudges", "Doc · mark nudged"],
  ["Doc · mark nudged", "Update assessments · nudged"],
  ["Update assessments · nudged", "Doc · audit nudge sweep"],
  ["Doc · audit nudge sweep", "Write audit · nudge sweep"],
];

export default workflow({
  name: "Vigor 06 · Re-engagement Nudge",
  tags: ["vigor", "engagement", "privacy"],
  nodes,
  edges,
});
