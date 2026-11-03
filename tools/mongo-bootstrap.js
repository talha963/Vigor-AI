#!/usr/bin/env node
/**
 * Creates the Vigor collections, their indexes and their schema validators.
 *
 *   node tools/mongo-bootstrap.js
 *
 * Idempotent: safe to run against an existing database. Nothing here drops data.
 *
 * Two things are enforced at the database level rather than left to the
 * application, because the whole privacy story depends on them holding even if a
 * workflow has a bug:
 *
 *  - `audit_log`, `consents` and `lab_results` get a validator that requires the
 *    fields an auditor would need, so a half-written record is rejected.
 *  - `audit_log.meta` is explicitly documented as never containing answer values,
 *    and a validator rejects an `answers` key appearing inside it.
 */

import { MongoClient } from "mongodb";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/* Minimal .env loader, so this works without adding a dependency. */
function loadEnv() {
  const file = join(root, ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}
loadEnv();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "vigor";

if (!uri || uri.includes("USER:PASSWORD")) {
  console.error(
    "MONGODB_URI is not set. Copy .env.example to .env and put your Atlas connection string in it.",
  );
  process.exit(1);
}

const COLLECTIONS = {
  subjects: {
    indexes: [
      [{ pseudonymId: 1 }, { unique: true, name: "pseudonymId_unique" }],
      [{ erasedAt: 1 }, { name: "erasedAt", sparse: true }],
    ],
  },

  consents: {
    indexes: [
      [{ consentId: 1 }, { unique: true, name: "consentId_unique" }],
      // The consent gate reads this on every single workflow run.
      [{ pseudonymId: 1, scope: 1, grantedAt: -1 }, { name: "consent_gate" }],
      [{ pseudonymId: 1, revokedAt: 1 }, { name: "revocation_lookup" }],
    ],
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["consentId", "pseudonymId", "scope", "granted", "version", "lawfulBasis"],
        properties: {
          scope: {
            enum: [
              "ASSESSMENT",
              "STORE_RESULTS",
              "SHARE_WITH_CLINICIAN",
              "SHARE_WITH_FERTILITY_SERVICE",
              "AT_HOME_TESTING",
              "CONTACT_REMINDERS",
              "RESEARCH_AGGREGATE",
            ],
          },
          granted: { bsonType: "bool" },
        },
      },
    },
  },

  assessments: {
    indexes: [
      [{ assessmentId: 1 }, { unique: true, name: "assessmentId_unique" }],
      [{ pseudonymId: 1, completedAt: -1 }, { name: "subject_history" }],
      // Workflow 06 sweeps on this.
      [{ status: 1, startedAt: 1 }, { name: "abandoned_sweep" }],
      [{ idempotencyKey: 1 }, { unique: true, sparse: true, name: "idempotency" }],
    ],
  },

  risk_scores: {
    indexes: [
      [{ scoreId: 1 }, { unique: true, name: "scoreId_unique" }],
      [{ assessmentId: 1, computedAt: -1 }, { name: "latest_for_assessment" }],
      [{ computedAt: 1 }, { name: "rollup_window" }],
    ],
  },

  triage_decisions: {
    indexes: [
      [{ decisionId: 1 }, { unique: true, name: "decisionId_unique" }],
      // The clinician review queue.
      [{ status: 1, createdAt: 1 }, { name: "review_queue" }],
      [{ pseudonymId: 1, createdAt: -1 }, { name: "subject_decisions" }],
      [{ createdAt: 1 }, { name: "rollup_window" }],
    ],
  },

  escalations: {
    indexes: [
      [{ escalationId: 1 }, { unique: true, name: "escalationId_unique" }],
      // The SLA sweep in workflow 02 lives on this index.
      [{ status: 1, dueAt: 1 }, { name: "sla_sweep" }],
      [{ decisionId: 1, status: 1 }, { name: "decision_lookup" }],
    ],
  },

  referrals: {
    indexes: [
      [{ referralId: 1 }, { unique: true, name: "referralId_unique" }],
      // Facility callbacks resolve the referral by token.
      [{ "shareToken.token": 1 }, { unique: true, sparse: true, name: "share_token_unique" }],
      [{ status: 1, dispatchedAt: 1 }, { name: "completion_metrics" }],
      [{ pseudonymId: 1, dispatchedAt: -1 }, { name: "subject_referrals" }],
    ],
  },

  kit_orders: {
    indexes: [
      [{ kitOrderId: 1 }, { unique: true, name: "kitOrderId_unique" }],
      [{ status: 1, remindersStopped: 1 }, { name: "kit_sweep" }],
      [{ pseudonymId: 1, requestedAt: -1 }, { name: "subject_kits" }],
      [{ requestedAt: 1 }, { name: "rollup_window" }],
    ],
  },

  lab_results: {
    indexes: [
      [{ resultId: 1 }, { unique: true, name: "resultId_unique" }],
      [{ pseudonymId: 1, receivedAt: -1 }, { name: "latest_result" }],
      [{ kitOrderId: 1 }, { name: "kit_lookup", sparse: true }],
    ],
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["resultId", "pseudonymId", "panel", "whoRefVersion", "receivedAt"],
        properties: {
          whoRefVersion: {
            bsonType: "string",
            description:
              "Which reference standard the flags were computed against. Required, because flags are meaningless without it.",
          },
        },
      },
    },
  },

  notifications: {
    indexes: [
      [{ notificationId: 1 }, { unique: true, name: "notificationId_unique" }],
      // Workflow 06 enforces its frequency cap with this.
      [{ pseudonymId: 1, template: 1, createdAt: -1 }, { name: "frequency_cap" }],
      [{ createdAt: 1 }, { name: "rollup_window" }],
    ],
  },

  audit_log: {
    indexes: [
      // A subject access request is answered from this index.
      [{ pseudonymId: 1, at: -1 }, { name: "subject_access_request" }],
      [{ action: 1, at: -1 }, { name: "action_history" }],
      [{ workflowRunId: 1 }, { name: "run_lookup" }],
      [{ at: 1 }, { name: "rollup_window" }],
    ],
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["at", "actor", "action"],
        properties: {
          meta: {
            bsonType: "object",
            // The audit log records that something happened, never what was said.
            // This is enforced here so a buggy workflow cannot turn the audit
            // trail into a second copy of the clinical data.
            properties: {
              answers: { bsonType: "null", description: "Answer values must never be audited." },
            },
          },
        },
      },
    },
  },

  metrics_daily: {
    indexes: [
      // The rollup upserts on dateKey, not _id: the n8n MongoDB node coerces
      // whatever updateKey names through new ObjectId(), which rejects a date
      // string. Unique, so a re-run can only ever overwrite its own day.
      [{ dateKey: 1 }, { unique: true, name: "dateKey_unique" }],
      [{ computedAt: -1 }, { name: "recent_first" }],
    ],
  },

  service_catalogue: {
    indexes: [
      [{ facilityId: 1 }, { unique: true, name: "facilityId_unique" }],
      [{ serviceTypes: 1, emirate: 1 }, { name: "referral_matching" }],
    ],
  },

  kb_chunks: {
    indexes: [
      [{ chunkId: 1 }, { unique: true, name: "chunkId_unique" }],
      [{ locale: 1, topic: 1 }, { name: "topic_lookup" }],
    ],
  },
};

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db(dbName);
  console.log(`Connected to ${dbName}\n`);

  const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name));

  for (const [name, spec] of Object.entries(COLLECTIONS)) {
    if (!existing.has(name)) {
      await db.createCollection(name, spec.validator ? { validator: spec.validator } : {});
      console.log(`created collection  ${name}`);
    } else if (spec.validator) {
      await db.command({ collMod: name, validator: spec.validator, validationLevel: "moderate" });
      console.log(`collection exists   ${name}  (validator updated)`);
    } else {
      console.log(`collection exists   ${name}`);
    }

    for (const [keys, options] of spec.indexes) {
      try {
        const created = await db.collection(name).createIndex(keys, options);
        console.log(`  index            ${created}`);
      } catch (err) {
        // An index that already exists with different options is worth seeing
        // rather than swallowing.
        console.log(`  index SKIPPED    ${options.name}: ${err.message.split("\n")[0]}`);
      }
    }
  }

  console.log("\nAtlas Vector Search index for kb_chunks must be created in the Atlas UI or CLI:");
  console.log(
    JSON.stringify(
      {
        name: "kb_chunks_vector",
        type: "vectorSearch",
        definition: {
          fields: [
            { type: "vector", path: "embedding", numDimensions: 1024, similarity: "cosine" },
            { type: "filter", path: "locale" },
            { type: "filter", path: "topic" },
          ],
        },
      },
      null,
      2,
    ),
  );

  console.log("\nBootstrap complete.");
} catch (err) {
  console.error(`\nBootstrap failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.close();
}
