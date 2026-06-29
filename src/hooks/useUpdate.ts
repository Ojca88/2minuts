'use client';

import { useState, useCallback, useEffect } from 'react';
import { News } from '@/types';

export function useUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentNews, setCurrentNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNews = useCallback(async () => {
    try {
      const response = await fetch('/api/news?t=' + Date.now(), { cache: 'no-store' });
      if (response.ok) {
        const data: News[] = await response.json();
        setCurrentNews(data);
        const now = new Date();
        setLastUpdate(now.toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }));
      }
    } catch {
      // Silently fail - will show empty state
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchNews().finally(() => setIsLoading(false));
  }, [fetchNews]);

  const update = useCallback(async () => {
    setIsUpdating(true);
    setShowSuccess(false);

    try {
      await fetchNews();
    } finally {
      setIsUpdating(false);
      setShowSuccess(true);
      const now = new Date();
      setLastUpdate(now.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }));
      setTimeout(() => setShowSuccess(false), 3000);
    }
  }, [fetchNews]);

  return { isUpdating, isLoading, lastUpdate, showSuccess, currentNews, update };
}
