/**
 * Sanitization Module
 * Provides secure HTML/text sanitization for RSS, AI outputs, and user content
 */

// Server-safe text sanitizer (no DOM dependency)
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^>]*\/?>/gi,
  /<link\b[^>]*\/?>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /on\w+\s*=\s*[^\s>]+/gi,
  /data\s*:\s*text\/html/gi,
  /expression\s*\(/gi,
  /url\s*\(\s*["']?\s*javascript/gi,
  /<base\b[^>]*>/gi,
  /<meta\b[^>]*http-equiv/gi,
  /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
];

const DANGEROUS_ATTRIBUTES = [
  /\s*style\s*=\s*["'][^"']*expression[^"']*["']/gi,
  /\s*style\s*=\s*["'][^"']*javascript[^"']*["']/gi,
  /\s*href\s*=\s*["']\s*javascript[^"']*["']/gi,
  /\s*src\s*=\s*["']\s*javascript[^"']*["']/gi,
  /\s*action\s*=\s*["']\s*javascript[^"']*["']/gi,
];

/**
 * Strip all HTML tags - safe for server-side use
 */
export function stripHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .trim();
}

/**
 * Sanitize text content - removes dangerous patterns, scripts, event handlers
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let result = input;

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    result = result.replace(pattern, '');
  }

  // Remove dangerous attributes
  for (const pattern of DANGEROUS_ATTRIBUTES) {
    result = result.replace(pattern, '');
  }

  // Strip remaining HTML
  result = stripHtml(result);

  // Remove null bytes
  result = result.replace(/\0/g, '');

  return result.trim();
}

/**
 * Sanitize HTML content - allows safe tags only
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let result = input;

  // Remove dangerous patterns first
  for (const pattern of DANGEROUS_PATTERNS) {
    result = result.replace(pattern, '');
  }

  for (const pattern of DANGEROUS_ATTRIBUTES) {
    result = result.replace(pattern, '');
  }

  // Remove null bytes
  result = result.replace(/\0/g, '');

  return result.trim();
}

/**
 * Sanitize RSS feed content
 */
export function sanitizeRssContent(input: string): string {
  if (!input || typeof input !== 'string') return '';
  // Strip all HTML and dangerous content
  return sanitizeText(input).slice(0, 5000);
}

/**
 * Sanitize AI/LLM response content
 * Extra strict: removes any hidden instructions, HTML, scripts, metadata
 */
export function sanitizeAiResponse(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let result = input;

  // Remove potential hidden instruction patterns
  result = result.replace(/\[SYSTEM\][\s\S]*?\[\/SYSTEM\]/gi, '');
  result = result.replace(/\[INST\][\s\S]*?\[\/INST\]/gi, '');
  result = result.replace(/<<SYS>>[\s\S]*?<<\/SYS>>/gi, '');
  result = result.replace(/<!--[\s\S]*?-->/g, '');

  // Strip HTML and dangerous content
  result = sanitizeText(result);

  // Limit length
  return result.slice(0, 10000);
}

/**
 * Sanitize URL - only allow http/https protocols
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

/**
 * Escape HTML entities for safe display
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
