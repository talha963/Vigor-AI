#!/bin/sh
# ---------------------------------------------------------------------------
# One-shot n8n bootstrap. Runs in the n8n image, before the n8n service starts,
# sharing the same /home/node/.n8n volume.
#
# Replaces the two manual UI steps:
#   1. create the "Vigor Atlas" MongoDB credential
#   2. import the nine workflows and activate them
#
# Idempotent. Re-importing the same workflow ids updates them in place, and the
# credential is matched on its fixed id, so `up -d` can be run repeatedly.
# ---------------------------------------------------------------------------
set -eu

say() { printf '  %s\n' "$*"; }

echo "Vigor · n8n bootstrap"

if [ -z "${N8N_ENCRYPTION_KEY:-}" ]; then
  echo "ERROR: N8N_ENCRYPTION_KEY is not set."
  echo "       Credentials are encrypted with it. If it changes later, the stored"
  echo "       Mongo credential becomes unreadable and every workflow fails."
  exit 1
fi

if [ "${N8N_BLOCK_ENV_ACCESS_IN_NODE:-}" != "false" ]; then
  echo "ERROR: N8N_BLOCK_ENV_ACCESS_IN_NODE must be the literal string \"false\"."
  echo "       n8n 2.x blocks \$env unless it is, which breaks the Vigor config node."
  exit 1
fi

# --- 1. the MongoDB credential --------------------------------------------
# Written to a tmp file rather than passed on a command line, so the Atlas
# connection string never shows up in `ps` or in the container's command.
CRED_FILE=$(mktemp)
# shellcheck disable=SC2064
trap "rm -f '$CRED_FILE'" EXIT INT TERM

if [ -z "${MONGODB_URI:-}" ] || [ "${MONGODB_URI#*USER:PASSWORD}" != "${MONGODB_URI}" ]; then
  say "MONGODB_URI is unset or still the placeholder - skipping credential import."
  say "Create the credential manually, or set MONGODB_URI and re-run \`npm run stack:up\`."
else
  # The id is fixed and matches MONGO_CREDENTIALS in n8n/src/lib.mjs, so the
  # imported workflows bind to it without anyone picking it from a dropdown.
  cat > "$CRED_FILE" <<JSON
[
  {
    "id": "VigorAtlas",
    "name": "Vigor Atlas",
    "type": "mongoDb",
    "data": {
      "configurationType": "connectionString",
      "connectionString": "${MONGODB_URI}",
      "database": "${MONGODB_DB:-vigor}"
    }
  }
]
JSON

  say "Importing the Vigor Atlas credential..."
  if n8n import:credentials --input="$CRED_FILE"; then
    say "Credential ready."
  else
    echo "ERROR: credential import failed. The workflows will import but cannot reach MongoDB."
    exit 1
  fi
fi

# --- 2. the workflows ------------------------------------------------------
if [ ! -d /workflows ]; then
  echo "ERROR: /workflows is not mounted."
  exit 1
fi

COUNT=$(find /workflows -maxdepth 1 -name '*.json' | wc -l | tr -d ' ')
if [ "$COUNT" = "0" ]; then
  echo "ERROR: no workflow JSON in /workflows. Run \`npm run workflows:build\` first."
  exit 1
fi

say "Importing $COUNT workflows..."
# NOTE: --activeState=fromJson is NOT used. n8n 2.x rejects it outside queue or
# multi-main deployment mode ("In regular deployment mode, workflow activation
# is not supported"), and passing it aborts the entire import. Import always
# lands workflows deactivated, so activation is a separate step below.
n8n import:workflow --separate --input=/workflows

# --- 3. activation ---------------------------------------------------------
# `publish:workflow --id=<id>` is the only CLI route to activation in regular
# deployment mode. It takes one id at a time, hence the loop. The ids are the
# stable ones the builder assigns (vigor01..vigor09), read from the manifest so
# this never drifts from what was actually built.
if [ -f /workflows.manifest.json ]; then
  IDS=$(node -e "const m=require('/workflows.manifest.json');process.stdout.write(m.workflows.map(w=>w.id).join(' '))")
else
  say "No manifest mounted; deriving ids from filenames."
  IDS=$(find /workflows -maxdepth 1 -name 'w*.json' -exec basename {} \; | sed 's/^w\([0-9]*\).*/vigor\1/' | sort)
fi

say "Activating: $IDS"
say "(the n8n CLI reloads its schema per invocation, so this takes a minute)"

FAILED=""
for id in $IDS; do
  if n8n publish:workflow --id="$id" >/dev/null 2>&1; then
    say "  active   $id"
  else
    say "  FAILED   $id"
    FAILED="$FAILED $id"
  fi
done

if [ -n "$FAILED" ]; then
  echo "ERROR: these workflows could not be activated:$FAILED"
  echo "       Activate them in the n8n editor, or their webhooks will 404."
  exit 1
fi

say "All workflows imported and active. n8n can start."
