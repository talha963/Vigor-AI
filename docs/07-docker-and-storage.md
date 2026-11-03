# Vigor — Docker and storage

The whole stack runs in Docker, nothing is installed on the host, and Vigor is
designed to add **as close to zero new disk as possible**. This document explains
how, and what to do when the machine is already full.

---

## 1. Zero new images

Three services — `n8n`, `n8n-init` and `tools` — all run **one** image,
`${N8N_IMAGE}`, defaulting to `n8nio/n8n:latest`.

| Service | What it does | Image cost |
| --- | --- | --- |
| `n8n-init` | one-shot: imports the credential and the nine workflows, activates them, exits | shared |
| `n8n` | the workflow engine | shared |
| `tools` | runs `db:bootstrap`, `db:seed`, `verify`, `smoke` | shared |
| `mongo` | opt-in offline database, `--profile local-db` | ~1.3GB when enabled |

That works because the n8n image ships **Node 24**, so it can run the repo
tooling directly. There is no second Node image, no Dockerfile, and therefore
**no build-cache growth** — which matters, because on a developer machine the
build cache is usually the largest single consumer of disk.

MongoDB defaults to **Atlas**, which costs zero local bytes. The local `mongo`
service exists only for an offline demo and is behind a profile so it is never
pulled unless asked for.

### Pin the image before you rely on it

`latest` is the default specifically because it is likely already on disk. That
is a storage decision, not an engineering one. For anything reproducible, pin
it:

```bash
docker image inspect n8nio/n8n:latest --format '{{index .RepoDigests 0}}'
```

Put the resulting `n8nio/n8n@sha256:...` in `N8N_IMAGE` in `.env`.

Note that the version matters more than usual here: this build is verified
against **n8n 2.35.7**, and section 4 covers two behaviours that differ between
major versions.

## 2. Keeping the one growing thing bounded

The only Vigor artefact that grows is the `n8n-data` volume: n8n's SQLite
database plus execution history. Vigor saves **full execution data**, including
successes, because an escalation that did not fire is a clinical-safety event
and must be inspectable afterwards. Unbounded, that would be the biggest disk
risk in the stack.

So the compose file sets:

| Setting | Value | Why |
| --- | --- | --- |
| `EXECUTIONS_DATA_PRUNE` | `true` | prune at all |
| `EXECUTIONS_DATA_MAX_AGE` | `72` (hours) | three days of history in n8n |
| `EXECUTIONS_DATA_PRUNE_MAX_COUNT` | `250` | hard ceiling regardless of age |
| `N8N_DEFAULT_BINARY_DATA_MODE` | `default` | keep binary in memory, never write it to the volume |
| `DB_SQLITE_VACUUM_ON_STARTUP` | `true` | actually return freed pages to the filesystem |

And in every workflow (`n8n/src/lib.mjs`):

| Setting | Value | Why |
| --- | --- | --- |
| `saveExecutionProgress` | `false` | progress saving writes node output *after every node*, multiplying writes |
| `saveDataErrorExecution` | `all` | failures must be fully debuggable |
| `saveDataSuccessExecution` | `all` | bounded by the pruning above |

Losing n8n history after three days is acceptable because it is not the audit
record. The durable record is the `audit_log` collection in MongoDB, which every
workflow writes to and which nothing prunes.

If disk is very tight, lower `EXECUTIONS_DATA_MAX_AGE` to `24` and
`EXECUTIONS_DATA_PRUNE_MAX_COUNT` to `50` in `.env`. Nothing in the system
depends on n8n's own history.

## 3. Running everything without installing anything

```bash
cp .env.example .env     # fill in MONGODB_URI, VIGOR_INTERNAL_TOKEN, N8N_ENCRYPTION_KEY
```

```bash
docker compose --env-file .env -f infra/docker-compose.yml up -d
```

`n8n-init` runs first and does the work that used to be two manual UI steps:
creates the `Vigor Atlas` MongoDB credential from `MONGODB_URI`, imports the
nine workflows, and activates each one. `n8n` only starts once that has exited
successfully, so there is no window where a webhook exists but is inactive.

Then, in the same image:

```bash
docker compose --env-file .env -f infra/docker-compose.yml --profile tools run --rm tools run db:bootstrap
```

```bash
docker compose --env-file .env -f infra/docker-compose.yml --profile tools run --rm tools run db:seed
```

```bash
docker compose --env-file .env -f infra/docker-compose.yml --profile tools run --rm tools run smoke
```

`npm` is the container's entrypoint, which is why the argument reads
`run db:seed`. If you do have Node on the host, `npm run docker:seed` and
friends wrap these.

The `tools` service talks to n8n as `http://n8n:5678/` over the compose network,
so the smoke test does not depend on the host port mapping.

### After editing a workflow

```bash
npm run stack:reload
```

That rebuilds the JSON, re-runs `n8n-init` (re-import is an update in place,
because the workflow ids are stable), and restarts n8n. The restart is
necessary: the n8n CLI prints *"Changes will not take effect if n8n is
running"*, and it means it.

## 4. Six n8n 2.x behaviours that cost real time to discover

All of these were found by running the thing rather than by reading docs, and
each is worth knowing before touching this stack.

### `$env` is blocked by default

```js
// n8n-workflow/dist/cjs/workflow-data-proxy-env-provider.js
const isEnvAccessBlocked = process.env.N8N_BLOCK_ENV_ACCESS_IN_NODE !== 'false';
```

Env access is **blocked unless that variable is the literal string `"false"`**.
It backs ordinary expressions as well as Code nodes, so without it every `$env`
reference in the project throws `access to env vars denied`. The variable no
longer appears in n8n's typed config schema, so nothing warns you in advance.

Vigor handles this three ways: the compose file sets it; `bootstrap-n8n.sh`
refuses to run if it is not exactly `"false"`; and all `$env` access is confined
to a single **`Vigor config`** Set node per trigger path, whose expression
catches the failure, falls back to documented defaults, and reports
`envBlocked: true` in the execution data. `npm run workflows:build` fails if any
other node reads `$env`.

### `--activeState=fromJson` does not work in a normal deployment

```
The "--activeState=fromJson" flag can only be used when n8n is running in
queue or multi-main mode. In regular deployment mode, workflow activation
is not supported.
```

Worse, passing it **aborts the entire import**. So import always lands workflows
deactivated, and activation is a separate step: `n8n publish:workflow --id=<id>`,
one id at a time. That is why the builder assigns stable ids (`vigor01` …
`vigor09`) and writes `n8n/workflows.manifest.json` — the bootstrap script reads
the ids from there and loops. It takes about a minute, because the n8n CLI
reloads its schema on every invocation.

A third, smaller one: `n8n import:workflow --separate` creates tags per file
without deduplicating them, so two workflows sharing a tag abort the import with
`SQLITE_CONSTRAINT: UNIQUE constraint failed: tag_entity.name`. Vigor therefore
does not export tags at all; the declared tags live in the build manifest.

### A node runs once per input item

This is the one that cost the most. An n8n node executes **once for every item
on its input**. Workflow 08 chained seven MongoDB reads, each querying by the
same date window rather than by its input item, and I assumed each ran once.

With an empty day every node emitted one item, so `1 x 1 x 1 ...` and the
rollup worked perfectly. With real data the assessments aggregate emitted 44
items, so the next read fired 44 times and emitted 44 x 35 = 1,540, the next
fired 1,540 times, and three links in it was millions of queries. There was no
error, no log line and no timeout — the execution simply never finished, and
because the webhook used `responseMode: responseNode`, the caller hung forever.
Only days that actually had data failed, which is what made it confusing.

The fix is `executeOnce: true` on every read whose query does not depend on its
input item. `npm run workflows:build` now fails when one Mongo read follows
another without it.

The general lesson: a node downstream of anything that can emit N items will run
N times unless you say otherwise.

### `upsert` is not inside `options`

```js
// MongoDb.node.js, on both the modern and legacy paths
const updateOptions = this.getNodeParameter('upsert', i) ? { upsert: true } : undefined;
```

`upsert` is a **top-level node parameter**. Passing it as `options.upsert`, which
is where it looks like it belongs, reads as `undefined`: the node performs a
plain update, matches nothing, writes nothing, and reports **success**. A
"successful" metrics rollup left `metrics_daily` completely empty, with the
audit record written as if it had worked.

### The Mongo node coerces `updateKey` through `new ObjectId()`

```js
if (updateKey === '_id') { filter[updateKey] = new ObjectId(item[updateKey]); }
```

`metrics_daily` originally used the date string as `_id`, so that re-running a
day was idempotent. That throws `BSONError`, because `"2026-10-20"` is not
24-hex — and the node dies before producing output, so again the webhook hangs
rather than returning an error. The collection now carries `dateKey` with a
unique index, and `_id` is left as an ordinary ObjectId.

### Webhook registration lags `/healthz`

n8n answers its health check before it has registered the webhooks of active
workflows, so `stack:reload` followed immediately by a request fails with 404.
`tools/backfill-metrics.js` probes the real endpoint until it stops returning
404 rather than sleeping and hoping.

## 6. Reclaiming space on a full machine

```bash
npm run disk:report
```

Read-only. It prints Vigor's footprint, what is reclaimable, and the commands —
and runs none of them, because on a machine with several projects on it the
aggressive option deletes images other projects need.

Safest first:

```bash
docker builder prune -af
```

Build cache. Safe — it only slows the next rebuild of whatever created it, and
Vigor does not use it. This is usually by far the biggest win.

```bash
docker container prune -f
```

Stopped containers. Safe unless you still want their logs.

```bash
docker image prune -f
```

Dangling images only — layers no tagged image references. Safe.

```bash
docker volume ls
```

Then remove volumes **one at a time, deliberately**. An unused volume is
somebody's database; `docker volume prune` does not know which.

### What not to run here

```
docker system prune -a
```

This removes every image not used by a *running* container. On a machine with
several projects that means re-pulling many gigabytes. It is the wrong tool when
the actual problem is 12GB of stale build cache.

### If more than one n8n image is present

`disk:report` flags this. Vigor needs exactly one. Point `N8N_IMAGE` at the one
you are keeping, then remove the others — but only after checking no other
project of yours uses them.
