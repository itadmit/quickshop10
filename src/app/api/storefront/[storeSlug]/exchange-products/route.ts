'use server';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, stores, productImages, productVariants } from '@/lib/db/schema';
import { eq, and, ilike, or, inArray, sql, gt } from 'drizzle-orm';

/**
 * Exchange Products API for Storefront
 * Returns products that are in stock for exchange selection
 * 
 * GET /api/storefront/[storeSlug]/exchange-products?q=search&limit=20
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  const { storeSlug } = await params;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

  try {
    // Get store by slug
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.slug, storeSlug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ products: [] });
    }

    // Build search conditions
    const conditions = [
      eq(products.storeId, store.id),
      eq(products.isActive, true),
    ];

    // Add search filter if query provided
    if (query && query.length >= 2) {
      const searchPattern = `%${query}%`;
      conditions.push(
        or(
          ilike(products.name, searchPattern),
          ilike(products.sku, searchPattern)
        )!
      );
    }

    // Get products with inventory info
    // We need to check:
    // 1. Products without variants: trackInventory=false OR inventory>0 OR allowBackorder=true
    // 2. Products with variants: check variants have stock (handled separately)
    const foundProducts = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        hasVariants: products.hasVariants,
        trackInventory: products.trackInventory,
        inventory: products.inventory,
        allowBackorder: products.allowBackorder,
      })
      .from(products)
      .where(and(...conditions))
      .limit(limit * 2); // Fetch more to filter out of stock

    // Get product IDs to fetch images and variant info
    const productIds = foundProducts.map(p => p.id);
    
    if (productIds.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Get primary images
    const images = await db
      .select({
        productId: productImages.productId,
        url: productImages.url,
      })
      .from(productImages)
      .where(
        and(
          eq(productImages.isPrimary, true),
          inArray(productImages.productId, productIds)
        )
      );
    
    const imageMap = new Map<string, string>();
    images.forEach(img => {
      imageMap.set(img.productId, img.url);
    });

    // Get variant stock info for products with variants
    const productsWithVariants = foundProducts.filter(p => p.hasVariants);
    const variantProductIds = productsWithVariants.map(p => p.id);
    
    // Check which products with variants have at least one variant in stock
    let productsWithStock = new Set<string>();
    
    if (variantProductIds.length > 0) {
      const variantsWithStock = await db
        .select({
          productId: productVariants.productId,
          hasStock: sql<boolean>`bool_or(
            ${productVariants.allowBackorder} = true OR 
            ${productVariants.inventory} > 0
          )`.as('hasStock'),
        })
        .from(productVariants)
        .where(inArray(productVariants.productId, variantProductIds))
        .groupBy(productVariants.productId);
      
      variantsWithStock.forEach(v => {
        if (v.hasStock) {
          productsWithStock.add(v.productId);
        }
      });
    }

    // Filter products to only show in-stock ones
    const inStockProducts = foundProducts.filter(p => {
      if (p.hasVariants) {
        // For products with variants, check if any variant has stock
        return productsWithStock.has(p.id);
      } else {
        // For regular products
        if (!p.trackInventory || p.allowBackorder) {
          return true; // Not tracking or allows backorder
        }
        return (p.inventory ?? 0) > 0;
      }
    });

    // Format response
    const result = inStockProducts.slice(0, limit).map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price || '0',
      hasVariants: p.hasVariants,
      imageUrl: imageMap.get(p.id) || null,
    }));

    return NextResponse.json({ products: result });
  } catch (error) {
    console.error('Exchange products search error:', error);
    return NextResponse.json({ products: [] });
  }
}

