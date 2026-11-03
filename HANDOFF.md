# Vigor — Handoff

> **Purpose of this file.** Everything another engineer or AI agent needs to pick
> this project up cold. Read this first, then `docs/01-architecture.md`.
>
> Last updated: 2026-11-03. Chunk 1 of 4 complete and verified running.

---

## 1. What this is

A hackathon project for an **Abu Dhabi male reproductive health challenge**.

**The problem as given:** male reproductive health is treated as a late-stage
infertility issue rather than routine preventive care. Men typically enter the
pathway only after prolonged difficulty conceiving, often after the female
partner has already been assessed. That delays detection of modifiable
metabolic, lifestyle, infectious, anatomical and semen-related risk factors.

**The brief asks for:** earlier explainable risk identification; a culturally
trusted experience respecting religious and social sensitivities; lower-friction
assessment (private digital intake, teleconsultation, at-home steps); safe
triage and referral with explicit red flags and human oversight; privacy by
design; and demonstrable value on realistic or simulated cases including
fairness across population groups.

**What we built:** *Vigor* — a confidential, anonymous-first, bilingual
(English/Arabic) front door. A man completes an assessment alone, in under ten
minutes, without an account, and receives an explained risk picture plus a
concrete next step. Everything downstream — clinician escalation, consent-gated
referral, at-home test kits, lab ingestion, revocation, metrics — is an
auditable workflow.

**Required technologies** (hackathon constraint): n8n, agentic AI, generative
AI. All three are central, not decorative.

## 2. Tech stack (chosen by the user, do not change without asking)

| Layer | Choice |
| --- | --- |
| Frontend | **Next.js 15** (App Router) |
| Backend | **FastAPI** (Python) — separate service |
| Agents | **LangGraph + Claude** |
| Database | **MongoDB Atlas + Atlas Vector Search** |
| Orchestration | **n8n** (currently 2.35.7) |
| Runtime | Docker Compose |

Two of these were against my recommendation (I suggested Supabase/Postgres, and
building the agent service before the workflows). The user chose MongoDB and
n8n-first. **Those are settled decisions — build on them.**

Because Atlas has no row-level security, privacy protections that would live in
Postgres RLS are implemented at application level instead: AES-256-GCM field
encryption, an append-only consent ledger that every workflow checks, and
pseudonymous ids. This weakness is documented honestly in
`docs/05-privacy-and-consent.md` §5 rather than hidden.

## 3. Build order

| Chunk | Scope | Status |
| --- | --- | --- |
| **1** | Orchestration spine: event contracts, Mongo schema, 9 n8n workflows, synthetic cohort, test harness | **DONE, running, verified** |
| **2** | `services/agents` — deterministic risk engine + LangGraph pathway + eval harness | **NEXT** |
| **3** | `apps/web` — bilingual anonymous intake, explainable results, consent centre, clinician console | not started |
| **4** | Evidence: run the cohort end to end, report triage accuracy, red-flag sensitivity, time-to-evaluation, referral completion, fairness | not started |

The user works **chunk by chunk** and asked to be consulted interactively on
decisions. Do not build ahead.

## 4. Current state — verified facts

- **9 workflows, 257 nodes**, all imported and active in n8n.
- **107/107** safety checks pass offline (`npm run verify`, no stack or network).
- **37/37** end-to-end smoke tests pass against the live stack
  (`npm run docker:smoke`). Four of them assert the system correctly *refuses*.
- **30 days of metrics** backfilled from a 900-subject synthetic cohort.
- **51 files**, zero dependencies beyond `mongodb`, `ajv`, `ajv-formats`.
- **Docker footprint: ~286 MB**, zero new images (see §8).
- **Not under git yet.** This is the biggest outstanding risk — several hours of
  work with no version control. `git init` should be step one.
- Docker Desktop may be stopped; `npm run stack:up` resumes it. Volumes persist.

Pooled metrics from the synthetic cohort (sanity-check numbers, not claims):

```
assessments started -> completed : 872 -> 704 (80.7%)
tiers    : SELF_CARE 168 · PRIMARY_CARE 302 · ANDROLOGY_UROLOGY 222 · URGENT 12
referrals: 281 dispatched -> 77 completed
escalations: 12 raised, 8 within SLA, 4 breaches
fairness : Arabic 78.4% vs English 83.9%  -> 5.5 pt gap (worst: ar)
           18-24 78.0% vs 40+ 82.5%       -> 4.5 pt gap (worst: 18-24)
```

The cohort generator deliberately produces an uneven completion rate by locale
and age band, so the fairness metric is not vacuously zero. Those pooled gaps
match the generator's intent, which is how we know the measurement works.

## 5. Architecture

```
          apps/web (Next.js 15)                      chunk 3
          anonymous bilingual intake
                    |
          services/agents (FastAPI)                  chunk 2
          LangGraph: Intake -> Risk -> Triage -> Navigator
          + deterministic risk engine + red-flag gate
                    |
          n8n (9 workflows) <--> MongoDB Atlas        chunk 1 (done)
                    |
     clinician queue · facility referral · kits · notifications
```

### Why n8n is the spine, not a bolt-on

Everything *after* a risk signal is produced is long-running, multi-party and
auditable, with humans in the loop: a clinician must see an urgent case within
an SLA; a referral must not leave the building without a matching consent
record; an at-home kit must be chased; a revocation must cascade. That is
workflow, not request/response. Putting it in n8n makes every side effect
inspectable, human oversight a node rather than a TODO, and retries/SLA/
idempotency the engine's job.

### The nine workflows

Each owns one **lifecycle** end to end, so there is exactly one place to look
when referrals, or kits, or escalations misbehave.

| # | Id | Workflow | Triggers | Nodes |
| --- | --- | --- | --- | --- |
| 01 | `vigor01` | Intake → Risk & Triage | webhook | 33 |
| 02 | `vigor02` | Red-flag Escalation & SLA Sweep | webhook + `*/5 * * * *` | 27 |
| 03 | `vigor03` | Referral Dispatch & Completion | 2 webhooks | 47 |
| 04 | `vigor04` | At-home Kit Logistics | webhook + `0 9 * * *` | 33 |
| 05 | `vigor05` | Lab Result Ingestion & Re-score | webhook | 26 |
| 06 | `vigor06` | Re-engagement Nudge | `0 */2 * * *` | 16 |
| 07 | `vigor07` | Consent Revocation Cascade | webhook | 27 |
| 08 | `vigor08` | Daily Metrics Rollup | `30 0 * * *` + webhook (backfill) | 23 |
| 09 | `vigor09` | Clinician Review (human in the loop) | webhook | 25 |

Endpoints are listed in `docs/03-event-contracts.md`; payloads are defined once
in `packages/contracts/events.schema.json`.

## 6. Non-negotiable invariants

**Break any of these and the project loses its point.** They are enforced in
code and asserted by tests, not left to convention.

1. **The model can raise a clinical tier. Nothing can lower one.**
   A deterministic red-flag gate — 9 pure functions over a *closed* symptom
   vocabulary — runs **before** any model call. The agent service proposes a
   tier; reconciliation clamps it upward to the gate's minimum and never
   downward. `triage_decisions.clamped` records when this happened, and
   `metrics_daily.safetyClampRate` reports the rate (a rising rate means model
   drift away from the safety floor).

2. **Screening is not diagnosis.** Every response carries a `boundary` object
   with `isDiagnosis: false` and a plain-language statement. It is in the
   *payload*, not just UI copy, so it cannot be lost downstream.

3. **No consent, no action.** `consents` is an append-only ledger. Workflows
   01, 03 and 04 read it and call `evaluateConsent(docs, scope)`. Expired,
   revoked and superseded all count as "not authorised". Refusals are audited.

4. **Human oversight is a gate, not a label.** When `requiresHumanReview` is
   true, workflow 03 *refuses* to dispatch a referral (202, `dispatched: false`)
   until workflow 09 releases it. Workflow 02 sweeps every 5 minutes and marks
   unacknowledged escalations `breached`.

5. **A clinician cannot de-escalate across an emergency red flag** through this
   API (422). De-escalation otherwise requires a written justification ≥20 chars
   recorded against their id. Refused attempts are audited as
   `REVIEW_OVERRIDE_REFUSED` so a pattern is visible.

6. **Severe lab findings are never auto-delivered.** Azoospermia and severe
   oligozoospermia set `withholdsDetail: true`; the user is told a clinician
   will go through it with them. The notification body contains no values.

7. **Revocation actually cascades** and returns a specific, checkable receipt.
   It kills share tokens so facility callbacks start failing. Smoke test 8
   proves it: token works → revoke → token returns 401.

8. **Data minimisation, including from clinicians.** Facilities receive bands
   and codes, never answer values or free text. `audit_log.meta` records *that*
   something happened, never what was said — enforced by a MongoDB validator.

9. **Degradation announces itself.** If the agent service is unreachable the
   case is still routed by the gate, marked `degraded: true`, shown to the user
   as partial, and counted in `metrics_daily.degradedScoreRate`.

10. **Cultural requirements are functional, with code behind them.** Full
    Arabic parity in every user-facing string including urgent guidance; no
    assumptions about family intent (golden case GC12 asserts this); male
    clinician availability and language are *matching criteria* in referral
    scoring; locker/pickup delivery is the default for kits; skipping any
    question is always allowed and recorded so the result can state its own
    uncertainty.

## 7. The build toolchain — read before editing workflows

**`n8n/workflows/*.json` is GENERATED. Never edit it by hand.**

```
n8n/
  build.mjs                 node n8n/build.mjs          -> writes workflows/*.json
                            node n8n/build.mjs --check  -> fails on drift
  src/lib.mjs               node factories, grid layout, graph assembly, configNode
  src/shared.mjs            red-flag gate, consent gate, WHO 2021 limits, notify policy
  src/w01..w09-*.mjs        one file per workflow
  workflows/*.json          generated, committed, imported by n8n-init
  workflows.manifest.json   generated: ids/triggers/node counts (NOT inside workflows/)
```

**Why generated:** a Code node's JavaScript becomes one escaped string inside an
n8n export, so a hand-maintained workflow has no reviewable diff. When the
red-flag gate *is* the safety floor, "changes to it cannot be reviewed" is not
acceptable.

### The builder refuses to emit

Each of these rules exists because the corresponding bug actually happened:

- an unreachable node, or an edge to/from a node that does not exist
- a webhook trigger with no `respondToWebhook` node
- a MongoDB node with no credential reference
- a Code node whose JavaScript does not parse
- a Code node referencing a node name that does not exist
- **any node other than a `Vigor config` node reading `$env`**
- **two different triggers reachable from one node** (deadlock — see §9)
- **a Mongo read chained after another Mongo read without `executeOnce`** (§9)
- **a lone `\d`-style escape in a source file** (template literals eat it — §9)
- two nodes whose generated ids collide

### Configuration

All runtime config is resolved by a **`Vigor config`** Set node at the head of
each trigger path, read downstream as `$json.vigorConfig`. It is the only place
in the project that touches `$env`. Fields: `agentServiceUrl`, `internalToken`
(falls back to `''` so auth fails **closed**), `notifyMode`, `oncallEmail`,
`escalationSlaMinutes`, `quietHoursStart/End`, `webhookBase`, `envBlocked`.

## 8. Running it

Docker only; nothing is installed on the host. **There is no Dockerfile** —
all three services share one image (`n8nio/n8n:latest`, which ships Node 24 and
therefore runs the repo tooling too), so Vigor adds **zero new image bytes** and
never touches the build cache. This was a hard requirement: the user's machine
is short on disk.

```bash
cp .env.example .env                      # fill MONGODB_URI, VIGOR_INTERNAL_TOKEN, N8N_ENCRYPTION_KEY
npm run stack:up                          # n8n-init imports + activates, then n8n starts
npm run docker:bootstrap                  # collections, indexes, validators
npm run docker:seed                       # catalogue, 16 golden cases, synthetic cohort
npm run docker:smoke                      # 37 end-to-end tests
npm run verify                            # 107 safety checks, no stack needed
npm run stack:status                      # is the running stack identical to disk?
npm run metrics:backfill                  # 30 days of metrics_daily
npm run disk:report                       # footprint + what is safe to reclaim
```

After editing any workflow source: **`npm run stack:reload`** (rebuild →
re-import → restart n8n). A `restart` alone does **not** pick up compose changes.

`n8n-init` is a one-shot container that creates the `Vigor Atlas` MongoDB
credential from `MONGODB_URI`, imports the nine workflows, and activates each
one. n8n only starts after it exits 0.

**MongoDB:** Atlas is the documented default (zero local disk). The current
local demo runs the opt-in `--profile local-db` Mongo container because no Atlas
account was wired up. Switching is a one-line `.env` change.

**n8n UI:** <http://localhost:5678>. n8n 2.x has no basic auth — you create a
local owner account on first visit. The webhooks do **not** need a session, so
the whole system works whether or not anyone is logged in.

## 9. n8n 2.x behaviours that cost real debugging time

All found by running the thing, not by reading docs. Full write-ups in
`docs/07-docker-and-storage.md` §4. **An agent continuing this work should read
that section before touching workflows.**

1. **`$env` is blocked by default.**
   `isEnvAccessBlocked = process.env.N8N_BLOCK_ENV_ACCESS_IN_NODE !== 'false'` —
   blocked unless that var is the literal string `"false"`. It backs ordinary
   expressions as well as Code nodes and is no longer in n8n's typed config
   schema, so nothing warns you.

2. **A node runs once per input item.** The worst one. Workflow 08 chained seven
   Mongo reads that query by date window, not by input item. Empty days gave
   `1×1×1…` and worked; with data, 44 assessments → 44 queries → 1,540 → millions.
   No error, no log, no timeout — the execution never finished and the webhook
   hung forever. Fixed with `executeOnce: true`.

3. **`upsert` is a top-level node parameter, not `options.upsert`.** Putting it
   in `options` reads as undefined: the node does a plain update, matches
   nothing, writes nothing, and reports **success**. A "successful" rollup left
   `metrics_daily` empty with an audit record saying it worked.

4. **The Mongo node coerces `updateKey` through `new ObjectId()`** when
   `updateKey === '_id'`. `metrics_daily` originally used the date string as
   `_id` for idempotency → `BSONError`, node dies before output, webhook hangs.
   Now keyed on `dateKey` with a unique index.

5. **`--activeState=fromJson` is rejected outside queue/multi-main mode** and
   **aborts the entire import**. Activation must be `n8n publish:workflow
   --id=<id>`, one at a time. Hence stable ids and the manifest.

6. **Shared tags break `--separate` imports** with
   `UNIQUE constraint failed: tag_entity.name`. Vigor exports no tags.

7. **Webhook registration lags `/healthz`.** Reload-then-call races; probe the
   real endpoint until it stops returning 404.

8. **Template literals eat escapes.** A `\d` inside a Code-node template literal
   becomes `d`, producing valid-but-wrong JavaScript that no parser flags. Use
   `[0-9]`. The builder now lints raw source for this.

**Debuggability note:** `saveExecutionProgress` is **off** (a disk decision), so
`runData` in n8n's database is empty until an execution completes. That makes
stalls nearly unobservable. Turn it on temporarily when debugging.

## 10. Data model — 13 collections

Full detail in `docs/02-data-model.md`. Two rules hold everywhere: **no direct
identifiers in clinical collections** (they key on `pseudonymId` only), and
**append-only where it matters** (`consents`, `audit_log`, `lab_results`).

`subjects` · `consents` · `assessments` · `risk_scores` · `triage_decisions` ·
`escalations` · `referrals` · `kit_orders` · `lab_results` · `notifications` ·
`audit_log` · `metrics_daily` · `service_catalogue` · `kb_chunks`

Triage tiers, ordered by **clinical acuity** (the escalate-only clamp compares
positions in this list):

```
SELF_CARE < PRIMARY_CARE < FERTILITY_SERVICES < ANDROLOGY_UROLOGY < URGENT
```

`FERTILITY_SERVICES` sits below `ANDROLOGY_UROLOGY` because a man routed to
andrology has something needing investigation, while a fertility referral may
involve nothing wrong at all (e.g. post-vasectomy).

## 11. Clinical content

`docs/06-clinical-safety.md` is the authority. **Status: not clinically
validated** — the catalogue and thresholds were written against standard
urology/andrology urgency practice and need clinician sign-off.
`tools/seed/golden-cases.json` carries `reviewStatus: awaiting_clinical_sign_off`.

**9 red flags:** acute scrotal pain (torsion window ≤6h), testicular mass,
priapism, GU trauma, acute urinary retention, febrile GU infection, pituitary
suspicion, bilateral uncorrected undescended testes, absent vas deferens.

**WHO 2021 (6th ed.) semen lower reference limits**, in `n8n/src/shared.mjs` and
asserted by the verifier: volume 1.4 mL, total count 39 M, concentration
16 M/mL, total motility 42%, progressive motility 30%, normal forms 4%,
vitality 54%. A single abnormal sample is **not** a diagnosis — the pathway asks
for a confirmatory sample.

**16 golden cases + 4 lab cases** in `tools/seed/golden-cases.json`. Each states
what the *deterministic gate* must produce (the safety floor, must never
regress) and what the full engine should produce (tunable). **GC16 is a
deliberate near-miss** — scrotal ache, gradual onset — that must NOT escalate,
because a gate that over-triggers floods the clinician queue and destroys trust.

## 12. Chunk 2 — what to build next

`services/agents/README.md` has the planned module layout. The n8n workflows
**already call these endpoints**, all with `onError: continueRegularOutput`, so
the system works without them today (that is why the degradation path was built
first):

| Endpoint | Called by | Purpose |
| --- | --- | --- |
| `POST /internal/v1/score-and-triage` | wf 01 | risk score + proposed tier |
| `POST /internal/v1/rescore-with-result` | wf 05 | re-score after a lab result |
| `POST /internal/v1/notify-clinician` | wf 02 | on-call escalation alert |
| `POST /internal/v1/dispatch-referral` | wf 03 | deliver referral to facility |
| `POST /internal/v1/logistics/book` | wf 04 | book a discreet courier |

All authenticate with `X-Vigor-Signature: $VIGOR_INTERNAL_TOKEN`.

The response shape workflow 01 expects is in
`n8n/src/w01-intake-completed.mjs` → node `Reconcile · escalate only`:
`{ modelVersion, domains[], overall{score,band,confidence}, missingInputs[],
triage:{tier, redFlags[], rationale, requiresHumanReview} }`.

**Agent design** (from `docs/01-architecture.md`): a LangGraph state machine,
not a chat loop.

| Agent | Job | Guardrail |
| --- | --- | --- |
| Intake | adaptive history-taking | question bank is FIXED; model picks order and phrasing, never clinical content |
| Risk | explains the deterministic score | may only narrate drivers it was given |
| Triage | proposes tier + rationale | red-flag gate runs first and can only escalate |
| Navigator | turns tier into a plan | service catalogue is data; no invented facilities |

Use `interrupt_before` on anything with `requiresHumanReview`, handed to
workflow 09.

**Known duplication to resolve:** the red-flag catalogue will exist in both
`n8n/src/shared.mjs` and `risk_engine/red_flags.py`. Intended fix: generate both
from one declarative catalogue, with the verifier asserting parity. Do not let
them drift silently.

## 13. Open items and honest gaps

- **Not under git.** Do this first.
- **No clinical sign-off.** Everything clinical is provisional.
- **Risk weights are not epidemiologically calibrated** — clinically plausible,
  not fitted to an Abu Dhabi population.
- **Fairness is measured on completion, not accuracy.** Detects access inequity;
  does not detect differential accuracy across groups (needs labelled outcomes).
- **Daily fairness gaps are statistical noise** at ~30 assessments/day (they
  swing 0.007–0.4). Only the pooled figures mean anything, and `gapExceeded`
  firing on most individual days reflects that noise, not 29 real failures.
  **Should be smoothed to a 7-day window before anyone presents it.**
- **Clinician identity is a shared key.** Production needs federated identity so
  `reviewedBy` is attributable.
- **Lab integration is a webhook + shared key.** Real labs need mTLS and an
  HL7/FHIR adapter.
- **Outbound email/SMS not wired.** `NOTIFY_MODE=DEMO` writes the
  `notifications` row with exact text and recipient policy, sends nothing.
- **The fallback gate over-triages by design** (never produces `SELF_CARE`).
  Correct bias for a degraded safety system, but it costs capacity — hence
  `degradedScoreRate` monitoring.
- **No partner pathway.** Male and female infertility need distinct models; this
  system models only the male side, deliberately.
- **`stack:status` uses file mtimes**, so a fresh `git clone` resets them and
  its compose-vs-container check can read as stale when it is not.
- **n8n UI workflow list reportedly appeared empty** for the user after login,
  while the backend was confirmed healthy (n8n logs `Processed 0 draft
  workflows, 9 published workflows`, all activated, correct project ownership,
  `isArchived=0`). Suspected stale cached frontend/localStorage on
  `localhost:5678` from the user's other n8n projects. **Unresolved** — try a
  private window or clearing site data. The webhooks work regardless.

## 14. Working style the user expects

- **Chunk by chunk.** Do not build ahead.
- **Ask interactively** on real decisions rather than assuming.
- **Verify, do not assert.** Several bugs here were found only by running
  things; every claim of "it works" in this repo is backed by a command whose
  output was read.
- The user is building this for a hackathon **and as a portfolio piece**, so
  engineering quality and a defensible story both matter.

## 15. File map

```
README.md                        overview + quick start
HANDOFF.md                       this file
docs/01-architecture.md          system shape, agent design, build order
docs/02-data-model.md            13 collections, indexes, field purposes
docs/03-event-contracts.md       endpoints, worked examples, error semantics
docs/04-n8n-workflows.md         setup, the nine workflows, shared patterns
docs/05-privacy-and-consent.md   consent ledger, tokens, encryption, culture, refusals
docs/06-clinical-safety.md       red flags, WHO limits, override rules, limitations
docs/07-docker-and-storage.md    zero-image stack, storage guards, n8n 2.x traps
infra/docker-compose.yml         n8n + n8n-init + tools + optional mongo
infra/init/bootstrap-n8n.sh      one-shot: credential, import, activate (LF only!)
n8n/                             workflow sources + generated JSON (see §7)
packages/contracts/              events.schema.json — every cross-boundary payload
tools/mongo-bootstrap.js         collections, indexes, schema validators
tools/seed-cohort.js             catalogue, golden cases, synthetic cohort (seeded RNG)
tools/verify-contracts.js        107 safety checks, no deps on a running stack
tools/smoke/run-smoke.js         37 end-to-end tests
tools/backfill-metrics.js        metrics_daily backfill with readiness probe
tools/stack-status.js            is the running stack identical to disk?
tools/disk-report.js             Docker footprint, safe reclaim commands
tools/ids.js                     shared id conventions
apps/web/README.md               chunk 3 plan
services/agents/README.md        chunk 2 plan + endpoint contracts
```
