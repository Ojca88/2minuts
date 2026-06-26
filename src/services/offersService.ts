import { XMLParser } from 'fast-xml-parser';

export interface Offer {
  id: string;
  title: string;
  price: string;
  store: string;
  url: string;
  category: string;
  date: string;
}

interface OfferFeedConfig {
  url: string;
  category: string;
  source: string;
}

// Working Spanish tech RSS feeds that regularly contain deals/offers
const OFFER_FEEDS: OfferFeedConfig[] = [
  { url: 'https://hardzone.es/feed/', category: 'tecnologia', source: 'HardZone' },
  { url: 'https://www.adslzone.net/feed/', category: 'moviles', source: 'ADSLZone' },
  { url: 'https://www.muycomputer.com/feed/', category: 'gaming', source: 'MuyComputer' },
  { url: 'https://www.profesionalreview.com/feed/', category: 'hogar', source: 'ProfesionalReview' },
  { url: 'https://www.muycomputer.com/feed/', category: 'hogar', source: 'MuyComputer' },
];

// Keywords that indicate an offer/deal
const OFFER_KEYWORDS = [
  'oferta', 'descuento', 'rebaja', 'barato', 'precio', 'chollo',
  'prime day', 'black friday', 'ahorra', 'ganga', 'promoción',
  'cupón', 'euros menos', '% de descuento', 'gratis', 'económico',
  'menos de', 'por solo', 'tirado de precio', 'mínimo histórico',
  'amazon', 'mediamarkt', 'pccomponentes', 'aliexpress', 'miravia',
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

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

function parseOfferItem(
  item: Record<string, unknown>,
  category: string,
  source: string,
  index: number
): Offer | null {
  const title = (item.title as string) || '';
  const link = (item.link as string) || (item.guid as string) || '';
  const pubDate = (item.pubDate as string) || '';

  const cleanTitle = (typeof title === 'string' ? title : '').replace(/<[^>]*>/g, '').trim();
  if (!cleanTitle || !link) return null;

  // Only include items that match offer keywords
  const lowerTitle = cleanTitle.toLowerCase();
  const isOffer = OFFER_KEYWORDS.some((kw) => lowerTitle.includes(kw));
  if (!isOffer) return null;

  // Extract price from title
  const pricePatterns = [
    /(?:por|desde|solo|a)\s*(\d+[.,]?\d*\s*(?:€|euros?))/i,
    /(\d+[.,]?\d*\s*(?:€|euros?))/i,
    /(\d+[.,]?\d*\s*(?:dólares|dollars|\$))/i,
    /(?:menos de|por menos de)\s*(\d+[.,]?\d*\s*(?:€|euros?))/i,
    /(\d+)\s*(?:euros?|€)\s*(?:menos|de descuento)/i,
  ];
  let price = '';
  for (const pattern of pricePatterns) {
    const priceMatch = cleanTitle.match(pattern);
    if (priceMatch) {
      price = priceMatch[1].replace('euros', '€').replace('euro', '€').trim();
      if (!price.includes('€') && !price.includes('$')) price += ' €';
      break;
    }
  }
  // Also check for percentage discounts
  if (!price) {
    const pctMatch = cleanTitle.match(/(\d+)\s*%\s*(?:de\s*)?descuento/i);
    if (pctMatch) price = `-${pctMatch[1]}%`;
  }

  // Extract store from title if possible
  const storeMatch = cleanTitle.match(/\b(Amazon|MediaMarkt|PcComponentes|El Corte Inglés|Aliexpress|Carrefour|Lidl|Nike|Adidas|Decathlon|Miravia|Fnac|Steam|Epic|Xiaomi|Apple|Samsung)\b/i);
  const store = storeMatch ? storeMatch[1] : source;

  const date = pubDate ? new Date(pubDate).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');

  return {
    id: `${category}-${index}-${Date.now()}`,
    title: cleanTitle,
    price,
    store,
    url: typeof link === 'string' ? link : '',
    category,
    date,
  };
}

// Deduplication by keyword similarity
function extractKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-záéíóúñü0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 4);
}

function isSimilar(a: string, b: string): boolean {
  const kwA = extractKeywords(a);
  const kwB = extractKeywords(b);
  const shared = kwA.filter((w) => kwB.includes(w));
  return shared.length >= 3;
}

export async function fetchOffersByCategory(category: string): Promise<Offer[]> {
  const feedConfigs = OFFER_FEEDS.filter((f) => f.category === category);
  if (feedConfigs.length === 0) return [];

  const allOffers: Offer[] = [];

  for (const feedConfig of feedConfigs) {
    try {
      const response = await fetch(feedConfig.url, {
        next: { revalidate: 900 },
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; 2Minuts/1.0)' },
      });

      if (!response.ok) continue;

      const xml = await response.text();
      const parsed = parser.parse(xml);
      const items = extractItems(parsed);

      for (let i = 0; i < items.length; i++) {
        const item = items[i] as Record<string, unknown>;
        const offer = parseOfferItem(item, category, feedConfig.source, i);
        if (offer) {
          const isDuplicate = allOffers.some((o) => isSimilar(o.title, offer.title));
          if (!isDuplicate) allOffers.push(offer);
        }
        if (allOffers.length >= 6) break;
      }
    } catch {
      continue;
    }
    if (allOffers.length >= 6) break;
  }

  return allOffers;
}

export async function fetchAllOffers(): Promise<Record<string, Offer[]>> {
  const categories = ['tecnologia', 'moviles', 'gaming', 'hogar'];

  const results = await Promise.allSettled(
    categories.map((cat) => fetchOffersByCategory(cat))
  );

  const offersByCategory: Record<string, Offer[]> = {};
  const seenTitles: string[] = [];
  const allOffers: Offer[] = [];

  for (let i = 0; i < categories.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      // Deduplicate across categories
      const unique = result.value.filter((offer) => {
        const isDup = seenTitles.some((t) => isSimilar(t, offer.title));
        if (!isDup) {
          seenTitles.push(offer.title);
          return true;
        }
        return false;
      });
      offersByCategory[categories[i]] = unique;
      allOffers.push(...unique);
    } else {
      offersByCategory[categories[i]] = [];
    }
  }

  // Superofertas: pick the best offers from all categories (those with strongest deal keywords)
  const strongKeywords = ['prime day', 'descuento', 'rebaja', 'mínimo histórico', 'chollo', 'oferta bomba', 'euros menos'];
  const superOffers = allOffers
    .filter((o) => {
      const lower = o.title.toLowerCase();
      return strongKeywords.some((kw) => lower.includes(kw));
    })
    .slice(0, 5)
    .map((o) => ({ ...o, id: `superofertas-${o.id}`, category: 'superofertas' }));
  
  offersByCategory['superofertas'] = superOffers;

  return offersByCategory;
}
