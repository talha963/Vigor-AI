import { NextResponse } from 'next/server';
import { readSession } from '@/lib/server/session';
import { callWorkflow } from '@/lib/server/n8n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Orders an at-home collection kit via workflow 04. */
export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'no_session' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const allowedModes = ['locker', 'pickup_point', 'home'];

  const result = await callWorkflow('vigor/kit-request', {
    eventType: 'kit.requested',
    pseudonymId: session.pseudonymId,
    assessmentId: body.assessmentId ?? null,
    locale: body.locale === 'ar' ? 'ar' : 'en',
    deliveryWindow: typeof body.deliveryWindow === 'string' ? body.deliveryWindow : 'evening',
    // Locker is the default on purpose: for many users it is the least
    // exposing option, so it is a first-class choice rather than a fallback.
    deliveryMode: allowedModes.includes(body.deliveryMode) ? body.deliveryMode : 'locker',
    dropPointRef: body.dropPointRef ?? null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, detail: result.data }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: 201 });
}
