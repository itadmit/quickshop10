import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq, and, ilike, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim();
    const storeId = searchParams.get('storeId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 20);

    if (!query || query.length < 2 || !storeId) {
      return NextResponse.json({ products: [] });
    }

    const searchPattern = `%${query}%`;

    // Fast search with relations for first image
    const searchResults = await db.query.products.findMany({
      where: and(
        eq(products.storeId, storeId),
        eq(products.isActive, true),
        or(
          ilike(products.name, searchPattern),
          ilike(products.description, searchPattern),
          ilike(products.sku, searchPattern)
        )
      ),
      with: {
        images: {
          orderBy: (images, { asc }) => [asc(images.sortOrder)],
          limit: 1,
        },
      },
      limit,
    });

    const formattedResults = searchResults.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: p.images[0]?.url || null,
    }));

    return NextResponse.json({ products: formattedResults });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ products: [], error: 'Search failed' }, { status: 500 });
  }
}



