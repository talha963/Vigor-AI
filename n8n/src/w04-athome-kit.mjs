/**
 * Workflow 04 — at-home semen collection kit
 *
 * The single biggest friction point in male reproductive assessment is being
 * asked to produce a sample in a clinic. This workflow removes it.
 *
 *   webhook  → order a kit, with discreet packaging, bilingual instructions and
 *              the abstinence window the lab needs for a valid result
 *   schedule → chase kits that went out and never came back, then expire the
 *              ones that are past the point of being clinically useful
 *
 * Reminder consent is captured at order time and stamped onto the kit order, so
 * the daily sweep never has to re-read the consent ledger per row. Revocation
 * still works: workflow 07 sets `remindersStopped` on every open kit order, and
 * the sweep query excludes those.
 */

import {
  workflow, webhook, schedule, code, ifNode, cond, respond,
  mongoFind, mongoInsert, mongoUpdate, http, sticky, configNode,
} from "./lib.mjs";
import { js, CONSENT_GATE } from "./shared.mjs";

const KIT_INSTRUCTIONS = `
const ABSTINENCE_HOURS = 48;  // WHO guidance: 2 to 7 days before collection

const KIT_INSTRUCTIONS = {
  en: [
    'The kit arrives in plain packaging with no clinical markings and no sender name.',
    'Avoid ejaculation for ' + ABSTINENCE_HOURS + ' hours before you collect the sample.',
    'Collect the whole sample into the container provided.',
    'Write the collection time on the label. The lab needs it to interpret the result.',
    'Book the return pickup within 1 hour of collection, or follow the cold-pack instructions.',
    'A single result is not a diagnosis. If anything is outside the usual range we will ask for a repeat sample.',
  ],
  ar: [
    'تصل العينة في عبوة عادية بدون أي علامات طبية وبدون اسم المُرسل.',
    'يرجى الامتناع عن القذف لمدة ' + ABSTINENCE_HOURS + ' ساعة قبل جمع العينة.',
    'اجمع العينة كاملة في الوعاء المرفق.',
    'اكتب وقت الجمع على الملصق، فالمختبر يحتاجه لتفسير النتيجة.',
    'احجز موعد الاستلام خلال ساعة واحدة من الجمع، أو اتبع تعليمات حفظ العينة مبرّدة.',
    'نتيجة واحدة لا تعني تشخيصاً. إذا كانت أي قيمة خارج النطاق المعتاد سنطلب عينة أخرى للتأكد.',
  ],
};
`;

const nodes = [
  sticky(
    "## 04 · At-home collection kit\n" +
      "The main access barrier this project removes.\n\n" +
      "**Top:** order a kit. Discreet packaging is not optional, and the abstinence " +
      "window ships with it so the sample is actually usable.\n\n" +
      "**Bottom:** daily chase for kits that never came back, then expiry. " +
      "Revocation stops reminders via `remindersStopped`.",
    { pos: [0, -2], width: 520, height: 260, color: 6 },
  ),

  /* ------------------------------------------------------------ order a kit */

  webhook("Webhook kit.requested", { path: "vigor/kit-request", pos: [0, 0] }),

  configNode("Vigor config", { pos: [0.5, -0.8] }),

  code("Validate kit request", {
    pos: [1, 0],
    js: js(`
const b = $json.body ?? $json;
const problems = [];
if (!b.pseudonymId) problems.push('missing:pseudonymId');
if (!b.deliveryWindow) problems.push('missing:deliveryWindow');

return [{ json: {
  ok: problems.length === 0,
  problems,
  runId: $execution.id,
  pseudonymId: b.pseudonymId ?? null,
  assessmentId: b.assessmentId ?? null,
  locale: b.locale === 'ar' ? 'ar' : 'en',
  deliveryWindow: b.deliveryWindow ?? null,
  // A locker or pickup point is often the least exposing option, so it is a
  // first-class choice rather than a fallback.
  deliveryMode: ['home', 'locker', 'pickup_point'].includes(b.deliveryMode)
    ? b.deliveryMode : 'locker',
  dropPointRef: b.dropPointRef ?? null,
} }];
`),
  }),

  ifNode("Kit request valid?", {
    pos: [2, 0],
    when: [cond("={{ $json.ok }}", "boolean:true")],
  }),

  respond("Respond 400 · kit", { pos: [3, -1], code: 400 }),

  mongoFind("Load consent ledger", {
    pos: [3, 0],
    collection: "consents",
    query: "={{ JSON.stringify({ pseudonymId: $json.pseudonymId }) }}",
    sort: { grantedAt: -1 },
    limit: 50,
  }),

  code("Consent gate · AT_HOME_TESTING", {
    pos: [4, 0],
    js: js(
      CONSENT_GATE,
      `
const req = $('Validate kit request').first().json;
const docs = $('Load consent ledger').all().map((i) => i.json).filter((d) => d && d.scope);

const testing = evaluateConsent(docs, 'AT_HOME_TESTING');
const storing = evaluateConsent(docs, 'STORE_RESULTS');
// Reminders are optional and asked separately. No reminder consent simply means
// a quieter experience, not a blocked order.
const reminders = evaluateConsent(docs, 'CONTACT_REMINDERS');

return [{ json: {
  ...req,
  consent: {
    authorised: testing.authorised && storing.authorised,
    reason: !testing.authorised ? 'at_home_testing:' + testing.reason
          : !storing.authorised ? 'store_results:' + storing.reason
          : 'consent_live',
    testingConsentId: testing.consentId,
    storeConsentId: storing.consentId,
    reminderConsentId: reminders.authorised ? reminders.consentId : null,
  },
} }];
`,
    ),
  }),

  ifNode("Kit consent authorised?", {
    pos: [5, 0],
    when: [cond("={{ $json.consent.authorised }}", "boolean:true")],
  }),

  code("Build 403 · kit", {
    pos: [6, 2],
    js: js(`
const s = $('Consent gate · AT_HOME_TESTING').first().json;
return [{ json: {
  accepted: false,
  error: 'consent_required',
  requiredScopes: ['AT_HOME_TESTING', 'STORE_RESULTS'],
  reason: s.consent.reason,
} }];
`),
  }),

  respond("Respond 403 · kit", { pos: [7, 2], code: 403 }),

  code("Build kit order", {
    pos: [6, 0],
    js: js(
      KIT_INSTRUCTIONS,
      `
const s = $('Consent gate · AT_HOME_TESTING').first().json;

const kitOrder = {
  kitOrderId: newId('kit'),
  pseudonymId: s.pseudonymId,
  assessmentId: s.assessmentId,
  status: 'requested',
  discreetPackaging: true,
  deliveryMode: s.deliveryMode,
  dropPointRef: s.dropPointRef,
  deliveryWindow: s.deliveryWindow,
  carrier: null,
  trackingRef: null,
  abstinenceWindowHours: ABSTINENCE_HOURS,
  locale: s.locale,
  testingConsentId: s.consent.testingConsentId,
  storeConsentId: s.consent.storeConsentId,
  reminderConsentId: s.consent.reminderConsentId,
  remindersStopped: s.consent.reminderConsentId ? false : true,
  remindersSent: 0,
  lastReminderAt: null,
  requestedAt: nowIso(),
  dispatchedAt: null,
  returnedAt: null,
  expiresAt: new Date(Date.now() + 21 * 24 * 3600 * 1000).toISOString(),
  labRef: null,
};

return [{ json: { ...s, kitOrder, instructions: KIT_INSTRUCTIONS[s.locale] } }];
`,
    ),
  }),

  code("Doc · kit order", {
    pos: [7, 0],
    js: js(`return [{ json: $('Build kit order').first().json.kitOrder }];`),
  }),

  mongoInsert("Write kit order", {
    pos: [8, 0],
    collection: "kit_orders",
    fields: [
      "kitOrderId", "pseudonymId", "assessmentId", "status", "discreetPackaging",
      "deliveryMode", "dropPointRef", "deliveryWindow", "carrier", "trackingRef",
      "abstinenceWindowHours", "locale", "testingConsentId", "storeConsentId",
      "reminderConsentId", "remindersStopped", "remindersSent", "lastReminderAt",
      "requestedAt", "dispatchedAt", "returnedAt", "expiresAt", "labRef",
    ],
  }),

  http("Book courier", {
    pos: [9, 0],
    method: "POST",
    url: "={{ $('Vigor config').first().json.vigorConfig.agentServiceUrl }}/internal/v1/logistics/book",
    headers: {
      "X-Vigor-Signature": "={{ $('Vigor config').first().json.vigorConfig.internalToken }}",
      "Content-Type": "application/json",
    },
    body:
      "={{ JSON.stringify({ kitOrderId: $json.kitOrderId, deliveryMode: $('Build kit order').first().json.kitOrder.deliveryMode, deliveryWindow: $('Build kit order').first().json.kitOrder.deliveryWindow, dropPointRef: $('Build kit order').first().json.kitOrder.dropPointRef, discreetPackaging: true }) }}",
    retry: { tries: 3, waitMs: 3000 },
    onError: "continueRegularOutput",
  }),

  code("Doc · confirm dispatch", {
    pos: [10, 0],
    js: js(`
const s = $('Build kit order').first().json;
const booking = $('Book courier').first().json ?? {};
const booked = Boolean(booking.trackingRef);

return [{ json: {
  kitOrderId: s.kitOrder.kitOrderId,
  status: booked ? 'dispatched' : 'requested',
  carrier: booking.carrier ?? null,
  trackingRef: booking.trackingRef ?? null,
  dispatchedAt: booked ? nowIso() : null,
} }];
`),
  }),

  mongoUpdate("Update kit order · dispatch", {
    pos: [11, 0],
    collection: "kit_orders",
    updateKey: "kitOrderId",
    fields: ["status", "carrier", "trackingRef", "dispatchedAt"],
  }),

  code("Doc · notification kit", {
    pos: [12, 0],
    js: js(`
const s = $('Build kit order').first().json;
return [{ json: {
  notificationId: newId('ntf'),
  pseudonymId: s.pseudonymId,
  template: 'kit_dispatched',
  locale: s.locale,
  channel: 'in_app',
  discreet: true,
  subject: s.locale === 'ar' ? 'تحديث من فيجور' : 'Your Vigor update',
  consentId: s.consent.testingConsentId,
  status: 'sent',
  attempt: 1,
  sentAt: nowIso(),
  createdAt: nowIso(),
  bodyText: s.instructions.join(' '),
  relatedKitOrderId: s.kitOrder.kitOrderId,
} }];
`),
  }),

  mongoInsert("Write notification · kit", {
    pos: [13, 0],
    collection: "notifications",
    fields: [
      "notificationId", "pseudonymId", "template", "locale", "channel", "discreet",
      "subject", "consentId", "status", "attempt", "sentAt", "createdAt", "bodyText",
      "relatedKitOrderId",
    ],
  }),

  code("Doc · audit kit", {
    pos: [14, 0],
    js: js(`
const s = $('Build kit order').first().json;
return [{ json: auditDoc({
  actor: 'workflow:04-athome-kit',
  action: 'KIT_ORDERED',
  pseudonymId: s.pseudonymId,
  subjectRef: { collection: 'kit_orders', id: s.kitOrder.kitOrderId },
  consentId: s.consent.testingConsentId,
  runId: s.runId,
  meta: { deliveryMode: s.kitOrder.deliveryMode, discreetPackaging: true },
}) }];
`),
  }),

  mongoInsert("Write audit · kit", {
    pos: [15, 0],
    collection: "audit_log",
    fields: ["at", "actor", "action", "pseudonymId", "subjectRef", "consentId", "workflowRunId", "outcome", "meta"],
  }),

  code("Build 201 · kit", {
    pos: [16, 0],
    js: js(`
const s = $('Build kit order').first().json;
const d = $('Doc · confirm dispatch').first().json;
return [{ json: {
  accepted: true,
  kitOrderId: s.kitOrder.kitOrderId,
  status: d.status,
  trackingRef: d.trackingRef,
  deliveryMode: s.kitOrder.deliveryMode,
  discreetPackaging: true,
  abstinenceWindowHours: s.kitOrder.abstinenceWindowHours,
  instructions: s.instructions,
} }];
`),
  }),

  respond("Respond 201 · kit", { pos: [17, 0], code: 201 }),

  /* --------------------------------------------------------- chase & expire */

  schedule("Daily 09:00 · kit sweep", { cron: "0 9 * * *", pos: [0, 4] }),

  mongoFind("Find open kit orders", {
    pos: [1, 4],
    collection: "kit_orders",
    query:
      "={{ JSON.stringify({ status: { $in: ['requested','dispatched','delivered'] }, remindersStopped: { $ne: true } }) }}",
    limit: 500,
  }),

  code("Classify kit orders", {
    pos: [2, 4],
    notes: "Expire first, then chase. An expired kit is never chased.",
    js: js(`
const MAX_REMINDERS = 2;
const CHASE_AFTER_DAYS = 5;

const rows = $input.all().map((i) => i.json).filter((d) => d && d.kitOrderId);
const now = Date.now();
const actions = [];

for (const k of rows) {
  const expired = k.expiresAt && new Date(k.expiresAt).getTime() < now;
  if (expired) {
    actions.push({ kind: 'expire', kitOrderId: k.kitOrderId, pseudonymId: k.pseudonymId,
                   locale: k.locale ?? 'en', remindersSent: k.remindersSent ?? 0 });
    continue;
  }
  const since = new Date(k.dispatchedAt ?? k.requestedAt).getTime();
  const days = (now - since) / 86400000;
  const sent = k.remindersSent ?? 0;
  const lastAt = k.lastReminderAt ? new Date(k.lastReminderAt).getTime() : 0;
  const daysSinceLast = (now - lastAt) / 86400000;

  if (days >= CHASE_AFTER_DAYS && sent < MAX_REMINDERS && daysSinceLast >= 4) {
    actions.push({ kind: 'remind', kitOrderId: k.kitOrderId, pseudonymId: k.pseudonymId,
                   locale: k.locale ?? 'en', status: k.status,
                   reminderConsentId: k.reminderConsentId ?? null,
                   remindersSent: sent, daysOut: Math.round(days) });
  }
}

return [{ json: { actionCount: actions.length, actions } }];
`),
  }),

  ifNode("Any kit actions?", {
    pos: [3, 4],
    when: [cond("={{ $json.actionCount }}", "number:gt", 0)],
  }),

  code("Doc · kit sweep updates", {
    pos: [4, 4],
    js: js(`
return $('Classify kit orders').first().json.actions.map((a) => ({ json: {
  kitOrderId: a.kitOrderId,
  status: a.kind === 'expire' ? 'expired' : a.status,
  remindersSent: a.kind === 'remind' ? a.remindersSent + 1 : a.remindersSent,
  lastReminderAt: a.kind === 'remind' ? nowIso() : null,
  remindersStopped: a.kind === 'expire' ? true : false,
} }));
`),
  }),

  mongoUpdate("Update kit orders · sweep", {
    pos: [5, 4],
    collection: "kit_orders",
    updateKey: "kitOrderId",
    fields: ["status", "remindersSent", "lastReminderAt", "remindersStopped"],
  }),

  code("Doc · kit sweep notifications", {
    pos: [6, 4],
    js: js(`
const TEXT = {
  remind: {
    en: 'Your collection kit is still with you. Returning it within the next few days keeps the sample usable. Reply STOP to stop these reminders.',
    ar: 'لا تزال عينة الجمع معك. إعادتها خلال الأيام القادمة تحافظ على صلاحية العينة. أرسل "إيقاف" لإلغاء هذه التذكيرات.',
  },
  expire: {
    en: 'Your collection kit has expired. You can request a new one whenever you are ready, at no cost.',
    ar: 'انتهت صلاحية عينة الجمع. يمكنك طلب واحدة جديدة في أي وقت تكون مستعداً، دون أي تكلفة.',
  },
};

return $('Classify kit orders').first().json.actions.map((a) => ({ json: {
  notificationId: newId('ntf'),
  pseudonymId: a.pseudonymId,
  template: a.kind === 'expire' ? 'kit_expired' : 'kit_return_reminder',
  locale: a.locale,
  channel: 'in_app',
  discreet: true,
  subject: a.locale === 'ar' ? 'تحديث من فيجور' : 'Your Vigor update',
  consentId: a.reminderConsentId ?? null,
  status: 'sent',
  attempt: 1,
  sentAt: nowIso(),
  createdAt: nowIso(),
  bodyText: TEXT[a.kind][a.locale] ?? TEXT[a.kind].en,
  relatedKitOrderId: a.kitOrderId,
} }));
`),
  }),

  mongoInsert("Write notification · kit sweep", {
    pos: [7, 4],
    collection: "notifications",
    fields: [
      "notificationId", "pseudonymId", "template", "locale", "channel", "discreet",
      "subject", "consentId", "status", "attempt", "sentAt", "createdAt", "bodyText",
      "relatedKitOrderId",
    ],
  }),

  code("Doc · audit kit sweep", {
    pos: [8, 4],
    js: js(`
return $('Classify kit orders').first().json.actions.map((a) => ({ json: auditDoc({
  actor: 'workflow:04-athome-kit',
  action: a.kind === 'expire' ? 'KIT_EXPIRED' : 'KIT_REMINDER_SENT',
  pseudonymId: a.pseudonymId,
  subjectRef: { collection: 'kit_orders', id: a.kitOrderId },
  consentId: a.reminderConsentId ?? null,
  runId: $execution.id,
  meta: { daysOut: a.daysOut ?? null, reminderNumber: a.kind === 'remind' ? a.remindersSent + 1 : null },
}) }));
`),
  }),

  mongoInsert("Write audit · kit sweep", {
    pos: [9, 4],
    collection: "audit_log",
    fields: ["at", "actor", "action", "pseudonymId", "subjectRef", "consentId", "workflowRunId", "outcome", "meta"],
  }),
];

const edges = [
  ["Webhook kit.requested", "Vigor config"],
  ["Vigor config", "Validate kit request"],
  ["Validate kit request", "Kit request valid?"],
  ["Kit request valid?", "Load consent ledger", 0],
  ["Kit request valid?", "Respond 400 · kit", 1],
  ["Load consent ledger", "Consent gate · AT_HOME_TESTING"],
  ["Consent gate · AT_HOME_TESTING", "Kit consent authorised?"],
  ["Kit consent authorised?", "Build kit order", 0],
  ["Kit consent authorised?", "Build 403 · kit", 1],
  ["Build 403 · kit", "Respond 403 · kit"],

  ["Build kit order", "Doc · kit order"],
  ["Doc · kit order", "Write kit order"],
  ["Write kit order", "Book courier"],
  ["Book courier", "Doc · confirm dispatch"],
  ["Doc · confirm dispatch", "Update kit order · dispatch"],
  ["Update kit order · dispatch", "Doc · notification kit"],
  ["Doc · notification kit", "Write notification · kit"],
  ["Write notification · kit", "Doc · audit kit"],
  ["Doc · audit kit", "Write audit · kit"],
  ["Write audit · kit", "Build 201 · kit"],
  ["Build 201 · kit", "Respond 201 · kit"],

  ["Daily 09:00 · kit sweep", "Find open kit orders"],
  ["Find open kit orders", "Classify kit orders"],
  ["Classify kit orders", "Any kit actions?"],
  ["Any kit actions?", "Doc · kit sweep updates", 0],
  ["Doc · kit sweep updates", "Update kit orders · sweep"],
  ["Update kit orders · sweep", "Doc · kit sweep notifications"],
  ["Doc · kit sweep notifications", "Write notification · kit sweep"],
  ["Write notification · kit sweep", "Doc · audit kit sweep"],
  ["Doc · audit kit sweep", "Write audit · kit sweep"],
];

export default workflow({
  name: "Vigor 04 · At-home Kit Logistics",
  tags: ["vigor", "access", "logistics"],
  nodes,
  edges,
});
