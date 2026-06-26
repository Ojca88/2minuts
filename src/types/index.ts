export interface News {
  id: string;
  title: string;
  source: string;
  date: string;
  summary: string;
  url: string;
  categoryId: string;
  verified: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  newsCount: number;
}

export interface Efemeride {
  id: string;
  year: number;
  event: string;
  description: string;
  source: string;
}

export interface Saint {
  name: string;
  biography: string;
  relevance: string;
}

export interface Report {
  id: string;
  date: string;
  lastUpdate: string;
  executiveSummary: string;
  categories: Category[];
  news: News[];
  efemerides: Efemeride[];
  saint: Saint;
}

export interface Settings {
  language: string;
  updateFrequency: string;
  email: string;
  theme: 'light' | 'dark';
}
