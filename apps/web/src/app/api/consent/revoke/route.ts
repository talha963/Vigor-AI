import { NextResponse } from 'next/server';
import { readSession, clearSession } from '@/lib/server/session';
import { callWorkflow } from '@/lib/server/n8n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Triggers the revocation cascade (workflow 07): ledger entries, share tokens,
 * reminders, and optionally erasure. Returns the receipt the user can check.
 */
export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: 'no_session' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const eraseData = body.eraseData === true;

  const result = await callWorkflow('vigor/consent-revoked', {
    eventType: 'consent.revoked',
    pseudonymId: session.pseudonymId,
    scope: body.scope ?? 'ALL',
    eraseData,
    reason: typeof body.reason === 'string' ? body.reason.slice(0, 300) : null,
    locale: body.locale === 'ar' ? 'ar' : 'en',
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, detail: result.data }, { status: result.status });
  }

  // After erasure the old pseudonym must not be reusable, or the next visit
  // would be refused by workflow 10 as an erased subject.
  if (eraseData) await clearSession();

  return NextResponse.json({ ...(result.data as object), sessionCleared: eraseData });
}
