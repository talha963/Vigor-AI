#!/usr/bin/env node
/**
 * Verifies the safety floor without needing a database, an LLM or n8n running.
 *
 *   node tools/verify-contracts.js
 *
 * Three things are checked:
 *
 *  1. The deterministic red-flag gate, executed exactly as the n8n Code nodes
 *     execute it (the same source fragment is imported, not a copy), against
 *     every golden case. These assertions are the clinical safety floor and are
 *     the ones that must never regress.
 *  2. The WHO 2021 semen flagging and its next-step mapping, against the lab
 *     cases.
 *  3. Every golden case serialised as an `intake.completed` event, validated
 *     against packages/contracts/events.schema.json.
 *
 * Step 3 needs ajv. If ajv is not installed the script says so and still runs
 * steps 1 and 2, because the safety checks must never be blocked on a dev
 * dependency being present.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { RED_FLAG_GATE, SEMEN_REFERENCE } from "../n8n/src/shared.mjs";
import { goldenPseudonymId, goldenAssessmentId, goldenConsentId } from "./ids.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const golden = JSON.parse(readFileSync(join(root, "tools/seed/golden-cases.json"), "utf8"));
const schema = JSON.parse(readFileSync(join(root, "packages/contracts/events.schema.json"), "utf8"));

/* The gate fragments are evaluated as written, so this tests the shipped code. */
const gate = new Function(`${RED_FLAG_GATE}\nreturn { runRedFlagGate };`)();
const semen = new Function(
  `${SEMEN_REFERENCE}\nreturn { flagSemenResult, semenNextStep, WHO_2021_LOWER_LIMITS };`,
)();

let failures = 0;
let checks = 0;

const eq = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected);
const sorted = (xs) => [...(xs ?? [])].sort();

function assert(label, ok, detail) {
  checks += 1;
  if (ok) return;
  failures += 1;
  console.error(`  FAIL  ${label}`);
  if (detail) console.error(`        ${detail}`);
}

/* ------------------------------------------- 1. deterministic red-flag gate */

console.log("Red-flag gate (deterministic safety floor)\n");

for (const gc of golden.cases) {
  const result = gate.runRedFlagGate(gc.answers);

  const flagsOk = eq(sorted(result.redFlags), sorted(gc.expectedRedFlags));
  const severityOk = (result.severity ?? null) === (gc.expectedSeverity ?? null);
  const tierOk = (result.minimumTier ?? null) === (gc.expectedMinimumTier ?? null);

  const ok = flagsOk && severityOk && tierOk;
  console.log(`  ${ok ? "pass" : "FAIL"}  ${gc.id}  ${gc.label}`);

  assert(
    `${gc.id} red flags`,
    flagsOk,
    `expected [${sorted(gc.expectedRedFlags).join(", ")}] got [${sorted(result.redFlags).join(", ")}]`,
  );
  assert(`${gc.id} severity`, severityOk, `expected ${gc.expectedSeverity} got ${result.severity ?? null}`);
  assert(`${gc.id} minimum tier`, tierOk, `expected ${gc.expectedMinimumTier} got ${result.minimumTier ?? null}`);

  // Every flag raised must carry a human-readable reason, because the clinician
  // alert and the user guidance are both built from it.
  for (const r of result.reasons ?? []) {
    assert(`${gc.id} reason text for ${r.code}`, typeof r.reason === "string" && r.reason.length > 20);
  }
}

/* --------------------------------------------- 2. WHO 2021 semen flagging */

console.log("\nSemen analysis flagging (WHO 2021, 6th edition)\n");

for (const lc of golden.labCases) {
  const flags = semen.flagSemenResult(lc.values);
  const next = semen.semenNextStep(flags);

  const flagsOk = eq(sorted(flags), sorted(lc.expectedFlags));
  const tierOk = next.tier === lc.expectedTier;
  const reviewOk = next.requiresHumanReview === lc.expectRequiresHumanReview;
  const actionOk = lc.expectedAction ? next.action === lc.expectedAction : true;

  const ok = flagsOk && tierOk && reviewOk && actionOk;
  console.log(`  ${ok ? "pass" : "FAIL"}  ${lc.id}  ${lc.label}`);

  assert(
    `${lc.id} flags`,
    flagsOk,
    `expected [${sorted(lc.expectedFlags).join(", ")}] got [${sorted(flags).join(", ")}]`,
  );
  assert(`${lc.id} tier`, tierOk, `expected ${lc.expectedTier} got ${next.tier}`);
  assert(
    `${lc.id} requires human review`,
    reviewOk,
    `expected ${lc.expectRequiresHumanReview} got ${next.requiresHumanReview}`,
  );
  if (lc.expectedAction) assert(`${lc.id} action`, actionOk, `expected ${lc.expectedAction} got ${next.action}`);

  // The rule that matters most: a severe finding is never delivered cold.
  if (lc.expectDetailWithheld) {
    assert(
      `${lc.id} severe finding routes to a clinician`,
      next.requiresHumanReview === true,
      "a severe semen finding must require human review before the user sees detail",
    );
  }
}

/* Reference limits must match the published WHO 2021 5th-centile values. */
console.log("\nWHO 2021 lower reference limits\n");
const EXPECTED_LIMITS = {
  volumeMl: 1.4,
  totalSpermMillion: 39,
  concentrationMillionPerMl: 16,
  totalMotilityPct: 42,
  progressiveMotilityPct: 30,
  normalFormsPct: 4,
  vitalityPct: 54,
};
for (const [k, v] of Object.entries(EXPECTED_LIMITS)) {
  const actual = semen.WHO_2021_LOWER_LIMITS[k];
  const ok = actual === v;
  console.log(`  ${ok ? "pass" : "FAIL"}  ${k.padEnd(28)} ${actual}`);
  assert(`limit ${k}`, ok, `expected ${v} got ${actual}`);
}

/* ------------------------------------------------- 3. event schema validation */

console.log("\nEvent contract validation\n");

let Ajv, addFormats;
try {
  ({ default: Ajv } = await import("ajv"));
  ({ default: addFormats } = await import("ajv-formats"));
} catch {
  console.log("  skipped — ajv is not installed. Run `npm install` to enable schema validation.");
}

if (Ajv) {
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);
  const validateIntake = ajv.compile({ ...schema.properties.intakeCompleted, $defs: schema.$defs });

  for (const gc of golden.cases) {
    const event = {
      eventType: "intake.completed",
      eventId: `evt_${gc.id.toLowerCase()}`,
      occurredAt: new Date().toISOString(),
      pseudonymId: goldenPseudonymId(gc.id),
      assessmentId: goldenAssessmentId(gc.id),
      consentId: goldenConsentId(gc.id),
      locale: gc.locale,
      startedAt: new Date(Date.now() - 600000).toISOString(),
      durationSec: 420,
      answers: gc.answers,
      skippedSensitive: [],
    };
    const ok = validateIntake(event);
    console.log(`  ${ok ? "pass" : "FAIL"}  ${gc.id} serialises as a valid intake.completed event`);
    assert(
      `${gc.id} event schema`,
      ok,
      ok ? "" : (validateIntake.errors ?? []).map((e) => `${e.instancePath} ${e.message}`).join("; "),
    );
  }

  // The closed symptom vocabulary is what makes the gate auditable, so a golden
  // case using an unknown symptom code is a contract failure, not a typo.
  const symptomEnum = new Set(schema.$defs.symptom.enum);
  for (const gc of golden.cases) {
    for (const s of gc.answers.symptoms ?? []) {
      assert(`${gc.id} symptom "${s}" is in the closed vocabulary`, symptomEnum.has(s));
    }
  }
  console.log("  pass  all golden-case symptoms are in the closed vocabulary");
}

/* ------------------------------------------------------------------ result */

console.log(`\n${checks - failures}/${checks} checks passed.`);
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("Safety floor verified.");
