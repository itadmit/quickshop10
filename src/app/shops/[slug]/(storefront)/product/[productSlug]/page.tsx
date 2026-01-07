import { getStoreBySlug, getProductBySlug, getProductsByStore, getProductOptions, getProductVariants, getCategoriesByStore } from '@/lib/db/queries';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { VariantSelector } from '@/components/variant-selector';
import { ProductCard } from '@/components/product-card';
import { ProductImage } from '@/components/product-image';
import { StoreFooter } from '@/components/store-footer';
import { TrackViewProduct } from '@/components/tracking-events';
import { ScrollToTop } from '@/components/scroll-to-top';
import { formatPrice } from '@/lib/format-price';
import { isOutOfStock } from '@/lib/inventory';
import { ProductReviewsSection } from '@/components/reviews/product-reviews-section';
import { getProductPageSettings, getVisibleSections, featureIcons, type ProductPageSettings } from '@/lib/product-page-settings';
import { 
  ProductPagePreviewProvider, 
  LiveFeaturesSection, 
  LiveRelatedTitle,
  LiveGallerySection,
  LiveTitleWrapper,
  LivePriceWrapper,
  LiveSectionVisibility,
  LiveRelatedProducts,
} from '@/components/storefront/product-page-preview';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

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

  // Get variants, related products and categories in parallel - maximum speed!
  // In preview mode, fetch up to 8 products to allow dynamic count changes
  const maxRelatedProducts = isPreviewMode ? 9 : pageSettings.related.count + 1;
  const [options, variants, allProducts, categories] = await Promise.all([
    product.hasVariants ? getProductOptions(product.id) : Promise.resolve([]),
    product.hasVariants ? getProductVariants(product.id) : Promise.resolve([]),
    getProductsByStore(store.id, maxRelatedProducts),
    getCategoriesByStore(store.id),
  ]);

  // Get related products (all available for preview mode, limited for production)
  const relatedProducts = allProducts.filter(p => p.id !== product.id).slice(0, isPreviewMode ? 8 : pageSettings.related.count);

  const mainImage = product.images.find(img => img.isPrimary)?.url || product.images[0]?.url;
  const hasDiscount = product.comparePrice && Number(product.comparePrice) > Number(product.price);
  const discount = hasDiscount ? Math.round((1 - Number(product.price) / Number(product.comparePrice!)) * 100) : null;

  // Track product view
  const trackingProduct = {
    id: product.id,
    name: product.name,
    price: Number(product.price),
    compareAtPrice: product.comparePrice ? Number(product.comparePrice) : null,
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

  // Render section based on type
  const renderSection = (sectionType: string) => {
    switch (sectionType) {
      case 'breadcrumb':
        return (
          <nav key="breadcrumb" className="py-6 px-6 border-b border-gray-100">
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
          return <LiveFeaturesSection key="features" initialFeatures={pageSettings.features} />;
        }
        // Server-side render for production - zero JS!
        const visibleFeatures = pageSettings.features.filter(f => f.isVisible);
        if (visibleFeatures.length === 0) return null;
        return (
          <div key="features" className="space-y-4 mt-8">
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
          <div key="description" className="mb-8">
            <h3 className="text-[11px] tracking-[0.2em] uppercase text-black mb-4">תיאור</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        );

      case 'reviews':
        return (
          <ProductReviewsSection
            key="reviews"
            productId={product.id}
            storeId={store.id}
            storeSlug={slug}
          />
        );

      case 'related':
        if (relatedProducts.length === 0 && !pageSettings.related.showIfEmpty) return null;
        
        // In preview mode, use LiveRelatedProducts for dynamic count updates
        if (isPreviewMode) {
          return (
            <LiveRelatedProducts
              key="related"
              initialCount={pageSettings.related.count}
            >
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
          );
        }
        
        // Production: Server-rendered for speed
        return (
          <section key="related" className="py-20 px-6 bg-gray-50">
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
                isPreviewMode ? (
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
                )
              )}

              {/* Product Info */}
              {isSectionVisible('info') && (
                <div className="lg:sticky lg:top-24 lg:self-start">
                  {/* Badges */}
                  <div className="flex gap-3 mb-6">
                    {pageSettings.price.showDiscount && hasDiscount && (
                      pageSettings.price.discountStyle === 'badge' || pageSettings.price.discountStyle === 'both' ? (
                        <span className="text-[10px] tracking-[0.15em] uppercase bg-black text-white px-3 py-1.5">
                          -{discount}%
                        </span>
                      ) : null
                    )}
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
                      {product.shortDescription}
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
                      basePrice={Number(product.price)}
                      baseComparePrice={product.comparePrice ? Number(product.comparePrice) : null}
                    />
                  ) : (
                    <>
                      {/* Price - Use LivePriceWrapper in preview mode */}
                      {isPreviewMode ? (
                        <LivePriceWrapper
                          price={format(product.price)}
                          comparePrice={format(product.comparePrice)}
                          discount={discount}
                          initialSettings={pageSettings.price}
                        />
                      ) : (
                        <div className="flex items-center gap-4 mb-8">
                          <span className={getPriceClasses(pageSettings.price)}>{format(product.price)}</span>
                          {pageSettings.price.showComparePrice && hasDiscount && (
                            <span className="text-lg text-gray-400 line-through">{format(product.comparePrice)}</span>
                          )}
                          {pageSettings.price.showDiscount && hasDiscount && 
                           (pageSettings.price.discountStyle === 'text' || pageSettings.price.discountStyle === 'both') && (
                            <span className="text-sm text-red-500">-{discount}%</span>
                          )}
                        </div>
                      )}

                      {/* Add to Cart */}
                      <AddToCartButton 
                        productId={product.id}
                        name={product.name}
                        price={Number(product.price)}
                        image={mainImage || '/placeholder.svg'}
                        inventory={product.inventory}
                        trackInventory={product.trackInventory}
                        allowBackorder={product.allowBackorder}
                        className="w-full mb-4"
                      />

                      {/* Stock Status */}
                      {(() => {
                        const outOfStock = isOutOfStock(product.trackInventory, product.inventory, product.allowBackorder);
                        if (outOfStock) {
                          return (
                            <p className="text-sm text-red-500 text-center mb-8">
                              אזל מהמלאי
                            </p>
                          );
                        }
                        if (product.trackInventory && product.inventory !== null && product.inventory > 0) {
                          return (
                            <p className="text-sm text-gray-500 text-center mb-8">
                              {product.inventory} יחידות במלאי
                            </p>
                          );
                        }
                        return (
                          <p className="text-sm text-green-600 text-center mb-8">
                            במלאי
                          </p>
                        );
                      })()}
                    </>
                  )}

                  {/* Divider */}
                  <hr className="border-gray-100 my-8" />

                  {/* Description - inside info column */}
                  {isSectionVisible('description') && product.description && (
                    <div className="mb-8">
                      <h3 className="text-[11px] tracking-[0.2em] uppercase text-black mb-4">תיאור</h3>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                        {product.description}
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
