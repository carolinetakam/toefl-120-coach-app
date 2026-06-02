import { NextResponse } from 'next/server';
import { getProductionReadiness } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = getProductionReadiness();
  const ready = Object.values(checks).every(Boolean);
  return NextResponse.json({ ready, checks }, { status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
