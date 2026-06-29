'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { News } from '@/types';

function getCategoryLabel(categoryId: string): string {
  const map: Record<string, string> = {
    ia: '🤖 Inteligencia Artificial', actualidad: '📰 Actualidad',
    internacional: '🌍 Internacional', politica: '🏛️ Política',
    deporte: '⚽ Deporte', realmadrid: '⚪ Real Madrid',
    tecnologia: '💻 Tecnología', gadgets: '📱 Gadgets',
  };
  return map[categoryId] || categoryId;
}

export default function NewsDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [news, setNews] = useState<News | null>(null);
  const [related, setRelated] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetch('/api/news?t=' + Date.now(), { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: News[]) => {
        const found = data.find((n) => n.id === id);
        setNews(found || null);
        if (found) {
          setRelated(data.filter((n) => n.categoryId === found.categoryId && n.id !== found.id).slice(0, 3));
        }
      })
      .catch(() => setNews(null))
      .finally(() => setLoading(false));

    // Check favorites
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('2minuts-favorites') || '[]');
      setIsFavorite(favs.includes(id));
    } catch { /* ignore */ }
  }, [id]);

  const toggleFavorite = () => {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('2minuts-favorites') || '[]');
      const updated = isFavorite ? favs.filter((f) => f !== id) : [...favs, id];
      localStorage.setItem('2minuts-favorites', JSON.stringify(updated));
      setIsFavorite(!isFavorite);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-8 pb-24 text-center">
          <p className="text-gray-500 dark:text-gray-400 animate-pulse">Cargando noticia...</p>
        </main>
      </>
    );
  }

  if (!news) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-8 pb-24 text-center">
          <p className="text-gray-500 dark:text-gray-400">Noticia no encontrada</p>
          <Link href="/noticias" className="text-blue-600 text-sm mt-4 inline-block">
            ← Volver al briefing
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/noticias"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Volver
          </Link>
          <button
            onClick={toggleFavorite}
            className="text-xl transition-transform active:scale-90"
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          >
            {isFavorite ? '⭐' : '☆'}
          </button>
        </div>

        <article className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          {/* Category badge */}
          <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
            {getCategoryLabel(news.categoryId)}
          </span>

          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug mt-2 mb-3">
            {news.title}
          </h1>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900 px-2 py-0.5 rounded">
              {news.source}
            </span>
            <span className="text-xs text-gray-400">{news.date}</span>
          </div>

          {/* Summary */}
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-5">
            {news.summary}
          </p>

          {/* ¿Por qué importa? */}
          {news.summary && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-5">
              <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1.5">💡 ¿Por qué importa?</h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Esta noticia de {news.source} es relevante en la categoría de {getCategoryLabel(news.categoryId).replace(/^[^\s]+\s/, '')}.
              </p>
            </div>
          )}

          {/* Source link */}
          {news.url ? (
            <a
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors"
            >
              Leer en {news.source} ↗
            </a>
          ) : (
            <p className="text-xs text-gray-400">Enlace a fuente no disponible.</p>
          )}
        </article>

        {/* Related News */}
        {related.length > 0 && (
          <section className="mt-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">📌 Relacionado</h3>
            <div className="grid gap-2">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/news/${r.id}`}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{r.title}</p>
                  <span className="text-[10px] text-blue-600 mt-1 block">{r.source}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
