/**
 * Workflow 03 — referral lifecycle
 *
 * Owns referrals from consent to completion.
 *
 *   webhook referral-consent → the user has explicitly agreed to share a risk
 *       summary with a named service. Two gates must both pass before anything
 *       leaves the building: a live SHARE_WITH_* consent, and (where the triage
 *       decision demanded it) a completed clinician review. Only then is a
 *       facility matched, a scoped expiring share token minted, and the referral
 *       dispatched.
 *
 *   webhook referral-status → the facility reports progress using the share
 *       token as its credential. This is what closes the loop on "referral
 *       completion" and "time to appropriate evaluation" as measurable outcomes
 *       rather than aspirations.
 *
 * What is shared is a risk summary — bands, driver codes, red flags — never the
 * raw answers and never the free-text field. The token is scoped, expiring and
 * revocable, and every access increments a counter the user can see.
 */

import {
  workflow, webhook, code, ifNode, cond, respond,
  mongoFind, mongoInsert, mongoUpdate, http, sticky, configNode,
} from "./lib.mjs";
import { js, CONSENT_GATE } from "./shared.mjs";

const SCOPE_FOR_SERVICE = `
// Fertility services get their own consent scope. Sharing reproductive data with
// a fertility clinic is a materially different decision from sharing it with a
// urologist, and the brief asks us not to assume family intent.
const SCOPE_FOR_SERVICE = {
  fertility:    'SHARE_WITH_FERTILITY_SERVICE',
  andrology:    'SHARE_WITH_CLINICIAN',
  urology:      'SHARE_WITH_CLINICIAN',
  primary_care: 'SHARE_WITH_CLINICIAN',
};
`;

const nodes = [
  sticky(
    "## 03 · Referral lifecycle\n" +
      "**Top:** dispatch. Two gates must pass — live `SHARE_WITH_*` consent, and clinician " +
      "review where triage demanded it. Then match a facility, mint a scoped expiring " +
      "share token, dispatch.\n\n" +
      "**Bottom:** the facility reports status back using that token. This is what makes " +
      "referral completion and time-to-evaluation measurable.\n\n" +
      "Shared payload = risk summary only. Never raw answers, never free text.",
    { pos: [0, -2], width: 560, height: 300, color: 5 },
  ),

  /* ------------------------------------------------------------- dispatch */

  webhook("Webhook referral.consented", {
    path: "vigor/referral-consent",
    pos: [0, 0],
  }),

  configNode("Vigor config", { pos: [0.5, -0.8] }),

  code("Validate referral request", {
    pos: [1, 0],
    js: js(
      SCOPE_FOR_SERVICE,
      `
const b = $json.body ?? $json;
const problems = [];
if (!b.pseudonymId) problems.push('missing:pseudonymId');
if (!b.decisionId) problems.push('missing:decisionId');
if (!b.serviceType) problems.push('missing:serviceType');
if (b.serviceType && !SCOPE_FOR_SERVICE[b.serviceType]) problems.push('unsupported:serviceType');

const prefs = b.preferences ?? {};

return [{ json: {
  ok: problems.length === 0,
  problems,
  runId: $execution.id,
  pseudonymId: b.pseudonymId ?? null,
  decisionId: b.decisionId ?? null,
  serviceType: b.serviceType ?? null,
  requiredScope: SCOPE_FOR_SERVICE[b.serviceType] ?? null,
  locale: b.locale === 'ar' ? 'ar' : 'en',
  emirate: b.emirate ?? 'Abu Dhabi',
  preferences: {
    language: prefs.language ?? (b.locale === 'ar' ? 'ar' : 'en'),
    maleClinician: prefs.maleClinician === true,
    teleconsult: prefs.teleconsult === true,
  },
  requestedFacilityId: b.facilityId ?? null,
} }];
`,
    ),
  }),

  ifNode("Request valid?", {
    pos: [2, 0],
    when: [cond("={{ $json.ok }}", "boolean:true")],
  }),

  respond("Respond 400 · referral", { pos: [3, -1], code: 400 }),

  mongoFind("Load consent ledger", {
    pos: [3, 0],
    collection: "consents",
    query: "={{ JSON.stringify({ pseudonymId: $json.pseudonymId }) }}",
    sort: { grantedAt: -1 },
    limit: 50,
  }),

  code("Consent gate · SHARE", {
    pos: [4, 0],
    notes: "The one gate that must never be bypassed. Its refusal is itself auditable.",
    js: js(
      CONSENT_GATE,
      `
const req = $('Validate referral request').first().json;
const docs = $('Load consent ledger').all().map((i) => i.json).filter((d) => d && d.scope);
const verdict = evaluateConsent(docs, req.requiredScope);
return [{ json: { ...req, consent: verdict } }];
`,
    ),
  }),

  ifNode("Share authorised?", {
    pos: [5, 0],
    when: [cond("={{ $json.consent.authorised }}", "boolean:true")],
  }),

  code("Doc · audit share refusal", {
    pos: [6, -2],
    js: js(`
const s = $('Consent gate · SHARE').first().json;
return [{ json: auditDoc({
  actor: 'workflow:03-referral-dispatch',
  action: 'REFERRAL_BLOCKED_NO_CONSENT',
  pseudonymId: s.pseudonymId,
  subjectRef: { collection: 'triage_decisions', id: s.decisionId },
  runId: s.runId,
  outcome: 'refused',
  meta: { requiredScope: s.requiredScope, reason: s.consent.reason, serviceType: s.serviceType },
}) }];
`),
  }),

  mongoInsert("Write audit · share refusal", {
    pos: [7, -2],
    collection: "audit_log",
    fields: ["at", "actor", "action", "pseudonymId", "subjectRef", "consentId", "workflowRunId", "outcome", "meta"],
  }),

  code("Build 403 · no share consent", {
    pos: [8, -2],
    js: js(`
const s = $('Consent gate · SHARE').first().json;
return [{ json: {
  accepted: false,
  error: 'consent_required',
  requiredScope: s.requiredScope,
  reason: s.consent.reason,
  userMessage: s.locale === 'ar'
    ? 'لم تتم مشاركة أي معلومات. نحتاج إلى موافقتك الصريحة أولاً.'
    : 'Nothing was shared. We need your explicit consent first.',
} }];
`),
  }),

  respond("Respond 403 · referral", { pos: [9, -2], code: 403 }),

  mongoFind("Load triage decision", {
    pos: [6, 0],
    collection: "triage_decisions",
    query: "={{ JSON.stringify({ decisionId: $json.decisionId }) }}",
    limit: 1,
  }),

  code("Human-oversight gate", {
    pos: [7, 0],
    notes:
      "A decision flagged for review cannot be dispatched until a clinician has signed " +
      "it off. Workflow 09 releases it.",
    js: js(`
const s = $('Consent gate · SHARE').first().json;
const decision = $('Load triage decision').first().json;

if (!decision || !decision.decisionId) {
  return [{ json: { ...s, reviewOk: false, reviewReason: 'decision_not_found' } }];
}

const needsReview = decision.requiresHumanReview === true;
const reviewed = decision.status === 'final' && Boolean(decision.reviewedAt);
const reviewOk = !needsReview || reviewed;

return [{ json: {
  ...s,
  decision: {
    decisionId: decision.decisionId,
    tier: decision.tier,
    redFlags: decision.redFlags ?? [],
    scoreId: decision.scoreId ?? null,
    assessmentId: decision.assessmentId ?? null,
    requiresHumanReview: needsReview,
    status: decision.status,
  },
  reviewOk,
  reviewReason: reviewOk ? 'ok' : 'awaiting_clinician_review',
} }];
`),
  }),

  ifNode("Review complete?", {
    pos: [8, 0],
    when: [cond("={{ $json.reviewOk }}", "boolean:true")],
  }),

  code("Doc · audit held for review", {
    pos: [9, 2],
    js: js(`
const s = $('Human-oversight gate').first().json;
return [{ json: auditDoc({
  actor: 'workflow:03-referral-dispatch',
  action: 'REFERRAL_HELD_PENDING_REVIEW',
  pseudonymId: s.pseudonymId,
  subjectRef: { collection: 'triage_decisions', id: s.decisionId },
  consentId: s.consent.consentId,
  runId: s.runId,
  outcome: 'held',
  meta: { reason: s.reviewReason, serviceType: s.serviceType },
}) }];
`),
  }),

  mongoInsert("Write audit · held", {
    pos: [10, 2],
    collection: "audit_log",
    fields: ["at", "actor", "action", "pseudonymId", "subjectRef", "consentId", "workflowRunId", "outcome", "meta"],
  }),

  code("Build 202 · held", {
    pos: [11, 2],
    js: js(`
const s = $('Human-oversight gate').first().json;
return [{ json: {
  accepted: true,
  dispatched: false,
  status: 'awaiting_clinician_review',
  userMessage: s.locale === 'ar'
    ? 'شكراً لموافقتك. سيراجع أحد الأطباء نتيجتك قبل إرسال الإحالة، وسنخبرك عند إتمام ذلك.'
    : 'Thank you. A clinician will review your result before the referral is sent, and we will let you know when that is done.',
  humanOversight: 'A clinician must sign off this decision before any data is shared.',
} }];
`),
  }),

  respond("Respond 202 · held", { pos: [12, 2], code: 202 }),

  mongoFind("Match facilities", {
    pos: [9, 0],
    collection: "service_catalogue",
    query:
      "={{ JSON.stringify({ serviceTypes: $json.serviceType, emirate: $json.emirate }) }}",
    limit: 25,
  }),

  code("Select facility & mint token", {
    pos: [10, 0],
    notes:
      "Preference matching is clinical access, not a nicety: language and the " +
      "availability of a male clinician are real barriers for this cohort.",
    js: js(`
const s = $('Human-oversight gate').first().json;
const facilities = $('Match facilities').all().map((i) => i.json).filter((f) => f && f.facilityId);

const scored = facilities.map((f) => {
  let score = 0;
  if (s.requestedFacilityId && f.facilityId === s.requestedFacilityId) score += 100;
  if ((f.languages ?? []).includes(s.preferences.language)) score += 10;
  if (s.preferences.maleClinician && f.maleClinicianAvailable) score += 8;
  if (s.preferences.teleconsult && f.teleconsult) score += 6;
  if (f.acceptsSelfReferral) score += 3;
  score -= Math.min(Number(f.typicalWaitDays ?? 14), 30) / 10;
  return { f, score };
}).sort((a, b) => b.score - a.score);

if (scored.length === 0) {
  return [{ json: { ...s, matched: false, unmatchedReason: 'no_facility_in_catalogue' } }];
}

const chosen = scored[0].f;
const token = newId('shr');
const referralId = newId('ref');

const referral = {
  referralId,
  pseudonymId: s.pseudonymId,
  decisionId: s.decisionId,
  assessmentId: s.decision.assessmentId,
  tier: s.decision.tier,
  serviceType: s.serviceType,
  facility: {
    id: chosen.facilityId,
    name: chosen.name,
    emirate: chosen.emirate,
    teleconsult: Boolean(chosen.teleconsult),
    maleClinicianAvailable: Boolean(chosen.maleClinicianAvailable),
  },
  consentId: s.consent.consentId,
  shareToken: {
    token,
    // Short-lived by default. A facility that needs longer must ask the user again.
    expiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
    scope: ['risk_summary', 'red_flags', 'tier'],
    revokedAt: null,
    accessCount: 0,
  },
  status: 'dispatched',
  dispatchedAt: nowIso(),
  bookedAt: null,
  attendedAt: null,
  completedAt: null,
  statusHistory: [{ status: 'dispatched', at: nowIso(), by: 'workflow:03' }],
  unmatchedAlternatives: scored.slice(1, 4).map((x) => x.f.facilityId),
};

return [{ json: { ...s, matched: true, referral } }];
`),
  }),

  ifNode("Facility matched?", {
    pos: [11, 0],
    when: [cond("={{ $json.matched }}", "boolean:true")],
  }),

  code("Build 409 · no facility", {
    pos: [12, 4],
    js: js(`
const s = $('Select facility & mint token').first().json;
return [{ json: {
  accepted: true,
  dispatched: false,
  status: 'no_matching_service',
  reason: s.unmatchedReason,
  userMessage: s.locale === 'ar'
    ? 'لم نجد خدمة مطابقة في منطقتك الآن. لم تتم مشاركة أي معلومات.'
    : 'We could not find a matching service in your area right now. Nothing was shared.',
} }];
`),
  }),

  respond("Respond 409", { pos: [13, 4], code: 409 }),

  code("Doc · referral", {
    pos: [12, 0],
    js: js(`return [{ json: $('Select facility & mint token').first().json.referral }];`),
  }),

  mongoInsert("Write referral", {
    pos: [13, 0],
    collection: "referrals",
    fields: [
      "referralId", "pseudonymId", "decisionId", "assessmentId", "tier", "serviceType",
      "facility", "consentId", "shareToken", "status", "dispatchedAt", "bookedAt",
      "attendedAt", "completedAt", "statusHistory", "unmatchedAlternatives",
    ],
  }),

  code("Build facility payload", {
    pos: [14, 0],
    notes:
      "Minimisation in practice: bands and codes, no answer values, no free text, " +
      "no contact details. The facility calls back with the token to get more.",
    js: js(`
const s = $('Select facility & mint token').first().json;
const r = s.referral;
return [{ json: {
  referralId: r.referralId,
  facilityId: r.facility.id,
  serviceType: r.serviceType,
  urgency: r.tier === 'URGENT' ? 'urgent' : 'routine',
  riskSummary: {
    tier: r.tier,
    redFlags: s.decision.redFlags,
    scoreRef: s.decision.scoreId,
  },
  patientRef: r.pseudonymId,
  preferences: s.preferences,
  shareToken: r.shareToken.token,
  shareTokenExpiresAt: r.shareToken.expiresAt,
  statusCallbackUrl: '/webhook/vigor/referral-status',
  dataUseNotice: 'Screening summary shared with explicit patient consent. Not a diagnosis.',
} }];
`),
  }),

  http("Dispatch to facility", {
    pos: [15, 0],
    method: "POST",
    url: "={{ $('Vigor config').first().json.vigorConfig.agentServiceUrl }}/internal/v1/dispatch-referral",
    headers: {
      "X-Vigor-Signature": "={{ $('Vigor config').first().json.vigorConfig.internalToken }}",
      "Content-Type": "application/json",
    },
    body: "={{ JSON.stringify($json) }}",
    retry: { tries: 3, waitMs: 3000 },
    onError: "continueRegularOutput",
    notes: "In DEMO mode this is a stub endpoint; the referral row is the source of truth.",
  }),

  code("Doc · notification referral", {
    pos: [16, 0],
    js: js(`
const s = $('Select facility & mint token').first().json;
return [{ json: {
  notificationId: newId('ntf'),
  pseudonymId: s.pseudonymId,
  template: 'referral_dispatched',
  locale: s.locale,
  channel: 'in_app',
  discreet: true,
  subject: s.locale === 'ar' ? 'تحديث من فيجور' : 'Your Vigor update',
  consentId: s.consent.consentId,
  status: 'sent',
  attempt: 1,
  sentAt: nowIso(),
  createdAt: nowIso(),
  bodyText: s.locale === 'ar'
    ? 'تمت مشاركة ملخص المخاطر مع ' + s.referral.facility.name + '. يمكنك إلغاء هذه المشاركة في أي وقت من مركز الخصوصية.'
    : 'Your risk summary was shared with ' + s.referral.facility.name + '. You can revoke this sharing at any time from your privacy centre.',
  relatedReferralId: s.referral.referralId,
} }];
`),
  }),

  mongoInsert("Write notification · referral", {
    pos: [17, 0],
    collection: "notifications",
    fields: [
      "notificationId", "pseudonymId", "template", "locale", "channel", "discreet",
      "subject", "consentId", "status", "attempt", "sentAt", "createdAt", "bodyText",
      "relatedReferralId",
    ],
  }),

  code("Doc · audit referral", {
    pos: [18, 0],
    js: js(`
const s = $('Select facility & mint token').first().json;
const dispatch = $('Dispatch to facility').first().json ?? {};
return [{ json: auditDoc({
  actor: 'workflow:03-referral-dispatch',
  action: 'REFERRAL_DISPATCHED',
  pseudonymId: s.pseudonymId,
  subjectRef: { collection: 'referrals', id: s.referral.referralId },
  consentId: s.consent.consentId,
  runId: s.runId,
  outcome: dispatch.error ? 'delivery_pending' : 'ok',
  meta: {
    facilityId: s.referral.facility.id,
    serviceType: s.serviceType,
    tier: s.decision.tier,
    sharedScope: s.referral.shareToken.scope,
    tokenExpiresAt: s.referral.shareToken.expiresAt,
    consentVersion: s.consent.version,
  },
}) }];
`),
  }),

  mongoInsert("Write audit · referral", {
    pos: [19, 0],
    collection: "audit_log",
    fields: ["at", "actor", "action", "pseudonymId", "subjectRef", "consentId", "workflowRunId", "outcome", "meta"],
  }),

  code("Build 201 · dispatched", {
    pos: [20, 0],
    js: js(`
const s = $('Select facility & mint token').first().json;
return [{ json: {
  accepted: true,
  dispatched: true,
  referralId: s.referral.referralId,
  facility: s.referral.facility,
  sharedScope: s.referral.shareToken.scope,
  shareExpiresAt: s.referral.shareToken.expiresAt,
  revokeHint: 'You can revoke this share at any time; the facility loses access immediately.',
} }];
`),
  }),

  respond("Respond 201", { pos: [21, 0], code: 201 }),

  /* ------------------------------------------------- facility status callback */

  webhook("Webhook referral.status", {
    path: "vigor/referral-status",
    pos: [0, 6],
    notes: "The facility authenticates with the share token it was given.",
  }),

  code("Validate status update", {
    pos: [1, 6],
    js: js(`
const b = $json.body ?? $json;
const ALLOWED = ['accepted', 'booked', 'attended', 'completed', 'declined'];
const problems = [];
if (!b.shareToken) problems.push('missing:shareToken');
if (!b.status) problems.push('missing:status');
if (b.status && !ALLOWED.includes(b.status)) problems.push('unsupported:status');

return [{ json: {
  ok: problems.length === 0,
  problems,
  runId: $execution.id,
  shareToken: b.shareToken ?? null,
  status: b.status ?? null,
  occurredAt: b.occurredAt ?? nowIso(),
  facilityId: b.facilityId ?? null,
} }];
`),
  }),

  mongoFind("Resolve share token", {
    pos: [2, 6],
    collection: "referrals",
    query: "={{ JSON.stringify({ 'shareToken.token': $json.shareToken }) }}",
    limit: 1,
  }),

  code("Authorise token", {
    pos: [3, 6],
    notes: "Revoked or expired tokens are rejected here, which is what makes revocation real.",
    js: js(`
const req = $('Validate status update').first().json;
const ref = $('Resolve share token').first().json;

if (!req.ok) return [{ json: { authorised: false, reason: 'invalid_request', problems: req.problems } }];
if (!ref || !ref.referralId) return [{ json: { authorised: false, reason: 'unknown_token' } }];

const t = ref.shareToken ?? {};
if (t.revokedAt) return [{ json: { authorised: false, reason: 'token_revoked', referralId: ref.referralId } }];
if (t.expiresAt && new Date(t.expiresAt).getTime() < Date.now()) {
  return [{ json: { authorised: false, reason: 'token_expired', referralId: ref.referralId } }];
}
if (req.facilityId && ref.facility && ref.facility.id !== req.facilityId) {
  return [{ json: { authorised: false, reason: 'facility_mismatch', referralId: ref.referralId } }];
}

// Monotonic lifecycle: a facility cannot walk a referral backwards.
const ORDER = { dispatched: 0, accepted: 1, booked: 2, attended: 3, completed: 4 };
const isTerminalDecline = req.status === 'declined';
const forward = isTerminalDecline || (ORDER[req.status] ?? -1) > (ORDER[ref.status] ?? -1);
if (!forward) {
  return [{ json: { authorised: false, reason: 'non_monotonic_transition',
                    referralId: ref.referralId, from: ref.status, to: req.status } }];
}

const stamps = {
  booked: 'bookedAt',
  attended: 'attendedAt',
  completed: 'completedAt',
};

const update = {
  referralId: ref.referralId,
  status: req.status,
  statusHistory: [...(ref.statusHistory ?? []),
                  { status: req.status, at: req.occurredAt, by: 'facility:' + (req.facilityId ?? ref.facility.id) }],
  lastFacilityUpdateAt: nowIso(),
};
if (stamps[req.status]) update[stamps[req.status]] = req.occurredAt;

// Time to appropriate evaluation: the headline outcome measure.
if (req.status === 'attended' || req.status === 'completed') {
  update.daysToEvaluation =
    Math.round(((new Date(req.occurredAt).getTime() - new Date(ref.dispatchedAt).getTime()) / 86400000) * 10) / 10;
}

return [{ json: {
  authorised: true,
  pseudonymId: ref.pseudonymId,
  referralId: ref.referralId,
  from: ref.status,
  to: req.status,
  update,
  runId: req.runId,
} }];
`),
  }),

  ifNode("Token authorised?", {
    pos: [4, 6],
    when: [cond("={{ $json.authorised }}", "boolean:true")],
  }),

  respond("Respond 401", { pos: [5, 7], code: 401 }),

  code("Doc · referral update", {
    pos: [5, 6],
    js: js(`
const u = $('Authorise token').first().json.update;
return [{ json: {
  referralId: u.referralId,
  status: u.status,
  statusHistory: u.statusHistory,
  lastFacilityUpdateAt: u.lastFacilityUpdateAt,
  bookedAt: u.bookedAt ?? null,
  attendedAt: u.attendedAt ?? null,
  completedAt: u.completedAt ?? null,
  daysToEvaluation: u.daysToEvaluation ?? null,
} }];
`),
  }),

  mongoUpdate("Update referral status", {
    pos: [6, 6],
    collection: "referrals",
    updateKey: "referralId",
    fields: [
      "status", "statusHistory", "lastFacilityUpdateAt", "bookedAt", "attendedAt",
      "completedAt", "daysToEvaluation",
    ],
  }),

  code("Doc · audit status", {
    pos: [7, 6],
    js: js(`
const a = $('Authorise token').first().json;
return [{ json: auditDoc({
  actor: 'facility:callback',
  action: 'REFERRAL_STATUS_UPDATED',
  pseudonymId: a.pseudonymId,
  subjectRef: { collection: 'referrals', id: a.referralId },
  runId: a.runId,
  meta: { from: a.from, to: a.to, daysToEvaluation: a.update.daysToEvaluation ?? null },
}) }];
`),
  }),

  mongoInsert("Write audit · status", {
    pos: [8, 6],
    collection: "audit_log",
    fields: ["at", "actor", "action", "pseudonymId", "subjectRef", "consentId", "workflowRunId", "outcome", "meta"],
  }),

  code("Build 200 · status", {
    pos: [9, 6],
    js: js(`
const a = $('Authorise token').first().json;
return [{ json: { accepted: true, referralId: a.referralId, status: a.to } }];
`),
  }),

  respond("Respond 200 · status", { pos: [10, 6] }),
];

const edges = [
  ["Webhook referral.consented", "Vigor config"],
  ["Vigor config", "Validate referral request"],
  ["Validate referral request", "Request valid?"],
  ["Request valid?", "Load consent ledger", 0],
  ["Request valid?", "Respond 400 · referral", 1],
  ["Load consent ledger", "Consent gate · SHARE"],
  ["Consent gate · SHARE", "Share authorised?"],
  ["Share authorised?", "Load triage decision", 0],
  ["Share authorised?", "Doc · audit share refusal", 1],
  ["Doc · audit share refusal", "Write audit · share refusal"],
  ["Write audit · share refusal", "Build 403 · no share consent"],
  ["Build 403 · no share consent", "Respond 403 · referral"],

  ["Load triage decision", "Human-oversight gate"],
  ["Human-oversight gate", "Review complete?"],
  ["Review complete?", "Match facilities", 0],
  ["Review complete?", "Doc · audit held for review", 1],
  ["Doc · audit held for review", "Write audit · held"],
  ["Write audit · held", "Build 202 · held"],
  ["Build 202 · held", "Respond 202 · held"],

  ["Match facilities", "Select facility & mint token"],
  ["Select facility & mint token", "Facility matched?"],
  ["Facility matched?", "Doc · referral", 0],
  ["Facility matched?", "Build 409 · no facility", 1],
  ["Build 409 · no facility", "Respond 409"],

  ["Doc · referral", "Write referral"],
  ["Write referral", "Build facility payload"],
  ["Build facility payload", "Dispatch to facility"],
  ["Dispatch to facility", "Doc · notification referral"],
  ["Doc · notification referral", "Write notification · referral"],
  ["Write notification · referral", "Doc · audit referral"],
  ["Doc · audit referral", "Write audit · referral"],
  ["Write audit · referral", "Build 201 · dispatched"],
  ["Build 201 · dispatched", "Respond 201"],

  ["Webhook referral.status", "Validate status update"],
  ["Validate status update", "Resolve share token"],
  ["Resolve share token", "Authorise token"],
  ["Authorise token", "Token authorised?"],
  ["Token authorised?", "Doc · referral update", 0],
  ["Token authorised?", "Respond 401", 1],
  ["Doc · referral update", "Update referral status"],
  ["Update referral status", "Doc · audit status"],
  ["Doc · audit status", "Write audit · status"],
  ["Write audit · status", "Build 200 · status"],
  ["Build 200 · status", "Respond 200 · status"],
];

export default workflow({
  name: "Vigor 03 · Referral Dispatch & Completion",
  tags: ["vigor", "privacy", "navigation"],
  nodes,
  edges,
});
