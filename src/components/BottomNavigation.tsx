'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Inicio', icon: '🏠' },
  { href: '/noticias', label: 'Noticias', icon: '📰' },
  { href: '/ofertas', label: 'Ofertas', icon: '🛍️' },
  { href: '/favoritos', label: 'Favoritos', icon: '⭐' },
  { href: '/settings', label: 'Ajustes', icon: '⚙️' },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
      <div className="max-w-4xl mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={`text-[10px] font-medium ${isActive ? 'text-blue-600' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
