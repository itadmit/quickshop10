import { getStoreBySlug, getCategoriesByStore, getPageSectionsCached, getPageSections, getProductsByStore, getFeaturedProducts, getProductsByCategory, getProductsByIds, getFooterMenuItems } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { pages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { 
  ContentBlockSection,
  BannerSection,
  ProductsSection,
  ProductsSliderSection,
  CategoriesSection,
  VideoBannerSection, 
  SplitBannerSection, 
  NewsletterSection,
  ReviewsSection,
  ImageTextSection,
  FeaturesSection,
  BannerSmallSection,
  GallerySection,
  LogosSection,
  FAQSection,
  HeroSliderSection,
  SeriesGridSection,
  QuoteBannerSection,
  FeaturedItemsSection,
  ContactSection,
} from '@/components/sections';
import { StoreFooter } from '@/components/store-footer';
import { EditorSectionHighlighter } from '@/components/storefront/editor-section-highlighter';
import { getProductsAutomaticDiscounts } from '@/app/actions/automatic-discount';
import { headers, cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

// ============================================
// Internal Pages (About, Terms, etc.)
// Section-based pages with real-time editor support
// Server Component - Zero JS for maximum speed! ⚡
// ============================================

// ISR - Revalidate every 60 seconds
export const revalidate = 60;

interface InternalPageProps {
  params: Promise<{ slug: string; pageSlug: string }>;
}

export default async function InternalPage({ params }: InternalPageProps) {
  const { slug, pageSlug } = await params;
  
  // Decode pageSlug in case of URL encoding issues
  const decodedPageSlug = decodeURIComponent(pageSlug);
  
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get basePath (empty for custom domain, /shops/slug for platform)
  const headersList = await headers();
  const basePath = headersList.get('x-custom-domain') ? '' : `/shops/${slug}`;
  
  // Check if preview mode (from editor iframe)
  const isPreviewMode = headersList.get('x-preview-mode') === 'true';
  
  // Check if user has password cookie for preview access
  const cookieStore = await cookies();
  const hasPreviewAccess = cookieStore.get(`preview_${slug}`)?.value === 'true';
  
  // If store is not published, redirect (unless in preview mode or has password access)
  if (!store.isPublished && !isPreviewMode && !hasPreviewAccess) {
    redirect(`${basePath}/coming-soon`);
  }

  // Check if page exists and is published
  const page = await db.query.pages.findFirst({
    where: and(
      eq(pages.storeId, store.id),
      eq(pages.slug, decodedPageSlug)
    ),
  });

  // Debug: log for troubleshooting 404 issues
  if (!page) {
    console.log(`[InternalPage] Page not found: storeId=${store.id}, slug="${decodedPageSlug}", isPreviewMode=${isPreviewMode}`);
  }

  // Page must exist, and be published (or in preview mode)
  if (!page || (!page.isPublished && !isPreviewMode)) {
    notFound();
  }
  
  // Get page template setting (default = with header/footer, clean = without)
  const pageTemplate = (page.template as 'default' | 'clean') || 'default';
  const isCleanTemplate = pageTemplate === 'clean';
  
  // Get price display settings
  const storeSettings = (store.settings as Record<string, unknown>) || {};
  const showDecimalPrices = Boolean(storeSettings.showDecimalPrices);

  // The page identifier in pageSections is "pages/{slug}"
  const pageIdentifier = `pages/${decodedPageSlug}`;

  // Parallel data fetching - maximum speed! ⚡
  // In preview mode: use non-cached query to always get latest data
  // In production: use cached version for performance
  const [sections, categories, featuredProducts, allProducts, footerMenuItems] = await Promise.all([
    isPreviewMode 
      ? getPageSections(store.id, pageIdentifier) 
      : getPageSectionsCached(store.id, pageIdentifier),
    getCategoriesByStore(store.id),
    getFeaturedProducts(store.id, 4),
    getProductsByStore(store.id, 12),
    getFooterMenuItems(store.id),
  ]);

  // Get automatic discounts for all products
  const allProductsList = [...featuredProducts, ...allProducts];
  const uniqueProducts = Array.from(new Map(allProductsList.map(p => [p.id, p])).values());
  const discountsMap = await getProductsAutomaticDiscounts(
    store.id,
    uniqueProducts.map(p => ({ id: p.id, price: p.price }))
  );

  // If no sections exist, show empty state
  if (sections.length === 0) {
    return (
      <div className="min-h-screen bg-white" dir="rtl" data-page-template={pageTemplate}>
        {/* Hide header when clean template */}
        {isCleanTemplate && (
          <style dangerouslySetInnerHTML={{ __html: `
            header, [data-header], .shop-header, nav[role="navigation"] { display: none !important; }
          ` }} />
        )}
        {/* Editor Section Highlighter - ONLY in preview mode */}
        {isPreviewMode && <EditorSectionHighlighter />}
        
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{page.title}</h1>
          {isPreviewMode ? (
            <p className="text-gray-500">הוסף סקשנים לעמוד זה דרך העורך</p>
          ) : (
            <p className="text-gray-500">העמוד בבנייה...</p>
          )}
        </div>

        {/* Footer - hide for clean template */}
        {!isCleanTemplate && (
          <StoreFooter 
            storeName={store.name}
            storeSlug={slug}
            categories={categories} 
            basePath={basePath}
            settings={store.settings as Record<string, unknown>}
            footerMenuItems={footerMenuItems}
          />
        )}
      </div>
    );
  }

  // Pre-fetch products for sections that need special queries
  type BasicProduct = {
    id: string;
    name: string;
    slug: string;
    shortDescription: string | null;
    price: string | null;
    comparePrice: string | null;
    inventory: number | null;
    trackInventory: boolean;
    allowBackorder: boolean;
    isFeatured: boolean;
    hasVariants: boolean;
    image: string | null;
  };
  
  const productsSectionsFetches: Promise<{ sectionId: string; products: BasicProduct[] }>[] = [];
  
  for (const section of sections) {
    // Pre-fetch products for both grid and slider sections
    if (section.type === 'products' || section.type === 'products_slider') {
      const content = section.content as Record<string, unknown>;
      const productType = content.type as string | undefined;
      
      if (productType === 'category' && content.categoryId) {
        productsSectionsFetches.push(
          getProductsByCategory(store.id, content.categoryId as string)
            .then(products => ({ sectionId: section.id, products: products as BasicProduct[] }))
        );
      } else if (productType === 'specific' && content.productIds && (content.productIds as string[]).length > 0) {
        productsSectionsFetches.push(
          getProductsByIds(store.id, content.productIds as string[])
            .then(products => ({ sectionId: section.id, products: products as BasicProduct[] }))
        );
      }
    }
  }
  
  // Wait for all product fetches in parallel
  const productsFetchResults = await Promise.all(productsSectionsFetches);
  const sectionProductsMap = new Map<string, BasicProduct[]>(productsFetchResults.map(r => [r.sectionId, r.products]));

  // Render sections dynamically
  const renderSection = (section: typeof sections[0], index: number) => {
    const content = section.content as Record<string, unknown>;
    const settings = section.settings as Record<string, unknown>;

    let sectionElement: React.ReactNode = null;

    switch (section.type) {
      case 'hero':
      case 'text_block':
      case 'hero_premium':
      case 'content_block':
        // All content block types use the same component
        sectionElement = (
          <ContentBlockSection
            sectionId={section.id}
            title={section.title}
            subtitle={section.subtitle}
            content={{
              text: (content as { text?: string }).text,
              buttonText: (content as { buttonText?: string; primaryButtonText?: string }).buttonText || (content as { primaryButtonText?: string }).primaryButtonText,
              buttonLink: (content as { buttonLink?: string; primaryButtonLink?: string }).buttonLink || (content as { primaryButtonLink?: string }).primaryButtonLink,
              secondaryButtonText: (content as { secondaryButtonText?: string }).secondaryButtonText,
              secondaryButtonLink: (content as { secondaryButtonLink?: string }).secondaryButtonLink,
              imageUrl: (content as { imageUrl?: string }).imageUrl,
              mobileImageUrl: (content as { mobileImageUrl?: string }).mobileImageUrl,
              videoUrl: (content as { videoUrl?: string }).videoUrl,
              mobileVideoUrl: (content as { mobileVideoUrl?: string }).mobileVideoUrl,
            }}
            settings={{
              backgroundColor: (settings as { backgroundColor?: string }).backgroundColor,
              minHeight: (settings as { minHeight?: number }).minHeight,
              minHeightUnit: (settings as { minHeightUnit?: string }).minHeightUnit as 'px' | 'vh' | undefined,
              height: (settings as { height?: string }).height,
              overlay: (settings as { overlay?: number; overlayOpacity?: number }).overlay ?? (settings as { overlayOpacity?: number }).overlayOpacity,
              showGradient: (settings as { showGradient?: boolean }).showGradient,
              gradientDirection: (settings as { gradientDirection?: string }).gradientDirection as 'top' | 'bottom' | 'left' | 'right' | undefined,
              textAlign: (settings as { textAlign?: string }).textAlign as 'left' | 'center' | 'right' | undefined,
              verticalAlign: (settings as { verticalAlign?: string }).verticalAlign as 'top' | 'center' | 'bottom' | undefined,
              sectionWidth: (settings as { sectionWidth?: string }).sectionWidth as 'full' | 'boxed' | undefined,
              contentWidth: (settings as { contentWidth?: number }).contentWidth,
              titleColor: (settings as { titleColor?: string }).titleColor,
              titleSize: (settings as { titleSize?: number }).titleSize,
              titleSizeMobile: (settings as { titleSizeMobile?: number }).titleSizeMobile,
              titleWeight: (settings as { titleWeight?: string }).titleWeight as 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | undefined,
              subtitleColor: (settings as { subtitleColor?: string }).subtitleColor,
              subtitleSize: (settings as { subtitleSize?: number }).subtitleSize,
              subtitleSizeMobile: (settings as { subtitleSizeMobile?: number }).subtitleSizeMobile,
              textColor: (settings as { textColor?: string }).textColor,
              textSize: (settings as { textSize?: number }).textSize,
              textSizeMobile: (settings as { textSizeMobile?: number }).textSizeMobile,
              buttonTextColor: (settings as { buttonTextColor?: string }).buttonTextColor,
              buttonBackgroundColor: (settings as { buttonBackgroundColor?: string; buttonBackground?: string }).buttonBackgroundColor || (settings as { buttonBackground?: string }).buttonBackground,
              buttonBorderColor: (settings as { buttonBorderColor?: string }).buttonBorderColor,
              buttonStyle: (settings as { buttonStyle?: string }).buttonStyle as 'filled' | 'outline' | 'underline' | undefined,
              paddingTop: (settings as { paddingTop?: number }).paddingTop,
              paddingBottom: (settings as { paddingBottom?: number }).paddingBottom,
              hideOnMobile: (settings as { hideOnMobile?: boolean }).hideOnMobile,
              hideOnDesktop: (settings as { hideOnDesktop?: boolean }).hideOnDesktop,
              showScrollArrow: (settings as { showScrollArrow?: boolean }).showScrollArrow,
              zIndex: (settings as { zIndex?: number }).zIndex,
              customClass: (settings as { customClass?: string }).customClass,
              customId: (settings as { customId?: string }).customId,
              backgroundMaxWidth: (settings as { backgroundMaxWidth?: number }).backgroundMaxWidth,
            }}
            basePath={basePath}
          />
        );
        break;

      case 'image_text':
        sectionElement = (
          <ImageTextSection
            title={section.title}
            subtitle={section.subtitle}
            content={content as { imageUrl?: string; text?: string; buttonText?: string; buttonLink?: string }}
            settings={settings as { imagePosition?: 'right' | 'left'; imageWidth?: '40%' | '50%' | '60%'; height?: string; backgroundColor?: string; textAlign?: 'right' | 'center' | 'left'; overlay?: number }}
            basePath={basePath}
            sectionId={section.id}
          />
        );
        break;

      case 'gallery':
        sectionElement = (
          <GallerySection
            title={section.title}
            subtitle={section.subtitle}
            content={content as { images?: Array<{ id: string; url: string; alt?: string; link?: string }> }}
            settings={settings as { columns?: number; gap?: number; aspectRatio?: 'square' | '4:3' | '16:9' | 'auto'; layout?: 'grid' | 'masonry'; backgroundColor?: string }}
            basePath={basePath}
            sectionId={section.id}
          />
        );
        break;

      case 'faq':
        sectionElement = (
          <FAQSection
            title={section.title}
            subtitle={section.subtitle}
            content={content as { items?: Array<{ id: string; question: string; answer: string }> }}
            settings={settings as { maxWidth?: 'sm' | 'md' | 'lg' | 'xl'; backgroundColor?: string; style?: 'accordion' | 'cards' | 'simple' }}
            sectionId={section.id}
          />
        );
        break;

      case 'features':
        sectionElement = (
          <FeaturesSection
            title={section.title}
            subtitle={section.subtitle}
            content={content as { features?: Array<{ id: string; icon?: string; emoji?: string; title: string; description?: string }> }}
            settings={settings as { columns?: number; iconStyle?: 'emoji' | 'icon' | 'none'; backgroundColor?: string; textAlign?: 'right' | 'center' | 'left'; showDividers?: boolean }}
            sectionId={section.id}
          />
        );
        break;

      case 'categories':
        const categoryIds = content.categoryIds as string[] | undefined;
        const categoriesToShow = isPreviewMode 
          ? categories 
          : (categoryIds && categoryIds.length > 0 ? categories.filter(cat => categoryIds.includes(cat.id)) : categories);
        
        sectionElement = (
          <CategoriesSection
            title={section.title}
            subtitle={section.subtitle}
            categories={categoriesToShow}
            settings={settings as { 
              columns?: number; 
              gap?: number; 
              textAlign?: 'right' | 'center' | 'left';
              hideOnMobile?: boolean;
              hideOnDesktop?: boolean;
            }}
            basePath={basePath}
            sectionId={section.id}
            selectedCategoryIds={isPreviewMode ? categoryIds : undefined}
          />
        );
        break;

      case 'products':
        const productContent = content as { 
          type?: string; 
          limit?: number;
          displayLimit?: number;
          categoryId?: string;
          productIds?: string[];
        };
        // תומך בשני השדות לתאימות - displayLimit חדש, limit ישן
        const productLimit = productContent.limit || productContent.displayLimit || 8;
        
        let allProductsToShow: BasicProduct[] = [];
        
        if (productContent.type === 'featured') {
          allProductsToShow = featuredProducts as BasicProduct[];
        } else if (productContent.type === 'category' || productContent.type === 'specific') {
          allProductsToShow = sectionProductsMap.get(section.id) || [];
        } else {
          allProductsToShow = allProducts as BasicProduct[];
        }
        
        const productsToShow = isPreviewMode 
          ? allProductsToShow 
          : productContent.type === 'specific' 
          ? allProductsToShow 
          : allProductsToShow.slice(0, productLimit);
        
        sectionElement = (
          <ProductsSection
            title={section.title}
            subtitle={section.subtitle}
            products={productsToShow}
            settings={settings as { columns?: number; gap?: number; showCount?: boolean; textAlign?: 'right' | 'center' | 'left'; showAddToCart?: boolean }}
            basePath={basePath}
            showDecimalPrices={showDecimalPrices}
            sectionId={section.id}
            displayLimit={isPreviewMode && productContent.type !== 'specific' ? productLimit : undefined}
            discountsMap={discountsMap}
            storeSlug={slug}
          />
        );
        break;

      case 'products_slider':
        const sliderContent = content as { 
          type?: string; 
          limit?: number;
          displayLimit?: number;
          categoryId?: string;
          productIds?: string[];
        };
        const sliderLimit = sliderContent.limit || sliderContent.displayLimit || 8;
        
        let sliderProductsToShow: BasicProduct[] = [];
        
        if (sliderContent.type === 'featured') {
          sliderProductsToShow = featuredProducts as BasicProduct[];
        } else if (sliderContent.type === 'category' || sliderContent.type === 'specific') {
          sliderProductsToShow = sectionProductsMap.get(section.id) || [];
        } else {
          sliderProductsToShow = allProducts as BasicProduct[];
        }
        
        const sliderProducts = isPreviewMode 
          ? sliderProductsToShow 
          : sliderContent.type === 'specific' 
          ? sliderProductsToShow 
          : sliderProductsToShow.slice(0, sliderLimit);
        
        sectionElement = (
          <ProductsSliderSection
            title={section.title}
            subtitle={section.subtitle}
            products={sliderProducts}
            settings={settings as { 
              columns?: number; 
              mobileColumns?: number;
              gap?: number; 
              showCount?: boolean; 
              textAlign?: 'right' | 'center' | 'left'; 
              showAddToCart?: boolean;
              showArrows?: boolean;
              showDots?: boolean;
              arrowStyle?: 'circle' | 'square' | 'minimal';
              dotsStyle?: 'dots' | 'lines' | 'numbers';
              autoplay?: boolean;
              autoplayInterval?: number;
              loop?: boolean;
            }}
            basePath={basePath}
            showDecimalPrices={showDecimalPrices}
            sectionId={section.id}
            displayLimit={isPreviewMode && sliderContent.type !== 'specific' ? sliderLimit : undefined}
            discountsMap={discountsMap}
            storeSlug={slug}
          />
        );
        break;

      case 'video_banner':
        sectionElement = (
          <VideoBannerSection
            title={section.title}
            subtitle={section.subtitle}
            content={content as { 
              videoUrl?: string; 
              imageUrl?: string; 
              mobileVideoUrl?: string;
              mobileImageUrl?: string;
              buttonText?: string; 
              buttonLink?: string;
            }}
            settings={settings as { 
              height?: string; 
              overlay?: number;
              autoplay?: boolean;
              loop?: boolean;
              muted?: boolean;
              controls?: boolean;
            }}
            basePath={basePath}
            sectionId={section.id}
          />
        );
        break;

      case 'split_banner':
        sectionElement = (
          <SplitBannerSection
            content={content as { 
              right?: { title?: string; imageUrl?: string; mobileImageUrl?: string; link?: string };
              left?: { title?: string; imageUrl?: string; mobileImageUrl?: string; link?: string };
              items?: { title: string; imageUrl: string; mobileImageUrl?: string; link: string }[];
            }}
            settings={settings as { height?: string }}
            basePath={basePath}
            sectionId={section.id}
          />
        );
        break;

      case 'newsletter':
        sectionElement = (
          <NewsletterSection
            title={section.title}
            subtitle={section.subtitle}
            content={content as { placeholder?: string; buttonText?: string }}
            settings={settings as { 
              maxWidth?: string;
              backgroundColor?: string;
              textColor?: string;
              buttonColor?: string;
              buttonTextColor?: string;
            }}
            sectionId={section.id}
            storeSlug={slug}
          />
        );
        break;

      case 'reviews':
        sectionElement = (
          <ReviewsSection
            title={section.title}
            subtitle={section.subtitle}
            content={content as { reviews?: Array<{ id: string; author: string; rating: number; text: string; date?: string; avatar?: string; verified?: boolean }> }}
            settings={settings as { columns?: number; showRating?: boolean; showDate?: boolean; showAvatar?: boolean; style?: 'cards' | 'minimal' | 'quotes'; backgroundColor?: string }}
            sectionId={section.id}
          />
        );
        break;

      case 'banner':
        // באנר תמונה פשוט - תמונה בלבד עם לינק אופציונלי
        sectionElement = (
          <BannerSection
            id={section.id}
            content={content as { 
              imageUrl?: string; 
              mobileImageUrl?: string; 
              linkUrl?: string; 
              linkTarget?: '_self' | '_blank';
              altText?: string;
            }}
            settings={settings as { 
              sectionWidth?: 'full' | 'boxed';
              maxWidth?: number;
              paddingTop?: number;
              paddingBottom?: number;
              marginTop?: number;
              marginBottom?: number;
              backgroundColor?: string;
              borderRadius?: number;
              shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
              hideOnDesktop?: boolean;
              hideOnMobile?: boolean;
            }}
            isActive={section.isActive}
          />
        );
        break;

      case 'banner_small':
        sectionElement = (
          <BannerSmallSection
            title={section.title}
            subtitle={section.subtitle}
            content={content as { buttonText?: string; buttonLink?: string; icon?: string }}
            settings={settings as { backgroundColor?: string; textColor?: string; buttonStyle?: 'outline' | 'filled' | 'none'; size?: 'small' | 'medium' | 'large' }}
            basePath={basePath}
            sectionId={section.id}
          />
        );
        break;

      case 'logos':
        sectionElement = (
          <LogosSection
            title={section.title}
            subtitle={section.subtitle}
            content={content as { logos?: Array<{ id: string; url: string; alt?: string; link?: string }> }}
            settings={settings as { columns?: number; logoHeight?: number; grayscale?: boolean; backgroundColor?: string }}
            sectionId={section.id}
          />
        );
        break;

      case 'hero_slider':
        sectionElement = (
          <HeroSliderSection
            title={section.title}
            subtitle={section.subtitle}
            content={content as { 
              slides?: Array<{ 
                id: string; 
                imageUrl: string; 
                title?: string; 
                subtitle?: string; 
                buttonText?: string; 
                buttonLink?: string;
                textPosition?: 'center' | 'bottom-center' | 'bottom-right' | 'bottom-left';
              }>;
              autoPlay?: boolean;
              interval?: number;
            }}
            settings={settings as { 
              height?: string; 
              overlay?: number; 
              showDots?: boolean; 
              showArrows?: boolean;
              textStyle?: 'elegant' | 'bold' | 'minimal';
            }}
            basePath={basePath}
            sectionId={section.id}
          />
        );
        break;

      case 'series_grid':
        sectionElement = (
          <SeriesGridSection
            title={section.title}
            subtitle={section.subtitle}
            content={content as { 
              items: Array<{ 
                id: string; 
                title: string; 
                subtitle?: string;
                description?: string; 
                imageUrl?: string;
                gradientFrom?: string;
                gradientTo?: string;
                icon?: string;
                link: string;
              }>;
            }}
            settings={settings as { 
              style?: 'overlay' | 'cards';
              columns?: 2 | 3 | 4; 
              layout?: 'uniform' | 'featured';
              cardHeight?: string;
              minImageHeight?: string;
              imageAspectRatio?: 'square' | 'portrait' | 'landscape' | 'auto';
              sectionBackground?: string;
              cardBackground?: string;
              accentColor?: string;
              buttonText?: string;
            }}
            basePath={basePath}
            sectionId={section.id}
          />
        );
        break;

      case 'quote_banner':
        sectionElement = (
          <QuoteBannerSection
            title={section.title}
            subtitle={section.subtitle}
            content={content as { 
              quote: string;
              attribution?: string;
              imageUrl?: string;
              mobileImageUrl?: string;
              videoUrl?: string;
              mobileVideoUrl?: string;
              mediaType?: 'image' | 'video';
            }}
            settings={settings as { 
              height?: string;
              mobileHeight?: string;
              overlay?: number;
              textStyle?: 'serif' | 'sans' | 'italic';
              parallax?: boolean;
            }}
            sectionId={section.id}
          />
        );
        break;

      case 'featured_items':
        sectionElement = (
          <FeaturedItemsSection
            title={section.title}
            subtitle={section.subtitle}
            content={content as { 
              items: Array<{ 
                id: string; 
                name: string; 
                imageUrl?: string;
                videoUrl?: string;
                link: string;
              }>;
            }}
            settings={settings as { 
              columns?: 2 | 3 | 4;
              imageAspectRatio?: 'square' | 'portrait' | 'landscape';
              textAlign?: 'right' | 'center' | 'left';
              sectionBackground?: string;
              cardBackground?: string;
              textColor?: string;
              hoverEffect?: 'zoom' | 'lift' | 'none';
              imageStyle?: 'rounded' | 'square' | 'circle';
            }}
            basePath={basePath}
            sectionId={section.id}
          />
        );
        break;

      case 'contact':
        sectionElement = (
          <ContactSection
            title={section.title}
            subtitle={section.subtitle}
            content={content as {
              email?: string;
              phone?: string;
              address?: string;
              hours?: string;
              showForm?: boolean;
              formAction?: string;
              submitButtonText?: string;
              socialLinks?: Array<{
                type: 'facebook' | 'instagram' | 'twitter' | 'whatsapp' | 'telegram';
                url: string;
              }>;
              text?: string;
            }}
            settings={settings as {
              layout?: 'simple' | 'split' | 'form-only' | 'info-only';
              maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
              textAlign?: 'right' | 'center' | 'left';
              backgroundColor?: string;
              textColor?: string;
              paddingY?: 'small' | 'medium' | 'large';
              titleColor?: string;
              titleSize?: 'sm' | 'md' | 'lg' | 'xl';
              titleWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
              buttonTextColor?: string;
              buttonBackgroundColor?: string;
            }}
            basePath={basePath}
            sectionId={section.id}
            storeSlug={slug}
          />
        );
        break;

      case 'custom':
        // Custom HTML section - render user's HTML code directly
        const customHtml = (content as { html?: string }).html || '';
        sectionElement = (
          <section
            data-section-id={section.id}
            data-section-type="custom"
            data-section-name="קוד מותאם אישית"
            className={`${(settings as { hideOnMobile?: boolean }).hideOnMobile ? 'max-md:hidden' : ''} ${(settings as { hideOnDesktop?: boolean }).hideOnDesktop ? 'md:hidden' : ''}`}
            style={{
              backgroundColor: (settings as { backgroundColor?: string }).backgroundColor,
              paddingTop: (settings as { paddingTop?: number }).paddingTop ? `${(settings as { paddingTop?: number }).paddingTop}px` : undefined,
              paddingBottom: (settings as { paddingBottom?: number }).paddingBottom ? `${(settings as { paddingBottom?: number }).paddingBottom}px` : undefined,
            }}
          >
            <div 
              data-custom-html
              dangerouslySetInnerHTML={{ __html: customHtml }}
            />
          </section>
        );
        break;

      default:
        return null;
    }

    return <div key={section.id}>{sectionElement}</div>;
  };

  return (
    <div className="min-h-screen" data-page-template={pageTemplate}>
      {/* Hide header when clean template */}
      {isCleanTemplate && (
        <style dangerouslySetInnerHTML={{ __html: `
          header, [data-header], .shop-header, nav[role="navigation"] { display: none !important; }
        ` }} />
      )}
      
      {/* Editor Section Highlighter - ONLY in preview mode */}
      {isPreviewMode && <EditorSectionHighlighter />}
      
      {/* Render all sections from database */}
      {sections.map((section, i) => renderSection(section, i))}

      {/* Footer - hide for clean template */}
      {!isCleanTemplate && (
        <StoreFooter 
          storeName={store.name}
          storeSlug={slug}
          logoUrl={store.logoUrl}
          categories={categories} 
          basePath={basePath}
          settings={store.settings as Record<string, unknown>}
          footerMenuItems={footerMenuItems}
        />
      )}
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: InternalPageProps) {
  const { slug, pageSlug } = await params;
  const decodedPageSlug = decodeURIComponent(pageSlug);
  const store = await getStoreBySlug(slug);
  
  if (!store) return {};
  
  const page = await db.query.pages.findFirst({
    where: and(
      eq(pages.storeId, store.id),
      eq(pages.slug, decodedPageSlug)
    ),
  });
  
  if (!page) return {};
  
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || `${page.title} - ${store.name}`,
  };
}

