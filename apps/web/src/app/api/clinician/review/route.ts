import { NextResponse } from 'next/server';
import { callWorkflow, internalHeaders } from '@/lib/server/n8n';
import { serverEnv } from '@/lib/server/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Submits a clinician decision to workflow 09.
 *
 * The rules are NOT enforced here. Workflow 09 owns them: de-escalation needs a
 * written justification, and de-escalating across an emergency red flag is
 * refused outright with a 422. Re-implementing that check in the web app would
 * create a second copy that can drift from the one that actually governs.
 * This route just relays the refusal faithfully.
 */
export async function POST(request: Request) {
  const expected = serverEnv.clinicianKey();
  if (!expected) {
    return NextResponse.json({ error: 'clinician_console_disabled' }, { status: 503 });
  }
  if (request.headers.get('x-vigor-clinician-key') !== expected) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (!body.decisionId || !body.outcome || !body.clinicianId) {
    return NextResponse.json(
      { error: 'missing_fields', required: ['decisionId', 'outcome', 'clinicianId'] },
      { status: 400 },
    );
  }

  const result = await callWorkflow(
    'vigor/clinician-review',
    {
      clinicianId: body.clinicianId,
      decisionId: body.decisionId,
      outcome: body.outcome,
      overrideTier: body.overrideTier ?? undefined,
      justification: body.justification ?? undefined,
      note: body.note ?? null,
    },
    { headers: internalHeaders('clinician') },
  );

  if (!result.ok) {
    // 422 is a legitimate clinical governance answer, not a bug: surface it.
    return NextResponse.json({ error: result.error, detail: result.data }, { status: result.status });
  }
  return NextResponse.json(result.data);
}
