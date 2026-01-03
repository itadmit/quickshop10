'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// ============ TYPES ============

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variantTitle?: string;
}

interface StoreContextType {
  // Cart state
  cart: CartItem[];
  cartOpen: boolean;
  cartTotal: number;
  cartCount: number;
  isHydrated: boolean;
  
  // Cart actions
  addToCart: (item: Omit<CartItem, 'id' | 'quantity'>, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

// ============ CONTEXT ============

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// ============ LOCAL STORAGE ============

const CART_KEY = 'quickshop_cart';

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

// ============ PROVIDER ============

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    setCart(loadCart());
    setMounted(true);
    
    // Listen for cart-updated events from other components (e.g., StoryViewer)
    const handleCartUpdate = () => {
      setCart(loadCart());
      setCartOpen(true);
    };
    
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    if (mounted) {
      saveCart(cart);
    }
  }, [cart, mounted]);

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

  const toggleCart = useCallback(() => setCartOpen(prev => !prev), []);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  return (
    <StoreContext.Provider value={{
      cart,
      cartOpen,
      cartTotal,
      cartCount,
      isHydrated: mounted,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      toggleCart,
      openCart,
      closeCart,
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

