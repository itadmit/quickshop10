'use client';

import { useEffect } from 'react';
import { useStoreOptional } from '@/lib/store-context';

/**
 * Client component to clear cart AND coupons from localStorage after successful order
 * Uses store context to clear store-specific cart (each store has its own localStorage key)
 */
export function ClearCartOnLoad() {
  const store = useStoreOptional();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear cart state via context (uses store-specific key: quickshop_cart_{slug})
      if (store?.clearCart) {
        store.clearCart();
      }
      
      // Clear coupons state via context (uses store-specific key: quickshop_coupons_{slug})
      if (store?.clearCoupons) {
        store.clearCoupons();
      }
      
      // Also clear legacy global keys for migration
      localStorage.removeItem('quickshop_cart');
      localStorage.removeItem('quickshop_coupons');
      localStorage.removeItem('quickshop_last_order');
    }
  }, [store]);

  return null;
}


