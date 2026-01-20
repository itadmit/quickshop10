import { getStoreBySlug, getProductBySlug, getProductsByStore, getProductOptions, getProductVariants, getCategoriesByStore, getProductCategoryIds, getProductAddonsForStorefront, getFooterMenuItems, getProductBadgesForDisplay } from '@/lib/db/queries';
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
import { isPluginActive } from '@/lib/plugins/loader';
import { db } from '@/lib/db';
import { productStories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
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
  LiveDescriptionSection,
} from '@/components/storefront/product-page-preview';
import { EditorSectionHighlighter } from '@/components/storefront/editor-section-highlighter';
import { ProductSection } from '@/components/product-sections';
import { ProductPage as SectionBasedProductPage } from '@/components/product-sections/product-page';
import { type ProductPageSection } from '@/lib/product-page-sections';
import { type DynamicContentContext } from '@/lib/dynamic-content';
import { BundleComponentsDisplay } from '@/components/storefront/bundle-components-display';
import { getBundleComponentsForCart } from '@/app/shops/[slug]/admin/products/bundle-actions';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';

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

// Cache store lookup for this request
const getStore = cache(async (slug: string) => {
  return getStoreBySlug(slug);
});

// Cache product lookup for this request
const getProduct = cache(async (storeId: string, productSlug: string) => {
  return getProductBySlug(storeId, productSlug);
});

// Generate metadata for the product page (for SEO and Analytics)
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug, productSlug } = await params;
  
  const store = await getStore(slug);
  if (!store) {
    return { title: 'מוצר לא נמצא' };
  }

  const decodedSlug = decodeURIComponent(productSlug);
  const product = await getProduct(store.id, decodedSlug);
  
  if (!product) {
    return { title: 'מוצר לא נמצא' };
  }

  // Build title: "שם מוצר | חנות"
  const title = `${product.name} | ${store.name}`;
  const description = product.shortDescription || product.description?.substring(0, 160) || `${product.name} - קנו עכשיו בחנות ${store.name}`;
  const mainImage = product.images.find(img => img.isPrimary)?.url || product.images[0]?.url;

  return {
    title,
    description: description.replace(/<[^>]*>/g, ''), // Strip HTML tags
    openGraph: {
      title,
      description: description.replace(/<[^>]*>/g, ''),
      images: mainImage ? [{ url: mainImage }] : undefined,
      type: 'website',
    },
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug, productSlug } = await params;
  const { preview } = await searchParams;
  const isPreviewMode = preview === 'true';
  
  const store = await getStore(slug);
  
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
  
  const product = await getProduct(store.id, decodedSlug);

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
  
  // V2 Product Page Sections - dynamic sections from stores.productPageSections
  const v2Sections = (store.productPageSections || []) as ProductPageSection[];
  const hasV2Sections = v2Sections.length > 0;
  
  // Define flexible types that can be in either info or content zone
  const flexibleTypes = ['accordion', 'tabs'];
  const contentOnlyTypes = ['text_block', 'features', 'divider', 'spacer'];
  
  // Filter V2 sections by zone for rendering in appropriate locations
  // Info zone sections (accordion/tabs with zone='info') - render inside product info column
  const v2InfoSections = hasV2Sections 
    ? v2Sections.filter(s => 
        s.isActive && 
        flexibleTypes.includes(s.type) && 
        s.settings?.zone === 'info'
      ).sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
  
  // Content zone sections - render below product area
  const v2ContentSections = hasV2Sections 
    ? v2Sections.filter(s => 
        s.isActive && 
        (contentOnlyTypes.includes(s.type) || 
         (flexibleTypes.includes(s.type) && s.settings?.zone !== 'info'))
      ).sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  // Get variants, related products, categories, badges and automatic discount in parallel - maximum speed!
  // In preview mode, fetch up to 8 products to allow dynamic count changes
  // Fetch more to account for out-of-stock filtering
  const maxRelatedProducts = isPreviewMode ? 16 : (pageSettings.related.count + 1) * 2;
  const [options, variants, allProducts, categories, productCategoryIds, productAddons, footerMenuItems, productBadges] = await Promise.all([
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
    // Get product badges
    getProductBadgesForDisplay(store.id, product.id, {
      createdAt: product.createdAt,
      isFeatured: product.isFeatured,
      comparePrice: product.comparePrice,
      categoryId: product.categoryId,
    }),
  ]);
  
  // Filter out of stock products (only show products that are available)
  const inStockProducts = allProducts.filter(p => {
    // Exclude current product
    if (p.id === product.id) return false;
    // For products without variants, use isOutOfStock check
    if (!p.hasVariants) {
      return !isOutOfStock(p.trackInventory, p.inventory, p.allowBackorder);
    }
    // For products with variants, we keep them (variant stock checked on product page)
    // TODO: Could enhance to check variant-level stock if needed
    return true;
  });
  
  // Get related products (all available for preview mode, limited for production)
  const relatedProducts = inStockProducts.slice(0, isPreviewMode ? 8 : pageSettings.related.count);
  
  // Get upsell products if defined
  const upsellProductIds = (product.upsellProductIds as string[] | undefined) || [];
  const upsellProducts = upsellProductIds.length > 0 
    ? inStockProducts.filter(p => upsellProductIds.includes(p.id))
    : [];

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

  // 🆕 Load story stats for this product (only if plugin is active)
  // Server-side only - no client JS, per REQUIREMENTS.md
  let storyStats: { viewsCount: number; likesCount: number; commentsCount: number } | null = null;
  
  // Check if stories plugin is active AND if this product has a story
  const storiesPluginActive = await isPluginActive(store.id, 'product-stories');
  if (storiesPluginActive) {
    const [storyData] = await db
      .select({
        viewsCount: productStories.viewsCount,
        likesCount: productStories.likesCount,
        commentsCount: productStories.commentsCount,
      })
      .from(productStories)
      .where(
        and(
          eq(productStories.storeId, store.id),
          eq(productStories.productId, product.id),
          eq(productStories.isActive, true)
        )
      )
      .limit(1);
    
    if (storyData) {
      storyStats = {
        viewsCount: storyData.viewsCount,
        likesCount: storyData.likesCount,
        commentsCount: storyData.commentsCount,
      };
    }
  }

  // Helper to check if section is visible
  const isSectionVisible = (type: string) => visibleSections.some(s => s.type === type);
  
  // 🆕 V2 Dynamic Content Context - for resolving {{product.xxx}} placeholders
  // Cast product to access additional fields that may exist
  const productData = product as typeof product & { 
    barcode?: string | null; 
    weight?: string | null; 
    metadata?: Record<string, unknown>; 
  };
  
  const dynamicContext: DynamicContentContext = {
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: finalPrice,
      comparePrice: effectiveComparePrice,
      description: product.description,
      shortDescription: product.shortDescription,
      sku: product.sku,
      barcode: productData.barcode || null,
      inventory: product.inventory,
      weight: productData.weight || null,
      trackInventory: product.trackInventory,
      hasVariants: product.hasVariants,
      category: categories.find(c => c.id === productCategoryIds[0])?.name || null,
      categories: categories.filter(c => productCategoryIds.includes(c.id)).map(c => c.name),
      metadata: productData.metadata as { customFields?: Record<string, string>; [key: string]: unknown } | undefined,
    },
    store: {
      name: store.name,
      currency: '₪',
    },
    showDecimalPrices,
  };

  // Helper to convert typography settings to inline styles (for SSR - no JS!)
  const getTypographyStyle = (settings: ProductPageSettings['typography'][keyof ProductPageSettings['typography']]): React.CSSProperties => {
    if (!settings) return {};
    const fontWeightMap: Record<string, number> = { light: 300, normal: 400, medium: 500, bold: 700, extrabold: 800 };
    return {
      color: settings.color,
      fontFamily: settings.fontFamily === 'default' ? undefined : settings.fontFamily,
      fontSize: settings.fontSize ? `${settings.fontSize}${settings.fontSizeUnit || 'px'}` : undefined,
      fontWeight: settings.fontWeight ? fontWeightMap[settings.fontWeight] : undefined,
      textTransform: settings.textTransform === 'none' ? undefined : settings.textTransform,
      letterSpacing: settings.letterSpacing ? `${settings.letterSpacing}${settings.letterSpacingUnit || 'px'}` : undefined,
      lineHeight: settings.lineHeight || undefined,
    };
  };

  // Generate CSS for responsive typography (mobile support without JS)
  const generateResponsiveCSS = () => {
    const typography = pageSettings.typography;
    if (!typography) return '';
    
    const rules: string[] = [];
    
    // Title
    if (typography.title?.fontSizeMobile) {
      rules.push(`.pp-title { font-size: ${typography.title.fontSizeMobile}${typography.title.fontSizeMobileUnit || 'px'} !important; }`);
    }
    // Price
    if (typography.price?.fontSizeMobile) {
      rules.push(`.pp-price { font-size: ${typography.price.fontSizeMobile}${typography.price.fontSizeMobileUnit || 'px'} !important; }`);
    }
    // Compare Price
    if (typography.comparePrice?.fontSizeMobile) {
      rules.push(`.pp-compare-price { font-size: ${typography.comparePrice.fontSizeMobile}${typography.comparePrice.fontSizeMobileUnit || 'px'} !important; }`);
    }
    // Inventory
    if (typography.inventory?.fontSizeMobile) {
      rules.push(`.pp-inventory { font-size: ${typography.inventory.fontSizeMobile}${typography.inventory.fontSizeMobileUnit || 'px'} !important; }`);
    }
    // Description
    if (typography.description?.fontSizeMobile) {
      rules.push(`.pp-description { font-size: ${typography.description.fontSizeMobile}${typography.description.fontSizeMobileUnit || 'px'} !important; }`);
    }
    
    if (rules.length === 0) return '';
    return `@media (max-width: 768px) { ${rules.join(' ')} }`;
  };

  // Get gallery aspect ratio class
  const getAspectRatioClass = (ratio: ProductPageSettings['gallery']['aspectRatio']) => {
    const ratios = { '1:1': 'aspect-square', '3:4': 'aspect-[3/4]', '4:3': 'aspect-[4/3]', '16:9': 'aspect-video' };
    return ratios[ratio];
  };

  // Get first category for breadcrumb
  const firstCategory = productCategoryIds.length > 0 
    ? categories.find(c => c.id === productCategoryIds[0]) 
    : null;

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
                    <li><Link href={`${basePath}/products`} className="hover:text-black transition-colors">מוצרים</Link></li>
                    <li>/</li>
                  </>
                )}
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
            {pageSettings.description?.showAsAccordion ? (
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
  const responsiveCSS = generateResponsiveCSS();
  
  // 🆕 V2 Product Page Data for new section-based rendering
  const imageUrls = product.images.map(img => img.url);
  
  // Get bundle components if this is a bundle product
  let bundleComponentsData: Array<{ name: string; variantTitle?: string; quantity: number }> | undefined;
  if (product.isBundle) {
    const bundleData = await getBundleComponentsForCart(product.id);
    if (bundleData?.components) {
      bundleComponentsData = bundleData.components;
    }
  }
  
  const v2ProductData = {
    id: product.id,
    name: product.name,
    description: product.description,
    shortDescription: product.shortDescription,
    price: effectivePrice,
    comparePrice: effectiveComparePrice,
    discountedPrice: hasAutomaticDiscount ? finalPrice : null,
    images: imageUrls,
    mainImage: mainImage,
    hasVariants: product.hasVariants,
    trackInventory: product.trackInventory,
    inventory: product.inventory,
    sku: product.sku,
    isFeatured: product.isFeatured,
    allowBackorder: product.allowBackorder,
    storeId: store.id,
    isBundle: product.isBundle,
    bundleComponents: bundleComponentsData,
    badges: productBadges, // מדבקות מוצר
  };
  
  const pageContent = (
    <div className="min-h-screen bg-white">
      {/* Responsive typography CSS for mobile (Server-side, zero JS) */}
      {responsiveCSS && <style dangerouslySetInnerHTML={{ __html: responsiveCSS }} />}
      
      {/* Scroll to top on page load */}
      <ScrollToTop />
      
      {/* Editor Section Highlighter - ONLY in preview mode for click-to-select */}
      {isPreviewMode && <EditorSectionHighlighter />}
      
      {/* Track ViewContent event */}
      <TrackViewProduct product={trackingProduct} />
      
      {/* 🆕 V2 RENDERING: When V2 sections exist, use the new section-based product page */}
      {hasV2Sections ? (
        <>
          <SectionBasedProductPage
            sections={v2Sections}
            product={v2ProductData}
            variants={variants.map(v => ({
              id: v.id,
              title: v.title,
              price: String(v.price),
              comparePrice: v.comparePrice ? String(v.comparePrice) : null,
              inventory: v.inventory,
              option1: v.option1,
              option2: v.option2,
              option3: v.option3,
              allowBackorder: v.allowBackorder,
              sku: v.sku ?? null,
            }))}
            options={options.map(o => ({
              id: o.id,
              name: o.name,
              displayType: o.displayType as 'button' | 'color' | 'pattern' | 'image',
              values: o.values.map(ov => ({
                id: ov.id,
                value: ov.value,
                metadata: ov.metadata as Record<string, unknown> | null,
                sortOrder: ov.sortOrder ?? 0,
              })),
            }))}
            relatedProducts={relatedProducts.map(p => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.price ?? '0',
              comparePrice: p.comparePrice,
              images: p.image ? [p.image] : [],
              inventory: p.inventory,
              trackInventory: p.trackInventory,
              allowBackorder: p.allowBackorder,
              hasVariants: p.hasVariants,
            }))}
            upsellProducts={upsellProducts.map(p => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.price ?? '0',
              comparePrice: p.comparePrice,
              images: p.image ? [p.image] : [],
              inventory: p.inventory,
              trackInventory: p.trackInventory,
              allowBackorder: p.allowBackorder,
            }))}
            productAddons={productAddons.map(a => ({
              id: a.id,
              name: a.name,
              description: a.placeholder || null,
              price: String(a.priceAdjustment),
              isRequired: a.isRequired,
              maxQuantity: a.maxLength ?? 1,
            }))}
            context={dynamicContext}
            basePath={basePath}
            showDecimalPrices={showDecimalPrices}
            isPreviewMode={isPreviewMode}
            discountLabels={discountLabels}
            compareDiscount={compareDiscount}
            firstCategory={firstCategory ?? null}
            storeSlug={slug}
            categoryIds={productCategoryIds}
            storyStats={storyStats}
          />
          
          {/* Footer */}
          <StoreFooter 
            storeName={store.name}
            storeSlug={slug}
            categories={categories} 
            basePath={basePath}
            settings={store.settings as Record<string, unknown>}
            footerMenuItems={footerMenuItems}
          />
        </>
      ) : (
        <>
      {/* V1 RENDERING: Legacy section-based rendering (when no V2 sections exist) */}
      
      {/* Breadcrumb - based on settings */}
      {isSectionVisible('breadcrumb') && renderSection('breadcrumb')}

      {/* Product Section - Gallery + Info */}
      {(isSectionVisible('gallery') || isSectionVisible('info')) && (
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-start ${
              pageSettings.gallery.thumbnailsPosition === 'right' ? 'lg:flex-row-reverse' : ''
            }`}>
              {/* Gallery - Use LiveGallerySection in preview mode for ALL gallery settings */}
              {isSectionVisible('gallery') && (
                <div
                  data-section-id="pp-gallery"
                  data-section-name="גלריית תמונות"
                >
                  {/* Always use LiveGallerySection for interactive navigation (arrows, dots, thumbnails) */}
                    <LiveGallerySection
                      mainImage={mainImage || ''}
                      productName={product.name}
                      images={product.images}
                      initialSettings={pageSettings.gallery}
                      ProductImageComponent={ProductImage}
                    />
                </div>
              )}

              {/* Product Info */}
              {isSectionVisible('info') && (
                <div 
                  data-section-id="pp-info"
                  data-section-name="מידע מוצר"
                >
                  {/* Badges - מעל שם המוצר - רק אם יש תוכן */}
                  {((compareDiscount && compareDiscount > 0 && pageSettings.price?.showDiscount && 
                    (pageSettings.price?.discountStyle === 'badge' || pageSettings.price?.discountStyle === 'both')) || 
                    discountLabels.length > 0 || product.isFeatured) && (
                  <div className="flex flex-wrap gap-3 mb-6">
                    {/* Compare Price Discount Badge (BLACK) - הנחת מחיר השוואה בלבד */}
                    {compareDiscount && compareDiscount > 0 && pageSettings.price?.showDiscount && 
                     (pageSettings.price?.discountStyle === 'badge' || pageSettings.price?.discountStyle === 'both') && (
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
                  )}

                  {/* Title - Use LiveTitleWrapper in preview mode for real-time styling */}
                  {isPreviewMode ? (
                    <LiveTitleWrapper initialTypography={pageSettings.typography?.title}>
                      {product.name}
                    </LiveTitleWrapper>
                  ) : (
                    <h1 
                      className="pp-title font-display tracking-[0.05em] mb-4"
                      style={getTypographyStyle(pageSettings.typography?.title)}
                    >
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
                      storeSlug={slug}
                    />
                  ) : (
                    <>
                      {/* Price - Use LivePriceWrapper in preview mode */}
                      {isPreviewMode ? (
                        <LivePriceWrapper
                          price={format(finalPrice)}
                          comparePrice={hasDiscount ? format(originalPrice) : null}
                          discount={discount}
                          initialTypography={{
                            price: pageSettings.typography?.price,
                            comparePrice: pageSettings.typography?.comparePrice,
                          }}
                          initialPriceSettings={pageSettings.price}
                        />
                      ) : (
                        <div className="flex flex-wrap items-center gap-4 mb-8">
                          {/* Final Price */}
                          <span 
                            className="pp-price font-display"
                            style={getTypographyStyle(pageSettings.typography?.price)}
                          >
                            {format(finalPrice)}
                          </span>
                          
                          {/* Original Price (crossed out) */}
                          {pageSettings.price?.showComparePrice && hasDiscount && (
                            <span 
                              className="pp-compare-price line-through"
                              style={getTypographyStyle(pageSettings.typography?.comparePrice)}
                            >
                              {format(originalPrice)}
                            </span>
                          )}
                          
                          {/* Total Discount Percentage - הנחה כוללת */}
                          {pageSettings.price?.showDiscount && hasDiscount && 
                           (pageSettings.price?.discountStyle === 'text' || pageSettings.price?.discountStyle === 'both') && (
                            <span className="text-sm text-green-600 font-medium">הנחה כוללת: -{discount}%</span>
                          )}
                        </div>
                      )}

                      {/* Bundle Components Display - show if product is a bundle */}
                      {product.isBundle && (
                        <BundleComponentsDisplay productId={product.id} storeSlug={slug} />
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
                          storeSlug={slug}
                          isBundle={product.isBundle}
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
                          isBundle={product.isBundle}
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
                        initialTypography={pageSettings.typography?.inventory}
                      />
                    </>
                  )}

                  {/* Divider */}
                  <hr className="border-gray-100 my-8" />

                  {/* Description - inside info column */}
                  {isSectionVisible('description') && product.description && (
                    <div className="mb-8">
                      {isPreviewMode ? (
                        <LiveDescriptionSection
                          description={decodeHtmlEntities(product.description)}
                          initialShowAsAccordion={pageSettings.description?.showAsAccordion ?? false}
                          initialTypography={pageSettings.typography?.description}
                        />
                      ) : pageSettings.description?.showAsAccordion ? (
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
                            <div 
                              className="pp-description leading-relaxed prose prose-sm max-w-none"
                              style={getTypographyStyle(pageSettings.typography?.description)}
                              dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(product.description) }}
                            />
                          </div>
                        </details>
                      ) : (
                        <>
                      <h3 className="text-[11px] tracking-[0.2em] uppercase text-black mb-4">תיאור</h3>
                          <div 
                            className="pp-description leading-relaxed prose prose-sm max-w-none"
                            style={getTypographyStyle(pageSettings.typography?.description)}
                            dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(product.description) }}
                          />
                        </>
                      )}
                    </div>
                  )}

                  {/* Features - inside info column */}
                  {isSectionVisible('features') && renderSection('features')}
                  
                  {/* 🆕 V2 Info Zone Sections - Accordion/Tabs with zone='info' */}
                  {v2InfoSections.length > 0 && v2InfoSections.map((section) => (
                    <div key={section.id} className="mt-6">
                      <ProductSection 
                        section={section} 
                        context={dynamicContext}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 🆕 V2 Content Sections - Accordion, Tabs, Text Block, Features (content zone) */}
      {v2ContentSections.length > 0 && (
        <section className="py-8 px-6">
          <div className="max-w-7xl mx-auto">
            {v2ContentSections.map((section) => (
              <ProductSection 
                key={section.id} 
                section={section} 
                context={dynamicContext}
              />
            ))}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      {isSectionVisible('reviews') && renderSection('reviews')}

      {/* Related Products */}
      {isSectionVisible('related') && renderSection('related')}

      {/* Footer - V1 */}
      <StoreFooter 
        storeName={store.name}
        storeSlug={slug}
        categories={categories} 
        basePath={basePath}
        settings={store.settings as Record<string, unknown>}
        footerMenuItems={footerMenuItems}
      />
        </> 
      ) /* End V1 conditional */}
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
