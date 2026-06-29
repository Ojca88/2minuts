/**
 * SSRF Protection Module
 * Implements URL allowlisting to prevent Server-Side Request Forgery
 */

const ALLOWED_DOMAINS = new Set([
  // RSS Sources
  'feeds.weblogssl.com',
  'feeds.elpais.com',
  'e00-elmundo.uecdn.es',
  'e00-marca.uecdn.es',
  'hardzone.es',
  'www.adslzone.net',
  'www.muycomputer.com',
  'www.profesionalreview.com',
  'www.technologyreview.es',
  'www.chollometro.com',
  // Brand stores (for offer links)
  'www.nike.com',
  'www.adidas.es',
  // Wikipedia (efemérides, santoral)
  'es.wikipedia.org',
  // AI Providers (future)
  'api.openai.com',
  'generativelanguage.googleapis.com',
  // News APIs
  'newsapi.org',
]);

const ALLOWED_DOMAIN_SUFFIXES = [
  '.wikipedia.org',
  '.elpais.com',
  '.uecdn.es',
  '.weblogssl.com',
];

/**
 * Check if a URL is in the allowlist
 */
export function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Only HTTP(S) allowed
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }

    // Block private/internal IPs
    if (isPrivateIp(url.hostname)) {
      return false;
    }

    // Check exact domain match
    if (ALLOWED_DOMAINS.has(url.hostname)) {
      return true;
    }

    // Check domain suffixes
    for (const suffix of ALLOWED_DOMAIN_SUFFIXES) {
      if (url.hostname.endsWith(suffix)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Block requests to private/internal IP ranges
 */
function isPrivateIp(hostname: string): boolean {
  // Block localhost variants
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0'
  ) {
    return true;
  }

  // Block private IP ranges
  const privateRanges = [
    /^10\.\d+\.\d+\.\d+$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    /^169\.254\.\d+\.\d+$/,
    /^fc00:/,
    /^fe80:/,
  ];

  return privateRanges.some((range) => range.test(hostname));
}

/**
 * Secure fetch wrapper that enforces SSRF protection
 */
export async function secureFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  if (!isAllowedUrl(url)) {
    throw new Error(`SSRF Protection: URL not in allowlist: ${new URL(url).hostname}`);
  }

  const secureOptions: RequestInit = {
    ...options,
    redirect: 'error', // Prevent open redirects
    signal: options?.signal || AbortSignal.timeout(15000), // 15s timeout
  };

  return fetch(url, secureOptions);
}
