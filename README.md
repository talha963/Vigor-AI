# Vigor

**A confidential front door for male reproductive health.** Early, explainable
risk identification and safe routing to the right care — before infertility is
diagnosed.

> Male reproductive health is usually entered late, as an infertility work-up,
> and often only after the female partner has already been assessed. By then,
> modifiable metabolic, lifestyle, infectious and anatomical risk factors have
> gone unaddressed for years. Vigor is a low-friction, stigma-aware,
> privacy-first entry point that a man can use alone, anonymously, in Arabic or
> English — and which ends in a concrete next step rather than a score.

**Status:** chunk 1 of 4 complete — the orchestration spine. Not clinically
validated; see [docs/06-clinical-safety.md](docs/06-clinical-safety.md).

---

## What exists right now

| | |
| --- | --- |
| **9 n8n workflows, 248 nodes** | the orchestration spine, generated from reviewable sources |
| **13 MongoDB collections** | with indexes and schema validators, including an append-only consent ledger and audit log |
| **A deterministic clinical safety floor** | 9 red flags and the WHO 2021 semen reference limits, as pure functions the model cannot override downward |
| **107 passing safety checks** | 16 clinical scenarios + 4 lab cases + 7 reference limits + contract validation, with no database or network needed |
| **10 end-to-end smoke tests** | 4 of which assert the system correctly refuses |
| **A 240-subject synthetic cohort** | deterministically generated, with an intentionally non-uniform completion rate so the fairness metrics are not vacuous |

## Quick start

Everything runs in Docker. Nothing is installed on the host, and the stack adds
**zero new images** — `n8n`, the one-shot bootstrap and the repo tooling all
share one image, and MongoDB defaults to Atlas (zero local bytes). See
[docs/07-docker-and-storage.md](docs/07-docker-and-storage.md).

```bash
cp .env.example .env
```

Fill in `MONGODB_URI` (Atlas), `VIGOR_INTERNAL_TOKEN` and `N8N_ENCRYPTION_KEY`.
Generate keys with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Start it:

```bash
docker compose --env-file .env -f infra/docker-compose.yml up -d
```

`n8n-init` runs first: it creates the `Vigor Atlas` MongoDB credential from your
connection string, imports the nine workflows, and **activates all nine**. Only
then does n8n start, so there is no window where a webhook exists but is
inactive. n8n is at <http://localhost:5678> — on first visit you create a local
owner account (n8n 2.x has no basic auth; this is not a cloud sign-up).

Set up the database and run the tests, in the same image:

```bash
docker compose --env-file .env -f infra/docker-compose.yml --profile tools run --rm tools run db:bootstrap
```

```bash
docker compose --env-file .env -f infra/docker-compose.yml --profile tools run --rm tools run db:seed
```

```bash
docker compose --env-file .env -f infra/docker-compose.yml --profile tools run --rm tools run smoke
```

If you do have Node on the host, `npm run docker:bootstrap`, `docker:seed`,
`docker:verify` and `docker:smoke` wrap those. `npm run verify` runs the 107
safety checks directly with no stack and no network.

After editing any workflow source, `npm run stack:reload` rebuilds the JSON,
re-imports it and restarts n8n.

Short of disk? `npm run disk:report` shows what Vigor costs and what is safe to
reclaim, and runs nothing itself.

## The system

```
                        ┌──────────────────────────────┐
                        │   apps/web  (Next.js 15)     │   chunk 3
                        │  anonymous bilingual intake  │
                        └──────────────┬───────────────┘
                        ┌──────────────▼───────────────┐
                        │ services/agents (FastAPI)    │   chunk 2
                        │  LangGraph: Intake → Risk →  │
                        │  Triage → Navigator          │
                        │  + deterministic risk engine │
                        └───┬──────────────────────┬───┘
                            ▼                      ▼
        ┌───────────────────────────────┐   ┌─────────────────────────┐
        │  n8n — orchestration spine    │◄──┤  MongoDB Atlas          │
        │  9 workflows                  │   │  + Atlas Vector Search  │
        └───────┬───────────────────────┘   └─────────────────────────┘
                ▼
    clinician queue · facility referral · at-home kits · user notification
```

**Stack:** Next.js 15 + FastAPI · LangGraph + Claude · MongoDB Atlas with Atlas
Vector Search · n8n 2.35 · Docker.

### Why n8n is the spine and not a bolt-on

Everything that happens *after* a risk signal is produced is a long-running,
multi-party, auditable process with humans in the loop. A clinician must see an
urgent case within an SLA. A referral must not leave the building without a
matching consent record. An at-home kit must be chased. A revocation must
cascade. That is workflow, not request/response — and putting it in n8n means
every side effect is inspectable, human oversight is a node rather than a TODO,
and the retry, SLA and idempotency behaviour comes from the engine.

## The nine workflows

| # | Workflow | Triggers | Owns |
| --- | --- | --- | --- |
| 01 | Intake → Risk & Triage | webhook | consent gate, red-flag gate, engine call, escalate-only reconciliation, routing |
| 02 | Red-flag Escalation & SLA Sweep | webhook + 5 min | raise, alert on-call, SLA clock, breach detection |
| 03 | Referral Dispatch & Completion | 2 webhooks | consent gate, review gate, facility match, scoped share token, facility callbacks |
| 04 | At-home Kit Logistics | webhook + daily | discreet kit order, courier, chase, expiry |
| 05 | Lab Result Ingestion | webhook | WHO 2021 flagging, append-only store, re-score, safe delivery |
| 06 | Re-engagement Nudge | 2-hourly | consent, quiet hours, frequency cap, opt-out |
| 07 | Consent Revocation Cascade | webhook | ledger, share tokens, reminders, erasure, receipt |
| 08 | Daily Metrics Rollup | nightly | outcome measures and fairness slices |
| 09 | Clinician Review | webhook | release, override, refusal of unsafe de-escalation |

Details in [docs/04-n8n-workflows.md](docs/04-n8n-workflows.md).

## Three decisions that define this build

### 1. The model can raise a clinical tier. Nothing can lower one.

A deterministic red-flag gate — nine pure functions over a closed symptom
vocabulary — runs **before** any model is consulted. The agent service proposes
a tier. Reconciliation clamps that proposal upward to the gate's minimum and
never downward. If the agent service is unreachable, the case is still routed
correctly by the gate alone, flagged `degraded: true`, and counted in the
nightly metrics.

Even a clinician cannot de-escalate across an emergency red flag through this
API. Workflow 09 refuses with a 422 and says where that decision belongs
instead. Every refused attempt is audited.

### 2. Revocation actually cascades, and issues a receipt

"You can withdraw at any time" is worth nothing if withdrawing leaves a share
token live in a clinic inbox. Workflow 07 writes the append-only revocation
entry, stamps the live consents, **revokes every outstanding share token** so
facility callbacks start failing, stops reminders on open kits and unfinished
assessments, optionally erases contact details and answers, and hands back a
specific, checkable receipt:

> 5 consents withdrawn · 2 active data shares revoked — any clinic link now
> fails · 1 kit reminder schedule stopped · 1 unfinished check will no longer be
> followed up

Smoke test 8 proves it: the share token works, the user revokes, the token
returns 401.

### 3. Fairness is reported as a gap, with the worst slice named

A dashboard full of per-group numbers lets you avoid the question. Workflow 08
computes completion rate per slice, then reports `maxCompletionGap` and
`worstSlice`, and raises `gapExceeded` past a 10-point threshold. The synthetic
cohort is generated with a *deliberately uneven* completion rate across locale
and age band, because a fairness metric that always reads zero proves nothing.

## Repository layout

```
apps/web/            Next.js 15 patient + clinician UI          chunk 3
services/agents/     FastAPI + LangGraph + risk engine          chunk 2
n8n/
  build.mjs          generates workflows/*.json from src/
  src/               readable workflow sources + shared clinical logic
  workflows/         generated, committed, importable
packages/contracts/  JSON Schema for every cross-boundary event
infra/               docker compose: n8n + optional local Mongo
tools/
  mongo-bootstrap.js collections, indexes, schema validators
  seed-cohort.js     service catalogue, golden cases, synthetic cohort
  verify-contracts.js the safety floor, runnable with no dependencies
  smoke/             end-to-end tests against the live stack
  seed/golden-cases.json  16 clinical scenarios + 4 lab cases
docs/                architecture, data model, contracts, workflows, privacy, safety
```

### Why the workflow JSON is generated

A Code node's JavaScript becomes a single escaped string inside an n8n export,
so a hand-maintained workflow has no reviewable diff. In a system where the
red-flag gate is the safety floor, "changes to it cannot be reviewed" is not an
acceptable property. The sources in `n8n/src/` produce the JSON, and
`npm run workflows:check` fails if the committed output has drifted. The builder
also refuses to emit a workflow with an unreachable node, a dangling edge, a
webhook with no response node, a Mongo node with no credential, or a Code node
referencing a name that does not exist.

## Documentation

| | |
| --- | --- |
| [HANDOFF.md](HANDOFF.md) | **start here if you are picking this up cold** — status, invariants, traps, what is next |
| [01-architecture.md](docs/01-architecture.md) | system shape, agent design, build order |
| [02-data-model.md](docs/02-data-model.md) | 13 collections, indexes, what each field is for |
| [03-event-contracts.md](docs/03-event-contracts.md) | every endpoint, worked examples, error semantics |
| [04-n8n-workflows.md](docs/04-n8n-workflows.md) | setup, the nine workflows, shared patterns |
| [05-privacy-and-consent.md](docs/05-privacy-and-consent.md) | consent ledger, share tokens, encryption, cultural requirements, and what we refuse to do |
| [06-clinical-safety.md](docs/06-clinical-safety.md) | red-flag catalogue, WHO limits, override rules, known limitations |
| [07-docker-and-storage.md](docs/07-docker-and-storage.md) | the zero-new-image stack, storage guards, and two n8n 2.x traps |

## What is next

- **Chunk 2 — agent service.** The deterministic risk engine with unit tests,
  then the LangGraph pathway (Intake → Risk → Triage → Navigator) on top, then
  the eval harness over the golden cases.
- **Chunk 3 — web app.** Bilingual anonymous intake, explainable results, the
  consent and privacy centre, the clinician review console.
- **Chunk 4 — evidence.** Run the synthetic cohort end to end and report triage
  accuracy, red-flag sensitivity, time to appropriate evaluation, referral
  completion and fairness slices.

## Licence

Not yet licensed. Hackathon prototype.
