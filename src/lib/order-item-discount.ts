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
  // שדות להנחות buy_x_get_y
  buyQuantity: number | null;
  getQuantity: number | null;
  getDiscountPercent: number | null;
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
      // שדות להנחות buy_x_get_y
      buyQuantity: discounts.buyQuantity,
      getQuantity: discounts.getQuantity,
      getDiscountPercent: discounts.getDiscountPercent,
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
  
  // שליפת פרטי הקופון מה-DB
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
  
  // 🎯 תמיכה בסוגי הנחות שונים:
  // - percentage: הנחת אחוזים על כל פריט מתאים
  // - buy_x_get_y: קנה X קבל Y חינם/בהנחה (הזול מקבל הנחה)
  if (discount.type === 'percentage' || discount.type === 'buy_x_get_y') {
    return calculateWithDiscount(storeId, items, discount);
  }
  
  // סוגי הנחות אחרים (fixed_amount, free_shipping וכו') 
  // לא מציגים הנחה ברמת פריט
  return items.map(item => ({
    ...item,
    hasDiscount: false,
    discountedPrice: null,
    discountedTotal: null,
    discountPercent: null,
  }));
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
  
  // 🎯 טיפול בהנחות buy_x_get_y (קנה 2 קבל 1 חינם)
  if (discount.type === 'buy_x_get_y') {
    return calculateBuyXGetYDiscount(items, discount, productCategoryMap);
  }
  
  const discountPercent = Number(discount.value);
  
  // חישוב הנחה לכל פריט (percentage)
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
 * 🎁 חישוב הנחת buy_x_get_y (קנה X קבל Y חינם/בהנחה)
 * מסמן את הפריטים הזולים ביותר כמקבלים הנחה
 */
async function calculateBuyXGetYDiscount(
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
  discount: DiscountInfo,
  productCategoryMap: Map<string, string[]>
): Promise<OrderItemWithDiscount[]> {
  const buyQty = discount.buyQuantity || 0;
  const getQty = discount.getQuantity || 0;
  const discountPercent = discount.getDiscountPercent ?? 100; // 100 = חינם
  
  if (buyQty <= 0 || getQty <= 0) {
    return items.map(item => ({
      ...item,
      hasDiscount: false,
      discountedPrice: null,
      discountedTotal: null,
      discountPercent: null,
    }));
  }
  
  // מציאת פריטים שמתאימים להנחה (לא מוחרגים)
  const matchingItemsWithIndex: Array<{
    index: number;
    item: typeof items[0];
    matches: boolean;
    pricePerUnit: number;
  }> = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const matches = await doesItemMatchDiscount(
      item.productId,
      discount,
      productCategoryMap
    );
    matchingItemsWithIndex.push({
      index: i,
      item,
      matches,
      pricePerUnit: Number(item.price),
    });
  }
  
  // ספירת סה"כ כמות פריטים מתאימים
  const totalMatchingQty = matchingItemsWithIndex
    .filter(m => m.matches && m.pricePerUnit > 0) // לא כולל מוצרי מתנה (מחיר 0)
    .reduce((sum, m) => sum + m.item.quantity, 0);
  
  // חישוב כמה פעמים המבצע מתקיים
  const requiredForOneGift = buyQty + getQty;
  const timesApplied = Math.floor(totalMatchingQty / requiredForOneGift);
  
  if (timesApplied <= 0) {
    return items.map(item => ({
      ...item,
      hasDiscount: false,
      discountedPrice: null,
      discountedTotal: null,
      discountPercent: null,
    }));
  }
  
  // כמות פריטים שמקבלים הנחה
  const itemsToDiscount = getQty * timesApplied;
  
  // מיון לפי מחיר (הזול קודם) - ההנחה חלה על הזולים
  const sortedMatching = matchingItemsWithIndex
    .filter(m => m.matches && m.pricePerUnit > 0)
    .sort((a, b) => a.pricePerUnit - b.pricePerUnit);
  
  // סימון כמה יחידות מכל פריט מקבלות הנחה
  const discountedUnitsPerItem = new Map<number, number>();
  let remainingToDiscount = itemsToDiscount;
  
  for (const m of sortedMatching) {
    if (remainingToDiscount <= 0) break;
    
    const unitsFromThis = Math.min(m.item.quantity, remainingToDiscount);
    if (unitsFromThis > 0) {
      discountedUnitsPerItem.set(m.index, unitsFromThis);
      remainingToDiscount -= unitsFromThis;
    }
  }
  
  // בניית התוצאה
  const result: OrderItemWithDiscount[] = items.map((item, index) => {
    const discountedUnits = discountedUnitsPerItem.get(index) || 0;
    
    if (discountedUnits > 0) {
      const originalPrice = Number(item.price);
      const originalTotal = Number(item.total);
      
      // חישוב המחיר המוזל
      // אם כל היחידות מקבלות הנחה
      if (discountedUnits >= item.quantity) {
        const discountedPrice = originalPrice * (1 - discountPercent / 100);
        const discountedTotal = discountedPrice * item.quantity;
        
        return {
          ...item,
          hasDiscount: true,
          discountedPrice: Math.round(discountedPrice * 100) / 100,
          discountedTotal: Math.round(discountedTotal * 100) / 100,
          discountPercent,
        };
      } else {
        // רק חלק מהיחידות מקבלות הנחה
        const fullPriceUnits = item.quantity - discountedUnits;
        const discountedPricePerUnit = originalPrice * (1 - discountPercent / 100);
        const discountedTotal = (fullPriceUnits * originalPrice) + (discountedUnits * discountedPricePerUnit);
        const avgDiscountedPrice = discountedTotal / item.quantity;
        
        return {
          ...item,
          hasDiscount: true,
          discountedPrice: Math.round(avgDiscountedPrice * 100) / 100,
          discountedTotal: Math.round(discountedTotal * 100) / 100,
          discountPercent,
        };
      }
    }
    
    return {
      ...item,
      hasDiscount: false,
      discountedPrice: null,
      discountedTotal: null,
      discountPercent: null,
    };
  });
  
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

