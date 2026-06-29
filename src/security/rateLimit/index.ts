/**
 * Rate Limiting Module
 * In-memory rate limiter for serverless environments
 * For production, replace with Upstash Redis
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (per instance - adequate for single-instance/dev, use Redis for prod)
const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Preset configurations
 */
export const RATE_LIMITS = {
  briefingUpdate: { maxRequests: 1, windowMs: 10 * 60 * 1000 } as RateLimitConfig, // 1 per 10 min
  login: { maxRequests: 5, windowMs: 60 * 1000 } as RateLimitConfig, // 5 per min
  apiPublic: { maxRequests: 100, windowMs: 60 * 60 * 1000 } as RateLimitConfig, // 100 per hour
  apiGeneral: { maxRequests: 30, windowMs: 60 * 1000 } as RateLimitConfig, // 30 per min
} as const;

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const key = `${identifier}`;
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Get client identifier from request (IP-based)
 */
export function getClientId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
  return ip;
}

/**
 * Rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed ? {} : { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) }),
  };
}
