import { ProductCard } from '@/components/product-card';

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
  name: string;           // שם ההנחה הראשונה (תאימות לאחור)
  names?: string[];       // כל שמות ההנחות
  discountedPrice: number;
  discountPercent: number;
  categoryIds?: string[]; // קטגוריות המוצר - לחישוב הנחות בצ'קאאוט
}

// Badge type for display
interface Badge {
  id: string;
  text: string;
  backgroundColor: string;
  textColor: string;
  position: string;
}

interface ProductsSectionProps {
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
    // Typography
    titleColor?: string;
    titleSize?: number;
    titleSizeMobile?: number;
    titleWeight?: string;
    titleFontFamily?: string;
    subtitleColor?: string;
    subtitleSize?: number;
    subtitleSizeMobile?: number;
    subtitleFontFamily?: string;
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
    layout?: 'grid' | 'slider';
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
    // Image position (where to focus when cropping)
    imagePosition?: 'top' | 'center' | 'bottom';
    // Image fit mode
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
  };
  basePath: string;
  showDecimalPrices?: boolean;
  displayLimit?: number;
  discountsMap?: Map<string, AutomaticDiscount>;
  badgesMap?: Map<string, Badge[]>;
  storeSlug?: string;
  showWishlist?: boolean;
}

export function ProductsSection({ title, subtitle, products, settings, basePath, showDecimalPrices = false, sectionId, displayLimit, discountsMap, badgesMap, storeSlug, showWishlist = false }: ProductsSectionProps & { sectionId?: string }) {
  // Text alignment - default to center
  const textAlign = settings.textAlign || 'center';
  const alignClass = textAlign === 'right' ? 'text-right' : textAlign === 'left' ? 'text-left' : 'text-center';
  
  // Visibility classes
  const hideOnMobileClass = settings.hideOnMobile ? 'max-md:hidden' : '';
  const hideOnDesktopClass = settings.hideOnDesktop ? 'md:hidden' : '';
  
  // Grid columns
  const columns = settings.columns || 4;
  const mobileColumns = settings.mobileColumns || 2;
  const gap = settings.gap || 32;
  
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
  
  return (
    <>
      {/* Scoped CSS for responsive grid */}
      <style dangerouslySetInnerHTML={{ __html: `
        [data-section-id="${sectionId}"] [data-products-grid] {
          grid-template-columns: repeat(${mobileColumns}, minmax(0, 1fr));
        }
        @media (min-width: 1024px) {
          [data-section-id="${sectionId}"] [data-products-grid] {
            grid-template-columns: repeat(${columns}, minmax(0, 1fr));
          }
        }
      `}} />
      <section 
        id={settings.customId || 'products'} 
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
      data-section-type="products"
      data-section-name="מוצרים נבחרים"
      data-display-limit={displayLimit || ''}
      data-card-style={settings.cardStyle || 'standard'}
      data-hide-on-mobile={settings.hideOnMobile ? 'true' : undefined}
      data-hide-on-desktop={settings.hideOnDesktop ? 'true' : undefined}
    >
      <div 
        className={`${settings.sectionWidth === 'full' || settings.containerType === 'full' ? 'w-full' : 'max-w-7xl mx-auto'}`}
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
        
        <div 
          className={`grid ${settings.showAddToCart ? 'items-stretch' : ''} mt-12`} 
          style={{ 
            gap: `${gap}px`,
          }}
          data-products-grid
          data-columns={columns}
          data-mobile-columns={mobileColumns}
        >
          {products.map((product, i) => (
            <div 
              key={product.id} 
              className={`animate-slide-up ${displayLimit && i >= displayLimit ? 'hidden' : ''} ${settings.showAddToCart ? 'h-full' : ''}`}
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
        </div>
      </div>
    </section>
    </>
  );
}


