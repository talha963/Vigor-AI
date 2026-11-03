# Vigor — Data model (MongoDB Atlas)

Database: `vigor`. Thirteen collections. Two rules hold everywhere:

1. **No direct identifiers in clinical collections.** Clinical documents key on
   `pseudonymId` only. Contact details live in `subjects` and are encrypted.
2. **Append-only where it matters.** `consents`, `audit_log` and `lab_results` are
   never updated in place; a correction is a new document superseding the old one.

---

## `subjects`

The only collection that can be linked to a person, and only if they chose to create
an account.

```js
{
  _id:           ObjectId,
  pseudonymId:   "psn_9f3a...",      // HMAC(deviceSeed, VIGOR_PSEUDONYM_SALT), unique
  locale:        "ar" | "en",
  accountLinked: false,               // true only after explicit sign-up
  contact: {                          // absent while anonymous
    emailEnc:  "v1:gcm:<iv>:<ct>:<tag>",   // AES-256-GCM, application level
    phoneEnc:  "v1:gcm:<iv>:<ct>:<tag>",
    preferredChannel: "email" | "sms" | "in_app"
  },
  ageBand:       "25-29",             // banded, never a date of birth
  emirate:       "Abu Dhabi",         // coarse geography only
  createdAt:     ISODate,
  lastSeenAt:    ISODate,
  erasedAt:      null                 // set by the revocation cascade
}
```

## `consents` — append-only ledger

The authority for every outbound action. **No workflow may act without a matching
`granted: true` document that has not been superseded or revoked.**

```js
{
  _id:          ObjectId,
  consentId:    "cns_...",
  pseudonymId:  "psn_...",
  scope:        "ASSESSMENT" | "STORE_RESULTS" | "SHARE_WITH_CLINICIAN"
              | "SHARE_WITH_FERTILITY_SERVICE" | "AT_HOME_TESTING"
              | "CONTACT_REMINDERS" | "RESEARCH_AGGREGATE",
  granted:      true,
  version:      "consent-v1.2",       // the exact wording shown, by version
  lawfulBasis:  "explicit_consent",
  locale:       "ar",
  grantedAt:    ISODate,
  expiresAt:    ISODate,              // scoped consent always expires
  revokedAt:    null,
  supersedes:   "cns_..." | null,
  evidence: { uiSurface: "consent_sheet_v1", ipHash: "...", userAgentHash: "..." }
}
```

## `assessments`

One intake submission. Answers are **minimised**: only items that feed a risk domain
are retained; free text is stored encrypted and is never sent to a facility.

```js
{
  _id:          ObjectId,
  assessmentId: "asm_...",
  pseudonymId:  "psn_...",
  locale:       "en",
  consentId:    "cns_...",            // the ASSESSMENT consent in force
  status:       "started" | "abandoned" | "completed",
  startedAt:    ISODate,
  completedAt:  ISODate | null,
  durationSec:  412,
  answers: {
    // metabolic
    bmi: 31.2, waistCm: 104, diabetes: "type2", hba1c: 7.1,
    // lifestyle
    smoking: "current", packYears: 8, alcohol: "none",
    heatExposure: "frequent", anabolicSteroids: "past",
    // infectious
    stiHistory: ["chlamydia"], mumpsOrchitis: false, currentDischarge: false,
    // anatomical
    varicocele: "unknown", undescendedTestis: "unilateral_corrected",
    priorHerniaRepair: true, testicularTrauma: false,
    // endocrine and sexual function
    libidoChange: "reduced", erectileDifficulty: "occasional",
    // reproductive history
    monthsTrying: 14, priorConception: false,
    // symptoms, which drive the red-flag gate
    symptoms: ["scrotal_ache"],
    freeTextEnc: "v1:gcm:..."
  },
  answeredItemCount: 34,
  skippedSensitive:  ["sexualFunctionDetail"]   // skipping is always allowed
}
```

## `risk_scores`

Explainable output. `drivers` is what the UI renders and the only thing the Risk
agent is allowed to narrate.

```js
{
  _id:          ObjectId,
  scoreId:      "scr_...",
  assessmentId: "asm_...",
  pseudonymId:  "psn_...",
  modelVersion: "risk-engine-0.3.0",
  computedAt:   ISODate,
  domains: [
    { domain: "metabolic",  score: 0.68, band: "elevated",
      drivers: [ { code: "BMI_OBESE",  label: "BMI 31.2",  weight: 0.30, modifiable: true },
                 { code: "HBA1C_HIGH", label: "HbA1c 7.1%", weight: 0.25, modifiable: true } ] },
    { domain: "lifestyle",  score: 0.55, band: "elevated",  drivers: [ /* ... */ ] },
    { domain: "infectious", score: 0.30, band: "low",       drivers: [] },
    { domain: "anatomical", score: 0.45, band: "moderate",  drivers: [] },
    { domain: "endocrine",  score: 0.40, band: "moderate",  drivers: [] },
    { domain: "semen",      score: null, band: "unknown",   drivers: [],
      note: "No semen analysis on file" }
  ],
  overall:   { score: 0.57, band: "elevated", confidence: 0.62 },
  // confidence is low whenever `semen` is unknown, and that is stated plainly
  missingInputs: ["semen_analysis", "testosterone"]
}
```

## `triage_decisions`

```js
{
  _id:            ObjectId,
  decisionId:     "trg_...",
  assessmentId:   "asm_...",
  pseudonymId:    "psn_...",
  tier:           "SELF_CARE" | "PRIMARY_CARE" | "ANDROLOGY_UROLOGY"
                | "FERTILITY_SERVICES" | "URGENT",
  redFlags:       ["RF_ACUTE_SCROTAL_PAIN"],
  rationale:      "...",               // generated, grounded strictly in `drivers`
  rationaleLocale:"en",
  requiresHumanReview: true,
  source:         "engine" | "clinician_override",
  reviewedBy:     "clinician:dr_x" | null,
  reviewedAt:     ISODate | null,
  reviewOutcome:  "approved" | "escalated" | "de_escalated" | null,
  reviewNote:     null,
  status:         "pending_review" | "final",
  createdAt:      ISODate
}
```

## `escalations`

The urgent clinician queue, with an SLA clock.

```js
{
  _id: ObjectId, escalationId: "esc_...", pseudonymId: "psn_...",
  decisionId: "trg_...", redFlags: ["RF_TESTICULAR_MASS"],
  severity: "URGENT" | "SAME_DAY" | "ROUTINE_REVIEW",
  slaMinutes: 60, dueAt: ISODate,
  status: "open" | "acknowledged" | "closed" | "breached",
  acknowledgedBy: null, acknowledgedAt: null,
  createdAt: ISODate, closedAt: null
}
```

## `referrals`

Only created by workflow 03, and only against a live `SHARE_WITH_*` consent.

```js
{
  _id: ObjectId, referralId: "ref_...", pseudonymId: "psn_...",
  tier: "ANDROLOGY_UROLOGY",
  serviceType: "andrology" | "urology" | "primary_care" | "fertility" | "emergency",
  facility: { id: "fac_001", name: "...", emirate: "Abu Dhabi", teleconsult: true },
  consentId: "cns_...",               // the authorising consent, mandatory
  shareToken: { token: "shr_...", expiresAt: ISODate, scope: ["risk_summary"],
                revokedAt: null, accessCount: 0 },
  status: "dispatched" | "accepted" | "booked" | "attended" | "completed"
        | "declined" | "expired",
  dispatchedAt: ISODate, bookedAt: null, attendedAt: null, completedAt: null
}
```

## `kit_orders` — at-home semen collection

```js
{
  _id: ObjectId, kitOrderId: "kit_...", pseudonymId: "psn_...",
  status: "requested" | "dispatched" | "delivered" | "returned"
        | "lab_received" | "resulted" | "expired",
  discreetPackaging: true,            // always true, and stated to the user
  carrier: "local_courier", trackingRef: "...",
  requestedAt: ISODate, dispatchedAt: null, returnedAt: null,
  abstinenceWindowHours: 48,          // instruction issued with the kit
  remindersSent: 0, labRef: null
}
```

## `lab_results` — append-only

```js
{
  _id: ObjectId, resultId: "lab_...", pseudonymId: "psn_...",
  kitOrderId: "kit_..." | null,
  panel: "semen_analysis" | "hormonal" | "metabolic" | "infectious",
  whoRefVersion: "WHO-2021-6th",
  values: { volumeMl: 2.1, concentrationMillionPerMl: 12.4,
            progressiveMotilityPct: 24, normalFormsPct: 3, phLevel: 7.6 },
  flags: ["CONCENTRATION_BELOW_REF", "MOTILITY_BELOW_REF"],
  receivedAt: ISODate, supersedes: null
}
```

## `notifications`

Outbound log. In `NOTIFY_MODE=DEMO` nothing leaves the building, but the row is still
written, so the whole demo stays inspectable.

```js
{
  _id: ObjectId, notificationId: "ntf_...", pseudonymId: "psn_...",
  channel: "email" | "sms" | "in_app",
  template: "urgent_care_instructions" | "referral_dispatched"
          | "kit_dispatched" | "result_ready" | "reengagement_nudge"
          | "erasure_complete",
  locale: "ar", discreet: true,       // no clinical content in subject lines
  consentId: "cns_..." | null,        // null only for safety-critical messages
  status: "queued" | "sent" | "suppressed_quiet_hours" | "suppressed_no_consent"
        | "failed",
  sentAt: ISODate | null, attempt: 1
}
```

## `audit_log` — append-only, written by every workflow

```js
{
  _id: ObjectId, at: ISODate,
  actor: "workflow:03-referral-dispatch" | "clinician:dr_x" | "subject",
  action: "REFERRAL_DISPATCHED" | "CONSENT_REVOKED" | "ESCALATION_RAISED" | "...",
  pseudonymId: "psn_...",
  subjectRef: { collection: "referrals", id: "ref_..." },
  consentId: "cns_..." | null,
  workflowRunId: "exec_8821",
  meta: { /* never contains answer values */ }
}
```

## `metrics_daily`

```js
{
  _id: "2026-11-02",                  // the date is the key, so the rollup is idempotent
  assessmentsStarted: 142, assessmentsCompleted: 118, completionRate: 0.83,
  medianDurationSec: 386,
  tierCounts: { SELF_CARE: 41, PRIMARY_CARE: 38, ANDROLOGY_UROLOGY: 24,
                FERTILITY_SERVICES: 12, URGENT: 3 },
  redFlagCount: 3,
  escalationsRaised: 3, escalationsAcknowledgedWithinSla: 3, slaBreaches: 0,
  medianMinutesToClinicianAck: 18,
  referralsDispatched: 29, referralsCompleted: 11, referralCompletionRate: 0.38,
  medianDaysToAppropriateEvaluation: 6.5,
  kitsRequested: 17, kitsReturned: 9,
  fairnessSlices: {                   // completion rate by slice, watched for drift
    byLocale:  { ar: 0.79, en: 0.86 },
    byAgeBand: { "18-24": 0.74, "25-29": 0.85, "30-34": 0.86, "35-39": 0.83, "40+": 0.80 }
  },
  computedAt: ISODate
}
```

## `service_catalogue` (reference data, seeded)

```js
{ _id: ObjectId, facilityId: "fac_001", name: "...", serviceTypes: ["andrology"],
  emirate: "Abu Dhabi", teleconsult: true, maleClinicianAvailable: true,
  languages: ["ar","en"], acceptsSelfReferral: true, typicalWaitDays: 5 }
```

`maleClinicianAvailable` and `languages` are matching criteria, not decoration. Both
are material access barriers the brief asks us to lower.

## `kb_chunks` (patient education, Atlas Vector Search)

```js
{ _id: ObjectId, chunkId: "kb_...", locale: "ar",
  topic: "varicocele", text: "...", embedding: [0.012, ...],
  source: { title: "...", org: "...", year: 2024, url: "..." },
  readingLevel: "grade-7", reviewedBy: "clinical_reviewer_1" }
```

Patient-facing education is retrieved, never improvised, and every chunk carries a
citation the UI shows.

---

## Indexes

Created by [`tools/mongo-bootstrap.js`](../tools/mongo-bootstrap.js). Highlights:

| Collection | Index | Why |
| --- | --- | --- |
| `subjects` | `{pseudonymId: 1}` unique | identity lookup |
| `consents` | `{pseudonymId: 1, scope: 1, grantedAt: -1}` | the consent gate hot path |
| `assessments` | `{status: 1, startedAt: 1}` | nudge workflow finds abandoned intakes |
| `triage_decisions` | `{status: 1, createdAt: 1}` | clinician review queue |
| `escalations` | `{status: 1, dueAt: 1}` | SLA sweep |
| `referrals` | `{"shareToken.token": 1}` unique sparse | token resolution |
| `referrals` | `{status: 1, dispatchedAt: 1}` | completion metrics |
| `audit_log` | `{pseudonymId: 1, at: -1}` | subject access request |
| `notifications` | `{pseudonymId: 1, template: 1, sentAt: -1}` | nudge frequency cap |
| `lab_results` | `{pseudonymId: 1, receivedAt: -1}` | latest result |
| `kb_chunks` | Atlas Vector Search on `embedding` | grounded patient education |
