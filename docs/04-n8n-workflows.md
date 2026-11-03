# Vigor — The n8n orchestration spine

Nine workflows, 248 nodes. Each owns one lifecycle end to end rather than one
step of several, so there is exactly one place to look when something goes wrong
with referrals, or kits, or escalations.

| # | Workflow | Triggers | Nodes | Owns |
| --- | --- | --- | --- | --- |
| 01 | Intake Completed → Risk & Triage | webhook | 33 | the assessment: consent gate, red-flag gate, engine call, reconciliation, routing |
| 02 | Red-flag Escalation & SLA Sweep | webhook + `*/5 * * * *` | 27 | the escalation: raise, alert, SLA clock, breach |
| 03 | Referral Dispatch & Completion | 2 webhooks | 47 | the referral: consent, review gate, facility match, share token, status callbacks |
| 04 | At-home Kit Logistics | webhook + `0 9 * * *` | 33 | the kit: order, courier, chase, expiry |
| 05 | Lab Result Ingestion & Re-score | webhook | 26 | the result: WHO flagging, append-only store, re-score, safe delivery |
| 06 | Re-engagement Nudge | `0 */2 * * *` | 16 | the nudge: consent, quiet hours, frequency cap |
| 07 | Consent Revocation Cascade | webhook | 27 | revocation: ledger, tokens, reminders, erasure, receipt |
| 08 | Daily Metrics Rollup | `30 0 * * *` | 14 | the evidence: outcome measures and fairness slices |
| 09 | Clinician Review | webhook | 25 | human oversight: release, override, refusal of unsafe overrides |

## How these are maintained

The committed JSON in `n8n/workflows/` is **generated**. The sources are in
`n8n/src/`:

```
n8n/
  build.mjs                  node n8n/build.mjs        → writes workflows/*.json
                             node n8n/build.mjs --check → fails if they drifted
  src/
    lib.mjs                  node factories, grid positioning, graph assembly
    shared.mjs               the red-flag gate, consent gate, WHO limits, notify policy
    w01-intake-completed.mjs
    ...
  workflows/*.json           generated, committed, what you import into n8n
```

The reason is simple: a Code node's JavaScript becomes a single escaped string
inside the export JSON, so a hand-maintained workflow has no reviewable diff. In
a system where the red-flag gate is the safety floor, "you cannot review changes
to it" is not an acceptable property. With the builder, a change to the gate is
a normal diff in `shared.mjs`, and `--check` in CI stops the committed JSON from
drifting away from it.

`build.mjs` also refuses to emit a workflow that has an unreachable node, a
dangling edge, a webhook with no response node, a Mongo node with no credential,
or a Code node referencing a node name that does not exist. A workflow that
imports cleanly but silently skips a node is worse than one that fails to build,
because here a skipped node can mean an unsent escalation.

## Setup

```bash
cp .env.example .env     # fill in MONGODB_URI, VIGOR_INTERNAL_TOKEN, N8N_ENCRYPTION_KEY
docker compose --env-file .env -f infra/docker-compose.yml up -d
```

That is the whole setup. The `n8n-init` service runs once, before n8n starts,
and does what used to be two manual UI steps:

1. creates the MongoDB credential named `Vigor Atlas` from `MONGODB_URI` — the
   id is fixed (`VigorAtlas`, see `MONGO_CREDENTIALS` in `n8n/src/lib.mjs`), so
   the imported workflows bind to it without anyone choosing it from a dropdown;
2. imports the nine workflows and activates all nine.

n8n only starts once that has exited successfully, so there is never a window
where a webhook exists but is inactive — which was the single most common reason
a demo returned 404 from every endpoint.

Database setup and tests run in the same image, so nothing is needed on the host:

```bash
docker compose --env-file .env -f infra/docker-compose.yml --profile tools run --rm tools run db:bootstrap
docker compose --env-file .env -f infra/docker-compose.yml --profile tools run --rm tools run db:seed
docker compose --env-file .env -f infra/docker-compose.yml --profile tools run --rm tools run smoke
```

After editing a workflow source:

```bash
npm run stack:reload
```

This rebuilds the JSON, re-runs `n8n-init` (re-import updates in place, because
the workflow ids are stable) and restarts n8n. The restart matters — the n8n CLI
warns that activation changes do not take effect while n8n is running.

### Why activation is its own step

`n8n import:workflow` has an `--activeState=fromJson` flag that looks like it
should do this. It does not work in a normal single-instance deployment:

```
The "--activeState=fromJson" flag can only be used when n8n is running in
queue or multi-main mode. In regular deployment mode, workflow activation
is not supported.
```

and passing it **aborts the whole import**. The only CLI route to activation is
`n8n publish:workflow --id=<id>`, one id at a time. That is why
`n8n/build.mjs` assigns stable ids (`vigor01` … `vigor09`) and writes
`n8n/workflows.manifest.json`; `bootstrap-n8n.sh` reads the ids from there and
loops. It takes about a minute, because the CLI reloads its schema per
invocation.

Two related traps, both found by running the import rather than reading docs,
and both covered in [07-docker-and-storage.md](07-docker-and-storage.md):

- **`$env` is blocked unless `N8N_BLOCK_ENV_ACCESS_IN_NODE` is the literal
  string `"false"`.** It backs expressions as well as Code nodes, and it is no
  longer in n8n's typed config schema, so nothing warns you.
- **Shared tags break `--separate` imports** with
  `SQLITE_CONSTRAINT: UNIQUE constraint failed: tag_entity.name`, because tags
  are created per file without deduplication. Vigor exports no tags.

### Verify

```bash
npm run verify     # workflow JSON matches source, and the 107 safety checks
npm run smoke      # fires all nine webhooks against the running stack
```

`verify` needs nothing running and no network.

## The patterns these workflows share

### One config node per trigger path

The first node after every trigger is a **`Vigor config`** Set node. It resolves
`$env` once per run into `$json.vigorConfig`, and it is the only node in the
project that touches `$env` at all — `npm run workflows:build` fails if any
other node does.

That is not tidiness for its own sake. n8n 2.x blocks env access unless
`N8N_BLOCK_ENV_ACCESS_IN_NODE` is the literal string `"false"`, and the setting
governs expressions as well as Code nodes. Confining it to one node means a
misconfigured instance produces one clearly-named failure instead of a hundred
scattered ones — and the expression catches that failure, falls back to
documented defaults, and reports `envBlocked: true` in the execution data so the
condition is visible rather than inferred.

`internalToken` deliberately falls back to an empty string, so the lab and
clinician endpoints fail **closed** rather than open.

Workflows with two trigger paths get two config nodes (`Vigor config` and
`Vigor config · sweep`), because a node is only readable by `$('name')` if it
actually ran on that path.

### Consent gate before anything else

Workflows 01, 03 and 04 read the whole consent ledger for the subject and pass
it to `evaluateConsent(docs, scope)` from `shared.mjs`. Expiry, revocation and
supersession all count as "not authorised". A refusal writes an audit record and
returns 403 with the scope that would unblock it.

### Escalate-only reconciliation

Workflows 01 and 05 both compute a deterministic minimum tier *before* calling
the model, then clamp the model's answer upward to it. The model can raise a
tier; nothing can lower one. `triage_decisions.clamped` records when this
happened, and workflow 08 reports the rate — a rising clamp rate means the model
is drifting away from the safety floor.

### Graceful degradation that announces itself

Every call to the agent service uses `onError: continueRegularOutput` with
retries. If the service is down, workflow 01 still routes the case using the
deterministic gate, marks the risk score `degraded: true`, tells the user the
result is partial, and workflow 08 counts it. A system that quietly degrades is
worse than one that fails loudly.

### Webhook hand-offs instead of sub-workflows

Workflow 01 escalates by calling workflow 02's webhook rather than invoking it
as a sub-workflow. That gives the escalation its own execution record, its own
retry policy and its own SLA clock — and makes it independently replayable,
which matters when the thing you are replaying is "a clinician was supposed to
be told about a possible torsion".

### Sentinel rows in the revocation cascade

An n8n branch stops when a node emits zero items. In workflow 07 that would
silently skip later steps of the cascade, so each step always emits at least one
row, using a key (`__noop__`) that matches no document when there is nothing to
do. The update is a harmless no-op and the cascade always runs to completion.
That is a slightly ugly pattern, chosen deliberately in the one workflow that
must never half-complete.

### Audit on every path, including the refusals

Twelve distinct `audit_log` actions are written across the nine workflows,
including `PROCESSING_REFUSED_NO_CONSENT`, `REFERRAL_BLOCKED_NO_CONSENT`,
`REFERRAL_HELD_PENDING_REVIEW`, `REVIEW_OVERRIDE_REFUSED` and
`ESCALATION_SLA_BREACHED`. Logging only the successes would make the audit trail
a marketing document.

## What is still stubbed

These are deliberate boundaries for chunk 1, not oversights:

- `POST /internal/v1/score-and-triage`, `/rescore-with-result`,
  `/notify-clinician`, `/dispatch-referral` and `/logistics/book` are the agent
  service, which is chunk 2. Until it exists, those calls fail and the
  degradation path is what runs — which is why the degradation path was built
  first.
- Outbound email and SMS are not wired. `NOTIFY_MODE=DEMO` writes the
  `notifications` row with its exact text and recipient policy, and sends
  nothing. The row is the auditable artefact; the transport is a detail.
- Clinician authentication is a shared key. Production needs the clinician's own
  federated identity, as noted in [06-clinical-safety.md](06-clinical-safety.md).
