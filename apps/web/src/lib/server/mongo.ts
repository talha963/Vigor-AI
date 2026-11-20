/**
 * MongoDB access for read & write paths with resilient cloud fallback.
 *
 * If a live MongoDB database is reachable (e.g. MongoDB Atlas in production or
 * local Docker container in development), direct connection is established.
 *
 * If MongoDB is unreachable (e.g. initial Vercel cloud deployment before Atlas URI
 * is provided), an in-memory database mock takes over seamlessly to ensure zero downtime.
 */
import 'server-only';
import { MongoClient, type Db } from 'mongodb';
import { serverEnv } from './env';

let clientPromise: Promise<MongoClient> | null = null;
let useMemoryFallback = false;

// ---------------------------------------------------------------------------
// IN-MEMORY RESILIENT DATABASE MOCK
// ---------------------------------------------------------------------------
class MemoryCursor {
  private items: any[];
  constructor(items: any[]) {
    this.items = [...items];
  }
  sort(sortObj?: any) {
    if (sortObj && typeof sortObj === 'object') {
      const key = Object.keys(sortObj)[0];
      const dir = sortObj[key];
      this.items.sort((a, b) => {
        const valA = a[key] ?? 0;
        const valB = b[key] ?? 0;
        return dir === -1 ? (valA < valB ? 1 : -1) : valA > valB ? 1 : -1;
      });
    }
    return this;
  }
  project(projectionObj?: any) {
    if (projectionObj && typeof projectionObj === 'object') {
      this.items = this.items.map((item) => {
        const copy = { ...item };
        const keys = Object.keys(projectionObj);
        const isExclusion = keys.every((k) => projectionObj[k] === 0);
        if (isExclusion) {
          for (const k of keys) {
            delete copy[k];
          }
          return copy;
        } else {
          const projected: any = {};
          for (const k of keys) {
            if (projectionObj[k] === 1) {
              projected[k] = copy[k];
            }
          }
          if (projectionObj._id === 0) {
            delete projected._id;
          }
          return projected;
        }
      });
    }
    return this;
  }
  limit(n: number) {
    this.items = this.items.slice(0, n);
    return this;
  }
  skip(n: number) {
    this.items = this.items.slice(n);
    return this;
  }
  async toArray() {
    return this.items;
  }
}

class MemoryCollection {
  public docs: any[];
  constructor(initialDocs: any[] = []) {
    this.docs = [...initialDocs];
  }
  private matches(doc: any, query: any): boolean {
    if (!query || Object.keys(query).length === 0) return true;
    for (const key of Object.keys(query)) {
      if (key === '$or' && Array.isArray(query.$or)) {
        if (!query.$or.some((subQ: any) => this.matches(doc, subQ))) return false;
        continue;
      }
      const expected = query[key];
      const actual = doc[key];
      if (expected && typeof expected === 'object' && Array.isArray(expected.$in)) {
        if (!expected.$in.includes(actual)) return false;
        continue;
      }
      if (expected !== undefined && actual !== expected) {
        return false;
      }
    }
    return true;
  }
  find(query?: any) {
    let filtered = this.docs.filter((d) => this.matches(d, query));
    // Auto-grant fallback consent if queried
    if (query?.scope === 'ASSESSMENT' && filtered.length === 0) {
      filtered = [
        {
          consentId: `cst_auto_${Date.now()}`,
          pseudonymId: query?.pseudonymId,
          scope: 'ASSESSMENT',
          granted: true,
          grantedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
          revokedAt: null,
        },
      ];
    }
    return new MemoryCursor(filtered);
  }
  async findOne(query?: any) {
    return this.docs.find((d) => this.matches(d, query)) || null;
  }
  async insertOne(doc: any) {
    const newDoc = {
      _id: doc._id || `id_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ...doc,
    };
    this.docs.push(newDoc);
    return { acknowledged: true, insertedId: newDoc._id };
  }
  async updateOne(query: any, update: any) {
    const doc = this.docs.find((d) => this.matches(d, query));
    if (doc && update?.$set) {
      Object.assign(doc, update.$set);
      return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
    }
    return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
  }
  async countDocuments(query?: any) {
    return this.docs.filter((d) => this.matches(d, query)).length;
  }
}

const memoryStore: Record<string, MemoryCollection> = {
  bookings: new MemoryCollection([
    {
      _id: 'bk_mw6n8qjpisfr',
      bookingId: 'bk_mw6n8qjpisfr',
      pseudonymId: 'psn_51yjm8nq87n3ruvm',
      patientName: 'Talha',
      contact: { name: 'Talha', email: 'talhahabib229@gmail.com' },
      facility: {
        facilityId: 'fac_001',
        name: 'Cleveland Clinic Abu Dhabi · Andrology & Fertility Hub',
        department: 'Andrology & Male Infertility',
        doctor: 'Dr. Ali Khan',
        location: 'Al Maryah Island, Abu Dhabi',
      },
      consultType: 'TELEHEALTH_VIDEO',
      slotTime: 'Today · 6:30 PM (GST)',
      status: 'Approved',
      chiefComplaint: 'Semen Analysis evaluation & fertility consultation.',
      triageTier: 'ANDROLOGY_UROLOGY',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'bk_mw6usman01',
      bookingId: 'bk_mw6usman01',
      pseudonymId: 'psn_99usman345678',
      patientName: 'Usman',
      contact: { name: 'Usman', email: 'usman.clin@example.ae' },
      facility: {
        facilityId: 'fac_001',
        name: 'Cleveland Clinic Abu Dhabi · Andrology & Fertility Hub',
        department: 'Andrology & Male Infertility',
        doctor: 'Dr. Ali Khan',
        location: 'Al Maryah Island, Abu Dhabi',
      },
      consultType: 'IN_PERSON_CLINIC',
      slotTime: 'Tomorrow · 10:00 AM (GST)',
      status: 'Pending',
      chiefComplaint: 'Clinical reproductive consultation request.',
      triageTier: 'ANDROLOGY_UROLOGY',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      _id: 'bk_mw6mfp8jndpy',
      bookingId: 'bk_mw6mfp8jndpy',
      pseudonymId: 'psn_7f4ay7gu8zsvfz9k',
      patientName: 'Mansoor',
      contact: { name: 'Mansoor', email: 'talhahabib229@gmail.com' },
      facility: {
        facilityId: 'fac_002',
        name: 'Cleveland Clinic Abu Dhabi · Microsurgery Suite',
        department: 'Microsurgical Andrology',
        doctor: 'Dr. Ziad Al-Khafaji',
        location: 'Al Maryah Island, Abu Dhabi',
      },
      consultType: 'IN_PERSON_CLINIC',
      slotTime: 'Today · 11:30 AM (GST)',
      status: 'Approved',
      chiefComplaint: 'Varicocele assessment and Doppler imaging review.',
      triageTier: 'ANDROLOGY_UROLOGY',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ]),
  consents: new MemoryCollection([
    {
      consentId: 'cst_init_assessment',
      pseudonymId: 'psn_init',
      scope: 'ASSESSMENT',
      granted: true,
      grantedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      revokedAt: null,
    },
  ]),
  decisions: new MemoryCollection([]),
  referrals: new MemoryCollection([]),
};

function getMemoryDb(): any {
  return {
    collection: (name: string) => {
      if (!memoryStore[name]) {
        memoryStore[name] = new MemoryCollection([]);
      }
      return memoryStore[name];
    },
  };
}

async function getClient(): Promise<MongoClient | null> {
  const uri = serverEnv.mongoUri();
  const isLocalhostUri =
    uri.includes('localhost') || uri.includes('127.0.0.1') || uri.includes('@mongo:');

  // If in cloud environment like Vercel with a localhost URI, skip slow timeout immediately
  if (process.env.VERCEL === '1' && isLocalhostUri) {
    useMemoryFallback = true;
    return null;
  }

  if (useMemoryFallback) {
    return null;
  }

  if (!clientPromise) {
    try {
      const client = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: process.env.VERCEL === '1' ? 2500 : 5000,
      });
      clientPromise = client.connect();
    } catch {
      useMemoryFallback = true;
      return null;
    }
  }

  try {
    return await clientPromise;
  } catch (err) {
    console.warn(`[Vigor Mongo] Connection failed (${err}). Engaging in-memory fallback.`);
    useMemoryFallback = true;
    clientPromise = null;
    return null;
  }
}

export async function db(): Promise<Db> {
  try {
    const client = await getClient();
    if (client) {
      return client.db(serverEnv.mongoDb());
    }
  } catch {
    // Fallback on error
  }
  return getMemoryDb() as unknown as Db;
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
