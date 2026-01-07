'use client';

import { useEffect, useRef } from 'react';
import { useStoreOptional } from '@/lib/store-context';

/**
 * Client component to clear cart AND coupons from localStorage after successful order
 * Uses store context to clear store-specific cart (each store has its own localStorage key)
 */
export function ClearCartOnLoad() {
  const store = useStoreOptional();
  const hasCleared = useRef(false);
  
  useEffect(() => {
    // Only clear once, prevent infinite loop
    if (hasCleared.current) return;
    if (typeof window === 'undefined') return;
    
    // IMPORTANT: Wait for store context to be ready before clearing
    // Don't mark as cleared until we actually have the methods available
    if (!store?.clearCart || !store?.clearCoupons) {
      return; // Effect will re-run when store becomes available
    }
    
    // Mark as cleared AFTER we confirm store is available
    hasCleared.current = true;
    
    // Clear cart state via context (uses store-specific key: quickshop_cart_{slug})
    store.clearCart();
    
    // Clear coupons state via context (uses store-specific key: quickshop_coupons_{slug})
    store.clearCoupons();
    
    // Also clear legacy global keys for migration
    localStorage.removeItem('quickshop_cart');
    localStorage.removeItem('quickshop_coupons');
    localStorage.removeItem('quickshop_last_order');
    
    console.log('[ClearCartOnLoad] Cart and coupons cleared successfully');
  }, [store?.clearCart, store?.clearCoupons]);

  return null;
}


