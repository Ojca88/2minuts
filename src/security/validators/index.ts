/**
 * Input Validation Module using Zod
 * All inputs must be validated before processing
 */

import { z } from 'zod';

// -- Query Parameter Schemas --

export const categoryQuerySchema = z.object({
  id: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_-]+$/i, 'Invalid category ID format'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export const timestampQuerySchema = z.object({
  t: z.coerce.number().optional(),
});

// -- Settings Schema --

export const settingsSchema = z.object({
  language: z.enum(['es', 'en', 'fr', 'de', 'pt']).default('es'),
  updateFrequency: z.enum(['1h', '4h', '8h', '24h']).default('8h'),
  email: z.string().email().or(z.literal('')).default(''),
  theme: z.enum(['light', 'dark']).default('light'),
  offersPerCategory: z.coerce.number().int().min(1).max(20).default(6),
  interests: z.array(z.string().max(50)).max(30).optional().default([]),
});

// -- News ID Schema --

export const newsIdSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_-]+$/i, 'Invalid news ID format'),
});

// -- API Request Validation Helpers --

export function validateQuery<T>(
  schema: z.ZodType<T>,
  params: Record<string, string | null>
): { success: true; data: T } | { success: false; error: string } {
  const cleanParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== null) cleanParams[key] = value;
  }

  const result = schema.safeParse(cleanParams);
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || 'Invalid input' };
  }
  return { success: true, data: result.data };
}

export function validateBody<T>(
  schema: z.ZodType<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || 'Invalid input' };
  }
  return { success: true, data: result.data };
}

// -- Sanitized string types --

export const safeStringSchema = z
  .string()
  .max(1000)
  .transform((s) => s.replace(/[<>]/g, ''));

export const urlSchema = z
  .string()
  .url()
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: 'Only HTTP/HTTPS URLs are allowed' }
  );
