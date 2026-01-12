'use client';

/**
 * ProductPagePreviewProvider - Client Component for Editor Preview ONLY
 * Listens for postMessage updates and provides live preview of product page settings
 * 
 * PERFORMANCE NOTE: This component is ONLY loaded in preview mode (editor iframe)
 * In production, the product page uses Server Components with zero JS
 */

import { createContext, useContext, useState, useEffect, type ReactNode, Children, useMemo } from 'react';
import type { ProductPageSettings, ProductFeature, TypographySettings } from '@/lib/product-page-settings';
import { defaultProductPageSettings, featureIcons, defaultTypography } from '@/lib/product-page-settings';

// Hook to detect mobile viewport
function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);
  
  return isMobile;
}

// Helper to convert TypographySettings to CSS styles
function getTypographyStyle(settings: TypographySettings | undefined, isMobile: boolean = false): React.CSSProperties {
  if (!settings) return {};
  
  const fontSize = isMobile && settings.fontSizeMobile 
    ? `${settings.fontSizeMobile}${settings.fontSizeMobileUnit || 'px'}`
    : settings.fontSize 
      ? `${settings.fontSize}${settings.fontSizeUnit || 'px'}`
      : undefined;
  
  const fontWeightMap: Record<string, number> = {
    light: 300,
    normal: 400,
    medium: 500,
    bold: 700,
    extrabold: 800,
  };
  
  return {
    color: settings.color,
    fontFamily: settings.fontFamily === 'default' ? undefined : settings.fontFamily,
    fontSize,
    fontWeight: settings.fontWeight ? fontWeightMap[settings.fontWeight] : undefined,
    textTransform: settings.textTransform === 'none' ? undefined : settings.textTransform,
    letterSpacing: settings.letterSpacing ? `${settings.letterSpacing}${settings.letterSpacingUnit || 'px'}` : undefined,
    lineHeight: settings.lineHeight ? settings.lineHeight : undefined,
  };
}

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
          if (newSettings.typography) {
            merged.typography = {
              title: { ...prev.typography.title, ...newSettings.typography.title },
              price: { ...prev.typography.price, ...newSettings.typography.price },
              comparePrice: { ...prev.typography.comparePrice, ...newSettings.typography.comparePrice },
              button: { ...prev.typography.button, ...newSettings.typography.button },
              inventory: { ...prev.typography.inventory, ...newSettings.typography.inventory },
              description: { ...prev.typography.description, ...newSettings.typography.description },
            };
          }
          if (newSettings.price) {
            merged.price = { ...prev.price, ...newSettings.price };
          }
          if (newSettings.inventory) {
            merged.inventory = { ...prev.inventory, ...newSettings.inventory };
          }
          if (newSettings.description) {
            merged.description = { ...prev.description, ...newSettings.description };
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
    
    // Notify parent that we're ready to receive settings
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
    }
    
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
    thumbnailsPositionMobile?: string;
    aspectRatio: string;
    enableZoom: boolean;
    showArrows?: boolean;
    showDotsOnMobile?: boolean;
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Minimum swipe distance to trigger navigation (in pixels)
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && images.length > 1) {
      // RTL: swipe left = previous
      goToPrevious();
    }
    if (isRightSwipe && images.length > 1) {
      // RTL: swipe right = next
      goToNext();
    }
  };
  
  const aspectRatioClasses: Record<string, string> = {
    '1:1': 'aspect-square',
    '3:4': 'aspect-[3/4]',
    '4:3': 'aspect-[4/3]',
    '16:9': 'aspect-video',
  };
  
  // Use live settings in preview mode
  const layout = isPreview ? settings.gallery.layout : initialSettings.layout;
  const thumbnailsPosition = isPreview ? settings.gallery.thumbnailsPosition : initialSettings.thumbnailsPosition;
  const thumbnailsPositionMobile = isPreview ? (settings.gallery.thumbnailsPositionMobile ?? 'bottom') : (initialSettings.thumbnailsPositionMobile ?? 'bottom');
  const aspectRatio = isPreview ? settings.gallery.aspectRatio : initialSettings.aspectRatio;
  const enableZoom = isPreview ? settings.gallery.enableZoom : initialSettings.enableZoom;
  const showArrows = isPreview ? (settings.gallery.showArrows ?? true) : (initialSettings.showArrows ?? true);
  const showDotsOnMobile = isPreview ? (settings.gallery.showDotsOnMobile ?? false) : (initialSettings.showDotsOnMobile ?? false);
  
  const aspectClass = aspectRatioClasses[aspectRatio] || 'aspect-[3/4]';
  
  // Navigation functions
  const goToPrevious = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const goToNext = () => {
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  // Get current main image (either selected or first)
  const currentMainImage = images.length > 0 ? images[selectedImageIndex]?.url || mainImage : mainImage;
  
  // Determine container classes based on thumbnail position
  // Mobile: always stacked (thumbnails below or hidden)
  // Desktop: respect thumbnailsPosition setting
  const getContainerClasses = () => {
    // Desktop only - mobile is always stacked
    if (thumbnailsPosition === 'right') {
      return 'lg:flex lg:flex-row-reverse lg:gap-4';
    }
    if (thumbnailsPosition === 'left') {
      return 'lg:flex lg:gap-4';
    }
    return '';
  };
  
  // Determine thumbnail container classes
  // Mobile: horizontal scroll (bottom) or hidden
  // Desktop: vertical if left/right, horizontal if bottom
  const getThumbnailClasses = () => {
    // Mobile: always horizontal scroll, with padding for ring-offset
    const mobileClass = 'flex gap-3 overflow-x-auto p-1';
    
    // Desktop: vertical if left/right
    if (thumbnailsPosition === 'left' || thumbnailsPosition === 'right') {
      return `${mobileClass} lg:flex-col lg:gap-3 lg:w-24 lg:overflow-x-visible lg:overflow-y-auto`;
    }
    
    return mobileClass;
  };
  
  // Check if thumbnails should be visible
  const showThumbnails = () => {
    // Hidden on all screens
    if (thumbnailsPosition === 'hidden') return false;
    // More than 1 image required
    if (images.length <= 1) return false;
    return true;
  };
  
  // Check if thumbnails hidden on mobile only
  const hideThumbnailsOnMobile = thumbnailsPositionMobile === 'hidden';
  
  // Grid layout - show ALL images stacked vertically (one below another)
  if (layout === 'grid' && images.length > 1) {
    return (
      <div className="flex flex-col gap-4">
        {images.map((img, i) => (
          <div 
            key={img.id} 
            className={`${aspectClass} bg-gray-50 overflow-hidden ${enableZoom ? 'cursor-zoom-in' : ''}`}
          >
            <ProductImageComponent 
              src={img.url}
              alt={`${productName} ${i + 1}`}
              className="w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>
    );
  }
  
  // Carousel layout (default) OR Single - main image with clickable thumbnails
  // Both carousel and single now work the same - main image + thumbnails
  return (
    <div className={`space-y-4 ${getContainerClasses()}`}>
      {/* Main Image with Slide Animation */}
      <div 
        className={`relative ${aspectClass} bg-gray-50 overflow-hidden ${(thumbnailsPosition === 'left' || thumbnailsPosition === 'right') ? 'flex-1' : ''} ${enableZoom ? 'cursor-zoom-in' : ''}`}
        title={enableZoom ? 'לחץ להגדלה' : undefined}
      >
        {/* Sliding images container with touch support */}
        <div 
          className="flex transition-transform duration-300 ease-out h-full touch-pan-y"
          style={{ 
            width: `${images.length * 100}%`,
            transform: `translateX(${selectedImageIndex * (100 / images.length)}%)` 
          }}
          onClick={enableZoom ? () => setIsZoomOpen(true) : undefined}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {images.map((img, i) => (
            <div 
              key={img.id} 
              className="h-full flex-shrink-0"
              style={{ width: `${100 / images.length}%` }}
            >
              <ProductImageComponent 
                src={img.url}
                alt={`${productName} ${i + 1}`}
                className="w-full h-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>
        
        {/* Navigation Arrows */}
        {showArrows && images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all z-10"
              aria-label="תמונה קודמת"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all z-10"
              aria-label="תמונה הבאה"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </>
        )}
        
        {/* Mobile Dots Indicator */}
        {showDotsOnMobile && images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden z-10">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedImageIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === selectedImageIndex ? 'bg-black w-4' : 'bg-black/40'
                }`}
                aria-label={`תמונה ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Thumbnails - shown when more than 1 image and not hidden */}
      {showThumbnails() && (
        <div className={`${getThumbnailClasses()} ${hideThumbnailsOnMobile ? 'hidden lg:flex' : ''}`}>
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedImageIndex(i)}
              className={`flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 bg-gray-50 overflow-hidden transition-all ${
                i === selectedImageIndex 
                  ? 'ring-2 ring-gray-400 ring-offset-2 opacity-100' 
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <ProductImageComponent 
                src={img.url}
                alt={`${productName} ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
      
      {/* Zoom Modal */}
      {isZoomOpen && enableZoom && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-4 left-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors z-10"
            aria-label="סגור"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Navigation arrows in modal */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="תמונה קודמת"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="תמונה הבאה"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </>
          )}
          
          {/* Zoomed image */}
          <div 
            className="max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[selectedImageIndex]?.url || mainImage}
              alt={productName}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
          
          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
              {selectedImageIndex + 1} / {images.length}
            </div>
          )}
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
 * LiveTitleWrapper - Wrapper for product title with live typography styling
 */
interface LiveTitleWrapperProps {
  children: ReactNode;
  initialTypography?: TypographySettings;
}

export function LiveTitleWrapper({ children, initialTypography }: LiveTitleWrapperProps) {
  const { settings, isPreview } = useProductPagePreview();
  const isMobile = useIsMobile();
  
  const typography = isPreview 
    ? settings.typography?.title || defaultTypography.title
    : initialTypography || defaultTypography.title;
  
  const style = getTypographyStyle(typography, isMobile);
  
  return (
    <h1 
      className="font-display tracking-[0.05em] mb-4"
      style={style}
    >
      {children}
    </h1>
  );
}

/**
 * LivePriceWrapper - Wrapper for price with live typography styling
 */
interface LivePriceWrapperProps {
  price: string;
  comparePrice?: string | null;
  discount?: number | null;
  initialTypography?: {
    price?: TypographySettings;
    comparePrice?: TypographySettings;
  };
  initialPriceSettings?: { showComparePrice: boolean; showDiscount: boolean; discountStyle: string };
}

export function LivePriceWrapper({ price, comparePrice, discount, initialTypography, initialPriceSettings }: LivePriceWrapperProps) {
  const { settings, isPreview } = useProductPagePreview();
  const isMobile = useIsMobile();
  
  const priceTypography = isPreview 
    ? settings.typography?.price || defaultTypography.price
    : initialTypography?.price || defaultTypography.price;
  
  const comparePriceTypography = isPreview 
    ? settings.typography?.comparePrice || defaultTypography.comparePrice
    : initialTypography?.comparePrice || defaultTypography.comparePrice;
  
  const showComparePrice = isPreview ? settings.price?.showComparePrice : initialPriceSettings?.showComparePrice ?? true;
  const showDiscount = isPreview ? settings.price?.showDiscount : initialPriceSettings?.showDiscount ?? true;
  const discountStyle = isPreview ? settings.price?.discountStyle : initialPriceSettings?.discountStyle ?? 'badge';
  
  const hasDiscount = comparePrice && discount;
  
  const priceStyle = getTypographyStyle(priceTypography, isMobile);
  const comparePriceStyle = getTypographyStyle(comparePriceTypography, isMobile);
  
  return (
    <div className="flex items-center gap-4 mb-8">
      <span className="font-display" style={priceStyle}>{price}</span>
      {showComparePrice && hasDiscount && (
        <span className="line-through" style={comparePriceStyle}>{comparePrice}</span>
      )}
      {showDiscount && hasDiscount && (discountStyle === 'text' || discountStyle === 'both') && (
        <span className="text-sm text-red-500">-{discount}%</span>
      )}
    </div>
  );
}

/**
 * LiveInventoryDisplay - Live preview of inventory status with typography
 */
interface LiveInventoryDisplayProps {
  inventory: number | null;
  trackInventory: boolean;
  allowBackorder: boolean;
  initialSettings: { displayStyle: string; lowStockThreshold: number };
  initialTypography?: TypographySettings;
}

export function LiveInventoryDisplay({ 
  inventory, 
  trackInventory, 
  allowBackorder,
  initialSettings,
  initialTypography
}: LiveInventoryDisplayProps) {
  const { settings, isPreview } = useProductPagePreview();
  const isMobile = useIsMobile();
  
  const displayStyle = isPreview ? settings.inventory?.displayStyle : initialSettings.displayStyle;
  const lowStockThreshold = isPreview ? settings.inventory?.lowStockThreshold : initialSettings.lowStockThreshold;
  
  const typography = isPreview 
    ? settings.typography?.inventory || defaultTypography.inventory
    : initialTypography || defaultTypography.inventory;
  
  const baseStyle = getTypographyStyle(typography, isMobile);
  
  // Don't show anything if hidden
  if (displayStyle === 'hidden') return null;
  
  // Check if out of stock
  const isOutOfStock = trackInventory && inventory !== null && inventory <= 0 && !allowBackorder;
  
  if (isOutOfStock) {
    return (
      <p className="text-center mb-8" style={{ ...baseStyle, color: '#EF4444' }}>
        אזל מהמלאי
      </p>
    );
  }
  
  // Display based on style
  if (displayStyle === 'in_stock') {
    return (
      <p className="text-center mb-8" style={{ ...baseStyle, color: '#16A34A' }}>
        במלאי
      </p>
    );
  }
  
  if (displayStyle === 'count' && trackInventory && inventory !== null && inventory > 0) {
    return (
      <p className="text-center mb-8" style={baseStyle}>
        {inventory} יחידות במלאי
      </p>
    );
  }
  
  if (displayStyle === 'low_stock' && trackInventory && inventory !== null) {
    if (inventory <= (lowStockThreshold || 5)) {
      return (
        <p className="text-center mb-8" style={{ ...baseStyle, color: '#F97316' }}>
          נותרו יחידות אחרונות!
        </p>
      );
    }
    return (
      <p className="text-center mb-8" style={{ ...baseStyle, color: '#16A34A' }}>
        במלאי
      </p>
    );
  }
  
  // Default - in stock
  return (
    <p className="text-center mb-8" style={{ ...baseStyle, color: '#16A34A' }}>
      במלאי
    </p>
  );
}

/**
 * LiveDescriptionSection - Description with live accordion toggle
 */
interface LiveDescriptionSectionProps {
  description: string;
  initialShowAsAccordion: boolean;
  initialTypography?: TypographySettings;
}

export function LiveDescriptionSection({ 
  description, 
  initialShowAsAccordion,
  initialTypography
}: LiveDescriptionSectionProps) {
  const { settings, isPreview } = useProductPagePreview();
  const isMobile = useIsMobile();
  
  const showAsAccordion = isPreview 
    ? settings.description?.showAsAccordion ?? false
    : initialShowAsAccordion;
    
  const typography = isPreview 
    ? settings.typography?.description || defaultTypography.description
    : initialTypography || defaultTypography.description;
  
  const style = getTypographyStyle(typography, isMobile);
  
  if (showAsAccordion) {
    return (
      <details className="group border-b border-gray-200">
        <summary className="flex items-center justify-between py-4 cursor-pointer list-none">
          <span className="text-[11px] tracking-[0.2em] uppercase text-black">תיאור</span>
          <svg 
            className="w-4 h-4 transition-transform group-open:rotate-180" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="pb-4">
          <p className="leading-relaxed whitespace-pre-line" style={style}>
            {description}
          </p>
        </div>
      </details>
    );
  }
  
  return (
    <>
      <h3 className="text-[11px] tracking-[0.2em] uppercase text-black mb-4">תיאור</h3>
      <p className="leading-relaxed whitespace-pre-line" style={style}>
        {description}
      </p>
    </>
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

