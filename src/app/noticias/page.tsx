'use client';

import Link from 'next/link';
import { mockReport } from '@/data/mockReport';
import { mockEfemerides } from '@/data/mockEfemerides';
import { mockSaint } from '@/data/mockSaint';
import { useUpdate } from '@/hooks/useUpdate';

import Header from '@/components/Header';
import SummaryCard from '@/components/SummaryCard';
import NewsCard from '@/components/NewsCard';
import UpdateButton from '@/components/UpdateButton';

export default function NoticiasPage() {
  const { isUpdating, isLoading, lastUpdate, showSuccess, currentNews, update } = useUpdate();
  const displayUpdate = lastUpdate || mockReport.lastUpdate;

  return (
    <>
      <Header lastUpdate={displayUpdate} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-4 pb-24">
        {/* Update Button */}
        <section className="mb-6">
          <UpdateButton
            isUpdating={isUpdating}
            showSuccess={showSuccess}
            onUpdate={update}
          />
        </section>

        {/* Executive Summary */}
        <section className="mb-6">
          <SummaryCard summary={mockReport.executiveSummary} />
        </section>

        {/* Categories with news preview */}
        <section className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Categorías</h2>
          {isLoading ? (
            <p className="text-sm text-gray-500 animate-pulse">Cargando noticias en tiempo real...</p>
          ) : (
          <div className="grid gap-3">
            {mockReport.categories.map((category) => {
              const categoryNews = currentNews.filter((n) => n.categoryId === category.id);
              return (
                <div key={category.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                  <Link href={`/categories?id=${category.id}`} className="flex items-center justify-between mb-2 group">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors">{category.name}</h3>
                    </div>
                    <span className="text-gray-400 text-sm group-hover:text-blue-600 transition-colors">›</span>
                  </Link>
                  {categoryNews.length > 0 && (
                    <ul className="ml-10 space-y-1">
                      {categoryNews.map((news) => (
                        <li key={news.id}>
                          <Link
                            href={`/news/${news.id}`}
                            className="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors line-clamp-1"
                          >
                            • {news.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </section>

        {/* Efemérides */}
        <section className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">📅 Efemérides</h2>
          <div className="grid gap-3">
            {mockEfemerides.map((efem) => (
              <div key={efem.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900 px-2 py-0.5 rounded">{efem.year}</span>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{efem.event}</h3>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mt-1">{efem.description}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">Fuente: {efem.source}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Santo del Día */}
        <section className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">✝️ Santo del Día</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{mockSaint.name}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-2">{mockSaint.biography}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">{mockSaint.relevance}</p>
          </div>
        </section>

        {/* Últimas Noticias */}
        <section className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Últimas Noticias</h2>
          <div className="grid gap-3">
            {currentNews.slice(0, 5).map((news) => (
              <NewsCard key={news.id} news={news} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
