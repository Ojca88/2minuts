/** Noticia obtenida de feeds RSS */
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

/** Categoría temática de noticias */
export interface Category {
  id: string;
  name: string;
  icon: string;
  newsCount: number;
}

/** Efeméride histórica del día (fuente: Wikipedia) */
export interface Efemeride {
  id: string;
  year: number;
  event: string;
  description: string;
  source: string;
}

/** Santo del día (fuente: Wikipedia) */
export interface Saint {
  name: string;
  biography: string;
  relevance: string;
}

/** Preferencias del usuario almacenadas en localStorage */
export interface Settings {
  language: string;
  updateFrequency: string;
  email: string;
  theme: 'light' | 'dark';
  offersPerCategory: number;
}
