'use server';

import { db } from '@/lib/db';
import { productWaitlist, products, productVariants } from '@/lib/db/schema';
import { eq, and, count, isNull } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

interface WaitlistSummary {
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string | null;
  variantTitle: string | null;
  count: number;
  isOutOfStock: boolean;
}

/**
 * Get waitlist summary for inventory page
 */
export async function getWaitlistSummary(storeId: string): Promise<WaitlistSummary[]> {
  try {
    // Get all pending waitlist entries grouped by product/variant
    const waitlistData = await db
      .select({
        productId: productWaitlist.productId,
        productName: products.name,
        productSlug: products.slug,
        productInventory: products.inventory,
        productHasVariants: products.hasVariants,
        variantId: productWaitlist.variantId,
        variantTitle: productVariants.title,
        variantInventory: productVariants.inventory,
        count: count(),
      })
      .from(productWaitlist)
      .leftJoin(products, eq(products.id, productWaitlist.productId))
      .leftJoin(productVariants, eq(productVariants.id, productWaitlist.variantId))
      .where(and(
        eq(productWaitlist.storeId, storeId),
        eq(productWaitlist.isNotified, false)
      ))
      .groupBy(
        productWaitlist.productId,
        products.name,
        products.slug,
        products.inventory,
        products.hasVariants,
        productWaitlist.variantId,
        productVariants.title,
        productVariants.inventory
      );

    // Transform and determine stock status
    const summary: WaitlistSummary[] = waitlistData.map(item => {
      let isOutOfStock = false;

      if (item.variantId) {
        // Variant - check variant inventory
        isOutOfStock = (item.variantInventory || 0) === 0;
      } else {
        // Simple product - check product inventory
        isOutOfStock = (item.productInventory || 0) === 0;
      }

      return {
        productId: item.productId,
        productName: item.productName || 'מוצר לא ידוע',
        productSlug: item.productSlug || '',
        variantId: item.variantId,
        variantTitle: item.variantTitle,
        count: item.count,
        isOutOfStock,
      };
    });

    // Sort: in-stock first (ready to notify), then by count descending
    return summary.sort((a, b) => {
      if (a.isOutOfStock !== b.isOutOfStock) {
        return a.isOutOfStock ? 1 : -1;
      }
      return b.count - a.count;
    });
  } catch (error) {
    console.error('Error getting waitlist summary:', error);
    return [];
  }
}

/**
 * Get waitlist statistics for dashboard
 */
export async function getWaitlistStats(storeId: string) {
  try {
    const [stats] = await db
      .select({
        totalWaiting: count(),
        uniqueProducts: sql<number>`COUNT(DISTINCT ${productWaitlist.productId})`,
      })
      .from(productWaitlist)
      .where(and(
        eq(productWaitlist.storeId, storeId),
        eq(productWaitlist.isNotified, false)
      ));

    return {
      totalWaiting: stats?.totalWaiting || 0,
      uniqueProducts: stats?.uniqueProducts || 0,
    };
  } catch (error) {
    console.error('Error getting waitlist stats:', error);
    return {
      totalWaiting: 0,
      uniqueProducts: 0,
    };
  }
}

