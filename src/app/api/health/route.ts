import { NextResponse } from 'next/server';
import { getHealthStatus } from '@/security/monitoring';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = getHealthStatus();
  const status = health.status === 'healthy' ? 200 : 503;
  return NextResponse.json(health, { status });
}
