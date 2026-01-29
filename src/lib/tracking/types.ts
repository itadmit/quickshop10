/**
 * QuickShop Unified Tracking System
 * 
 * 14 E-commerce Events - More than Shopify!
 * Supports: Facebook Pixel, Google Analytics 4, TikTok Pixel, GTM
 * Includes: Server-Side Tracking (Conversions API)
 */

// ============================================
// TRACKING EVENT TYPES (14 Events)
// ============================================

export type TrackingEventType =
  // Page Events
  | 'PageView'           // 1. צפייה בכל דף
  | 'ViewHomePage'       // 2. צפייה בדף הבית
  | 'Search'             // 3. חיפוש
  | 'ViewCategory'       // 4. צפייה בקטגוריה
  | 'ViewContent'        // 5. צפייה במוצר
  
  // Cart Events
  | 'AddToCart'          // 6. הוספה לסל
  | 'RemoveFromCart'     // 7. הסרה מסל
  | 'UpdateCart'         // 8. עדכון כמות
  
  // Checkout Events
  | 'InitiateCheckout'   // 9. התחלת תשלום
  | 'AddShippingInfo'    // 10. הזנת פרטי משלוח
  | 'AddPaymentInfo'     // 11. הזנת פרטי תשלום
  | 'Purchase'           // 12. רכישה מוצלחת
  
  // User Events
  | 'CompleteRegistration' // 13. הרשמה
  | 'Contact';             // 14. יצירת קשר

// ============================================
// EVENT DATA STRUCTURES
// ============================================

export interface ProductData {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  category?: string;
  variant?: string;
  quantity?: number;
  image?: string;
}

export interface CartData {
  items: ProductData[];
  totalValue: number;
  itemCount: number;
  currency?: string;
}

export interface OrderData {
  orderId: string;
  orderNumber: string;
  value: number;
  currency: string;
  items: ProductData[];
  shippingCost?: number;
  taxAmount?: number;
  discountAmount?: number;
  couponCode?: string;
  paymentMethod?: string;
}

export interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
  city?: string;
  country?: string;
}

export interface SearchData {
  query: string;
  resultsCount?: number;
  categoryId?: string;
}

// Event payloads for each event type
export interface TrackingEventPayload {
  PageView: { url: string; title?: string };
  ViewHomePage: { url: string };
  Search: SearchData;
  ViewCategory: { categoryId: string; categoryName: string; productsCount?: number };
  ViewContent: ProductData;
  AddToCart: ProductData & { quantity: number };
  RemoveFromCart: ProductData & { quantity: number };
  UpdateCart: { productId: string; oldQuantity: number; newQuantity: number };
  InitiateCheckout: CartData;
  AddShippingInfo: CartData & { shippingMethod?: string };
  AddPaymentInfo: CartData & { paymentMethod?: string };
  Purchase: OrderData;
  CompleteRegistration: { method: 'email' | 'google' | 'phone' };
  Contact: { subject?: string };
}

// ============================================
// PROVIDER CONFIGURATION
// ============================================

export interface TrackingConfig {
  storeId: string;
  storeSlug: string;
  currency: string;
  
  // Facebook Pixel
  facebookPixelId?: string;
  facebookPixelEnabled: boolean;
  facebookAccessToken?: string; // For Conversions API
  
  // Google Analytics 4
  googleAnalyticsId?: string;
  googleAnalyticsEnabled: boolean;
  googleApiSecret?: string; // For Measurement Protocol
  
  // Google Tag Manager
  gtmContainerId?: string;
  gtmEnabled: boolean;
  
  // TikTok Pixel
  tiktokPixelId?: string;
  tiktokPixelEnabled: boolean;
  tiktokAccessToken?: string; // For Events API
  
  // Server-Side Tracking
  serverSideEnabled: boolean;
}

// ============================================
// SERVER-SIDE TRACKING
// ============================================

export interface ServerEventData {
  eventName: TrackingEventType;
  eventTime: number;
  eventId: string;
  userData: {
    email?: string;
    phone?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbc?: string; // Facebook click ID
    fbp?: string; // Facebook browser ID
    externalId?: string;
  };
  customData: Record<string, unknown>;
  eventSourceUrl: string;
  actionSource: 'website' | 'app' | 'email';
}

// ============================================
// TRACKING CONTEXT
// ============================================

export interface TrackingContext {
  config: TrackingConfig;
  track: <T extends TrackingEventType>(
    eventType: T,
    payload: TrackingEventPayload[T],
    userData?: UserData
  ) => void;
}










