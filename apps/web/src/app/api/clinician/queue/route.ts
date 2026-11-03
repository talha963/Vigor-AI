import { NextResponse } from 'next/server';
import { db } from '@/lib/server/mongo';
import { serverEnv } from '@/lib/server/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The clinician review queue: decisions awaiting sign-off, plus open escalations
 * with their SLA state.
 *
 * Gated on VIGOR_CLINICIAN_ACCESS_KEY. A shared key is honest about what it is —
 * adequate for a prototype, and explicitly NOT sufficient for production, where
 * `reviewedBy` has to be an attributable federated identity. If the key is unset
 * the console refuses to load rather than defaulting open.
 */
function authorise(request: Request): string | null {
  const expected = serverEnv.clinicianKey();
  if (!expected) return 'clinician_console_disabled';
  const presented =
    request.headers.get('x-vigor-clinician-key') ??
    new URL(request.url).searchParams.get('key');
  return presented === expected ? null : 'unauthorised';
}

export async function GET(request: Request) {
  const denied = authorise(request);
  if (denied) {
    return NextResponse.json(
      {
        error: denied,
        hint:
          denied === 'clinician_console_disabled'
            ? 'Set VIGOR_CLINICIAN_ACCESS_KEY in apps/web/.env.local to enable the console.'
            : undefined,
      },
      { status: denied === 'clinician_console_disabled' ? 503 : 401 },
    );
  }

  const database = await db();

  const pending = await database
    .collection('triage_decisions')
    .find({ status: 'pending_review' })
    .project({ _id: 0, answers: 0 })
    .sort({ createdAt: 1 })
    .limit(50)
    .toArray();

  const escalations = await database
    .collection('escalations')
    .find({ status: { $in: ['open', 'breached'] } })
    .project({ _id: 0 })
    .sort({ dueAt: 1 })
    .limit(50)
    .toArray();

  const now = Date.now();

  return NextResponse.json({
    pending: pending.map((d) => ({
      decisionId: d.decisionId,
      pseudonymId: d.pseudonymId,
      tier: d.tier,
      redFlags: d.redFlags ?? [],
      rationale: d.rationale ?? '',
      clamped: d.clamped === true,
      tierBeforeClamp: d.tierBeforeClamp ?? null,
      source: d.source ?? null,
      createdAt: d.createdAt ?? null,
    })),
    escalations: escalations.map((e) => ({
      escalationId: e.escalationId,
      decisionId: e.decisionId,
      severity: e.severity,
      redFlags: e.redFlags ?? [],
      status: e.status,
      dueAt: e.dueAt,
      createdAt: e.createdAt,
      // Surfaced so the queue can sort by urgency rather than arrival.
      overdueMinutes: e.dueAt
        ? Math.round((now - new Date(e.dueAt).getTime()) / 60000)
        : null,
    })),
    counts: { pending: pending.length, escalations: escalations.length },
  });
}
