'use server';

import { db } from '@/lib/db';
import { discounts, customers, orders, giftCards, productCategories } from '@/lib/db/schema';
import { eq, and, gt, inArray } from 'drizzle-orm';

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

// סוג כללי לקופון שמופעל (gift_product או קופון רגיל)
type ActivatedCoupon = {
  id: string;
  code: string;
  title: string | null;
  type: DiscountType;
  value: number;
  minimumAmount?: number | null;
  minimumQuantity?: number | null;
  stackable: boolean;
  appliesTo: 'all' | 'category' | 'product' | 'member';
  productIds: string[];
  categoryIds: string[];
  excludeProductIds: string[];
  excludeCategoryIds: string[];
  giftProductIds?: string[];
  buyQuantity?: number | null;
  payAmount?: number | null;
  getQuantity?: number | null;
  getDiscountPercent?: number | null;
  giftSameProduct?: boolean;
  quantityTiers?: Array<{ minQuantity: number; discountPercent: number }>;
  spendAmount?: number | null;
  triggeredByCode: string;
};

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
    // קופונים שהקופון הזה מפעיל
    activatesCouponCodes?: string[];
  };
  // קופוני מתנה שמופעלים על ידי הקופון הזה (legacy - gift_product)
  triggeredGiftCoupons?: ActivatedCoupon[];
  // קופונים שהקופון הזה מפעיל (combo coupon - כל סוגי הקופונים)
  activatedCoupons?: ActivatedCoupon[];
} | {
  success: false;
  error: string;
};

export async function validateCoupon(
  storeId: string,
  code: string, 
  cartTotal: number, 
  email?: string,
  cartItems?: Array<{ productId: string; quantity: number }>
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
          title: `גיפט קארד (יתרה: ₪${balance.toFixed(2)})`,
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
      error: `קופון זה תקף להזמנות מעל ₪${Number(discount.minimumAmount).toFixed(2)}` 
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
    // שליפת קטגוריות המוצרים מה-DB (לפי productIds)
    const productIds = [...new Set(cartItems.map(i => i.productId))];
    const productCategoriesData = productIds.length > 0 
      ? await db
          .select({ productId: productCategories.productId, categoryId: productCategories.categoryId })
          .from(productCategories)
          .where(inArray(productCategories.productId, productIds))
      : [];
    
    // בניית מפה: productId -> categoryIds[]
    const productCategoryMap = new Map<string, string[]>();
    for (const pc of productCategoriesData) {
      if (!productCategoryMap.has(pc.productId)) {
        productCategoryMap.set(pc.productId, []);
      }
      productCategoryMap.get(pc.productId)!.push(pc.categoryId);
    }

    // פונקציה עזר לבדיקת התאמת פריט להנחה
    const doesItemMatch = (item: { productId: string }) => {
      const itemCategoryIds = productCategoryMap.get(item.productId) || [];
      
      // בדיקת החרגות
      const excludeProductIds = (discount.excludeProductIds as string[]) || [];
      const excludeCategoryIds = (discount.excludeCategoryIds as string[]) || [];
      
      if (excludeProductIds.includes(item.productId)) return false;
      if (itemCategoryIds.some(catId => excludeCategoryIds.includes(catId))) return false;
      
      // בדיקת התאמה
      const appliesTo = discount.appliesTo || 'all';
      if (appliesTo === 'all') return true;
      if (appliesTo === 'product') {
        const discountProductIds = (discount.productIds as string[]) || [];
        return discountProductIds.includes(item.productId);
      }
      if (appliesTo === 'category') {
        const discountCategoryIds = (discount.categoryIds as string[]) || [];
        return itemCategoryIds.some(catId => discountCategoryIds.includes(catId));
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
            error: `קופון זה תקף להזמנות מעל ₪${Number(discount.spendAmount).toFixed(2)}` 
          };
        }
        break;
    }
  }

  // מציאת קופוני מתנה שמופעלים על ידי הקופון הזה (trigger - הכיוון ההפוך)
  const triggeredGiftCoupons = await db
    .select()
    .from(discounts)
    .where(and(
      eq(discounts.storeId, storeId),
      eq(discounts.isActive, true),
      eq(discounts.type, 'gift_product')
    ));

  // סינון קופונים שיש להם triggerCouponCodes שכולל את הקוד הנוכחי
  const triggeredCoupons: ActivatedCoupon[] = triggeredGiftCoupons.filter(gc => {
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
    appliesTo: (gc.appliesTo ?? 'all') as 'all' | 'category' | 'product' | 'member',
    productIds: (gc.productIds as string[]) || [],
    categoryIds: (gc.categoryIds as string[]) || [],
    excludeProductIds: (gc.excludeProductIds as string[]) || [],
    excludeCategoryIds: (gc.excludeCategoryIds as string[]) || [],
    triggeredByCode: normalizedCode,
  }));

  // מציאת קופונים שהקופון הנוכחי מפעיל (activates - הכיוון הישיר)
  const activatesCodes = (discount.activatesCouponCodes as string[]) || [];
  let activatedCoupons: ActivatedCoupon[] = [];
  
  if (activatesCodes.length > 0) {
    // שליפת כל הקופונים שבמערך activatesCouponCodes
    const allCoupons = await db
      .select()
      .from(discounts)
      .where(and(
        eq(discounts.storeId, storeId),
        eq(discounts.isActive, true)
      ));
    
    // סינון הקופונים לפי הקודים ברשימה
    activatedCoupons = allCoupons
      .filter(c => activatesCodes.some(code => code.toUpperCase().trim() === c.code.toUpperCase()))
      .map(c => ({
        id: c.id,
        code: c.code,
        title: c.title,
        type: c.type as DiscountType,
        value: Number(c.value),
        minimumAmount: c.minimumAmount ? Number(c.minimumAmount) : null,
        minimumQuantity: c.minimumQuantity || null,
        stackable: c.stackable ?? true,
        appliesTo: (c.appliesTo ?? 'all') as 'all' | 'category' | 'product' | 'member',
        productIds: (c.productIds as string[]) || [],
        categoryIds: (c.categoryIds as string[]) || [],
        excludeProductIds: (c.excludeProductIds as string[]) || [],
        excludeCategoryIds: (c.excludeCategoryIds as string[]) || [],
        giftProductIds: (c.giftProductIds as string[]) || [],
        buyQuantity: c.buyQuantity || null,
        payAmount: c.payAmount ? Number(c.payAmount) : null,
        getQuantity: c.getQuantity || null,
        getDiscountPercent: c.getDiscountPercent || null,
        giftSameProduct: c.giftSameProduct ?? true,
        quantityTiers: (c.quantityTiers as Array<{ minQuantity: number; discountPercent: number }>) || [],
        spendAmount: c.spendAmount ? Number(c.spendAmount) : null,
        triggeredByCode: normalizedCode,
      }));
  }

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
      // קופונים שהקופון מפעיל
      activatesCouponCodes: (discount.activatesCouponCodes as string[]) || [],
    },
    // קופוני מתנה שמופעלים (legacy - gift_product עם triggerCouponCodes)
    triggeredGiftCoupons: triggeredCoupons.length > 0 ? triggeredCoupons : undefined,
    // קופונים שהקופון הזה מפעיל (combo coupon)
    activatedCoupons: activatedCoupons.length > 0 ? activatedCoupons : undefined,
  };
}
