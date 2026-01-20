'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toggleWishlist, mergeGuestWishlist, getWishlistProductIds } from '@/lib/actions/wishlist';

// localStorage key
const STORAGE_KEY = 'quickshop_wishlist';

interface WishlistContextValue {
  // State
  items: string[]; // Product IDs in wishlist
  count: number;
  isLoading: boolean;
  
  // Actions
  toggle: (productId: string, variantId?: string | null) => Promise<boolean>; // Returns new isInWishlist state
  isInWishlist: (productId: string) => boolean;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

interface WishlistProviderProps {
  children: ReactNode;
  storeId: string;
  customerId?: string | null; // Null for guests
  initialItems?: string[]; // Pre-loaded items for logged-in users
}

export function WishlistProvider({ 
  children, 
  storeId, 
  customerId,
  initialItems = [],
}: WishlistProviderProps) {
  const [items, setItems] = useState<string[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage for guests
  useEffect(() => {
    if (!customerId) {
      // Guest: load from localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        }
      } catch {
        // Ignore errors
      }
    } else if (initialItems.length === 0) {
      // Logged in but no initial items - fetch from DB
      getWishlistProductIds(customerId).then(setItems);
    }
    setIsHydrated(true);
  }, [customerId, initialItems]);

  // Save to localStorage for guests
  useEffect(() => {
    if (isHydrated && !customerId) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {
        // Ignore errors
      }
    }
  }, [items, customerId, isHydrated]);

  // Merge guest wishlist when user logs in
  useEffect(() => {
    if (isHydrated && customerId) {
      // Check if there's a guest wishlist to merge
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const guestItems = JSON.parse(saved);
          if (Array.isArray(guestItems) && guestItems.length > 0) {
            // Merge and clear localStorage
            mergeGuestWishlist(
              storeId, 
              customerId, 
              guestItems.map(productId => ({ productId }))
            ).then(() => {
              localStorage.removeItem(STORAGE_KEY);
              // Refresh items
              getWishlistProductIds(customerId).then(setItems);
            });
          }
        }
      } catch {
        // Ignore errors
      }
    }
  }, [customerId, storeId, isHydrated]);

  const toggle = useCallback(async (productId: string, variantId?: string | null): Promise<boolean> => {
    const isCurrentlyIn = items.includes(productId);
    
    // Optimistic update
    if (isCurrentlyIn) {
      setItems(prev => prev.filter(id => id !== productId));
    } else {
      setItems(prev => [...prev, productId]);
    }

    if (customerId) {
      // Logged in: update DB
      setIsLoading(true);
      try {
        const result = await toggleWishlist(storeId, customerId, productId, variantId);
        if (!result.success) {
          // Revert optimistic update
          if (isCurrentlyIn) {
            setItems(prev => [...prev, productId]);
          } else {
            setItems(prev => prev.filter(id => id !== productId));
          }
          return isCurrentlyIn;
        }
        return result.isInWishlist;
      } finally {
        setIsLoading(false);
      }
    } else {
      // Guest: already updated localStorage via effect
      return !isCurrentlyIn;
    }
  }, [items, customerId, storeId]);

  const isInWishlist = useCallback((productId: string): boolean => {
    return items.includes(productId);
  }, [items]);

  const refresh = useCallback(async () => {
    if (customerId) {
      const freshItems = await getWishlistProductIds(customerId);
      setItems(freshItems);
    }
  }, [customerId]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        count: items.length,
        isLoading,
        toggle,
        isInWishlist,
        refresh,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

// Optional hook that won't throw if not in provider (for components that might be outside)
export function useWishlistOptional(): WishlistContextValue | null {
  return useContext(WishlistContext);
}

