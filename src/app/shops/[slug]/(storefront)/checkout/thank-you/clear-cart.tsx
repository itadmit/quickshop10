'use client';

import { useEffect } from 'react';
import { useStoreOptional } from '@/lib/store-context';

/**
 * Client component to clear cart from localStorage after successful order
 */
export function ClearCartOnLoad() {
  const store = useStoreOptional();
  
  useEffect(() => {
    // Clear cart from localStorage
    // Note: Must match the key in store-context.tsx (CART_KEY = 'quickshop_cart')
    if (typeof window !== 'undefined') {
      localStorage.removeItem('quickshop_cart'); // Main cart key (underscore!)
      localStorage.removeItem('quickshop-cart'); // Legacy key (hyphen) - just in case
      localStorage.removeItem('quickshop_last_order');
      console.log('Cart cleared from localStorage');
      
      // Also clear the React state if store context is available
      if (store?.clearCart) {
        store.clearCart();
        console.log('Cart state cleared');
      }
    }
  }, [store]);

  return null;
}

