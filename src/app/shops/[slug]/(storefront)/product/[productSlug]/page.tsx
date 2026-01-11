import { getStoreBySlug, getProductBySlug, getProductsByStore, getProductOptions, getProductVariants, getCategoriesByStore, getProductCategoryIds, getProductAddonsForStorefront, getFooterMenuItems } from '@/lib/db/queries';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { VariantSelector } from '@/components/variant-selector';
import { ProductWithAddons } from '@/components/product-with-addons';
import { ProductCard } from '@/components/product-card';
import { ProductImage } from '@/components/product-image';
import { StoreFooter } from '@/components/store-footer';
import { TrackViewProduct } from '@/components/tracking-events';
import { ScrollToTop } from '@/components/scroll-to-top';
import { formatPrice, decodeHtmlEntities } from '@/lib/format-price';
import { isOutOfStock } from '@/lib/inventory';
import { ProductReviewsSection } from '@/components/reviews/product-reviews-section';
import { getProductPageSettings, getVisibleSections, featureIcons, type ProductPageSettings } from '@/lib/product-page-settings';
import { getProductAutomaticDiscounts } from '@/app/actions/automatic-discount';
import { 
  ProductPagePreviewProvider, 
  LiveFeaturesSection, 
  LiveRelatedTitle,
  LiveGallerySection,
  LiveTitleWrapper,
  LivePriceWrapper,
  LiveSectionVisibility,
  LiveRelatedProducts,
  LiveInventoryDisplay,
} from '@/components/storefront/product-page-preview';
import { EditorSectionHighlighter } from '@/components/storefront/editor-section-highlighter';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

// Section name labels for editor (Hebrew)
const sectionNames: Record<string, string> = {
  breadcrumb: 'ניווט',
  gallery: 'גלריית תמונות',
  info: 'מידע מוצר',
  features: 'חוזקות',
  description: 'תיאור',
  reviews: 'ביקורות',
  related: 'מוצרים דומים',
};

// ISR - Revalidate every 60 seconds  
export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ slug: string; productSlug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug, productSlug } = await params;
  const { preview } = await searchParams;
  const isPreviewMode = preview === 'true';
  
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Handle "sample" slug for editor preview - get first product
  let decodedSlug = decodeURIComponent(productSlug);
  if (decodedSlug === 'sample') {
    const sampleProducts = await getProductsByStore(store.id, 1);
    if (sampleProducts.length > 0) {
      decodedSlug = sampleProducts[0].slug;
    }
  }
  
  const product = await getProductBySlug(store.id, decodedSlug);

  if (!product) {
    notFound();
  }

  const headersList = await headers();
  const basePath = headersList.get('x-custom-domain') ? '' : `/shops/${slug}`;
  
  // Get price display settings & product page settings
  const storeSettings = (store.settings as Record<string, unknown>) || {};
  const showDecimalPrices = Boolean(storeSettings.showDecimalPrices);
  const pageSettings = getProductPageSettings(storeSettings);
  const visibleSections = getVisibleSections(pageSettings);
  const format = (p: number | string | null | undefined) => formatPrice(p, { showDecimal: showDecimalPrices });

  // Get variants, related products, categories, and automatic discount in parallel - maximum speed!
  // In preview mode, fetch up to 8 products to allow dynamic count changes
  const maxRelatedProducts = isPreviewMode ? 9 : pageSettings.related.count + 1;
  const [options, variants, allProducts, categories, productCategoryIds, productAddons, footerMenuItems] = await Promise.all([
    product.hasVariants ? getProductOptions(product.id) : Promise.resolve([]),
    product.hasVariants ? getProductVariants(product.id) : Promise.resolve([]),
    getProductsByStore(store.id, maxRelatedProducts),
    getCategoriesByStore(store.id),
    // Get all product categories (for automatic discount check)
    getProductCategoryIds(product.id),
    // Get product addons (for display in product page)
    getProductAddonsForStorefront(product.id),
    // Get footer menu items
    getFooterMenuItems(store.id),
  ]);
  
  // Get related products (all available for preview mode, limited for production)
  const relatedProducts = allProducts.filter(p => p.id !== product.id).slice(0, isPreviewMode ? 8 : pageSettings.related.count);

  const mainImage = product.images.find(img => img.isPrimary)?.url || product.images[0]?.url;
  
  // 🆕 Calculate base price - for products with variants, use min variant price
  const minVariantPrice = variants.length > 0 
    ? Math.min(...variants.map(v => Number(v.price)))
    : 0;
  const effectivePrice = product.hasVariants && variants.length > 0 
    ? minVariantPrice 
    : Number(product.price);

  // Get automatic discounts for this product (server-side, no extra round trips)
  // 🆕 Now uses effective price (variant or product price)
  const automaticDiscountsResult = await getProductAutomaticDiscounts(store.id, product.id, productCategoryIds, effectivePrice);
  
  // Calculate discounts
  const hasAutomaticDiscount = automaticDiscountsResult.discounts.length > 0;
  
  // For products with variants, check variant compare prices; otherwise use product compare price
  const effectiveComparePrice = product.hasVariants && variants.length > 0 
    ? (variants[0].comparePrice ? Number(variants[0].comparePrice) : null)
    : (product.comparePrice ? Number(product.comparePrice) : null);
  const hasCompareDiscount = effectiveComparePrice && effectiveComparePrice > effectivePrice;
  const hasDiscount = hasAutomaticDiscount || hasCompareDiscount;
  
  // 🔑 Compare price discount - שחור (רק הנחת מחיר השוואה, לא כולל הנחות אוטומטיות)
  const compareDiscount = hasCompareDiscount 
    ? Math.round((1 - effectivePrice / effectiveComparePrice) * 100) 
    : null;
  
  // Calculate final price (after all discounts)
  const basePrice = effectivePrice;
  const finalPrice = hasAutomaticDiscount ? automaticDiscountsResult.finalPrice : basePrice;
  const originalPrice = hasCompareDiscount ? effectiveComparePrice : basePrice;
  
  // Total discount for display (based on original vs final price)
  const discount = hasDiscount && originalPrice > 0
    ? Math.round((1 - finalPrice / originalPrice) * 100) 
    : null;
  
  // 🆕 All automatic discount names for green badges
  const discountLabels = automaticDiscountsResult.discounts.map(d => d.name);
  const discountLabel = discountLabels.length > 0 ? discountLabels[0] : null;

  // Track product view
  const trackingProduct = {
    id: product.id,
    name: product.name,
    price: effectivePrice,
    compareAtPrice: effectiveComparePrice,
    image: mainImage,
  };

  // Helper to check if section is visible
  const isSectionVisible = (type: string) => visibleSections.some(s => s.type === type);

  // Get CSS classes for title
  const getTitleClasses = (settings: ProductPageSettings['title']) => {
    const sizes = { small: 'text-2xl md:text-3xl', medium: 'text-3xl md:text-4xl', large: 'text-4xl md:text-5xl' };
    const weights = { light: 'font-light', normal: 'font-normal', bold: 'font-bold' };
    return `font-display ${sizes[settings.fontSize]} ${weights[settings.fontWeight]} tracking-[0.05em] mb-4`;
  };

  // Get CSS classes for price
  const getPriceClasses = (settings: ProductPageSettings['price']) => {
    const sizes = { small: 'text-lg', medium: 'text-2xl', large: 'text-3xl' };
    return `${sizes[settings.fontSize]} font-display`;
  };

  // Get gallery aspect ratio class
  const getAspectRatioClass = (ratio: ProductPageSettings['gallery']['aspectRatio']) => {
    const ratios = { '1:1': 'aspect-square', '3:4': 'aspect-[3/4]', '4:3': 'aspect-[4/3]', '16:9': 'aspect-video' };
    return ratios[ratio];
  };

  // Render section based on type - with data-section-id for editor interaction
  const renderSection = (sectionType: string) => {
    // Get section ID for editor (prefixed with pp- for product page)
    const sectionId = `pp-${sectionType}`;
    const sectionName = sectionNames[sectionType] || sectionType;
    
    switch (sectionType) {
      case 'breadcrumb':
        return (
          <nav 
            key="breadcrumb" 
            className="py-6 px-6 border-b border-gray-100"
            data-section-id={sectionId}
            data-section-name={sectionName}
          >
            <div className="max-w-7xl mx-auto">
              <ol className="flex items-center gap-2 text-sm text-gray-500">
                <li><Link href={basePath || '/'} className="hover:text-black transition-colors">בית</Link></li>
                <li>/</li>
                <li><Link href={`${basePath}#products`} className="hover:text-black transition-colors">מוצרים</Link></li>
                <li>/</li>
                <li className="text-black truncate">{product.name}</li>
              </ol>
            </div>
          </nav>
        );

      case 'gallery':
      case 'info':
        // These are rendered together in the main product section
        return null;

      case 'features':
        // In preview mode, use LiveFeaturesSection for real-time updates
        if (isPreviewMode) {
          return (
            <div 
              key="features" 
              data-section-id={sectionId}
              data-section-name={sectionName}
            >
              <LiveFeaturesSection initialFeatures={pageSettings.features} />
            </div>
          );
        }
        // Server-side render for production - zero JS!
        const visibleFeatures = pageSettings.features.filter(f => f.isVisible);
        if (visibleFeatures.length === 0) return null;
        return (
          <div 
            key="features" 
            className="space-y-4 mt-8"
            data-section-id={sectionId}
            data-section-name={sectionName}
          >
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

      case 'description':
        if (!product.description) return null;
        return (
          <div 
            key="description" 
            className="mb-8"
            data-section-id={sectionId}
            data-section-name={sectionName}
          >
            <h3 className="text-[11px] tracking-[0.2em] uppercase text-black mb-4">תיאור</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {decodeHtmlEntities(product.description)}
            </p>
          </div>
        );

      case 'reviews':
        return (
          <div
            key="reviews"
            data-section-id={sectionId}
            data-section-name={sectionName}
          >
            <ProductReviewsSection
              productId={product.id}
              storeId={store.id}
              storeSlug={slug}
            />
          </div>
        );

      case 'related':
        if (relatedProducts.length === 0 && !pageSettings.related.showIfEmpty) return null;
        
        // In preview mode, use LiveRelatedProducts for dynamic count updates
        if (isPreviewMode) {
          return (
            <div
              key="related"
              data-section-id={sectionId}
              data-section-name={sectionName}
            >
              <LiveRelatedProducts initialCount={pageSettings.related.count}>
                {relatedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    slug={p.slug}
                    name={p.name}
                    price={Number(p.price)}
                    comparePrice={p.comparePrice ? Number(p.comparePrice) : null}
                    image={p.image || '/placeholder.svg'}
                    basePath={basePath}
                    showDecimalPrices={showDecimalPrices}
                    inventory={p.inventory}
                    trackInventory={p.trackInventory}
                    allowBackorder={p.allowBackorder}
                  />
                ))}
              </LiveRelatedProducts>
            </div>
          );
        }
        
        // Production: Server-rendered for speed
        return (
          <section 
            key="related" 
            className="py-20 px-6 bg-gray-50"
            data-section-id={sectionId}
            data-section-name={sectionName}
          >
            <div className="max-w-7xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl text-center mb-4 font-light tracking-widest">
                {pageSettings.related.title}
              </h2>
              <p className="text-center text-gray-500 text-sm tracking-wide mb-12">
                {pageSettings.related.subtitle}
              </p>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
                {relatedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    slug={p.slug}
                    name={p.name}
                    price={Number(p.price)}
                    comparePrice={p.comparePrice ? Number(p.comparePrice) : null}
                    image={p.image || '/placeholder.svg'}
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

      default:
        return null;
    }
  };

  // Page content - conditionally wrapped for preview mode
  const pageContent = (
    <div className="min-h-screen bg-white">
      {/* Scroll to top on page load */}
      <ScrollToTop />
      
      {/* Editor Section Highlighter - ONLY in preview mode for click-to-select */}
      {isPreviewMode && <EditorSectionHighlighter />}
      
      {/* Track ViewContent event */}
      <TrackViewProduct product={trackingProduct} />
      
      {/* Breadcrumb - based on settings */}
      {isSectionVisible('breadcrumb') && renderSection('breadcrumb')}

      {/* Product Section - Gallery + Info */}
      {(isSectionVisible('gallery') || isSectionVisible('info')) && (
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 ${
              pageSettings.gallery.thumbnailsPosition === 'right' ? 'lg:flex-row-reverse' : ''
            }`}>
              {/* Gallery - Use LiveGallerySection in preview mode for ALL gallery settings */}
              {isSectionVisible('gallery') && (
                <div
                  data-section-id="pp-gallery"
                  data-section-name="גלריית תמונות"
                >
                  {isPreviewMode ? (
                    <LiveGallerySection
                      mainImage={mainImage || ''}
                      productName={product.name}
                      images={product.images}
                      initialSettings={pageSettings.gallery}
                      ProductImageComponent={ProductImage}
                    />
                  ) : (
                    <div className={`space-y-4 ${
                      pageSettings.gallery.thumbnailsPosition === 'right' ? 'lg:order-2' : ''
                    } ${pageSettings.gallery.thumbnailsPosition === 'left' ? 'lg:order-1 lg:flex lg:flex-row-reverse lg:gap-4' : ''}`}>
                      {/* Main Image */}
                      <div className={`${getAspectRatioClass(pageSettings.gallery.aspectRatio)} bg-gray-50 overflow-hidden ${
                        pageSettings.gallery.thumbnailsPosition === 'left' ? 'flex-1' : ''
                      }`}>
                        <ProductImage 
                          src={mainImage}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="eager"
                        />
                      </div>
                      
                      {/* Thumbnails */}
                      {pageSettings.gallery.thumbnailsPosition !== 'hidden' && product.images.length > 1 && (
                        <div className={`${
                          pageSettings.gallery.thumbnailsPosition === 'left' 
                            ? 'flex flex-col gap-4 w-20' 
                            : 'grid grid-cols-4 gap-4'
                        }`}>
                          {product.images.map((img, i) => (
                            <div key={img.id} className="aspect-square bg-gray-50 overflow-hidden cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
                              <ProductImage 
                                src={img.url}
                                alt={`${product.name} ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Product Info */}
              {isSectionVisible('info') && (
                <div 
                  className="lg:sticky lg:top-24"
                  data-section-id="pp-info"
                  data-section-name="מידע מוצר"
                >
                  {/* Badges - מעל שם המוצר */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    {/* Compare Price Discount Badge (BLACK) - הנחת מחיר השוואה בלבד */}
                    {compareDiscount && compareDiscount > 0 && (
                      <span className="text-[10px] tracking-[0.15em] uppercase bg-black text-white px-3 py-1.5">
                        -{compareDiscount}%
                      </span>
                    )}
                    
                    {/* Automatic Discount Badges (GREEN) - שמות ההנחות האוטומטיות */}
                    {discountLabels.map((label, i) => (
                      <span key={i} className="text-[10px] tracking-[0.15em] uppercase bg-green-500 text-white px-3 py-1.5">
                        {label}
                      </span>
                    ))}
                    
                    {/* Featured Badge */}
                    {product.isFeatured && (
                      <span className="text-[10px] tracking-[0.15em] uppercase border border-black px-3 py-1.5">
                        מומלץ
                      </span>
                    )}
                  </div>

                  {/* Title - Use LiveTitleWrapper in preview mode for real-time styling */}
                  {isPreviewMode ? (
                    <LiveTitleWrapper initialSettings={pageSettings.title}>
                      {product.name}
                    </LiveTitleWrapper>
                  ) : (
                    <h1 className={getTitleClasses(pageSettings.title)}>
                      {product.name}
                    </h1>
                  )}

                  {/* Short Description */}
                  {product.shortDescription && (
                    <p className="text-gray-500 mb-6">
                      {decodeHtmlEntities(product.shortDescription)}
                    </p>
                  )}

                  {/* Variants or Simple Add to Cart */}
                  {product.hasVariants && options.length > 0 ? (
                    <VariantSelector
                      productId={product.id}
                      productName={product.name}
                      productImage={mainImage || '/placeholder.svg'}
                      options={options}
                      variants={variants}
                      basePrice={variants.length > 0 ? Number(variants[0].price) : 0}
                      baseComparePrice={variants.length > 0 && variants[0].comparePrice ? Number(variants[0].comparePrice) : null}
                      automaticDiscountName={discountLabels.join(' + ') || undefined}
                      automaticDiscounts={automaticDiscountsResult.discounts.map(d => ({
                        type: d.type,
                        value: d.value,
                        name: d.name,
                      }))}
                      categoryIds={productCategoryIds}
                    />
                  ) : (
                    <>
                      {/* Price - Use LivePriceWrapper in preview mode */}
                      {isPreviewMode ? (
                        <LivePriceWrapper
                          price={format(finalPrice)}
                          comparePrice={hasDiscount ? format(originalPrice) : null}
                          discount={discount}
                          initialSettings={pageSettings.price}
                        />
                      ) : (
                        <div className="flex flex-wrap items-center gap-4 mb-8">
                          {/* Final Price */}
                          <span className={getPriceClasses(pageSettings.price)}>{format(finalPrice)}</span>
                          
                          {/* Original Price (crossed out) */}
                          {pageSettings.price.showComparePrice && hasDiscount && (
                            <span className="text-lg text-gray-400 line-through">{format(originalPrice)}</span>
                          )}
                          
                          {/* Total Discount Percentage - הנחה כוללת */}
                          {pageSettings.price.showDiscount && hasDiscount && 
                           (pageSettings.price.discountStyle === 'text' || pageSettings.price.discountStyle === 'both') && (
                            <span className="text-sm text-green-600 font-medium">הנחה כוללת: -{discount}%</span>
                          )}
                        </div>
                      )}

                      {/* Add to Cart - with optional addons */}
                      {/* If product has addons, use ProductWithAddons component */}
                      {productAddons.length > 0 ? (
                        <ProductWithAddons
                          productId={product.id}
                          productName={product.name}
                          productSlug={product.slug}
                          basePrice={Number(product.price)}
                          finalPrice={finalPrice}
                          image={mainImage || '/placeholder.svg'}
                          sku={product.sku || undefined}
                          inventory={product.inventory}
                          trackInventory={product.trackInventory}
                          allowBackorder={product.allowBackorder}
                          addons={productAddons}
                          automaticDiscountName={discountLabels.join(' + ') || undefined}
                          discountedPrice={hasAutomaticDiscount ? finalPrice : undefined}
                          categoryIds={productCategoryIds}
                          className="mb-4"
                          showDecimalPrices={showDecimalPrices}
                        />
                      ) : (
                        <AddToCartButton 
                          productId={product.id}
                          name={product.name}
                          price={Number(product.price)}
                          image={mainImage || '/placeholder.svg'}
                          sku={product.sku || undefined}
                          inventory={product.inventory}
                          trackInventory={product.trackInventory}
                          allowBackorder={product.allowBackorder}
                          className="w-full mb-4"
                          automaticDiscountName={discountLabels.join(' + ') || undefined}
                          discountedPrice={hasAutomaticDiscount ? finalPrice : undefined}
                          categoryIds={productCategoryIds}
                        />
                      )}

                      {/* Stock Status - Live Preview */}
                      <LiveInventoryDisplay
                        inventory={product.inventory}
                        trackInventory={product.trackInventory}
                        allowBackorder={product.allowBackorder}
                        initialSettings={pageSettings.inventory || { displayStyle: 'count', lowStockThreshold: 5 }}
                      />
                    </>
                  )}

                  {/* Divider */}
                  <hr className="border-gray-100 my-8" />

                  {/* Description - inside info column */}
                  {isSectionVisible('description') && product.description && (
                    <div className="mb-8">
                      <h3 className="text-[11px] tracking-[0.2em] uppercase text-black mb-4">תיאור</h3>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                        {decodeHtmlEntities(product.description)}
                      </p>
                    </div>
                  )}

                  {/* Features - inside info column */}
                  {isSectionVisible('features') && renderSection('features')}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Reviews Section */}
      {isSectionVisible('reviews') && renderSection('reviews')}

      {/* Related Products */}
      {isSectionVisible('related') && renderSection('related')}

      {/* Footer */}
      <StoreFooter 
        storeName={store.name}
        storeSlug={slug}
        categories={categories} 
        basePath={basePath}
        settings={store.settings as Record<string, unknown>}
        footerMenuItems={footerMenuItems}
      />
    </div>
  );

  // In preview mode, wrap with provider for live updates
  // In production, return server-rendered content directly (zero JS!)
  if (isPreviewMode) {
    return (
      <ProductPagePreviewProvider initialSettings={pageSettings}>
        {pageContent}
      </ProductPagePreviewProvider>
    );
  }

  return pageContent;
}
