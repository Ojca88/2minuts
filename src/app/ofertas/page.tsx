'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import UpdateButton from '@/components/UpdateButton';
import { Offer } from '@/services/offersService';

interface OffersByCategory {
  [key: string]: Offer[];
}

const CATEGORY_INFO: Record<string, { name: string; icon: string }> = {
  superofertas: { name: 'Superofertas', icon: '🔥' },
  ropa_nike: { name: 'Ropa Nike', icon: '👟' },
  ropa_adidas: { name: 'Ropa Adidas', icon: '👕' },
  tecnologia: { name: 'Tecnología', icon: '💻' },
  moviles: { name: 'Móviles', icon: '📱' },
  gaming: { name: 'Gaming', icon: '🎮' },
  hogar: { name: 'Hogar & Smart', icon: '🏠' },
};

export default function OfertasPage() {
  const [offers, setOffers] = useState<OffersByCategory>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [offersPerCategory, setOffersPerCategory] = useState(6);

  useEffect(() => {
    const stored = localStorage.getItem('2minuts-settings');
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        if (settings.offersPerCategory) {
          setOffersPerCategory(Number(settings.offersPerCategory));
        }
      } catch { /* use default */ }
    }
  }, []);

  const fetchOffers = useCallback(async () => {
    const res = await fetch('/api/offers?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setOffers(data);
      setLastUpdate(new Date().toLocaleString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }));
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchOffers().finally(() => setIsLoading(false));
  }, [fetchOffers]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setShowSuccess(false);
    try {
      await fetchOffers();
    } finally {
      setIsUpdating(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <>
      <Header lastUpdate={lastUpdate} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-4 pb-24">
        {/* Update Button */}
        <section className="mb-6">
          <UpdateButton
            isUpdating={isUpdating}
            showSuccess={showSuccess}
            onUpdate={handleUpdate}
          />
        </section>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🛍️</span>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Ofertas del Día</h1>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
          Ofertas verificadas de fuentes reales. Pulsa para acceder directamente a la oferta.
        </p>

        {isLoading ? (
          <p className="text-sm text-gray-500 animate-pulse">Buscando ofertas en tiempo real...</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(CATEGORY_INFO).map(([key, info]) => {
              const categoryOffers = (offers[key] || []).slice(0, offersPerCategory);
              // Hide empty categories entirely
              if (categoryOffers.length === 0) return null;
              return (
                <section key={key}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{info.icon}</span>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{info.name}</h2>
                    <span className="text-xs text-gray-400">({categoryOffers.length})</span>
                  </div>

                  <div className="grid gap-2">
                    {categoryOffers.map((offer) => (
                        <a
                          key={offer.id}
                          href={offer.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-orange-200 dark:hover:border-orange-600 transition-all block active:scale-[0.98]"
                        >
                          <div className="flex items-start gap-3">
                            {offer.image && (
                              <img
                                src={offer.image}
                                alt=""
                                className="w-14 h-14 object-contain rounded-lg bg-gray-50 dark:bg-gray-700 shrink-0"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 flex-1">
                                  {offer.title}
                                </h3>
                                {offer.price && (
                                  <span className="shrink-0 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-sm font-bold px-2.5 py-1 rounded-lg">
                                    {offer.price}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-xs font-medium text-orange-600">{offer.store}</span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-400">{offer.date}</span>
                              </div>
                              <span className="inline-block mt-2 text-[11px] text-orange-600 font-medium">
                                Ver oferta →
                              </span>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                </section>
              );
            })}
          </div>
        )}

        <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 mt-8">
          Fuentes: HardZone, ADSLZone, MuyComputer, ProfesionalReview, Chollos, DeporteOutlet — Actualización cada 15 min
        </p>
      </main>
    </>
  );
}
