import Link from 'next/link';
import { Category } from '@/types';

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/categories?id=${category.id}`}>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all cursor-pointer active:scale-[0.98]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{category.icon}</span>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{category.name}</h3>
              <p className="text-xs text-gray-500">{category.newsCount} noticias</p>
            </div>
          </div>
          <span className="text-gray-400 text-sm">›</span>
        </div>
      </div>
    </Link>
  );
}