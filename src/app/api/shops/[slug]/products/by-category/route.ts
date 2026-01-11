'use server';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, stores, productImages, productCategories } from '@/lib/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';

// ============================================
// Get Products by Category API for Editor Preview
// Fast, lightweight API for category product preview
// ============================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const limit = parseInt(searchParams.get('limit') || '12', 10);

  if (!categoryId) {
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

    // Get product IDs in this category
    const categoryProducts = await db
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(eq(productCategories.categoryId, categoryId));

    const productIds = categoryProducts.map(cp => cp.productId);

    if (productIds.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Get products
    const foundProducts = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        comparePrice: products.comparePrice,
      })
      .from(products)
      .where(
        and(
          eq(products.storeId, store.id),
          eq(products.isActive, true),
          inArray(products.id, productIds)
        )
      )
      .orderBy(desc(products.createdAt))
      .limit(limit);

    // Get primary images
    const foundProductIds = foundProducts.map(p => p.id);
    
    const images = foundProductIds.length > 0 
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
          })
          .from(productImages)
          .where(
            and(
              eq(productImages.isPrimary, true),
              inArray(productImages.productId, foundProductIds)
            )
          )
      : [];
    
    // Create image map
    const imageMap = new Map<string, string>();
    images.forEach(img => {
      imageMap.set(img.productId, img.url);
    });

    // Format response with full product data for live preview
    const result = foundProducts.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      comparePrice: p.comparePrice,
      imageUrl: imageMap.get(p.id) || null,
    }));

    return NextResponse.json({ products: result });
  } catch (error) {
    console.error('Get products by category error:', error);
    return NextResponse.json({ products: [] });
  }
}

