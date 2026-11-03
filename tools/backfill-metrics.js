#!/usr/bin/env node
/**
 * Backfills `metrics_daily` by calling workflow 08 once per day.
 *
 *   node tools/backfill-metrics.js                 last 30 days
 *   node tools/backfill-metrics.js --days 7
 *   node tools/backfill-metrics.js --date 2026-10-15
 *
 * The rollup is keyed on the date, so re-running a day overwrites rather than
 * duplicating. That makes this safe to repeat, and it is the reason a missed
 * night is recoverable instead of a permanent hole in the evidence.
 *
 * Days are driven sequentially on purpose. Each run is several aggregations
 * against the same collections, and firing thirty at once would just make
 * MongoDB queue them while the HTTP calls time out.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const file = join(root, ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    if (!(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const BASE = (process.env.WEBHOOK_URL || "http://localhost:5678/").replace(/\/$/, "");
const URL_ = `${BASE}/webhook/vigor/metrics-rollup`;

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : null;
};

const single = arg("date");
const days = Number(arg("days") ?? 30);

const pad = (n) => String(n).padStart(2, "0");
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

let dates;
if (single) {
  dates = [single];
} else {
  const today = new Date();
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  dates = Array.from({ length: days }, (_, i) =>
    keyOf(new Date(midnight.getFullYear(), midnight.getMonth(), midnight.getDate() - (i + 1))),
  ).reverse();
}

console.log(`Backfilling ${dates.length} day(s) via ${URL_}\n`);

/**
 * Waits for the webhook to be registered.
 *
 * n8n answers /healthz before it has finished registering the webhooks of
 * active workflows, so `stack:reload` followed immediately by a backfill races
 * and every day fails with 404. Probing the real endpoint is the only honest
 * readiness signal.
 */
async function waitForWebhook(attempts = 30, delayMs = 4000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(URL_, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // An invalid date is answered by the workflow's own 400 path, so a 400
        // proves the webhook is live without writing any metrics.
        body: JSON.stringify({ date: "not-a-date" }),
        signal: AbortSignal.timeout(15000),
      });
      if (res.status !== 404) {
        if (i > 1) console.log(`  webhook ready after ${i} attempt(s)\n`);
        return true;
      }
    } catch {
      /* still starting */
    }
    if (i === 1) console.log("  waiting for the webhook to register...");
    await new Promise((r) => setTimeout(r, delayMs));
  }
  console.log(`\nWebhook never registered at ${URL_}.`);
  console.log("Check that workflow 08 is active:  npm run stack:ps  and  docker logs vigor-n8n");
  process.exit(1);
}

await waitForWebhook();

let ok = 0;
let failed = 0;
let withData = 0;
const gaps = [];

for (const date of dates) {
  try {
    // A timeout is not optional here. A workflow that stalls mid-execution
    // never responds at all, and an untimed fetch then waits forever — which
    // is exactly how a 30-day backfill sat hung for 20 minutes with no output.
    const res = await fetch(URL_, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
      signal: AbortSignal.timeout(Number(process.env.VIGOR_ROLLUP_TIMEOUT_MS ?? 60000)),
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text.slice(0, 200) };
    }

    if (!res.ok) {
      failed += 1;
      console.log(`  FAIL  ${date}  ${res.status} ${JSON.stringify(json)}`);
      continue;
    }

    ok += 1;
    const h = json?.headline ?? {};
    const started = h.assessmentsStarted ?? 0;
    if (started > 0) withData += 1;

    const f = json?.fairness ?? {};
    if (f.localeCompletionGap !== null && f.localeCompletionGap !== undefined) {
      gaps.push({ date, gap: f.localeCompletionGap, worst: f.localeWorstSlice });
    }

    console.log(
      `  ok    ${date}  started ${String(started).padStart(3)}  ` +
        `completed ${String(h.assessmentsCompleted ?? 0).padStart(3)}  ` +
        `rate ${h.completionRate ?? "-"}  ` +
        `localeGap ${f.localeCompletionGap ?? "-"}${f.gapExceeded ? "  GAP EXCEEDED" : ""}`,
    );
  } catch (err) {
    failed += 1;
    console.log(`  ERROR ${date}  ${err.message}`);
  }
}

console.log(`\n${ok} day(s) rolled up, ${failed} failed, ${withData} with activity.`);

if (gaps.length) {
  const worst = gaps.reduce((a, b) => (b.gap > a.gap ? b : a));
  console.log(
    `Largest locale completion gap: ${worst.gap} on ${worst.date}` +
      (worst.worst ? ` (worst slice: ${worst.worst})` : ""),
  );
}

if (failed > 0) {
  console.log("\nIf every day failed with 404, workflow 08 is not active, or the stack is down.");
  process.exit(1);
}
