'use client';

import { useEffect } from 'react';

/**
 * Client component to clear cart from localStorage after successful order
 */
export function ClearCartOnLoad() {
  useEffect(() => {
    // Clear cart from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('quickshop-cart');
      localStorage.removeItem('quickshop_last_order');
    }
  }, []);

  return null;
}

