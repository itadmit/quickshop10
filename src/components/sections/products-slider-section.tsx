'use client';

/**
 * ProductsSliderSection - סליידר מוצרים
 * מציג מוצרים בסליידר אופקי עם חצים ונקודות
 */

import { ProductCard } from '@/components/product-card';
import { AutoSlider } from '@/components/ui/slider';
import type { SliderSettings } from '@/components/ui/slider';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string | null;
  comparePrice: string | null;
  image: string | null;
  shortDescription?: string | null;
  isFeatured: boolean;
  // Stock fields
  inventory?: number | null;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  // Video card fields
  cardImage?: string | null;
  cardVideoUrl?: string | null;
  // Variant support
  hasVariants?: boolean;
}

// הנחה אוטומטית - תומך במספר הנחות!
interface AutomaticDiscount {
  name: string;
  names?: string[];
  discountedPrice: number;
  discountPercent: number;
  categoryIds?: string[];
}

// Badge type for display
interface Badge {
  id: string;
  text: string;
  backgroundColor: string;
  textColor: string;
  position: string;
}

interface ProductsSliderSectionProps {
  title: string | null;
  subtitle: string | null;
  products: Product[];
  settings: {
    columns?: number;
    mobileColumns?: number;
    gap?: number;
    showCount?: boolean;
    textAlign?: 'right' | 'center' | 'left';
    showAddToCart?: boolean;
    addToCartStyle?: 'outline' | 'filled';
    // Slider settings
    showArrows?: boolean;
    showDots?: boolean;
    arrowStyle?: 'circle' | 'square' | 'minimal';
    dotsStyle?: 'dots' | 'lines' | 'numbers';
    autoplay?: boolean;
    autoplayInterval?: number;
    loop?: boolean;
    // Typography
    titleColor?: string;
    titleSize?: number;
    titleSizeMobile?: number;
    titleWeight?: string;
    titleFontFamily?: string;
    subtitleColor?: string;
    subtitleFontFamily?: string;
    subtitleSize?: number;
    subtitleSizeMobile?: number;
    // Divider
    showDivider?: boolean;
    dividerColor?: string;
    dividerHeight?: number;
    // Background
    backgroundColor?: string;
    // Spacing
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    marginTop?: number;
    marginBottom?: number;
    // Layout
    containerType?: 'container' | 'full';
    sectionWidth?: 'full' | 'boxed';
    contentWidth?: number;
    minHeight?: number;
    minHeightUnit?: 'px' | 'vh';
    verticalAlign?: 'start' | 'center' | 'end';
    // Card styling
    cardStyle?: 'standard' | 'minimal' | 'overlay';
    hoverEffect?: 'none' | 'scale' | 'zoom';
    // Image aspect ratio
    imageAspectRatio?: 'square' | 'portrait' | 'portrait-tall' | 'landscape';
    imagePosition?: 'top' | 'center' | 'bottom';
    imageFit?: 'cover' | 'contain' | 'fill';
    // Product name lines
    productNameLines?: number;
    // Visibility
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
    // Custom
    customClass?: string;
    customId?: string;
    zIndex?: number;
    // Animation
    animation?: string;
    animationDuration?: number;
    // Slider arrow/dots colors
    arrowBgColor?: string;
    arrowColor?: string;
    dotsActiveColor?: string;
    dotsInactiveColor?: string;
  };
  basePath: string;
  showDecimalPrices?: boolean;
  displayLimit?: number;
  discountsMap?: Map<string, AutomaticDiscount>;
  badgesMap?: Map<string, Badge[]>;
  storeSlug?: string;
  showWishlist?: boolean;
  sectionId?: string;
}

export function ProductsSliderSection({ 
  title, 
  subtitle, 
  products, 
  settings, 
  basePath, 
  showDecimalPrices = false, 
  sectionId, 
  displayLimit, 
  discountsMap, 
  badgesMap, 
  storeSlug, 
  showWishlist = false 
}: ProductsSliderSectionProps) {
  // Text alignment - default to center
  const textAlign = settings.textAlign || 'center';
  const alignClass = textAlign === 'right' ? 'text-right' : textAlign === 'left' ? 'text-left' : 'text-center';
  
  // Visibility classes
  const hideOnMobileClass = settings.hideOnMobile ? 'max-md:hidden' : '';
  const hideOnDesktopClass = settings.hideOnDesktop ? 'md:hidden' : '';
  
  // Slider columns
  const columns = settings.columns || 4;
  const mobileColumns = settings.mobileColumns || 2;
  const gap = settings.gap || 24;
  
  // Spacing
  const paddingTop = settings.paddingTop ?? 80;
  const paddingBottom = settings.paddingBottom ?? 80;
  const paddingLeft = settings.paddingLeft ?? 24;
  const paddingRight = settings.paddingRight ?? 24;
  
  // Min height & vertical align
  const hasMinHeight = settings.minHeight && settings.minHeight > 0;
  const verticalAlignMap: Record<string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
  };

  // Slider settings
  const sliderSettings: Partial<SliderSettings> = {
    itemsPerView: columns,
    itemsPerViewMobile: mobileColumns,
    itemsPerViewTablet: Math.min(columns, 3),
    scrollBy: 1,
    showArrows: settings.showArrows !== false,
    showDots: settings.showDots !== false,
    arrowPosition: 'inside',
    arrowStyle: settings.arrowStyle || 'circle',
    arrowBgColor: settings.arrowBgColor || '#ffffff',
    arrowColor: settings.arrowColor || '#374151',
    dotsPosition: 'bottom',
    dotsStyle: settings.dotsStyle || 'dots',
    dotsActiveColor: settings.dotsActiveColor || '#111827',
    dotsInactiveColor: settings.dotsInactiveColor || '#d1d5db',
    gap: gap,
    autoplay: settings.autoplay || false,
    autoplayInterval: settings.autoplayInterval || 5000,
    loop: settings.loop !== false,
  };

  // Filter products based on displayLimit
  const visibleProducts = displayLimit ? products.slice(0, displayLimit) : products;
  
  return (
    <section 
      id={settings.customId || 'products-slider'} 
      className={`${hideOnMobileClass} ${hideOnDesktopClass} ${settings.customClass || ''}`.trim()}
      style={{
        backgroundColor: settings.backgroundColor || '#ffffff',
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        paddingLeft: `${paddingLeft}px`,
        paddingRight: `${paddingRight}px`,
        marginTop: settings.marginTop ? `${settings.marginTop}px` : undefined,
        marginBottom: settings.marginBottom ? `${settings.marginBottom}px` : undefined,
        zIndex: settings.zIndex ? Number(settings.zIndex) : undefined,
        minHeight: hasMinHeight ? `${settings.minHeight}${settings.minHeightUnit || 'px'}` : undefined,
        display: hasMinHeight ? 'flex' : undefined,
        flexDirection: hasMinHeight ? 'column' : undefined,
        justifyContent: hasMinHeight ? verticalAlignMap[settings.verticalAlign || 'center'] : undefined,
      }}
      data-section-id={sectionId}
      data-section-type="products_slider"
      data-section-name="סליידר מוצרים"
      data-display-limit={displayLimit || ''}
      data-card-style={settings.cardStyle || 'standard'}
      data-hide-on-mobile={settings.hideOnMobile ? 'true' : undefined}
      data-hide-on-desktop={settings.hideOnDesktop ? 'true' : undefined}
    >
      <div 
        className={`${settings.containerType === 'full' ? 'w-full px-4' : 'max-w-7xl mx-auto'}`}
        data-content-wrapper
      >
        {/* Subtitle (Eyebrow) - above title */}
        <p 
          className={`${alignClass} tracking-[0.2em] uppercase mb-4 ${!subtitle ? 'hidden' : ''}`}
          data-section-subtitle
          style={{
            color: settings.subtitleColor || '#9ca3af',
            fontSize: settings.subtitleSize ? `${settings.subtitleSize}px` : '12px',
            fontFamily: settings.subtitleFontFamily ? `'${settings.subtitleFontFamily}', sans-serif` : undefined,
          }}
        >
          {subtitle || ''}
        </p>
        
        {/* Title - always render for live editing */}
        <h2 
          className={`font-display text-2xl md:text-3xl ${alignClass} font-light tracking-[0.15em] uppercase ${!title ? 'hidden' : ''}`}
          data-section-title
          style={{
            color: settings.titleColor || '#000000',
            fontSize: settings.titleSize ? `${settings.titleSize}px` : undefined,
            fontWeight: settings.titleWeight === 'bold' ? '700' : settings.titleWeight === 'semibold' ? '600' : settings.titleWeight === 'medium' ? '500' : settings.titleWeight === 'light' ? '300' : '400',
            fontFamily: settings.titleFontFamily ? `'${settings.titleFontFamily}', sans-serif` : undefined,
          }}
        >
          {title || ''}
        </h2>
        
        {/* Divider - gold line under title */}
        <div 
          className={`w-16 mt-6 mb-8 ${!title || settings.showDivider === false ? 'hidden' : ''}`}
          style={{ 
            backgroundColor: settings.dividerColor || '#C9A962',
            height: `${settings.dividerHeight || 2}px`,
            marginInlineStart: textAlign === 'center' ? 'auto' : textAlign === 'left' ? '0' : 'auto',
            marginInlineEnd: textAlign === 'center' ? 'auto' : textAlign === 'left' ? 'auto' : '0',
          }}
          data-section-divider
        />
        
        {/* Products Slider */}
        <div className="mt-12" data-products-slider>
          <AutoSlider
            settings={sliderSettings}
            data-slider-id={sectionId}
            className="relative"
          >
            {visibleProducts.map((product, i) => (
              <div 
                key={product.id}
                className={`animate-slide-up ${settings.showAddToCart ? 'h-full' : ''}`}
                style={{ animationDelay: `${i * 50}ms` }}
                data-product-index={i}
                data-product-id={product.id}
              >
                <ProductCard
                  id={product.id}
                  slug={product.slug}
                  name={product.name}
                  price={Number(product.price)}
                  comparePrice={product.comparePrice ? Number(product.comparePrice) : null}
                  image={product.image || '/placeholder.svg'}
                  cardImage={product.cardImage}
                  cardVideoUrl={product.cardVideoUrl}
                  shortDescription={product.shortDescription}
                  isFeatured={product.isFeatured}
                  basePath={basePath}
                  showDecimalPrices={showDecimalPrices}
                  inventory={product.inventory}
                  trackInventory={product.trackInventory}
                  allowBackorder={product.allowBackorder}
                  automaticDiscount={discountsMap?.get(product.id) || null}
                  hasVariants={product.hasVariants}
                  showAddToCart={settings.showAddToCart}
                  addToCartStyle={settings.addToCartStyle}
                  storeSlug={storeSlug}
                  badges={badgesMap?.get(product.id) || []}
                  showWishlist={showWishlist}
                  cardStyle={settings.cardStyle}
                  cardTextAlign={settings.textAlign}
                  imageAspectRatio={settings.imageAspectRatio}
                  imagePosition={settings.imagePosition}
                  imageFit={settings.imageFit}
                  productNameLines={settings.productNameLines}
                />
              </div>
            ))}
          </AutoSlider>
        </div>
      </div>
    </section>
  );
}
