'use client';

import { useEffect, useRef } from 'react';
import { useStoreOptional } from '@/lib/store-context';

/**
 * Client component to clear cart AND coupons from localStorage after successful order
 * Uses store context to clear store-specific cart (each store has its own localStorage key)
 * 
 * IMPORTANT: Must wait for isHydrated to be true before clearing!
 * Otherwise we clear an empty cart, then the real cart loads from localStorage.
 */
export function ClearCartOnLoad() {
  const store = useStoreOptional();
  const hasCleared = useRef(false);
  
  useEffect(() => {
    // Only clear once, prevent infinite loop
    if (hasCleared.current) return;
    if (typeof window === 'undefined') return;
    
    // CRITICAL: Wait for store to be FULLY HYDRATED before clearing!
    // This prevents the race condition where:
    // 1. clearCart runs on empty initial state
    // 2. THEN localStorage cart gets loaded
    // 3. Cart appears non-empty on thank you page
    if (!store?.isHydrated) {
      return; // Effect will re-run when isHydrated changes to true
    }
    
    if (!store?.clearCart || !store?.clearCoupons) {
      return; // Effect will re-run when store becomes available
    }
    
    // Mark as cleared AFTER we confirm store is hydrated
    hasCleared.current = true;
    
    // Clear cart state via context (uses store-specific key: quickshop_cart_{slug})
    store.clearCart();
    
    // Clear coupons state via context (uses store-specific key: quickshop_coupons_{slug})
    store.clearCoupons();
    
    // Also clear legacy global keys for migration
    localStorage.removeItem('quickshop_cart');
    localStorage.removeItem('quickshop_coupons');
    localStorage.removeItem('quickshop_last_order');
    
    console.log('[ClearCartOnLoad] Cart and coupons cleared successfully (after hydration)');
  }, [store?.isHydrated, store?.clearCart, store?.clearCoupons]);

  return null;
}


