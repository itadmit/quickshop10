import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { neon } from '@neondatabase/serverless';

// ============================================
// MULTI-TENANT MIDDLEWARE
// Fast domain routing with Edge Runtime + Neon HTTP
// ============================================

// Known platform domains
const PLATFORM_DOMAINS = [
  'localhost',
  'localhost:3000',
  'my-quickshop.com',
  'www.my-quickshop.com',
  'quickshop.vercel.app',
];

// In-memory cache (persists across requests in same Edge instance)
// This provides ~0ms lookup for cached domains
const domainCache = new Map<string, { slug: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes - longer TTL for speed

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  // Check for preview mode (editor iframe)
  const isPreviewMode = request.nextUrl.searchParams.get('preview') === 'true';
  
  // Prepare headers for downstream
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  requestHeaders.set('x-hostname', hostname);
  
  // Pass preview mode to layout (for conditional client component loading)
  if (isPreviewMode) {
    requestHeaders.set('x-preview-mode', 'true');
  }

  // ========== FAST PATH: Skip static files ==========
  // Most requests are static - handle them first for speed
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  
  // API routes - always pass through without rewriting
  if (pathname.startsWith('/api/')) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ========== FAST PATH: Platform domains ==========
  const isPlatformDomain = PLATFORM_DOMAINS.some(domain => 
    hostname === domain || hostname.endsWith(`.${domain}`)
  );

  if (isPlatformDomain) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ========== CUSTOM DOMAIN ROUTING ==========
  const cleanHostname = hostname.replace(/^www\./, '');
  
  // Check in-memory cache first (fastest - ~0ms)
  const cached = domainCache.get(cleanHostname);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    // Cache hit - no logging needed for performance
    return rewriteToStore(request, cached.slug, cleanHostname, requestHeaders);
  }

  // Query Neon directly from Edge (fast - ~20-50ms with connection pooling)
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      SELECT slug FROM stores 
      WHERE custom_domain = ${cleanHostname} 
      LIMIT 1
    `;

    if (result.length > 0) {
      const slug = result[0].slug as string;
      
      // Cache for next requests
      domainCache.set(cleanHostname, { slug, timestamp: Date.now() });
      
      return rewriteToStore(request, slug, cleanHostname, requestHeaders);
    }
    // Domain not found - continue to default behavior (will show 404)
  } catch (error) {
    console.error('[Middleware] Domain lookup error:', cleanHostname, error);
    // On error, continue to default behavior
  }

  // Domain not found - could redirect to main site or show error
  // For now, continue normally (will show 404)
  return NextResponse.next({ request: { headers: requestHeaders } });
}

// Helper to rewrite request to store path
function rewriteToStore(
  request: NextRequest, 
  slug: string, 
  domain: string,
  headers: Headers
): NextResponse {
  const pathname = request.nextUrl.pathname;
  
  // ========== ADMIN REDIRECT ==========
  // Like Shopify: /admin on custom domain redirects to platform admin
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const adminPath = pathname === '/admin' ? '' : pathname.slice(6); // remove '/admin'
    const adminUrl = new URL(`https://my-quickshop.com/shops/${slug}/admin${adminPath}`);
    adminUrl.search = request.nextUrl.search;
    return NextResponse.redirect(adminUrl);
  }
  
  // ========== STOREFRONT REWRITE ==========
  const url = request.nextUrl.clone();
  url.pathname = `/shops/${slug}${pathname}`;
  
  headers.set('x-store-slug', slug);
  headers.set('x-custom-domain', domain);
  
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
