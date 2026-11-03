#!/usr/bin/env node
/**
 * End-to-end smoke test against a running n8n instance.
 *
 *   node tools/smoke/run-smoke.js
 *   node tools/smoke/run-smoke.js --only 1,2,7
 *
 * Prerequisites: the stack is up, the nine workflows are imported AND ACTIVE,
 * the "Vigor Atlas" MongoDB credential exists, and `npm run db:seed` has been
 * run so the golden-case subjects have consent on file.
 *
 * What it proves, in order:
 *
 *   1  an urgent case routes to URGENT and raises an escalation
 *   2  a non-urgent case routes without escalating
 *   3  processing is REFUSED for a subject with no consent on file
 *   4  a referral is BLOCKED while the decision awaits clinician review
 *   5  clinician review releases the decision and closes the escalation
 *   6  a de-escalation across an emergency red flag is REFUSED (422)
 *   7  the referral then dispatches, with a scoped share token
 *   8  revocation kills the share token, and the facility callback starts failing
 *   9  a severe lab result withholds detail and routes to a clinician
 *
 * Tests 3, 4, 6 and 8 are the interesting ones: they assert that the system
 * says no. A demo that only shows the happy path proves very little about a
 * service handling data this sensitive.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

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
const TOKEN = process.env.VIGOR_INTERNAL_TOKEN || "";

const manifestPath = join(root, "tools/seed/manifest.json");
if (!existsSync(manifestPath)) {
  console.error("tools/seed/manifest.json not found. Run `npm run db:seed` first.");
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const byCase = Object.fromEntries(manifest.goldenSubjects.map((g) => [g.caseId, g]));
const labByCase = Object.fromEntries(manifest.labCases.map((l) => [l.id, l]));

const onlyArg = process.argv.indexOf("--only");
const only = onlyArg > -1 ? new Set(process.argv[onlyArg + 1].split(",").map(Number)) : null;

let passed = 0;
let failed = 0;
const state = {};

async function post(path, body, headers = {}) {
  const res = await fetch(`${BASE}/webhook/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 400) };
  }
  return { status: res.status, json };
}

function check(label, ok, detail) {
  if (ok) {
    passed += 1;
    console.log(`    pass  ${label}`);
  } else {
    failed += 1;
    console.log(`    FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function test(n, name, fn) {
  if (only && !only.has(n)) return;
  console.log(`\n${n}. ${name}`);
  try {
    await fn();
  } catch (err) {
    failed += 1;
    console.log(`    ERROR ${err.message}`);
  }
}

const intakeEvent = (gc, suffix) => ({
  eventType: "intake.completed",
  eventId: `evt_smoke_${suffix}`,
  occurredAt: new Date().toISOString(),
  idempotencyKey: `smoke:${suffix}:${Date.now()}`,
  pseudonymId: gc.pseudonymId,
  assessmentId: `${gc.assessmentId}_${Date.now().toString(36)}`,
  consentId: gc.consentId,
  locale: gc.locale,
  startedAt: new Date(Date.now() - 400000).toISOString(),
  durationSec: 395,
  answers: gc.answers,
  skippedSensitive: [],
});

console.log(`Vigor smoke test against ${BASE}`);

/* ----------------------------------------------------------------- tests */

await test(1, "Urgent case routes to URGENT and raises an escalation", async () => {
  const gc = byCase.GC01;
  const { status, json } = await post("vigor/intake-completed", intakeEvent(gc, "gc01"));
  check("responds 200", status === 200, `got ${status}`);
  check("tier is URGENT", json?.tier === "URGENT", `got ${json?.tier}`);
  check("red flag detected", (json?.redFlags ?? []).includes("RF_ACUTE_SCROTAL_PAIN"));
  check("requires human review", json?.requiresHumanReview === true);
  check("states it is not a diagnosis", json?.boundary?.isDiagnosis === false);
  check("gives immediate guidance", typeof json?.nextStep?.kind === "string");
  state.urgentDecisionId = json?.decisionId;
});

await test(2, "Non-urgent case routes without escalating", async () => {
  const gc = byCase.GC16;
  const { status, json } = await post("vigor/intake-completed", intakeEvent(gc, "gc16"));
  check("responds 200", status === 200, `got ${status}`);
  check("no red flags", (json?.redFlags ?? []).length === 0, JSON.stringify(json?.redFlags));
  check("tier is not URGENT", json?.tier !== "URGENT", `got ${json?.tier}`);
  state.routineDecisionId = json?.decisionId;
  state.routinePseudonymId = gc.pseudonymId;
});

await test(3, "Processing is refused with no consent on file", async () => {
  const { status, json } = await post("vigor/intake-completed", {
    ...intakeEvent(byCase.GC11, "noconsent"),
    pseudonymId: "psn_nobodyhere0001",
    consentId: "cns_nonexistent",
  });
  check("responds 403", status === 403, `got ${status}`);
  check("names the required scope", json?.requiredScope === "ASSESSMENT");
  check("explains why", typeof json?.reason === "string");
});

await test(4, "Referral is blocked while awaiting clinician review", async () => {
  if (!state.urgentDecisionId) return check("needs test 1 to have run", false);
  const gc = byCase.GC01;
  const { status, json } = await post("vigor/referral-consent", {
    eventType: "referral.consented",
    pseudonymId: gc.pseudonymId,
    decisionId: state.urgentDecisionId,
    serviceType: "andrology",
    locale: gc.locale,
    emirate: "Abu Dhabi",
    preferences: { language: gc.locale, maleClinician: true, teleconsult: true },
  });
  check("responds 202 (held, not dispatched)", status === 202, `got ${status}`);
  check("nothing was dispatched", json?.dispatched === false);
  check("says a clinician must sign off", /clinician/i.test(json?.humanOversight ?? ""));
});

await test(6, "De-escalation across an emergency red flag is refused", async () => {
  if (!state.urgentDecisionId) return check("needs test 1 to have run", false);
  const { status, json } = await post(
    "vigor/clinician-review",
    {
      clinicianId: "dr_smoke",
      decisionId: state.urgentDecisionId,
      outcome: "de_escalated",
      overrideTier: "SELF_CARE",
      justification: "Patient says it feels better now and would rather not attend today.",
    },
    { "X-Vigor-Clinician-Key": TOKEN },
  );
  check("responds 422", status === 422, `got ${status}`);
  check("names the blocking flag", (json?.blockingFlags ?? []).includes("RF_ACUTE_SCROTAL_PAIN"));
  check("explains where it belongs instead", /clinical record/i.test(json?.message ?? ""));
});

await test(5, "Clinician review releases the decision and closes the escalation", async () => {
  if (!state.urgentDecisionId) return check("needs test 1 to have run", false);
  const { status, json } = await post(
    "vigor/clinician-review",
    {
      clinicianId: "dr_smoke",
      decisionId: state.urgentDecisionId,
      outcome: "approved",
      note: "Seen in ED, torsion excluded, discharged with andrology follow-up.",
    },
    { "X-Vigor-Clinician-Key": TOKEN },
  );
  check("responds 200", status === 200, `got ${status}`);
  check("decision is released", json?.referralUnblocked === true);
  check("records the reviewer", /dr_smoke/.test(json?.reviewedBy ?? ""));
});

await test(7, "Referral now dispatches with a scoped share token", async () => {
  if (!state.urgentDecisionId) return check("needs tests 1 and 5 to have run", false);
  const gc = byCase.GC01;
  const { status, json } = await post("vigor/referral-consent", {
    eventType: "referral.consented",
    pseudonymId: gc.pseudonymId,
    decisionId: state.urgentDecisionId,
    serviceType: "andrology",
    locale: gc.locale,
    emirate: "Abu Dhabi",
    preferences: { language: gc.locale, maleClinician: true, teleconsult: true },
  });
  check("responds 201", status === 201, `got ${status}`);
  check("dispatched", json?.dispatched === true);
  check("share is scoped, not total", (json?.sharedScope ?? []).includes("risk_summary"));
  check("share expires", typeof json?.shareExpiresAt === "string");
  check("matched a facility", typeof json?.facility?.name === "string");
  state.referralPseudonymId = gc.pseudonymId;
});

await test(8, "Revocation kills the share token and the facility callback fails", async () => {
  const token = manifest.sampleShareToken;
  if (!token) return check("seed produced a dispatched referral to revoke", false);

  // Confirm the token works before revocation, so the test proves a change.
  const before = await post("vigor/referral-status", {
    shareToken: token,
    status: "accepted",
    occurredAt: new Date().toISOString(),
  });
  check("token works before revocation", before.status === 200, `got ${before.status}`);

  // Revoke everything for the subject that owns that seeded referral.
  const owner = manifest.sampleReferralPseudonymId;
  if (!owner) return check("manifest names the referral owner", false);

  const { status: revStatus, json: receipt } = await post("vigor/consent-revoked", {
    eventType: "consent.revoked",
    pseudonymId: owner,
    scope: "ALL",
    eraseData: false,
    reason: "smoke test",
  });
  check("revocation responds 200", revStatus === 200, `got ${revStatus}`);
  check("receipt lists what was stopped", Array.isArray(receipt?.receipt?.lines));
  check(
    "at least one share was revoked",
    (receipt?.receipt?.counts?.shareTokensRevoked ?? 0) > 0,
    JSON.stringify(receipt?.receipt?.counts),
  );

  const after = await post("vigor/referral-status", {
    shareToken: token,
    status: "booked",
    occurredAt: new Date().toISOString(),
  });
  check("token is rejected after revocation", after.status === 401, `got ${after.status}`);
});

await test(9, "Severe lab result withholds detail and routes to a clinician", async () => {
  const lc = labByCase.LC01;
  const gc = byCase.GC10;
  const { status, json } = await post(
    "vigor/lab-result",
    {
      eventType: "lab.result.received",
      pseudonymId: gc.pseudonymId,
      assessmentId: gc.assessmentId,
      panel: lc.panel,
      values: lc.values,
      collectedAt: new Date(Date.now() - 86400000).toISOString(),
      labRef: "SMOKE-LC01",
      locale: gc.locale,
    },
    { "X-Vigor-Lab-Key": TOKEN },
  );
  check("responds 202", status === 202, `got ${status}`);
  check("azoospermia flagged", (json?.flags ?? []).includes("AZOOSPERMIA"));
  check("requires human review", json?.requiresHumanReview === true);
  check("routes to specialist", json?.tier === "ANDROLOGY_UROLOGY", `got ${json?.tier}`);
  check("states a repeat is needed, not a diagnosis", json?.boundary?.isDiagnosis === false);
});

await test(10, "Unauthenticated lab result is rejected", async () => {
  const lc = labByCase.LC04;
  const { status } = await post("vigor/lab-result", {
    pseudonymId: byCase.GC10.pseudonymId,
    panel: lc.panel,
    values: lc.values,
  });
  check("responds 401", status === 401, `got ${status}`);
});

/* ---------------------------------------------------------------- summary */

console.log(`\n${passed} passed, ${failed} failed.`);
if (failed > 0) {
  console.log(
    "\nIf everything failed with a 404, the workflows are imported but not ACTIVE.\n" +
      "Activate each one in the n8n editor — a webhook only listens while its workflow is active.",
  );
  process.exit(1);
}
