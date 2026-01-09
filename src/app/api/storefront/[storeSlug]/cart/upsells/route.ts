/**
 * GET /api/storefront/[storeSlug]/cart/upsells
 * 
 * Fetches upsell product recommendations based on cart items
 * 
 * ⚡ Performance (REQUIREMENTS.md compliant):
 * - Single batch query for products
 * - Batch images query (no N+1!)
 * - Efficient filtering and deduplication
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, products, productImages, productVariants, productOptions, productOptionValues } from '@/lib/db/schema';
import { eq, inArray, and, desc } from 'drizzle-orm';

interface UpsellProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  comparePrice: string | null;
  imageUrl: string | null;
  hasVariants: boolean;
  variants?: {
    id: string;
    title: string;
    price: string;
    inventory: number | null;
    isActive: boolean;
  }[];
  options?: {
    name: string;
    values: string[];
  }[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const { searchParams } = new URL(request.url);
    const productIds = searchParams.get('productIds')?.split(',').filter(Boolean) || [];

    if (productIds.length === 0) {
      return NextResponse.json({ upsells: [] });
    }

    // Get store
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
      columns: { id: true },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get all products in cart with their upsell IDs
    const cartProducts = await db
      .select({
        id: products.id,
        upsellProductIds: products.upsellProductIds,
      })
      .from(products)
      .where(and(
        eq(products.storeId, store.id),
        inArray(products.id, productIds)
      ));

    // Collect all unique upsell product IDs
    const allUpsellIds = new Set<string>();
    for (const product of cartProducts) {
      const upsellIds = (product.upsellProductIds as string[] | null) || [];
      for (const id of upsellIds) {
        // Don't include products that are already in the cart
        if (!productIds.includes(id)) {
          allUpsellIds.add(id);
        }
      }
    }

    if (allUpsellIds.size === 0) {
      return NextResponse.json({ upsells: [] });
    }

    // Fetch upsell products (limit to 5)
    const upsellProductIds = Array.from(allUpsellIds).slice(0, 5);
    
    const upsellProducts = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        comparePrice: products.comparePrice,
        hasVariants: products.hasVariants,
        isActive: products.isActive,
      })
      .from(products)
      .where(and(
        eq(products.storeId, store.id),
        eq(products.isActive, true),
        inArray(products.id, upsellProductIds)
      ));

    if (upsellProducts.length === 0) {
      return NextResponse.json({ upsells: [] });
    }

    // ⚡ BATCH: Get all images in ONE query
    const allImages = await db
      .select({
        productId: productImages.productId,
        url: productImages.url,
        isPrimary: productImages.isPrimary,
      })
      .from(productImages)
      .where(inArray(productImages.productId, upsellProducts.map(p => p.id)))
      .orderBy(desc(productImages.isPrimary));

    const imageMap = new Map<string, string>();
    for (const img of allImages) {
      if (!imageMap.has(img.productId)) {
        imageMap.set(img.productId, img.url);
      }
    }

    // Get variants for products with variants
    const productsWithVariants = upsellProducts.filter(p => p.hasVariants);
    let variantsMap = new Map<string, any[]>();
    let optionsMap = new Map<string, any[]>();

    if (productsWithVariants.length > 0) {
      const variantProductIds = productsWithVariants.map(p => p.id);
      
      // Fetch variants
      const variants = await db
        .select({
          id: productVariants.id,
          productId: productVariants.productId,
          title: productVariants.title,
          price: productVariants.price,
          inventory: productVariants.inventory,
          isActive: productVariants.isActive,
        })
        .from(productVariants)
        .where(and(
          inArray(productVariants.productId, variantProductIds),
          eq(productVariants.isActive, true)
        ))
        .orderBy(productVariants.sortOrder);

      for (const v of variants) {
        if (!variantsMap.has(v.productId)) {
          variantsMap.set(v.productId, []);
        }
        variantsMap.get(v.productId)!.push(v);
      }

      // Fetch options with values
      const options = await db
        .select({
          id: productOptions.id,
          productId: productOptions.productId,
          name: productOptions.name,
        })
        .from(productOptions)
        .where(inArray(productOptions.productId, variantProductIds))
        .orderBy(productOptions.sortOrder);

      if (options.length > 0) {
        const optionValues = await db
          .select({
            optionId: productOptionValues.optionId,
            value: productOptionValues.value,
          })
          .from(productOptionValues)
          .where(inArray(productOptionValues.optionId, options.map(o => o.id)))
          .orderBy(productOptionValues.sortOrder);

        const valuesMap = new Map<string, string[]>();
        for (const v of optionValues) {
          if (!valuesMap.has(v.optionId)) {
            valuesMap.set(v.optionId, []);
          }
          valuesMap.get(v.optionId)!.push(v.value);
        }

        for (const opt of options) {
          if (!optionsMap.has(opt.productId)) {
            optionsMap.set(opt.productId, []);
          }
          optionsMap.get(opt.productId)!.push({
            name: opt.name,
            values: valuesMap.get(opt.id) || [],
          });
        }
      }
    }

    // Build response
    const upsells: UpsellProduct[] = upsellProducts.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price || '0',
      comparePrice: p.comparePrice,
      imageUrl: imageMap.get(p.id) || null,
      hasVariants: p.hasVariants,
      variants: variantsMap.get(p.id),
      options: optionsMap.get(p.id),
    }));

    return NextResponse.json({ upsells });
  } catch (error) {
    console.error('Error fetching cart upsells:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

