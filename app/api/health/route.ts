import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'toefl-120-coach',
    checkedAt: new Date().toISOString(),
  });
}
