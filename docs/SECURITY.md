# Security Architecture - 2Minuts

## Overview

This document describes the security architecture implemented in 2Minuts following OWASP Top 10, ASVS, Security by Design, Zero Trust, and Defense in Depth principles.

## Module Structure

```
src/security/
├── index.ts          # Main export (barrel file)
├── auth/             # Authentication preparation (Auth.js)
├── cache/            # In-memory cache with TTL
├── cors/             # CORS protection
├── csrf/             # CSRF token protection
├── headers/          # Security HTTP headers
├── logging/          # Secure centralized logging
├── monitoring/       # Health checks & Sentry prep
├── permissions/      # Role-based authorization
├── rateLimit/        # Rate limiting (in-memory, Upstash-ready)
├── sanitizers/       # XSS/HTML/RSS/AI sanitization
├── ssrf/             # SSRF protection (URL allowlist)
├── validators/       # Zod input validation schemas
└── __tests__/        # Security test suite
```

## How to Add a New API Endpoint

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientId, rateLimitHeaders, RATE_LIMITS } from '@/security/rateLimit';
import { validateQuery, categoryQuerySchema } from '@/security/validators';
import { withCache } from '@/security/cache';
import { logger } from '@/security/logging';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Rate limiting
  const clientId = getClientId(request);
  const rateResult = checkRateLimit(`my-endpoint:${clientId}`, RATE_LIMITS.apiGeneral);
  if (!rateResult.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // 2. Input validation
  const param = request.nextUrl.searchParams.get('id');
  const validation = validateQuery(categoryQuerySchema, { id: param });
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // 3. Cache + business logic
  try {
    const data = await withCache('cache-key', () => fetchData(validation.data.id), 5 * 60 * 1000);
    return NextResponse.json(data, { headers: rateLimitHeaders(rateResult) });
  } catch (error) {
    logger.error('Endpoint failed', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
```

## How to Validate Input

```typescript
import { z } from 'zod';
import { validateQuery, validateBody } from '@/security/validators';

// Define schema
const mySchema = z.object({
  name: z.string().min(1).max(100),
  age: z.coerce.number().int().min(0).max(150),
});

// Use in route
const result = validateBody(mySchema, requestBody);
if (!result.success) {
  return NextResponse.json({ error: result.error }, { status: 400 });
}
// result.data is typed and validated
```

## How to Use the Logger

```typescript
import { logger } from '@/security/logging';

// Standard logging
logger.info('Operation completed', { userId: '123', items: 5 });
logger.warn('Unusual activity', { ip: '1.2.3.4' });
logger.error('Failed operation', { error: 'timeout' });

// Security events
logger.security('Unauthorized access attempt', { path: '/admin' });
```

**Never log:** passwords, tokens, API keys, cookies, session data.

## How to Protect Against SSRF

```typescript
import { secureFetch } from '@/security/ssrf';

// Only fetches from allowlisted domains
const response = await secureFetch('https://feeds.elpais.com/rss');

// Blocks private IPs, non-HTTP protocols, and unlisted domains
// Throws error for disallowed URLs
```

To add a new allowed domain, edit `src/security/ssrf/index.ts` → `ALLOWED_DOMAINS`.

## How to Add a New AI Provider

1. Add the API domain to `ALLOWED_DOMAINS` in `src/security/ssrf/index.ts`
2. Store the API key in `.env.local` (never in code)
3. Access via `process.env.YOUR_KEY` (server-side only)
4. Sanitize all AI responses with `sanitizeAiResponse()` before displaying
5. Validate response structure with Zod before processing
6. Implement rate limiting to prevent economic abuse

## Security Controls Summary

| Control | Implementation | Status |
|---------|---------------|--------|
| Security Headers | middleware.ts | ✅ |
| CORS | middleware.ts + cors module | ✅ |
| Input Validation | Zod schemas | ✅ |
| Output Sanitization | sanitizers module | ✅ |
| XSS Protection | sanitizers + no dangerouslySetInnerHTML | ✅ |
| SSRF Protection | URL allowlist + secureFetch | ✅ |
| Rate Limiting | In-memory (Upstash-ready) | ✅ |
| CSRF | Double-submit cookie | ✅ |
| Cache | In-memory with TTL | ✅ |
| Error Handling | ErrorBoundary + safe messages | ✅ |
| Logging | Centralized, redacted | ✅ |
| Auth Prep | Auth.js scaffolding | ✅ |
| Secret Management | .env.local only | ✅ |
| CI/CD Security | GitHub Actions | ✅ |
| Monitoring Prep | Health check + Sentry ready | ✅ |
