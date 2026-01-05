'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// ============ TYPES ============

// הגדרות תצוגת חנות
export interface StoreDisplaySettings {
  showDecimalPrices: boolean;
  currency: string;
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
  // מוצר במתנה מקופון
  isGift?: boolean;
  giftFromCouponId?: string; // ID של הקופון שהביא את המתנה
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
}

interface StoreContextType {
  // Store settings
  storeSettings: StoreDisplaySettings;
  
  // Cart state
  cart: CartItem[];
  cartOpen: boolean;
  cartTotal: number;
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

const CART_KEY = 'quickshop_cart';
const COUPONS_KEY = 'quickshop_coupons';

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function loadCoupons(): AppliedCoupon[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(COUPONS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCoupons(coupons: AppliedCoupon[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
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
}

export function StoreProvider({ children, initialSettings }: StoreProviderProps) {
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
    setCart(loadCart());
    setAppliedCoupons(loadCoupons());
    // טעינת הגדרות מ-localStorage
    const savedSettings = loadSettings();
    setStoreSettings({
      showDecimalPrices: initialSettings?.showDecimalPrices ?? savedSettings.showDecimalPrices,
      currency: initialSettings?.currency ?? savedSettings.currency,
    });
    setMounted(true);
    
    // Listen for cart-updated events from other components (e.g., StoryViewer)
    const handleCartUpdate = () => {
      setCart(loadCart());
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
  }, [initialSettings?.showDecimalPrices, initialSettings?.currency]);

  // Save cart to localStorage on change
  useEffect(() => {
    if (mounted) {
      saveCart(cart);
    }
  }, [cart, mounted]);
  
  // Save coupons to localStorage on change
  useEffect(() => {
    if (mounted) {
      saveCoupons(appliedCoupons);
    }
  }, [appliedCoupons, mounted]);

  // Computed values
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Actions
  const addToCart = useCallback((item: Omit<CartItem, 'id' | 'quantity'>, quantity = 1) => {
    setCart(prev => {
      // Match by productId AND variantId (for products with variants)
      const existing = prev.find(i => 
        i.productId === item.productId && i.variantId === item.variantId
      );
      if (existing) {
        return prev.map(i => 
          (i.productId === item.productId && i.variantId === item.variantId)
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
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
      setCart(prev => prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      ));
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

