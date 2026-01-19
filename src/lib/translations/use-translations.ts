/**
 * Translation Hook & Helpers for Client Components
 * 
 * These helpers provide easy access to translations in client components
 * with automatic fallback to Hebrew defaults.
 * 
 * Usage:
 * ```tsx
 * // In client component - receive translations from server
 * function CheckoutForm({ translations }: { translations?: CheckoutTranslations }) {
 *   const t = useCheckoutTranslations(translations);
 *   return <h1>{t.title}</h1>; // Works with or without translations prop
 * }
 * ```
 */

import { useMemo } from 'react';
import { hebrewTranslations } from './defaults/he';
import { deepMerge, type DeepObject } from './utils/deep-merge';
import type { 
  UITranslations, 
  CheckoutTranslations, 
  CartTranslations, 
  ProductTranslations,
  GeneralTranslations,
  AccountTranslations,
  FooterTranslations,
  OrderStatusTranslations,
  DeepPartial
} from './types';

// Re-export types for convenience
export type { CheckoutTranslations, CartTranslations } from './types';

// ============================================
// Section-Specific Hooks
// ============================================

/**
 * Hook for checkout translations with Hebrew fallback
 */
export function useCheckoutTranslations(
  overrides?: DeepPartial<CheckoutTranslations> | null
): CheckoutTranslations {
  return useMemo(() => {
    if (!overrides) return hebrewTranslations.checkout;
    return deepMerge(
      hebrewTranslations.checkout as unknown as DeepObject, 
      overrides as unknown as DeepObject
    ) as unknown as CheckoutTranslations;
  }, [overrides]);
}

/**
 * Hook for cart translations with Hebrew fallback
 */
export function useCartTranslations(
  overrides?: DeepPartial<CartTranslations> | null
): CartTranslations {
  return useMemo(() => {
    if (!overrides) return hebrewTranslations.cart;
    return deepMerge(
      hebrewTranslations.cart as unknown as DeepObject, 
      overrides as unknown as DeepObject
    ) as unknown as CartTranslations;
  }, [overrides]);
}

/**
 * Hook for product translations with Hebrew fallback
 */
export function useProductTranslations(
  overrides?: DeepPartial<ProductTranslations> | null
): ProductTranslations {
  return useMemo(() => {
    if (!overrides) return hebrewTranslations.product;
    return deepMerge(
      hebrewTranslations.product as unknown as DeepObject, 
      overrides as unknown as DeepObject
    ) as unknown as ProductTranslations;
  }, [overrides]);
}

/**
 * Hook for general translations with Hebrew fallback
 */
export function useGeneralTranslations(
  overrides?: DeepPartial<GeneralTranslations> | null
): GeneralTranslations {
  return useMemo(() => {
    if (!overrides) return hebrewTranslations.general;
    return deepMerge(
      hebrewTranslations.general as unknown as DeepObject, 
      overrides as unknown as DeepObject
    ) as unknown as GeneralTranslations;
  }, [overrides]);
}

/**
 * Hook for account translations with Hebrew fallback
 */
export function useAccountTranslations(
  overrides?: DeepPartial<AccountTranslations> | null
): AccountTranslations {
  return useMemo(() => {
    if (!overrides) return hebrewTranslations.account;
    return deepMerge(
      hebrewTranslations.account as unknown as DeepObject, 
      overrides as unknown as DeepObject
    ) as unknown as AccountTranslations;
  }, [overrides]);
}

/**
 * Hook for footer translations with Hebrew fallback
 */
export function useFooterTranslations(
  overrides?: DeepPartial<FooterTranslations> | null
): FooterTranslations {
  return useMemo(() => {
    if (!overrides) return hebrewTranslations.footer;
    return deepMerge(
      hebrewTranslations.footer as unknown as DeepObject, 
      overrides as unknown as DeepObject
    ) as unknown as FooterTranslations;
  }, [overrides]);
}

/**
 * Hook for order status translations with Hebrew fallback
 */
export function useOrderStatusTranslations(
  overrides?: DeepPartial<OrderStatusTranslations> | null
): OrderStatusTranslations {
  return useMemo(() => {
    if (!overrides) return hebrewTranslations.orderStatus;
    return deepMerge(
      hebrewTranslations.orderStatus as unknown as DeepObject, 
      overrides as unknown as DeepObject
    ) as unknown as OrderStatusTranslations;
  }, [overrides]);
}

// ============================================
// Full Translations Hook
// ============================================

/**
 * Hook for all UI translations with Hebrew fallback
 */
export function useUITranslations(
  overrides?: DeepPartial<UITranslations> | null
): UITranslations {
  return useMemo(() => {
    if (!overrides) return hebrewTranslations;
    return deepMerge(
      hebrewTranslations as unknown as DeepObject, 
      overrides as unknown as DeepObject
    ) as unknown as UITranslations;
  }, [overrides]);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get a translation value with fallback
 * Useful for inline usage without hooks
 */
export function t<T>(value: T | undefined, fallback: T): T {
  return value ?? fallback;
}

/**
 * Interpolate variables in translation strings
 * 
 * @example
 * interpolate("נותרו {{count}} יחידות", { count: 5 });
 * // Result: "נותרו 5 יחידות"
 */
export function interpolate(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in variables ? String(variables[key]) : match;
  });
}

// ============================================
// Default Hebrew Values (for direct imports)
// ============================================

export const defaultCheckout = hebrewTranslations.checkout;
export const defaultCart = hebrewTranslations.cart;
export const defaultProduct = hebrewTranslations.product;
export const defaultGeneral = hebrewTranslations.general;
export const defaultAccount = hebrewTranslations.account;
export const defaultFooter = hebrewTranslations.footer;
export const defaultOrderStatus = hebrewTranslations.orderStatus;

