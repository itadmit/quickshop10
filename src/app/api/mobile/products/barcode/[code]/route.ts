/**
 * Mobile Barcode Search API
 * GET /api/mobile/products/barcode/[code]
 * 
 * Search product or variant by barcode (for barcode scanner)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productVariants, productImages } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { requireMobileAuthWithStore } from '@/lib/mobile-auth';

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireMobileAuthWithStore(request);
    const { code } = await params;
    
    if (!code || code.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Invalid barcode' },
        { status: 400 }
      );
    }
    
    // First, search in variants
    const [variant] = await db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        title: productVariants.title,
        sku: productVariants.sku,
        barcode: productVariants.barcode,
        price: productVariants.price,
        inventory: productVariants.inventory,
        imageUrl: productVariants.imageUrl,
      })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(and(
        eq(products.storeId, auth.store.id),
        or(
          eq(productVariants.barcode, code),
          eq(productVariants.sku, code)
        )
      ))
      .limit(1);
    
    if (variant) {
      // Get product info
      const [product] = await db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          hasVariants: products.hasVariants,
        })
        .from(products)
        .where(eq(products.id, variant.productId))
        .limit(1);
      
      // Get image if variant doesn't have one
      let imageUrl = variant.imageUrl;
      if (!imageUrl && product) {
        const [image] = await db
          .select({ url: productImages.url })
          .from(productImages)
          .where(eq(productImages.productId, product.id))
          .orderBy(productImages.sortOrder)
          .limit(1);
        imageUrl = image?.url || null;
      }
      
      return NextResponse.json({
        success: true,
        found: true,
        product: product ? {
          id: product.id,
          name: product.name,
          slug: product.slug,
          hasVariants: product.hasVariants,
          imageUrl,
        } : null,
        variant: {
          id: variant.id,
          title: variant.title,
          sku: variant.sku,
          barcode: variant.barcode,
          price: Number(variant.price),
          inventory: variant.inventory,
        },
      });
    }
    
    // Search in products
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        sku: products.sku,
        barcode: products.barcode,
        price: products.price,
        inventory: products.inventory,
        hasVariants: products.hasVariants,
      })
      .from(products)
      .where(and(
        eq(products.storeId, auth.store.id),
        or(
          eq(products.barcode, code),
          eq(products.sku, code)
        )
      ))
      .limit(1);
    
    if (product) {
      // Get image
      const [image] = await db
        .select({ url: productImages.url })
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(productImages.sortOrder)
        .limit(1);
      
      return NextResponse.json({
        success: true,
        found: true,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          barcode: product.barcode,
          price: product.price ? Number(product.price) : null,
          inventory: product.inventory,
          hasVariants: product.hasVariants,
          imageUrl: image?.url || null,
        },
        variant: null,
      });
    }
    
    // Not found
    return NextResponse.json({
      success: true,
      found: false,
      product: null,
      variant: null,
    });
    
  } catch (error) {
    console.error('Barcode search error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}

