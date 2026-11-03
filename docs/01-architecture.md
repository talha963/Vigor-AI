# Vigor — Architecture

> A confidential front door for male reproductive health: early, explainable risk
> identification and safe routing to the right care — before infertility is diagnosed.

## 1. Design position

Male reproductive health is usually entered **late**, as an infertility work-up, and
often only after the female partner has already been assessed. Vigor inverts that:
it is a low-friction, stigma-aware, privacy-first entry point that a man can use
alone, anonymously, in Arabic or English, in under ten minutes — and which ends in a
concrete, appropriate next step rather than a score.

Three commitments shape every technical decision:

| Commitment | Consequence in the build |
| --- | --- |
| **Screening is not diagnosis** | Every output carries a tier, a confidence, and an explicit "this is not a diagnosis" boundary. Clinical gates are deterministic code, never LLM judgement. |
| **The user owns the data** | Anonymous by default; consent is an append-only ledger; every share is a scoped, expiring token; revocation cascades automatically. |
| **Culture is a requirement, not a polish pass** | Neutral clinical register, no assumptions about marital status or family intent, no imagery, full Arabic parity, discreet notification templates. |

## 2. System shape

```
                        ┌──────────────────────────────┐
                        │   apps/web  (Next.js 15)     │
                        │  anonymous bilingual intake  │
                        │  results · consent · nav     │
                        └──────────────┬───────────────┘
                                       │  HTTPS (session = pseudonym id)
                        ┌──────────────▼───────────────┐
                        │ services/agents (FastAPI)    │
                        │  ┌────────────────────────┐  │
                        │  │ LangGraph pathway      │  │
                        │  │  Intake → Risk →       │  │
                        │  │  Triage → Navigator    │  │
                        │  └────────────────────────┘  │
                        │  deterministic risk engine   │
                        │  red-flag gate (code)        │
                        └───┬──────────────────────┬───┘
                            │  emits domain events │  reads/writes
                            ▼                      ▼
        ┌───────────────────────────────┐   ┌─────────────────────────┐
        │  n8n  — orchestration spine   │◄──┤  MongoDB Atlas          │
        │  9 workflows (this chunk)     │   │  + Atlas Vector Search  │
        │  consent gate · escalation    │   │  consent ledger · audit │
        │  referral · kits · labs       │   └─────────────────────────┘
        │  nudges · erasure · metrics   │
        └───────┬───────────────────────┘
                │
                ▼  clinician queue · facility referral · user notification
```

### Why n8n is the spine, not a bolt-on

Everything that happens **after** a risk signal is produced is a long-running,
multi-party, auditable process with humans in the loop: a clinician must see an
urgent case within an SLA, a referral must not leave the building without a matching
consent record, an at-home kit must be chased, a revocation must cascade. That is
workflow, not request/response. Putting it in n8n means:

- **Every side effect is visible.** A judge (or an auditor) can open a run and see
  exactly which consent record authorised a referral.
- **Human oversight is a first-class node**, not a TODO.
- **Retries, SLA timers and idempotency** come from the engine instead of hand-rolled
  cron jobs.

## 3. The agentic layer (next chunk)

A LangGraph state machine, not a chat loop:

| Agent | Job | Guardrail |
| --- | --- | --- |
| **Intake** | Conversational, adaptive history-taking; asks only what changes the answer. | Question bank is fixed; the model chooses order and phrasing, never invents clinical items. |
| **Risk** | Explains the deterministic score across metabolic, lifestyle, infectious, anatomical, endocrine and semen domains. | Scores come from `risk_engine`; the model may only narrate drivers it was given. |
| **Triage** | Proposes a tier and the rationale. | Red-flag gate runs **before** the model and can only ever escalate, never de-escalate. |
| **Navigator** | Turns the tier into a plan: service, preparation, what to expect, cost/time. | Service catalogue is data; no invented facilities. |

Interrupts (LangGraph `interrupt_before`) hand control to the n8n clinician-review
workflow whenever `requiresHumanReview` is true.

## 4. Repository layout

```
apps/web/            Next.js 15 patient + clinician UI                (chunk 3)
services/agents/     FastAPI + LangGraph + deterministic risk engine   (chunk 2)
n8n/workflows/       9 importable workflow definitions                 ← this chunk
packages/contracts/  JSON Schema for every event crossing a boundary   ← this chunk
infra/               docker compose for n8n + optional local Mongo     ← this chunk
tools/               index bootstrap, synthetic cohort, smoke tests    ← this chunk
docs/                architecture, data model, contracts, privacy, safety
```

## 5. Build order

1. **Chunk 1 (done) — orchestration spine.** Event contracts, Mongo collections and
   indexes, the 9 n8n workflows, synthetic cohort, smoke tests.
2. **Chunk 2 — agent service.** Deterministic risk engine + red-flag gate with unit
   tests, then the LangGraph pathway on top, then the eval harness.
3. **Chunk 3 — web app.** Bilingual anonymous intake, explainable results, consent
   centre, clinician review console.
4. **Chunk 4 — evidence.** Run the synthetic cohort end to end; report triage
   accuracy, red-flag sensitivity, time-to-evaluation, referral completion and
   fairness slices.

See [02-data-model.md](02-data-model.md), [03-event-contracts.md](03-event-contracts.md),
[04-n8n-workflows.md](04-n8n-workflows.md), [05-privacy-and-consent.md](05-privacy-and-consent.md)
and [06-clinical-safety.md](06-clinical-safety.md).
