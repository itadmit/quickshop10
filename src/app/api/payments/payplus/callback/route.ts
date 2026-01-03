/**
 * PayPlus Callback - Redirect to Generic Handler
 * 
 * This route exists for backward compatibility.
 * All new integrations should use: /api/payments/callback?provider=payplus&store=slug
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Get store from query param
  const storeSlug = request.nextUrl.searchParams.get('store');
  
  // Build generic callback URL
  const genericUrl = new URL('/api/payments/callback', request.url);
  genericUrl.searchParams.set('provider', 'payplus');
  if (storeSlug) {
    genericUrl.searchParams.set('store', storeSlug);
  }
  
  console.log(`PayPlus callback: Forwarding to generic handler: ${genericUrl.pathname}${genericUrl.search}`);
  
  // Forward the request to the generic handler
  const response = await fetch(genericUrl.toString(), {
    method: 'POST',
    headers: request.headers,
    body: await request.text(),
  });
  
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    provider: 'payplus',
    note: 'Use /api/payments/callback?provider=payplus for new integrations',
  });
}
