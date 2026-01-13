/**
 * V2 Product Page Renderer
 * 
 * This is the NEW fully section-based product page.
 * All rendering is controlled by V2 sections from productPageSections.
 * 
 * IMPORTANT: This is a Server Component for maximum performance!
 */

import { ProductPageSection, GallerySectionSettings, InfoSectionSettings, DescriptionSectionSettings, RelatedSectionSettings, ReviewsSectionSettings } from '@/lib/product-page-sections';
import { type DynamicContentContext, resolveDynamicContent } from '@/lib/dynamic-content';
import { ProductSection } from './index';
import { ProductImage } from '@/components/product-image';
import { ProductReviewsSection } from '@/components/reviews/product-reviews-section';
import { ProductCard } from '@/components/product-card';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { VariantSelector } from '@/components/variant-selector';
import { ProductWithAddons } from '@/components/product-with-addons';
import { featureIcons } from '@/lib/product-page-settings';
import { formatPrice, decodeHtmlEntities } from '@/lib/format-price';
import Link from 'next/link';
import {
  LiveGallerySection,
  LiveFeaturesSection,
  LiveTitleWrapper,
  LivePriceWrapper,
  LiveInventoryDisplay,
  LiveDescriptionSection,
  LiveRelatedProducts,
} from '@/components/storefront/product-page-preview';

// ============================================
// Types
// ============================================

interface V2ProductPageProps {
  sections: ProductPageSection[];
  product: {
    id: string;
    name: string;
    description: string | null;
    shortDescription: string | null;
    price: string | number;
    comparePrice: string | number | null;
    discountedPrice?: string | number | null;
    images: string[];
    mainImage?: string | null;
    hasVariants: boolean;
    trackInventory: boolean;
    inventory: number | null;
    sku: string | null;
    isFeatured: boolean;
    allowBackorder?: boolean;
    storeId: string;
  };
  variants: {
    id: string;
    title: string;
    price: string;
    comparePrice: string | null;
    inventory: number | null;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    allowBackorder: boolean;
    sku: string | null;
  }[];
  options: {
    id: string;
    name: string;
    displayType: 'button' | 'color' | 'pattern' | 'image';
    values: {
      id: string;
      value: string;
      metadata: Record<string, unknown> | null;
      sortOrder: number;
    }[];
  }[];
  relatedProducts: {
    id: string;
    name: string;
    slug: string;
    price: string | number;
    comparePrice: string | number | null;
    images: string[];
    inventory: number | null;
    trackInventory: boolean;
    allowBackorder: boolean;
    hasVariants: boolean;
  }[];
  productAddons: {
    id: string;
    name: string;
    description: string | null;
    price: string;
    isRequired: boolean;
    maxQuantity: number;
  }[];
  context: DynamicContentContext;
  basePath: string;
  showDecimalPrices: boolean;
  isPreviewMode: boolean;
  discountLabels: string[];
  compareDiscount: number | null;
  firstCategory: { id: string; name: string; slug: string } | null;
  storeSlug: string;
  categoryIds: string[];
}

// ============================================
// V2 Product Page Component
// ============================================

export function V2ProductPage({
  sections,
  product,
  variants,
  options,
  relatedProducts,
  productAddons,
  context,
  basePath,
  showDecimalPrices,
  isPreviewMode,
  discountLabels,
  compareDiscount,
  firstCategory,
  storeSlug,
  categoryIds,
}: V2ProductPageProps) {
  // Sort sections by sortOrder and filter active
  const activeSections = sections
    .filter(s => s.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Find gallery and info sections to render them together
  const gallerySection = activeSections.find(s => s.type === 'product_gallery');
  const infoSection = activeSections.find(s => s.type === 'product_info');
  
  // Get gallery settings
  const gallerySettings = (gallerySection?.settings || {}) as Partial<GallerySectionSettings>;
  const infoSettings = (infoSection?.settings || {}) as Partial<InfoSectionSettings>;
  
  // Format price helper
  const format = (p: number | string | null | undefined) => formatPrice(p, { showDecimal: showDecimalPrices });
  
  // Get main image
  const mainImage = product.mainImage || product.images[0] || '/placeholder.svg';
  
  // Check if gallery and info should be rendered (they're rendered together)
  const hasGalleryOrInfo = gallerySection || infoSection;
  
  // Sections that are NOT gallery/info (rendered separately)
  const otherSections = activeSections.filter(s => 
    s.type !== 'product_gallery' && s.type !== 'product_info'
  );
  
  // Find description section  
  const descriptionSection = activeSections.find(s => s.type === 'product_description');
  const descSettings = (descriptionSection?.settings || {}) as Partial<DescriptionSectionSettings>;
  
  // V1-compatible features for LiveFeaturesSection
  const v1Features = [
    { id: '1', icon: 'truck', text: 'משלוח חינם מעל ₪200', isVisible: true },
    { id: '2', icon: 'refresh', text: '14 יום להחזרה', isVisible: true },
    { id: '3', icon: 'shield', text: 'אחריות יצרן', isVisible: true },
  ];
  
  // Render individual sections
  const renderSection = (section: ProductPageSection) => {
    switch (section.type) {
      case 'breadcrumb':
        return (
          <nav 
            key={section.id}
            className="py-6 px-6 border-b border-gray-100"
            data-section-id={section.id}
            data-section-type={section.type}
          >
            <div className="max-w-7xl mx-auto">
              <ol className="flex items-center gap-2 text-sm text-gray-500">
                <li>
                  <Link href={basePath || '/'} className="hover:text-black transition-colors">
                    בית
                  </Link>
                </li>
                <li>/</li>
                {firstCategory ? (
                  <>
                    <li>
                      <Link 
                        href={`${basePath}/products?category=${firstCategory.slug}`} 
                        className="hover:text-black transition-colors"
                      >
                        {firstCategory.name}
                      </Link>
                    </li>
                    <li>/</li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link href={`${basePath}/products`} className="hover:text-black transition-colors">
                        מוצרים
                      </Link>
                    </li>
                    <li>/</li>
                  </>
                )}
                <li className="text-black truncate">{product.name}</li>
              </ol>
            </div>
          </nav>
        );
        
      case 'product_description':
        if (!product.description) return null;
        const showAsAccordion = descSettings.style === 'accordion';
        return (
          <div 
            key={section.id}
            className="py-8 px-6"
            data-section-id={section.id}
            data-section-type={section.type}
          >
            <div className="max-w-7xl mx-auto">
              {showAsAccordion ? (
                <details className="group border-b border-gray-200">
                  <summary className="flex items-center justify-between py-4 cursor-pointer list-none">
                    <span className="text-[11px] tracking-[0.2em] uppercase text-black">
                      {descSettings.accordionTitle || 'תיאור'}
                    </span>
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
                    <div 
                      className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(product.description) }}
                    />
                  </div>
                </details>
              ) : (
                <>
                  <h3 className="text-[11px] tracking-[0.2em] uppercase text-black mb-4">תיאור</h3>
                  <div 
                    className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(product.description) }}
                  />
                </>
              )}
            </div>
          </div>
        );
        
      case 'product_reviews':
        return (
          <div 
            key={section.id}
            className="py-8 px-6"
            data-section-id={section.id}
            data-section-type={section.type}
          >
            <div className="max-w-7xl mx-auto">
              <ProductReviewsSection
                productId={product.id}
                storeId={product.storeId}
                storeSlug={storeSlug}
              />
            </div>
          </div>
        );
        
      case 'product_related':
        const relatedSettings = section.settings as Partial<RelatedSectionSettings>;
        const count = relatedSettings.count ?? 4;
        const displayProducts = relatedProducts.slice(0, count);
        
        if (displayProducts.length === 0) return null;
        
        return (
          <section 
            key={section.id}
            className="py-16 px-6 bg-gray-50"
            data-section-id={section.id}
            data-section-type={section.type}
          >
            <div className="max-w-7xl mx-auto">
              <h2 className="text-[11px] tracking-[0.2em] uppercase text-black mb-8 text-center">
                {section.title || 'אולי יעניין אותך'}
              </h2>
              {section.subtitle && (
                <p className="text-center text-gray-500 text-sm mb-8">{section.subtitle}</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {displayProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    slug={p.slug}
                    price={Number(p.price)}
                    comparePrice={p.comparePrice ? Number(p.comparePrice) : null}
                    image={p.images[0] || '/placeholder.svg'}
                    basePath={basePath}
                    showDecimalPrices={showDecimalPrices}
                    inventory={p.inventory}
                    trackInventory={p.trackInventory}
                    allowBackorder={p.allowBackorder}
                  />
                ))}
              </div>
            </div>
          </section>
        );
        
      case 'features':
        // Use V2 ProductSection for features
        return (
          <div key={section.id} className="py-4 px-6">
            <div className="max-w-7xl mx-auto">
              <ProductSection section={section} context={context} />
            </div>
          </div>
        );
        
      case 'accordion':
      case 'tabs':
      case 'text_block':
      case 'divider':
      case 'spacer':
        return (
          <div key={section.id} className="py-4 px-6">
            <div className="max-w-7xl mx-auto">
              <ProductSection section={section} context={context} />
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Determine gallery layout based on settings
  const thumbnailsPosition = gallerySettings.thumbnailsPosition ?? 'bottom';
  const aspectRatio = gallerySettings.aspectRatio ?? '3:4';
  const enableZoom = gallerySettings.enableZoom ?? true;
  const showArrows = gallerySettings.showArrows ?? true;
  const layout = gallerySettings.layout ?? 'carousel';

  // V1-compatible gallery settings for LiveGallerySection
  const v1GallerySettings = {
    visible: true,
    thumbnailsPosition,
    thumbnailsPositionMobile: gallerySettings.thumbnailsPositionMobile ?? 'bottom',
    aspectRatio,
    enableZoom,
    showArrows,
    layout,
    showDotsOnMobile: gallerySettings.showDotsOnMobile ?? false,
  };
  
  // Info settings
  const showComparePrice = infoSettings.showComparePrice ?? true;
  const showDiscount = infoSettings.showDiscount ?? true;
  const discountStyle = infoSettings.discountStyle ?? 'badge';
  const inventoryDisplay = infoSettings.inventoryDisplay ?? 'count';
  const lowStockThreshold = infoSettings.lowStockThreshold ?? 5;
  
  // Calculate display values
  const hasAutomaticDiscount = !!product.discountedPrice && product.discountedPrice !== product.price;
  const finalPrice = hasAutomaticDiscount ? product.discountedPrice : product.price;
  const effectiveComparePrice = hasAutomaticDiscount 
    ? product.price 
    : product.comparePrice;
  
  // Inventory helper
  const showInventory = (inventory: number | null, trackInventory: boolean) => {
    if (!trackInventory) return null;
    if (inventory === null) return null;
    
    switch (inventoryDisplay) {
      case 'count':
        return `${inventory} במלאי`;
      case 'low_stock':
        return inventory <= lowStockThreshold ? `נותרו רק ${inventory}!` : null;
      case 'in_stock':
        return inventory > 0 ? 'במלאי' : 'אזל מהמלאי';
      case 'hidden':
      default:
        return null;
    }
  };

  // Find sections before and after the main product section (gallery + info)
  // Breadcrumb always comes first, then gallery/info, then description (optionally inside info), then other content
  const breadcrumbSection = otherSections.find(s => s.type === 'breadcrumb');
  const contentSections = otherSections.filter(s => 
    s.type !== 'breadcrumb' && 
    s.type !== 'product_description' && 
    s.type !== 'product_reviews' && 
    s.type !== 'product_related'
  );
  const reviewsSection = otherSections.find(s => s.type === 'product_reviews');
  const relatedSection = otherSections.find(s => s.type === 'product_related');

  return (
    <>
      {/* Breadcrumb */}
      {breadcrumbSection && renderSection(breadcrumbSection)}

      {/* Product Section - Gallery + Info */}
      {hasGalleryOrInfo && (
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-start ${
              thumbnailsPosition === 'right' ? 'lg:flex-row-reverse' : ''
            }`}>
              {/* Gallery */}
              {gallerySection && (
                <div
                  data-section-id={gallerySection.id}
                  data-section-type="product_gallery"
                >
                  <LiveGallerySection
                    mainImage={mainImage || ''}
                    productName={product.name}
                    images={product.images.map((url, i) => ({ id: `img-${i}`, url }))}
                    initialSettings={v1GallerySettings}
                    ProductImageComponent={ProductImage}
                  />
                </div>
              )}

              {/* Product Info */}
              {infoSection && (
                <div 
                  data-section-id={infoSection.id}
                  data-section-type="product_info"
                >
                  {/* Badges */}
                  {((compareDiscount && compareDiscount > 0 && showDiscount && 
                    (discountStyle === 'badge' || discountStyle === 'both')) || 
                    discountLabels.length > 0 || product.isFeatured) && (
                    <div className="flex flex-wrap gap-3 mb-6">
                      {compareDiscount && compareDiscount > 0 && showDiscount && 
                       (discountStyle === 'badge' || discountStyle === 'both') && (
                        <span className="text-[10px] tracking-[0.15em] uppercase bg-black text-white px-3 py-1.5">
                          -{compareDiscount}%
                        </span>
                      )}
                      {discountLabels.map((label, i) => (
                        <span key={i} className="text-[10px] tracking-[0.15em] uppercase bg-green-500 text-white px-3 py-1.5">
                          {label}
                        </span>
                      ))}
                      {product.isFeatured && (
                        <span className="text-[10px] tracking-[0.15em] uppercase border border-black px-3 py-1.5">
                          מומלץ
                        </span>
                      )}
                    </div>
                  )}

                  {/* Title */}
                  {isPreviewMode ? (
                    <LiveTitleWrapper initialTypography={infoSettings.typography?.title}>
                      {product.name}
                    </LiveTitleWrapper>
                  ) : (
                    <h1 className="text-2xl md:text-3xl font-light text-black mb-6">
                      {product.name}
                    </h1>
                  )}

                  {/* Price */}
                  {isPreviewMode ? (
                    <LivePriceWrapper
                      price={format(finalPrice)}
                      comparePrice={effectiveComparePrice ? format(effectiveComparePrice) : null}
                      discount={compareDiscount}
                      initialTypography={{
                        price: infoSettings.typography?.price,
                        comparePrice: infoSettings.typography?.comparePrice,
                      }}
                      initialPriceSettings={{
                        showComparePrice,
                        showDiscount,
                        discountStyle,
                      }}
                    />
                  ) : (
                    <div className="flex items-baseline gap-4 mb-6">
                      <span className="text-xl font-medium text-black">
                        {format(finalPrice)}
                      </span>
                      {showComparePrice && effectiveComparePrice && Number(effectiveComparePrice) > Number(finalPrice) && (
                        <span className="text-gray-400 line-through">
                          {format(effectiveComparePrice)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Short Description */}
                  {product.shortDescription && (
                    <p className="text-gray-600 mb-6">{product.shortDescription}</p>
                  )}

                  {/* Inventory Display */}
                  {isPreviewMode ? (
                    <LiveInventoryDisplay
                      inventory={product.inventory}
                      trackInventory={product.trackInventory}
                      allowBackorder={product.allowBackorder ?? false}
                      initialSettings={{
                        displayStyle: inventoryDisplay,
                        lowStockThreshold,
                      }}
                      initialTypography={infoSettings.typography?.inventory}
                    />
                  ) : (
                    product.trackInventory && showInventory(product.inventory, product.trackInventory) && (
                      <p className="text-sm text-gray-500 mb-4">
                        {showInventory(product.inventory, product.trackInventory)}
                      </p>
                    )
                  )}

                  {/* Variant Selector or Add to Cart */}
                  {product.hasVariants && variants.length > 0 ? (
                    <VariantSelector
                      productId={product.id}
                      productName={product.name}
                      productImage={product.images[0] || '/placeholder.svg'}
                      options={options}
                      variants={variants}
                      basePrice={Number(product.price)}
                      baseComparePrice={effectiveComparePrice ? Number(effectiveComparePrice) : null}
                      categoryIds={categoryIds}
                      storeSlug={storeSlug}
                    />
                  ) : (
                    // Note: ProductWithAddons support is still available in V1 rendering
                    // For V2, we use the simple AddToCartButton
                    <AddToCartButton
                      productId={product.id}
                      name={product.name}
                      price={Number(product.price)}
                      image={product.images[0] || '/placeholder.svg'}
                      inventory={product.inventory}
                      trackInventory={product.trackInventory}
                      allowBackorder={product.allowBackorder ?? false}
                      automaticDiscountName={discountLabels.join(' + ') || undefined}
                      discountedPrice={hasAutomaticDiscount ? Number(finalPrice) : undefined}
                      categoryIds={categoryIds}
                    />
                  )}

                  {/* Description - inside info if present */}
                  {descriptionSection && product.description && (
                    <div className="mt-8 border-t pt-8">
                      {isPreviewMode ? (
                        <LiveDescriptionSection
                          description={decodeHtmlEntities(product.description)}
                          initialShowAsAccordion={descSettings.style === 'accordion'}
                          initialTypography={infoSettings.typography?.button}
                        />
                      ) : descSettings.style === 'accordion' ? (
                        <details className="group border-b border-gray-200">
                          <summary className="flex items-center justify-between py-4 cursor-pointer list-none">
                            <span className="text-[11px] tracking-[0.2em] uppercase text-black">
                              {descSettings.accordionTitle || 'תיאור'}
                            </span>
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
                            <div 
                              className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(product.description) }}
                            />
                          </div>
                        </details>
                      ) : (
                        <>
                          <h3 className="text-[11px] tracking-[0.2em] uppercase text-black mb-4">תיאור</h3>
                          <div 
                            className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(product.description) }}
                          />
                        </>
                      )}
                    </div>
                  )}

                  {/* Features - after info, only if has features section in V2 */}
                  {contentSections.filter(s => s.type === 'features').map(s => (
                    <div key={s.id} className="mt-8 pt-4 border-t">
                      {isPreviewMode ? (
                        <LiveFeaturesSection initialFeatures={v1Features} />
                      ) : (
                        <ProductSection section={s} context={context} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Content Sections - Accordion, Tabs, Text Block (not features, already rendered above) */}
      {contentSections.filter(s => s.type !== 'features').map(section => renderSection(section))}

      {/* Reviews Section */}
      {reviewsSection && renderSection(reviewsSection)}

      {/* Related Products */}
      {relatedSection && renderSection(relatedSection)}
    </>
  );
}

