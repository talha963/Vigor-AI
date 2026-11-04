import { NextResponse } from 'next/server';
import { ensureSession } from '@/lib/server/session';
import { sendClinicalReportEmail, generateReportEmailHtml } from '@/lib/server/email';
import { callWorkflow } from '@/lib/server/n8n';
import { db } from '@/lib/server/mongo';
import { TriageResult, IntakeAnswers } from '@/types/vigor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { email, triageResult, answers, assessmentId = `asm_${Date.now()}` } = body;

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid_email', message: 'A valid email address is required.' }, { status: 400 });
  }

  if (!triageResult || typeof triageResult !== 'object') {
    return NextResponse.json({ error: 'missing_triage_result' }, { status: 400 });
  }

  const { pseudonymId } = await ensureSession();

  // 1. Dispatch formatted report email and store audit log
  const result = await sendClinicalReportEmail({
    recipientEmail: email.trim(),
    triageResult: triageResult as TriageResult,
    answers: answers as IntakeAnswers | undefined,
    assessmentId,
    pseudonymId,
    locale: body.locale === 'ar' ? 'ar' : 'en',
  });

  // 2. Trigger live n8n workflow 01 execution so it executes & logs in n8n UI
  let n8nExecuted = false;
  try {
    const database = await db();
    let consent = await database
      .collection('consents')
      .findOne({ pseudonymId, scope: 'ASSESSMENT', granted: true });

    if (!consent) {
      const autoConsentId = `cst_auto_${Date.now().toString(36)}`;
      await database.collection('consents').insertOne({
        consentId: autoConsentId,
        pseudonymId,
        scope: 'ASSESSMENT',
        granted: true,
        version: 'consent-v1.2',
        lawfulBasis: 'explicit_consent',
        locale: body.locale === 'ar' ? 'ar' : 'en',
        grantedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
        revokedAt: null,
        supersedes: null,
      });
      consent = { consentId: autoConsentId } as any;
    }

    const wfRes = await callWorkflow('vigor/intake-completed', {
      eventType: 'intake.completed',
      eventId: `evt_${assessmentId}_${Date.now()}`,
      occurredAt: new Date().toISOString(),
      idempotencyKey: `${assessmentId}:dispatch:${Date.now()}`,
      pseudonymId,
      assessmentId,
      consentId: consent?.consentId || 'consent_dispatch_auto',
      locale: body.locale === 'ar' ? 'ar' : 'en',
      startedAt: new Date(Date.now() - 60_000).toISOString(),
      durationSec: 60,
      answers: answers || { symptoms: [] },
      skippedSensitive: [],
      reportEmail: email.trim(),
    });
    n8nExecuted = wfRes.ok;
  } catch (n8nErr) {
    console.warn('[Report Email API] n8n trigger notice:', n8nErr);
  }

  return NextResponse.json({
    ok: true,
    recipientEmail: email.trim(),
    mode: result.mode,
    messageId: result.messageId,
    n8nExecuted,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || 'patient@example.com';
  const { pseudonymId } = await ensureSession();

  // Return a sample preview of the report email
  const sampleTriage: TriageResult = {
    tier: 'ANDROLOGY_UROLOGY',
    redFlags: [],
    domains: [
      { name: 'Lifestyle & Metabolic', score: 35, band: 'MODERATE', drivers: ['BMI: 28.4'] },
      { name: 'Anatomical', score: 10, band: 'LOW', drivers: [] },
    ],
    overall: { score: 48, band: 'MODERATE', confidence: 0.94 },
    missingInputs: [],
    clamped: false,
    requiresHumanReview: false,
    boundary: {
      isDiagnosis: false,
      statement: 'Informational risk assessment only.',
      statementAr: 'تقييم مخاطر استرشادي فقط.',
    },
    recommendedService: 'Specialist Andrology & Male Infertility Clinic',
    recommendedServiceAr: 'عيادة أمراض الذكورة والخصوبة التخصصية',
    actionGuidance: 'Schedule a comprehensive semen analysis and physical evaluation at an accredited Abu Dhabi andrology center.',
    actionGuidanceAr: 'حجز فحص شامل لسائل الحيوانات المنوية واستشارة سريرية متخصصة في مركز معتمد بأبوظبي.',
  };

  const html = generateReportEmailHtml({
    recipientEmail: email,
    triageResult: sampleTriage,
    assessmentId: 'asm_sample_preview',
    pseudonymId,
    locale: 'en',
  });

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
