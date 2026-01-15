/**
 * URL Validation Utilities
 * Prevents Open Redirect and SSRF attacks
 */

// Allowed domains for redirects (platform + production domains)
const ALLOWED_REDIRECT_DOMAINS = [
  'my-quickshop.com',
  'www.my-quickshop.com',
  'quickshop.co.il',
  'www.quickshop.co.il',
  'localhost:3000',
  'localhost',
];

// Blocked IP patterns for SSRF prevention
const BLOCKED_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,                    // 127.x.x.x (loopback)
  /^10\./,                     // 10.x.x.x (private)
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16-31.x.x (private)
  /^192\.168\./,               // 192.168.x.x (private)
  /^169\.254\./,               // 169.254.x.x (link-local / AWS metadata)
  /^0\./,                      // 0.x.x.x
  /^\[?::1\]?$/,               // IPv6 loopback
  /^\[?fe80:/i,                // IPv6 link-local
  /^\[?fc00:/i,                // IPv6 private
  /^\[?fd00:/i,                // IPv6 private
  /^metadata\.google/i,        // GCP metadata
  /^metadata\.azure/i,         // Azure metadata
];

/**
 * Validate a redirect URL to prevent Open Redirect attacks
 * 
 * @param url - The URL to validate
 * @param allowedDomains - Optional custom allowed domains (defaults to platform domains)
 * @returns true if URL is safe for redirect
 */
export function isValidRedirectUrl(
  url: string | null | undefined,
  allowedDomains: string[] = ALLOWED_REDIRECT_DOMAINS
): boolean {
  if (!url) return false;
  
  // Allow relative paths starting with / (but not //)
  if (url.startsWith('/') && !url.startsWith('//')) {
    // Block protocol-relative URLs that might slip through
    if (url.includes('://') || url.includes('%3A')) {
      return false;
    }
    return true;
  }
  
  try {
    const parsed = new URL(url);
    
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    
    // Check against allowed domains
    const host = parsed.host.toLowerCase();
    return allowedDomains.some(domain => {
      // Exact match
      if (host === domain.toLowerCase()) return true;
      // Subdomain match (e.g., store.my-quickshop.com)
      if (host.endsWith(`.${domain.toLowerCase()}`)) return true;
      return false;
    });
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Get a safe redirect URL, falling back to default if invalid
 * 
 * @param url - The URL to validate
 * @param defaultUrl - Fallback URL if validation fails
 * @param allowedDomains - Optional custom allowed domains
 * @returns Safe URL for redirect
 */
export function getSafeRedirectUrl(
  url: string | null | undefined,
  defaultUrl: string,
  allowedDomains?: string[]
): string {
  if (isValidRedirectUrl(url, allowedDomains)) {
    return url!;
  }
  return defaultUrl;
}

/**
 * Validate a URL for SSRF prevention (server-side fetching)
 * Blocks internal/private IP ranges and metadata endpoints
 * 
 * @param url - The URL to validate
 * @returns true if URL is safe for server-side fetching
 */
export function isValidExternalUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    
    const hostname = parsed.hostname.toLowerCase();
    
    // Check against blocked IP patterns
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return false;
      }
    }
    
    // Block numeric IPs that might be internal
    // (allow domain names only for external URLs)
    const ipv4Regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipv4Regex.test(hostname)) {
      // It's an IP address - block it for safety
      // (legitimate image URLs should use domain names)
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate image URL with additional checks
 * 
 * @param url - The image URL to validate
 * @returns true if URL is safe for image fetching
 */
export function isValidImageUrl(url: string): boolean {
  if (!isValidExternalUrl(url)) {
    return false;
  }
  
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    
    // Check for common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.bmp', '.ico'];
    const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));
    
    // Allow URLs without extension (many CDNs serve images without extensions)
    // but block obviously non-image paths
    const blockedPaths = ['/metadata', '/latest/meta-data', '/.env', '/config', '/admin'];
    const hasBlockedPath = blockedPaths.some(path => pathname.includes(path));
    
    if (hasBlockedPath) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

