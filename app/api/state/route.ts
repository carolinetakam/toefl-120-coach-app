import { NextResponse } from 'next/server';
import { clearServerState, readServerState, writeServerState } from '@/lib/server-store';
import { sanitizeAppState } from '@/lib/validation';

export const dynamic = 'force-dynamic';

function getClientId(request: Request) {
  return request.headers.get('x-toefl-client-id') ?? 'guest';
}

function guestStateApiDisabled() {
  return process.env.NODE_ENV === 'production' && process.env.TOEFL_ENABLE_GUEST_STATE_API !== 'true';
}

export async function GET(request: Request) {
  if (guestStateApiDisabled()) return NextResponse.json({ error: 'Guest state API is disabled.' }, { status: 404 });
  const state = await readServerState(getClientId(request));
  return NextResponse.json({ state }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(request: Request) {
  if (guestStateApiDisabled()) return NextResponse.json({ error: 'Guest state API is disabled.' }, { status: 404 });
  try {
    const state = sanitizeAppState(await request.json());
    const saved = await writeServerState(getClientId(request), state);
    return NextResponse.json({ state: saved }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Invalid state payload.' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (guestStateApiDisabled()) return NextResponse.json({ error: 'Guest state API is disabled.' }, { status: 404 });
  await clearServerState(getClientId(request));
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
