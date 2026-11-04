import { NextResponse } from 'next/server';
import { ensureSession } from '@/lib/server/session';
import { callWorkflow } from '@/lib/server/n8n';
import { db } from '@/lib/server/mongo';
import { sendClinicalReportEmail } from '@/lib/server/email';
import { TriageResult } from '@/types/vigor';

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

  // Automatic report dispatch if user provided their email
  const userEmail =
    typeof body.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
      ? body.email.trim()
      : null;

  if (userEmail && result.data) {
    try {
      await sendClinicalReportEmail({
        recipientEmail: userEmail,
        triageResult: result.data as TriageResult,
        answers,
        assessmentId,
        pseudonymId,
        locale: body.locale === 'ar' ? 'ar' : 'en',
      });
    } catch (e) {
      console.error('[Assessment API] Email dispatch error:', e);
    }
  }

  const responsePayload =
    typeof result.data === 'object' && result.data !== null
      ? { ...result.data, emailReportDispatched: !!userEmail, recipientEmail: userEmail }
      : result.data;

  return NextResponse.json(responsePayload, { status: 200 });
}
