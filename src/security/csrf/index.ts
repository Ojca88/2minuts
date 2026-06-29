/**
 * CSRF Protection Module
 * Implements double-submit cookie pattern for state-changing operations
 */

import { cookies } from 'next/headers';

const CSRF_COOKIE = '2minuts-csrf';
const CSRF_HEADER = 'x-csrf-token';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Set CSRF token in cookie (call from server component or API route)
 */
export async function setCsrfCookie(): Promise<string> {
  const token = generateCsrfToken();
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 3600, // 1 hour
  });
  return token;
}

/**
 * Validate CSRF token from request
 */
export async function validateCsrf(request: Request): Promise<boolean> {
  const headerToken = request.headers.get(CSRF_HEADER);
  if (!headerToken) return false;

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  if (!cookieToken) return false;

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(headerToken, cookieToken);
}

/**
 * Constant-time string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
