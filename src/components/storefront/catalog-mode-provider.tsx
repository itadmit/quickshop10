'use client';

/**
 * Catalog Mode Provider
 * 
 * מספק מידע על מצב קטלוג לכל קומפוננטות ה-storefront
 * משמש להסתרת עגלה, כפתורי הוספה לסל, וחסימת checkout
 */

import { createContext, useContext, ReactNode } from 'react';

export interface CatalogModeConfig {
  enabled: boolean;
  mode: 'all' | 'categories';
  categoryIds: string[];
  hideCartButton: boolean;
  hideCartSidebar: boolean;
  hideAddToCart: boolean;
  blockCheckout: boolean;
  showContactButton: boolean;
  contactButtonText: string;
  contactButtonUrl: string;
}

interface CatalogModeContextValue {
  config: CatalogModeConfig;
  /**
   * בודק האם מוצר ספציפי נמצא במצב קטלוג
   * @param productCategoryIds - רשימת ה-categoryIds של המוצר
   * @returns true אם המוצר במצב קטלוג (לא ניתן לרכישה)
   */
  isProductInCatalogMode: (productCategoryIds?: string[]) => boolean;
  /**
   * בודק האם העגלה צריכה להיות מוסתרת
   */
  shouldHideCart: boolean;
  /**
   * בודק האם הסיידבר של העגלה צריך להיות מוסתר
   */
  shouldHideCartSidebar: boolean;
}

const defaultConfig: CatalogModeConfig = {
  enabled: false,
  mode: 'all',
  categoryIds: [],
  hideCartButton: true,
  hideCartSidebar: true,
  hideAddToCart: true,
  blockCheckout: true,
  showContactButton: false,
  contactButtonText: 'צור קשר להזמנה',
  contactButtonUrl: '',
};

const CatalogModeContext = createContext<CatalogModeContextValue>({
  config: defaultConfig,
  isProductInCatalogMode: () => false,
  shouldHideCart: false,
  shouldHideCartSidebar: false,
});

interface CatalogModeProviderProps {
  children: ReactNode;
  config: CatalogModeConfig | null;
}

export function CatalogModeProvider({ children, config }: CatalogModeProviderProps) {
  const effectiveConfig = config || defaultConfig;
  
  // חישוב האם להסתיר עגלה (רק אם מצב קטלוג פעיל על כל האתר)
  const shouldHideCart = effectiveConfig.enabled && 
    effectiveConfig.mode === 'all' && 
    effectiveConfig.hideCartButton;
    
  const shouldHideCartSidebar = effectiveConfig.enabled && 
    effectiveConfig.mode === 'all' && 
    effectiveConfig.hideCartSidebar;
  
  /**
   * בודק האם מוצר ספציפי במצב קטלוג
   * - אם mode === 'all', כל המוצרים במצב קטלוג
   * - אם mode === 'categories', רק מוצרים בקטגוריות שנבחרו
   */
  const isProductInCatalogMode = (productCategoryIds?: string[]): boolean => {
    if (!effectiveConfig.enabled) return false;
    
    if (effectiveConfig.mode === 'all') {
      return true;
    }
    
    // Mode is 'categories' - check if product is in any of the catalog categories
    if (!productCategoryIds || productCategoryIds.length === 0) {
      return false;
    }
    
    return productCategoryIds.some(catId => 
      effectiveConfig.categoryIds.includes(catId)
    );
  };
  
  return (
    <CatalogModeContext.Provider value={{
      config: effectiveConfig,
      isProductInCatalogMode,
      shouldHideCart,
      shouldHideCartSidebar,
    }}>
      {children}
    </CatalogModeContext.Provider>
  );
}

/**
 * Hook לקבלת מצב קטלוג בקומפוננטות
 */
export function useCatalogMode() {
  return useContext(CatalogModeContext);
}

/**
 * Optional hook - returns null if not in provider
 * Useful for components that might be outside CatalogModeProvider
 */
export function useCatalogModeOptional(): CatalogModeContextValue | null {
  const context = useContext(CatalogModeContext);
  // Check if we're in a provider by checking if config is the default
  if (context.config === defaultConfig && !context.config.enabled) {
    return null;
  }
  return context;
}
