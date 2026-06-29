import { NextRequest, NextResponse } from 'next/server';
import { fetchNewsByCategory } from '@/services/rssService';
import { checkRateLimit, getClientId, rateLimitHeaders, RATE_LIMITS } from '@/security/rateLimit';
import { categoryQuerySchema, validateQuery } from '@/security/validators';
import { withCache } from '@/security/cache';
import { logger } from '@/security/logging';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const clientId = getClientId(request);

  // Rate limiting
  const rateResult = checkRateLimit(`news-cat:${clientId}`, RATE_LIMITS.apiGeneral);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimitHeaders(rateResult) }
    );
  }

  // Input validation
  const categoryId = request.nextUrl.searchParams.get('id');
  const validation = validateQuery(categoryQuerySchema, { id: categoryId });
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const news = await withCache(
      `news:cat:${validation.data.id}`,
      () => fetchNewsByCategory(validation.data.id),
      2 * 60 * 1000
    );
    return NextResponse.json(news, { headers: rateLimitHeaders(rateResult) });
  } catch (error) {
    logger.error('Failed to fetch category news', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
