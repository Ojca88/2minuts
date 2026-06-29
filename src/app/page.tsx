'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { News } from '@/types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Home() {
  const [topNews, setTopNews] = useState<News[]>([]);
  const [totalNews, setTotalNews] = useState(0);
  const [lastUpdate, setLastUpdate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('2minuts-favorites') || '[]');
      setFavorites(new Set(favs));
    } catch { /* ignore */ }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem('2minuts-favorites', JSON.stringify([...next]));
      return next;
    });
  };

  const fetchBriefing = useCallback(async () => {
    try {
      const res = await fetch('/api/news?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data: News[] = await res.json();
        setTopNews(data.slice(0, 5));
        setTotalNews(data.length);
        setLastUpdate(new Date().toLocaleString('es-ES', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchBriefing(); }, [fetchBriefing]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setShowSuccess(false);
    try { await fetchBriefing(); } finally {
      setIsUpdating(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const categories = 8;

  return (
    <>
      <Header lastUpdate={lastUpdate} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-6 pb-24">
        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{getGreeting()}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tu briefing diario está listo
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-xl font-bold text-blue-600">{totalNews}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">noticias</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-xl font-bold text-blue-600">{categories}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">categorías</p>
          </div>
        </div>

        {/* Update Button */}
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 px-6 rounded-xl transition-all active:scale-95 disabled:active:scale-100 shadow-sm mb-2"
        >
          {isUpdating ? '⏳ Generando Briefing...' : '🔄 Generar Briefing'}
        </button>
        {showSuccess && (
          <p className="text-sm text-green-600 font-medium text-center mb-4 animate-fade-in">✓ Briefing actualizado</p>
        )}

        {/* Lo imprescindible de hoy */}
        <section className="mt-6 mb-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">⚡ Lo imprescindible de hoy</h3>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700">
            {topNews.length > 0 ? topNews.map((news, i) => (
              <div
                key={news.id}
                className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <Link href={`/news/${news.id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">{news.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-blue-600 font-medium">{news.source}</span>
                    <span className="text-[10px] text-gray-400">{news.date}</span>
                  </div>
                </Link>
                <button
                  onClick={(e) => toggleFavorite(e, news.id)}
                  className="text-base shrink-0 mt-0.5 active:scale-90 transition-transform"
                  aria-label={favorites.has(news.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                >
                  {favorites.has(news.id) ? '⭐' : '☆'}
                </button>
              </div>
            )) : (
              <p className="p-4 text-xs text-gray-400 animate-pulse">Cargando noticias...</p>
            )}
          </div>
        </section>

        {/* Quick Access */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/noticias"
            className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all active:scale-95"
          >
            <span className="text-2xl">📰</span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Briefing</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Todas las categorías</p>
            </div>
          </Link>
          <Link
            href="/ofertas"
            className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all active:scale-95"
          >
            <span className="text-2xl">🛍️</span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Shopping</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Ofertas del día</p>
            </div>
          </Link>
        </div>
      </main>
    </>
  );
}