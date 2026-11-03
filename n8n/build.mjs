#!/usr/bin/env node
/**
 * Emits import-ready n8n workflow JSON from the declarations in n8n/src/.
 *
 *   node n8n/build.mjs            build and write
 *   node n8n/build.mjs --check    verify the committed JSON matches the sources
 *
 * The --check mode is what stops the committed JSON drifting away from the
 * readable source: it is the thing a CI step would run.
 *
 * Validation here is deliberately strict. A workflow that imports cleanly but
 * has an unreachable node or a dangling edge is worse than one that fails to
 * build, because in this system a skipped node can mean an unsent escalation.
 */

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "src");
const outDir = join(here, "workflows");

const CHECK = process.argv.includes("--check");

/* ------------------------------------------------------------------ checks */

const TRIGGER_TYPES = new Set([
  "n8n-nodes-base.webhook",
  "n8n-nodes-base.scheduleTrigger",
  "n8n-nodes-base.manualTrigger",
  "n8n-nodes-base.executeWorkflowTrigger",
]);

function validate(wf, file) {
  const errors = [];
  const warnings = [];

  const names = wf.nodes.map((n) => n.name);
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  if (dupes.length) errors.push(`duplicate node name(s): ${[...new Set(dupes)].join(", ")}`);

  const ids = wf.nodes.map((n) => n.id);
  const dupeIds = ids.filter((n, i) => ids.indexOf(n) !== i);
  if (dupeIds.length) errors.push(`duplicate node id(s) — two nodes hashed the same seed`);

  const known = new Set(names);
  const targeted = new Set();

  for (const [from, conn] of Object.entries(wf.connections)) {
    if (!known.has(from)) errors.push(`connection from unknown node "${from}"`);
    for (const out of conn.main ?? []) {
      for (const edge of out ?? []) {
        if (!known.has(edge.node)) errors.push(`connection to unknown node "${edge.node}"`);
        targeted.add(edge.node);
      }
    }
  }

  // Every node must either be a trigger, a sticky note, or be reachable.
  for (const node of wf.nodes) {
    if (TRIGGER_TYPES.has(node.type)) continue;
    if (node.type === "n8n-nodes-base.stickyNote") continue;
    if (!targeted.has(node.name)) errors.push(`unreachable node "${node.name}"`);
  }

  // Every webhook needs a reachable respondToWebhook, or the caller hangs until
  // the request times out.
  const hasWebhook = wf.nodes.some((n) => n.type === "n8n-nodes-base.webhook");
  const hasRespond = wf.nodes.some((n) => n.type === "n8n-nodes-base.respondToWebhook");
  if (hasWebhook && !hasRespond) {
    errors.push("workflow has a webhook trigger but no respondToWebhook node");
  }

  // A Mongo node without credentials will import but fail at runtime.
  for (const node of wf.nodes) {
    if (node.type === "n8n-nodes-base.mongoDb" && !node.credentials?.mongoDb) {
      errors.push(`mongo node "${node.name}" has no credential reference`);
    }
  }

  // `$env` may only appear in a config node. In n8n 2.x env access throws
  // unless N8N_BLOCK_ENV_ACCESS_IN_NODE === 'false', so every additional
  // reference is another place that breaks on a misconfigured instance. The
  // config nodes catch that failure and fall back to defaults; a stray $env
  // elsewhere would not.
  for (const node of wf.nodes) {
    const isConfigNode = node.type === "n8n-nodes-base.set" && /^Vigor config/.test(node.name);
    if (isConfigNode) continue;
    if (JSON.stringify(node.parameters).includes("$env.")) {
      errors.push(
        `node "${node.name}" reads $env directly — use a "Vigor config" node and read $json.vigorConfig`,
      );
    }
  }

  // Two different TRIGGERS must never converge on one node.
  //
  // Fan-in from several branches of the same trigger is fine and is used all
  // over this project: a Switch or IF takes exactly one branch, the others
  // produce nothing, and n8n runs the downstream node anyway.
  //
  // Two triggers are different. Only one fires per execution, and the other
  // branch is never scheduled at all, so the shared node waits forever: the
  // execution sits in `running`, and a webhook caller hangs with no response
  // and no error. Workflow 08 did exactly this and hung a 30-day backfill.
  const triggerRoots = wf.nodes.filter((n) => TRIGGER_TYPES.has(n.type)).map((n) => n.name);
  if (triggerRoots.length > 1) {
    // Forward reachability from each trigger.
    const reachableFrom = (start) => {
      const seen = new Set();
      const stack = [start];
      while (stack.length) {
        const cur = stack.pop();
        for (const out of wf.connections[cur]?.main ?? []) {
          for (const edge of out ?? []) {
            if (seen.has(edge.node)) continue;
            seen.add(edge.node);
            stack.push(edge.node);
          }
        }
      }
      return seen;
    };

    const byTrigger = new Map(triggerRoots.map((t) => [t, reachableFrom(t)]));
    for (const node of wf.nodes) {
      const owners = triggerRoots.filter((t) => byTrigger.get(t).has(node.name));
      if (owners.length < 2) continue;
      if (node.type === "n8n-nodes-base.merge") continue;
      errors.push(
        `node "${node.name}" is reachable from ${owners.length} different triggers ` +
          `(${owners.join(", ")}) — only one fires per execution, so the node waits ` +
          `forever. Keep trigger paths separate, or have one trigger call the ` +
          `other's webhook.`,
      );
    }
  }

  // A Mongo read chained after another Mongo read must set executeOnce.
  //
  // n8n runs a node once per input item. These reads query by a time window,
  // not by their input item, so if the upstream read returned 44 rows the next
  // one fires 44 identical queries and emits 44x its own rows. Three links in
  // and it is millions of queries: no error, no log line, the execution simply
  // never finishes and a responseNode webhook hangs forever. Workflow 08 did
  // exactly this, and only on days that actually had data.
  const READ_OPS = new Set(["find", "aggregate"]);
  const isRead = (n) =>
    n?.type === "n8n-nodes-base.mongoDb" && READ_OPS.has(n.parameters?.operation);

  for (const [from, conn] of Object.entries(wf.connections)) {
    const source = wf.nodes.find((n) => n.name === from);
    if (!isRead(source)) continue;
    for (const out of conn.main ?? []) {
      for (const edge of out ?? []) {
        const target = wf.nodes.find((n) => n.name === edge.node);
        if (!isRead(target) || target.executeOnce) continue;
        errors.push(
          `mongo read "${target.name}" follows another mongo read ("${from}") ` +
            `without executeOnce — it will run once per upstream row and multiply. ` +
            `Set executeOnce: true.`,
        );
      }
    }
  }

  // Anything that reads vigorConfig needs a config node on its trigger path.
  const configNodes = wf.nodes.filter(
    (n) => n.type === "n8n-nodes-base.set" && /^Vigor config/.test(n.name),
  );
  const usesConfig = wf.nodes.some((n) => JSON.stringify(n.parameters).includes("vigorConfig"));
  if (usesConfig && configNodes.length === 0) {
    errors.push("workflow reads vigorConfig but has no Vigor config node");
  }

  // Code nodes that reference a node by name must reference one that exists,
  // and their JavaScript must actually parse. A syntax error inside a Code node
  // only surfaces when that node runs, which in this system can be the moment
  // an escalation was supposed to fire.
  for (const node of wf.nodes) {
    if (node.type !== "n8n-nodes-base.code") continue;

    try {
      // n8n runs the body as a function, so parse it the same way. $json, $env
      // and friends are runtime globals and do not need to resolve here.
      new Function(node.parameters.jsCode ?? "");
    } catch (err) {
      errors.push(`code node "${node.name}" does not parse: ${err.message}`);
    }

    const refs = [...(node.parameters.jsCode ?? "").matchAll(/\$\('([^']+)'\)/g)].map((m) => m[1]);
    for (const ref of new Set(refs)) {
      if (!known.has(ref)) errors.push(`code node "${node.name}" references unknown node "${ref}"`);
    }
  }

  // Expressions elsewhere can reference nodes too.
  const paramText = JSON.stringify(wf.nodes.map((n) => n.parameters));
  for (const m of paramText.matchAll(/\\?\$\('([^']+?)'\\?\)/g)) {
    if (!known.has(m[1])) warnings.push(`expression references node "${m[1]}" which does not exist`);
  }

  if (errors.length) {
    throw new Error(`${file}:\n  - ${errors.join("\n  - ")}`);
  }
  return { warnings, nodeCount: wf.nodes.length };
}

/* -------------------------------------------------------------------- main */

/**
 * Catches backslash escapes eaten by template literals.
 *
 * Code-node bodies are authored inside `` ` `` template literals, where a lone
 * `\d` evaluates to `d` long before the builder runs. The result is still valid
 * JavaScript — `/^(d{4})$/` parses fine — so neither the parse check nor n8n
 * complains; the regex just silently stops matching. That cost a debugging
 * round trip on a 30-day metrics backfill where every request returned
 * "invalid_date" for a date that was obviously valid.
 *
 * This reads the raw source text, before JS evaluates anything, and flags a
 * single backslash followed by a regex class character. The fix is either to
 * double it (`\\d`) or to use an explicit class (`[0-9]`), which is preferred.
 */
function lintEscapes(source, file) {
  const problems = [];
  const lines = source.split(/\r?\n/);

  lines.forEach((line, i) => {
    // A backslash not preceded by a backslash, followed by a regex class char.
    for (const m of line.matchAll(/(^|[^\\])\\([dDwWsSbB])/g)) {
      problems.push(`${file}:${i + 1}: \\${m[2]} inside a template literal collapses to "${m[2]}" — use \\\\${m[2]} or [0-9]/[A-Za-z] instead\n      ${line.trim()}`);
    }
  });

  return problems;
}

const files = (await readdir(srcDir))
  .filter((f) => /^w\d+-.*\.mjs$/.test(f))
  .sort();

if (files.length === 0) {
  console.error("No workflow sources found in n8n/src");
  process.exit(1);
}

await mkdir(outDir, { recursive: true });

let drift = 0;
let totalNodes = 0;
const summary = [];

const escapeProblems = [];
for (const file of [...files, "shared.mjs"]) {
  escapeProblems.push(...lintEscapes(await readFile(join(srcDir, file), "utf8"), file));
}
if (escapeProblems.length) {
  console.error("Template-literal escape problems:\n");
  for (const p of escapeProblems) console.error(`  - ${p}`);
  process.exit(1);
}

for (const file of files) {
  const mod = await import(new URL(`src/${file}`, import.meta.url).href);
  const wf = mod.default;

  // A stable, predictable workflow id. n8n would otherwise generate a random
  // one per import, and `n8n publish:workflow --id=<id>` — the only way to
  // activate a workflow from the CLI in regular (non-queue) deployment mode —
  // needs an id we know in advance. It also makes re-import an update in place
  // rather than a duplicate.
  const num = /^w(\d+)/.exec(file)?.[1];
  if (!num) throw new Error(`${file}: cannot derive a workflow id from the filename`);
  wf.id = `vigor${num}`;

  // `vigorTags` is build metadata, not part of the n8n schema (see lib.mjs).
  const declaredTags = wf.vigorTags ?? [];
  delete wf.vigorTags;

  const { warnings, nodeCount } = validate(wf, file);
  totalNodes += nodeCount;

  const outName = file.replace(/\.mjs$/, ".json");
  const outPath = join(outDir, outName);
  const json = JSON.stringify(wf, null, 2) + "\n";

  if (CHECK) {
    let existing = null;
    try {
      existing = await readFile(outPath, "utf8");
    } catch {
      /* not built yet */
    }
    if (existing !== json) {
      drift += 1;
      console.error(`DRIFT  ${outName} does not match its source`);
    }
  } else {
    await writeFile(outPath, json, "utf8");
  }

  const triggers = wf.nodes
    .filter((n) => TRIGGER_TYPES.has(n.type))
    .map((n) =>
      n.type === "n8n-nodes-base.webhook"
        ? `POST /webhook/${n.parameters.path}`
        : `cron ${n.parameters.rule.interval[0].expression}`,
    );

  summary.push({ outName, id: wf.id, name: wf.name, nodeCount, triggers, warnings, declaredTags });
}

for (const s of summary) {
  console.log(`${CHECK ? "checked" : "wrote  "} ${s.outName.padEnd(30)} ${String(s.nodeCount).padStart(3)} nodes  ${s.id}  ${s.name}`);
  for (const t of s.triggers) console.log(`        trigger: ${t}`);
  for (const w of s.warnings) console.log(`        warn:    ${w}`);
}

console.log(`\n${summary.length} workflows, ${totalNodes} nodes total.`);

// The bootstrap script activates by id, so it reads this rather than carrying
// a hand-maintained list that can drift from what was actually built.
if (!CHECK) {
  // Deliberately NOT inside outDir: `import:workflow --separate` globs *.json
  // in that directory and would try to import the manifest as a workflow.
  await writeFile(
    join(here, "workflows.manifest.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        workflows: summary.map((s) => ({
          id: s.id,
          file: s.outName,
          name: s.name,
          nodes: s.nodeCount,
          triggers: s.triggers,
          tags: s.declaredTags,
        })),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
}

if (CHECK && drift > 0) {
  console.error(`\n${drift} workflow(s) out of date. Run: node n8n/build.mjs`);
  process.exit(1);
}
