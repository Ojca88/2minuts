import { Saint } from '@/types';
import { secureFetch } from '@/security/ssrf';
import { sanitizeText } from '@/security/sanitizers';

export interface SaintDay {
  label: string;
  saint: Saint;
}

export interface ISaintService {
  getToday(): Promise<Saint>;
}

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

async function fetchSaintForDate(date: Date): Promise<Saint> {
  const day = date.getDate();
  const month = MONTHS_ES[date.getMonth()];
  const page = `${day}_de_${month}`;

  try {
    const sectionsRes = await secureFetch(
      `https://es.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=sections&format=json`,
      { cache: 'no-store', headers: { 'User-Agent': '2Minuts/1.0' } }
    );

    if (!sectionsRes.ok) return fallbackSaint();

    const sectionsData = await sectionsRes.json();
    const sections = sectionsData?.parse?.sections || [];
    const santoralSection = sections.find(
      (s: { line: string }) => s.line.toLowerCase().includes('santoral')
    );

    if (!santoralSection) return fallbackSaint();

    const textRes = await secureFetch(
      `https://es.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&section=${santoralSection.index}`,
      { cache: 'no-store', headers: { 'User-Agent': '2Minuts/1.0' } }
    );

    if (!textRes.ok) return fallbackSaint();

    const textData = await textRes.json();
    const wikitext: string = textData?.parse?.wikitext?.['*'] || '';

    const lines = wikitext.split('\n')
      .filter((l) => l.startsWith('*') && !l.startsWith('**'))
      .map((l) => l
        .replace(/\[\[([^|\]]*\|)?([^\]]*)\]\]/g, '$2')
        .replace(/\{\{[^}]*\}\}/g, '')
        .replace(/<ref[^>]*>.*?<\/ref>|<ref[^/]*\/>/g, '')
        .replace(/'''|''|\*\s*/g, '')
        .replace(/\[\[|\]\]/g, '')
        .trim()
      )
      .filter((l) => l.length > 5);

    if (lines.length === 0) return fallbackSaint();

    const mainSaint = lines[0];
    const otherSaints = lines.slice(1, 4).join('; ');

    return {
      name: sanitizeText(mainSaint.split(',')[0].trim() || mainSaint),
      biography: sanitizeText(mainSaint),
      relevance: otherSaints ? sanitizeText(`También: ${otherSaints}`) : '',
    };
  } catch {
    return fallbackSaint();
  }
}

export async function fetchTodaySaint(): Promise<Saint> {
  const now = new Date();
  return fetchSaintForDate(now);
}

export async function fetchTodayAndTomorrowSaints(): Promise<SaintDay[]> {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todaySaint, tomorrowSaint] = await Promise.all([
    fetchSaintForDate(now),
    fetchSaintForDate(tomorrow),
  ]);

  return [
    { label: `Hoy, ${now.getDate()} de ${MONTHS_ES[now.getMonth()]}`, saint: todaySaint },
    { label: `Mañana, ${tomorrow.getDate()} de ${MONTHS_ES[tomorrow.getMonth()]}`, saint: tomorrowSaint },
  ];
}

function fallbackSaint(): Saint {
  return {
    name: 'No disponible',
    biography: 'No se pudo obtener el santoral.',
    relevance: '',
  };
}

export const saintService: ISaintService = {
  async getToday() {
    return fetchTodaySaint();
  },
};
