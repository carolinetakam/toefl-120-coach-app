import { NextResponse } from 'next/server';
import { getProductionReadiness } from '@/lib/env';
import { buildLaunchReadinessAudit } from '@/lib/launch-readiness';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = getProductionReadiness();
  const audit = buildLaunchReadinessAudit(checks);
  return NextResponse.json({ ready: audit.ready, checks, audit }, { status: audit.ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
