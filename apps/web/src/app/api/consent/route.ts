import { NextResponse } from 'next/server';
import { ensureSession, readSession } from '@/lib/server/session';
import { callWorkflow } from '@/lib/server/n8n';
import { db } from '@/lib/server/mongo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KNOWN_SCOPES = [
  'ASSESSMENT',
  'STORE_RESULTS',
  'SHARE_WITH_CLINICIAN',
  'SHARE_WITH_FERTILITY_SERVICE',
  'AT_HOME_TESTING',
  'CONTACT_REMINDERS',
  'RESEARCH_AGGREGATE',
];

/**
 * The live consent ledger for this session, read straight from MongoDB.
 *
 * This is what the privacy centre renders, so it must reflect the database and
 * not a browser copy — the whole point is that the user can verify what is
 * actually held about them.
 */
export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ pseudonymId: null, consents: [] });

  const database = await db();
  const rows = await database
    .collection('consents')
    .find({ pseudonymId: session.pseudonymId })
    .sort({ grantedAt: -1 })
    .limit(100)
    .toArray();

  const now = Date.now();
  const superseded = new Set(rows.map((r) => r.supersedes).filter(Boolean));

  const consents = rows.map((r) => ({
    consentId: r.consentId,
    scope: r.scope,
    granted: r.granted === true,
    version: r.version,
    grantedAt: r.grantedAt ?? null,
    expiresAt: r.expiresAt ?? null,
    revokedAt: r.revokedAt ?? null,
    live:
      r.granted === true &&
      !r.revokedAt &&
      !superseded.has(r.consentId) &&
      (!r.expiresAt || new Date(r.expiresAt).getTime() > now),
  }));

  // Active shares are the thing people actually want to check.
  const shares = await database
    .collection('referrals')
    .find({ pseudonymId: session.pseudonymId })
    .project({ _id: 0, referralId: 1, facility: 1, status: 1, dispatchedAt: 1, shareToken: 1 })
    .sort({ dispatchedAt: -1 })
    .limit(25)
    .toArray();

  return NextResponse.json({
    pseudonymId: session.pseudonymId,
    consents,
    shares: shares.map((s) => ({
      referralId: s.referralId,
      facility: s.facility?.name ?? null,
      status: s.status,
      dispatchedAt: s.dispatchedAt ?? null,
      revoked: Boolean(s.shareToken?.revokedAt),
      expiresAt: s.shareToken?.expiresAt ?? null,
      accessCount: s.shareToken?.accessCount ?? 0,
    })),
  });
}

/** Grants consent through workflow 10, which is what makes it auditable. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const scopes: string[] = Array.isArray(body.scopes) ? body.scopes : [];

  const unknown = scopes.filter((s) => !KNOWN_SCOPES.includes(s));
  if (scopes.length === 0 || unknown.length > 0) {
    return NextResponse.json(
      { error: 'invalid_scopes', unknown, allowed: KNOWN_SCOPES },
      { status: 400 },
    );
  }

  const { pseudonymId } = await ensureSession();

  const result = await callWorkflow('vigor/consent-granted', {
    pseudonymId,
    scopes,
    version: body.version ?? 'consent-v1.2',
    locale: body.locale === 'ar' ? 'ar' : 'en',
    ageBand: body.ageBand ?? 'unknown',
    emirate: body.emirate ?? 'Abu Dhabi',
    uiSurface: 'consent_sheet_v1',
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, detail: result.data }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: 201 });
}
