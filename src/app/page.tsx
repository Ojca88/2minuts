'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { News, Efemeride, Saint } from '@/types';

interface SaintDay {
  label: string;
  saint: Saint;
}

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
  const [efemerides, setEfemerides] = useState<Efemeride[]>([]);
  const [saints, setSaints] = useState<SaintDay[]>([]);


  useEffect(() => {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('2minuts-favorites') || '[]');
      setFavorites(new Set(favs));
    } catch { /* ignore */ }
    fetch('/api/efemerides?t=' + Date.now(), { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : [])
      .then(setEfemerides)
      .catch(() => {});
    fetch('/api/saint?t=' + Date.now(), { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : [])
      .then(setSaints)
      .catch(() => {});
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

  const fetchBriefing = useCallback(async (refresh = false) => {
    try {
      const params = refresh ? `?refresh=true&t=${Date.now()}` : `?t=${Date.now()}`;
      const [newsRes, offersRes] = await Promise.all([
        fetch('/api/news' + params, { cache: 'no-store' }),
        fetch('/api/offers' + params, { cache: 'no-store' }),
      ]);
      if (newsRes.ok) {
        const data: News[] = await newsRes.json();
        setTopNews(data.slice(0, 5));
        setTotalNews(data.length);
        setLastUpdate(new Date().toLocaleString('es-ES', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }));
      }
      // Offers pre-fetched so they're fresh when user navigates
      if (offersRes.ok) { /* cache warmed */ }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchBriefing(); }, [fetchBriefing]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setShowSuccess(false);
    try { await fetchBriefing(true); } finally {
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
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-emerald-300 disabled:to-teal-400 text-white font-semibold py-3.5 px-6 rounded-xl transition-all active:scale-95 disabled:active:scale-100 shadow-lg shadow-emerald-500/20 mb-2"
        >
          {isUpdating ? '⏳ Generando Briefing...' : '🔄 Generar Briefing'}
        </button>
        {showSuccess && (
          <p className="text-sm text-green-600 font-medium text-center mb-4 animate-fade-in">✓ Briefing actualizado</p>
        )}

        {/* Quick Access */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            href="/noticias"
            className="flex items-center gap-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all active:scale-95"
          >
            <span className="text-3xl drop-shadow-md">📰</span>
            <div>
              <p className="text-sm font-bold text-white">Briefing</p>
              <p className="text-[10px] text-indigo-100">Todas las categorías</p>
            </div>
          </Link>
          <Link
            href="/ofertas"
            className="flex items-center gap-3 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl p-4 shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 hover:scale-[1.02] transition-all active:scale-95"
          >
            <span className="text-3xl drop-shadow-md">🛍️</span>
            <div>
              <p className="text-sm font-bold text-white">Shopping</p>
              <p className="text-[10px] text-orange-100">Ofertas del día</p>
            </div>
          </Link>
        </div>

        {/* Lo imprescindible de hoy */}
        <section className="mb-6">
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

        {/* Efemérides */}
        <section className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">📅 Efemérides del {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</h3>
          <div className="grid gap-2">
            {efemerides.length > 0 ? efemerides.slice(0, 3).map((efem) => (
              <div key={efem.id} className="bg-white dark:bg-gray-800 rounded-xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900 px-1.5 py-0.5 rounded">{efem.year}</span>
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">{efem.event}</h4>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed mt-1">{efem.description}</p>
              </div>
            )) : (
              <p className="text-xs text-gray-400 animate-pulse">Cargando efemérides...</p>
            )}
          </div>
        </section>

        {/* Santoral */}
        <section className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">✝️ Santoral</h3>
          <div className="grid gap-2">
            {saints.length > 0 ? saints.map((day, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">{day.label}</p>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{day.saint.name}</h4>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">{day.saint.biography}</p>
                {day.saint.relevance && <p className="text-[11px] text-gray-500 dark:text-gray-400 italic mt-1">{day.saint.relevance}</p>}
              </div>
            )) : (
              <p className="text-xs text-gray-400 animate-pulse">Cargando santoral...</p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}