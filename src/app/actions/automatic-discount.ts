'use server';

import { db } from '@/lib/db';
import { automaticDiscounts, customers } from '@/lib/db/schema';
import { eq, and, or, lte, gte, isNull } from 'drizzle-orm';
import type { AutomaticDiscountResult, CartItemForDiscount } from '@/lib/discount-utils';

export async function getAutomaticDiscounts(
  cartItems: CartItemForDiscount[],
  cartTotal: number,
  email?: string
): Promise<AutomaticDiscountResult[]> {
  // Get the demo store
  const [store] = await db.query.stores.findMany({ limit: 1 });
  
  if (!store) return [];

  const now = new Date();
  
  // Get all active automatic discounts
  const discounts = await db
    .select()
    .from(automaticDiscounts)
    .where(and(
      eq(automaticDiscounts.storeId, store.id),
      eq(automaticDiscounts.isActive, true),
      or(
        isNull(automaticDiscounts.startsAt),
        lte(automaticDiscounts.startsAt, now)
      ),
      or(
        isNull(automaticDiscounts.endsAt),
        gte(automaticDiscounts.endsAt, now)
      )
    ))
    .orderBy(automaticDiscounts.priority);

  const applicableDiscounts: AutomaticDiscountResult[] = [];

  for (const discount of discounts) {
    // Check minimum amount condition
    if (discount.minimumAmount && cartTotal < Number(discount.minimumAmount)) {
      continue;
    }

    // Check minimum quantity condition
    if (discount.minimumQuantity) {
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQuantity < discount.minimumQuantity) {
        continue;
      }
    }

    // Check applies to condition
    switch (discount.appliesTo) {
      case 'all':
        // Applies to all products
        applicableDiscounts.push(formatDiscount(discount));
        break;

      case 'category':
        // Check if any cart item is in the discount categories
        const categoryIds = (discount.categoryIds as string[]) || [];
        const hasMatchingCategory = cartItems.some(
          item => item.categoryId && categoryIds.includes(item.categoryId)
        );
        if (hasMatchingCategory) {
          applicableDiscounts.push(formatDiscount(discount));
        }
        break;

      case 'product':
        // Check if any cart item is in the discount products
        const productIds = (discount.productIds as string[]) || [];
        const hasMatchingProduct = cartItems.some(
          item => productIds.includes(item.productId)
        );
        if (hasMatchingProduct) {
          applicableDiscounts.push(formatDiscount(discount));
        }
        break;

      case 'member':
        // Only for registered members
        if (email) {
          const [customer] = await db
            .select()
            .from(customers)
            .where(and(
              eq(customers.storeId, store.id),
              eq(customers.email, email.toLowerCase())
            ))
            .limit(1);

          // Customer exists and has a password (registered member)
          if (customer?.passwordHash) {
            applicableDiscounts.push(formatDiscount(discount));
          }
        }
        break;
    }
  }

  return applicableDiscounts;
}

function formatDiscount(discount: typeof automaticDiscounts.$inferSelect): AutomaticDiscountResult {
  return {
    id: discount.id,
    name: discount.name,
    description: discount.description,
    type: discount.type,
    value: Number(discount.value),
    appliesTo: discount.appliesTo,
    categoryIds: (discount.categoryIds as string[]) || [],
    productIds: (discount.productIds as string[]) || [],
    stackable: discount.stackable,
  };
}

