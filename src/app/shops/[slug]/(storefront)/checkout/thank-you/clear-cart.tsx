'use client';

import { useEffect } from 'react';
import { useStoreOptional } from '@/lib/store-context';

/**
 * Client component to clear cart AND coupons from localStorage after successful order
 */
export function ClearCartOnLoad() {
  const store = useStoreOptional();
  
  useEffect(() => {
    // Clear cart and coupons from localStorage
    // Note: Keys must match store-context.tsx (CART_KEY, COUPONS_KEY)
    if (typeof window !== 'undefined') {
      // Clear cart
      localStorage.removeItem('quickshop_cart'); // Main cart key
      localStorage.removeItem('quickshop-cart'); // Legacy key (hyphen) - just in case
      localStorage.removeItem('quickshop_last_order');
      
      // Clear coupons
      localStorage.removeItem('quickshop_coupons');
      
      console.log('Cart and coupons cleared from localStorage');
      
      // Also clear the React state if store context is available
      if (store?.clearCart) {
        store.clearCart();
        console.log('Cart state cleared');
      }
      if (store?.clearCoupons) {
        store.clearCoupons();
        console.log('Coupons state cleared');
      }
    }
  }, [store]);

  return null;
}


