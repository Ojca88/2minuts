import { XMLParser } from 'fast-xml-parser';
import { secureFetch } from '@/security/ssrf';
import { sanitizeRssContent, sanitizeUrl } from '@/security/sanitizers';

export interface Offer {
  id: string;
  title: string;
  price: string;
  store: string;
  url: string;
  category: string;
  date: string;
  image?: string;
}

interface OfferFeedConfig {
  url: string;
  category: string;
  source: string;
}

// All feeds - some are shared across categories and filtered by brand keywords
const OFFER_FEEDS: OfferFeedConfig[] = [
  // Tecnología
  { url: 'https://hardzone.es/feed/', category: 'tecnologia', source: 'HardZone' },
  { url: 'https://www.adslzone.net/feed/', category: 'tecnologia', source: 'ADSLZone' },
  // Móviles
  { url: 'https://www.adslzone.net/feed/', category: 'moviles', source: 'ADSLZone' },
  { url: 'https://feeds.weblogssl.com/xatakamovil', category: 'moviles', source: 'Xataka Móvil' },
  // Gaming
  { url: 'https://www.muycomputer.com/feed/', category: 'gaming', source: 'MuyComputer' },
  // Hogar
  { url: 'https://www.profesionalreview.com/feed/', category: 'hogar', source: 'ProfesionalReview' },
  // Nike - deal aggregators with brand search
  { url: 'https://www.chollometro.com/rss/grupo/nike', category: 'ropa_nike', source: 'Chollometro' },
  { url: 'https://www.chollometro.com/rss/search?q=nike', category: 'ropa_nike', source: 'Chollometro' },
  { url: 'https://www.adslzone.net/feed/', category: 'ropa_nike', source: 'ADSLZone' },
  // Adidas - deal aggregators with brand search
  { url: 'https://www.chollometro.com/rss/grupo/adidas', category: 'ropa_adidas', source: 'Chollometro' },
  { url: 'https://www.chollometro.com/rss/search?q=adidas', category: 'ropa_adidas', source: 'Chollometro' },
  { url: 'https://www.adslzone.net/feed/', category: 'ropa_adidas', source: 'ADSLZone' },
];

// General offer keywords
const OFFER_KEYWORDS = [
  'oferta', 'descuento', 'rebaja', 'barato', 'precio', 'chollo',
  'prime day', 'black friday', 'ahorra', 'ganga', 'promoción',
  'cupón', 'euros menos', '% de descuento', 'gratis', 'económico',
  'menos de', 'por solo', 'tirado de precio', 'mínimo histórico',
  'amazon', 'mediamarkt', 'pccomponentes', 'aliexpress', 'miravia',
];

// Brand keywords for filtering
const NIKE_KEYWORDS = ['nike', 'air max', 'air force', 'jordan', 'dunk', 'pegasus', 'running', 'zapatilla', 'sneaker', 'deportiva'];
const ADIDAS_KEYWORDS = ['adidas', 'ultraboost', 'samba', 'gazelle', 'superstar', 'yeezy', 'running', 'zapatilla', 'sneaker', 'deportiva'];

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

  const cleanTitle = sanitizeRssContent((typeof title === 'string' ? title : '').replace(/<[^>]*>/g, '').trim());
  if (!cleanTitle || !link) return null;

  const lowerTitle = cleanTitle.toLowerCase();

  // For brand categories, filter by brand keywords (no need for general offer keywords)
  if (category === 'ropa_nike') {
    if (!NIKE_KEYWORDS.some((kw) => lowerTitle.includes(kw))) return null;
  } else if (category === 'ropa_adidas') {
    if (!ADIDAS_KEYWORDS.some((kw) => lowerTitle.includes(kw))) return null;
  } else {
    // For other categories, require general offer keywords
    const isOffer = OFFER_KEYWORDS.some((kw) => lowerTitle.includes(kw));
    if (!isOffer) return null;
  }

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
    url: sanitizeUrl(typeof link === 'string' ? link : ''),
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
      const response = await secureFetch(feedConfig.url, {
        cache: 'no-store',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; 2Minuts/1.0)' },
      });

      if (!response.ok) continue;

      const xml = await response.text();
      const parsed = parser.parse(xml);
      const items = extractItems(parsed);

      // For brand categories, scan more items since brand filter is restrictive
      const maxScan = (category === 'ropa_nike' || category === 'ropa_adidas') ? items.length : Math.min(items.length, 30);

      for (let i = 0; i < maxScan; i++) {
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

  // Fallback: if brand categories have no results, show curated links
  if (allOffers.length === 0 && category === 'ropa_nike') {
    return getNikeFallbackOffers();
  }
  if (allOffers.length === 0 && category === 'ropa_adidas') {
    return getAdidasFallbackOffers();
  }

  return allOffers;
}

function getNikeFallbackOffers(): Offer[] {
  const today = new Date().toLocaleDateString('es-ES');
  return [
    { id: 'nike-sale-1', title: 'Nike Sale - Hasta 50% en zapatillas seleccionadas', price: 'Hasta -50%', store: 'Nike', url: 'https://www.nike.com/es/w/rebajas-3yaep', category: 'ropa_nike', date: today },
    { id: 'nike-sale-2', title: 'Nike Air Max - Colección con descuentos', price: 'Desde 89€', store: 'Nike', url: 'https://www.nike.com/es/w/air-max-a6d8h', category: 'ropa_nike', date: today },
    { id: 'nike-sale-3', title: 'Nike Running - Ofertas en Pegasus y Vomero', price: 'Desde 79€', store: 'Nike', url: 'https://www.nike.com/es/w/running-zapatillas-37v7jz6eovh', category: 'ropa_nike', date: today },
    { id: 'nike-sale-4', title: 'Nike Dunk & Jordan - Sneakers en oferta', price: 'Desde 69€', store: 'Nike', url: 'https://www.nike.com/es/w/jordan-37eef', category: 'ropa_nike', date: today },
  ];
}

function getAdidasFallbackOffers(): Offer[] {
  const today = new Date().toLocaleDateString('es-ES');
  return [
    { id: 'adidas-sale-1', title: 'Adidas Outlet - Hasta 50% de descuento', price: 'Hasta -50%', store: 'Adidas', url: 'https://www.adidas.es/outlet', category: 'ropa_adidas', date: today },
    { id: 'adidas-sale-2', title: 'Adidas Samba y Gazelle - Clásicos en oferta', price: 'Desde 69€', store: 'Adidas', url: 'https://www.adidas.es/samba', category: 'ropa_adidas', date: today },
    { id: 'adidas-sale-3', title: 'Adidas Ultraboost - Running con descuento', price: 'Desde 99€', store: 'Adidas', url: 'https://www.adidas.es/ultraboost', category: 'ropa_adidas', date: today },
    { id: 'adidas-sale-4', title: 'Adidas Originals - Superstar y más', price: 'Desde 59€', store: 'Adidas', url: 'https://www.adidas.es/originals', category: 'ropa_adidas', date: today },
  ];
}

export async function fetchAllOffers(): Promise<Record<string, Offer[]>> {
  const categories = ['tecnologia', 'moviles', 'gaming', 'hogar', 'ropa_nike', 'ropa_adidas'];

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
  // These offers are REMOVED from their original category to avoid repetition
  const strongKeywords = ['prime day', 'descuento', 'rebaja', 'mínimo histórico', 'chollo', 'oferta bomba', 'euros menos', 'gratis', 'cupón'];
  const superOfferIds = new Set<string>();
  const superOffers = allOffers
    .filter((o) => {
      const lower = o.title.toLowerCase();
      return strongKeywords.some((kw) => lower.includes(kw));
    })
    .slice(0, 5)
    .map((o) => {
      superOfferIds.add(o.id);
      return { ...o, id: `superofertas-${o.id}`, category: 'superofertas' };
    });

  // Remove superofertas items from their original categories
  for (const cat of categories) {
    offersByCategory[cat] = offersByCategory[cat].filter((o) => !superOfferIds.has(o.id));
  }
  
  offersByCategory['superofertas'] = superOffers;

  return offersByCategory;
}
