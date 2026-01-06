'use server';

import { db } from '@/lib/db';
import { discounts, customers, orders, giftCards } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

type DiscountType = 
  | 'percentage' 
  | 'fixed_amount' 
  | 'free_shipping'
  | 'buy_x_pay_y'
  | 'buy_x_get_y'
  | 'gift_product'        // מוצר במתנה (עם תנאים, בחירת מוצר ספציפי)
  | 'quantity_discount'
  | 'spend_x_pay_y'
  | 'gift_card';

export type CouponResult = {
  success: true;
  coupon: {
    id: string;
    code: string;
    title: string | null;
    type: DiscountType;
    value: number;
    minimumAmount: number | null;
    stackable: boolean;
    isGiftCard?: boolean;
    giftCardBalance?: number;
    appliesTo?: 'all' | 'category' | 'product' | 'member';
    categoryIds?: string[];
    productIds?: string[];
    excludeCategoryIds?: string[];
    excludeProductIds?: string[];
    // שדות חדשים לסוגי הנחות מתקדמים
    buyQuantity?: number | null;
    payAmount?: number | null;
    getQuantity?: number | null;
    giftProductIds?: string[];
    giftSameProduct?: boolean;
    quantityTiers?: Array<{ minQuantity: number; discountPercent: number }>;
    spendAmount?: number | null;
    // שדות gift_product
    minimumQuantity?: number | null;
    triggerCouponCodes?: string[];
  };
  // קופוני מתנה שמופעלים על ידי הקופון הזה
  triggeredGiftCoupons?: Array<{
    id: string;
    code: string;
    title: string | null;
    type: 'gift_product';
    value: number;
    giftProductIds: string[];
    minimumAmount?: number | null;
    minimumQuantity?: number | null;
    stackable: boolean;
    appliesTo: 'all' | 'category' | 'product' | 'member';
    productIds: string[];
    categoryIds: string[];
    excludeProductIds: string[];
    triggeredByCode: string;
  }>;
} | {
  success: false;
  error: string;
};

export async function validateCoupon(
  storeId: string,
  code: string, 
  cartTotal: number, 
  email?: string,
  cartItems?: Array<{ productId: string; categoryId?: string; quantity: number }>
): Promise<CouponResult> {
  if (!storeId) {
    return { success: false, error: 'שגיאה בטעינת החנות' };
  }
  
  if (!code || code.trim() === '') {
    return { success: false, error: 'נא להזין קוד קופון' };
  }

  const normalizedCode = code.toUpperCase().trim();

  // Find the discount
  const [discount] = await db
    .select()
    .from(discounts)
    .where(and(
      eq(discounts.storeId, storeId),
      eq(discounts.code, normalizedCode),
      eq(discounts.isActive, true)
    ))
    .limit(1);

  // If not a coupon, check if it's a gift card
  if (!discount) {
    const [giftCard] = await db
      .select()
      .from(giftCards)
      .where(and(
        eq(giftCards.storeId, storeId),
        eq(giftCards.code, normalizedCode),
        eq(giftCards.status, 'active'),
        gt(giftCards.currentBalance, '0')
      ))
      .limit(1);

    if (giftCard) {
      // Check expiry
      if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
        return { success: false, error: 'גיפט קארד פג תוקף' };
      }

      const balance = Number(giftCard.currentBalance);
      
      return {
        success: true,
        coupon: {
          id: giftCard.id,
          code: giftCard.code,
          title: `גיפט קארד (יתרה: ₪${balance.toFixed(0)})`,
          type: 'gift_card',
          value: Math.min(balance, cartTotal), // Can't use more than cart total
          minimumAmount: null,
          stackable: true, // Gift cards can stack with coupons
          isGiftCard: true,
          giftCardBalance: balance,
        }
      };
    }

    return { success: false, error: 'קוד קופון לא תקין' };
  }

  // Check if coupon has usage limit and is exhausted
  if (discount.usageLimit && discount.usageCount && discount.usageCount >= discount.usageLimit) {
    return { success: false, error: 'קופון זה כבר אינו בתוקף' };
  }

  // Check start date
  if (discount.startsAt && new Date(discount.startsAt) > new Date()) {
    return { success: false, error: 'קופון זה עדיין לא פעיל' };
  }

  // Check end date
  if (discount.endsAt && new Date(discount.endsAt) < new Date()) {
    return { success: false, error: 'קופון זה פג תוקף' };
  }

  // Check minimum amount
  if (discount.minimumAmount && cartTotal < Number(discount.minimumAmount)) {
    return { 
      success: false, 
      error: `קופון זה תקף להזמנות מעל ₪${Number(discount.minimumAmount).toFixed(0)}` 
    };
  }

  // Check first order only restriction
  if (discount.firstOrderOnly && email) {
    // Check if customer exists and has previous orders
    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(and(
        eq(customers.storeId, storeId),
        eq(customers.email, email.toLowerCase())
      ))
      .limit(1);

    if (existingCustomer && existingCustomer.totalOrders && existingCustomer.totalOrders > 0) {
      return { success: false, error: 'קופון זה תקף להזמנה ראשונה בלבד' };
    }
  }

  // Check once per customer restriction
  if (discount.oncePerCustomer && email) {
    // Check if this customer already used this coupon
    const [usedOrder] = await db
      .select()
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(and(
        eq(orders.storeId, storeId),
        eq(customers.email, email.toLowerCase()),
        eq(orders.discountCode, discount.code)
      ))
      .limit(1);

    if (usedOrder) {
      return { success: false, error: 'כבר השתמשת בקופון זה' };
    }
  }

  // בדיקת תנאים ספציפיים לפי סוג ההנחה
  if (cartItems && cartItems.length > 0) {
    // פונקציה עזר לבדיקת התאמת פריט להנחה
    const doesItemMatch = (item: { productId: string; categoryId?: string }) => {
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

    // בדיקת תנאים לפי סוג ההנחה
    switch (discount.type) {
      case 'buy_x_pay_y':
        if (!discount.buyQuantity || totalMatchingQty < discount.buyQuantity) {
          return { 
            success: false, 
            error: `קופון זה תקף לקניית לפחות ${discount.buyQuantity} מוצרים מתאימים` 
          };
        }
        break;

      case 'buy_x_get_y':
        if (!discount.buyQuantity || totalMatchingQty < discount.buyQuantity) {
          return { 
            success: false, 
            error: `קופון זה תקף לקניית לפחות ${discount.buyQuantity} מוצרים מתאימים` 
          };
        }
        break;

      case 'quantity_discount':
        const quantityTiers = (discount.quantityTiers as Array<{ minQuantity: number; discountPercent: number }>) || [];
        if (quantityTiers.length > 0) {
          // מציאת המדרגה המינימלית (לא המקסימלית!) - כדי לבדוק אם הלקוח עומד בתנאי המינימום
          const minTier = quantityTiers.reduce((min, tier) => tier.minQuantity < min.minQuantity ? tier : min, quantityTiers[0]);
          if (totalMatchingQty < minTier.minQuantity) {
            return { 
              success: false, 
              error: `קופון זה תקף לקניית לפחות ${minTier.minQuantity} מוצרים מתאימים` 
            };
          }
        }
        break;

      case 'spend_x_pay_y':
        const matchingTotal = matchingItems.reduce((sum, item) => {
          // צריך לחשב את הסכום, אבל אין לנו מחיר כאן
          // נבדוק רק את הכמות
          return sum;
        }, 0);
        if (discount.spendAmount && cartTotal < Number(discount.spendAmount)) {
          return { 
            success: false, 
            error: `קופון זה תקף להזמנות מעל ₪${Number(discount.spendAmount).toFixed(0)}` 
          };
        }
        break;
    }
  }

  // מציאת קופוני מתנה שמופעלים על ידי הקופון הזה
  const triggeredGiftCoupons = await db
    .select()
    .from(discounts)
    .where(and(
      eq(discounts.storeId, storeId),
      eq(discounts.isActive, true),
      eq(discounts.type, 'gift_product')
    ));

  // סינון קופונים שיש להם triggerCouponCodes שכולל את הקוד הנוכחי
  const triggeredCoupons = triggeredGiftCoupons.filter(gc => {
    const triggerCodes = (gc.triggerCouponCodes as string[]) || [];
    return triggerCodes.some(tc => tc.toUpperCase().trim() === normalizedCode);
  }).map(gc => ({
    id: gc.id,
    code: gc.code,
    title: gc.title,
    type: 'gift_product' as const,
    value: Number(gc.value),
    giftProductIds: (gc.giftProductIds as string[]) || [],
    minimumAmount: gc.minimumAmount ? Number(gc.minimumAmount) : null,
    minimumQuantity: gc.minimumQuantity || null,
    stackable: gc.stackable ?? true,
    appliesTo: (gc.appliesTo ?? 'all') as 'all' | 'category' | 'product' | 'member', // חשוב! ברירת מחדל 'all' כדי שהתנאים יתקיימו
    productIds: (gc.productIds as string[]) || [],
    categoryIds: (gc.categoryIds as string[]) || [],
    excludeProductIds: (gc.excludeProductIds as string[]) || [],
    triggeredByCode: normalizedCode, // שמירת הקופון שהפעיל את המתנה
  }));

  return {
    success: true,
    coupon: {
      id: discount.id,
      code: discount.code,
      title: discount.title,
      type: discount.type,
      value: Number(discount.value),
      minimumAmount: discount.minimumAmount ? Number(discount.minimumAmount) : null,
      stackable: discount.stackable ?? true,
      appliesTo: discount.appliesTo ?? 'all',
      categoryIds: (discount.categoryIds as string[]) || [],
      productIds: (discount.productIds as string[]) || [],
      excludeCategoryIds: (discount.excludeCategoryIds as string[]) || [],
      excludeProductIds: (discount.excludeProductIds as string[]) || [],
      // שדות חדשים לסוגי הנחות מתקדמים
      buyQuantity: discount.buyQuantity || null,
      payAmount: discount.payAmount ? Number(discount.payAmount) : null,
      getQuantity: discount.getQuantity || null,
      giftProductIds: (discount.giftProductIds as string[]) || [],
      giftSameProduct: discount.giftSameProduct ?? true,
      quantityTiers: (discount.quantityTiers as Array<{ minQuantity: number; discountPercent: number }>) || [],
      spendAmount: discount.spendAmount ? Number(discount.spendAmount) : null,
      // שדות gift_product
      minimumQuantity: discount.minimumQuantity || null,
      triggerCouponCodes: (discount.triggerCouponCodes as string[]) || [],
    },
    // קופוני מתנה שמופעלים
    triggeredGiftCoupons: triggeredCoupons.length > 0 ? triggeredCoupons : undefined,
  };
}
