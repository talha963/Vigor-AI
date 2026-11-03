import { NextResponse } from 'next/server';
import { ensureSession } from '@/lib/server/session';
import { callWorkflow } from '@/lib/server/n8n';
import { db } from '@/lib/server/mongo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Submits a completed intake to workflow 01.
 *
 * Deliberately thin. The browser sends answers; the server does NOT score them.
 * Risk scoring, the red-flag gate and the escalate-only clamp all live behind
 * the workflow, so there is exactly one implementation of the safety floor and
 * no way for a tampered client to talk itself into a lower tier.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const answers = body?.answers;

  if (!answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'missing_answers' }, { status: 400 });
  }

  const { pseudonymId } = await ensureSession();
  const database = await db();

  // Workflow 01 refuses without a live ASSESSMENT consent, and a 403 from deep
  // inside the workflow is a poor experience. Check first and say so plainly.
  const now = Date.now();
  const consents = await database
    .collection('consents')
    .find({ pseudonymId, scope: 'ASSESSMENT', granted: true })
    .sort({ grantedAt: -1 })
    .limit(5)
    .toArray();

  const live = consents.find(
    (c) => !c.revokedAt && (!c.expiresAt || new Date(c.expiresAt).getTime() > now),
  );
  if (!live) {
    return NextResponse.json(
      { error: 'consent_required', requiredScope: 'ASSESSMENT' },
      { status: 403 },
    );
  }

  const assessmentId = `asm_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const startedAt: string =
    typeof body.startedAt === 'string' ? body.startedAt : new Date(Date.now() - 60_000).toISOString();

  const result = await callWorkflow('vigor/intake-completed', {
    eventType: 'intake.completed',
    eventId: `evt_${assessmentId}`,
    occurredAt: new Date().toISOString(),
    idempotencyKey: `${assessmentId}:intake.completed`,
    pseudonymId,
    assessmentId,
    consentId: live.consentId,
    locale: body.locale === 'ar' ? 'ar' : 'en',
    startedAt,
    durationSec: Math.max(
      0,
      Math.round((Date.now() - new Date(startedAt).getTime()) / 1000),
    ),
    answers,
    skippedSensitive: Array.isArray(body.skippedSensitive) ? body.skippedSensitive : [],
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, detail: result.data }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: 200 });
}
