'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { getAutomaticDiscounts, type AutomaticDiscountResult } from '@/app/actions/automatic-discount';
import { calculateDiscounts, type CartItem as EngineCartItem, type Discount } from '@/lib/discount-engine';

// ============ TYPES ============

// הגדרות תצוגת חנות
export interface StoreDisplaySettings {
  showDecimalPrices: boolean;
  currency: string;
}

// פרטי גיפט קארד (לפריט וירטואלי בעגלה)
export interface GiftCardCartDetails {
  recipientName: string;
  recipientEmail: string;
  senderName?: string;
  message?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variantTitle?: string;
  sku?: string; // מק"ט מוצר/וריאנט
  // Bundle support
  isBundle?: boolean;
  // מלאי - לבדיקה מקומית מהירה (ללא קריאה לשרת!)
  maxQuantity?: number | null; // null = אין מעקב מלאי
  trackInventory?: boolean;
  // מוצר במתנה מקופון
  isGift?: boolean;
  giftFromCouponId?: string; // ID של הקופון שהביא את המתנה
  // הנחה אוטומטית - שם ההנחה לתצוגה בעגלה
  automaticDiscountName?: string;
  automaticDiscountNames?: string[]; // 🆕 Multiple discounts support
  // מחיר מוזל לתצוגה בעגלה (החישוב האמיתי בצ'קאאוט)
  discountedPrice?: number;
  // קטגוריות המוצר - לחישוב הנחות בצ'קאאוט
  categoryIds?: string[];
  // תוספות מותאמות (addons)
  addons?: Array<{
    addonId: string;
    name: string;
    value: string;
    displayValue: string;
    priceAdjustment: number;
  }>;
  addonTotal?: number;
  // 🎁 גיפט קארד - מוצר וירטואלי
  isGiftCard?: boolean;
  giftCardDetails?: GiftCardCartDetails;
}

// קופון מוחל
export interface AppliedCoupon {
  id: string;
  code: string;
  title?: string | null;
  type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_pay_y' | 'buy_x_get_y' | 'gift_product' | 'quantity_discount' | 'spend_x_pay_y' | 'gift_card';
  value: number;
  appliesTo?: 'all' | 'category' | 'product' | 'member';
  categoryIds?: string[];
  productIds?: string[];
  excludeCategoryIds?: string[];
  excludeProductIds?: string[];
  stackable: boolean;
  minimumAmount?: number | null;
  minimumQuantity?: number | null;
  buyQuantity?: number | null;
  payAmount?: number | null;
  getQuantity?: number | null;
  giftProductIds?: string[];
  giftSameProduct?: boolean;
  quantityTiers?: Array<{ minQuantity: number; discountPercent: number }>;
  spendAmount?: number | null;
  // Gift card specific
  isGiftCard?: boolean;
  giftCardBalance?: number;
  // קופון מתנה מופעל - שמירת הקופון שהפעיל אותו
  triggeredByCode?: string;
}

interface StoreContextType {
  // Store settings
  storeSettings: StoreDisplaySettings;
  
  // Cart state
  cart: CartItem[];
  cartOpen: boolean;
  cartTotal: number;          // Final price after discounts (calculated via discount engine)
  cartOriginalTotal: number;  // ALWAYS original price (for checkout calculations)
  cartDiscountAmount: number; // Total discount amount from automatic discounts
  cartCount: number;
  isHydrated: boolean;
  
  // Coupons state
  appliedCoupons: AppliedCoupon[];
  
  // Cart actions
  addToCart: (item: Omit<CartItem, 'id' | 'quantity'>, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  // ניהול מוצרי מתנה
  addGiftItem: (item: Omit<CartItem, 'id' | 'quantity'>, couponId: string, quantity?: number) => void;
  removeGiftItemsByCoupon: (couponId: string) => void;
  
  // Coupon actions
  addCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: (couponId: string) => void;
  clearCoupons: () => void;
  
  // Price formatting helper
  formatPrice: (price: number | string | null | undefined) => string;
}

// ============ CONTEXT ============

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// ============ LOCAL STORAGE ============
// Keys are now store-specific to prevent cart sharing between stores

function getCartKey(storeSlug: string) {
  return `quickshop_cart_${storeSlug}`;
}

function getCouponsKey(storeSlug: string) {
  return `quickshop_coupons_${storeSlug}`;
}

function loadCart(storeSlug: string): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(getCartKey(storeSlug));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[], storeSlug: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getCartKey(storeSlug), JSON.stringify(cart));
}

function loadCoupons(storeSlug: string): AppliedCoupon[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(getCouponsKey(storeSlug));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCoupons(coupons: AppliedCoupon[], storeSlug: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getCouponsKey(storeSlug), JSON.stringify(coupons));
}

// ============ SETTINGS STORAGE ============

const SETTINGS_KEY = 'quickshop_settings';

function loadSettings(): StoreDisplaySettings {
  if (typeof window === 'undefined') {
    return { showDecimalPrices: false, currency: 'ILS' };
  }
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : { showDecimalPrices: false, currency: 'ILS' };
  } catch {
    return { showDecimalPrices: false, currency: 'ILS' };
  }
}

function saveSettings(settings: StoreDisplaySettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ============ PROVIDER ============

interface StoreProviderProps {
  children: ReactNode;
  initialSettings?: Partial<StoreDisplaySettings>;
  storeSlug: string; // Required - each store has its own cart
}

export function StoreProvider({ children, initialSettings, storeSlug }: StoreProviderProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreDisplaySettings>({
    showDecimalPrices: initialSettings?.showDecimalPrices ?? false,
    currency: initialSettings?.currency ?? 'ILS',
  });

  // Load cart, coupons, and settings from localStorage on mount
  useEffect(() => {
    setCart(loadCart(storeSlug));
    setAppliedCoupons(loadCoupons(storeSlug));
    // טעינת הגדרות מ-localStorage
    const savedSettings = loadSettings();
    setStoreSettings({
      showDecimalPrices: initialSettings?.showDecimalPrices ?? savedSettings.showDecimalPrices,
      currency: initialSettings?.currency ?? savedSettings.currency,
    });
    setMounted(true);
    
    // Listen for cart-updated events from other components (e.g., StoryViewer)
    const handleCartUpdate = () => {
      setCart(loadCart(storeSlug));
      setCartOpen(true);
    };
    
    // Listen for store settings updates from StoreSettingsProvider
    const handleSettingsUpdate = (event: CustomEvent<{ showDecimalPrices: boolean; currency: string }>) => {
      setStoreSettings(event.detail);
    };
    
    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('store-settings-updated', handleSettingsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('store-settings-updated', handleSettingsUpdate as EventListener);
    };
  }, [initialSettings?.showDecimalPrices, initialSettings?.currency, storeSlug]);

  // Save cart to localStorage on change
  useEffect(() => {
    if (mounted) {
      saveCart(cart, storeSlug);
    }
  }, [cart, mounted, storeSlug]);
  
  // Save coupons to localStorage on change
  useEffect(() => {
    if (mounted) {
      saveCoupons(appliedCoupons, storeSlug);
    }
  }, [appliedCoupons, mounted, storeSlug]);

  // Computed values
  // cartOriginalTotal - ALWAYS uses original price (for checkout calculations)
  // 🆕 Now includes addon totals!
  const cartOriginalTotal = cart.reduce((sum, item) => {
    const basePrice = item.price * item.quantity;
    const addonPrice = (item.addonTotal || 0) * item.quantity;
    return sum + basePrice + addonPrice;
  }, 0);
  // cartTotal - uses discountedPrice if available (for cart sidebar UI display only)
  // 🆕 Now includes addon totals!
  const cartTotal = cart.reduce((sum, item) => {
    const effectivePrice = item.discountedPrice ?? item.price;
    const addonPrice = item.addonTotal || 0;
    return sum + (effectivePrice + addonPrice) * item.quantity;
  }, 0);
  const cartDiscountAmount = cartOriginalTotal - cartTotal;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Actions
  const addToCart = useCallback((item: Omit<CartItem, 'id' | 'quantity'>, quantity = 1) => {
    setCart(prev => {
      // 🎁 Gift cards are always unique items (different recipient details)
      // Never merge gift cards - each is a separate item
      if (item.isGiftCard) {
        return [...prev, { ...item, id: crypto.randomUUID(), quantity: 1 }];
      }
      
      // Match by productId AND variantId (for products with variants)
      const existing = prev.find(i => 
        i.productId === item.productId && i.variantId === item.variantId
      );
      
      if (existing) {
        // בדיקת מלאי מקומית - מהירה! ⚡
        const newQty = existing.quantity + quantity;
        const maxQty = existing.maxQuantity ?? item.maxQuantity;
        const trackInv = existing.trackInventory ?? item.trackInventory;
        
        // אם יש מעקב מלאי ויש מקסימום - לא לעבור אותו
        if (trackInv && maxQty !== null && maxQty !== undefined && newQty > maxQty) {
          return prev; // לא להוסיף - חרגנו מהמלאי
        }
        
        return prev.map(i => 
          (i.productId === item.productId && i.variantId === item.variantId)
            ? { ...i, quantity: newQty }
            : i
        );
      }
      
      // פריט חדש - בדיקה שלא מוסיפים יותר מהמלאי
      if (item.trackInventory && item.maxQuantity !== null && item.maxQuantity !== undefined && quantity > item.maxQuantity) {
        return [...prev, { ...item, id: crypto.randomUUID(), quantity: item.maxQuantity }];
      }
      
      return [...prev, { ...item, id: crypto.randomUUID(), quantity }];
    });
    setCartOpen(true);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      setCart(prev => prev.map(item => {
        if (item.id !== id) return item;
        
        // בדיקת מלאי מקומית - מהירה! ⚡
        if (item.trackInventory && item.maxQuantity !== null && item.maxQuantity !== undefined) {
          const clampedQty = Math.min(quantity, item.maxQuantity);
          return { ...item, quantity: clampedQty };
        }
        
        return { ...item, quantity };
      }));
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // הוספת מוצר במתנה מקופון
  const addGiftItem = useCallback((item: Omit<CartItem, 'id' | 'quantity'>, couponId: string, quantity = 1) => {
    setCart(prev => {
      // בדיקה אם כבר יש מוצר מתנה מאותו קופון
      const existingGift = prev.find(i => 
        i.isGift && 
        i.giftFromCouponId === couponId && 
        i.productId === item.productId && 
        i.variantId === item.variantId
      );
      
      if (existingGift) {
        // עדכון כמות אם כבר קיים
        return prev.map(i => 
          i.id === existingGift.id 
            ? { ...i, quantity: quantity } // עדכון לכמות החדשה (לא הוספה)
            : i
        );
      }
      
      // הוספת מוצר מתנה חדש
      return [...prev, { 
        ...item, 
        id: `gift-${couponId}-${crypto.randomUUID()}`, 
        quantity,
        price: 0, // מחיר 0 למוצר מתנה
        isGift: true,
        giftFromCouponId: couponId,
      }];
    });
  }, []);

  // מחיקת כל מוצרי המתנה מקופון מסוים
  const removeGiftItemsByCoupon = useCallback((couponId: string) => {
    setCart(prev => prev.filter(item => 
      !(item.isGift && item.giftFromCouponId === couponId)
    ));
  }, []);

  const toggleCart = useCallback(() => setCartOpen(prev => !prev), []);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  
  // Coupon actions
  const addCoupon = useCallback((coupon: AppliedCoupon) => {
    setAppliedCoupons(prev => {
      // בדיקה אם הקופון כבר קיים
      if (prev.some(c => c.id === coupon.id)) {
        return prev;
      }
      return [...prev, coupon];
    });
  }, []);
  
  const removeCoupon = useCallback((couponId: string) => {
    setAppliedCoupons(prev => prev.filter(c => c.id !== couponId));
    // מחיקת מוצרי מתנה של הקופון
    removeGiftItemsByCoupon(couponId);
  }, [removeGiftItemsByCoupon]);
  
  const clearCoupons = useCallback(() => {
    // מחיקת כל מוצרי המתנה
    setCart(prev => prev.filter(item => !item.isGift));
    setAppliedCoupons([]);
  }, []);

  // פונקציית עזר לפורמט מחירים
  const formatPrice = useCallback((price: number | string | null | undefined): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : (price ?? 0);
    if (isNaN(numPrice)) {
      return storeSettings.showDecimalPrices ? '₪0.00' : '₪0';
    }
    
    const symbol = storeSettings.currency === 'USD' ? '$' : 
                   storeSettings.currency === 'EUR' ? '€' : '₪';
    
    if (storeSettings.showDecimalPrices) {
      return `${symbol}${numPrice.toFixed(2)}`;
    } else {
      return `${symbol}${Math.round(numPrice)}`;
    }
  }, [storeSettings.showDecimalPrices, storeSettings.currency]);

  return (
    <StoreContext.Provider value={{
      storeSettings,
      cart,
      cartOpen,
      cartTotal,
      cartOriginalTotal,
      cartDiscountAmount,
      cartCount,
      isHydrated: mounted,
      appliedCoupons,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      toggleCart,
      openCart,
      closeCart,
      addGiftItem,
      removeGiftItemsByCoupon,
      addCoupon,
      removeCoupon,
      clearCoupons,
      formatPrice,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

// ============ HOOKS ============

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

// Safe version that returns null if not in provider (for SSR safety)
export function useStoreOptional() {
  return useContext(StoreContext);
}

