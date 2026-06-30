'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import CategoryCard from '@/components/CategoryCard';
import NewsCard from '@/components/NewsCard';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { News, Category } from '@/types';

// Categorías disponibles en la app
const CATEGORIES: Category[] = [
  { id: 'ia', name: 'Inteligencia Artificial', icon: '🤖', newsCount: 0 },
  { id: 'actualidad', name: 'Actualidad', icon: '📰', newsCount: 0 },
  { id: 'internacional', name: 'Internacional', icon: '🌍', newsCount: 0 },
  { id: 'politica', name: 'Política', icon: '🏛️', newsCount: 0 },
  { id: 'deporte', name: 'Deporte', icon: '⚽', newsCount: 0 },
  { id: 'realmadrid', name: 'Real Madrid', icon: '⚪', newsCount: 0 },
  { id: 'tecnologia', name: 'Tecnología', icon: '💻', newsCount: 0 },
  { id: 'gadgets', name: 'Gadgets', icon: '📱', newsCount: 0 },
];

function CategoriesContent() {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');
  const [activeCategory, setActiveCategory] = useState<string | null>(selectedId);
  const [filteredNews, setFilteredNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeCategory) {
      setFilteredNews([]);
      return;
    }
    setLoading(true);
    fetch(`/api/news/category?id=${activeCategory}`)
      .then((res) => res.json())
      .then((data: News[]) => setFilteredNews(data))
      .catch(() => setFilteredNews([]))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  const activeCategoryData = CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-4 pb-24">
        <h1 className="text-lg font-bold text-gray-900 mb-4">Categorías</h1>

        {!activeCategory ? (
          <div className="grid gap-2">
            {CATEGORIES.map((category) => (
              <div key={category.id} onClick={() => setActiveCategory(category.id)}>
                <CategoryCard category={category} />
              </div>
            ))}
          </div>
        ) : (
          <>
            <button
              onClick={() => setActiveCategory(null)}
              className="flex items-center gap-1 text-sm text-blue-600 mb-4 hover:text-blue-800 transition-colors"
            >
              ← Volver a categorías
            </button>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{activeCategoryData?.icon}</span>
              <h2 className="text-base font-semibold text-gray-900">
                {activeCategoryData?.name}
              </h2>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500 animate-pulse">Cargando noticias...</p>
            ) : filteredNews.length > 0 ? (
              <div className="grid gap-3">
                {filteredNews.map((news) => (
                  <NewsCard key={news.id} news={news} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay noticias disponibles en esta categoría.</p>
            )}
          </>
        )}
      </main>
    </>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="p-4">Cargando...</div>}>
      <CategoriesContent />
    </Suspense>
  );
}
