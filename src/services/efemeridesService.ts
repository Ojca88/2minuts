import { Efemeride } from '@/types';
import { secureFetch } from '@/security/ssrf';
import { sanitizeText } from '@/security/sanitizers';

interface WikiEvent {
  text: string;
  year?: number;
  pages?: { title?: string }[];
}

/**
 * Obtiene las efemérides del día actual desde la API de Wikipedia.
 * Devuelve hasta 5 eventos históricos relevantes.
 */
export async function fetchTodayEfemerides(): Promise<Efemeride[]> {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  try {
    const response = await secureFetch(
      `https://es.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`,
      { cache: 'no-store', headers: { 'User-Agent': '2Minuts/1.0' } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const events: WikiEvent[] = data.events || [];

    return events.slice(0, 5).map((event, i) => ({
      id: `efem-${i}`,
      year: event.year || 0,
      event: sanitizeText(event.text.length > 100 ? event.text.slice(0, 100) + '…' : event.text),
      description: sanitizeText(event.text),
      source: 'Wikipedia',
    }));
  } catch {
    return [];
  }
}
