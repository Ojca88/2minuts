/**
 * Permissions Module
 * Implements authorization checks and ownership verification
 */

import { UserSession } from '../auth';

/**
 * Check if user owns a resource
 */
export function isOwner(session: UserSession | null, resourceOwnerId: string): boolean {
  if (!session) return false;
  return session.userId === resourceOwnerId;
}

/**
 * Permission definitions
 */
export const PERMISSIONS = {
  briefing: {
    read: ['user', 'admin'],
    generate: ['user', 'admin'],
    delete: ['admin'],
  },
  settings: {
    read: ['user', 'admin'],
    update: ['user', 'admin'],
  },
  favorites: {
    read: ['user', 'admin'],
    manage: ['user', 'admin'],
  },
} as const;

type Resource = keyof typeof PERMISSIONS;
type Action<R extends Resource> = keyof (typeof PERMISSIONS)[R];

/**
 * Check if a session has permission for an action
 */
export function hasPermission<R extends Resource>(
  session: UserSession | null,
  resource: R,
  action: Action<R>
): boolean {
  if (!session) return false;
  const allowedRoles = PERMISSIONS[resource][action] as readonly string[];
  return allowedRoles.includes(session.role);
}
