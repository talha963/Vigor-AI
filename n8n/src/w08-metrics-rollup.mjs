/**
 * Workflow 08 — daily metrics rollup
 *
 * The "demonstrable value" requirement, as a job that runs every night.
 *
 * It computes the measures the brief actually asks for — completed assessments,
 * time to appropriate evaluation, referral completion, red-flag sensitivity
 * proxies and fairness across population slices — and writes them to
 * `metrics_daily` keyed on the date, so re-running a day is idempotent and the
 * demo can be replayed without polluting the numbers.
 *
 * Two things worth noticing:
 *
 *  - **Fairness is computed as a gap, not a table.** A dashboard full of
 *    per-group numbers lets you avoid the question. `maxCompletionGap` with the
 *    worst-performing slice named is harder to ignore.
 *  - **Degradation is a tracked metric.** `degradedScoreRate` counts assessments
 *    routed by the fallback gate because the risk engine was unavailable. A
 *    system that quietly degrades is worse than one that fails loudly.
 */

import {
  workflow, schedule, webhook, code, ifNode, cond, respond, http, configNode,
  mongoAggregate, mongoFind, mongoUpdate, mongoInsert, sticky,
} from "./lib.mjs";
import { js } from "./shared.mjs";

const STATS = `
const median = (xs) => {
  const v = xs.filter((x) => typeof x === 'number' && !Number.isNaN(x)).sort((a, b) => a - b);
  if (v.length === 0) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : Math.round(((v[mid - 1] + v[mid]) / 2) * 10) / 10;
};

const rate = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 1000 : null);

// Completion rate per slice, plus the gap between best and worst. The gap is the
// number that actually tells you whether the service works for everyone.
const sliceRates = (rows, key) => {
  const acc = {};
  for (const r of rows) {
    const k = r[key] ?? 'unknown';
    acc[k] ??= { started: 0, completed: 0 };
    acc[k].started += 1;
    if (r.completed) acc[k].completed += 1;
  }
  const out = {};
  for (const [k, v] of Object.entries(acc)) {
    out[k] = { started: v.started, completed: v.completed, completionRate: rate(v.completed, v.started) };
  }
  // Only slices with enough volume to mean anything are compared.
  const comparable = Object.entries(out).filter(([, v]) => v.started >= 5 && v.completionRate !== null);
  let gap = null;
  let worst = null;
  if (comparable.length >= 2) {
    const sorted = comparable.sort((a, b) => a[1].completionRate - b[1].completionRate);
    worst = sorted[0][0];
    gap = Math.round((sorted[sorted.length - 1][1].completionRate - sorted[0][1].completionRate) * 1000) / 1000;
  }
  return { bySlice: out, maxCompletionGap: gap, worstSlice: worst, comparableSlices: comparable.length };
};
`;

const nodes = [
  sticky(
    "## 08 · Daily metrics rollup\n" +
      "Runs at 00:30 for the previous day. Keyed on the date, so re-running is idempotent " +
      "and the demo can be replayed.\n\n" +
      "Reports completion, **time to appropriate evaluation**, referral completion, SLA " +
      "performance, and fairness as a **gap** with the worst slice named.\n\n" +
      "`degradedScoreRate` tracks assessments routed by the fallback gate.",
    { pos: [0, -2], width: 560, height: 280, color: 4 },
  ),

  schedule("Daily 00:30 · rollup", {
    cron: "30 0 * * *",
    pos: [0, 0],
    notes:
      "Does not feed the chain directly. Two triggers converging on one node " +
      "deadlocks: n8n waits for every incoming branch to deliver, and whichever " +
      "trigger did not fire never does. So the schedule calls the webhook below, " +
      "exactly as workflow 01 hands off to 02.",
  }),

  configNode("Vigor config · schedule", { pos: [1, 0] }),

  http("Trigger rollup via webhook", {
    pos: [2, 0],
    method: "POST",
    url: "={{ $('Vigor config · schedule').first().json.vigorConfig.webhookBase }}/webhook/vigor/metrics-rollup",
    headers: { "Content-Type": "application/json" },
    // Empty body means "yesterday", which is what the nightly run wants.
    body: "={{ JSON.stringify({}) }}",
    retry: { tries: 3, waitMs: 5000 },
    notes: "The nightly run is just a backfill request for yesterday.",
  }),

  webhook("Webhook metrics.rollup", {
    path: "vigor/metrics-rollup",
    pos: [0, 2.2],
    notes:
      "Backfill. POST {\"date\":\"YYYY-MM-DD\"} to recompute one day, or {} for " +
      "yesterday. Every rollup needs this: a day missed because the container was " +
      "down would otherwise be a permanent hole in the evidence.",
  }),

  code("Compute window", {
    pos: [1, 0],
    notes:
      "Yesterday by default, or an explicit date when called for a backfill. " +
      "Also the metrics document key, which is what makes a re-run idempotent.",
    js: js(`
// GENERIC_TIMEZONE is set on the container, so Date here is already local.
const body = $json.body ?? {};
const viaWebhook = Boolean($json.body);
const requested = typeof body.date === 'string' ? body.date.trim() : null;

let start;
if (requested) {
  // [0-9] rather than \\d on purpose: this source lives inside a template
  // literal, where a single backslash is swallowed before the builder sees it.
  // Character classes avoid the hazard entirely. See build.mjs escape lint.
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(requested);
  if (!m) {
    return [{ json: { ok: false, viaWebhook, error: 'invalid_date',
                      hint: 'Expected YYYY-MM-DD', received: requested } }];
  }
  start = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
} else {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start = new Date(today.getTime() - 24 * 3600 * 1000);
}

// Local midnight to local midnight. Built by arithmetic on the start date
// rather than adding 24h, so a daylight-saving boundary cannot shift the window.
const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);

const pad = (n) => String(n).padStart(2, '0');
const dateKey = start.getFullYear() + '-' + pad(start.getMonth() + 1) + '-' + pad(start.getDate());

return [{ json: {
  ok: true,
  viaWebhook,
  backfill: Boolean(requested),
  dateKey,
  from: start.toISOString(),
  to: end.toISOString(),
  runId: $execution.id,
} }];
`),
  }),

  ifNode("Window valid?", {
    pos: [1.5, 0.9],
    notes:
      "Hard stop on a bad date. An undefined window would be dropped by " +
      "JSON.stringify, so the $gte/$lt match would silently become 'everything' " +
      "and roll the whole dataset up under one wrong date key.",
    when: [cond("={{ $json.ok }}", "boolean:true")],
  }),

  code("Build 400 · bad date", {
    pos: [2, 2],
    js: js(`
const w = $('Compute window').first().json;
return [{ json: { accepted: false, error: w.error, hint: w.hint, received: w.received } }];
`),
  }),

  respond("Respond 400 · rollup", { pos: [3, 2], code: 400 }),

  mongoAggregate("Assessments + subject slices", {
    // Each read below queries by the window, never by its input item, so every
    // one of them must run exactly once. Without this the chain multiplies:
    // 44 assessments -> 44 triage queries -> 1540 risk queries -> ...
    executeOnce: true,
    pos: [2, 0],
    collection: "assessments",
    notes: "The one place a join is needed: age band lives on the subject, not the assessment.",
    pipeline:
      "={{ JSON.stringify([" +
      "{ $match: { startedAt: { $gte: $json.from, $lt: $json.to } } }," +
      "{ $lookup: { from: 'subjects', localField: 'pseudonymId', foreignField: 'pseudonymId', as: 's' } }," +
      "{ $project: { _id: 0, assessmentId: 1, locale: 1, status: 1, durationSec: 1," +
      " answeredItemCount: 1, nudgeCount: 1," +
      " ageBand: { $ifNull: [ { $arrayElemAt: ['$s.ageBand', 0] }, 'unknown' ] }," +
      " emirate: { $ifNull: [ { $arrayElemAt: ['$s.emirate', 0] }, 'unknown' ] } } }," +
      "{ $limit: 5000 }" +
      "]) }}",
  }),

  mongoFind("Triage decisions in window", {
    executeOnce: true,
    pos: [3, 0],
    collection: "triage_decisions",
    query: "={{ JSON.stringify({ createdAt: { $gte: $('Compute window').first().json.from, $lt: $('Compute window').first().json.to } }) }}",
    projection: { _id: 0, tier: 1, redFlags: 1, clamped: 1, status: 1, source: 1, requiresHumanReview: 1, reviewOutcome: 1 },
    limit: 5000,
  }),

  mongoFind("Risk scores in window", {
    executeOnce: true,
    pos: [4, 0],
    collection: "risk_scores",
    query: "={{ JSON.stringify({ computedAt: { $gte: $('Compute window').first().json.from, $lt: $('Compute window').first().json.to } }) }}",
    projection: { _id: 0, degraded: 1, overall: 1, missingInputs: 1 },
    limit: 5000,
  }),

  mongoFind("Escalations in window", {
    executeOnce: true,
    pos: [5, 0],
    collection: "escalations",
    query: "={{ JSON.stringify({ createdAt: { $gte: $('Compute window').first().json.from, $lt: $('Compute window').first().json.to } }) }}",
    projection: { _id: 0, severity: 1, status: 1, createdAt: 1, dueAt: 1, acknowledgedAt: 1, slaMinutes: 1 },
    limit: 2000,
  }),

  mongoFind("Referrals in window", {
    executeOnce: true,
    pos: [6, 0],
    collection: "referrals",
    query: "={{ JSON.stringify({ dispatchedAt: { $gte: $('Compute window').first().json.from, $lt: $('Compute window').first().json.to } }) }}",
    projection: { _id: 0, status: 1, serviceType: 1, tier: 1, daysToEvaluation: 1, dispatchedAt: 1 },
    limit: 2000,
  }),

  mongoFind("Kit orders in window", {
    executeOnce: true,
    pos: [7, 0],
    collection: "kit_orders",
    query: "={{ JSON.stringify({ requestedAt: { $gte: $('Compute window').first().json.from, $lt: $('Compute window').first().json.to } }) }}",
    projection: { _id: 0, status: 1, deliveryMode: 1, remindersSent: 1 },
    limit: 2000,
  }),

  mongoFind("Notifications in window", {
    executeOnce: true,
    pos: [8, 0],
    collection: "notifications",
    query: "={{ JSON.stringify({ createdAt: { $gte: $('Compute window').first().json.from, $lt: $('Compute window').first().json.to } }) }}",
    projection: { _id: 0, template: 1, status: 1, locale: 1, channel: 1 },
    limit: 5000,
  }),

  code("Assemble metrics", {
    pos: [9, 0],
    notes: "All the arithmetic in one readable place, so the numbers can be argued with.",
    js: js(
      STATS,
      `
const w = $('Compute window').first().json;
const rows = (name) => $(name).all().map((i) => i.json).filter((d) => d && Object.keys(d).length > 0);

const assessments = rows('Assessments + subject slices');
const triage = rows('Triage decisions in window');
const scores = rows('Risk scores in window');
const escalations = rows('Escalations in window');
const referrals = rows('Referrals in window');
const kits = rows('Kit orders in window');
const notifications = rows('Notifications in window');

/* ---- assessments ---- */
const started = assessments.length;
const completedRows = assessments.filter((a) => a.status === 'completed');
const completed = completedRows.length;

const sliceRows = assessments.map((a) => ({
  locale: a.locale ?? 'unknown',
  ageBand: a.ageBand ?? 'unknown',
  emirate: a.emirate ?? 'unknown',
  completed: a.status === 'completed',
}));

/* ---- triage ---- */
const tierCounts = triage.reduce((acc, t) => {
  acc[t.tier] = (acc[t.tier] ?? 0) + 1;
  return acc;
}, {});
const redFlagCount = triage.filter((t) => (t.redFlags ?? []).length > 0).length;
const clampedCount = triage.filter((t) => t.clamped === true).length;
const pendingReview = triage.filter((t) => t.status === 'pending_review').length;
const reviewOutcomes = triage.reduce((acc, t) => {
  if (t.reviewOutcome) acc[t.reviewOutcome] = (acc[t.reviewOutcome] ?? 0) + 1;
  return acc;
}, {});

/* ---- escalations & SLA ---- */
const ackMinutes = escalations
  .filter((e) => e.acknowledgedAt)
  .map((e) => (new Date(e.acknowledgedAt).getTime() - new Date(e.createdAt).getTime()) / 60000);
const withinSla = escalations.filter(
  (e) => e.acknowledgedAt && new Date(e.acknowledgedAt).getTime() <= new Date(e.dueAt).getTime()
).length;
const breached = escalations.filter((e) => e.status === 'breached').length;

/* ---- referrals ---- */
const COMPLETED_STATES = new Set(['attended', 'completed']);
const referralsCompleted = referrals.filter((r) => COMPLETED_STATES.has(r.status)).length;
const daysToEval = referrals.map((r) => r.daysToEvaluation).filter((x) => typeof x === 'number');

/* ---- degradation ---- */
const degraded = scores.filter((s) => s.degraded === true).length;
const unscoredSemen = scores.filter((s) => (s.missingInputs ?? []).includes('semen_analysis')).length;

/* ---- outbound discipline ---- */
const nudges = notifications.filter((n) => n.template === 'reengagement_nudge');
const suppressed = notifications.filter((n) => String(n.status ?? '').startsWith('suppressed')).length;

const localeSlices = sliceRates(sliceRows, 'locale');
const ageSlices = sliceRates(sliceRows, 'ageBand');

const doc = {
  // NOT _id. The n8n MongoDB node calls new ObjectId() on whatever updateKey
  // names, so an _id of "2026-10-20" throws BSONError and the node dies before
  // producing output - which leaves a responseNode webhook hanging with no
  // reply at all. dateKey carries the idempotency instead, with a unique
  // index behind it (see tools/mongo-bootstrap.js).
  dateKey: w.dateKey,
  windowFrom: w.from,
  windowTo: w.to,

  assessmentsStarted: started,
  assessmentsCompleted: completed,
  completionRate: rate(completed, started),
  medianDurationSec: median(completedRows.map((a) => a.durationSec)),
  medianAnsweredItems: median(completedRows.map((a) => a.answeredItemCount)),

  tierCounts,
  redFlagCount,
  redFlagRate: rate(redFlagCount, triage.length),
  // How often the deterministic gate had to override the model. A rising number
  // means the model is drifting away from the safety floor.
  safetyClampCount: clampedCount,
  safetyClampRate: rate(clampedCount, triage.length),
  pendingClinicianReview: pendingReview,
  clinicianReviewOutcomes: reviewOutcomes,

  escalationsRaised: escalations.length,
  escalationsAcknowledgedWithinSla: withinSla,
  slaBreaches: breached,
  slaComplianceRate: rate(withinSla, escalations.length),
  medianMinutesToClinicianAck: median(ackMinutes),

  referralsDispatched: referrals.length,
  referralsCompleted,
  referralCompletionRate: rate(referralsCompleted, referrals.length),
  medianDaysToAppropriateEvaluation: median(daysToEval),

  kitsRequested: kits.length,
  kitsReturned: kits.filter((k) => ['returned', 'lab_received', 'resulted'].includes(k.status)).length,
  kitsExpired: kits.filter((k) => k.status === 'expired').length,
  kitDeliveryModeMix: kits.reduce((acc, k) => {
    acc[k.deliveryMode ?? 'unknown'] = (acc[k.deliveryMode ?? 'unknown'] ?? 0) + 1;
    return acc;
  }, {}),

  degradedScoreCount: degraded,
  degradedScoreRate: rate(degraded, scores.length),
  assessmentsAwaitingSemenInput: unscoredSemen,

  nudgesSent: nudges.length,
  notificationsSuppressed: suppressed,

  fairness: {
    byLocale: localeSlices.bySlice,
    localeCompletionGap: localeSlices.maxCompletionGap,
    localeWorstSlice: localeSlices.worstSlice,
    byAgeBand: ageSlices.bySlice,
    ageBandCompletionGap: ageSlices.maxCompletionGap,
    ageBandWorstSlice: ageSlices.worstSlice,
    // A gap this wide is a product failure, not a statistical curiosity.
    gapThreshold: 0.1,
    gapExceeded: Math.max(localeSlices.maxCompletionGap ?? 0, ageSlices.maxCompletionGap ?? 0) > 0.1,
  },

  computedAt: nowIso(),
  computedByRunId: w.runId,
};

return [{ json: doc }];
`,
    ),
  }),

  mongoUpdate("Upsert metrics_daily", {
    pos: [10, 0],
    collection: "metrics_daily",
    updateKey: "dateKey",
    upsert: true,
    fields: [
      "dateKey", "windowFrom", "windowTo", "assessmentsStarted", "assessmentsCompleted",
      "completionRate", "medianDurationSec", "medianAnsweredItems", "tierCounts",
      "redFlagCount", "redFlagRate", "safetyClampCount", "safetyClampRate",
      "pendingClinicianReview", "clinicianReviewOutcomes", "escalationsRaised",
      "escalationsAcknowledgedWithinSla", "slaBreaches", "slaComplianceRate",
      "medianMinutesToClinicianAck", "referralsDispatched", "referralsCompleted",
      "referralCompletionRate", "medianDaysToAppropriateEvaluation", "kitsRequested",
      "kitsReturned", "kitsExpired", "kitDeliveryModeMix", "degradedScoreCount",
      "degradedScoreRate", "assessmentsAwaitingSemenInput", "nudgesSent",
      "notificationsSuppressed", "fairness", "computedAt", "computedByRunId",
    ],
    notes:
      "Keyed on dateKey, so re-running a day overwrites rather than duplicates. " +
      "Not _id: the Mongo node coerces updateKey through new ObjectId().",
  }),

  code("Doc · audit rollup", {
    pos: [11, 0],
    js: js(`
const m = $('Assemble metrics').first().json;
return [{ json: auditDoc({
  actor: 'workflow:08-metrics-rollup',
  action: 'METRICS_ROLLED_UP',
  runId: m.computedByRunId,
  outcome: m.fairness.gapExceeded ? 'fairness_gap_exceeded' : 'ok',
  meta: {
    dateKey: m.dateKey,
    assessmentsCompleted: m.assessmentsCompleted,
    completionRate: m.completionRate,
    slaComplianceRate: m.slaComplianceRate,
    referralCompletionRate: m.referralCompletionRate,
    medianDaysToAppropriateEvaluation: m.medianDaysToAppropriateEvaluation,
    degradedScoreRate: m.degradedScoreRate,
    localeCompletionGap: m.fairness.localeCompletionGap,
    ageBandCompletionGap: m.fairness.ageBandCompletionGap,
  },
}) }];
`),
  }),

  mongoInsert("Write audit · rollup", {
    pos: [12, 0],
    collection: "audit_log",
    fields: ["at", "actor", "action", "pseudonymId", "subjectRef", "consentId", "workflowRunId", "outcome", "meta"],
  }),

  ifNode("Via webhook?", {
    pos: [13, 0],
    notes:
      "respondToWebhook must not run on the scheduled path - there is no request " +
      "to answer, and n8n fails the execution if it tries.",
    when: [cond("={{ $('Compute window').first().json.viaWebhook }}", "boolean:true")],
  }),

  code("Build rollup response", {
    pos: [14, -1],
    js: js(`
const m = $('Assemble metrics').first().json;
return [{ json: {
  accepted: true,
  dateKey: m.dateKey,
  backfill: $('Compute window').first().json.backfill,
  headline: {
    assessmentsStarted: m.assessmentsStarted,
    assessmentsCompleted: m.assessmentsCompleted,
    completionRate: m.completionRate,
    medianDaysToAppropriateEvaluation: m.medianDaysToAppropriateEvaluation,
    referralCompletionRate: m.referralCompletionRate,
    slaComplianceRate: m.slaComplianceRate,
    degradedScoreRate: m.degradedScoreRate,
  },
  tierCounts: m.tierCounts,
  fairness: {
    localeCompletionGap: m.fairness.localeCompletionGap,
    localeWorstSlice: m.fairness.localeWorstSlice,
    ageBandCompletionGap: m.fairness.ageBandCompletionGap,
    ageBandWorstSlice: m.fairness.ageBandWorstSlice,
    gapExceeded: m.fairness.gapExceeded,
  },
} }];
`),
  }),

  respond("Respond 200 · rollup", { pos: [15, -1] }),
];

const edges = [
  ["Daily 00:30 · rollup", "Vigor config · schedule"],
  ["Vigor config · schedule", "Trigger rollup via webhook"],
  ["Webhook metrics.rollup", "Compute window"],
  ["Compute window", "Window valid?"],
  ["Window valid?", "Assessments + subject slices", 0],
  ["Window valid?", "Build 400 · bad date", 1],
  ["Build 400 · bad date", "Respond 400 · rollup"],
  ["Assessments + subject slices", "Triage decisions in window"],
  ["Triage decisions in window", "Risk scores in window"],
  ["Risk scores in window", "Escalations in window"],
  ["Escalations in window", "Referrals in window"],
  ["Referrals in window", "Kit orders in window"],
  ["Kit orders in window", "Notifications in window"],
  ["Notifications in window", "Assemble metrics"],
  ["Assemble metrics", "Upsert metrics_daily"],
  ["Upsert metrics_daily", "Doc · audit rollup"],
  ["Doc · audit rollup", "Write audit · rollup"],
  ["Write audit · rollup", "Via webhook?"],
  ["Via webhook?", "Build rollup response", 0],
  ["Build rollup response", "Respond 200 · rollup"],
];

export default workflow({
  name: "Vigor 08 · Daily Metrics Rollup",
  tags: ["vigor", "evidence", "fairness"],
  nodes,
  edges,
});
