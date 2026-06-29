/**
 * Security Logging Module
 * Centralized, secure logging - never logs sensitive data
 */

type LogLevel = 'info' | 'warn' | 'error' | 'security';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

// Fields that must NEVER be logged
const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'cookie',
  'session',
  'jwt',
  'credit_card',
  'ssn',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'JWT_SECRET',
  'NEXTAUTH_SECRET',
  'SMTP_PASSWORD',
  'DATABASE_URL',
]);

/**
 * Redact sensitive fields from log context
 */
function redactSensitive(obj: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key) || SENSITIVE_FIELDS.has(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      redacted[key] = redactSensitive(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

function formatLog(entry: LogEntry): string {
  const ctx = entry.context ? ` ${JSON.stringify(redactSensitive(entry.context))}` : '';
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${ctx}`;
}

/**
 * Logger instance - all logs go through here
 */
export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = { timestamp: new Date().toISOString(), level: 'info', message, context };
    console.log(formatLog(entry));
  },

  warn(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = { timestamp: new Date().toISOString(), level: 'warn', message, context };
    console.warn(formatLog(entry));
  },

  error(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = { timestamp: new Date().toISOString(), level: 'error', message, context };
    console.error(formatLog(entry));
  },

  security(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = { timestamp: new Date().toISOString(), level: 'security', message, context };
    console.error(formatLog(entry));
  },
};

/**
 * Log API request (without sensitive data)
 */
export function logRequest(request: Request, status: number, duration: number) {
  const url = new URL(request.url);
  logger.info('API Request', {
    method: request.method,
    path: url.pathname,
    status,
    duration: `${duration}ms`,
    userAgent: request.headers.get('user-agent')?.slice(0, 100) || 'unknown',
  });
}

/**
 * Log security event
 */
export function logSecurityEvent(event: string, request: Request, details?: Record<string, unknown>) {
  const url = new URL(request.url);
  logger.security(event, {
    path: url.pathname,
    method: request.method,
    ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
    ...details,
  });
}
