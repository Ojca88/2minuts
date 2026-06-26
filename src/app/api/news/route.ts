import { NextResponse } from 'next/server';
import { fetchAllNews } from '@/services/rssService';

export const revalidate = 900; // ISR: revalidate every 15 minutes

export async function GET() {
  const news = await fetchAllNews();
  return NextResponse.json(news);
}
