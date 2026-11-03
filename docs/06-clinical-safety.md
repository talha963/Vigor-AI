# Vigor — Clinical safety

> **Status: not clinically validated.** This is a hackathon build. The red-flag
> catalogue, thresholds and tier mappings in this document were written against
> standard urology and andrology urgency practice and are intended to be
> reviewed and signed off by a clinician before any real-world use.
> `tools/seed/golden-cases.json` carries `reviewStatus: awaiting_clinical_sign_off`
> for the same reason. Nothing here should be read as validated performance.

---

## 1. The boundary

Vigor is a **screening and navigation** tool. It identifies risk signals and
routes people. It does not diagnose.

Every output carries the boundary explicitly:

```json
"boundary": {
  "isDiagnosis": false,
  "statement": "This is a screening result, not a diagnosis. A clinician makes the diagnosis.",
  "humanOversight": "A clinician will review this result before any referral is sent."
}
```

This is in the payload, not only in the UI copy, so the statement cannot be lost
when the result is rendered somewhere new.

## 2. Architecture of the safety floor

The thing that makes this defensible is the order of operations.

```
answers
   │
   ├─► deterministic red-flag gate          pure functions, no model
   │        │
   │        └─► minimumTier, severity, slaMinutes
   │
   ├─► agent service: risk score + proposed tier     LLM + risk engine
   │
   └─► reconcile:  tier = escalateOnly(engineTier, minimumTier)
                   ───────────────────────────────────────────
                   the model can RAISE a tier. Nothing lowers one.
```

Three properties follow:

1. **A red flag cannot be missed because of a model failure.** The gate runs
   first, over a closed symptom vocabulary, as pure functions.
2. **A red flag cannot be talked away.** The clamp is one-directional.
3. **The system still routes correctly when the model is unavailable.** If the
   agent service times out, workflow 01 continues on the gate alone, marks the
   result `degraded: true`, and tells the user the result is partial.

The gate lives in one place, [`n8n/src/shared.mjs`](../n8n/src/shared.mjs), and
is tested by `node tools/verify-contracts.js`, which runs the **same source
fragment** the n8n Code nodes execute — not a reimplementation of it.

## 3. Red-flag catalogue

| Code | Trigger | Severity | SLA | Minimum tier |
| --- | --- | --- | --- | --- |
| `RF_ACUTE_SCROTAL_PAIN` | `acute_scrotal_pain`, or `scrotal_swelling` with onset ≤ 6h | URGENT | 60 min | URGENT |
| `RF_TESTICULAR_MASS` | `testicular_lump` | URGENT | 60 min | URGENT |
| `RF_PRIAPISM` | `prolonged_erection` | URGENT | 60 min | URGENT |
| `RF_GU_TRAUMA` | `recent_genital_trauma` | URGENT | 60 min | URGENT |
| `RF_ACUTE_URINARY_RETENTION` | `cannot_pass_urine` | URGENT | 60 min | URGENT |
| `RF_FEBRILE_GU_INFECTION` | `fever` + (`dysuria` \| `urethral_discharge` \| `scrotal_ache`) | SAME_DAY | 8 h | URGENT |
| `RF_PITUITARY_SUSPICION` | `visual_field_loss` + (`gynaecomastia` \| absent libido) | SAME_DAY | 8 h | URGENT |
| `RF_BILATERAL_UNDESCENDED` | `undescendedTestis = bilateral_uncorrected` | ROUTINE_REVIEW | 48 h | ANDROLOGY_UROLOGY |
| `RF_ABSENT_VAS` | `absentVas = true` | ROUTINE_REVIEW | 48 h | ANDROLOGY_UROLOGY |

### Why these

The first five are time-critical presentations where delay causes irreversible
harm — testicular torsion has a salvage window measured in hours, and priapism
beyond four hours risks permanent damage. They are included not because they are
common in a fertility pathway but because this is a front door, and a front door
that cannot recognise an emergency is dangerous regardless of what it was built
for.

`RF_FEBRILE_GU_INFECTION` is the clearest example of the upstream catch the
brief asks for: a treatable infection, found early, is a reversible cause of
impaired fertility.

`RF_PITUITARY_SUSPICION` is the case that justifies asking questions a fertility
intake usually skips. A prolactinoma can present as reduced libido and
infertility long before anyone thinks of the pituitary.

The last two are not urgent but change the pathway completely — absent vas
deferens is strongly associated with CFTR mutations, so it is a genetic
counselling route, not a lifestyle conversation.

### Deliberate near-miss

Golden case **GC16** is scrotal ache, gradual onset, no fever. It is worded
similarly to GC01 and must **not** escalate. A gate that over-triggers burns
clinician trust and floods the queue, which costs lives just as surely by a
slower route. The onset-hours condition exists precisely to separate GC01 from
GC16, and the test asserts both.

## 4. Semen analysis: WHO 2021 (6th edition)

Lower reference limits (5th centile), in
[`shared.mjs`](../n8n/src/shared.mjs) and asserted by the verifier:

| Parameter | Limit |
| --- | --- |
| Semen volume | 1.4 mL |
| Total sperm number | 39 million |
| Sperm concentration | 16 million/mL |
| Total motility | 42 % |
| Progressive motility | 30 % |
| Normal forms | 4 % |
| Vitality | 54 % |

Every stored result carries `whoRefVersion`, and the database validator requires
it. Flags are meaningless without knowing which standard produced them.

### A single abnormal sample is not a diagnosis

WHO guidance is to repeat before concluding. Workflow 05 implements this:

| Finding | Tier | Action |
| --- | --- | --- |
| Azoospermia (0 M/mL) | ANDROLOGY_UROLOGY | confirmatory sample **and** specialist review |
| Severe oligozoospermia (< 5 M/mL) | ANDROLOGY_UROLOGY | confirmatory sample **and** specialist review |
| Any parameter below reference | ANDROLOGY_UROLOGY | repeat sample after an interval |
| All within reference | PRIMARY_CARE | no action from this panel |

### Severe findings are never auto-delivered

Azoospermia and severe oligozoospermia set `requiresHumanReview: true` and
`withholdsDetail: true`. The user is told:

> Your test result is ready. A clinician will go through it with you before you
> see the detail, so nothing important lands without context.

Finding out you have no measurable sperm from a push notification, alone, is the
kind of harm this project exists to prevent. The notification body contains no
values, no flags and no numbers.

## 5. Human oversight, as a gate

`requiresHumanReview` is set whenever there is a red flag, the tier is URGENT, or
the engine asks for review. While it is true:

- `triage_decisions.status` is `pending_review`
- **workflow 03 refuses to dispatch a referral.** It returns 202 with
  `dispatched: false` and tells the user a clinician will review first. This is
  asserted by smoke test 4.
- workflow 02 has an open escalation with an SLA clock against it

Workflow 09 releases it. And workflow 02's sweep, every five minutes, marks any
escalation past `dueAt` and still unacknowledged as `breached`, notifies the
clinical lead, and writes an `ESCALATION_SLA_BREACHED` audit record. An urgent
case nobody looked at becomes loud rather than invisible.

### What a clinician may and may not override

| Action | Permitted | Requirement |
| --- | --- | --- |
| Approve the engine's tier | yes | — |
| Escalate to a higher tier | yes | target tier |
| De-escalate | yes | written justification ≥ 20 characters, recorded against their id |
| De-escalate across an emergency red flag | **no** | refused with 422 |

The non-de-escalatable set is `RF_ACUTE_SCROTAL_PAIN`, `RF_TESTICULAR_MASS`,
`RF_PRIAPISM`, `RF_GU_TRAUMA`, `RF_ACUTE_URINARY_RETENTION`.

This is not a claim that the clinician is wrong. It is a claim about where that
decision belongs: a screening tool's API is the wrong venue for standing down a
suspected torsion. The refusal message says so, and points to the clinical
record with a named accountable clinician. Every refused attempt is audited as
`REVIEW_OVERRIDE_REFUSED`, so a pattern of attempts is visible to clinical
governance rather than scattered across request logs.

## 6. Degradation is a tracked metric

`risk_scores.degraded` is true when the engine was unavailable and the case was
routed by the gate alone. `metrics_daily.degradedScoreRate` reports it nightly.

`triage_decisions.clamped` is true when the deterministic gate had to raise the
model's tier. `metrics_daily.safetyClampRate` reports that too — and a rising
clamp rate is an early warning that the model is drifting away from the safety
floor, visible before anyone is harmed by it.

## 7. Known limitations

Stated here rather than discovered in questioning:

1. **Not clinically validated.** No clinician has signed off the catalogue,
   thresholds or tier mappings.
2. **The gate is symptom-report-based.** Self-reported symptoms over a closed
   vocabulary. A man who does not recognise or report a lump is not caught, and
   no triage tool fixes that — outreach and education do.
3. **Risk scoring is not epidemiologically calibrated.** The weights in the
   engine are clinically plausible, not fitted to an Abu Dhabi population.
   Calibration needs real cohort data and is explicitly out of scope.
4. **Fairness is measured on completion, not on outcomes.** Workflow 08 reports
   completion-rate gaps by locale and age band, which detects access inequity.
   It does not detect differential *accuracy* across groups; that needs labelled
   outcome data.
5. **No partner pathway.** Male and female infertility need distinct risk
   models, and this system deliberately only models the male side. The couple
   journey is a separate design problem.
6. **Clinician identity is a shared key.** Adequate for a demo. Production
   requires federated clinician identity so that `reviewedBy` is a real,
   attributable person.
7. **Lab integration is a webhook with a shared key.** Real labs need mutual TLS
   and an HL7 or FHIR adapter.
8. **The fallback gate over-triages by design.** With no engine, a case with no
   red flags and ≥ 12 months trying routes to ANDROLOGY_UROLOGY, and everything
   else to PRIMARY_CARE. It never produces SELF_CARE. That is the correct bias
   for a degraded safety system, and it means the degraded path costs capacity —
   which is why `degradedScoreRate` is monitored.

## 8. Evidence this chunk produces

`node tools/verify-contracts.js` — 107 checks, no database or network required:

- 16 clinical scenarios against the deterministic gate (flags, severity,
  minimum tier, and a human-readable reason for every flag raised)
- 4 lab cases against WHO 2021 flagging, next-step mapping and the
  withhold-detail rule
- the 7 WHO reference limits, asserted against published values
- every golden case serialised and validated against the event contract
- every golden-case symptom checked against the closed vocabulary

`npm run smoke` — 10 end-to-end tests against the running stack. Four of them
assert that the system **says no**: refuses processing without consent, blocks a
referral pending review, refuses an unsafe de-escalation, and rejects a revoked
share token. A demo that only shows the happy path proves very little about a
service handling data this sensitive.
