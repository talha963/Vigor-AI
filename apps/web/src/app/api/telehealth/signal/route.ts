import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SignalMessage {
  id: string;
  roomId: string;
  sender: 'doctor' | 'patient';
  receiver: 'doctor' | 'patient';
  type: 'offer' | 'answer' | 'candidate' | 'joined' | 'status';
  payload: any;
  timestamp: number;
}

// Global in-memory signal store for low-latency WebRTC handshakes
const signalStore: Map<string, SignalMessage[]> = new Map();

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { roomId, sender, receiver, type, payload } = body;

    if (!roomId || !sender || !type) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    const targetReceiver = receiver || (sender === 'doctor' ? 'patient' : 'doctor');
    const msg: SignalMessage = {
      id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      roomId,
      sender,
      receiver: targetReceiver,
      type,
      payload,
      timestamp: Date.now(),
    };

    const existing = signalStore.get(roomId) || [];
    existing.push(msg);

    // Keep only last 50 signals per room
    if (existing.length > 50) {
      existing.shift();
    }
    signalStore.set(roomId, existing);

    return NextResponse.json({ ok: true, id: msg.id });
  } catch (err) {
    return NextResponse.json({ error: 'Signal push failed' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  const receiver = searchParams.get('receiver') as 'doctor' | 'patient' | null;
  const since = parseInt(searchParams.get('since') || '0', 10);

  if (!roomId) {
    return NextResponse.json({ error: 'missing_roomId' }, { status: 400 });
  }

  const signals = signalStore.get(roomId) || [];
  const relevant = signals.filter((s) => {
    const matchReceiver = !receiver || s.receiver === receiver;
    const matchTime = s.timestamp > since;
    return matchReceiver && matchTime;
  });

  return NextResponse.json({ ok: true, signals: relevant, now: Date.now() });
}
