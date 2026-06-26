import { NextResponse } from 'next/server';
import { fetchAllOffers } from '@/services/offersService';

export const revalidate = 900;

export async function GET() {
  const offers = await fetchAllOffers();
  return NextResponse.json(offers);
}
