'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUpdate } from '@/hooks/useUpdate';
import { Efemeride, Saint } from '@/types';

interface SaintDay {
  label: string;
  saint: Saint;
}

import Header from '@/components/Header';
import UpdateButton from '@/components/UpdateButton';

const CATEGORIES = [
  { id: 'ia', name: 'Inteligencia Artificial', icon: '🤖' },
  { id: 'actualidad', name: 'Actualidad', icon: '📰' },
  { id: 'internacional', name: 'Internacional', icon: '🌍' },
  { id: 'politica', name: 'Política', icon: '🏛️' },
  { id: 'deporte', name: 'Deporte', icon: '⚽' },
  { id: 'realmadrid', name: 'Real Madrid', icon: '⚪' },
  { id: 'tecnologia', name: 'Tecnología', icon: '💻' },
  { id: 'gadgets', name: 'Gadgets', icon: '📱' },
];

export default function NoticiasPage() {
  const { isUpdating, isLoading, lastUpdate, showSuccess, currentNews, update } = useUpdate();
  const [newsPerCategory, setNewsPerCategory] = useState(3);
  const [efemerides, setEfemerides] = useState<Efemeride[]>([]);
  const [saints, setSaints] = useState<SaintDay[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['ia', 'actualidad']));
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    const stored = localStorage.getItem('2minuts-settings');
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        if (settings.offersPerCategory) {
          setNewsPerCategory(Number(settings.offersPerCategory));
        }
      } catch { /* use default */ }
    }
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

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <>
      <Header lastUpdate={lastUpdate} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-4 pb-24">
        {/* Update Button */}
        <section className="mb-5">
          <UpdateButton isUpdating={isUpdating} showSuccess={showSuccess} onUpdate={update} />
        </section>

        {/* Categories with collapsible news */}
        <section className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">📋 Briefing del día</h2>
          {isLoading ? (
            <p className="text-sm text-gray-500 animate-pulse">Cargando noticias en tiempo real...</p>
          ) : (
            <div className="grid gap-2">
              {CATEGORIES.map((category) => {
                const categoryNews = currentNews.filter((n) => n.categoryId === category.id).slice(0, newsPerCategory);
                const isExpanded = expandedCategories.has(category.id);
                return (
                  <div key={category.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{category.icon}</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{category.name}</span>
                        {categoryNews.length > 0 && (
                          <span className="text-[10px] bg-blue-50 dark:bg-blue-900 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">{categoryNews.length}</span>
                        )}
                      </div>
                      <span className={`text-gray-400 text-sm transition-transform ${isExpanded ? 'rotate-90' : ''}`}>›</span>
                    </button>
                    {isExpanded && categoryNews.length > 0 && (
                      <div className="border-t border-gray-50 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700">
                        {categoryNews.map((news) => (
                          <div
                            key={news.id}
                            className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <span className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                            <Link href={`/news/${news.id}`} className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">{news.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-blue-600">{news.source}</span>
                                <span className="text-[10px] text-gray-400">{news.date}</span>
                              </div>
                            </Link>
                            <button
                              onClick={(e) => toggleFavorite(e, news.id)}
                              className="text-sm shrink-0 mt-0.5 active:scale-90 transition-transform"
                              aria-label={favorites.has(news.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                            >
                              {favorites.has(news.id) ? '⭐' : '☆'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Efemérides */}
        <section className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">📅 Efemérides del {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</h2>
          <div className="grid gap-2">
            {efemerides.length > 0 ? efemerides.slice(0, newsPerCategory).map((efem) => (
              <div key={efem.id} className="bg-white dark:bg-gray-800 rounded-xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900 px-1.5 py-0.5 rounded">{efem.year}</span>
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100">{efem.event}</h3>
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
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">✝️ Santoral</h2>
          <div className="grid gap-2">
            {saints.length > 0 ? saints.map((day, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">{day.label}</p>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{day.saint.name}</h3>
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
