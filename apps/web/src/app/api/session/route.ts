import { NextResponse } from 'next/server';
import { ensureSession, readSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Current anonymous identity, if the browser already has one. */
export async function GET() {
  const session = await readSession();
  return NextResponse.json({
    hasSession: Boolean(session),
    pseudonymId: session?.pseudonymId ?? null,
  });
}

/** Creates the anonymous session. No account, no contact details. */
export async function POST() {
  const { pseudonymId, created } = await ensureSession();
  return NextResponse.json({ pseudonymId, created });
}
