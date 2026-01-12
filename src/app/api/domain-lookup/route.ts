import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Edge Runtime for maximum speed
export const runtime = 'edge';

// Cache the SQL client
const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  // Verify internal request
  const secret = request.headers.get('x-middleware-secret');
  if (secret !== (process.env.MIDDLEWARE_SECRET || 'quickshop-internal')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const domain = request.nextUrl.searchParams.get('domain');
  
  if (!domain) {
    return NextResponse.json({ error: 'Domain required' }, { status: 400 });
  }

  try {
    // Direct SQL query - fastest possible
    const result = await sql`
      SELECT slug FROM stores 
      WHERE custom_domain = ${domain} 
      LIMIT 1
    `;

    if (result.length > 0) {
      return NextResponse.json(
        { slug: result[0].slug },
        {
          headers: {
            // Cache for 5 minutes at CDN edge
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      );
    }

    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  } catch (error) {
    console.error('Domain lookup error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}


