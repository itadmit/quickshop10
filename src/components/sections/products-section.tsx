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
    subtitleColor?: string;
    subtitleSize?: number;
    subtitleSizeMobile?: number;
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
  // Text alignment classes
  const alignClass = settings.textAlign === 'right' ? 'text-right' : settings.textAlign === 'left' ? 'text-left' : 'text-center';
  
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
      data-hide-on-mobile={settings.hideOnMobile ? 'true' : undefined}
      data-hide-on-desktop={settings.hideOnDesktop ? 'true' : undefined}
    >
      <div 
        className={`${settings.containerType === 'full' ? 'w-full px-4' : 'max-w-7xl mx-auto'}`}
        data-content-wrapper
      >
        {/* Title - always render for live editing */}
        <h2 
          className={`font-display ${alignClass} mb-4 tracking-[0.15em] uppercase ${!title ? 'hidden' : ''}`}
          data-section-title
          style={{
            color: settings.titleColor || '#000000',
            fontSize: settings.titleSize ? `${settings.titleSize}px` : undefined,
            fontWeight: settings.titleWeight === 'bold' ? '700' : settings.titleWeight === 'semibold' ? '600' : settings.titleWeight === 'medium' ? '500' : settings.titleWeight === 'light' ? '300' : '400',
          }}
        >
          {title || ''}
        </h2>
        
        {/* Subtitle - always render for live editing */}
        <p 
          className={`${alignClass} tracking-[0.2em] uppercase mb-20 ${!subtitle ? 'hidden' : ''}`}
          data-section-subtitle
          style={{
            color: settings.subtitleColor || '#9ca3af',
            fontSize: settings.subtitleSize ? `${settings.subtitleSize}px` : '12px',
          }}
        >
          {subtitle || ''}
        </p>
        
        <div 
          className={`grid grid-cols-${mobileColumns} lg:grid-cols-${columns} ${settings.showAddToCart ? 'items-stretch' : ''}`} 
          style={{ gap: `${gap}px` }}
          data-products-grid
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
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


