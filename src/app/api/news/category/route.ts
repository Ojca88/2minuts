import { NextRequest, NextResponse } from 'next/server';
import { fetchNewsByCategory } from '@/services/rssService';

export const revalidate = 900;

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get('id');
  if (!categoryId) {
    return NextResponse.json([], { status: 400 });
  }

  const news = await fetchNewsByCategory(categoryId);
  return NextResponse.json(news);
}
