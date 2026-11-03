#!/usr/bin/env node
/**
 * Seeds the service catalogue, the golden-case subjects, and a synthetic cohort
 * large enough for the metrics rollup and the fairness slices to mean something.
 *
 *   node tools/seed-cohort.js              seed (keeps existing data)
 *   node tools/seed-cohort.js --reset      wipe Vigor collections first
 *   node tools/seed-cohort.js --size 400   cohort size (default 240)
 *
 * The cohort is generated with a fixed seed, so the numbers in a demo are the
 * same every time and a judge can be shown the same figures twice.
 *
 * One deliberate property of the generator: completion rate is NOT uniform
 * across slices. Arabic-locale and youngest-band users are given a lower
 * completion probability, because that is the realistic pattern, and a fairness
 * dashboard that only ever shows parity proves nothing. Workflow 08 should
 * surface this gap, and the whole point of measuring it is to then close it.
 */

import { MongoClient } from "mongodb";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { goldenPseudonymId, goldenAssessmentId } from "./ids.js";

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

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "vigor";
const RESET = process.argv.includes("--reset");
const sizeArg = process.argv.indexOf("--size");
const COHORT_SIZE = sizeArg > -1 ? Number(process.argv[sizeArg + 1]) : 240;

if (!uri || uri.includes("USER:PASSWORD")) {
  console.error("MONGODB_URI is not set. Copy .env.example to .env first.");
  process.exit(1);
}

/* ----------------------------------------------- deterministic randomness */

// mulberry32: small, fast, and seeded, so the demo numbers never move.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261102);
const pick = (xs) => xs[Math.floor(rand() * xs.length)];
const chance = (p) => rand() < p;
const int = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

let counter = 0;
const id = (prefix) => `${prefix}_${(++counter).toString(36).padStart(4, "0")}${Math.floor(rand() * 1e6).toString(36)}`;

const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();
const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();

/* ------------------------------------------------------ service catalogue */

const FACILITIES = [
  {
    facilityId: "fac_001",
    name: "Abu Dhabi Andrology & Men's Health Centre",
    serviceTypes: ["andrology", "urology"],
    emirate: "Abu Dhabi",
    teleconsult: true,
    maleClinicianAvailable: true,
    languages: ["ar", "en"],
    acceptsSelfReferral: true,
    typicalWaitDays: 4,
  },
  {
    facilityId: "fac_002",
    name: "Al Ain Urology Clinic",
    serviceTypes: ["urology"],
    emirate: "Abu Dhabi",
    teleconsult: false,
    maleClinicianAvailable: true,
    languages: ["ar"],
    acceptsSelfReferral: true,
    typicalWaitDays: 9,
  },
  {
    facilityId: "fac_003",
    name: "Capital Reproductive Medicine Institute",
    serviceTypes: ["fertility", "andrology"],
    emirate: "Abu Dhabi",
    teleconsult: true,
    maleClinicianAvailable: true,
    languages: ["ar", "en", "ur"],
    acceptsSelfReferral: false,
    typicalWaitDays: 12,
  },
  {
    facilityId: "fac_004",
    name: "Khalifa City Primary Health Centre",
    serviceTypes: ["primary_care"],
    emirate: "Abu Dhabi",
    teleconsult: true,
    maleClinicianAvailable: true,
    languages: ["ar", "en"],
    acceptsSelfReferral: true,
    typicalWaitDays: 2,
  },
  {
    facilityId: "fac_005",
    name: "Yas Men's Telehealth Service",
    serviceTypes: ["primary_care", "andrology"],
    emirate: "Abu Dhabi",
    teleconsult: true,
    maleClinicianAvailable: true,
    languages: ["en", "ar", "hi"],
    acceptsSelfReferral: true,
    typicalWaitDays: 1,
  },
  {
    facilityId: "fac_006",
    name: "Western Region Fertility Unit",
    serviceTypes: ["fertility"],
    emirate: "Abu Dhabi",
    teleconsult: false,
    maleClinicianAvailable: false,
    languages: ["ar", "en"],
    acceptsSelfReferral: false,
    typicalWaitDays: 21,
  },
];

/* ------------------------------------------------------------- generators */

const AGE_BANDS = ["18-24", "25-29", "30-34", "35-39", "40+"];

// Realistic, not flattering. Completion is lower for the Arabic locale and the
// youngest band; workflow 08 is supposed to catch that and say so.
const COMPLETION_BY_LOCALE = { en: 0.86, ar: 0.74 };
const COMPLETION_BY_AGE = { "18-24": 0.7, "25-29": 0.84, "30-34": 0.86, "35-39": 0.85, "40+": 0.8 };

function makeConsent(pseudonymId, scope, locale, { granted = true, days = 10 } = {}) {
  return {
    consentId: id("cns"),
    pseudonymId,
    scope,
    granted,
    version: "consent-v1.2",
    lawfulBasis: "explicit_consent",
    locale,
    grantedAt: daysAgo(days),
    expiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
    revokedAt: null,
    supersedes: null,
    evidence: { uiSurface: "consent_sheet_v1", seeded: true },
  };
}

function makeAnswers() {
  const trying = chance(0.45) ? int(1, 36) : 0;
  const answers = {
    monthsTrying: trying,
    priorConception: chance(0.25),
    bmi: round(18 + rand() * 20),
    smoking: pick(["never", "never", "former", "current"]),
    alcohol: pick(["none", "none", "occasional", "weekly"]),
    heatExposure: pick(["none", "occasional", "frequent"]),
    sleepHours: int(4, 9),
    symptoms: [],
  };
  if (answers.bmi > 30) {
    answers.waistCm = int(100, 120);
    answers.diabetes = pick(["none", "prediabetes", "type2"]);
    if (answers.diabetes !== "none") answers.hba1c = round(5.8 + rand() * 3);
  }
  if (answers.smoking === "current") answers.packYears = int(1, 25);
  if (chance(0.08)) answers.symptoms.push("scrotal_ache");
  if (chance(0.05)) answers.libidoChange = "reduced";
  if (chance(0.04)) answers.varicocele = "known";
  // Deliberately rare. A cohort stuffed with emergencies would make the SLA
  // numbers meaningless.
  if (chance(0.015)) {
    answers.symptoms = ["acute_scrotal_pain"];
    answers.painOnsetHours = int(1, 5);
  } else if (chance(0.01)) {
    answers.symptoms = ["testicular_lump"];
  }
  return answers;
}

function tierFor(answers) {
  if ((answers.symptoms ?? []).includes("acute_scrotal_pain")) return "URGENT";
  if ((answers.symptoms ?? []).includes("testicular_lump")) return "URGENT";
  if (answers.monthsTrying >= 12) return "ANDROLOGY_UROLOGY";
  if (answers.bmi > 30 || answers.smoking === "current") return "PRIMARY_CARE";
  if (answers.monthsTrying > 0) return "PRIMARY_CARE";
  return "SELF_CARE";
}

/* ------------------------------------------------------------------- main */

const client = new MongoClient(uri);
const COLLECTIONS = [
  "subjects", "consents", "assessments", "risk_scores", "triage_decisions",
  "escalations", "referrals", "kit_orders", "lab_results", "notifications",
  "audit_log", "metrics_daily", "service_catalogue",
];

try {
  await client.connect();
  const db = client.db(dbName);

  if (RESET) {
    for (const c of COLLECTIONS) {
      const n = await db.collection(c).deleteMany({});
      if (n.deletedCount) console.log(`cleared ${String(n.deletedCount).padStart(5)} from ${c}`);
    }
    console.log("");
  }

  /* service catalogue */
  for (const f of FACILITIES) {
    await db.collection("service_catalogue").updateOne(
      { facilityId: f.facilityId },
      { $set: f },
      { upsert: true },
    );
  }
  console.log(`service_catalogue   ${FACILITIES.length} facilities`);

  /* golden cases */
  const golden = JSON.parse(readFileSync(join(root, "tools/seed/golden-cases.json"), "utf8"));
  const goldenSubjects = [];

  for (const gc of golden.cases) {
    const pseudonymId = goldenPseudonymId(gc.id);
    const subject = {
      pseudonymId,
      locale: gc.locale,
      accountLinked: false,
      ageBand: gc.ageBand,
      emirate: "Abu Dhabi",
      createdAt: daysAgo(1),
      lastSeenAt: hoursAgo(2),
      erasedAt: null,
      goldenCaseId: gc.id,
    };
    await db.collection("subjects").updateOne({ pseudonymId }, { $set: subject }, { upsert: true });

    const consents = [
      makeConsent(pseudonymId, "ASSESSMENT", gc.locale, { days: 1 }),
      makeConsent(pseudonymId, "STORE_RESULTS", gc.locale, { days: 1 }),
      makeConsent(pseudonymId, "SHARE_WITH_CLINICIAN", gc.locale, { days: 1 }),
      makeConsent(pseudonymId, "AT_HOME_TESTING", gc.locale, { days: 1 }),
      makeConsent(pseudonymId, "CONTACT_REMINDERS", gc.locale, { days: 1 }),
    ];
    // GC13 is a fertility-service case, so it needs that specific scope.
    if (gc.expectedTier === "FERTILITY_SERVICES") {
      consents.push(makeConsent(pseudonymId, "SHARE_WITH_FERTILITY_SERVICE", gc.locale, { days: 1 }));
    }
    await db.collection("consents").deleteMany({ pseudonymId });
    await db.collection("consents").insertMany(consents);

    goldenSubjects.push({
      caseId: gc.id,
      label: gc.label,
      pseudonymId,
      assessmentId: goldenAssessmentId(gc.id),
      consentId: consents[0].consentId,
      locale: gc.locale,
      answers: gc.answers,
      expectedRedFlags: gc.expectedRedFlags,
      expectedMinimumTier: gc.expectedMinimumTier,
      expectedTier: gc.expectedTier,
    });
  }
  console.log(`golden cases        ${goldenSubjects.length} subjects with full consent`);

  /* synthetic cohort */
  const subjects = [];
  const consents = [];
  const assessments = [];
  const riskScores = [];
  const decisions = [];
  const escalations = [];
  const referrals = [];
  const kits = [];
  const notifications = [];
  const audit = [];

  for (let i = 0; i < COHORT_SIZE; i++) {
    const locale = chance(0.55) ? "ar" : "en";
    const ageBand = pick(AGE_BANDS);
    const pseudonymId = id("psn");
    const startedDaysAgo = round(rand() * 29, 2);

    subjects.push({
      pseudonymId,
      locale,
      accountLinked: chance(0.35),
      ageBand,
      emirate: "Abu Dhabi",
      createdAt: daysAgo(startedDaysAgo + 0.1),
      lastSeenAt: daysAgo(startedDaysAgo),
      erasedAt: null,
      contact: chance(0.35)
        ? { preferredChannel: pick(["in_app", "email", "sms"]) }
        : undefined,
    });

    consents.push(makeConsent(pseudonymId, "ASSESSMENT", locale, { days: startedDaysAgo + 0.1 }));
    if (chance(0.9)) consents.push(makeConsent(pseudonymId, "STORE_RESULTS", locale, { days: startedDaysAgo + 0.1 }));
    if (chance(0.6)) consents.push(makeConsent(pseudonymId, "CONTACT_REMINDERS", locale, { days: startedDaysAgo + 0.1 }));
    if (chance(0.5)) consents.push(makeConsent(pseudonymId, "SHARE_WITH_CLINICIAN", locale, { days: startedDaysAgo + 0.1 }));
    if (chance(0.3)) consents.push(makeConsent(pseudonymId, "AT_HOME_TESTING", locale, { days: startedDaysAgo + 0.1 }));

    const pComplete = (COMPLETION_BY_LOCALE[locale] + COMPLETION_BY_AGE[ageBand]) / 2;
    const completed = chance(pComplete);
    const answers = makeAnswers();
    const assessmentId = id("asm");

    const assessment = {
      assessmentId,
      pseudonymId,
      locale,
      consentId: consents[consents.length - 1].consentId,
      status: completed ? "completed" : "started",
      startedAt: daysAgo(startedDaysAgo),
      completedAt: completed ? daysAgo(startedDaysAgo - 0.005) : null,
      durationSec: completed ? int(180, 900) : null,
      answers,
      answeredItemCount: completed ? int(18, 38) : int(0, 14),
      skippedSensitive: completed && chance(0.3) ? ["sexualFunctionDetail"] : [],
      nudgeCount: 0,
      lastNudgeAt: null,
      nudgeStopped: false,
    };
    assessments.push(assessment);

    if (!completed) continue;

    const tier = tierFor(answers);
    const scoreId = id("scr");
    const decisionId = id("trg");
    const redFlags =
      tier === "URGENT"
        ? (answers.symptoms ?? []).includes("testicular_lump")
          ? ["RF_TESTICULAR_MASS"]
          : ["RF_ACUTE_SCROTAL_PAIN"]
        : [];

    const metabolic = answers.bmi > 30 ? 0.6 + rand() * 0.3 : 0.15 + rand() * 0.3;
    const lifestyle = answers.smoking === "current" ? 0.55 + rand() * 0.3 : 0.1 + rand() * 0.3;

    riskScores.push({
      scoreId,
      assessmentId,
      pseudonymId,
      modelVersion: "risk-engine-0.3.0",
      computedAt: assessment.completedAt,
      domains: [
        {
          domain: "metabolic",
          score: round(metabolic, 2),
          band: metabolic > 0.6 ? "elevated" : metabolic > 0.4 ? "moderate" : "low",
          drivers: answers.bmi > 30 ? [{ code: "BMI_OBESE", label: `BMI ${answers.bmi}`, weight: 0.3, modifiable: true }] : [],
        },
        {
          domain: "lifestyle",
          score: round(lifestyle, 2),
          band: lifestyle > 0.5 ? "elevated" : "low",
          drivers: answers.smoking === "current" ? [{ code: "SMOKING_CURRENT", label: "Current smoker", weight: 0.25, modifiable: true }] : [],
        },
        { domain: "infectious", score: round(0.1 + rand() * 0.3, 2), band: "low", drivers: [] },
        { domain: "anatomical", score: round(0.1 + rand() * 0.4, 2), band: "low", drivers: [] },
        { domain: "endocrine", score: round(0.1 + rand() * 0.4, 2), band: "low", drivers: [] },
        { domain: "semen", score: null, band: "unknown", drivers: [], note: "No semen analysis on file" },
      ],
      overall: {
        score: round((metabolic + lifestyle) / 2, 2),
        band: (metabolic + lifestyle) / 2 > 0.55 ? "elevated" : "moderate",
        confidence: 0.62,
      },
      missingInputs: ["semen_analysis"],
      // A small share of runs happened while the engine was unavailable, so the
      // degradation metric is not permanently zero in the demo.
      degraded: chance(0.03),
    });

    const needsReview = redFlags.length > 0;
    decisions.push({
      decisionId,
      assessmentId,
      pseudonymId,
      scoreId,
      tier,
      redFlags,
      rationale: "Seeded decision for cohort metrics.",
      rationaleLocale: locale,
      requiresHumanReview: needsReview,
      source: "engine",
      clamped: chance(0.04),
      tierBeforeClamp: tier,
      reviewedBy: needsReview && chance(0.85) ? "clinician:dr_seed" : null,
      reviewedAt: needsReview && chance(0.85) ? daysAgo(startedDaysAgo - 0.02) : null,
      reviewOutcome: needsReview ? pick(["approved", "approved", "escalated"]) : null,
      reviewNote: null,
      status: needsReview ? (chance(0.85) ? "final" : "pending_review") : "final",
      createdAt: assessment.completedAt,
    });

    if (needsReview) {
      const createdAt = assessment.completedAt;
      const ackFast = chance(0.8);
      escalations.push({
        escalationId: id("esc"),
        pseudonymId,
        decisionId,
        assessmentId,
        redFlags,
        reasons: [],
        severity: "URGENT",
        slaMinutes: 60,
        dueAt: new Date(new Date(createdAt).getTime() + 3600000).toISOString(),
        status: ackFast ? "closed" : chance(0.5) ? "breached" : "open",
        acknowledgedBy: ackFast ? "clinician:dr_seed" : null,
        acknowledgedAt: ackFast
          ? new Date(new Date(createdAt).getTime() + int(4, 55) * 60000).toISOString()
          : null,
        createdAt,
        closedAt: ackFast ? new Date(new Date(createdAt).getTime() + int(10, 58) * 60000).toISOString() : null,
      });
    }

    if (["ANDROLOGY_UROLOGY", "FERTILITY_SERVICES", "PRIMARY_CARE"].includes(tier) && chance(0.55)) {
      const facility = pick(FACILITIES.filter((f) => f.serviceTypes.includes(tier === "FERTILITY_SERVICES" ? "fertility" : tier === "PRIMARY_CARE" ? "primary_care" : "andrology")));
      const dispatchedAt = assessment.completedAt;
      const progressed = chance(0.42);
      const days = round(1 + rand() * 13, 1);
      referrals.push({
        referralId: id("ref"),
        pseudonymId,
        decisionId,
        assessmentId,
        tier,
        serviceType: tier === "FERTILITY_SERVICES" ? "fertility" : tier === "PRIMARY_CARE" ? "primary_care" : "andrology",
        facility: {
          id: facility.facilityId,
          name: facility.name,
          emirate: facility.emirate,
          teleconsult: facility.teleconsult,
          maleClinicianAvailable: facility.maleClinicianAvailable,
        },
        consentId: consents[consents.length - 1].consentId,
        shareToken: {
          token: id("shr"),
          expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
          scope: ["risk_summary", "red_flags", "tier"],
          revokedAt: null,
          accessCount: int(0, 3),
        },
        status: progressed ? pick(["attended", "completed", "booked"]) : pick(["dispatched", "accepted", "declined"]),
        dispatchedAt,
        bookedAt: progressed ? new Date(new Date(dispatchedAt).getTime() + days * 43200000).toISOString() : null,
        attendedAt: progressed ? new Date(new Date(dispatchedAt).getTime() + days * 86400000).toISOString() : null,
        completedAt: null,
        daysToEvaluation: progressed ? days : null,
        statusHistory: [{ status: "dispatched", at: dispatchedAt, by: "seed" }],
      });
    }

    if (chance(0.22)) {
      const requestedAt = assessment.completedAt;
      const returned = chance(0.55);
      kits.push({
        kitOrderId: id("kit"),
        pseudonymId,
        assessmentId,
        status: returned ? pick(["returned", "lab_received", "resulted"]) : pick(["dispatched", "delivered", "expired"]),
        discreetPackaging: true,
        deliveryMode: pick(["locker", "locker", "home", "pickup_point"]),
        dropPointRef: null,
        deliveryWindow: "evening",
        carrier: "local_courier",
        trackingRef: id("trk"),
        abstinenceWindowHours: 48,
        locale,
        remindersStopped: returned,
        remindersSent: returned ? 0 : int(0, 2),
        lastReminderAt: null,
        requestedAt,
        dispatchedAt: requestedAt,
        returnedAt: returned ? new Date(new Date(requestedAt).getTime() + int(2, 9) * 86400000).toISOString() : null,
        expiresAt: new Date(new Date(requestedAt).getTime() + 21 * 86400000).toISOString(),
        labRef: null,
      });
    }

    audit.push({
      at: assessment.completedAt,
      actor: "workflow:01-intake-completed",
      action: "TRIAGE_DECIDED",
      pseudonymId,
      subjectRef: { collection: "triage_decisions", id: decisionId },
      consentId: assessment.consentId,
      workflowRunId: "seed",
      outcome: "ok",
      meta: { tier, redFlagCount: redFlags.length, source: "engine" },
    });
  }

  // Nudges for a share of the abandoned assessments, so the frequency cap and
  // the suppression metrics have something to report on.
  for (const a of assessments.filter((x) => x.status === "started")) {
    if (!chance(0.4)) continue;
    a.nudgeCount = 1;
    a.lastNudgeAt = daysAgo(1);
    notifications.push({
      notificationId: id("ntf"),
      pseudonymId: a.pseudonymId,
      template: "reengagement_nudge",
      locale: a.locale,
      channel: "in_app",
      discreet: true,
      subject: a.locale === "ar" ? "تحديث من فيجور" : "Your Vigor update",
      consentId: null,
      status: "sent",
      attempt: 1,
      sentAt: daysAgo(1),
      createdAt: daysAgo(1),
      revealsTopic: false,
      nudgeNumber: 1,
      relatedAssessmentId: a.assessmentId,
    });
  }

  const insert = async (name, docs) => {
    if (!docs.length) return;
    await db.collection(name).insertMany(docs, { ordered: false });
    console.log(`${name.padEnd(20)}${String(docs.length).padStart(5)} documents`);
  };

  await insert("subjects", subjects);
  await insert("consents", consents);
  await insert("assessments", assessments);
  await insert("risk_scores", riskScores);
  await insert("triage_decisions", decisions);
  await insert("escalations", escalations);
  await insert("referrals", referrals);
  await insert("kit_orders", kits);
  await insert("notifications", notifications);
  await insert("audit_log", audit);

  /* A manifest the smoke tests read, so they do not have to invent ids. */
  const manifest = {
    generatedAt: new Date().toISOString(),
    cohortSize: COHORT_SIZE,
    goldenSubjects,
    labCases: golden.labCases,
    sampleShareToken: referrals.find((r) => r.status === "dispatched")?.shareToken.token ?? null,
    // The smoke test revokes this subject, so it needs to know who owns the token.
    sampleReferralPseudonymId: referrals.find((r) => r.status === "dispatched")?.pseudonymId ?? null,
    samplePendingDecisionId: decisions.find((d) => d.status === "pending_review")?.decisionId ?? null,
  };
  const { writeFileSync } = await import("node:fs");
  writeFileSync(join(root, "tools/seed/manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  console.log(`\nWrote tools/seed/manifest.json`);
  console.log(
    `Cohort: ${COHORT_SIZE} subjects, ${assessments.filter((a) => a.status === "completed").length} completed ` +
      `(${Math.round((assessments.filter((a) => a.status === "completed").length / COHORT_SIZE) * 100)}%), ` +
      `${escalations.length} escalations, ${referrals.length} referrals, ${kits.length} kits.`,
  );
  console.log("Completion is intentionally uneven across locale and age band, so the fairness gap in workflow 08 is non-zero.");
} catch (err) {
  console.error(`\nSeed failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.close();
}
