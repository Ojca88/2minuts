/**
 * Servicio RSS - Obtiene noticias en tiempo real de múltiples feeds.
 * Cada feed se asigna a una categoría y se deduplica por similitud de títulos.
 */
import { XMLParser } from 'fast-xml-parser';
import { News } from '@/types';
import { secureFetch } from '@/security/ssrf';
import { sanitizeRssContent, sanitizeUrl } from '@/security/sanitizers';

interface RssFeedConfig {
  url: string;
  categoryId: string;
  source: string;
}

const RSS_FEEDS: RssFeedConfig[] = [
  // Inteligencia Artificial
  { url: 'https://feeds.weblogssl.com/xataka2', categoryId: 'ia', source: 'Xataka' },
  { url: 'https://www.technologyreview.es/feed', categoryId: 'ia', source: 'MIT Technology Review' },
  { url: 'https://www.muycomputer.com/feed/', categoryId: 'ia', source: 'MuyComputer' },
  { url: 'https://wwwhatsnew.com/feed/', categoryId: 'ia', source: 'WWWhatsnew' },
  { url: 'https://hipertextual.com/feed', categoryId: 'ia', source: 'Hipertextual' },
  { url: 'https://www.adslzone.net/feed/', categoryId: 'ia', source: 'ADSLZone' },
  // Actualidad (España)
  { url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/espana/portada', categoryId: 'actualidad', source: 'El País' },
  { url: 'https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml', categoryId: 'actualidad', source: 'El Mundo' },
  { url: 'https://rss.elconfidencial.com/espana/', categoryId: 'actualidad', source: 'El Confidencial' },
  // Internacional
  { url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/internacional/portada', categoryId: 'internacional', source: 'El País' },
  { url: 'https://e00-elmundo.uecdn.es/elmundo/rss/internacional.xml', categoryId: 'internacional', source: 'El Mundo' },
  { url: 'https://rss.elconfidencial.com/mundo/', categoryId: 'internacional', source: 'El Confidencial' },
  // Política
  { url: 'https://e00-elmundo.uecdn.es/elmundo/rss/espana.xml', categoryId: 'politica', source: 'El Mundo' },
  { url: 'https://rss.elconfidencial.com/espana/', categoryId: 'politica', source: 'El Confidencial' },
  // Deporte General
  { url: 'https://e00-marca.uecdn.es/rss/portada.xml', categoryId: 'deporte', source: 'Marca' },
  { url: 'https://as.com/rss/diario.xml', categoryId: 'deporte', source: 'AS' },
  // Real Madrid
  { url: 'https://e00-marca.uecdn.es/rss/futbol/real-madrid.xml', categoryId: 'realmadrid', source: 'Marca' },
  { url: 'https://as.com/rss/futbol/realmadrid.xml', categoryId: 'realmadrid', source: 'AS' },
  // Tecnología
  { url: 'https://feeds.weblogssl.com/xataka2', categoryId: 'tecnologia', source: 'Xataka' },
  { url: 'https://www.muycomputer.com/feed/', categoryId: 'tecnologia', source: 'MuyComputer' },
  { url: 'https://www.adslzone.net/feed/', categoryId: 'tecnologia', source: 'ADSLZone' },
  { url: 'https://hipertextual.com/feed', categoryId: 'tecnologia', source: 'Hipertextual' },
  { url: 'https://hardzone.es/feed/', categoryId: 'tecnologia', source: 'HardZone' },
  // Gadgets
  { url: 'https://feeds.weblogssl.com/xatakamovil', categoryId: 'gadgets', source: 'Xataka Móvil' },
  { url: 'https://www.profesionalreview.com/feed/', categoryId: 'gadgets', source: 'ProfesionalReview' },
  { url: 'https://wwwhatsnew.com/feed/', categoryId: 'gadgets', source: 'WWWhatsnew' },
  { url: 'https://www.adslzone.net/feed/', categoryId: 'gadgets', source: 'ADSLZone' },
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
  const cleanSummary = sanitizeRssContent(decodeEntities(rawDesc.replace(/<[^>]*>/g, '').trim())).slice(0, 300);
  const cleanTitle = sanitizeRssContent(decodeEntities(rawTitle.replace(/<[^>]*>/g, '').trim()));

  if (!cleanTitle || !link) return null;

  const date = pubDate ? new Date(pubDate).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');
  const safeUrl = sanitizeUrl(typeof link === 'string' ? link : '');

  return {
    id: `${categoryId}-${index}`,
    title: cleanTitle,
    source,
    date,
    summary: cleanSummary || 'Leer noticia completa en la fuente original.',
    url: safeUrl,
    categoryId,
    verified: true,
  };
}

// Keywords that indicate AI-related news (se buscan en título + resumen en minúsculas)
const AI_KEYWORDS = [
  'inteligencia artificial', 'ia ', ' ia', 'chatgpt', 'openai', 'gemini', 'claude',
  'machine learning', 'deep learning', 'llm', 'gpt', 'copilot', 'modelo de lenguaje',
  'neural', 'ai ', ' ai', 'artificial intelligence', 'generativa', 'generative',
  'anthropic', 'midjourney', 'stable diffusion', 'robot', 'automatización',
  'sora', 'dall-e', 'hugging face', 'transformers', 'agente', 'prompt',
  'microsoft copilot', 'meta ai', 'apple intelligence', 'nvidia',
];

export async function fetchNewsByCategory(categoryId: string): Promise<News[]> {
  const feedConfigs = RSS_FEEDS.filter((f) => f.categoryId === categoryId);
  if (feedConfigs.length === 0) return [];

  const allNews: News[] = [];

  for (const feedConfig of feedConfigs) {
    try {
      const response = await secureFetch(feedConfig.url, {
        cache: 'no-store',
        headers: { 'User-Agent': '2Minuts/1.0' },
      });

      if (!response.ok) continue;

      const xml = await response.text();
      const parsed = parser.parse(xml);
      const items = extractItems(parsed);

      for (let i = 0; i < Math.min(items.length, 15); i++) {
        const item = items[i] as Record<string, unknown>;
        const parsedItem = parseItem(item, categoryId, feedConfig.source, i);
        if (parsedItem) {
          // For IA category, filter only AI-related news
          if (categoryId === 'ia') {
            const lower = parsedItem.title.toLowerCase() + ' ' + parsedItem.summary.toLowerCase();
            const isAI = AI_KEYWORDS.some((kw) => lower.includes(kw));
            if (!isAI) continue;
          }
          allNews.push(parsedItem);
        }
      }
    } catch {
      continue;
    }
  }

  return shuffle(deduplicateNews(allNews)).slice(0, 10);
}

/** Mezcla aleatoriamente un array (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
  const categories = ['ia', 'actualidad', 'internacional', 'politica', 'deporte', 'realmadrid', 'tecnologia', 'gadgets'];

  const results = await Promise.allSettled(
    categories.map((cat) => fetchNewsByCategory(cat))
  );

  const allNews: News[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allNews.push(...result.value);
    }
  }
  return shuffle(deduplicateNews(allNews));
}
