'use client';

/**
 * ProductPagePreviewProvider - Client Component for Editor Preview ONLY
 * Listens for postMessage updates and provides live preview of product page settings
 * 
 * PERFORMANCE NOTE: This component is ONLY loaded in preview mode (editor iframe)
 * In production, the product page uses Server Components with zero JS
 */

import { createContext, useContext, useState, useEffect, type ReactNode, Children } from 'react';
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
      <h2 className="font-display text-2xl md:text-3xl text-center mb-4 font-light tracking-widths">
        {settings.related.title}
      </h2>
      <p className="text-center text-gray-500 text-sm tracking-wide mb-12">
        {settings.related.subtitle}
      </p>
    </>
  );
}

/**
 * useLiveProductPageSettings - Hook for getting live settings in child components
 */
export function useLiveProductPageSettings() {
  const { settings, isPreview } = useProductPagePreview();
  return { settings, isPreview };
}

/**
 * LiveGallerySection - Full gallery with live updates for ALL gallery settings
 */
interface LiveGallerySectionProps {
  mainImage: string;
  productName: string;
  images: Array<{ id: string; url: string }>;
  initialSettings: {
    layout: string;
    thumbnailsPosition: string;
    aspectRatio: string;
    enableZoom: boolean;
  };
  ProductImageComponent: React.ComponentType<{ src: string | undefined; alt: string; className?: string; loading?: 'eager' | 'lazy' }>;
}

export function LiveGallerySection({ 
  mainImage, 
  productName, 
  images, 
  initialSettings,
  ProductImageComponent 
}: LiveGallerySectionProps) {
  const { settings, isPreview } = useProductPagePreview();
  
  const aspectRatioClasses: Record<string, string> = {
    '1:1': 'aspect-square',
    '3:4': 'aspect-[3/4]',
    '4:3': 'aspect-[4/3]',
    '16:9': 'aspect-video',
  };
  
  // Use live settings in preview mode
  const layout = isPreview ? settings.gallery.layout : initialSettings.layout;
  const thumbnailsPosition = isPreview ? settings.gallery.thumbnailsPosition : initialSettings.thumbnailsPosition;
  const aspectRatio = isPreview ? settings.gallery.aspectRatio : initialSettings.aspectRatio;
  const enableZoom = isPreview ? settings.gallery.enableZoom : initialSettings.enableZoom;
  
  const aspectClass = aspectRatioClasses[aspectRatio] || 'aspect-[3/4]';
  
  // Determine container classes based on thumbnail position
  const getContainerClasses = () => {
    if (thumbnailsPosition === 'left') {
      return 'lg:flex lg:flex-row-reverse lg:gap-4';
    }
    return '';
  };
  
  // Determine thumbnail container classes
  const getThumbnailClasses = () => {
    if (thumbnailsPosition === 'left') {
      return 'flex flex-col gap-4 w-20';
    }
    return 'grid grid-cols-4 gap-4';
  };
  
  return (
    <div className={`space-y-4 ${getContainerClasses()}`}>
      {/* Main Image */}
      <div 
        className={`${aspectClass} bg-gray-50 overflow-hidden ${thumbnailsPosition === 'left' ? 'flex-1' : ''} ${enableZoom ? 'cursor-zoom-in' : ''}`}
        title={enableZoom ? 'לחץ להגדלה' : undefined}
      >
        <ProductImageComponent 
          src={mainImage}
          alt={productName}
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>
      
      {/* Thumbnails */}
      {thumbnailsPosition !== 'hidden' && images.length > 1 && (
        <div className={getThumbnailClasses()}>
          {images.map((img, i) => (
            <div key={img.id} className="aspect-square bg-gray-50 overflow-hidden cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
              <ProductImageComponent 
                src={img.url}
                alt={`${productName} ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * LiveGalleryWrapper - Simple wrapper for gallery with live aspect ratio (backward compat)
 */
interface LiveGalleryWrapperProps {
  children: ReactNode;
  initialAspectRatio: string;
}

export function LiveGalleryWrapper({ children, initialAspectRatio }: LiveGalleryWrapperProps) {
  const { settings, isPreview } = useProductPagePreview();
  
  const aspectRatioClasses: Record<string, string> = {
    '1:1': 'aspect-square',
    '3:4': 'aspect-[3/4]',
    '4:3': 'aspect-[4/3]',
    '16:9': 'aspect-video',
  };
  
  const aspectRatio = isPreview ? settings.gallery.aspectRatio : initialAspectRatio;
  
  return (
    <div className={`${aspectRatioClasses[aspectRatio] || 'aspect-[3/4]'} bg-gray-50 overflow-hidden`}>
      {children}
    </div>
  );
}

/**
 * LiveTitleWrapper - Wrapper for product title with live styling
 */
interface LiveTitleWrapperProps {
  children: ReactNode;
  initialSettings: { fontSize: string; fontWeight: string };
}

export function LiveTitleWrapper({ children, initialSettings }: LiveTitleWrapperProps) {
  const { settings, isPreview } = useProductPagePreview();
  
  const sizes: Record<string, string> = { 
    small: 'text-2xl md:text-3xl', 
    medium: 'text-3xl md:text-4xl', 
    large: 'text-4xl md:text-5xl' 
  };
  const weights: Record<string, string> = { 
    light: 'font-light', 
    normal: 'font-normal', 
    bold: 'font-bold' 
  };
  
  const fontSize = isPreview ? settings.title.fontSize : initialSettings.fontSize;
  const fontWeight = isPreview ? settings.title.fontWeight : initialSettings.fontWeight;
  
  return (
    <h1 className={`font-display ${sizes[fontSize] || sizes.large} ${weights[fontWeight] || weights.light} tracking-[0.05em] mb-4`}>
      {children}
    </h1>
  );
}

/**
 * LivePriceWrapper - Wrapper for price with live styling
 */
interface LivePriceWrapperProps {
  price: string;
  comparePrice?: string | null;
  discount?: number | null;
  initialSettings: { fontSize: string; showComparePrice: boolean; showDiscount: boolean; discountStyle: string };
}

export function LivePriceWrapper({ price, comparePrice, discount, initialSettings }: LivePriceWrapperProps) {
  const { settings, isPreview } = useProductPagePreview();
  
  const sizes: Record<string, string> = { 
    small: 'text-lg', 
    medium: 'text-2xl', 
    large: 'text-3xl' 
  };
  
  const fontSize = isPreview ? settings.price.fontSize : initialSettings.fontSize;
  const showComparePrice = isPreview ? settings.price.showComparePrice : initialSettings.showComparePrice;
  const showDiscount = isPreview ? settings.price.showDiscount : initialSettings.showDiscount;
  const discountStyle = isPreview ? settings.price.discountStyle : initialSettings.discountStyle;
  
  const hasDiscount = comparePrice && discount;
  
  return (
    <div className="flex items-center gap-4 mb-8">
      <span className={`${sizes[fontSize] || sizes.medium} font-display`}>{price}</span>
      {showComparePrice && hasDiscount && (
        <span className="text-lg text-gray-400 line-through">{comparePrice}</span>
      )}
      {showDiscount && hasDiscount && (discountStyle === 'text' || discountStyle === 'both') && (
        <span className="text-sm text-red-500">-{discount}%</span>
      )}
    </div>
  );
}

/**
 * LiveSectionVisibility - Conditionally render based on section visibility
 */
interface LiveSectionVisibilityProps {
  sectionType: string;
  children: ReactNode;
  initialVisible: boolean;
}

export function LiveSectionVisibility({ sectionType, children, initialVisible }: LiveSectionVisibilityProps) {
  const { settings, isPreview } = useProductPagePreview();
  
  const isVisible = isPreview 
    ? settings.sections.some(s => s.type === sectionType && s.isVisible)
    : initialVisible;
  
  if (!isVisible) return null;
  
  return <>{children}</>;
}

/**
 * LiveRelatedProducts - Related products section with live count update
 * Uses children pattern to avoid passing functions (Server -> Client boundary)
 */
interface LiveRelatedProductsProps {
  children: ReactNode;
  initialCount: number;
}

export function LiveRelatedProducts({ children, initialCount }: LiveRelatedProductsProps) {
  const { settings, isPreview } = useProductPagePreview();
  
  // Use live settings in preview mode
  const title = isPreview ? settings.related.title : 'אולי יעניין אותך';
  const subtitle = isPreview ? settings.related.subtitle : 'מוצרים נוספים שאהבו לקוחות';
  const count = isPreview ? settings.related.count : initialCount;
  
  // Use React.Children API to properly handle children array
  const childArray = Children.toArray(children);
  const displayChildren = childArray.slice(0, count);
  
  if (displayChildren.length === 0) return null;
  
  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-display text-2xl md:text-3xl text-center mb-4 font-light tracking-widest">
          {title}
        </h2>
        <p className="text-center text-gray-500 text-sm tracking-wide mb-12">
          {subtitle}
        </p>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
          {displayChildren}
        </div>
      </div>
    </section>
  );
}

/**
 * Hook to get all live gallery settings
 */
export function useLiveGallerySettings(initialSettings: ProductPageSettings['gallery']) {
  const { settings, isPreview } = useProductPagePreview();
  
  if (!isPreview) return initialSettings;
  
  return settings.gallery;
}

/**
 * Hook to get live related products settings
 */
export function useLiveRelatedSettings(initialSettings: ProductPageSettings['related']) {
  const { settings, isPreview } = useProductPagePreview();
  
  if (!isPreview) return initialSettings;
  
  return settings.related;
}

