import { NextResponse } from 'next/server';
import { ensureSession } from '@/lib/server/session';
import { sendClinicalReportEmail, generateReportEmailHtml } from '@/lib/server/email';
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

  const result = await sendClinicalReportEmail({
    recipientEmail: email.trim(),
    triageResult: triageResult as TriageResult,
    answers: answers as IntakeAnswers | undefined,
    assessmentId,
    pseudonymId,
    locale: body.locale === 'ar' ? 'ar' : 'en',
  });

  return NextResponse.json({
    ok: true,
    recipientEmail: email.trim(),
    mode: result.mode,
    messageId: result.messageId,
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
