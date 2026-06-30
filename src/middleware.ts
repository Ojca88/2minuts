/**
 * Middleware de seguridad - Aplica headers de seguridad (CSP, HSTS, etc.)
 * a todas las respuestas de la aplicación.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Security headers applied to all responses
const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '),
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

// Allowed origins (CORS)
const ALLOWED_ORIGINS_DEV = ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'];

function getAllowedOrigins(): string[] {
  if (process.env.NODE_ENV === 'production') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    return appUrl ? [appUrl] : [];
  }
  return ALLOWED_ORIGINS_DEV;
}

// Allowed HTTP methods for API routes
const ALLOWED_API_METHODS = new Set(['GET', 'POST', 'OPTIONS']);

// Basic bot detection patterns
const SUSPICIOUS_UA_PATTERNS = [
  /sqlmap/i, /nikto/i, /nmap/i, /masscan/i,
  /havij/i, /acunetix/i, /nessus/i,
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const origin = request.headers.get('origin');
  const userAgent = request.headers.get('user-agent') || '';

  // --- Bot detection ---
  if (SUSPICIOUS_UA_PATTERNS.some((p) => p.test(userAgent))) {
    console.error(`[SECURITY] Blocked suspicious bot: ${userAgent.slice(0, 80)}`);
    return new NextResponse('Forbidden', { status: 403 });
  }

  // --- Method restriction for APIs ---
  if (pathname.startsWith('/api/') && !ALLOWED_API_METHODS.has(method)) {
    console.error(`[SECURITY] Blocked method: ${method} on ${pathname}`);
    return new NextResponse('Method Not Allowed', { status: 405 });
  }

  // --- CORS: preflight ---
  if (method === 'OPTIONS' && pathname.startsWith('/api/')) {
    const allowedOrigins = getAllowedOrigins();
    const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : '';
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // --- CORS: origin check for API POST requests ---
  if (pathname.startsWith('/api/') && method === 'POST' && origin) {
    const allowedOrigins = getAllowedOrigins();
    if (!allowedOrigins.includes(origin)) {
      console.error(`[SECURITY] CORS blocked: ${origin} on ${pathname}`);
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // --- Apply security headers to response ---
  const response = NextResponse.next();

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // Remove leaky headers
  response.headers.delete('X-Powered-By');

  // CORS headers for allowed origins
  if (origin && pathname.startsWith('/api/')) {
    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Vary', 'Origin');
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)',
  ],
};
