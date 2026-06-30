import { NextRequest, NextResponse } from 'next/server';
import { fetchAllNews } from '@/services/rssService';
import { checkRateLimit, getClientId, rateLimitHeaders, RATE_LIMITS } from '@/security/rateLimit';
import { withCache, invalidateCache } from '@/security/cache';
import { logger } from '@/security/logging';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const clientId = getClientId(request);

  // Rate limiting
  const rateResult = checkRateLimit(`news:${clientId}`, RATE_LIMITS.apiGeneral);
  if (!rateResult.allowed) {
    logger.security('Rate limit exceeded', { clientId, path: '/api/news' });
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimitHeaders(rateResult) }
    );
  }

  try {
    // Invalidate cache if refresh requested
    const refresh = request.nextUrl.searchParams.get('refresh');
    if (refresh === 'true') {
      invalidateCache('news:all');
    }

    // Cache news for 2 minutes to avoid excessive RSS fetches
    const news = await withCache('news:all', fetchAllNews, 2 * 60 * 1000);
    
    logger.info('News fetched', { count: news.length, duration: `${Date.now() - startTime}ms` });
    return NextResponse.json(news, { headers: rateLimitHeaders(rateResult) });
  } catch (error) {
    logger.error('Failed to fetch news', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
