import { NextRequest, NextResponse } from 'next/server';
import { fetchAllOffers } from '@/services/offersService';
import { checkRateLimit, getClientId, rateLimitHeaders, RATE_LIMITS } from '@/security/rateLimit';
import { withCache, invalidateCache } from '@/security/cache';
import { logger } from '@/security/logging';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const clientId = getClientId(request);

  // Rate limiting
  const rateResult = checkRateLimit(`offers:${clientId}`, RATE_LIMITS.apiGeneral);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimitHeaders(rateResult) }
    );
  }

  try {
    // Invalidate cache if refresh requested
    const refresh = request.nextUrl.searchParams.get('refresh');
    if (refresh === 'true') {
      invalidateCache('offers:all');
    }

    // Cache offers for 5 minutes
    const offers = await withCache('offers:all', fetchAllOffers, 5 * 60 * 1000);
    
    logger.info('Offers fetched', { count: offers.length });
    return NextResponse.json(offers, { headers: rateLimitHeaders(rateResult) });
  } catch (error) {
    logger.error('Failed to fetch offers', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
