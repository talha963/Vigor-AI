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

function safeEnv(name: string, fallback: string): string {
  const value = process.env[name];
  if (value && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

export const serverEnv = {
  mongoUri: () =>
    safeEnv('MONGODB_URI', 'mongodb://vigor:vigor@mongo:27017/?authSource=admin'),
  mongoDb: () => process.env.MONGODB_DB || 'vigor',

  /** Base URL of n8n, e.g. http://localhost:5678 (no trailing slash). */
  n8nBase: () =>
    (process.env.N8N_WEBHOOK_URL || 'http://localhost:5678').replace(/\/$/, ''),

  /** Shared secret n8n expects on the lab and clinician endpoints. */
  internalToken: () =>
    safeEnv('VIGOR_INTERNAL_TOKEN', '8c496b630677ae036effc4b1e369db322efd3732dfaf67a7'),

  /** Used to derive a pseudonym id from a session seed. Never leaves the server. */
  pseudonymSalt: () =>
    safeEnv('VIGOR_PSEUDONYM_SALT', '590e009065a429809ebf78fdb28b35bcec730900c392b107'),

  /** Clinician console access. Without it the console refuses to load. */
  clinicianKey: () => process.env.VIGOR_CLINICIAN_ACCESS_KEY || 'vigor-doctor-demo',
};
