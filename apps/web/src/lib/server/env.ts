/**
 * Server-only configuration.
 *
 * Nothing in here may be imported from a client component. These values are the
 * MongoDB connection string, the n8n internal token and the pseudonym salt —
 * shipping any of them to the browser would hand an attacker the whole system.
 * `import 'server-only'` turns that mistake into a build error rather than a
 * silent leak.
 */
import 'server-only';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy the values from the repo root .env ` +
        `into apps/web/.env.local (see apps/web/.env.local.example).`,
    );
  }
  return value;
}

export const serverEnv = {
  mongoUri: () => required('MONGODB_URI'),
  mongoDb: () => process.env.MONGODB_DB || 'vigor',

  /** Base URL of n8n, e.g. http://localhost:5678 (no trailing slash). */
  n8nBase: () => (process.env.N8N_WEBHOOK_URL || 'http://localhost:5678').replace(/\/$/, ''),

  /** Shared secret n8n expects on the lab and clinician endpoints. */
  internalToken: () => required('VIGOR_INTERNAL_TOKEN'),

  /** Used to derive a pseudonym id from a session seed. Never leaves the server. */
  pseudonymSalt: () => required('VIGOR_PSEUDONYM_SALT'),

  /** Clinician console access. Without it the console refuses to load. */
  clinicianKey: () => process.env.VIGOR_CLINICIAN_ACCESS_KEY || '',
};
