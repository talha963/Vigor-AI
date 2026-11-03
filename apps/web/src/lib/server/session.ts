/**
 * Anonymous session.
 *
 * A man must be able to complete an assessment without an account, so identity
 * here is a pseudonym derived from a random seed:
 *
 *     seed            random 32 bytes, httpOnly cookie, never readable by JS
 *     pseudonymId     psn_ + HMAC-SHA256(seed, VIGOR_PSEUDONYM_SALT), base36
 *
 * The salt lives only in the server environment, so a stolen cookie jar cannot
 * be turned into the pseudonym ids that key the clinical collections, and a
 * database dump cannot be reversed into device identifiers.
 *
 * The id matches `^psn_[a-z0-9]{6,32}$` from packages/contracts/events.schema.json.
 */
import 'server-only';
import { createHmac, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { serverEnv } from './env';

const COOKIE = 'vigor_seed';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export function pseudonymFromSeed(seed: string): string {
  const mac = createHmac('sha256', serverEnv.pseudonymSalt()).update(seed).digest('hex');
  // Hex -> base36 keeps it inside [a-z0-9] and comfortably within 32 chars.
  const compact = BigInt('0x' + mac.slice(0, 24)).toString(36).slice(0, 16);
  return `psn_${compact.padEnd(12, '0')}`;
}

/** Reads the current session without creating one. */
export async function readSession(): Promise<{ seed: string; pseudonymId: string } | null> {
  const seed = (await cookies()).get(COOKIE)?.value;
  if (!seed) return null;
  return { seed, pseudonymId: pseudonymFromSeed(seed) };
}

/**
 * Returns the session, creating one if absent. Only callable from a route
 * handler or server action, because it may set a cookie.
 */
export async function ensureSession(): Promise<{ seed: string; pseudonymId: string; created: boolean }> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) {
    return { seed: existing, pseudonymId: pseudonymFromSeed(existing), created: false };
  }

  const seed = randomBytes(32).toString('hex');
  jar.set(COOKIE, seed, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
  return { seed, pseudonymId: pseudonymFromSeed(seed), created: true };
}

/** Used after erasure: the old pseudonym must not be reusable. */
export async function clearSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
