'use server';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, products, productOptions, productOptionValues, productVariants } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

// ============================================
// Product Variants API for Quick Add Modal
// Returns options and variants for a product
// ============================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; productId: string }> }
) {
  const { slug, productId } = await params;

  try {
    // Get store by slug
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ options: [], variants: [] });
    }

    // Verify product belongs to store and has variants
    const [product] = await db
      .select({ 
        id: products.id,
        hasVariants: products.hasVariants,
      })
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          eq(products.storeId, store.id)
        )
      )
      .limit(1);

    if (!product || !product.hasVariants) {
      return NextResponse.json({ options: [], variants: [] });
    }

    // Get options with values
    const options = await db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, productId))
      .orderBy(asc(productOptions.sortOrder));

    const optionsWithValues = await Promise.all(
      options.map(async (option) => {
        const values = await db
          .select()
          .from(productOptionValues)
          .where(eq(productOptionValues.optionId, option.id))
          .orderBy(asc(productOptionValues.sortOrder));
        return { 
          id: option.id,
          name: option.name,
          displayType: option.displayType,
          values: values.map(v => ({
            id: v.id,
            value: v.value,
            metadata: v.metadata,
          })),
        };
      })
    );

    // Get active variants
    const variants = await db
      .select({
        id: productVariants.id,
        title: productVariants.title,
        price: productVariants.price,
        comparePrice: productVariants.comparePrice,
        inventory: productVariants.inventory,
        sku: productVariants.sku,
        option1: productVariants.option1,
        option2: productVariants.option2,
        option3: productVariants.option3,
      })
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, productId),
          eq(productVariants.isActive, true)
        )
      )
      .orderBy(asc(productVariants.sortOrder));

    return NextResponse.json({ 
      options: optionsWithValues, 
      variants,
    });
  } catch (error) {
    console.error('Get variants error:', error);
    return NextResponse.json({ options: [], variants: [] });
  }
}

