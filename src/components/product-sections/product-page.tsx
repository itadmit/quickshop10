/**
 * Product Page Renderer
 * 
 * Fully section-based product page with dynamic sections.
 * All rendering is controlled by sections from productPageSections.
 * 
 * IMPORTANT: This is a Server Component for maximum performance!
 */

import React from 'react';
import { ProductPageSection, GallerySectionSettings, InfoSectionSettings, DescriptionSectionSettings, RelatedSectionSettings, ReviewsSectionSettings, StoryStatsSectionSettings } from '@/lib/product-page-sections';
import { type DynamicContentContext, resolveDynamicContent } from '@/lib/dynamic-content';
import { ProductSection } from './index';
import { ProductImage } from '@/components/product-image';
import { ProductReviewsSection } from '@/components/reviews/product-reviews-section';
import { ProductCard } from '@/components/product-card';
import { ProductBadges } from '@/components/storefront/product-badges';
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
import { BundleComponentsDisplay } from '@/components/storefront/bundle-components-display';
import { StoryStatsSection } from './story-stats-section';
import { ProductWishlistButton } from '@/components/product-wishlist-button';

// ============================================
// Types
// ============================================

// Badge type for display
interface Badge {
  id: string;
  text: string;
  backgroundColor: string;
  textColor: string;
  position: string;
}

interface ProductPageProps {
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
    isBundle?: boolean;
    bundleComponents?: Array<{
      name: string;
      variantTitle?: string;
      quantity: number;
    }>;
    badges?: Badge[];
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
  upsellProducts?: {
    id: string;
    name: string;
    slug: string;
    price: string | number;
    comparePrice: string | number | null;
    images: string[];
    inventory: number | null;
    trackInventory: boolean;
    allowBackorder: boolean;
  }[];
  productAddons: {
    id: string;
    name: string;
    fieldType: 'text' | 'select' | 'checkbox' | 'radio' | 'date';
    placeholder: string | null;
    options: { label: string; value: string; priceAdjustment: number }[];
    priceAdjustment: number;
    isRequired: boolean;
    maxLength: number | null;
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
  // Story stats (only available if plugin is active AND product has a story)
  storyStats?: {
    viewsCount: number;
    likesCount: number;
    commentsCount: number;
  } | null;
  // ❤️ Wishlist support
  showWishlist?: boolean;
}

// ============================================
// Product Page Component
// ============================================

export function ProductPage({
  sections,
  product,
  variants,
  options,
  relatedProducts,
  upsellProducts = [],
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
  storyStats,
  showWishlist = false,
}: ProductPageProps) {
  // Sort sections by sortOrder and filter active
  const activeSections = sections
    .filter(s => s.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Find gallery and info sections to render them together
  const gallerySection = activeSections.find(s => s.type === 'product_gallery');
  const infoSection = activeSections.find(s => s.type === 'product_info'); // Legacy
  
  // 🆕 New separate info sections
  const infoChildTypes = ['product_badges', 'product_title', 'product_price', 'product_short_desc', 'product_inventory', 'product_add_to_cart'];
  const infoChildSections = activeSections.filter(s => infoChildTypes.includes(s.type));
  const hasNewInfoSections = infoChildSections.length > 0;
  
  // Get gallery settings
  const gallerySettings = (gallerySection?.settings || {}) as Partial<GallerySectionSettings>;
  const infoSettings = (infoSection?.settings || {}) as Partial<InfoSectionSettings>;
  
  // Format price helper
  const format = (p: number | string | null | undefined) => formatPrice(p, { showDecimal: showDecimalPrices });
  
  // Get main image
  const mainImage = product.mainImage || product.images[0] || '/placeholder.svg';
  
  // Check if gallery and info should be rendered (they're rendered together)
  const hasGalleryOrInfo = gallerySection || infoSection || hasNewInfoSections;
  
  // Sections that are NOT gallery/info (rendered separately)
  const otherSections = activeSections.filter(s => 
    s.type !== 'product_gallery' && 
    s.type !== 'product_info' &&
    !infoChildTypes.includes(s.type)
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
  
  // Helper: Get padding classes from section settings
  const getPaddingClasses = (settings: Record<string, unknown>) => {
    const paddingMap: Record<string, string> = {
      'none': '',
      'xs': '8px',
      'sm': '16px',
      'md': '24px',
      'lg': '32px',
      'xl': '48px',
      '2xl': '64px',
    };
    
    const paddingTop = paddingMap[(settings.paddingTop as string) || 'none'] || '';
    const paddingBottom = paddingMap[(settings.paddingBottom as string) || 'none'] || '';
    
    return {
      paddingTop,
      paddingBottom,
    };
  };
  
  // Render individual sections
  const renderSection = (section: ProductPageSection) => {
    switch (section.type) {
      case 'product_badges':
        // רינדור מדבקות מבצעים
        const badgeSettings = section.settings as { showDiscount?: boolean; showPromoLabels?: boolean; showFeatured?: boolean; style?: string };
        const hasBadges = (compareDiscount && compareDiscount > 0 && badgeSettings.showDiscount !== false) || 
                          (discountLabels.length > 0 && badgeSettings.showPromoLabels !== false) || 
                          (product.isFeatured && badgeSettings.showFeatured !== false);
        if (!hasBadges) return null;
        
        const badgeStyle = badgeSettings.style || 'badge';
        const getBadgeClass = (type: 'discount' | 'promo' | 'featured') => {
          const base = 'text-[10px] tracking-[0.15em] uppercase px-3 py-1.5';
          if (badgeStyle === 'pill') {
            if (type === 'discount') return `${base} bg-black text-white rounded-full`;
            if (type === 'promo') return `${base} bg-green-500 text-white rounded-full`;
            return `${base} border border-black rounded-full`;
          }
          if (badgeStyle === 'text') {
            if (type === 'discount') return 'text-sm font-medium text-red-600';
            if (type === 'promo') return 'text-sm font-medium text-green-600';
            return 'text-sm font-medium text-black';
          }
          // badge (default)
          if (type === 'discount') return `${base} bg-black text-white`;
          if (type === 'promo') return `${base} bg-green-500 text-white`;
          return `${base} border border-black`;
        };
        
        return (
          <div 
            key={section.id}
            className="flex flex-wrap gap-3 mb-6"
            data-section-id={section.id}
            data-section-type={section.type}
            data-section-name="מדבקות מבצעים"
          >
            {compareDiscount && compareDiscount > 0 && badgeSettings.showDiscount !== false && (
              <span data-discount-badge className={getBadgeClass('discount')}>
                -{compareDiscount}%
              </span>
            )}
            {badgeSettings.showPromoLabels !== false && discountLabels.map((label, i) => (
              <span key={i} data-promo-label className={getBadgeClass('promo')}>
                {label}
              </span>
            ))}
            {product.isFeatured && badgeSettings.showFeatured !== false && (
              <span data-featured-badge className={getBadgeClass('featured')}>
                מומלץ
              </span>
            )}
          </div>
        );
        
      case 'product_title':
        const titleSettings = section.settings as { 
          fontSize?: number; 
          fontSizeUnit?: string;
          fontSizeMobile?: number;
          fontSizeMobileUnit?: string;
          fontWeight?: string; 
          color?: string;
          letterSpacing?: number;
          letterSpacingUnit?: string;
          lineHeight?: number;
          lineHeightUnit?: string;
        };
        const titleFontSize = titleSettings.fontSize || 30;
        const titleFontSizeUnit = titleSettings.fontSizeUnit || 'px';
        const titleFontSizeMobile = titleSettings.fontSizeMobile || 24;
        const titleFontSizeMobileUnit = titleSettings.fontSizeMobileUnit || 'px';
        const titleFontWeight = {
          light: '300',
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700',
          extrabold: '800',
        }[titleSettings.fontWeight || 'light'] || '300';
        const titleColor = titleSettings.color || '#000000';
        const titleLetterSpacing = titleSettings.letterSpacing || 0;
        const titleLetterSpacingUnit = titleSettings.letterSpacingUnit || 'px';
        const titleLineHeight = titleSettings.lineHeight || 1.2;
        const titleLineHeightUnit = titleSettings.lineHeightUnit || '';
        const titleStyleId = `title-style-${section.id}`;
        
        return (
          <React.Fragment key={section.id}>
            <style dangerouslySetInnerHTML={{ __html: `
              #${titleStyleId} {
                font-size: ${titleFontSizeMobile}${titleFontSizeMobileUnit};
              }
              @media (min-width: 768px) {
                #${titleStyleId} {
                  font-size: ${titleFontSize}${titleFontSizeUnit};
                }
              }
            `}} />
            <h1 
              id={titleStyleId}
              className="mb-6"
              style={{
                fontWeight: titleFontWeight,
                color: titleColor,
                letterSpacing: titleLetterSpacing ? `${titleLetterSpacing}${titleLetterSpacingUnit}` : undefined,
                lineHeight: titleLineHeight ? `${titleLineHeight}${titleLineHeightUnit}` : undefined,
              }}
              data-section-id={section.id}
              data-section-type={section.type}
              data-section-name="שם מוצר"
            >
            {product.name}
          </h1>
          </React.Fragment>
        );
        
      case 'product_price':
        const priceSettings = section.settings as { 
          showComparePrice?: boolean;
          priceColor?: string;
          priceFontSize?: number;
          priceFontSizeUnit?: string;
          priceFontSizeMobile?: number;
          priceFontSizeMobileUnit?: string;
          priceFontWeight?: string;
          comparePriceColor?: string;
          comparePriceFontSize?: number;
          comparePriceFontSizeUnit?: string;
          comparePriceFontSizeMobile?: number;
          comparePriceFontSizeMobileUnit?: string;
          comparePriceFontWeight?: string;
        };
        const priceColor = priceSettings.priceColor || '#000000';
        const priceFontSize = priceSettings.priceFontSize || 20;
        const priceFontSizeUnit = priceSettings.priceFontSizeUnit || 'px';
        const priceFontSizeMobile = priceSettings.priceFontSizeMobile || 18;
        const priceFontSizeMobileUnit = priceSettings.priceFontSizeMobileUnit || 'px';
        const priceFontWeight = { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700' }[priceSettings.priceFontWeight || 'medium'] || '500';
        const comparePriceColor = priceSettings.comparePriceColor || '#9ca3af';
        const comparePriceFontSize = priceSettings.comparePriceFontSize || 16;
        const comparePriceFontSizeUnit = priceSettings.comparePriceFontSizeUnit || 'px';
        const comparePriceFontSizeMobile = priceSettings.comparePriceFontSizeMobile || 14;
        const comparePriceFontSizeMobileUnit = priceSettings.comparePriceFontSizeMobileUnit || 'px';
        const comparePriceFontWeight = { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700' }[priceSettings.comparePriceFontWeight || 'normal'] || '400';
        const priceStyleId = `price-style-${section.id}`;
        
        return (
          <React.Fragment key={section.id}>
            <style dangerouslySetInnerHTML={{ __html: `
              #${priceStyleId} [data-price] {
                font-size: ${priceFontSizeMobile}${priceFontSizeMobileUnit};
              }
              #${priceStyleId} [data-compare-price] {
                font-size: ${comparePriceFontSizeMobile}${comparePriceFontSizeMobileUnit};
              }
              @media (min-width: 768px) {
                #${priceStyleId} [data-price] {
                  font-size: ${priceFontSize}${priceFontSizeUnit};
                }
                #${priceStyleId} [data-compare-price] {
                  font-size: ${comparePriceFontSize}${comparePriceFontSizeUnit};
                }
              }
            `}} />
            <div 
              id={priceStyleId}
              className="flex items-baseline gap-4 mb-6"
              data-section-id={section.id}
              data-section-type={section.type}
              data-section-name="מחירים"
            >
              <span 
                data-price 
                style={{
                  color: priceColor,
                  fontWeight: priceFontWeight,
                }}
              >
                {format(finalPrice)}
              </span>
              {priceSettings.showComparePrice !== false && effectiveComparePrice && Number(effectiveComparePrice) > Number(finalPrice) && (
                <span 
                  data-compare-price 
                  className="line-through"
                  style={{
                    color: comparePriceColor,
                    fontWeight: comparePriceFontWeight,
                  }}
                >
                  {format(effectiveComparePrice)}
                </span>
              )}
            </div>
          </React.Fragment>
        );
        
      case 'product_short_desc':
        if (!product.shortDescription) return null;
        const shortDescSettings = section.settings as { 
          color?: string;
          fontSize?: number;
          fontSizeUnit?: string;
          fontSizeMobile?: number;
          fontSizeMobileUnit?: string;
          fontWeight?: string;
        };
        const shortDescColor = shortDescSettings.color || '#4b5563';
        const shortDescFontSize = shortDescSettings.fontSize || 16;
        const shortDescFontSizeUnit = shortDescSettings.fontSizeUnit || 'px';
        const shortDescFontSizeMobile = shortDescSettings.fontSizeMobile || 14;
        const shortDescFontSizeMobileUnit = shortDescSettings.fontSizeMobileUnit || 'px';
        const shortDescFontWeight = { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700' }[shortDescSettings.fontWeight || 'normal'] || '400';
        const shortDescStyleId = `shortdesc-style-${section.id}`;
        
        return (
          <React.Fragment key={section.id}>
            <style dangerouslySetInnerHTML={{ __html: `
              #${shortDescStyleId} {
                font-size: ${shortDescFontSizeMobile}${shortDescFontSizeMobileUnit};
              }
              @media (min-width: 768px) {
                #${shortDescStyleId} {
                  font-size: ${shortDescFontSize}${shortDescFontSizeUnit};
                }
              }
            `}} />
            <p 
              id={shortDescStyleId}
              key={section.id}
              className="mb-6"
              style={{
                color: shortDescColor,
                fontWeight: shortDescFontWeight,
              }}
              data-section-id={section.id}
              data-section-type={section.type}
              data-section-name="תיאור קצר"
            >
              {product.shortDescription}
            </p>
          </React.Fragment>
        );
        
      case 'product_inventory':
        const invSettings = section.settings as { displayStyle?: string; lowStockThreshold?: number };
        const threshold = invSettings.lowStockThreshold ?? 5;
        const displayStyle = invSettings.displayStyle ?? 'count';
        
        if (!product.trackInventory || displayStyle === 'hidden') return null;
        
        let inventoryText: string | null = null;
        if (displayStyle === 'in_stock') {
          inventoryText = (product.inventory ?? 0) > 0 ? 'במלאי' : 'אזל מהמלאי';
        } else if (displayStyle === 'count') {
          inventoryText = `${product.inventory ?? 0} יחידות במלאי`;
        } else if (displayStyle === 'low_stock' && (product.inventory ?? 0) <= threshold) {
          inventoryText = `נותרו ${product.inventory} יחידות אחרונות!`;
        }
        
        if (!inventoryText) return null;
        
        return (
          <p 
            key={section.id}
            className="text-sm text-gray-500 mb-4"
            data-section-id={section.id}
            data-section-type={section.type}
            data-section-name="חיווי מלאי"
          >
            {inventoryText}
          </p>
        );
        
      case 'product_add_to_cart':
        const cartSettings = section.settings as { 
          buttonText?: string; 
          outOfStockText?: string; 
          style?: string; 
          fullWidth?: boolean;
          // Wishlist settings
          showWishlist?: boolean;
          wishlistStyle?: string;
          wishlistFullWidth?: boolean;
          wishlistText?: string;
          wishlistActiveText?: string;
        };
        const hasAddons = productAddons.length > 0;
        const shouldShowWishlist = showWishlist && cartSettings.showWishlist !== false;
        
        return (
          <div 
            key={section.id}
            data-section-id={section.id}
            data-section-type={section.type}
            data-section-name="כפתור הוספה לסל"
          >
            {/* Bundle Components - show before add to cart */}
            {product.isBundle && (
              <BundleComponentsDisplay productId={product.id} storeSlug={storeSlug} />
            )}
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
                buttonText={cartSettings.buttonText}
                outOfStockText={cartSettings.outOfStockText}
              />
            ) : hasAddons ? (
              // Use ProductWithAddons when product has addons
              <ProductWithAddons
                productId={product.id}
                productName={product.name}
                productSlug={product.sku || ''}
                basePrice={Number(product.price)}
                finalPrice={Number(finalPrice)}
                image={product.images[0] || '/placeholder.svg'}
                sku={product.sku || undefined}
                inventory={product.inventory}
                trackInventory={product.trackInventory}
                allowBackorder={product.allowBackorder ?? false}
                addons={productAddons}
                automaticDiscountName={discountLabels.join(' + ') || undefined}
                discountedPrice={hasAutomaticDiscount ? Number(finalPrice) : undefined}
                categoryIds={categoryIds}
                showDecimalPrices={showDecimalPrices}
                storeSlug={storeSlug}
                isBundle={product.isBundle}
              />
            ) : (
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
                buttonText={cartSettings.buttonText}
                outOfStockText={cartSettings.outOfStockText}
                buttonStyle={cartSettings.style as 'filled' | 'outline'}
                fullWidth={cartSettings.fullWidth}
                isBundle={product.isBundle}
                bundleComponents={product.bundleComponents}
              />
            )}
            {/* Wishlist Button - below add to cart */}
            {shouldShowWishlist && (
              <div className="mt-3">
                <ProductWishlistButton 
                  productId={product.id}
                  buttonStyle={cartSettings.wishlistStyle as 'filled' | 'outline' | 'minimal'}
                  fullWidth={cartSettings.wishlistFullWidth}
                  text={cartSettings.wishlistText}
                  activeText={cartSettings.wishlistActiveText}
                />
              </div>
            )}
          </div>
        );
        
      case 'breadcrumb':
        return (
          <nav 
            key={section.id}
            className="py-6 px-6 border-b border-gray-100"
            data-section-id={section.id}
            data-section-type={section.type}
            data-section-name="פירורי לחם"
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
            data-section-name="תיאור מוצר"
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
            data-section-id={section.id}
            data-section-type={section.type}
            data-section-name="ביקורות"
          >
            <ProductReviewsSection
              productId={product.id}
              storeId={product.storeId}
              storeSlug={storeSlug}
              title={section.title || 'ביקורות לקוחות'}
              subtitle={section.subtitle || 'מה הלקוחות שלנו אומרים'}
            />
          </div>
        );
        
      case 'product_related':
        const relatedSettings = section.settings as Partial<RelatedSectionSettings>;
        const relatedCount = relatedSettings.count ?? 4;
        const displayRelated = relatedProducts.slice(0, relatedCount);
        
        if (displayRelated.length === 0) return null;
        
        return (
          <section 
            key={section.id}
            className="py-16 px-6 bg-gray-50"
            data-section-id={section.id}
            data-section-type={section.type}
            data-section-name="מוצרים דומים"
          >
            <div className="max-w-7xl mx-auto">
              <h2 
                className="text-[11px] tracking-[0.2em] uppercase text-black mb-8 text-center"
                data-section-title
              >
                {section.title || 'אולי יעניין אותך'}
              </h2>
              {section.subtitle && (
                <p 
                  className="text-center text-gray-500 text-sm mb-8"
                  data-section-subtitle
                >
                  {section.subtitle}
                </p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {displayRelated.map((p) => (
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
                    showWishlist={showWishlist}
                  />
                ))}
              </div>
            </div>
          </section>
        );
      
      case 'product_upsells':
        const upsellSettings = section.settings as { count?: number; showIfEmpty?: boolean };
        const upsellCount = upsellSettings.count ?? 4;
        const displayUpsells = upsellProducts.slice(0, upsellCount);
        
        if (displayUpsells.length === 0 && !upsellSettings.showIfEmpty) return null;
        
        return (
          <section 
            key={section.id}
            className="py-16 px-6"
            data-section-id={section.id}
            data-section-type={section.type}
            data-section-name="מוצרי אפסייל"
          >
            <div className="max-w-7xl mx-auto">
              <h2 
                className="text-[11px] tracking-[0.2em] uppercase text-black mb-8 text-center"
                data-section-title
              >
                {section.title || 'לקוחות גם קנו'}
              </h2>
              {section.subtitle && (
                <p 
                  className="text-center text-gray-500 text-sm mb-8"
                  data-section-subtitle
                >
                  {section.subtitle}
                </p>
              )}
              {displayUpsells.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {displayUpsells.map((p) => (
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
                      showWishlist={showWishlist}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 text-sm">
                  הגדר מוצרי אפסייל בעריכת המוצר
                </p>
              )}
            </div>
          </section>
        );
        
      case 'features':
        // Use ProductSection for features
        return (
          <div 
            key={section.id} 
            className="py-4 px-6"
            data-section-id={section.id}
            data-section-type={section.type}
            data-section-name="חוזקות"
          >
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
          <div 
            key={section.id} 
            className="py-4 px-6"
            data-section-id={section.id}
            data-section-type={section.type}
            data-section-name={section.title || section.type}
          >
            <div className="max-w-7xl mx-auto">
              <ProductSection section={section} context={context} />
            </div>
          </div>
        );
      
      // Story Stats Section - only renders if plugin is active AND product has a story
      case 'product_story_stats':
        // Only render if we have story stats data
        if (!storyStats) return null;
        
        return (
          <StoryStatsSection
            key={section.id}
            settings={section.settings as Partial<StoryStatsSectionSettings>}
            storyStats={storyStats}
            sectionId={section.id}
          />
        );
        
      default:
        return null;
    }
  };
  
  // Wrapper function that applies padding to sections
  const renderSectionWithPadding = (section: ProductPageSection) => {
    const content = renderSection(section);
    if (!content) return null;
    
    const sectionPadding = getPaddingClasses(section.settings as Record<string, unknown>);
    const hasPadding = sectionPadding.paddingTop || sectionPadding.paddingBottom;
    
    // Always wrap with a keyed fragment/div for proper React reconciliation
    if (!hasPadding) {
      return <div key={section.id}>{content}</div>;
    }
    
    return (
      <div 
        key={section.id}
        style={{
          paddingTop: sectionPadding.paddingTop || undefined,
          paddingBottom: sectionPadding.paddingBottom || undefined,
        }}
      >
        {content}
      </div>
    );
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
    s.type !== 'product_related' &&
    s.type !== 'product_upsells'
  );
  const reviewsSection = otherSections.find(s => s.type === 'product_reviews');
  const relatedSection = otherSections.find(s => s.type === 'product_related');
  const upsellsSection = otherSections.find(s => s.type === 'product_upsells');

  return (
    <>
      {/* Breadcrumb */}
      {breadcrumbSection && renderSection(breadcrumbSection)}

      {/* Product Section - Gallery + Info */}
      {hasGalleryOrInfo && (
        <section 
          className="py-12 px-6"
          data-section-id={gallerySection?.id || infoSection?.id}
          data-section-type="product_main"
          data-section-name="מוצר ראשי"
        >
          <div className="max-w-7xl mx-auto">
            <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-start ${
              thumbnailsPosition === 'right' ? 'lg:flex-row-reverse' : ''
            }`}>
              {/* Gallery */}
              {gallerySection && (
                <div
                  data-section-id={gallerySection.id}
                  data-section-type="product_gallery"
                  data-section-name="גלריה"
                  className="relative"
                >
                  {/* Product Badges on Gallery */}
                  {product.badges && product.badges.length > 0 && (
                    <ProductBadges badges={product.badges} />
                  )}
                  
                  <LiveGallerySection
                    mainImage={mainImage || ''}
                    productName={product.name}
                    images={product.images.map((url, i) => ({ id: `img-${i}`, url }))}
                    initialSettings={v1GallerySettings}
                    ProductImageComponent={ProductImage}
                  />
                </div>
              )}

              {/* Product Info - NEW separate sections (no wrapper) */}
              {hasNewInfoSections && (
                <div>
                  {infoChildSections.map(section => renderSectionWithPadding(section))}
                  
                  {/* Description - inside info area */}
                  {descriptionSection && product.description && (
                    <div className="mt-8">
                      {descSettings.style === 'accordion' ? (
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
                  
                  {/* Features - after info */}
                  {contentSections.filter(s => s.type === 'features').map(s => (
                    <div 
                      key={s.id} 
                      className="mt-8"
                      data-section-id={s.id}
                      data-section-type="features"
                      data-section-name="חוזקות"
                    >
                      <ProductSection section={s} context={context} />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Legacy product_info rendering - only if no new sections */}
              {!hasNewInfoSections && infoSection && (
                <div 
                  data-section-id={infoSection.id}
                  data-section-type="product_info"
                  data-section-name="מידע מוצר (Legacy)"
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
                  ) : productAddons.length > 0 ? (
                    <ProductWithAddons
                      productId={product.id}
                      productName={product.name}
                      productSlug={product.sku || ''}
                      basePrice={Number(product.price)}
                      finalPrice={Number(finalPrice)}
                      image={product.images[0] || '/placeholder.svg'}
                      sku={product.sku || undefined}
                      inventory={product.inventory}
                      trackInventory={product.trackInventory}
                      allowBackorder={product.allowBackorder ?? false}
                      addons={productAddons}
                      automaticDiscountName={discountLabels.join(' + ') || undefined}
                      discountedPrice={hasAutomaticDiscount ? Number(finalPrice) : undefined}
                      categoryIds={categoryIds}
                      showDecimalPrices={showDecimalPrices}
                      storeSlug={storeSlug}
                      isBundle={product.isBundle}
                    />
                  ) : (
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
                    <div className="mt-8">
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

                  {/* Features - after info, only if has features section */}
                  {contentSections.filter(s => s.type === 'features').map(s => (
                    <div 
                      key={s.id} 
                      className="mt-8"
                      data-section-id={s.id}
                      data-section-type="features"
                      data-section-name="חוזקות"
                    >
                      <ProductSection section={s} context={context} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Content Sections - Accordion, Tabs, Text Block (not features, already rendered above) */}
      {contentSections.filter(s => s.type !== 'features').map(section => renderSectionWithPadding(section))}

      {/* Reviews Section */}
      {reviewsSection && renderSectionWithPadding(reviewsSection)}

      {/* Upsell Products */}
      {upsellsSection && renderSectionWithPadding(upsellsSection)}

      {/* Related Products */}
      {relatedSection && renderSectionWithPadding(relatedSection)}
    </>
  );
}

