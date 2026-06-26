import Link from 'next/link';
import { News } from '@/types';

export default function NewsCard({ news }: { news: News }) {
  return (
    <article className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <h3 className="text-sm font-semibold text-gray-900 leading-snug">
        {news.title}
      </h3>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-xs text-blue-600 font-medium">{news.source}</span>
        <span className="text-xs text-gray-400">•</span>
        <span className="text-xs text-gray-400">{news.date}</span>
      </div>
      <p className="text-xs text-gray-600 mt-2 leading-relaxed">{news.summary}</p>
      <Link
        href={`/news/${news.id}`}
        className="inline-block mt-3 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
      >
        Leer más →
      </Link>
    </article>
  );
}
