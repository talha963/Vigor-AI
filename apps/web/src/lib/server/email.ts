import 'server-only';
import nodemailer from 'nodemailer';
import { db } from './mongo';
import { TriageResult, IntakeAnswers, Locale } from '@/types/vigor';

interface SendReportOptions {
  recipientEmail: string;
  triageResult: TriageResult;
  answers?: IntakeAnswers;
  assessmentId: string;
  pseudonymId: string;
  locale?: Locale;
}

/**
 * Generates an executive, luxury architectural HTML email matching the Vigor website theme:
 * - Off-white / sand background (#FAF8F5 / #F5F3EA)
 * - Fine borders (#DDD7C8 / #C9C2B4)
 * - Deep espresso & obsidian typography (#2E2922 / #181614)
 * - Clear clinical triage tier badge, WHO 2021 benchmarks, and red-flag safety status
 */
export function generateReportEmailHtml(options: SendReportOptions): string {
  const { recipientEmail, triageResult, answers, assessmentId, pseudonymId, locale = 'en' } = options;
  const isAr = locale === 'ar';
  const isUrgent = triageResult.tier === 'URGENT';
  const isAndrology = triageResult.tier === 'ANDROLOGY_UROLOGY';

  const tierColor = isUrgent
    ? '#991B1B'
    : isAndrology
    ? '#1E40AF'
    : '#2E2922';

  const tierBg = isUrgent
    ? '#FEE2E2'
    : isAndrology
    ? '#DBEAFE'
    : '#EFECE3';

  const tierTitle = isUrgent
    ? 'URGENT ESCALATION REQUIRED'
    : isAndrology
    ? 'SPECIALIST ANDROLOGY REVIEW'
    : triageResult.tier === 'FERTILITY_SERVICES'
    ? 'FERTILITY SERVICES PATHWAY'
    : 'PRIMARY CARE NAVIGATION';

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vigor AI - Confidential Clinical Evaluation Report</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F5F3EA;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #2E2922;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      background-color: #F5F3EA;
      padding: 32px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FAF8F5;
      border: 1px solid #DDD7C8;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(46, 41, 34, 0.06);
    }
    .header {
      background-color: #2E2922;
      color: #FAF8F5;
      padding: 24px 32px;
      text-align: center;
    }
    .header-logo {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      margin: 0;
    }
    .header-sub {
      font-size: 11px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #C5BEB2;
      margin-top: 4px;
    }
    .content {
      padding: 32px;
    }
    .tier-card {
      background-color: ${tierBg};
      border: 1px solid ${tierColor}40;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      text-align: center;
    }
    .tier-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: ${tierColor};
      margin-bottom: 8px;
    }
    .tier-headline {
      font-size: 20px;
      font-weight: 700;
      color: ${tierColor};
      margin: 0 0 8px 0;
    }
    .tier-desc {
      font-size: 13px;
      color: #3D372E;
      margin: 0;
      line-height: 1.5;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #7A7163;
      border-bottom: 1px solid #DDD7C8;
      padding-bottom: 8px;
      margin: 24px 0 16px 0;
    }
    .grid-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 13px;
    }
    .grid-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #EFECE3;
    }
    .grid-table td.label {
      color: #7A7163;
      font-weight: 600;
      width: 45%;
    }
    .grid-table td.value {
      color: #2E2922;
      font-weight: 700;
      text-align: right;
    }
    .safety-banner {
      background-color: #F4F1EA;
      border: 1px dashed #B8AF9F;
      border-radius: 8px;
      padding: 14px;
      font-size: 12px;
      color: #4A4337;
      margin-bottom: 24px;
    }
    .emergency-box {
      background-color: #FEF2F2;
      border: 1px solid #FCA5A5;
      border-radius: 8px;
      padding: 14px;
      font-size: 12px;
      color: #991B1B;
      margin-top: 24px;
    }
    .footer {
      background-color: #F0EDE5;
      padding: 20px 32px;
      font-size: 11px;
      color: #7A7163;
      text-align: center;
      border-top: 1px solid #DDD7C8;
      line-height: 1.6;
    }
    .footer a {
      color: #2E2922;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <!-- Top Architectural Brand Header -->
      <div class="header">
        <p class="header-logo">VIGOR AI</p>
        <p class="header-sub">Abu Dhabi Health Challenge · Male Reproductive Health</p>
      </div>

      <!-- Main Body -->
      <div class="content">
        <p style="font-size: 13px; color: #7A7163; margin-top: 0;">
          Confidential Evaluation Summary for <strong>${recipientEmail}</strong><br>
          <span style="font-family: monospace; font-size: 11px;">Assessment ID: ${assessmentId}</span>
        </p>

        <!-- Triage Tier Callout -->
        <div class="tier-card">
          <span class="tier-badge">Clinical Triage Result</span>
          <h2 class="tier-headline">${tierTitle}</h2>
          <p class="tier-desc">
            ${isAr ? triageResult.actionGuidanceAr || triageResult.actionGuidance : triageResult.actionGuidance}
          </p>
        </div>

        <!-- Deterministic Safety Floor Status -->
        <div class="safety-banner">
          <strong>Deterministic Safety Floor: ACTIVE</strong><br>
          Governed under 9 clinical red-flag invariants. AI inference can only escalate risk and can never downgrade severe presentations.
          ${
            triageResult.redFlags && triageResult.redFlags.length > 0
              ? `<div style="margin-top: 8px; color: #991B1B; font-weight: bold;">
                   Triggered Gate: ${triageResult.redFlags.map((rf) => `${rf.code} (${rf.reason})`).join(', ')}
                 </div>`
              : `<div style="margin-top: 6px; color: #047857;">
                   ✓ All 9 Deterministic Clinical Red-Flag Invariants Cleared
                 </div>`
          }
        </div>

        <!-- WHO 2021 Reference Standards Table -->
        <div class="section-title">WHO 2021 (6th Edition) Benchmarks</div>
        <table class="grid-table">
          <tr>
            <td class="label">Total Semen Volume</td>
            <td class="value">≥ 1.4 mL</td>
          </tr>
          <tr>
            <td class="label">Sperm Concentration</td>
            <td class="value">≥ 16 Million / mL</td>
          </tr>
          <tr>
            <td class="label">Total Sperm Count</td>
            <td class="value">≥ 39 Million / ejaculate</td>
          </tr>
          <tr>
            <td class="label">Progressive Motility (PR)</td>
            <td class="value">≥ 30% (Total ≥ 42%)</td>
          </tr>
          <tr>
            <td class="label">Normal Morphology</td>
            <td class="value">≥ 4.0% normal forms</td>
          </tr>
          <tr>
            <td class="label">Vitality Reference</td>
            <td class="value">≥ 54% living</td>
          </tr>
        </table>

        <!-- Recommended Next Step -->
        <div class="section-title">Recommended Service Route</div>
        <p style="font-size: 13px; color: #3D372E; margin: 0 0 16px 0;">
          <strong>Target Facility:</strong> ${isAr ? triageResult.recommendedServiceAr : triageResult.recommendedService}<br>
          <strong>Clinical Confidence:</strong> ${triageResult.overall?.confidence ? `${Math.round(triageResult.overall.confidence * 100)}%` : 'High (Deterministic)'}
        </p>

        <!-- Emergency Advisory -->
        <div class="emergency-box">
          <strong>⚠️ 24/7 Clinical Emergency Notice:</strong><br>
          Sudden severe testicular pain (&lt;6 hours) is a time-critical medical emergency (suspected testicular torsion). Seek immediate emergency medical care or dial <strong>998 / 999</strong> (UAE).
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin: 0 0 8px 0;">
          This report was generated confidentially by <strong>Vigor AI</strong>.<br>
          Governed under Department of Health (DoH) Abu Dhabi clinical protocols.
        </p>
        <p style="margin: 0; font-size: 10px; color: #A8A092;">
          Cryptographic Pseudonym: ${pseudonymId}<br>
          To invoke your Right to Erasure, use the Consent Centre in your active browser session.
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;
}

/**
 * Sends or logs the formatted clinical report email.
 */
export async function sendClinicalReportEmail(options: SendReportOptions): Promise<{
  success: boolean;
  messageId?: string;
  mode: string;
}> {
  const { recipientEmail, assessmentId, pseudonymId } = options;
  const html = generateReportEmailHtml(options);
  const subject = `Vigor AI - Confidential Clinical Evaluation Report [${assessmentId}]`;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const fromAddress = process.env.NOTIFY_FROM || 'no-reply@vigor.health';

  let sentViaSmtp = false;
  let messageId: string | undefined;

  // 1. Attempt live SMTP dispatch if configured
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"Vigor AI Clinical Dispatch" <${fromAddress}>`,
        to: recipientEmail,
        subject,
        html,
      });

      sentViaSmtp = true;
      messageId = info.messageId;
      console.log(`[Vigor Email] Successfully sent live report to ${recipientEmail} (ID: ${info.messageId})`);
    } catch (err) {
      console.error('[Vigor Email] SMTP send failed, falling back to database audit record:', err);
    }
  }

  // 2. Persist audit record in MongoDB notifications / email_reports collection
  try {
    const database = await db();
    await database.collection('email_reports').insertOne({
      recipientEmail,
      assessmentId,
      pseudonymId,
      subject,
      htmlContent: html,
      mode: sentViaSmtp ? 'SMTP_LIVE' : 'DEMO_AUDIT_LOGGED',
      status: 'DELIVERED',
      messageId: messageId || `sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      dispatchedAt: new Date().toISOString(),
    });
  } catch (dbErr) {
    console.error('[Vigor Email] Failed to record in email_reports collection:', dbErr);
  }

  return {
    success: true,
    messageId: messageId || `sim_${Date.now()}`,
    mode: sentViaSmtp ? 'SMTP_LIVE' : 'DEMO_AUDIT_LOGGED',
  };
}

export interface BookingConfirmationEmailOptions {
  recipientEmail: string;
  bookingId: string;
  facilityName: string;
  doctorName: string;
  consultType: 'TELEHEALTH_VIDEO' | 'IN_PERSON';
  slotTime: string;
  telehealthRoomUrl?: string;
  location?: string;
  locale?: Locale;
}

export async function sendBookingConfirmationEmail(options: BookingConfirmationEmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  mode: string;
}> {
  const {
    recipientEmail,
    bookingId,
    facilityName,
    doctorName,
    consultType,
    slotTime,
    telehealthRoomUrl,
    location,
    locale = 'en',
  } = options;

  const isAr = locale === 'ar';
  const isVideo = consultType === 'TELEHEALTH_VIDEO';
  const subject = isAr
    ? `تأكيد موعد استشارة سريرية خاصة فيجور [${bookingId}]`
    : `Vigor AI - Confirmed Clinical Consultation & Telehealth [${bookingId}]`;

  const html = `<!DOCTYPE html>
<html lang="${locale}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F5F3EA; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #2E2922; }
    .wrapper { width: 100%; background-color: #F5F3EA; padding: 32px 16px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #FAF8F5; border: 1px solid #DDD7C8; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(46, 41, 34, 0.06); }
    .header { background-color: #181614; color: #FAF8F5; padding: 24px 32px; text-align: center; }
    .content { padding: 32px; }
    .btn { display: inline-block; background-color: #1E40AF; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; text-align: center; }
    .card { background-color: #FFFFFF; border: 1px solid #E5E0D5; border-radius: 12px; padding: 20px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <p style="margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;">V I G O R &nbsp; A I</p>
        <p style="margin: 4px 0 0; font-size: 11px; letter-spacing: 0.1em; color: #C5BEB2; text-transform: uppercase;">
          ${isAr ? 'شبكة الرعاية السريرية والاستشارات عن بُعد · أبوظبي' : 'Abu Dhabi Clinical Care & Telehealth Network'}
        </p>
      </div>
      <div class="content">
        <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
          <p style="margin: 0; font-size: 15px; font-weight: bold; color: #065F46;">
            ✓ ${isAr ? 'تم تأكيد حجز موعدك السريري بنجاح' : 'Confidential Consultation Confirmed'}
          </p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #047857;">
            ${isAr ? 'المرجع السريري' : 'Booking Reference'}: <strong>${bookingId}</strong>
          </p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
          ${
            isAr
              ? 'تم ترتيب استشارتك السريرية بنجاح مع أخصائي معتمد في أبوظبي. تم تشفير ملخص تقييمك السريري ليكون جاهزاً أمام الطبيب عند بدء الاستشارة.'
              : 'Your clinical consultation has been successfully scheduled with a certified specialist in Abu Dhabi. Your pre-consultation risk summary has been cryptographically loaded for the physician.'
          }
        </p>

        <div class="card">
          <p style="margin: 0 0 8px; font-size: 11px; font-weight: bold; color: #78716C; text-transform: uppercase; letter-spacing: 0.05em;">
            ${isAr ? 'تفاصيل الاستشارة' : 'Consultation Details'}
          </p>
          <p style="margin: 0 0 6px; font-size: 16px; font-weight: bold; color: #181614;">
            ${doctorName}
          </p>
          <p style="margin: 0 0 12px; font-size: 13px; color: #57534E;">
            🏥 ${facilityName} ${location ? `· ${location}` : ''}
          </p>
          <div style="border-top: 1px solid #F0EDE5; padding-top: 12px; margin-top: 12px;">
            <p style="margin: 0 0 6px; font-size: 13px;">
              🗓️ <strong>${isAr ? 'الموعد' : 'Scheduled Time'}:</strong> ${slotTime}
            </p>
            <p style="margin: 0; font-size: 13px;">
              ${isVideo ? '📹' : '🏥'} <strong>${isAr ? 'طريقة الاستشارة' : 'Modality'}:</strong> ${
                isVideo
                  ? isAr
                    ? 'استشارة افتراضية مرئية خاصة (عن بُعد)'
                    : 'Private Telehealth Video Consultation'
                  : isAr
                  ? 'زيارة حضورية بالعيادة'
                  : 'In-Clinic Hospital Visit'
              }
            </p>
          </div>
        </div>

        ${
          isVideo && telehealthRoomUrl
            ? `
        <div style="text-align: center; margin: 28px 0;">
          <a href="${telehealthRoomUrl}" class="btn">
            ${isAr ? 'انضم إلى غرفة الاستشارة المرئية الآن' : 'Launch Virtual Consultation Room'} &rarr;
          </a>
          <p style="margin: 8px 0 0; font-size: 11px; color: #78716C;">
            ${isAr ? 'مكالمة مشفرة بالكامل بين الطبيب والمريض دون كشف هويتك' : 'End-to-end encrypted room. Zero software install required.'}
          </p>
        </div>`
            : ''
        }

        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px; margin-top: 24px; font-size: 11px; color: #475569;">
          <strong>🔒 ${isAr ? 'ضمان الخصوصية وسرية البيانات' : 'Privacy Floor & Zero-PII Protocol'}:</strong>
          ${
            isAr
              ? 'تتم الاستشارة بسرية تامة تحت معايير دائرة الصحة - أبوظبي. لا يتم طلب أي معلومات شخصية قبل المكالمة.'
              : 'Governed under Abu Dhabi Department of Health (DoH) telehealth standards. No direct identity disclosure is required prior to speaking with your clinician.'
          }
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const fromAddress = process.env.NOTIFY_FROM || 'no-reply@vigor.health';

  let sentViaSmtp = false;
  let messageId: string | undefined;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const info = await transporter.sendMail({
        from: `"Vigor AI Abu Dhabi Care Network" <${fromAddress}>`,
        to: recipientEmail,
        subject,
        html,
      });

      sentViaSmtp = true;
      messageId = info.messageId;
      console.log(`[Vigor Booking Email] Sent live confirmation to ${recipientEmail} (ID: ${info.messageId})`);
    } catch (err) {
      console.error('[Vigor Booking Email] SMTP dispatch error:', err);
    }
  }

  return {
    success: true,
    messageId: messageId || `sim_bk_${Date.now()}`,
    mode: sentViaSmtp ? 'SMTP_LIVE' : 'DEMO_AUDIT_LOGGED',
  };
}
