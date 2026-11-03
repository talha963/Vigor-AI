/**
 * Clinical and privacy logic shared across workflows.
 *
 * These are JavaScript source fragments injected into n8n Code nodes. They live
 * here, in one place, because they are the parts a clinical reviewer needs to
 * read: the red-flag gate, the consent gate and the audit writer. Duplicating
 * them inside nine workflow files would make them impossible to review.
 *
 * IMPORTANT: the authoritative implementation of risk scoring and triage is the
 * Python engine in `services/agents`. What lives here is (a) the privacy and
 * audit plumbing, which genuinely belongs to orchestration, and (b) a *fallback*
 * red-flag gate so that a safety-critical signal is never lost if the agent
 * service is unreachable. The fallback may only escalate, never de-escalate.
 */

/** Helper functions prepended to every Code node that needs them. */
export const PRELUDE = `
// ---- Vigor shared helpers (generated, see n8n/src/shared.mjs) --------------
const nowIso = () => new Date().toISOString();

const newId = (prefix) => {
  const rand = Array.from({ length: 12 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
  ).join('');
  return prefix + '_' + rand;
};

// Acuity ranking. Used only to clamp a decision upward; nothing may move down.
const TIER_ACUITY = {
  SELF_CARE: 0,
  PRIMARY_CARE: 1,
  FERTILITY_SERVICES: 2,
  ANDROLOGY_UROLOGY: 3,
  URGENT: 4,
};

const escalateOnly = (current, proposed) =>
  (TIER_ACUITY[proposed] ?? -1) > (TIER_ACUITY[current] ?? -1) ? proposed : current;

const auditDoc = (ctx) => ({
  at: nowIso(),
  actor: ctx.actor,
  action: ctx.action,
  pseudonymId: ctx.pseudonymId ?? null,
  subjectRef: ctx.subjectRef ?? null,
  consentId: ctx.consentId ?? null,
  workflowRunId: ctx.runId ?? null,
  outcome: ctx.outcome ?? 'ok',
  meta: ctx.meta ?? {},
});

// Discreet by default: nothing clinical ever appears in a subject line or preview.
const DISCREET_SUBJECT = {
  en: 'Your Vigor update',
  ar: 'تحديث من فيجور',
};
// ---------------------------------------------------------------------------
`;

/**
 * Deterministic red-flag gate.
 *
 * Every code here is a presentation that must not wait behind a routine
 * assessment. Thresholds and groupings follow standard urology/andrology
 * urgency practice; the exact catalogue is reviewed in docs/06-clinical-safety.md
 * and is intended to be signed off by a clinician before any real use.
 */
export const RED_FLAG_GATE = `
const RED_FLAGS = [
  { code: 'RF_ACUTE_SCROTAL_PAIN', severity: 'URGENT',
    test: (a) => (a.symptoms || []).includes('acute_scrotal_pain')
                 || ((a.symptoms || []).includes('scrotal_swelling') && a.painOnsetHours != null && a.painOnsetHours <= 6),
    reason: 'Acute scrotal pain or swelling of sudden onset. Testicular torsion must be excluded within hours.' },

  { code: 'RF_TESTICULAR_MASS', severity: 'URGENT',
    test: (a) => (a.symptoms || []).includes('testicular_lump'),
    reason: 'A testicular lump requires urgent assessment to exclude malignancy.' },

  { code: 'RF_PRIAPISM', severity: 'URGENT',
    test: (a) => (a.symptoms || []).includes('prolonged_erection'),
    reason: 'A prolonged painful erection is an emergency.' },

  { code: 'RF_GU_TRAUMA', severity: 'URGENT',
    test: (a) => (a.symptoms || []).includes('recent_genital_trauma'),
    reason: 'Recent significant genital trauma requires immediate assessment.' },

  { code: 'RF_ACUTE_URINARY_RETENTION', severity: 'URGENT',
    test: (a) => (a.symptoms || []).includes('cannot_pass_urine'),
    reason: 'Inability to pass urine requires immediate assessment.' },

  { code: 'RF_FEBRILE_GU_INFECTION', severity: 'SAME_DAY',
    test: (a) => (a.symptoms || []).includes('fever')
                 && ((a.symptoms || []).includes('dysuria')
                     || (a.symptoms || []).includes('urethral_discharge')
                     || (a.symptoms || []).includes('scrotal_ache')),
    reason: 'Fever with urinary or genital symptoms suggests infection needing same-day care.' },

  { code: 'RF_PITUITARY_SUSPICION', severity: 'SAME_DAY',
    test: (a) => (a.symptoms || []).includes('visual_field_loss')
                 && ((a.symptoms || []).includes('gynaecomastia') || a.libidoChange === 'absent'),
    reason: 'Visual change with endocrine symptoms raises the possibility of a pituitary lesion.' },

  { code: 'RF_BILATERAL_UNDESCENDED', severity: 'ROUTINE_REVIEW',
    test: (a) => a.undescendedTestis === 'bilateral_uncorrected',
    reason: 'Uncorrected bilateral undescended testes need specialist review.' },

  { code: 'RF_ABSENT_VAS', severity: 'ROUTINE_REVIEW',
    test: (a) => a.absentVas === true,
    reason: 'Absent vas deferens warrants genetic counselling and specialist review.' },
];

const SEVERITY_SLA_MINUTES = { URGENT: 60, SAME_DAY: 480, ROUTINE_REVIEW: 2880 };
const SEVERITY_TIER = {
  URGENT: 'URGENT',
  SAME_DAY: 'URGENT',
  ROUTINE_REVIEW: 'ANDROLOGY_UROLOGY',
};

function runRedFlagGate(answers) {
  const a = answers || {};
  const hits = RED_FLAGS.filter((f) => {
    try { return f.test(a); } catch (e) { return false; }
  });
  if (hits.length === 0) {
    return { redFlags: [], severity: null, minimumTier: null, reasons: [] };
  }
  const order = ['URGENT', 'SAME_DAY', 'ROUTINE_REVIEW'];
  const severity = order.find((s) => hits.some((h) => h.severity === s));
  return {
    redFlags: hits.map((h) => h.code),
    severity,
    slaMinutes: SEVERITY_SLA_MINUTES[severity],
    minimumTier: SEVERITY_TIER[severity],
    reasons: hits.map((h) => ({ code: h.code, severity: h.severity, reason: h.reason })),
  };
}
`;

/**
 * Consent gate. Takes the documents returned by a find on `consents` and decides
 * whether a given scope is currently authorised. Expiry, revocation and
 * supersession all count as "not authorised".
 */
export const CONSENT_GATE = `
function evaluateConsent(consentDocs, requiredScope) {
  const now = Date.now();
  const superseded = new Set(
    (consentDocs || []).map((c) => c.supersedes).filter(Boolean)
  );
  const live = (consentDocs || [])
    .filter((c) => c.scope === requiredScope)
    .filter((c) => c.granted === true)
    .filter((c) => !c.revokedAt)
    .filter((c) => !superseded.has(c.consentId))
    .filter((c) => !c.expiresAt || new Date(c.expiresAt).getTime() > now)
    .sort((x, y) => new Date(y.grantedAt) - new Date(x.grantedAt));

  if (live.length === 0) {
    const reason = (consentDocs || []).some((c) => c.scope === requiredScope)
      ? 'consent_expired_or_revoked'
      : 'consent_absent';
    return { authorised: false, reason, consentId: null, version: null };
  }
  return {
    authorised: true,
    reason: 'consent_live',
    consentId: live[0].consentId,
    version: live[0].version,
    expiresAt: live[0].expiresAt ?? null,
  };
}
`;

/** WHO 2021 (6th edition) lower reference limits, 5th centile. */
export const SEMEN_REFERENCE = `
const WHO_2021_LOWER_LIMITS = {
  volumeMl:                    1.4,
  totalSpermMillion:          39,
  concentrationMillionPerMl:  16,
  totalMotilityPct:           42,
  progressiveMotilityPct:     30,
  normalFormsPct:              4,
  vitalityPct:                54,
};

const SEMEN_FLAG_CODES = {
  volumeMl:                   'VOLUME_BELOW_REF',
  totalSpermMillion:          'TOTAL_COUNT_BELOW_REF',
  concentrationMillionPerMl:  'CONCENTRATION_BELOW_REF',
  totalMotilityPct:           'TOTAL_MOTILITY_BELOW_REF',
  progressiveMotilityPct:     'PROGRESSIVE_MOTILITY_BELOW_REF',
  normalFormsPct:             'MORPHOLOGY_BELOW_REF',
  vitalityPct:                'VITALITY_BELOW_REF',
};

function flagSemenResult(values) {
  const v = values || {};
  const flags = [];
  for (const [key, limit] of Object.entries(WHO_2021_LOWER_LIMITS)) {
    if (typeof v[key] === 'number' && v[key] < limit) flags.push(SEMEN_FLAG_CODES[key]);
  }
  // Azoospermia and severe oligozoospermia change the pathway, not just the score.
  if (typeof v.concentrationMillionPerMl === 'number') {
    if (v.concentrationMillionPerMl === 0) flags.push('AZOOSPERMIA');
    else if (v.concentrationMillionPerMl < 5) flags.push('SEVERE_OLIGOZOOSPERMIA');
  }
  return flags;
}

// A single abnormal sample is not a diagnosis. WHO guidance is to repeat before
// concluding, so the pathway asks for a confirmatory sample rather than labelling.
function semenNextStep(flags) {
  if (flags.includes('AZOOSPERMIA')) {
    return { tier: 'ANDROLOGY_UROLOGY', requiresHumanReview: true,
             action: 'confirmatory_sample_and_specialist_review' };
  }
  if (flags.includes('SEVERE_OLIGOZOOSPERMIA')) {
    return { tier: 'ANDROLOGY_UROLOGY', requiresHumanReview: true,
             action: 'confirmatory_sample_and_specialist_review' };
  }
  if (flags.length > 0) {
    return { tier: 'ANDROLOGY_UROLOGY', requiresHumanReview: false,
             action: 'repeat_sample_after_interval' };
  }
  return { tier: 'PRIMARY_CARE', requiresHumanReview: false, action: 'no_action_from_this_panel' };
}
`;

/** Quiet hours and frequency caps for anything outbound. */
export const NOTIFY_POLICY = `
function quietHoursBlock(nowDate, startHour, endHour) {
  const h = nowDate.getHours();
  // Window wraps midnight, e.g. 21:00 to 08:00.
  const blocked = startHour > endHour ? (h >= startHour || h < endHour) : (h >= startHour && h < endHour);
  return blocked;
}

// Safety-critical messages ignore quiet hours and the reminder-consent scope.
// Everything else is suppressed rather than queued, and the suppression is logged.
const SAFETY_CRITICAL_TEMPLATES = new Set([
  'urgent_care_instructions',
  'escalation_sla_breach',
]);

function notificationDoc({ pseudonymId, template, locale, channel, consentId, status }) {
  return {
    notificationId: newId('ntf'),
    pseudonymId,
    template,
    locale: locale || 'en',
    channel: channel || 'in_app',
    discreet: true,
    subject: DISCREET_SUBJECT[locale] || DISCREET_SUBJECT.en,
    consentId: consentId ?? null,
    status,
    attempt: 1,
    sentAt: status === 'sent' ? nowIso() : null,
    createdAt: nowIso(),
  };
}
`;

/** Convenience: build a Code node body from the fragments it needs. */
export function js(...parts) {
  return [PRELUDE, ...parts].join("\n");
}
