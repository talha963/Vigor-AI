import { NextResponse } from 'next/server';
import { db } from '@/lib/server/mongo';
import { sendAppointmentApprovedEmail } from '@/lib/server/email';
import { callWorkflow } from '@/lib/server/n8n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { bookingId, status = 'Approved', doctorName = 'Dr. Ali Khan', doctorNotes } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    const database = await db();
    const existing = await database.collection('bookings').findOne({ bookingId });

    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const isReject = status === 'Rejected' || status === 'REJECTED';
    const finalStatus = isReject ? 'Rejected' : 'Approved';

    const updateFields: any = {
      status: finalStatus,
      updatedAt: nowIso,
    };
    if (isReject) {
      updateFields.rejectedAt = nowIso;
      updateFields.rejectedBy = doctorName;
    } else {
      updateFields.approvedAt = nowIso;
      updateFields.approvedBy = doctorName;
    }

    if (doctorNotes) {
      updateFields.clinicalNotes = doctorNotes;
    }

    await database.collection('bookings').updateOne(
      { bookingId },
      { $set: updateFields }
    );

    // Dispatch official appointment approved email to patient (if approved)
    const patientEmail = existing.contact?.email;
    const patientName = existing.patientName || existing.contact?.name || 'Valued Patient';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const telehealthRoomUrl =
      existing.telehealthRoomUrl || `${baseUrl}/telehealth/${bookingId}`;

    let emailDispatched = false;
    if (!isReject && patientEmail && patientEmail.includes('@')) {
      try {
        await sendAppointmentApprovedEmail({
          recipientEmail: patientEmail,
          patientName,
          bookingId,
          facilityName: existing.facility?.name || 'Cleveland Clinic Abu Dhabi · Andrology Hub',
          doctorName: doctorName || existing.facility?.doctor || 'Dr. Ali Khan',
          consultType: existing.consultType || 'TELEHEALTH_VIDEO',
          slotTime: existing.slotTime || 'Confirmed Consultation Slot',
          telehealthRoomUrl,
          location: existing.facility?.location || 'Al Maryah Island, Abu Dhabi',
          locale: (existing.locale as any) || 'en',
        });
        emailDispatched = true;
      } catch (err) {
        console.warn('[Clinician Approve] Email dispatch warning:', err);
      }
    }

    // Attempt to notify n8n workflow if running
    try {
      await callWorkflow('vigor/appointment-approved', {
        bookingId,
        patientName,
        patientEmail,
        status: 'Approved',
        doctorName,
        approvedAt: nowIso,
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      ok: true,
      bookingId,
      status: 'Approved',
      emailDispatched,
      message: 'Appointment approved and confirmation email sent.',
    });
  } catch (error) {
    console.error('[Clinician Approve] Error:', error);
    return NextResponse.json(
      { error: 'Failed to approve appointment', details: String(error) },
      { status: 500 }
    );
  }
}
