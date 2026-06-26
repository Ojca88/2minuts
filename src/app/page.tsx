'use client';

import Link from 'next/link';
import Header from '@/components/Header';

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-8 pb-24 flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
          Buenos días
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10 text-center">
          ¿Qué quieres consultar hoy?
        </p>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          <Link
            href="/noticias"
            className="flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all active:scale-95"
          >
            <span className="text-4xl">📰</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Noticias</span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 text-center">Briefing ejecutivo diario</span>
          </Link>

          <Link
            href="/ofertas"
            className="flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-orange-200 dark:hover:border-orange-700 transition-all active:scale-95"
          >
            <span className="text-4xl">🛍️</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Shopping</span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 text-center">Ofertas y chollos del día</span>
          </Link>
        </div>
      </main>
    </>
  );
}