# n8n workflows

The JSON in `workflows/` is **generated**. Edit the sources in `src/`, then:

```bash
node build.mjs           # from this directory, or: npm run workflows:build
node build.mjs --check   # fails if committed JSON drifted from source
```

Nothing has to be imported by hand. `docker compose up -d` runs the `n8n-init`
service first, which creates the Mongo credential, imports all nine workflows
and activates them before n8n starts. See
[../docs/07-docker-and-storage.md](../docs/07-docker-and-storage.md).

## Layout

| Path | What |
| --- | --- |
| `build.mjs` | generator + validator |
| `src/lib.mjs` | node factories, grid positioning, graph assembly, `configNode` |
| `src/shared.mjs` | red-flag gate, consent gate, WHO 2021 limits, notify policy |
| `src/w01..w09-*.mjs` | one file per workflow |
| `workflows/*.json` | generated output, committed, imported by `n8n-init` |
| `workflows.manifest.json` | generated: ids, triggers, node counts. Read by the bootstrap script to activate by id. Deliberately NOT inside `workflows/`, which is glob-imported. |

## Workflow ids

The builder assigns stable ids from the filename: `w03-*.mjs` becomes `vigor03`.
They have to be predictable because `n8n publish:workflow --id=<id>` is the only
way to activate a workflow from the CLI in regular deployment mode, and because
a re-import with a known id is an update in place rather than a duplicate.

## What the builder refuses to emit

- an unreachable node (not a trigger, not a sticky note, no incoming edge)
- an edge to or from a node that does not exist
- a webhook trigger with no `respondToWebhook` node
- a MongoDB node with no credential reference
- a Code node whose JavaScript does not parse
- a Code node referencing a node name that does not exist
- **any node other than a `Vigor config` node reading `$env`**
- a workflow that reads `vigorConfig` but has no config node
- two nodes whose generated ids collide

A workflow that imports cleanly but silently skips a node is worse than one that
fails to build: here, a skipped node can mean an unsent escalation.

## Configuration

All runtime config is resolved by the `Vigor config` Set node at the head of each
trigger path and read downstream as `$json.vigorConfig`. No other node touches
`$env`.

| Field | Source | Fallback |
| --- | --- | --- |
| `agentServiceUrl` | `VIGOR_AGENT_SERVICE_URL` | `http://host.docker.internal:8000` |
| `internalToken` | `VIGOR_INTERNAL_TOKEN` | `''` (endpoints fail closed) |
| `notifyMode` | `VIGOR_NOTIFY_MODE` | `DEMO` |
| `oncallEmail` | `VIGOR_ONCALL_EMAIL` | `oncall@example-clinic.ae` |
| `escalationSlaMinutes` | `VIGOR_ESCALATION_SLA_MINUTES` | `60` |
| `quietHoursStart` / `End` | `VIGOR_QUIET_HOURS_*` | `21` / `8` |
| `webhookBase` | `WEBHOOK_URL` | `http://localhost:5678` |
| `envBlocked` | — | `true` if `$env` threw |

### The one setting that breaks everything

n8n 2.x computes:

```js
isEnvAccessBlocked = process.env.N8N_BLOCK_ENV_ACCESS_IN_NODE !== 'false'
```

So env access is **blocked unless that variable is the literal string
`"false"`**, and the switch governs ordinary expressions as well as Code nodes.
It is no longer part of n8n's typed config schema, so a missing value produces a
runtime `access to env vars denied` with no warning beforehand.
`infra/docker-compose.yml` sets it, and `bootstrap-n8n.sh` refuses to run
without it.

## Manual import, if you ever need it

```bash
docker exec vigor-n8n n8n import:workflow --separate --input=/workflows
docker exec vigor-n8n n8n publish:workflow --id=vigor01     # ...and 02..09
docker compose --env-file .env -f infra/docker-compose.yml restart n8n
```

Do **not** add `--activeState=fromJson`: it is rejected outside queue or
multi-main mode and aborts the entire import.
