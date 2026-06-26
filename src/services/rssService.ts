import { XMLParser } from 'fast-xml-parser';
import { News } from '@/types';

interface RssFeedConfig {
  url: string;
  categoryId: string;
  source: string;
}

const RSS_FEEDS: RssFeedConfig[] = [
  // Actualidad (solo España)
  { url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/espana/portada', categoryId: 'actualidad', source: 'El País' },
  // Internacional
  { url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/internacional/portada', categoryId: 'internacional', source: 'El País' },
  // Política
  { url: 'https://e00-elmundo.uecdn.es/elmundo/rss/espana.xml', categoryId: 'politica', source: 'El Mundo' },
  // Deporte General
  { url: 'https://e00-marca.uecdn.es/rss/portada.xml', categoryId: 'deporte', source: 'Marca' },
  // Real Madrid
  { url: 'https://e00-marca.uecdn.es/rss/futbol/real-madrid.xml', categoryId: 'realmadrid', source: 'Marca' },
  // Tecnología
  { url: 'https://feeds.weblogssl.com/xataka2', categoryId: 'tecnologia', source: 'Xataka' },
  // Gadgets
  { url: 'https://feeds.weblogssl.com/xatakamovil', categoryId: 'gadgets', source: 'Xataka Móvil' },
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  htmlEntities: true,
});

function decodeEntities(text: string): string {
  const entities: Record<string, string> = {
    '&quot;': '"',
    '&apos;': "'",
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' ',
    '&bull;': '•',
    '&ndash;': '–',
    '&mdash;': '—',
    '&laquo;': '«',
    '&raquo;': '»',
    '&iquest;': '¿',
    '&iexcl;': '¡',
  };
  let result = text;
  // Decode numeric entities (&#8226; &#xAB; etc.)
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  result = result.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  // Decode named entities
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replaceAll(entity, char);
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractItems(parsed: any): Record<string, unknown>[] {
  const channel = parsed?.rss?.channel;
  if (channel?.item) {
    return Array.isArray(channel.item) ? channel.item : [channel.item];
  }
  const feed = parsed?.feed;
  if (feed?.entry) {
    return Array.isArray(feed.entry) ? feed.entry : [feed.entry];
  }
  return [];
}

function parseItem(
  item: Record<string, unknown>,
  categoryId: string,
  source: string,
  index: number
): News | null {
  const rawTitle = typeof item.title === 'object' && item.title !== null
    ? ((item.title as Record<string, unknown>)['#text'] as string) || ''
    : (item.title as string) || '';
  const link = (item.link as string) || (item as { guid?: string }).guid || '';
  const rawDesc = typeof item.description === 'object' && item.description !== null
    ? ((item.description as Record<string, unknown>)['#text'] as string) || ''
    : (item.description as string) || (item.summary as string) || '';
  const pubDate = (item.pubDate as string) || (item.published as string) || (item['dc:date'] as string) || '';

  // Clean HTML tags from description and decode entities
  const cleanSummary = decodeEntities(rawDesc.replace(/<[^>]*>/g, '').trim()).slice(0, 300);
  const cleanTitle = decodeEntities(rawTitle.replace(/<[^>]*>/g, '').trim());

  if (!cleanTitle || !link) return null;

  const date = pubDate ? new Date(pubDate).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');

  return {
    id: `${categoryId}-${index}`,
    title: cleanTitle,
    source,
    date,
    summary: cleanSummary || 'Leer noticia completa en la fuente original.',
    url: typeof link === 'string' ? link : '',
    categoryId,
    verified: true,
  };
}

export async function fetchNewsByCategory(categoryId: string): Promise<News[]> {
  const feedConfig = RSS_FEEDS.find((f) => f.categoryId === categoryId);
  if (!feedConfig) return [];

  try {
    const response = await fetch(feedConfig.url, {
      next: { revalidate: 900 }, // Cache 15 min
      headers: { 'User-Agent': '2Minuts/1.0' },
    });

    if (!response.ok) return [];

    const xml = await response.text();
    const parsed = parser.parse(xml);
    const items = extractItems(parsed);

    const news: News[] = [];
    for (let i = 0; i < Math.min(items.length, 8); i++) {
      const item = items[i] as Record<string, unknown>;
      const parsedItem = parseItem(item, categoryId, feedConfig.source, i);
      if (parsedItem) news.push(parsedItem);
    }
    // Deduplicate within category and return top 3
    return deduplicateNews(news).slice(0, 3);
  } catch {
    return [];
  }
}

// Extrae palabras clave significativas de un título (>4 chars, lowercase)
function extractKeywords(title: string): string[] {
  const stopWords = ['sobre', 'entre', 'desde', 'hasta', 'para', 'como', 'esta', 'este', 'estos', 'estas', 'tras', 'según', 'donde', 'cuando', 'puede', 'tiene', 'nuevo', 'nueva'];
  return title
    .toLowerCase()
    .replace(/[^a-záéíóúñü\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 4 && !stopWords.includes(w));
}

// Dos titulares se consideran duplicados si comparten 2+ palabras clave
function isSimilar(titleA: string, titleB: string): boolean {
  const kwA = extractKeywords(titleA);
  const kwB = extractKeywords(titleB);
  const shared = kwA.filter((w) => kwB.includes(w));
  return shared.length >= 2;
}

function deduplicateNews(news: News[]): News[] {
  const result: News[] = [];
  for (const item of news) {
    const isDuplicate = result.some((existing) => isSimilar(existing.title, item.title));
    if (!isDuplicate) {
      result.push(item);
    }
  }
  return result;
}

export async function fetchAllNews(): Promise<News[]> {
  const categories = ['actualidad', 'internacional', 'politica', 'deporte', 'realmadrid', 'tecnologia', 'gadgets'];

  const results = await Promise.allSettled(
    categories.map((cat) => fetchNewsByCategory(cat))
  );

  const allNews: News[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allNews.push(...result.value);
    }
  }
  return deduplicateNews(allNews);
}
