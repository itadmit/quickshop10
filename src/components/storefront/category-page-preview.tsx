'use client';

/**
 * CategoryPagePreviewProvider - Client Component for Editor Preview ONLY
 * Listens for postMessage updates and provides live preview of category page settings
 * 
 * PERFORMANCE NOTE: This component is ONLY loaded in preview mode (editor iframe)
 * In production, the category page uses Server Components with zero JS
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CategoryPageSettings } from '@/lib/category-page-settings';
import { defaultCategoryPageSettings } from '@/lib/category-page-settings';

interface CategoryPagePreviewContextType {
  settings: CategoryPageSettings;
  isPreview: boolean;
}

const CategoryPagePreviewContext = createContext<CategoryPagePreviewContextType>({
  settings: defaultCategoryPageSettings,
  isPreview: false,
});

export function useCategoryPagePreview() {
  return useContext(CategoryPagePreviewContext);
}

interface CategoryPagePreviewProviderProps {
  children: ReactNode;
  initialSettings: CategoryPageSettings;
}

export function CategoryPagePreviewProvider({ 
  children, 
  initialSettings 
}: CategoryPagePreviewProviderProps) {
  const [settings, setSettings] = useState<CategoryPageSettings>(initialSettings);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle category page settings update from editor
      if (event.data?.type === 'CATEGORY_PAGE_SETTINGS_UPDATE') {
        const newSettings = event.data.settings as Partial<CategoryPageSettings>;
        
        // Deep merge with existing settings
        setSettings(prev => ({
          banner: { ...prev.banner, ...newSettings.banner },
          subcategories: { ...prev.subcategories, ...newSettings.subcategories },
          products: { ...prev.products, ...newSettings.products },
          breadcrumb: { ...prev.breadcrumb, ...newSettings.breadcrumb },
        }));
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Let parent know we're ready
    window.parent.postMessage({ type: 'CATEGORY_PREVIEW_READY' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <CategoryPagePreviewContext.Provider value={{ settings, isPreview: true }}>
      {children}
    </CategoryPagePreviewContext.Provider>
  );
}

