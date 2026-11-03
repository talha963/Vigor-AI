# services/agents — chunk 2

FastAPI + LangGraph + the deterministic risk engine. Not built yet.

## Endpoints the n8n workflows already call

| Endpoint | Called by | Purpose |
| --- | --- | --- |
| `POST /internal/v1/score-and-triage` | workflow 01 | risk score + proposed tier for an assessment |
| `POST /internal/v1/rescore-with-result` | workflow 05 | re-score after a lab result |
| `POST /internal/v1/notify-clinician` | workflow 02 | deliver an on-call escalation alert |
| `POST /internal/v1/dispatch-referral` | workflow 03 | deliver a referral to a facility |
| `POST /internal/v1/logistics/book` | workflow 04 | book a discreet courier for a kit |

All authenticate with `X-Vigor-Signature: $VIGOR_INTERNAL_TOKEN`. All are called
with `onError: continueRegularOutput`, so the workflows already handle this
service being absent — which is why the degradation path was built first.

## Planned shape

```
services/agents/
  risk_engine/        pure, deterministic, unit-tested. No LLM.
    domains.py        metabolic, lifestyle, infectious, anatomical, endocrine, semen
    red_flags.py      the same catalogue as n8n/src/shared.mjs, single source to be unified
    scoring.py        weights, bands, confidence, missingInputs
  graph/              LangGraph state machine
    intake.py         adaptive history-taking over a FIXED question bank
    risk.py           narrates drivers it was given, invents nothing
    triage.py         proposes a tier; the gate clamps it
    navigator.py      tier -> service, preparation, what to expect
  api/                FastAPI routes matching the table above
  evals/              the golden cases from tools/seed/golden-cases.json
```

## Non-negotiables inherited from chunk 1

- The red-flag gate runs **before** the model and can only escalate.
- The Risk agent may narrate only drivers the engine produced. No invented
  findings.
- The question bank is fixed. The model chooses order and phrasing, never the
  clinical content.
- `interrupt_before` on anything with `requiresHumanReview`, handed to
  workflow 09.
- Every response carries the screening-not-diagnosis boundary and
  `missingInputs`.

The duplicated red-flag logic between `n8n/src/shared.mjs` and
`risk_engine/red_flags.py` is a known risk. The intended resolution is to
generate both from one declarative catalogue, with the verifier asserting parity.
