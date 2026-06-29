/**
 * CORS Protection Module
 * Restricts cross-origin access to allowed origins only
 */

const ALLOWED_ORIGINS_DEV = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
];

// Add production domain when deployed
const ALLOWED_ORIGINS_PROD: string[] = [
  // e.g. 'https://2minuts.vercel.app', 'https://2minuts.com'
];

function getAllowedOrigins(): string[] {
  const env = process.env.NODE_ENV;
  if (env === 'production') {
    const customOrigin = process.env.NEXT_PUBLIC_APP_URL;
    return customOrigin
      ? [...ALLOWED_ORIGINS_PROD, customOrigin]
      : ALLOWED_ORIGINS_PROD;
  }
  return [...ALLOWED_ORIGINS_DEV, ...ALLOWED_ORIGINS_PROD];
}

/**
 * Check if an origin is allowed
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // Same-origin requests don't send origin
  return getAllowedOrigins().includes(origin);
}

/**
 * Get CORS headers for a request
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  const headers: Record<string, string> = {};

  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRF-Token';
    headers['Access-Control-Max-Age'] = '86400';
    headers['Vary'] = 'Origin';
  }

  return headers;
}

/**
 * Allowed HTTP methods per route type
 */
export const ALLOWED_METHODS = {
  api: new Set(['GET', 'POST', 'OPTIONS']),
  public: new Set(['GET', 'HEAD', 'OPTIONS']),
} as const;
