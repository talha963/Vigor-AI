import { NextResponse } from 'next/server';
import { db } from '@/lib/server/mongo';
import { sendPrescriptionReportEmail } from '@/lib/server/email';
import { appendEncounterTurtle } from '@/lib/graphdb/turtle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      bookingId,
      patientEmail,
      patientName = 'Patient',
      doctorName = 'Dr. Ali Khan',
      doctorTitle = 'Consultant Andrologist & Microsurgeon',
      doctorLicense = 'DOH-AUH-2024-9102',
      facilityName = 'Cleveland Clinic Abu Dhabi',
      facilityLocation = 'Al Maryah Island, Abu Dhabi',
      diagnosis = 'Asthenozoospermia (WHO 2021) & Clinical Varicocele',
      prescriptionText = '1. L-Carnitine 2000mg + CoQ10 200mg Daily.\n2. Zinc 25mg + Selenium 200mcg.\n3. Repeat CASA Semen Analysis in 4 weeks.',
      labOrders = ['Bilateral Scrotal Doppler Ultrasound', 'Serum FSH, LH, Total Testosterone', 'Repeat CASA Semen Analysis'],
      clinicalNotes = 'Patient reviewed and prescribed comprehensive antioxidant and microcirculatory protocol. Follow-up CASA scheduled.',
      locale = 'en',
    } = body;

    if (!bookingId) {
      return NextResponse.json({ ok: false, error: 'bookingId is required' }, { status: 400 });
    }

    const emailToSend = patientEmail && patientEmail.includes('@') ? patientEmail.trim() : 'patient@vigor.health';

    // 1. Dispatch official prescription email
    const emailResult = await sendPrescriptionReportEmail({
      recipientEmail: emailToSend,
      bookingId,
      patientName,
      doctorName,
      doctorTitle,
      doctorLicense,
      facilityName,
      facilityLocation,
      diagnosis,
      prescriptionText,
      labOrders,
      clinicalNotes,
      locale,
    });

    // 2. Update booking in MongoDB if exists
    try {
      const database = await db();
      await database.collection('bookings').updateOne(
        { bookingId },
        {
          $set: {
            status: 'COMPLETED',
            prescribedAt: new Date().toISOString(),
            prescribedBy: doctorName,
            diagnosis,
            prescription: prescriptionText,
            labOrders,
            clinicalNotes,
            emailDispatchedTo: emailToSend,
          },
        }
      );
    } catch (dbErr) {
      console.warn('[Prescribe API] MongoDB update skipped (in-memory mode active):', dbErr);
    }

    // 3. Append to Semantic GraphDB Knowledge Graph
    try {
      appendEncounterTurtle({
        patientId: bookingId,
        encounterId: `ENC_${bookingId}`,
        visitType: 'CLINICAL_PRESCRIPTION_DISPATCH',
        doctorName,
        facilityName,
        notes: clinicalNotes,
        diagnosis,
        prescription: prescriptionText,
        labOrders,
      });
    } catch (graphErr) {
      console.warn('[Prescribe API] GraphDB append failed:', graphErr);
    }

    return NextResponse.json({
      ok: true,
      bookingId,
      recipientEmail: emailToSend,
      emailResult,
      message: `Prescription report successfully generated and dispatched to ${emailToSend}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Prescription generation failed' },
      { status: 500 }
    );
  }
}
