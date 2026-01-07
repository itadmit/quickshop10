'use client';

/**
 * ProductPagePreviewProvider - Client Component for Editor Preview ONLY
 * Listens for postMessage updates and provides live preview of product page settings
 * 
 * PERFORMANCE NOTE: This component is ONLY loaded in preview mode (editor iframe)
 * In production, the product page uses Server Components with zero JS
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ProductPageSettings, ProductFeature } from '@/lib/product-page-settings';
import { defaultProductPageSettings, featureIcons } from '@/lib/product-page-settings';

interface ProductPagePreviewContextType {
  settings: ProductPageSettings;
  isPreview: boolean;
}

const ProductPagePreviewContext = createContext<ProductPagePreviewContextType>({
  settings: defaultProductPageSettings,
  isPreview: false,
});

export function useProductPagePreview() {
  return useContext(ProductPagePreviewContext);
}

interface ProductPagePreviewProviderProps {
  children: ReactNode;
  initialSettings: ProductPageSettings;
}

export function ProductPagePreviewProvider({ 
  children, 
  initialSettings 
}: ProductPagePreviewProviderProps) {
  const [settings, setSettings] = useState<ProductPageSettings>(initialSettings);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle product page settings update from editor
      if (event.data?.type === 'PRODUCT_PAGE_SETTINGS_UPDATE') {
        const newSettings = event.data.settings as Partial<ProductPageSettings>;
        
        // Deep merge with existing settings
        setSettings(prev => {
          const merged: ProductPageSettings = {
            ...prev,
            ...newSettings,
          };
          
          // Deep merge nested objects only if they exist in the update
          if (newSettings.gallery) {
            merged.gallery = { ...prev.gallery, ...newSettings.gallery };
          }
          if (newSettings.title) {
            merged.title = { ...prev.title, ...newSettings.title };
          }
          if (newSettings.price) {
            merged.price = { ...prev.price, ...newSettings.price };
          }
          if (newSettings.features) {
            merged.features = newSettings.features;
          }
          if (newSettings.related) {
            merged.related = { ...prev.related, ...newSettings.related };
          }
          if (newSettings.reviews) {
            merged.reviews = { ...prev.reviews, ...newSettings.reviews };
          }
          if (newSettings.sections) {
            merged.sections = newSettings.sections;
          }
          
          return merged;
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <ProductPagePreviewContext.Provider value={{ settings, isPreview: true }}>
      {children}
    </ProductPagePreviewContext.Provider>
  );
}

/**
 * LiveFeaturesSection - Client Component for live preview of features
 * Shows features with live updates from editor
 */
interface LiveFeaturesSectionProps {
  initialFeatures: ProductFeature[];
}

export function LiveFeaturesSection({ initialFeatures }: LiveFeaturesSectionProps) {
  const { settings, isPreview } = useProductPagePreview();
  
  // Use context settings if in preview, otherwise initial
  const features = isPreview ? settings.features : initialFeatures;
  const visibleFeatures = features.filter(f => f.isVisible);

  if (visibleFeatures.length === 0) return null;

  return (
    <div className="space-y-4 mt-8">
      {visibleFeatures.map((feature) => (
        <div key={feature.id} className="flex items-center gap-4 text-sm text-gray-600">
          <span 
            className="shrink-0"
            dangerouslySetInnerHTML={{ __html: featureIcons[feature.icon] || featureIcons.check }}
          />
          {feature.text}
        </div>
      ))}
    </div>
  );
}

/**
 * LiveRelatedTitle - Client Component for live preview of related products title
 */
export function LiveRelatedTitle() {
  const { settings } = useProductPagePreview();
  
  return (
    <>
      <h2 className="font-display text-2xl md:text-3xl text-center mb-4 font-light tracking-widest">
        {settings.related.title}
      </h2>
      <p className="text-center text-gray-500 text-sm tracking-wide mb-12">
        {settings.related.subtitle}
      </p>
    </>
  );
}

