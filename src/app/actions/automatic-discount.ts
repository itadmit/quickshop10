'use server';

import { db } from '@/lib/db';
import { automaticDiscounts, customers } from '@/lib/db/schema';
import { eq, and, or, lte, gte, isNull } from 'drizzle-orm';

// Types for automatic discounts (compatible with old discount-utils)
export type AutomaticDiscountResult = {
  id: string;
  name: string;
  description: string | null;
  type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_pay_y' | 'buy_x_get_y' | 'gift_product' | 'quantity_discount' | 'spend_x_pay_y';
  value: number;
  appliesTo: 'all' | 'category' | 'product' | 'member';
  categoryIds: string[];
  productIds: string[];
  excludeCategoryIds?: string[];
  excludeProductIds?: string[];
  stackable: boolean;
  minimumAmount?: number | null;
  buyQuantity?: number | null;
  payAmount?: number | null;
  getQuantity?: number | null;
  giftProductIds?: string[];
  giftSameProduct?: boolean;
  quantityTiers?: Array<{ minQuantity: number; discountPercent: number }>;
  spendAmount?: number | null;
};

export type CartItemForDiscount = {
  productId: string;
  categoryId?: string;
  price: number;
  quantity: number;
};

export async function getAutomaticDiscounts(
  storeId: string,
  cartItems: CartItemForDiscount[],
  cartTotal: number,
  email?: string
): Promise<AutomaticDiscountResult[]> {
  if (!storeId) return [];

  const now = new Date();
  
  // Get all active automatic discounts
  const discounts = await db
    .select()
    .from(automaticDiscounts)
    .where(and(
      eq(automaticDiscounts.storeId, storeId),
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

    // פונקציה עזר לבדיקת התאמת פריט להנחה
    const doesItemMatch = (item: CartItemForDiscount) => {
      // בדיקת החרגות
      const excludeProductIds = (discount.excludeProductIds as string[]) || [];
      const excludeCategoryIds = (discount.excludeCategoryIds as string[]) || [];
      
      if (excludeProductIds.includes(item.productId)) return false;
      if (item.categoryId && excludeCategoryIds.includes(item.categoryId)) return false;
      
      // בדיקת התאמה
      const appliesTo = discount.appliesTo || 'all';
      if (appliesTo === 'all') return true;
      if (appliesTo === 'product') {
        const productIds = (discount.productIds as string[]) || [];
        return productIds.includes(item.productId);
      }
      if (appliesTo === 'category') {
        const categoryIds = (discount.categoryIds as string[]) || [];
        return item.categoryId ? categoryIds.includes(item.categoryId) : false;
      }
      return true;
    };

    const matchingItems = cartItems.filter(doesItemMatch);
    const totalMatchingQty = matchingItems.reduce((sum, item) => sum + item.quantity, 0);

    // בדיקת תנאים ספציפיים לפי סוג ההנחה
    switch (discount.type) {
      case 'buy_x_pay_y':
        if (!discount.buyQuantity || totalMatchingQty < discount.buyQuantity) {
          continue; // לא עומד בתנאי - דלג על הנחה זו
        }
        break;

      case 'buy_x_get_y':
        if (!discount.buyQuantity || totalMatchingQty < discount.buyQuantity) {
          continue; // לא עומד בתנאי - דלג על הנחה זו
        }
        break;

      case 'quantity_discount':
        const quantityTiers = (discount.quantityTiers as Array<{ minQuantity: number; discountPercent: number }>) || [];
        if (quantityTiers.length > 0) {
          const maxTier = quantityTiers.reduce((max, tier) => tier.minQuantity > max.minQuantity ? tier : max, quantityTiers[0]);
          if (totalMatchingQty < maxTier.minQuantity) {
            continue; // לא עומד בתנאי - דלג על הנחה זו
          }
        }
        break;

      case 'spend_x_pay_y':
        const matchingTotal = matchingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (discount.spendAmount && matchingTotal < Number(discount.spendAmount)) {
          continue; // לא עומד בתנאי - דלג על הנחה זו
        }
        break;
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
              eq(customers.storeId, storeId),
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
    excludeCategoryIds: (discount.excludeCategoryIds as string[]) || [],
    excludeProductIds: (discount.excludeProductIds as string[]) || [],
    stackable: discount.stackable,
    minimumAmount: discount.minimumAmount ? Number(discount.minimumAmount) : null,
    buyQuantity: discount.buyQuantity || null,
    payAmount: discount.payAmount ? Number(discount.payAmount) : null,
    getQuantity: discount.getQuantity || null,
    giftProductIds: (discount.giftProductIds as string[]) || [],
    giftSameProduct: discount.giftSameProduct ?? true,
    quantityTiers: (discount.quantityTiers as Array<{ minQuantity: number; discountPercent: number }>) || [],
    spendAmount: discount.spendAmount ? Number(discount.spendAmount) : null,
  };
}

