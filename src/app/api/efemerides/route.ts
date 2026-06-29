import { NextRequest, NextResponse } from 'next/server';
import { fetchTodayEfemerides } from '@/services/efemeridesService';
import { checkRateLimit, getClientId, rateLimitHeaders, RATE_LIMITS } from '@/security/rateLimit';
import { withCache } from '@/security/cache';
import { logger } from '@/security/logging';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const clientId = getClientId(request);

  const rateResult = checkRateLimit(`efemerides:${clientId}`, RATE_LIMITS.apiGeneral);
  if (!rateResult.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(rateResult) });
  }

  try {
    // Cache for 1 hour (efemérides don't change within a day)
    const efemerides = await withCache('efemerides:today', fetchTodayEfemerides, 60 * 60 * 1000);
    return NextResponse.json(efemerides, { headers: rateLimitHeaders(rateResult) });
  } catch (error) {
    logger.error('Failed to fetch efemerides', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
