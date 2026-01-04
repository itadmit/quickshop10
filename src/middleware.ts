import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Known platform domains (add your production domain here)
const PLATFORM_DOMAINS = [
  'localhost',
  'localhost:3000',
  'my-quickshop.com',
  'www.my-quickshop.com',
  'quickshop.vercel.app',
];

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  // Add pathname to headers for Server Components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  requestHeaders.set('x-hostname', hostname);

  // Check if this is a custom domain (not a platform domain)
  const isCustomDomain = !PLATFORM_DOMAINS.some(domain => 
    hostname === domain || hostname.endsWith(`.${domain}`)
  );

  // If it's a custom domain and not already in /shops/ path, rewrite to the store
  if (isCustomDomain && !pathname.startsWith('/shops/') && !pathname.startsWith('/api/')) {
    // For custom domains, we need to look up the store
    // We'll pass the hostname to the page and let it handle the lookup
    requestHeaders.set('x-custom-domain', hostname);
    
    // Rewrite to a special custom-domain route that will look up the store
    const url = request.nextUrl.clone();
    url.pathname = `/api/custom-domain${pathname}`;
    url.searchParams.set('domain', hostname);
    url.searchParams.set('path', pathname);
    
    // For now, just pass through and let the app handle it
    // The actual rewrite logic will be in the API route
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
