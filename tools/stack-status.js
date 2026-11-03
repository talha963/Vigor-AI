#!/usr/bin/env node
/**
 * Answers one question: is the running stack actually running the code on disk?
 *
 *   node tools/stack-status.js        (npm run stack:status)
 *
 * Nothing in Vigor is built into an image — there is no Dockerfile — so "did it
 * rebuild?" is the wrong question. What can go stale is:
 *
 *   1. the committed workflow JSON, against its sources in n8n/src
 *   2. the workflows inside n8n's database, against that JSON
 *   3. the container's environment, against infra/docker-compose.yml
 *
 * Item 2 is the one that bites: `npm run workflows:build` rewrites the JSON, but
 * n8n keeps serving what is in its own database until `n8n-init` re-imports and
 * n8n restarts. Everything can look correct on disk while the webhook you are
 * calling runs last week's logic.
 *
 * Read-only. Changes nothing.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workflowDir = join(root, "n8n/workflows");

const sh = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch {
    return null;
  }
};

let problems = 0;
const fail = (msg) => {
  problems += 1;
  console.log(`  STALE   ${msg}`);
};
const ok = (msg) => console.log(`  ok      ${msg}`);

/* ------------------------------------------------- 1. sources vs JSON ----- */

console.log("\nVigor stack status\n");
console.log("Workflow JSON vs sources");

const check = sh("node", [join(root, "n8n/build.mjs"), "--check"]);
if (check === null) {
  fail("n8n/workflows/*.json does not match n8n/src — run: npm run workflows:build");
} else {
  ok("committed JSON matches n8n/src");
}

/* ------------------------------------------------ 2. containers ----------- */

console.log("\nContainers");

const ps = sh("docker", ["ps", "--filter", "name=vigor", "--format", "{{.Names}}\t{{.Status}}"]);
if (!ps || !ps.trim()) {
  console.log("  none running — start with: npm run stack:up");
  console.log("\nNothing else can be checked while the stack is down.");
  process.exit(problems > 0 ? 1 : 0);
}
for (const line of ps.trim().split(/\r?\n/)) {
  const [name, status] = line.split("\t");
  console.log(`  ${/Up/.test(status) ? "ok     " : "DOWN   "} ${name.padEnd(14)} ${status}`);
}

/* ------------------------------------- 3. n8n database vs workflow JSON --- */

console.log("\nWorkflows loaded in n8n vs disk");

// Compare the things that change behaviour, not cosmetics like positions.
const canon = (nodes) =>
  JSON.stringify(
    nodes
      .map((n) => [
        n.name,
        n.type,
        n.typeVersion,
        !!n.executeOnce,
        n.parameters?.operation ?? null,
        n.parameters?.upsert ?? null,
        n.parameters?.jsCode ?? null,
        n.parameters?.path ?? null,
      ])
      .sort(),
  );

const disk = {};
for (const file of readdirSync(workflowDir).filter((f) => f.endsWith(".json"))) {
  const wf = JSON.parse(readFileSync(join(workflowDir, file), "utf8"));
  disk[wf.id] = { file, nodes: wf.nodes.length, canon: canon(wf.nodes) };
}

const probe =
  'const {DatabaseSync}=require("node:sqlite");' +
  'const db=new DatabaseSync("/home/node/.n8n/database.sqlite");' +
  "const out={};" +
  'for(const r of db.prepare("SELECT id,nodes,active FROM workflow_entity").all()){' +
  "out[r.id]={nodes:JSON.parse(r.nodes),active:r.active};}" +
  "process.stdout.write(JSON.stringify(out));";

const raw = sh("docker", ["exec", "vigor-n8n", "node", "-e", probe]);
if (!raw) {
  fail("could not read n8n's database (is vigor-n8n up?)");
} else {
  const live = JSON.parse(raw);
  let inactive = 0;
  for (const id of Object.keys(disk).sort()) {
    const d = disk[id];
    const l = live[id];
    if (!l) {
      fail(`${id} is not loaded in n8n — run: npm run stack:reload`);
      continue;
    }
    if (canon(l.nodes) !== d.canon) {
      fail(`${id} differs from ${d.file} — run: npm run stack:reload`);
      continue;
    }
    if (!l.active) {
      inactive += 1;
      fail(`${id} matches disk but is INACTIVE — its webhook will return 404`);
      continue;
    }
    ok(`${id} in sync and active (${d.nodes} nodes)`);
  }
  for (const id of Object.keys(live)) {
    if (!disk[id]) console.log(`  note    ${id} exists in n8n but not on disk`);
  }
  if (inactive) {
    console.log("\n  Activate with: npm run stack:reload");
  }
}

/* ------------------------------------- 4. container env vs compose -------- */

console.log("\nContainer environment");

const env = sh("docker", ["inspect", "-f", "{{range .Config.Env}}{{println .}}{{end}}", "vigor-n8n"]);
const envMap = new Map(
  (env ?? "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

// The one that silently breaks every $env reference in the project.
if (envMap.get("N8N_BLOCK_ENV_ACCESS_IN_NODE") === "false") {
  ok('N8N_BLOCK_ENV_ACCESS_IN_NODE="false" (required — see docs/07)');
} else {
  fail(
    `N8N_BLOCK_ENV_ACCESS_IN_NODE is "${envMap.get("N8N_BLOCK_ENV_ACCESS_IN_NODE") ?? "unset"}" ` +
      'but must be the string "false", or the Vigor config node falls back to defaults',
  );
}

for (const key of ["EXECUTIONS_DATA_PRUNE", "EXECUTIONS_DATA_MAX_AGE", "EXECUTIONS_DATA_PRUNE_MAX_COUNT"]) {
  if (envMap.has(key)) ok(`${key}=${envMap.get(key)}`);
  else fail(`${key} missing — execution history will grow without limit`);
}

// A compose file edited after the container was created means `restart` is not
// enough: env and volumes are fixed at create time.
const composePath = join(root, "infra/docker-compose.yml");
if (existsSync(composePath)) {
  const created = sh("docker", ["inspect", "-f", "{{.Created}}", "vigor-n8n"]);
  if (created) {
    const containerCreated = new Date(created.trim());
    const composeMtime = statSync(composePath).mtime;
    if (composeMtime > containerCreated) {
      fail(
        "infra/docker-compose.yml was edited after vigor-n8n was created — " +
          "`restart` does not re-read it. Run: npm run stack:down && npm run stack:up",
      );
    } else {
      ok("container is newer than infra/docker-compose.yml");
    }
  }
}

/* ------------------------------------------------------------- summary --- */

console.log(
  problems === 0
    ? "\nEverything on disk is live in the running stack.\n"
    : `\n${problems} problem(s). Most are fixed by: npm run stack:reload\n`,
);
process.exit(problems > 0 ? 1 : 0);
