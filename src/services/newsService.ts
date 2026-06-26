import { News } from '@/types';
import { mockNews } from '@/data/mockNews';

// Fuentes oficiales permitidas. En producción, solo se aceptarán noticias
// provenientes de estas fuentes verificadas (RSS, APIs oficiales).
const TRUSTED_SOURCES = [
  'El País', 'El Mundo', 'ABC', 'La Vanguardia', 'Expansión', 'Cinco Días',
  'La Razón', 'El Confidencial', 'Público', 'Marca', 'AS', 'Mundo Deportivo',
  'Reuters', 'Bloomberg', 'Financial Times', 'BBC', 'Al Jazeera', 'Nikkei',
  'Le Monde', 'Der Spiegel', 'Euronews', 'France Football', 'Palco23',
  'TechCrunch', 'Wired', 'Nature', 'The Verge', 'Engadget', 'Ars Technica',
  'CNET', 'Xataka', 'IGN', 'ComputerWorld', 'MIT Technology Review',
  'ESPN', 'DAZN', 'UEFA',
];

function isFromTrustedSource(news: News): boolean {
  return TRUSTED_SOURCES.includes(news.source);
}

export interface INewsService {
  getAll(): Promise<News[]>;
  getByCategory(categoryId: string): Promise<News[]>;
  getById(id: string): Promise<News | undefined>;
}

export const newsService: INewsService = {
  async getAll() {
    return mockNews.filter(isFromTrustedSource);
  },

  async getByCategory(categoryId: string) {
    return mockNews.filter((n) => n.categoryId === categoryId && isFromTrustedSource(n));
  },

  async getById(id: string) {
    const news = mockNews.find((n) => n.id === id);
    if (news && !isFromTrustedSource(news)) return undefined;
    return news;
  },
};
