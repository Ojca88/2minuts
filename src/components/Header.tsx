'use client';

import { formatDate } from '@/utils/formatDate';

export default function Header({ lastUpdate }: { lastUpdate?: string }) {
  const today = new Date();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            DailyBrief
          </h1>
          <p className="text-xs text-gray-500 capitalize">{formatDate(today)}</p>
        </div>
        {lastUpdate && (
          <span className="text-xs text-gray-400">
            Actualizado: {lastUpdate}
          </span>
        )}
      </div>
    </header>
  );
}
