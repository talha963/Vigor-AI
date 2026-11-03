import { NextResponse } from 'next/server';
import { readSession } from '@/lib/server/session';
import { db } from '@/lib/server/mongo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Reads a triage decision and its risk score.
 *
 * Scoped to the caller's own pseudonym id, so a guessed decision id returns 404
 * rather than someone else's result. Raw answers are never returned.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ decisionId: string }> },
) {
  const { decisionId } = await params;
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'no_session' }, { status: 401 });

  const database = await db();
  const decision = await database
    .collection('triage_decisions')
    .findOne({ decisionId, pseudonymId: session.pseudonymId });

  if (!decision) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const score = decision.scoreId
    ? await database.collection('risk_scores').findOne({ scoreId: decision.scoreId })
    : null;

  return NextResponse.json({
    decision: {
      decisionId: decision.decisionId,
      assessmentId: decision.assessmentId ?? null,
      tier: decision.tier,
      redFlags: decision.redFlags ?? [],
      rationale: decision.rationale ?? '',
      requiresHumanReview: decision.requiresHumanReview === true,
      status: decision.status,
      clamped: decision.clamped === true,
      tierBeforeClamp: decision.tierBeforeClamp ?? null,
      source: decision.source ?? null,
      createdAt: decision.createdAt ?? null,
      reviewedBy: decision.reviewedBy ?? null,
      reviewedAt: decision.reviewedAt ?? null,
      reviewOutcome: decision.reviewOutcome ?? null,
    },
    score: score
      ? {
          scoreId: score.scoreId,
          modelVersion: score.modelVersion,
          computedAt: score.computedAt,
          domains: score.domains ?? [],
          overall: score.overall ?? null,
          missingInputs: score.missingInputs ?? [],
          degraded: score.degraded === true,
        }
      : null,
    boundary: {
      isDiagnosis: false,
      statement:
        'This is a screening result, not a diagnosis. A clinician makes the diagnosis.',
    },
  });
}
