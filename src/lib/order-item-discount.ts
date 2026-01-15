/**
 * Order Item Discount Calculator
 * 
 * מחשב עבור כל פריט בהזמנה אם חלה עליו הנחת קופון
 * ומה המחיר אחרי ההנחה
 */

import { db } from '@/lib/db';
import { discounts, productCategories } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// טיפוס של פריט הזמנה עם מידע על הנחה
export interface OrderItemWithDiscount {
  id: string;
  productId: string | null;
  name: string;
  variantTitle: string | null;
  sku: string | null;
  quantity: number;
  price: string; // מחיר מקורי
  total: string;
  imageUrl: string | null;
  properties?: Record<string, unknown> | null;
  // שדות חדשים - מידע על הנחה
  hasDiscount: boolean;
  discountedPrice: number | null; // מחיר אחרי הנחה ליחידה
  discountedTotal: number | null; // סה"כ אחרי הנחה
  discountPercent: number | null; // אחוז ההנחה
}

// טיפוס של הנחה מה-DB
interface DiscountInfo {
  type: string;
  value: string;
  appliesTo: string;
  productIds: unknown;
  categoryIds: unknown;
  excludeProductIds: unknown;
  excludeCategoryIds: unknown;
}

// טיפוס של פרטי הנחה מההזמנה
interface DiscountDetail {
  type: 'coupon' | 'auto' | 'gift_card' | 'credit' | 'member';
  code?: string;
  name: string;
  description?: string;
  amount: number;
}

/**
 * שולף את פרטי הקופון מה-DB לפי קוד וחנות
 */
async function getDiscountByCode(storeId: string, code: string): Promise<DiscountInfo | null> {
  const [discount] = await db
    .select({
      type: discounts.type,
      value: discounts.value,
      appliesTo: discounts.appliesTo,
      productIds: discounts.productIds,
      categoryIds: discounts.categoryIds,
      excludeProductIds: discounts.excludeProductIds,
      excludeCategoryIds: discounts.excludeCategoryIds,
    })
    .from(discounts)
    .where(and(
      eq(discounts.storeId, storeId),
      eq(discounts.code, code.toUpperCase())
    ))
    .limit(1);
  
  return discount || null;
}

/**
 * בודק אם פריט מסוים זכאי להנחה על סמך הקופון
 */
async function doesItemMatchDiscount(
  productId: string | null,
  discount: DiscountInfo,
  productCategoryMap: Map<string, string[]>
): Promise<boolean> {
  if (!productId) return false;
  
  const excludeProductIds = (discount.excludeProductIds as string[]) || [];
  const excludeCategoryIds = (discount.excludeCategoryIds as string[]) || [];
  const itemCategoryIds = productCategoryMap.get(productId) || [];
  
  // בדיקת החרגות - אם המוצר מוחרג, לא חלה עליו הנחה
  if (excludeProductIds.includes(productId)) {
    return false;
  }
  
  // בדיקה אם קטגוריה של המוצר מוחרגת
  if (itemCategoryIds.some(catId => excludeCategoryIds.includes(catId))) {
    return false;
  }
  
  // בדיקת התאמה לפי appliesTo
  const appliesTo = discount.appliesTo || 'all';
  
  if (appliesTo === 'all' || appliesTo === 'member') {
    return true;
  }
  
  if (appliesTo === 'product') {
    const discountProductIds = (discount.productIds as string[]) || [];
    return discountProductIds.includes(productId);
  }
  
  if (appliesTo === 'category') {
    const discountCategoryIds = (discount.categoryIds as string[]) || [];
    return itemCategoryIds.some(catId => discountCategoryIds.includes(catId));
  }
  
  return true;
}

/**
 * 🎯 פונקציה ראשית - מחשבת הנחות ברמת פריט
 * מקבלת פריטי הזמנה ומחזירה אותם עם מידע על הנחות
 */
export async function calculateItemDiscounts(
  storeId: string,
  items: Array<{
    id: string;
    productId: string | null;
    name: string;
    variantTitle: string | null;
    sku: string | null;
    quantity: number;
    price: string;
    total: string;
    imageUrl: string | null;
    properties?: Record<string, unknown> | null;
  }>,
  discountCode: string | null,
  discountDetails?: DiscountDetail[] | null
): Promise<OrderItemWithDiscount[]> {
  // אם אין קוד הנחה, מחזירים את הפריטים ללא שינוי
  if (!discountCode) {
    return items.map(item => ({
      ...item,
      hasDiscount: false,
      discountedPrice: null,
      discountedTotal: null,
      discountPercent: null,
    }));
  }
  
  // מציאת ההנחה מסוג percentage ב-discountDetails
  const percentageDiscount = discountDetails?.find(
    d => d.type === 'coupon' && d.description?.includes('%')
  );
  
  // אם אין הנחת אחוזים, לא נראה הנחה ברמת פריט
  // (הנחות סכום קבוע לא מתחלקות על פריטים בודדים)
  if (!percentageDiscount) {
    // ננסה לשלוף מה-DB
    const discount = await getDiscountByCode(storeId, discountCode);
    
    if (!discount || discount.type !== 'percentage') {
      return items.map(item => ({
        ...item,
        hasDiscount: false,
        discountedPrice: null,
        discountedTotal: null,
        discountPercent: null,
      }));
    }
    
    // חישוב עם הנחה מה-DB
    return calculateWithDiscount(storeId, items, discount);
  }
  
  // שליפת פרטי הקופון מה-DB (כולל excludeProductIds)
  const discount = await getDiscountByCode(storeId, discountCode);
  
  if (!discount) {
    return items.map(item => ({
      ...item,
      hasDiscount: false,
      discountedPrice: null,
      discountedTotal: null,
      discountPercent: null,
    }));
  }
  
  return calculateWithDiscount(storeId, items, discount);
}

/**
 * חישוב הנחות עם פרטי הקופון
 */
async function calculateWithDiscount(
  storeId: string,
  items: Array<{
    id: string;
    productId: string | null;
    name: string;
    variantTitle: string | null;
    sku: string | null;
    quantity: number;
    price: string;
    total: string;
    imageUrl: string | null;
    properties?: Record<string, unknown> | null;
  }>,
  discount: DiscountInfo
): Promise<OrderItemWithDiscount[]> {
  // שליפת קטגוריות לכל המוצרים
  const productIds = items
    .map(item => item.productId)
    .filter((id): id is string => id !== null);
  
  const productCategoryMap = new Map<string, string[]>();
  
  if (productIds.length > 0) {
    const categoriesData = await db
      .select({
        productId: productCategories.productId,
        categoryId: productCategories.categoryId,
      })
      .from(productCategories)
      .where(inArray(productCategories.productId, productIds));
    
    for (const pc of categoriesData) {
      if (!productCategoryMap.has(pc.productId)) {
        productCategoryMap.set(pc.productId, []);
      }
      productCategoryMap.get(pc.productId)!.push(pc.categoryId);
    }
  }
  
  const discountPercent = Number(discount.value);
  
  // חישוב הנחה לכל פריט
  const result: OrderItemWithDiscount[] = [];
  
  for (const item of items) {
    const matches = await doesItemMatchDiscount(
      item.productId,
      discount,
      productCategoryMap
    );
    
    if (matches && discount.type === 'percentage') {
      const originalPrice = Number(item.price);
      const discountedPrice = originalPrice * (1 - discountPercent / 100);
      const discountedTotal = discountedPrice * item.quantity;
      
      result.push({
        ...item,
        hasDiscount: true,
        discountedPrice: Math.round(discountedPrice * 100) / 100,
        discountedTotal: Math.round(discountedTotal * 100) / 100,
        discountPercent,
      });
    } else {
      result.push({
        ...item,
        hasDiscount: false,
        discountedPrice: null,
        discountedTotal: null,
        discountPercent: null,
      });
    }
  }
  
  return result;
}

/**
 * פונקציית עזר סינכרונית לחישוב מחיר מוזל
 * משמשת כשיש כבר את כל המידע (בלי DB)
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  discountPercent: number
): { discountedPrice: number; savings: number } {
  const discountedPrice = originalPrice * (1 - discountPercent / 100);
  const savings = originalPrice - discountedPrice;
  
  return {
    discountedPrice: Math.round(discountedPrice * 100) / 100,
    savings: Math.round(savings * 100) / 100,
  };
}

