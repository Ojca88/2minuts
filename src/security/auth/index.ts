/**
 * Authentication Preparation Module
 * Placeholder for Auth.js (NextAuth) integration
 * Supports: Google, GitHub, Apple
 */

// Auth configuration placeholder - implement when Auth.js is added
export interface AuthConfig {
  providers: ('google' | 'github' | 'apple')[];
  sessionStrategy: 'jwt';
  cookieOptions: {
    httpOnly: true;
    secure: boolean;
    sameSite: 'strict';
  };
}

export const authConfig: AuthConfig = {
  providers: ['google', 'github', 'apple'],
  sessionStrategy: 'jwt',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
};

/**
 * Session interface for future use
 */
export interface UserSession {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  expiresAt: number;
}

/**
 * Check if a request is authenticated (placeholder)
 * Returns null if not authenticated, session if valid
 */
export function getSession(): UserSession | null {
  // TODO: Implement with Auth.js
  // For now, app operates in unauthenticated mode
  return null;
}

/**
 * Guard: require authentication
 */
export function requireAuth(): UserSession {
  const session = getSession();
  if (!session) {
    throw new Error('Authentication required');
  }
  return session;
}

/**
 * Guard: require specific role
 */
export function requireRole(role: 'admin'): UserSession {
  const session = requireAuth();
  if (session.role !== role) {
    throw new Error('Insufficient permissions');
  }
  return session;
}
