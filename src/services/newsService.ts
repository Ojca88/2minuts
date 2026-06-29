import { News } from '@/types';
import { fetchAllNews, fetchNewsByCategory } from '@/services/rssService';

export interface INewsService {
  getAll(): Promise<News[]>;
  getByCategory(categoryId: string): Promise<News[]>;
  getById(id: string): Promise<News | undefined>;
}

export const newsService: INewsService = {
  async getAll() {
    return fetchAllNews();
  },

  async getByCategory(categoryId: string) {
    return fetchNewsByCategory(categoryId);
  },

  async getById(id: string) {
    const allNews = await fetchAllNews();
    return allNews.find((n) => n.id === id);
  },
};
