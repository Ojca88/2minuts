'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { News } from '@/types';

export default function NewsDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news')
      .then((res) => res.json())
      .then((data: News[]) => {
        const found = data.find((n) => n.id === id);
        setNews(found || null);
      })
      .catch(() => setNews(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-8 pb-24 text-center">
          <p className="text-gray-500 animate-pulse">Cargando noticia...</p>
        </main>
      </>
    );
  }

  if (!news) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-8 pb-24 text-center">
          <p className="text-gray-500">Noticia no encontrada</p>
          <Link href="/" className="text-blue-600 text-sm mt-4 inline-block">
            ← Volver al inicio
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-4 pb-24">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors mb-4"
        >
          ← Volver al inicio
        </Link>

        <article className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h1 className="text-lg font-bold text-gray-900 leading-snug mb-3">
            {news.title}
          </h1>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {news.source}
            </span>
            <span className="text-xs text-gray-400">{news.date}</span>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed mb-6">
            {news.summary}
          </p>

          {news.url ? (
            <a
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors"
            >
              Ver en {news.source} ↗
            </a>
          ) : (
            <p className="text-xs text-gray-400">Enlace a fuente no disponible.</p>
          )}
        </article>
      </main>
    </>
  );
}
