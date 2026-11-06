import { NextResponse } from 'next/server';
import { ensureSession } from '@/lib/server/session';
import { db } from '@/lib/server/mongo';
import {
  sendAppointmentRequestReceivedEmail,
  sendAppointmentApprovedEmail,
  sendBookingConfirmationEmail,
} from '@/lib/server/email';
import { callWorkflow } from '@/lib/server/n8n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      patientName,
      facilityId = 'fac_001',
      facilityName = 'HealthPlus Fertility & Andrology Center',
      doctorName = 'Dr. Ali Khan',
      department = 'Andrology & Male Infertility',
      location = 'Al Maryah Island, Abu Dhabi',
      consultType = 'TELEHEALTH_VIDEO',
      slotTime = 'Today · 6:30 PM (GST)',
      email,
      phone,
      assessmentId,
      triageResult,
      chiefComplaint,
      reason,
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

    // 2. Persist booking record with status Pending as required
    const bookingDoc = {
      bookingId,
      pseudonymId,
      patientName: patientName ? patientName.trim() : 'Confidential Patient',
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
      status: 'Pending', // Exactly 'Pending' awaiting doctor review
      shareToken: {
        token: shareToken,
        expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
        revokedAt: null,
        accessCount: 0,
      },
      telehealthRoomUrl: isVideo ? telehealthRoomUrl : null,
      contact: {
        name: patientName ? patientName.trim() : null,
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
      },
      chiefComplaint: chiefComplaint || reason || 'Clinical Consultation Request',
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
      status: 'Pending',
      dispatchedAt: nowIso,
      shareToken: {
        token: shareToken,
        expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
        accessCount: 0,
        revokedAt: null,
      },
    });

    // 4. Send "Your appointment request has been received. Please wait for doctor approval." email
    let emailDispatched = false;
    if (email && email.includes('@')) {
      try {
        await sendAppointmentRequestReceivedEmail({
          recipientEmail: email.trim(),
          patientName: patientName?.trim(),
          bookingId,
          facilityName,
          doctorName,
          consultType,
          slotTime,
          location,
          locale: locale === 'ar' ? 'ar' : 'en',
        });
        emailDispatched = true;
      } catch (mailErr) {
        console.error('[Booking API] Request received email error:', mailErr);
      }
    }

    // 5. Notify n8n workflow 03 (referral-consent) & workflow 11 (appointment-booked email automation)
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
      console.warn('[Booking API] n8n referral notice:', wfErr);
    }

    try {
      await callWorkflow('vigor/appointment-booked', {
        bookingId,
        patientName: patientName?.trim(),
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        facilityName,
        doctorName,
        consultType,
        slotTime,
        locale: locale === 'ar' ? 'ar' : 'en',
      });
    } catch (wfErr) {
      console.warn('[Booking API] n8n appointment-booked notice:', wfErr);
    }

    return NextResponse.json({
      ok: true,
      bookingId,
      status: 'Pending',
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
    // Return exclusively live dynamic database bookings
    const bookings = await database
      .collection('bookings')
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

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
      action,
    } = body;
    if (!bookingId) return NextResponse.json({ error: 'missing_booking_id' }, { status: 400 });

    const database = await db();
    const updateFields: Record<string, any> = { updatedAt: new Date().toISOString() };

    // Normalize status (Pending / Approved / Completed)
    let normalizedStatus = status;
    if (status === 'APPROVED' || status === 'Approved') {
      normalizedStatus = 'Approved';
    } else if (status === 'PENDING' || status === 'Pending') {
      normalizedStatus = 'Pending';
    }

    if (normalizedStatus) updateFields.status = normalizedStatus;
    if (clinicalNotes) updateFields.clinicalNotes = clinicalNotes;
    if (prescription) updateFields.prescription = prescription;
    if (labOrders) updateFields.labOrders = labOrders;
    if (diagnosticPlan) updateFields.diagnosticPlan = diagnosticPlan;
    if (prescriptionDetails) updateFields.prescriptionDetails = prescriptionDetails;

    const res = await database.collection('bookings').updateOne(
      { bookingId },
      { $set: updateFields }
    );

    // Retrieve updated booking to trigger automated email
    const booking = await database.collection('bookings').findOne({ bookingId });

    let emailDispatched = false;
    if (booking) {
      const recipientEmail = booking.contact?.email;

      // 1. If Doctor approved the appointment, send automated "Your appointment has been approved" email
      if (normalizedStatus === 'Approved' && recipientEmail) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          const telehealthRoomUrl = booking.consultType === 'TELEHEALTH_VIDEO'
            ? `${baseUrl}/telehealth/${bookingId}`
            : undefined;

          await sendAppointmentApprovedEmail({
            recipientEmail,
            patientName: booking.patientName || booking.contact?.name,
            bookingId: booking.bookingId,
            facilityName: booking.facility?.name || 'Vigor Care Hub',
            doctorName: booking.facility?.doctor || 'Consultant Physician',
            consultType: booking.consultType || 'IN_PERSON',
            slotTime: booking.slotTime || 'Scheduled Slot',
            telehealthRoomUrl,
            location: booking.facility?.location,
          });
          emailDispatched = true;
          console.log(`[Booking API] Automated approval email sent to ${recipientEmail} for booking ${bookingId}`);
        } catch (mailErr) {
          console.error('[Booking API] Failed sending approval email:', mailErr);
        }

        // Notify n8n workflow 11 (appointment-approved email automation)
        try {
          await callWorkflow('vigor/appointment-approved', {
            bookingId: booking.bookingId,
            patientName: booking.patientName || booking.contact?.name,
            email: recipientEmail,
            facilityName: booking.facility?.name || 'Vigor Care Hub',
            doctorName: booking.facility?.doctor || 'Consultant Physician',
            consultType: booking.consultType || 'IN_PERSON',
            slotTime: booking.slotTime || 'Scheduled Slot',
            telehealthRoomUrl: booking.consultType === 'TELEHEALTH_VIDEO'
              ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/telehealth/${bookingId}`
              : null,
          });
        } catch (wfErr) {
          console.warn('[Booking API] n8n appointment-approved notice:', wfErr);
        }
      }

      // 2. Action to send or re-send video meeting URL
      if (action === 'send_meeting_link' && recipientEmail && booking.telehealthRoomUrl) {
        try {
          await sendAppointmentApprovedEmail({
            recipientEmail,
            patientName: booking.patientName || booking.contact?.name,
            bookingId: booking.bookingId,
            facilityName: booking.facility?.name || 'Vigor Care Hub',
            doctorName: booking.facility?.doctor || 'Consultant Physician',
            consultType: 'TELEHEALTH_VIDEO',
            slotTime: booking.slotTime || 'Now',
            telehealthRoomUrl: booking.telehealthRoomUrl,
            location: booking.facility?.location,
          });
          emailDispatched = true;
        } catch (mailErr) {
          console.error('[Booking API] Failed sending meeting link email:', mailErr);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      updated: res.modifiedCount > 0,
      bookingId,
      status: normalizedStatus,
      emailDispatched,
    });
  } catch (err) {
    console.error('[Booking PATCH API] Error:', err);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

