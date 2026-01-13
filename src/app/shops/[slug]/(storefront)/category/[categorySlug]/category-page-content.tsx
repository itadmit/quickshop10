'use client';

/**
 * CategoryPageContent - Renders category page with live preview support
 * 
 * ⚡ Performance (REQUIREMENTS.md compliant):
 * - Server renders initial HTML with settings from DB
 * - Preview mode only: listens for postMessage updates
 * - No unnecessary re-renders in production
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/product-card';
import { StoreFooter } from '@/components/store-footer';
import { TrackViewCategory } from '@/components/tracking-events';
import { EditorSectionHighlighter } from '@/components/storefront/editor-section-highlighter';
import type { CategoryPageSettings, BannerAspectRatio } from '@/lib/category-page-settings';
import { bannerHeightClasses, aspectRatioClasses, bannerAspectRatioClasses } from '@/lib/category-page-settings';

// Section name labels for editor (Hebrew)
const sectionNames: Record<string, string> = {
  'cp-banner': 'באנר קטגוריה',
  'cp-breadcrumb': 'ניווט',
  'cp-subcategories': 'תתי קטגוריות',
  'cp-products': 'רשת מוצרים',
};

interface CategoryData {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  slug: string;
}

interface SubcategoryData {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

interface ProductData {
  id: string;
  slug: string;
  name: string;
  price: number;
  comparePrice: number | null;
  image: string;
  cardImage?: string | null;
  cardVideoUrl?: string | null;
  isFeatured: boolean;
  inventory: number | null;
  trackInventory: boolean;
  allowBackorder: boolean;
  automaticDiscount: { 
    name: string;
    names?: string[];
    discountedPrice: number;
    discountPercent: number;
    categoryIds?: string[];
  } | null;
}

interface CategoryPageContentProps {
  category: CategoryData;
  parentCategory: { name: string; slug: string } | null;
  subcategories: SubcategoryData[];
  products: ProductData[];
  hasSubcategories: boolean;
  isSubcategory: boolean;
  basePath: string;
  showDecimalPrices: boolean;
  initialSettings: CategoryPageSettings;
  isPreviewMode: boolean;
  storeName: string;
  storeSlug: string;
  allCategories: Array<{ id: string; name: string; slug: string }>;
  footerMenuItems: Array<{ 
    id: string; 
    title: string; 
    linkType: 'page' | 'category' | 'product' | 'custom' | 'collection';
    linkUrl?: string | null;
    linkResourceId?: string | null;
    pageSlug?: string | null;
  }>;
  storeSettings: Record<string, unknown>;
}

export function CategoryPageContent({
  category,
  parentCategory,
  subcategories,
  products,
  hasSubcategories,
  isSubcategory,
  basePath,
  showDecimalPrices,
  initialSettings,
  isPreviewMode,
  storeName,
  storeSlug,
  allCategories,
  footerMenuItems,
  storeSettings,
}: CategoryPageContentProps) {
  // State for preview mode - only updates in editor iframe
  const [settings, setSettings] = useState<CategoryPageSettings>(initialSettings);

  // Listen for settings updates from editor (preview mode only)
  useEffect(() => {
    if (!isPreviewMode) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CATEGORY_PAGE_SETTINGS_UPDATE') {
        const newSettings = event.data.settings as Partial<CategoryPageSettings>;
        
        setSettings(prev => ({
          banner: { ...prev.banner, ...newSettings.banner },
          subcategories: { ...prev.subcategories, ...newSettings.subcategories },
          products: { ...prev.products, ...newSettings.products },
          breadcrumb: { ...prev.breadcrumb, ...newSettings.breadcrumb },
        }));
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Let parent know we're ready
    window.parent.postMessage({ type: 'CATEGORY_PREVIEW_READY' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, [isPreviewMode]);

  // Get grid classes based on settings
  const getSubcategoryGridClasses = () => {
    const mobile = settings.subcategories.mobileColumns === 1 ? 'grid-cols-1' : 'grid-cols-2';
    const desktop = {
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-3',
      4: 'md:grid-cols-4',
    }[settings.subcategories.desktopColumns];
    return `${mobile} ${desktop}`;
  };

  const getProductsGridClasses = () => {
    const mobile = settings.products.mobileColumns === 2 ? 'grid-cols-2' : 'grid-cols-3';
    const desktop = {
      3: 'md:grid-cols-3',
      4: 'md:grid-cols-4',
      5: 'md:grid-cols-5',
    }[settings.products.desktopColumns];
    return `${mobile} ${desktop}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Editor Section Highlighter - only in preview mode */}
      {isPreviewMode && <EditorSectionHighlighter />}

      {/* Track ViewCategory event */}
      {!isPreviewMode && (
        <TrackViewCategory 
          categoryId={category.id} 
          categoryName={category.name} 
          productsCount={products.length}
        />
      )}
      
      {/* Hero Banner */}
      {settings.banner.show && (
        <section 
          className={`relative bg-gray-100 overflow-hidden ${
            settings.banner.useAspectRatio 
              ? '' // רטיו מטופל ב-div פנימי
              : bannerHeightClasses[settings.banner.height]
          }`}
          data-section-id="cp-banner"
          data-section-name={sectionNames['cp-banner']}
        >
          {settings.banner.useAspectRatio ? (
            // גרסת רטיו - רספונסיבית לפי מכשיר
            <div className="relative w-full">
              {/* Mobile aspect ratio */}
              <div className={`md:hidden ${bannerAspectRatioClasses[settings.banner.mobileAspectRatio || '4:3']}`}>
                {category.imageUrl ? (
                  <img 
                    src={category.imageUrl}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-gray-200" />
                )}
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ backgroundColor: `rgba(0,0,0,${settings.banner.overlayOpacity / 100})` }}
                >
                  {settings.banner.showTitle && (
                    <div className="text-center px-4">
                      {isSubcategory && parentCategory && settings.banner.showParentCategory && (
                        <p className="text-white/70 text-xs tracking-widest uppercase mb-2">
                          {parentCategory.name}
                        </p>
                      )}
                      <h1 className="font-display text-3xl text-white font-extralight tracking-[0.2em] uppercase">
                        {category.name}
                      </h1>
                      {category.description && settings.banner.showDescription && (
                        <p className="text-white/80 mt-3 text-sm tracking-wide max-w-xs mx-auto">
                          {category.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Desktop aspect ratio */}
              <div className={`hidden md:block ${bannerAspectRatioClasses[settings.banner.desktopAspectRatio || '21:9']}`}>
                {category.imageUrl ? (
                  <img 
                    src={category.imageUrl}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-gray-200" />
                )}
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ backgroundColor: `rgba(0,0,0,${settings.banner.overlayOpacity / 100})` }}
                >
                  {settings.banner.showTitle && (
                    <div className="text-center">
                      {isSubcategory && parentCategory && settings.banner.showParentCategory && (
                        <p className="text-white/70 text-sm tracking-widest uppercase mb-2">
                          {parentCategory.name}
                        </p>
                      )}
                      <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-white font-extralight tracking-[0.3em] uppercase">
                        {category.name}
                      </h1>
                      {category.description && settings.banner.showDescription && (
                        <p className="text-white/80 mt-4 text-sm tracking-wide max-w-md mx-auto">
                          {category.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // גרסת גובה קבוע (לתאימות אחורה)
            <>
              {category.imageUrl ? (
                <img 
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-gray-50 to-gray-200" />
              )}
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: `rgba(0,0,0,${settings.banner.overlayOpacity / 100})` }}
              >
                {settings.banner.showTitle && (
                  <div className="text-center">
                    {isSubcategory && parentCategory && settings.banner.showParentCategory && (
                      <p className="text-white/70 text-sm tracking-widest uppercase mb-2">
                        {parentCategory.name}
                      </p>
                    )}
                    <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-white font-extralight tracking-[0.3em] uppercase">
                      {category.name}
                    </h1>
                    {category.description && settings.banner.showDescription && (
                      <p className="text-white/80 mt-4 text-sm tracking-wide max-w-md mx-auto">
                        {category.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {/* Breadcrumb */}
      {settings.breadcrumb.show && (
        <nav 
          className="py-6 px-6 border-b border-gray-100"
          data-section-id="cp-breadcrumb"
          data-section-name={sectionNames['cp-breadcrumb']}
        >
          <div className="max-w-7xl mx-auto">
            <ol className="flex items-center gap-2 text-sm text-gray-500">
              <li><Link href={basePath || '/'} className="hover:text-black transition-colors">בית</Link></li>
              <li>/</li>
              {isSubcategory && parentCategory && (
                <>
                  <li>
                    <Link href={`${basePath}/category/${parentCategory.slug}`} className="hover:text-black transition-colors">
                      {parentCategory.name}
                    </Link>
                  </li>
                  <li>/</li>
                </>
              )}
              <li className="text-black">{category.name}</li>
            </ol>
          </div>
        </nav>
      )}

      {/* Subcategories Grid */}
      {hasSubcategories && settings.subcategories.show && (
        <section 
          className="py-12 px-6 border-b border-gray-100"
          data-section-id="cp-subcategories"
          data-section-name={sectionNames['cp-subcategories']}
        >
          <div className="max-w-7xl mx-auto">
            <div className={`grid ${getSubcategoryGridClasses()} gap-4`}>
              {subcategories.map((sub) => {
                // קביעת רטיו - רספונסיבי או אחיד
                const useResponsive = settings.subcategories.useResponsiveRatio;
                const desktopRatio = settings.subcategories.desktopAspectRatio || settings.subcategories.aspectRatio || '4:3';
                const mobileRatio = settings.subcategories.mobileAspectRatio || '1:1';
                const uniformRatio = settings.subcategories.aspectRatio || '4:3';
                
                return (
                <Link
                  key={sub.id}
                  href={`${basePath}/category/${sub.slug}`}
                  className={`group relative bg-gray-100 overflow-hidden ${
                    useResponsive 
                      ? `${aspectRatioClasses[mobileRatio as keyof typeof aspectRatioClasses]} md:${aspectRatioClasses[desktopRatio as keyof typeof aspectRatioClasses].replace('aspect-', 'aspect-')}`
                      : aspectRatioClasses[uniformRatio as keyof typeof aspectRatioClasses]
                  }`}
                  style={useResponsive ? {
                    // CSS custom properties for responsive aspect ratio
                  } : undefined}
                >
                  {/* Mobile aspect ratio wrapper */}
                  {useResponsive ? (
                    <>
                      <div className={`md:hidden absolute inset-0`}>
                        {sub.imageUrl ? (
                          <img
                            src={sub.imageUrl}
                            alt={sub.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-b from-gray-100 to-gray-200" />
                        )}
                      </div>
                      <div className={`hidden md:block absolute inset-0`}>
                        {sub.imageUrl ? (
                          <img
                            src={sub.imageUrl}
                            alt={sub.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-b from-gray-100 to-gray-200" />
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {sub.imageUrl ? (
                        <img
                          src={sub.imageUrl}
                          alt={sub.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-b from-gray-100 to-gray-200" />
                      )}
                    </>
                  )}
                  {settings.subcategories.showOverlay && (
                    <div 
                      className="absolute inset-0 transition-colors flex items-center justify-center"
                      style={{ 
                        backgroundColor: `rgba(0,0,0,${settings.subcategories.overlayOpacity / 100})`,
                      }}
                    >
                      <span className="text-white text-sm tracking-[0.2em] uppercase font-light">
                        {sub.name}
                      </span>
                    </div>
                  )}
                  {!settings.subcategories.showOverlay && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                      <span className="text-white text-sm tracking-[0.2em] uppercase font-light">
                        {sub.name}
                      </span>
                    </div>
                  )}
                </Link>
              );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section 
        className="py-16 px-6"
        data-section-id="cp-products"
        data-section-name={sectionNames['cp-products']}
      >
        <div className="max-w-7xl mx-auto">
          {settings.products.showCount && (
            <div className="flex justify-between items-center mb-12">
              <p className="text-gray-400 text-sm tracking-wide">
                {products.length} פריטים
              </p>
            </div>
          )}

          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400">אין מוצרים בקטגוריה זו</p>
            </div>
          ) : (
            <div className={`grid ${getProductsGridClasses()} gap-4 md:gap-8`}>
              {products.map((product, i) => (
                <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <ProductCard
                    id={product.id}
                    slug={product.slug}
                    name={product.name}
                    price={product.price}
                    comparePrice={product.comparePrice}
                    image={product.image}
                    cardImage={product.cardImage}
                    cardVideoUrl={product.cardVideoUrl}
                    isFeatured={product.isFeatured}
                    basePath={basePath}
                    showDecimalPrices={showDecimalPrices}
                    inventory={product.inventory}
                    trackInventory={product.trackInventory}
                    allowBackorder={product.allowBackorder}
                    automaticDiscount={product.automaticDiscount}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <StoreFooter 
        storeName={storeName}
        storeSlug={storeSlug}
        categories={allCategories} 
        basePath={basePath}
        settings={storeSettings}
        footerMenuItems={footerMenuItems}
      />
    </div>
  );
}
