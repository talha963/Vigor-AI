import { NextResponse } from 'next/server';
import { ensureSession } from '@/lib/server/session';
import { db } from '@/lib/server/mongo';
import { sendBookingConfirmationEmail } from '@/lib/server/email';
import { callWorkflow } from '@/lib/server/n8n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      facilityId = 'fac_001',
      facilityName = 'HealthPlus Fertility & Andrology Center',
      doctorName = 'Dr. Tariq Al-Hashimi',
      department = 'Andrology & Male Fertility',
      location = 'Al Bateen, Abu Dhabi',
      consultType = 'TELEHEALTH_VIDEO',
      slotTime = 'Today · 6:30 PM (GST)',
      email,
      phone,
      assessmentId,
      triageResult,
      locale = 'en',
    } = body;

    const { pseudonymId } = await ensureSession();
    const database = await db();

    const bookingId = `bk_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const shareToken = `shr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const nowIso = new Date().toISOString();
    const isVideo = consultType === 'TELEHEALTH_VIDEO';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const telehealthRoomUrl = `${baseUrl}/telehealth/${bookingId}`;

    // 1. Ensure Consent for clinician sharing
    const scope = triageResult?.tier === 'FERTILITY_SERVICES' ? 'SHARE_WITH_FERTILITY_SERVICE' : 'SHARE_WITH_CLINICIAN';
    const existingConsent = await database.collection('consents').findOne({
      pseudonymId,
      scope,
      granted: true,
    });

    if (!existingConsent) {
      await database.collection('consents').insertOne({
        consentId: `cst_share_${Date.now().toString(36)}`,
        pseudonymId,
        scope,
        granted: true,
        version: 'consent-v1.2',
        lawfulBasis: 'explicit_consent',
        locale: locale === 'ar' ? 'ar' : 'en',
        grantedAt: nowIso,
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        revokedAt: null,
        supersedes: null,
      });
    }

    // 2. Persist booking record
    const bookingDoc = {
      bookingId,
      pseudonymId,
      assessmentId: assessmentId || null,
      facility: {
        facilityId,
        name: facilityName,
        department,
        doctor: doctorName,
        location,
      },
      consultType,
      slotTime,
      status: 'CONFIRMED',
      shareToken: {
        token: shareToken,
        expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
        revokedAt: null,
        accessCount: 0,
      },
      telehealthRoomUrl: isVideo ? telehealthRoomUrl : null,
      contact: {
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
      },
      triageTier: triageResult?.tier || 'ANDROLOGY_UROLOGY',
      createdAt: nowIso,
      dispatchedAt: nowIso,
    };

    await database.collection('bookings').insertOne(bookingDoc);

    // 3. Persist referral share record (accessible by consent centre)
    await database.collection('referrals').insertOne({
      referralId: `ref_${bookingId}`,
      bookingId,
      pseudonymId,
      assessmentId: assessmentId || null,
      facility: {
        facilityId,
        name: facilityName,
      },
      status: 'DISPATCHED',
      dispatchedAt: nowIso,
      shareToken: {
        token: shareToken,
        expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
        accessCount: 0,
        revokedAt: null,
      },
    });

    // 4. Send Confirmation Email if email provided
    let emailDispatched = false;
    if (email && email.includes('@')) {
      try {
        await sendBookingConfirmationEmail({
          recipientEmail: email.trim(),
          bookingId,
          facilityName,
          doctorName,
          consultType,
          slotTime,
          telehealthRoomUrl,
          location,
          locale: locale === 'ar' ? 'ar' : 'en',
        });
        emailDispatched = true;
      } catch (mailErr) {
        console.error('[Booking API] Confirmation email error:', mailErr);
      }
    }

    // 5. Notify n8n workflow 03 (referral-consent)
    try {
      await callWorkflow('vigor/referral-consent', {
        eventType: 'referral.consented',
        bookingId,
        pseudonymId,
        assessmentId: assessmentId || 'asm_auto',
        serviceType: triageResult?.tier === 'FERTILITY_SERVICES' ? 'fertility' : 'andrology',
        facilityId,
        facilityName,
        consultType,
        slotTime,
        locale: locale === 'ar' ? 'ar' : 'en',
      });
    } catch (wfErr) {
      // Non-blocking in case n8n is offline
      console.warn('[Booking API] n8n referral notice:', wfErr);
    }

    return NextResponse.json({
      ok: true,
      bookingId,
      shareToken,
      telehealthRoomUrl,
      facilityName,
      doctorName,
      consultType,
      slotTime,
      emailDispatched,
      recipientEmail: email ? email.trim() : null,
    });
  } catch (error) {
    console.error('[Booking API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal booking error', details: String(error) },
      { status: 500 },
    );
  }
}
