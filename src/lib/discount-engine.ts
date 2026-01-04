/**
 * 🎯 מנוע הנחות מרכזי - QuickShop Discount Engine
 * 
 * קובץ זה מכיל את כל הלוגיקה לחישוב הנחות במערכת.
 * מהיר, ברור ובלי טעויות.
 * 
 * סוגי הנחות נתמכים:
 * 1. percentage - אחוז הנחה (10%, 20%, וכו')
 * 2. fixed_amount - סכום קבוע (50₪, 100₪)
 * 3. free_shipping - משלוח חינם
 * 4. buy_x_pay_y - קנה X מוצרים שלם Y ש"ח
 * 5. buy_x_get_y - קנה X קבל Y במתנה
 * 6. quantity_discount - הנחות כמות (קנה 2 = 10%, קנה 3 = 20%)
 * 7. spend_x_pay_y - קנה ב-200 שלם 100
 */

// ============ TYPES ============

export type DiscountType = 
  | 'percentage' 
  | 'fixed_amount' 
  | 'free_shipping'
  | 'buy_x_pay_y'
  | 'buy_x_get_y'
  | 'quantity_discount'
  | 'spend_x_pay_y';

export type AppliesTo = 'all' | 'category' | 'product' | 'member';

export interface QuantityTier {
  minQuantity: number;
  discountPercent: number;
}

export interface CartItem {
  id: string;           // unique identifier for this cart line
  productId: string;
  variantId?: string;
  categoryId?: string;
  name: string;
  price: number;        // מחיר ליחידה
  quantity: number;
  imageUrl?: string;
}

export interface Discount {
  id: string;
  code?: string;        // קוד קופון (ריק להנחות אוטומטיות)
  title?: string | null;
  type: DiscountType;
  value: number;        // ערך ההנחה (אחוז או סכום)
  
  // על מה חל
  appliesTo: AppliesTo;
  categoryIds: string[];
  productIds: string[];
  
  // החרגות
  excludeCategoryIds: string[];
  excludeProductIds: string[];
  
  // תנאים
  minimumAmount?: number | null;
  minimumQuantity?: number | null;
  
  // ניתן לשילוב
  stackable: boolean;
  
  // שדות מתקדמים
  buyQuantity?: number | null;      // buy_x_pay_y, buy_x_get_y
  payAmount?: number | null;        // buy_x_pay_y, spend_x_pay_y
  getQuantity?: number | null;      // buy_x_get_y
  giftProductIds?: string[];        // buy_x_get_y
  giftSameProduct?: boolean;        // buy_x_get_y
  quantityTiers?: QuantityTier[];   // quantity_discount
  spendAmount?: number | null;      // spend_x_pay_y
}

export interface DiscountResult {
  discountId: string;
  code?: string;
  title?: string | null;
  type: DiscountType;
  amount: number;           // סכום ההנחה
  description: string;      // תיאור ההנחה (להצגה)
  affectedItems?: string[]; // מזהי פריטים שההנחה חלה עליהם
  giftItems?: CartItem[];   // פריטים במתנה (buy_x_get_y)
  freeShipping?: boolean;   // משלוח חינם
}

export interface CalculationResult {
  originalTotal: number;        // סכום מקורי
  discountTotal: number;        // סה"כ הנחות
  finalTotal: number;           // סכום לתשלום
  freeShipping: boolean;        // האם יש משלוח חינם
  appliedDiscounts: DiscountResult[];
  giftItems: CartItem[];        // פריטים במתנה
  errors: string[];             // שגיאות אם יש
}

// ============ HELPER FUNCTIONS ============

/**
 * בדיקה האם פריט מתאים להנחה (לפי קטגוריה/מוצר)
 */
function doesItemMatchDiscount(item: CartItem, discount: Discount): boolean {
  // בדיקת החרגות קודם
  if (discount.excludeProductIds?.includes(item.productId)) {
    return false;
  }
  if (item.categoryId && discount.excludeCategoryIds?.includes(item.categoryId)) {
    return false;
  }
  
  // בדיקת התאמה
  switch (discount.appliesTo) {
    case 'all':
      return true;
    case 'category':
      return item.categoryId ? discount.categoryIds.includes(item.categoryId) : false;
    case 'product':
      return discount.productIds.includes(item.productId);
    case 'member':
      return true; // יבדק ברמה גבוהה יותר
    default:
      return false;
  }
}

/**
 * חישוב סכום הסל עבור פריטים מתאימים
 */
function calculateMatchingTotal(items: CartItem[], discount: Discount): number {
  return items
    .filter(item => doesItemMatchDiscount(item, discount))
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

/**
 * ספירת פריטים מתאימים (כמות כוללת)
 */
function countMatchingItems(items: CartItem[], discount: Discount): number {
  return items
    .filter(item => doesItemMatchDiscount(item, discount))
    .reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * קבלת פריטים מתאימים
 */
function getMatchingItems(items: CartItem[], discount: Discount): CartItem[] {
  return items.filter(item => doesItemMatchDiscount(item, discount));
}

// ============ DISCOUNT CALCULATORS ============

/**
 * בדיקה אם יש החרגות מוגדרות
 */
function hasExclusions(discount: Discount): boolean {
  return (discount.excludeCategoryIds?.length || 0) > 0 || 
         (discount.excludeProductIds?.length || 0) > 0;
}

/**
 * חישוב הנחת אחוזים
 */
function calculatePercentageDiscount(
  items: CartItem[],
  discount: Discount,
  cartTotal: number
): DiscountResult | null {
  // אם יש החרגות או זה לא 'all', נחשב מחדש את הסכום המתאים
  const matchingTotal = (discount.appliesTo === 'all' || discount.appliesTo === 'member') && !hasExclusions(discount)
    ? cartTotal
    : calculateMatchingTotal(items, discount);
  
  if (matchingTotal === 0) return null;
  
  const amount = Math.round((matchingTotal * discount.value) / 100 * 100) / 100;
  
  return {
    discountId: discount.id,
    code: discount.code,
    title: discount.title,
    type: 'percentage',
    amount,
    description: `${discount.value}% הנחה`,
    affectedItems: getMatchingItems(items, discount).map(i => i.id),
  };
}

/**
 * חישוב הנחת סכום קבוע
 */
function calculateFixedAmountDiscount(
  items: CartItem[],
  discount: Discount,
  cartTotal: number
): DiscountResult | null {
  // אם יש החרגות, נחשב מחדש את הסכום המתאים
  const matchingTotal = (discount.appliesTo === 'all' || discount.appliesTo === 'member') && !hasExclusions(discount)
    ? cartTotal
    : calculateMatchingTotal(items, discount);
  
  if (matchingTotal === 0) return null;
  
  // לא יכול להיות יותר מהסכום המתאים
  const amount = Math.min(discount.value, matchingTotal);
  
  return {
    discountId: discount.id,
    code: discount.code,
    title: discount.title,
    type: 'fixed_amount',
    amount,
    description: `₪${discount.value} הנחה`,
    affectedItems: getMatchingItems(items, discount).map(i => i.id),
  };
}

/**
 * משלוח חינם
 */
function calculateFreeShippingDiscount(
  discount: Discount
): DiscountResult {
  return {
    discountId: discount.id,
    code: discount.code,
    title: discount.title,
    type: 'free_shipping',
    amount: 0, // לא מפחית מסכום ההזמנה
    description: 'משלוח חינם',
    freeShipping: true,
  };
}

/**
 * קנה X מוצרים שלם Y ש"ח
 * דוגמה: קנה 3 חולצות שלם 100₪
 */
function calculateBuyXPayY(
  items: CartItem[],
  discount: Discount
): DiscountResult | null {
  const buyQty = discount.buyQuantity || 0;
  const payAmount = discount.payAmount || 0;
  
  if (buyQty <= 0 || payAmount <= 0) return null;
  
  const matchingItems = getMatchingItems(items, discount);
  const totalMatchingQty = matchingItems.reduce((sum, i) => sum + i.quantity, 0);
  
  if (totalMatchingQty < buyQty) return null;
  
  // כמה פעמים המבצע מתקיים
  const timesApplied = Math.floor(totalMatchingQty / buyQty);
  
  // מחיר מקורי של X פריטים הזולים ביותר
  // נמיין לפי מחיר (הזול קודם) ונחשב
  const sortedItems = [...matchingItems].sort((a, b) => a.price - b.price);
  
  let itemsToDiscount = buyQty * timesApplied;
  let originalPrice = 0;
  
  for (const item of sortedItems) {
    const qtyFromThis = Math.min(item.quantity, itemsToDiscount);
    originalPrice += qtyFromThis * item.price;
    itemsToDiscount -= qtyFromThis;
    if (itemsToDiscount <= 0) break;
  }
  
  const discountedPrice = payAmount * timesApplied;
  const amount = Math.max(0, originalPrice - discountedPrice);
  
  if (amount <= 0) return null;
  
  return {
    discountId: discount.id,
    code: discount.code,
    title: discount.title,
    type: 'buy_x_pay_y',
    amount,
    description: `קנה ${buyQty} שלם ₪${payAmount}`,
    affectedItems: matchingItems.map(i => i.id),
  };
}

/**
 * קנה X קבל Y במתנה
 * דוגמה: קנה 2 קבל 1 חינם
 */
function calculateBuyXGetY(
  items: CartItem[],
  discount: Discount
): DiscountResult | null {
  const buyQty = discount.buyQuantity || 0;
  const getQty = discount.getQuantity || 0;
  
  if (buyQty <= 0 || getQty <= 0) return null;
  
  const matchingItems = getMatchingItems(items, discount);
  const totalMatchingQty = matchingItems.reduce((sum, i) => sum + i.quantity, 0);
  
  // צריך לפחות buyQty כדי לקבל מתנה
  if (totalMatchingQty < buyQty) return null;
  
  // כמה פעמים המבצע מתקיים
  const requiredForOneGift = buyQty + getQty; // כדי לקבל 1 חינם צריך לקנות buyQty
  const timesApplied = Math.floor(totalMatchingQty / requiredForOneGift);
  
  if (timesApplied <= 0) return null;
  
  const freeItems = getQty * timesApplied;
  
  // מחשבים את ההנחה לפי הפריטים הזולים ביותר (שהם אלה שיהיו חינם)
  const sortedItems = [...matchingItems].sort((a, b) => a.price - b.price);
  
  let itemsToFree = freeItems;
  let amount = 0;
  const giftItems: CartItem[] = [];
  
  for (const item of sortedItems) {
    const qtyFromThis = Math.min(item.quantity, itemsToFree);
    amount += qtyFromThis * item.price;
    
    if (qtyFromThis > 0) {
      giftItems.push({
        ...item,
        quantity: qtyFromThis,
        price: 0, // חינם
      });
    }
    
    itemsToFree -= qtyFromThis;
    if (itemsToFree <= 0) break;
  }
  
  if (amount <= 0) return null;
  
  return {
    discountId: discount.id,
    code: discount.code,
    title: discount.title,
    type: 'buy_x_get_y',
    amount,
    description: `קנה ${buyQty} קבל ${getQty} חינם`,
    affectedItems: matchingItems.map(i => i.id),
    giftItems,
  };
}

/**
 * הנחות כמות מדורגות
 * דוגמה: קנה 2 = 10%, קנה 3 = 20%
 */
function calculateQuantityDiscount(
  items: CartItem[],
  discount: Discount
): DiscountResult | null {
  const tiers = discount.quantityTiers || [];
  
  if (tiers.length === 0) return null;
  
  const matchingItems = getMatchingItems(items, discount);
  const totalMatchingQty = matchingItems.reduce((sum, i) => sum + i.quantity, 0);
  const matchingTotal = matchingItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  
  if (totalMatchingQty === 0 || matchingTotal === 0) return null;
  
  // מוצאים את המדרגה המתאימה (הגבוהה ביותר שעומדים בה)
  const sortedTiers = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
  const applicableTier = sortedTiers.find(t => totalMatchingQty >= t.minQuantity);
  
  if (!applicableTier) return null;
  
  const amount = Math.round((matchingTotal * applicableTier.discountPercent) / 100 * 100) / 100;
  
  if (amount <= 0) return null;
  
  return {
    discountId: discount.id,
    code: discount.code,
    title: discount.title,
    type: 'quantity_discount',
    amount,
    description: `קנה ${applicableTier.minQuantity}+ קבל ${applicableTier.discountPercent}% הנחה`,
    affectedItems: matchingItems.map(i => i.id),
  };
}

/**
 * קנה ב-X שלם Y
 * דוגמה: קנה ב-200₪ שלם 100₪
 */
function calculateSpendXPayY(
  items: CartItem[],
  discount: Discount,
  cartTotal: number
): DiscountResult | null {
  const spendAmount = discount.spendAmount || 0;
  const payAmount = discount.payAmount || 0;
  
  if (spendAmount <= 0 || payAmount <= 0 || payAmount >= spendAmount) return null;
  
  // אם יש החרגות, נחשב מחדש את הסכום המתאים
  const matchingTotal = (discount.appliesTo === 'all' || discount.appliesTo === 'member') && !hasExclusions(discount)
    ? cartTotal
    : calculateMatchingTotal(items, discount);
  
  if (matchingTotal < spendAmount) return null;
  
  // כמה פעמים המבצע מתקיים
  const timesApplied = Math.floor(matchingTotal / spendAmount);
  const amount = (spendAmount - payAmount) * timesApplied;
  
  if (amount <= 0) return null;
  
  return {
    discountId: discount.id,
    code: discount.code,
    title: discount.title,
    type: 'spend_x_pay_y',
    amount,
    description: `קנה ב-₪${spendAmount} שלם ₪${payAmount}`,
    affectedItems: getMatchingItems(items, discount).map(i => i.id),
  };
}

// ============ MAIN CALCULATOR ============

/**
 * חישוב הנחה בודדת
 */
function calculateSingleDiscount(
  items: CartItem[],
  discount: Discount,
  cartTotal: number,
  isMember: boolean = false
): DiscountResult | null {
  // בדיקת תנאי חבר מועדון
  if (discount.appliesTo === 'member' && !isMember) {
    return null;
  }
  
  // בדיקת מינימום סכום
  if (discount.minimumAmount && cartTotal < discount.minimumAmount) {
    return null;
  }
  
  // בדיקת מינימום כמות
  if (discount.minimumQuantity) {
    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
    if (totalQty < discount.minimumQuantity) {
      return null;
    }
  }
  
  // חישוב לפי סוג ההנחה
  switch (discount.type) {
    case 'percentage':
      return calculatePercentageDiscount(items, discount, cartTotal);
      
    case 'fixed_amount':
      return calculateFixedAmountDiscount(items, discount, cartTotal);
      
    case 'free_shipping':
      return calculateFreeShippingDiscount(discount);
      
    case 'buy_x_pay_y':
      return calculateBuyXPayY(items, discount);
      
    case 'buy_x_get_y':
      return calculateBuyXGetY(items, discount);
      
    case 'quantity_discount':
      return calculateQuantityDiscount(items, discount);
      
    case 'spend_x_pay_y':
      return calculateSpendXPayY(items, discount, cartTotal);
      
    default:
      return null;
  }
}

/**
 * 🎯 פונקציה ראשית - חישוב כל ההנחות על הסל
 */
export function calculateDiscounts(
  items: CartItem[],
  discounts: Discount[],
  options: {
    isMember?: boolean;
    shippingAmount?: number;
  } = {}
): CalculationResult {
  const { isMember = false, shippingAmount = 0 } = options;
  
  // חישוב סכום מקורי
  const originalTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  if (originalTotal === 0 || discounts.length === 0) {
    return {
      originalTotal,
      discountTotal: 0,
      finalTotal: originalTotal + shippingAmount,
      freeShipping: false,
      appliedDiscounts: [],
      giftItems: [],
      errors: [],
    };
  }
  
  const appliedDiscounts: DiscountResult[] = [];
  const giftItems: CartItem[] = [];
  const errors: string[] = [];
  let freeShipping = false;
  let totalDiscount = 0;
  let runningTotal = originalTotal;
  
  // מיון הנחות - לא ניתנות לשילוב קודם
  const sortedDiscounts = [...discounts].sort((a, b) => {
    // הנחות שאינן ניתנות לשילוב קודם
    if (!a.stackable && b.stackable) return -1;
    if (a.stackable && !b.stackable) return 1;
    return 0;
  });
  
  let hasNonStackable = false;
  
  for (const discount of sortedDiscounts) {
    // אם כבר יש הנחה שאינה ניתנת לשילוב, דלג על הנחות אחרות
    if (hasNonStackable && discount.stackable) {
      continue;
    }
    
    const result = calculateSingleDiscount(items, discount, runningTotal, isMember);
    
    if (result) {
      appliedDiscounts.push(result);
      totalDiscount += result.amount;
      runningTotal -= result.amount;
      
      if (result.freeShipping) {
        freeShipping = true;
      }
      
      if (result.giftItems) {
        giftItems.push(...result.giftItems);
      }
      
      if (!discount.stackable) {
        hasNonStackable = true;
      }
    }
  }
  
  // וודא שלא עוברים את סכום ההזמנה
  totalDiscount = Math.min(totalDiscount, originalTotal);
  
  const finalTotal = Math.max(0, originalTotal - totalDiscount) + (freeShipping ? 0 : shippingAmount);
  
  return {
    originalTotal,
    discountTotal: totalDiscount,
    finalTotal,
    freeShipping,
    appliedDiscounts,
    giftItems,
    errors,
  };
}

/**
 * בדיקת תקינות הנחה (לטפסים)
 */
export function validateDiscount(discount: Partial<Discount>): string[] {
  const errors: string[] = [];
  
  if (!discount.type) {
    errors.push('חסר סוג הנחה');
    return errors;
  }
  
  switch (discount.type) {
    case 'percentage':
      if (!discount.value || discount.value <= 0 || discount.value > 100) {
        errors.push('אחוז ההנחה חייב להיות בין 1 ל-100');
      }
      break;
      
    case 'fixed_amount':
      if (!discount.value || discount.value <= 0) {
        errors.push('סכום ההנחה חייב להיות גדול מ-0');
      }
      break;
      
    case 'buy_x_pay_y':
      if (!discount.buyQuantity || discount.buyQuantity <= 0) {
        errors.push('כמות הקנייה חייבת להיות גדולה מ-0');
      }
      if (!discount.payAmount || discount.payAmount <= 0) {
        errors.push('סכום התשלום חייב להיות גדול מ-0');
      }
      break;
      
    case 'buy_x_get_y':
      if (!discount.buyQuantity || discount.buyQuantity <= 0) {
        errors.push('כמות הקנייה חייבת להיות גדולה מ-0');
      }
      if (!discount.getQuantity || discount.getQuantity <= 0) {
        errors.push('כמות המתנה חייבת להיות גדולה מ-0');
      }
      break;
      
    case 'quantity_discount':
      if (!discount.quantityTiers || discount.quantityTiers.length === 0) {
        errors.push('חייב להגדיר לפחות מדרגה אחת');
      } else {
        for (const tier of discount.quantityTiers) {
          if (tier.minQuantity <= 0) {
            errors.push('כמות מינימלית חייבת להיות גדולה מ-0');
          }
          if (tier.discountPercent <= 0 || tier.discountPercent > 100) {
            errors.push('אחוז הנחה חייב להיות בין 1 ל-100');
          }
        }
      }
      break;
      
    case 'spend_x_pay_y':
      if (!discount.spendAmount || discount.spendAmount <= 0) {
        errors.push('סכום ההוצאה חייב להיות גדול מ-0');
      }
      if (!discount.payAmount || discount.payAmount <= 0) {
        errors.push('סכום התשלום חייב להיות גדול מ-0');
      }
      if (discount.spendAmount && discount.payAmount && discount.payAmount >= discount.spendAmount) {
        errors.push('סכום התשלום חייב להיות קטן מסכום ההוצאה');
      }
      break;
  }
  
  // בדיקת appliesTo
  if (discount.appliesTo === 'category' && (!discount.categoryIds || discount.categoryIds.length === 0)) {
    errors.push('חייב לבחור לפחות קטגוריה אחת');
  }
  if (discount.appliesTo === 'product' && (!discount.productIds || discount.productIds.length === 0)) {
    errors.push('חייב לבחור לפחות מוצר אחד');
  }
  
  return errors;
}

/**
 * המרת הנחה מה-DB לפורמט המנוע
 */
export function dbDiscountToEngine(dbDiscount: {
  id: string;
  code?: string | null;
  title?: string | null;
  type: string;
  value: string | number;
  appliesTo?: string | null;
  categoryIds?: unknown;
  productIds?: unknown;
  excludeCategoryIds?: unknown;
  excludeProductIds?: unknown;
  minimumAmount?: string | number | null;
  minimumQuantity?: number | null;
  stackable?: boolean;
  buyQuantity?: number | null;
  payAmount?: string | number | null;
  getQuantity?: number | null;
  giftProductIds?: unknown;
  giftSameProduct?: boolean | null;
  quantityTiers?: unknown;
  spendAmount?: string | number | null;
}): Discount {
  return {
    id: dbDiscount.id,
    code: dbDiscount.code || undefined,
    title: dbDiscount.title,
    type: dbDiscount.type as DiscountType,
    value: Number(dbDiscount.value) || 0,
    appliesTo: (dbDiscount.appliesTo as AppliesTo) || 'all',
    categoryIds: (dbDiscount.categoryIds as string[]) || [],
    productIds: (dbDiscount.productIds as string[]) || [],
    excludeCategoryIds: (dbDiscount.excludeCategoryIds as string[]) || [],
    excludeProductIds: (dbDiscount.excludeProductIds as string[]) || [],
    minimumAmount: dbDiscount.minimumAmount ? Number(dbDiscount.minimumAmount) : null,
    minimumQuantity: dbDiscount.minimumQuantity || null,
    stackable: dbDiscount.stackable ?? true,
    buyQuantity: dbDiscount.buyQuantity || null,
    payAmount: dbDiscount.payAmount ? Number(dbDiscount.payAmount) : null,
    getQuantity: dbDiscount.getQuantity || null,
    giftProductIds: (dbDiscount.giftProductIds as string[]) || [],
    giftSameProduct: dbDiscount.giftSameProduct ?? true,
    quantityTiers: (dbDiscount.quantityTiers as QuantityTier[]) || [],
    spendAmount: dbDiscount.spendAmount ? Number(dbDiscount.spendAmount) : null,
  };
}

/**
 * תיאור ההנחה בעברית
 */
export function getDiscountDescription(discount: Discount): string {
  switch (discount.type) {
    case 'percentage':
      return `${discount.value}% הנחה`;
    case 'fixed_amount':
      return `₪${discount.value} הנחה`;
    case 'free_shipping':
      return 'משלוח חינם';
    case 'buy_x_pay_y':
      return `קנה ${discount.buyQuantity} שלם ₪${discount.payAmount}`;
    case 'buy_x_get_y':
      return `קנה ${discount.buyQuantity} קבל ${discount.getQuantity} חינם`;
    case 'quantity_discount':
      const tiers = discount.quantityTiers || [];
      if (tiers.length === 0) return 'הנחות כמות';
      const first = tiers[0];
      return `קנה ${first.minQuantity}+ קבל ${first.discountPercent}% הנחה`;
    case 'spend_x_pay_y':
      return `קנה ב-₪${discount.spendAmount} שלם ₪${discount.payAmount}`;
    default:
      return 'הנחה';
  }
}

