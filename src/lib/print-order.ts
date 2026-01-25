/**
 * פונקציית הדפסת הזמנות - פותחת חלון הדפסה נפרד
 * 
 * @param storeSlug - slug של החנות
 * @param orderIds - מערך של מזהי הזמנות להדפסה
 */
export function printOrders(storeSlug: string, orderIds: string[]) {
  if (orderIds.length === 0) return;
  
  const idsParam = orderIds.join(',');
  const printUrl = `/api/shops/${storeSlug}/orders/print?ids=${idsParam}`;
  
  // פתיחת חלון הדפסה קטן
  const printWindow = window.open(
    printUrl,
    'print-orders',
    'width=800,height=600,menubar=no,toolbar=no,location=no,status=no'
  );
  
  if (!printWindow) {
    // אם popups חסומים, פתח בטאב חדש
    window.open(printUrl, '_blank');
  }
}

/**
 * הדפסת הזמנה בודדת
 */
export function printOrder(storeSlug: string, orderId: string) {
  printOrders(storeSlug, [orderId]);
}





