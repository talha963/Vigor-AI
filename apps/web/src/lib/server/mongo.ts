/**
 * MongoDB access for read paths only.
 *
 * Writes deliberately do NOT go through here. Every clinical write is a
 * lifecycle event owned by an n8n workflow, which is what produces the consent
 * check, the audit record and the escalation. Letting the web app write
 * directly to the collections would route around all three, so this module
 * exposes reads and nothing else.
 */
import 'server-only';
import { MongoClient, type Db } from 'mongodb';
import { serverEnv } from './env';

let clientPromise: Promise<MongoClient> | null = null;

function getClient(): Promise<MongoClient> {
  if (!clientPromise) {
    // Cached across hot reloads in dev, otherwise every edit opens a new pool.
    const client = new MongoClient(serverEnv.mongoUri(), {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function db(): Promise<Db> {
  const client = await getClient();
  return client.db(serverEnv.mongoDb());
}

/** Shape returned to the browser. Never includes raw answers or free text. */
export type SafeTriage = {
  decisionId: string;
  assessmentId: string | null;
  tier: string;
  redFlags: string[];
  rationale: string;
  requiresHumanReview: boolean;
  status: string;
  clamped: boolean;
  tierBeforeClamp: string | null;
  createdAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewOutcome: string | null;
};

export type SafeScore = {
  scoreId: string;
  modelVersion: string;
  computedAt: string;
  domains: Array<{
    domain: string;
    score: number | null;
    band: string;
    drivers: Array<{ code: string; label: string; weight: number; modifiable: boolean }>;
    note?: string;
  }>;
  overall: { score: number | null; band: string; confidence: number };
  missingInputs: string[];
  degraded: boolean;
};
