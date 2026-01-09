'use server';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, stores, productImages } from '@/lib/db/schema';
import { eq, and, ilike, or } from 'drizzle-orm';

// ============================================
// Product Search API for Editor
// Fast, lightweight search for product picker
// ============================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  if (!query || query.length < 2) {
    return NextResponse.json({ products: [] });
  }

  try {
    // Get store by slug
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ products: [] });
    }

    // Search products by name or SKU
    const searchPattern = `%${query}%`;
    
    const foundProducts = await db
      .select({
        id: products.id,
        name: products.name,
      })
      .from(products)
      .where(
        and(
          eq(products.storeId, store.id),
          eq(products.isActive, true),
          or(
            ilike(products.name, searchPattern),
            ilike(products.sku, searchPattern)
          )
        )
      )
      .limit(limit);

    // Get primary images for found products
    const productIds = foundProducts.map(p => p.id);
    
    const images = productIds.length > 0 
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
          })
          .from(productImages)
          .where(
            and(
              eq(productImages.isPrimary, true),
              // Use in_ when available or manual filter
            )
          )
      : [];

    // Create a map of product ID to image URL
    const imageMap = new Map<string, string>();
    images.forEach(img => {
      if (productIds.includes(img.productId)) {
        imageMap.set(img.productId, img.url);
      }
    });

    // Format response
    const result = foundProducts.map(p => ({
      id: p.id,
      name: p.name,
      imageUrl: imageMap.get(p.id) || null,
    }));

    return NextResponse.json({ products: result });
  } catch (error) {
    console.error('Product search error:', error);
    return NextResponse.json({ products: [] });
  }
}

