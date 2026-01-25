/**
 * פונקציות עזר לניהול מלאי
 * קובץ זה הוא Server-safe ואפשר לייבא אותו מכל מקום
 */

/**
 * בדיקה אם מוצר אזל מהמלאי
 * מוצר אזל אם: עוקבים אחרי מלאי + מלאי <= 0 + לא מאפשרים הזמנה ללא מלאי
 */
export function isOutOfStock(
  trackInventory: boolean = true,
  inventory: number | null | undefined,
  allowBackorder: boolean = false
): boolean {
  // אם לא עוקבים אחרי מלאי - תמיד זמין
  if (!trackInventory) return false;
  // אם מאפשרים הזמנה ללא מלאי - תמיד זמין
  if (allowBackorder) return false;
  // אחרת - בדוק אם יש מלאי
  return inventory !== null && inventory !== undefined && inventory <= 0;
}

/**
 * קבלת טקסט סטטוס מלאי
 */
export function getStockStatusText(
  trackInventory: boolean = true,
  inventory: number | null | undefined,
  allowBackorder: boolean = false
): { text: string; color: 'red' | 'green' | 'gray' } {
  const outOfStock = isOutOfStock(trackInventory, inventory, allowBackorder);
  
  if (outOfStock) {
    return { text: 'אזל מהמלאי', color: 'red' };
  }
  
  if (trackInventory && inventory !== null && inventory !== undefined && inventory > 0) {
    return { text: `${inventory} יחידות במלאי`, color: 'gray' };
  }
  
  return { text: 'במלאי', color: 'green' };
}





