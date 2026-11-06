import { NextResponse } from 'next/server';
import { executeSparql, CLINICAL_SPARQL_PRESETS } from '@/lib/graphdb/sparql';
import { getRawTurtle, buildPatientGraph, appendEncounterTurtle } from '@/lib/graphdb/turtle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'patient';
    const patientId = searchParams.get('patientId') || 'psd_9281a8b2';

    if (action === 'presets') {
      return NextResponse.json({ ok: true, presets: CLINICAL_SPARQL_PRESETS });
    }

    if (action === 'turtle') {
      return NextResponse.json({ ok: true, turtle: getRawTurtle() });
    }

    // Default: return patient visual graph data
    const graphData = buildPatientGraph(patientId);
    return NextResponse.json({ ok: true, data: graphData });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || 'GraphDB query failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action = 'sparql', query, patientId = 'psd_9281a8b2', customTurtle, encounterData } = body;

    if (action === 'sparql') {
      if (!query || typeof query !== 'string') {
        return NextResponse.json({ ok: false, error: 'Query parameter is required' }, { status: 400 });
      }
      const result = executeSparql(query, customTurtle);
      return NextResponse.json({ ok: true, result });
    }

    if (action === 'patient_graph') {
      const graphData = buildPatientGraph(patientId);
      return NextResponse.json({ ok: true, data: graphData });
    }

    if (action === 'append_encounter') {
      if (!encounterData) {
        return NextResponse.json({ ok: false, error: 'Missing encounterData' }, { status: 400 });
      }
      appendEncounterTurtle(encounterData);
      const updatedGraph = buildPatientGraph(encounterData.patientId || patientId);
      return NextResponse.json({ ok: true, data: updatedGraph });
    }

    return NextResponse.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || 'GraphDB request processing failed' },
      { status: 500 }
    );
  }
}
