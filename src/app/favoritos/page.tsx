'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { News } from '@/types';

export default function FavoritosPage() {
  const [favorites, setFavorites] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const favIds: string[] = JSON.parse(localStorage.getItem('2minuts-favorites') || '[]');
    if (favIds.length === 0) {
      setLoading(false);
      return;
    }
    fetch('/api/news?t=' + Date.now(), { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : [])
      .then((news: News[]) => setFavorites(news.filter((n) => favIds.includes(n.id))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const removeFavorite = (id: string) => {
    const favIds: string[] = JSON.parse(localStorage.getItem('2minuts-favorites') || '[]');
    const updated = favIds.filter((f) => f !== id);
    localStorage.setItem('2minuts-favorites', JSON.stringify(updated));
    setFavorites((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-4 pb-24">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">⭐ Favoritos</h2>

        {loading ? (
          <p className="text-sm text-gray-400 animate-pulse">Cargando...</p>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">☆</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">No tienes noticias guardadas</p>
            <p className="text-xs text-gray-400 mt-1">Toca ☆ en cualquier noticia para guardarla aquí</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {favorites.map((news) => (
              <div key={news.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="flex items-start gap-3 p-3">
                  <Link href={`/news/${news.id}`} className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">{news.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-blue-600 font-medium">{news.source}</span>
                      <span className="text-[10px] text-gray-400">{news.date}</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => removeFavorite(news.id)}
                    className="text-lg shrink-0 mt-0.5 active:scale-90 transition-transform"
                    aria-label="Quitar de favoritos"
                  >
                    ⭐
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
