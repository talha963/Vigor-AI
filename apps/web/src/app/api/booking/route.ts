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

export async function GET(request: Request) {
  try {
    const database = await db();
    let bookings = await database
      .collection('bookings')
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // If no bookings yet, seed realistic demonstration cases so the doctor portal is immediately active
    if (bookings.length === 0) {
      const demoBookings = [
        {
          bookingId: 'bk_auh_7821',
          pseudonymId: 'psd_9281a8b2',
          assessmentId: 'asm_7821_live',
          facility: {
            facilityId: 'spec_01',
            name: 'HealthPlus Fertility & Andrology Center',
            department: 'Andrology & Male Fertility',
            doctor: 'Dr. Tariq Al-Hashimi',
            location: 'Al Bateen, Abu Dhabi',
          },
          consultType: 'TELEHEALTH_VIDEO',
          slotTime: 'Today · 6:30 PM (GST)',
          status: 'IN_WAITING_ROOM',
          triageTier: 'ANDROLOGY_UROLOGY',
          telehealthRoomUrl: 'http://localhost:3000/telehealth/bk_auh_7821',
          shareToken: { token: 'shr_7821', accessCount: 1 },
          contact: { email: 'patient.auh@example.ae', phone: '+971 50 882 1923' },
          whoParameters: { concentration: '14 M/ml (Sub-ref)', progressiveMotility: '28% (Sub-ref)', normalForms: '3%' },
          redFlags: [],
          chiefComplaint: '14 months primary infertility, sub-normal progressive sperm motility',
          createdAt: new Date().toISOString(),
        },
        {
          bookingId: 'bk_auh_9430',
          pseudonymId: 'psd_3190ffbc',
          assessmentId: 'asm_9430_live',
          facility: {
            facilityId: 'spec_02',
            name: 'Cleveland Clinic Abu Dhabi',
            department: 'Urological Microsurgery',
            doctor: 'Dr. Ziad Al-Khafaji',
            location: 'Al Maryah Island, Abu Dhabi',
          },
          consultType: 'TELEHEALTH_VIDEO',
          slotTime: 'Today · 7:15 PM (GST)',
          status: 'CONFIRMED',
          triageTier: 'ANDROLOGY_UROLOGY',
          telehealthRoomUrl: 'http://localhost:3000/telehealth/bk_auh_9430',
          shareToken: { token: 'shr_9430', accessCount: 0 },
          contact: { email: 'patient.dxb@example.ae', phone: '+971 55 412 9901' },
          whoParameters: { concentration: '22 M/ml', progressiveMotility: '35%', normalForms: '4%' },
          redFlags: [],
          chiefComplaint: 'Left-sided varicocele ache, considering microsurgical repair',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          bookingId: 'bk_auh_1102',
          pseudonymId: 'psd_8831ccaa',
          assessmentId: 'asm_1102_urg',
          facility: {
            facilityId: 'spec_04',
            name: 'Sheikh Shakhbout Medical City (SSMC)',
            department: '24/7 Urgent Urology ED Escalation',
            doctor: 'SSMC Acute Urology Team',
            location: 'Al Mafraq, Abu Dhabi',
          },
          consultType: 'TELEHEALTH_VIDEO',
          slotTime: 'Immediate Dispatch (15 Mins)',
          status: 'CONFIRMED',
          triageTier: 'URGENT',
          telehealthRoomUrl: 'http://localhost:3000/telehealth/bk_auh_1102',
          shareToken: { token: 'shr_1102', accessCount: 0 },
          contact: { email: 'urgent.patient@example.ae', phone: '+971 50 119 2200' },
          whoParameters: { concentration: 'N/A', progressiveMotility: 'N/A', normalForms: 'N/A' },
          redFlags: [{ code: 'RF_ACUTE_SCROTAL_PAIN', severity: 'URGENT', slaMinutes: 60 }],
          chiefComplaint: 'Acute sudden scrotal onset (possible torsion), immediate SLA clock active',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        },
      ];
      await database.collection('bookings').insertMany(demoBookings);
      bookings = demoBookings as any;
    }

    return NextResponse.json({ ok: true, bookings });
  } catch (err) {
    console.error('[Booking GET API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      bookingId,
      status,
      clinicalNotes,
      prescription,
      labOrders,
      diagnosticPlan,
      prescriptionDetails,
    } = body;
    if (!bookingId) return NextResponse.json({ error: 'missing_booking_id' }, { status: 400 });

    const database = await db();
    const updateFields: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (status) updateFields.status = status;
    if (clinicalNotes) updateFields.clinicalNotes = clinicalNotes;
    if (prescription) updateFields.prescription = prescription;
    if (labOrders) updateFields.labOrders = labOrders;
    if (diagnosticPlan) updateFields.diagnosticPlan = diagnosticPlan;
    if (prescriptionDetails) updateFields.prescriptionDetails = prescriptionDetails;

    const res = await database.collection('bookings').updateOne(
      { bookingId },
      { $set: updateFields }
    );

    return NextResponse.json({ ok: true, updated: res.modifiedCount > 0, bookingId });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
