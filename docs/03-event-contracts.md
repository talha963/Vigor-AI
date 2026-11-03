# Vigor — Event contracts

Every payload that crosses a service boundary is defined once, in
[`packages/contracts/events.schema.json`](../packages/contracts/events.schema.json),
and validated by both ends. `node tools/verify-contracts.js` checks that the
golden clinical cases still serialise cleanly against it, so a contract change
that breaks a case fails fast rather than at demo time.

## Entry points

| Trigger | Workflow | Auth | Contract |
| --- | --- | --- | --- |
| `POST /webhook/vigor/intake-completed` | 01 | consent gate | `intake.completed` |
| `POST /webhook/vigor/red-flag-escalation` | 02 | internal | `triage.red_flag` |
| `POST /webhook/vigor/referral-consent` | 03 | consent gate | `referral.consented` |
| `POST /webhook/vigor/referral-status` | 03 | share token | `referral.status.updated` |
| `POST /webhook/vigor/kit-request` | 04 | consent gate | `kit.requested` |
| `POST /webhook/vigor/lab-result` | 05 | `X-Vigor-Lab-Key` | `lab.result.received` |
| `POST /webhook/vigor/consent-revoked` | 07 | subject session | `consent.revoked` |
| `POST /webhook/vigor/clinician-review` | 09 | `X-Vigor-Clinician-Key` | `clinician.review.submitted` |
| cron `*/5 * * * *` | 02 | — | escalation SLA sweep |
| cron `0 9 * * *` | 04 | — | kit chase and expiry |
| cron `0 */2 * * *` | 06 | — | re-engagement sweep |
| cron `30 0 * * *` | 08 | — | metrics rollup |

Note what is *not* here: there is no endpoint that returns a subject's answers,
and no endpoint a facility can call to read more than the risk summary it was
sent. Reading clinical detail happens in the app, in the subject's own session.

## Three contract decisions worth defending

### 1. Symptoms are a closed vocabulary

`answers.symptoms` only accepts codes from a fixed list. The red-flag gate is a
pure function of those codes, which means:

- the gate is auditable — you can read twelve lines and know exactly what
  escalates;
- free text can never silently change a routing decision;
- a model paraphrasing a symptom cannot invent an emergency, or miss one.

Free text is still collected, because people say things questionnaires do not
ask. It is encrypted at the edge, stored as `freeTextEnc`, excluded from every
outbound payload, and used by the Intake agent to decide which *closed* question
to ask next — never to set a flag directly.

### 2. `pseudonymId` is the only subject key in a clinical payload

No name, no Emirates ID, no date of birth, no phone number appears in any event
in this file. Age is banded and geography is coarse. The schema enforces the
`psn_` prefix pattern, so a payload carrying a real identifier fails validation
rather than being quietly accepted.

### 3. Tiers are ordered by acuity, not by service type

```
SELF_CARE  <  PRIMARY_CARE  <  FERTILITY_SERVICES  <  ANDROLOGY_UROLOGY  <  URGENT
```

The escalate-only rule compares positions in this list. `FERTILITY_SERVICES`
sits below `ANDROLOGY_UROLOGY` because a man routed to andrology has something
that needs investigating, while a man routed to fertility services may have
nothing wrong at all — a post-vasectomy case, for instance. The ordering is
about how urgently someone needs to be seen, not about how specialised the
service is.

## Worked example: `intake.completed`

```json
{
  "eventType": "intake.completed",
  "eventId": "evt_8f21c0",
  "occurredAt": "2026-11-02T09:14:22.000Z",
  "idempotencyKey": "asm_7a2b:intake.completed",
  "pseudonymId": "psn_9f3a2c81",
  "assessmentId": "asm_7a2b44",
  "consentId": "cns_41d9aa",
  "locale": "ar",
  "startedAt": "2026-11-02T09:07:48.000Z",
  "durationSec": 394,
  "answers": {
    "monthsTrying": 18,
    "priorConception": false,
    "partnerAssessed": true,
    "bmi": 33.4,
    "waistCm": 108,
    "diabetes": "type2",
    "hba1c": 7.8,
    "smoking": "current",
    "packYears": 12,
    "heatExposure": "frequent",
    "libidoChange": "reduced",
    "symptoms": []
  },
  "skippedSensitive": ["sexualFunctionDetail"]
}
```

Response from workflow 01:

```json
{
  "accepted": true,
  "assessmentId": "asm_7a2b44",
  "decisionId": "trg_k39dm2",
  "tier": "ANDROLOGY_UROLOGY",
  "redFlags": [],
  "requiresHumanReview": false,
  "explanation": {
    "rationale": "...",
    "domains": [ { "domain": "metabolic", "score": 0.68, "band": "elevated",
                   "drivers": [ { "code": "BMI_OBESE", "label": "BMI 33.4",
                                  "weight": 0.3, "modifiable": true } ] } ],
    "overall": { "score": 0.57, "band": "elevated", "confidence": 0.62 },
    "missingInputs": ["semen_analysis", "testosterone"]
  },
  "nextStep": {
    "kind": "specialist_referral_offer",
    "tier": "ANDROLOGY_UROLOGY",
    "requiresConsentScope": "SHARE_WITH_CLINICIAN",
    "atHomeKitOffered": true
  },
  "boundary": {
    "isDiagnosis": false,
    "statement": "This is a screening result, not a diagnosis. A clinician makes the diagnosis.",
    "humanOversight": "You can ask for a clinician to review this at any time."
  },
  "degraded": false
}
```

Two fields in that response exist purely to keep the system honest:

- **`missingInputs`** — the user is told what the score could not see. An
  "elevated risk" based on no semen analysis is a weaker claim than one based on
  two samples, and pretending otherwise is how screening tools lose trust.
- **`degraded`** — true when the risk engine was unreachable and the case was
  routed by the deterministic fallback gate alone. The UI says so. Workflow 08
  reports the rate.

## Error responses

| Status | Meaning | Returned by |
| --- | --- | --- |
| 400 | payload does not match the contract | all webhooks |
| 401 | lab key, clinician key or share token invalid | 03, 05, 09 |
| 403 | the required consent scope is not live | 01, 03, 04 |
| 409 | no matching service in the catalogue | 03 |
| 422 | override refused — emergency red flag cannot be de-escalated | 09 |
| 202 | accepted but deliberately not acted on yet (held for review) | 02, 03, 05 |

The 403 and 422 responses both explain *why* and name what would change the
answer. A refusal the caller cannot act on is a dead end.

## Idempotency

`intake.completed` carries an `idempotencyKey`, and `assessments.idempotencyKey`
has a unique index. A duplicate delivery fails the insert rather than producing a
second triage decision and a second escalation for the same case. The facility
status callback is protected differently: workflow 03 rejects any transition that
is not forward along the referral lifecycle, so a replayed "booked" after
"attended" is refused.
