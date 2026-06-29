/**
 * Cache Module
 * In-memory cache with TTL to prevent redundant external calls
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

// Default TTL: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Get cached data or execute fetcher
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key) as CacheEntry<T> | undefined;

  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  const data = await fetcher();
  cache.set(key, { data, expiresAt: now + ttlMs });
  return data;
}

/**
 * Invalidate a specific cache key
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

/**
 * Invalidate all cache entries matching a prefix
 */
export function invalidateCachePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear entire cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return { size: cache.size, keys: [...cache.keys()] };
}
