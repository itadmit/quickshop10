'use server';

import { db } from '@/lib/db';
import { automaticDiscounts, contacts, productCategories } from '@/lib/db/schema';
import { eq, and, or, lte, gte, isNull, inArray } from 'drizzle-orm';

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

  // 🚀 אם יש הנחות לפי קטגוריה, נביא את הקטגוריות של המוצרים מראש (batch)
  const hasCategoryDiscount = discounts.some(d => d.appliesTo === 'category');
  let productCategoriesMap = new Map<string, string[]>();
  
  if (hasCategoryDiscount) {
    const productIds = cartItems.map(item => item.productId);
    const categoriesData = await db
      .select({ productId: productCategories.productId, categoryId: productCategories.categoryId })
      .from(productCategories)
      .where(inArray(productCategories.productId, productIds));
    
    for (const pc of categoriesData) {
      if (!productCategoriesMap.has(pc.productId)) {
        productCategoriesMap.set(pc.productId, []);
      }
      productCategoriesMap.get(pc.productId)!.push(pc.categoryId);
    }
  }

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
      // קבלת קטגוריות המוצר - מהפרמטר או מה-DB
      const itemCategoryIds = item.categoryId 
        ? [item.categoryId] 
        : (productCategoriesMap.get(item.productId) || []);
      
      // בדיקת החרגות
      const excludeProductIds = (discount.excludeProductIds as string[]) || [];
      const excludeCategoryIds = (discount.excludeCategoryIds as string[]) || [];
      
      if (excludeProductIds.includes(item.productId)) return false;
      if (itemCategoryIds.some(catId => excludeCategoryIds.includes(catId))) return false;
      
      // בדיקת התאמה
      const appliesTo = discount.appliesTo || 'all';
      if (appliesTo === 'all') return true;
      if (appliesTo === 'product') {
        const productIds = (discount.productIds as string[]) || [];
        return productIds.includes(item.productId);
      }
      if (appliesTo === 'category') {
        const discountCategoryIds = (discount.categoryIds as string[]) || [];
        return itemCategoryIds.some(catId => discountCategoryIds.includes(catId));
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

    // Check applies to condition using matchingItems (which already uses productCategoriesMap for correct category matching)
    switch (discount.appliesTo) {
      case 'all':
        // Applies to all products
        applicableDiscounts.push(formatDiscount(discount));
        break;

      case 'category':
        // Use matchingItems which already correctly checks categories via productCategoriesMap
        if (matchingItems.length > 0) {
          applicableDiscounts.push(formatDiscount(discount));
        }
        break;

      case 'product':
        // Use matchingItems which already correctly checks product IDs
        if (matchingItems.length > 0) {
          applicableDiscounts.push(formatDiscount(discount));
        }
        break;

      case 'member':
        // Only for club members (based on contacts table)
        if (email) {
          const [clubMemberContact] = await db
            .select({ id: contacts.id })
            .from(contacts)
            .where(and(
              eq(contacts.storeId, storeId),
              eq(contacts.email, email.toLowerCase()),
              eq(contacts.type, 'club_member'),
              eq(contacts.status, 'active')
            ))
            .limit(1);

          // Has active club_member contact
          if (clubMemberContact) {
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

/**
 * Get automatic discount applicable to a single product
 * Used for displaying discounted price on product pages
 * 
 * ⚡ Performance: Single DB query with proper filtering
 * 🔄 תומך במספר הנחות - מחזיר את כולן!
 */
export type ProductAutomaticDiscount = {
  id: string;
  name: string;
  description: string | null;
  type: 'percentage' | 'fixed_amount';
  value: number;
  discountedPrice: number;
};

export type ProductAutomaticDiscounts = {
  discounts: ProductAutomaticDiscount[];
  finalPrice: number;
  totalDiscountPercent: number;
};

export async function getProductAutomaticDiscount(
  storeId: string,
  productId: string,
  categoryIds: string[], // תמיכה במספר קטגוריות למוצר
  price: number
): Promise<ProductAutomaticDiscount | null> {
  // קריאה לפונקציה החדשה והחזרת ההנחה הראשונה (תאימות לאחור)
  const result = await getProductAutomaticDiscounts(storeId, productId, categoryIds, price);
  return result.discounts.length > 0 ? result.discounts[0] : null;
}

/**
 * 🆕 Get ALL automatic discounts for a single product
 * Returns array of all applicable discounts + combined final price
 */
export async function getProductAutomaticDiscounts(
  storeId: string,
  productId: string,
  categoryIds: string[],
  price: number
): Promise<ProductAutomaticDiscounts> {
  const emptyResult: ProductAutomaticDiscounts = { discounts: [], finalPrice: price, totalDiscountPercent: 0 };
  
  if (!storeId || !productId || price <= 0) return emptyResult;

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

  const applicableDiscounts: ProductAutomaticDiscount[] = [];
  let currentPrice = price;
  let hasNonStackable = false;

  for (const discount of discounts) {
    // Only handle percentage and fixed_amount for product page display
    if (discount.type !== 'percentage' && discount.type !== 'fixed_amount') {
      continue;
    }

    // אם כבר יש הנחה לא ניתנת לשילוב, לא מוסיפים עוד
    if (hasNonStackable) break;

    // Check exclusions first
    const excludeProductIds = (discount.excludeProductIds as string[]) || [];
    const excludeCategoryIds = (discount.excludeCategoryIds as string[]) || [];
    
    // If product is excluded, skip
    if (excludeProductIds.includes(productId)) continue;
    
    // If ANY of product's categories is excluded, skip
    if (categoryIds.length > 0 && excludeCategoryIds.some(excCat => categoryIds.includes(excCat))) continue;

    // Check if discount applies to this product
    let applies = false;
    
    switch (discount.appliesTo) {
      case 'all':
        applies = true;
        break;
        
      case 'category':
        const discountCategoryIds = (discount.categoryIds as string[]) || [];
        applies = categoryIds.length > 0 && discountCategoryIds.some(cat => categoryIds.includes(cat));
        break;
        
      case 'product':
        const productIds = (discount.productIds as string[]) || [];
        applies = productIds.includes(productId);
        break;
        
      // 'member' discounts are not shown on product page (require login check)
      default:
        applies = false;
    }

    if (applies) {
      // Calculate discounted price progressively
      let discountedPrice = currentPrice;
      if (discount.type === 'percentage') {
        discountedPrice = currentPrice * (1 - Number(discount.value) / 100);
      } else if (discount.type === 'fixed_amount') {
        discountedPrice = Math.max(0, currentPrice - Number(discount.value));
      }

      applicableDiscounts.push({
        id: discount.id,
        name: discount.name,
        description: discount.description,
        type: discount.type as 'percentage' | 'fixed_amount',
        value: Number(discount.value),
        discountedPrice: Math.round(discountedPrice * 100) / 100,
      });
      
      currentPrice = discountedPrice;
      
      // אם ההנחה לא ניתנת לשילוב, מפסיקים
      if (!discount.stackable) {
        hasNonStackable = true;
    }
  }
  }

  const totalDiscountPercent = price > 0 ? Math.round((1 - currentPrice / price) * 100) : 0;

  return {
    discounts: applicableDiscounts,
    finalPrice: Math.round(currentPrice * 100) / 100,
    totalDiscountPercent,
  };
}

/**
 * 🚀 חישוב הנחות אוטומטיות לרשימת מוצרים (Batch) - מהיר!
 * שליפה אחת מה-DB, חישוב בזיכרון
 * 🆕 תומך במספר הנחות - מחזיר את כולן!
 */
export type ProductDiscountMap = Map<string, {
  name: string;           // שם ההנחה הראשונה (תאימות לאחור)
  names: string[];        // כל שמות ההנחות
  discountedPrice: number;
  discountPercent: number;
  categoryIds: string[];  // קטגוריות המוצר - לחישוב הנחות בצ'קאאוט
}>;

export async function getProductsAutomaticDiscounts(
  storeId: string,
  products: Array<{ id: string; price: number | string | null; categoryIds?: string[] }>
): Promise<ProductDiscountMap> {
  const result: ProductDiscountMap = new Map();
  
  if (!storeId || products.length === 0) return result;

  const now = new Date();
  
  // 1. שליפת כל ההנחות האוטומטיות הפעילות (שליפה אחת!)
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

  if (discounts.length === 0) return result;

  // 2. אם חלק מהמוצרים חסרים categoryIds, נביא אותם מה-DB
  const productsNeedingCategories = products.filter(p => !p.categoryIds);
  let productCategoryMap = new Map<string, string[]>();
  
  if (productsNeedingCategories.length > 0) {
    const productIds = productsNeedingCategories.map(p => p.id);
    const categoriesData = await db
      .select({ productId: productCategories.productId, categoryId: productCategories.categoryId })
      .from(productCategories)
      .where(inArray(productCategories.productId, productIds));
    
    for (const pc of categoriesData) {
      if (!productCategoryMap.has(pc.productId)) {
        productCategoryMap.set(pc.productId, []);
      }
      productCategoryMap.get(pc.productId)!.push(pc.categoryId);
    }
  }

  // 3. חישוב הנחות לכל מוצר (תומך במספר הנחות!)
  for (const product of products) {
    const price = Number(product.price) || 0;
    if (price <= 0) continue;
    
    const categoryIds = product.categoryIds || productCategoryMap.get(product.id) || [];
    const appliedNames: string[] = [];
    let currentPrice = price;
    let hasNonStackable = false;
    
    for (const discount of discounts) {
      // רק percentage ו-fixed_amount מתאימים לתצוגה בכרטיסי מוצר
      if (discount.type !== 'percentage' && discount.type !== 'fixed_amount') continue;
      
      // אם כבר יש הנחה לא ניתנת לשילוב, מפסיקים
      if (hasNonStackable) break;
      
      const excludeProductIds = (discount.excludeProductIds as string[]) || [];
      const excludeCategoryIds = (discount.excludeCategoryIds as string[]) || [];
      
      // בדיקת החרגות
      if (excludeProductIds.includes(product.id)) continue;
      if (categoryIds.some(catId => excludeCategoryIds.includes(catId))) continue;
      
      // בדיקת התאמה
      let applies = false;
      const discountCategoryIds = (discount.categoryIds as string[]) || [];
      const discountProductIds = (discount.productIds as string[]) || [];
      
      switch (discount.appliesTo) {
        case 'all':
          applies = true;
          break;
        case 'category':
          applies = categoryIds.some(catId => discountCategoryIds.includes(catId));
          break;
        case 'product':
          applies = discountProductIds.includes(product.id);
          break;
      }
      
      if (applies) {
        // חישוב מחיר מצטבר
        if (discount.type === 'percentage') {
          currentPrice = currentPrice * (1 - Number(discount.value) / 100);
        } else if (discount.type === 'fixed_amount') {
          currentPrice = Math.max(0, currentPrice - Number(discount.value));
        }
        
        appliedNames.push(discount.name);
        
        // אם ההנחה לא ניתנת לשילוב, מפסיקים
        if (!discount.stackable) {
          hasNonStackable = true;
        }
      }
    }
    
    // 🔑 תמיד מוסיפים לתוצאה - גם אם אין הנחות, כדי שה-categoryIds יהיו זמינים בעגלה
    const discountPercent = appliedNames.length > 0 ? Math.round((1 - currentPrice / price) * 100) : 0;
        result.set(product.id, {
      name: appliedNames[0] || '',                        // תאימות לאחור
      names: appliedNames,                                // כל ההנחות
      discountedPrice: Math.round(currentPrice * 100) / 100,
          discountPercent,
      categoryIds,                                        // לחישוב הנחות בצ'קאאוט
    });
  }
  
  return result;
}

