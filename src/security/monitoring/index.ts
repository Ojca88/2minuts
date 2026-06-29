/**
 * Monitoring Preparation Module
 * Placeholder for Sentry, Vercel Analytics, and health checks
 */

/**
 * Health check data
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    rss: boolean;
    wikipedia: boolean;
    uptime: number;
  };
}

const startTime = Date.now();

/**
 * Get application health status
 */
export function getHealthStatus(): HealthStatus {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      rss: true,
      wikipedia: true,
      uptime: Math.floor((Date.now() - startTime) / 1000),
    },
  };
}

/**
 * Sentry integration placeholder
 * Initialize when DSN is configured via SENTRY_DSN env var
 */
export function initMonitoring() {
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    // TODO: Initialize Sentry SDK
    // Sentry.init({ dsn: sentryDsn, environment: process.env.NODE_ENV });
  }
}

/**
 * Report error to monitoring service
 */
export function reportError(error: Error, context?: Record<string, unknown>) {
  // In production, send to Sentry
  // For now, log securely
  console.error(`[MONITOR] ${error.message}`, context ? JSON.stringify(context) : '');
}
