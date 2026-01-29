import { getStoreBySlug, getFeaturedProducts, getProductsByStore, getCategoriesByStore, getPageSectionsCached, getPageSections, getProductsByCategory, getProductsByIds, getFooterMenuItems, getProductsBadgesForCards } from '@/lib/db/queries';
import { 
  ContentBlockSection,
  CategoriesSection, 
  ProductsSection, 
  VideoBannerSection, 
  SplitBannerSection, 
  NewsletterSection,
  ContactSection,
  ReviewsSection,
  GoogleReviewsSection,
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
} from '@/components/sections';
import type { GoogleReview } from '@/components/sections';
import { StoreFooter } from '@/components/store-footer';
import { EditorSectionHighlighter } from '@/components/storefront/editor-section-highlighter';
import { ScrollToTop } from '@/components/scroll-to-top';
import { getProductsAutomaticDiscounts } from '@/app/actions/automatic-discount';
import { headers, cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

interface ShopPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ShopHomePage({ params }: ShopPageProps) {
  const { slug } = await params;
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
  
  // If store is not published, show Coming Soon page (unless in preview mode or has password access)
  if (!store.isPublished && !isPreviewMode && !hasPreviewAccess) {
    redirect(`${basePath}/coming-soon`);
  }
  
  // Get price display settings
  const storeSettings = (store.settings as Record<string, unknown>) || {};
  const showDecimalPrices = Boolean(storeSettings.showDecimalPrices);

  // Parallel data fetching - maximum speed! ⚡
  const [sections, categories, featuredProducts, allProducts, footerMenuItems] = await Promise.all([
    getPageSectionsCached(store.id, 'home'),
    getCategoriesByStore(store.id),
    getFeaturedProducts(store.id, 4),
    getProductsByStore(store.id, 12),
    getFooterMenuItems(store.id),
  ]);

  // שליפת הנחות אוטומטיות ומדבקות לכל המוצרים (batch - שליפה אחת מהירה!) ⚡
  const allProductsList = [...featuredProducts, ...allProducts];
  const uniqueProducts = Array.from(new Map(allProductsList.map(p => [p.id, p])).values());
  const [discountsMap, badgesMap] = await Promise.all([
    getProductsAutomaticDiscounts(
      store.id,
      uniqueProducts.map(p => ({ id: p.id, price: p.price }))
    ),
    getProductsBadgesForCards(store.id, uniqueProducts.map(p => p.id)),
  ]);

  // If no sections exist, show empty state with message to add sections
  // Wrapped in <main> so EditorSectionHighlighter can add placeholders
  // IMPORTANT: EditorSectionHighlighter must be included for live section adding to work!
  if (sections.length === 0) {
    return (
      <>
        {isPreviewMode && <EditorSectionHighlighter />}
        <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8" dir="rtl" data-empty-home>
          <div className="text-center max-w-md" data-empty-state>
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <h1 className="text-xl font-medium text-gray-900 mb-2">
              עדיין אין תוכן
            </h1>
            <p className="text-gray-500 mb-6">
              הוסף סקשנים לדף הבית דרך עורך העיצוב
            </p>
          </div>
        </main>
      </>
    );
  }

  // Pre-fetch products for sections that need special queries (category/specific)
  // This is done in parallel for speed! ⚡
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
    if (section.type === 'products') {
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

  // Render sections dynamically from database
  // Each section component has data-section-id built-in for editor interaction
  const renderSection = (section: typeof sections[0], index: number) => {
    const content = section.content as Record<string, unknown>;
    const settings = section.settings as Record<string, unknown>;

    let sectionElement: React.ReactNode = null;

    switch (section.type) {
      case 'hero':
        // hero now uses ContentBlockSection - identical to content_block
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
              subtitleWeight: (settings as { subtitleWeight?: string }).subtitleWeight as 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | undefined,
              textColor: (settings as { textColor?: string }).textColor,
              textSize: (settings as { textSize?: number }).textSize,
              textSizeMobile: (settings as { textSizeMobile?: number }).textSizeMobile,
              buttonTextColor: (settings as { buttonTextColor?: string }).buttonTextColor,
              buttonBackgroundColor: (settings as { buttonBackgroundColor?: string; buttonBackground?: string }).buttonBackgroundColor || (settings as { buttonBackground?: string }).buttonBackground,
              buttonBorderColor: (settings as { buttonBorderColor?: string }).buttonBorderColor,
              buttonBorderWidth: (settings as { buttonBorderWidth?: number }).buttonBorderWidth,
              buttonBorderRadius: (settings as { buttonBorderRadius?: number }).buttonBorderRadius,
              buttonStyle: (settings as { buttonStyle?: string }).buttonStyle as 'filled' | 'outline' | 'underline' | undefined,
              paddingTop: (settings as { paddingTop?: number }).paddingTop,
              paddingBottom: (settings as { paddingBottom?: number }).paddingBottom,
              paddingLeft: (settings as { paddingLeft?: number }).paddingLeft,
              paddingRight: (settings as { paddingRight?: number }).paddingRight,
              marginTop: (settings as { marginTop?: number }).marginTop,
              marginBottom: (settings as { marginBottom?: number }).marginBottom,
              animation: (settings as { animation?: string }).animation as 'none' | 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | undefined,
              animationDuration: (settings as { animationDuration?: number }).animationDuration,
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

      case 'categories':
        // Support selection mode, category IDs, and custom images
        const catContent = content as { 
          selectionMode?: 'all' | 'manual'; 
          categoryIds?: string[]; 
          categoryImages?: Record<string, string>;
          displayLimit?: number;
        };
        const catSelectionMode = catContent.selectionMode || 'all';
        const catCategoryIds = catContent.categoryIds || [];
        const catCategoryImages = catContent.categoryImages || {};
        const catDisplayLimit = catContent.displayLimit || 6;
        
        let categoriesToShow = categories;
        
        // In preview mode: show all categories (filtering done via CSS)
        // In production: filter based on selection mode
        if (!isPreviewMode) {
          if (catSelectionMode === 'manual' && catCategoryIds.length > 0) {
            // Manual selection: order by selected IDs order
            categoriesToShow = catCategoryIds
              .map(id => categories.find(c => c.id === id))
              .filter((c): c is typeof categories[0] => c !== undefined);
          } else {
            // All mode: apply display limit
            categoriesToShow = categories.slice(0, catDisplayLimit);
          }
        }
        
        // Apply custom images if provided, but keep original for live editing
        const categoriesWithCustomImages = categoriesToShow.map(cat => ({
          ...cat,
          originalImageUrl: cat.imageUrl, // Keep original for restoration
          imageUrl: catCategoryImages[cat.id] || cat.imageUrl,
        }));
        
        sectionElement = (
          <CategoriesSection
            title={section.title}
            subtitle={section.subtitle}
            categories={categoriesWithCustomImages}
            settings={settings as { columns?: number; gap?: number; textAlign?: 'right' | 'center' | 'left' }}
            basePath={basePath}
            sectionId={section.id}
            selectedCategoryIds={isPreviewMode ? catCategoryIds : undefined}
          />
        );
        break;

      case 'products':
        const productContent = content as { 
          type?: string; 
          limit?: number; 
          categoryId?: string;
          productIds?: string[];
        };
        const productLimit = productContent.limit || 8;
        
        // Determine which products to show based on type
        // Uses pre-fetched data from sectionProductsMap for category/specific types
        let allProductsToShow: BasicProduct[] = [];
        
        if (productContent.type === 'featured') {
          allProductsToShow = featuredProducts as BasicProduct[];
        } else if (productContent.type === 'category' || productContent.type === 'specific') {
          // Use pre-fetched products from the map
          allProductsToShow = sectionProductsMap.get(section.id) || [];
        } else {
          // Default: all products
          allProductsToShow = allProducts as BasicProduct[];
        }
        
        // In preview mode: show all products (limiting done via CSS for live preview)
        // In production: slice to limit (except for specific products which should show all selected)
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
            badgesMap={badgesMap}
            storeSlug={slug}
            showWishlist={Boolean(storeSettings.headerShowWishlist)}
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
              // New structure
              right?: { title?: string; imageUrl?: string; mobileImageUrl?: string; link?: string };
              left?: { title?: string; imageUrl?: string; mobileImageUrl?: string; link?: string };
              // Legacy support
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

      // =====================================================
      // NEW SECTION TYPES - All Server Components!
      // =====================================================

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

      case 'google_reviews':
        sectionElement = (
          <GoogleReviewsSection
            title={section.title}
            subtitle={section.subtitle}
            content={content as {
              businessName?: string;
              businessImage?: string;
              averageRating?: number;
              totalReviews?: number;
              googlePlaceUrl?: string;
              reviews?: GoogleReview[];
            }}
            settings={settings as {
              layout?: 'full' | 'compact';
              backgroundColor?: string;
              cardStyle?: 'white' | 'transparent';
              columns?: number;
              mobileColumns?: number;
              showArrows?: boolean;
              showDots?: boolean;
              autoplay?: boolean;
              autoplayInterval?: number;
              hideOnMobile?: boolean;
              hideOnDesktop?: boolean;
            }}
            sectionId={section.id}
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

      case 'text_block':
        // text_block now uses ContentBlockSection - identical to content_block
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
              subtitleWeight: (settings as { subtitleWeight?: string }).subtitleWeight as 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | undefined,
              textColor: (settings as { textColor?: string }).textColor,
              textSize: (settings as { textSize?: number }).textSize,
              textSizeMobile: (settings as { textSizeMobile?: number }).textSizeMobile,
              buttonTextColor: (settings as { buttonTextColor?: string }).buttonTextColor,
              buttonBackgroundColor: (settings as { buttonBackgroundColor?: string; buttonBackground?: string }).buttonBackgroundColor || (settings as { buttonBackground?: string }).buttonBackground,
              buttonBorderColor: (settings as { buttonBorderColor?: string }).buttonBorderColor,
              buttonBorderWidth: (settings as { buttonBorderWidth?: number }).buttonBorderWidth,
              buttonBorderRadius: (settings as { buttonBorderRadius?: number }).buttonBorderRadius,
              buttonStyle: (settings as { buttonStyle?: string }).buttonStyle as 'filled' | 'outline' | 'underline' | undefined,
              paddingTop: (settings as { paddingTop?: number }).paddingTop,
              paddingBottom: (settings as { paddingBottom?: number }).paddingBottom,
              paddingLeft: (settings as { paddingLeft?: number }).paddingLeft,
              paddingRight: (settings as { paddingRight?: number }).paddingRight,
              marginTop: (settings as { marginTop?: number }).marginTop,
              marginBottom: (settings as { marginBottom?: number }).marginBottom,
              animation: (settings as { animation?: string }).animation as 'none' | 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | undefined,
              animationDuration: (settings as { animationDuration?: number }).animationDuration,
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
              socialLinks?: Array<{ type: 'facebook' | 'instagram' | 'twitter' | 'whatsapp' | 'telegram'; url: string }>;
              text?: string;
            }}
            settings={settings as {
              layout?: 'simple' | 'split' | 'form-only' | 'info-only';
              maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
              textAlign?: 'right' | 'center' | 'left';
              backgroundColor?: string;
              textColor?: string;
              paddingY?: 'small' | 'medium' | 'large';
              titleColor?: string;
              titleSize?: number;
              titleSizeMobile?: number;
              titleWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
              subtitleSize?: number;
              subtitleSizeMobile?: number;
              buttonTextColor?: string;
              buttonBackgroundColor?: string;
              customClass?: string;
              customId?: string;
              hideOnMobile?: boolean;
              hideOnDesktop?: boolean;
            }}
            sectionId={section.id}
            storeSlug={store.slug}
          />
        );
        break;

      case 'hero_slider':
        sectionElement = (
          <HeroSliderSection
            sectionId={section.id}
            title={section.title}
            subtitle={section.subtitle}
            content={content as { 
              slides?: Array<{ 
                id: string; 
                title?: string;
                subtitle?: string;
                text?: string;
                buttonText?: string;
                buttonLink?: string;
                imageUrl?: string;
                mobileImageUrl?: string;
                videoUrl?: string;
                mobileVideoUrl?: string;
                textAlign?: 'right' | 'center' | 'left';
                verticalAlign?: 'top' | 'center' | 'bottom';
                overlay?: number;
              }>;
            }}
            settings={settings as { 
              minHeight?: number;
              minHeightUnit?: 'px' | 'vh';
              sectionWidth?: 'full' | 'boxed';
              contentWidth?: number;
              autoplay?: boolean;
              autoplayInterval?: number;
              loop?: boolean;
              showDots?: boolean;
              showArrows?: boolean;
              textAlign?: 'right' | 'center' | 'left';
              verticalAlign?: 'top' | 'center' | 'bottom';
              overlay?: number;
              showGradient?: boolean;
              gradientDirection?: 'top' | 'bottom';
              titleColor?: string;
              titleSize?: number;
              titleSizeMobile?: number;
              titleWeight?: string;
              subtitleColor?: string;
              subtitleSize?: number;
              subtitleSizeMobile?: number;
              subtitleWeight?: string;
              buttonStyle?: 'filled' | 'outline' | 'underline';
              buttonTextColor?: string;
              buttonBackgroundColor?: string;
              buttonBorderColor?: string;
              dotsColor?: string;
              dotsActiveColor?: string;
              hideOnMobile?: boolean;
              hideOnDesktop?: boolean;
              customClass?: string;
              customId?: string;
            }}
            basePath={basePath}
          />
        );
        break;

      case 'series_grid':
        // Support both manual items and category-based selection
        const seriesContent = content as { 
          items?: Array<{ 
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
          selectionMode?: 'all' | 'manual';
          categoryIds?: string[];
          categoryImages?: Record<string, string>;
          displayLimit?: number;
        };
        
        // Convert categories to items format if using category-based selection
        let seriesItems = seriesContent.items || [];
        const seriesSelectionMode = seriesContent.selectionMode || 'all';
        const seriesCategoryIds = seriesContent.categoryIds || [];
        const seriesCategoryImages = seriesContent.categoryImages || {};
        const seriesDisplayLimit = seriesContent.displayLimit || 6;
        
        // If we have categories and using category-based selection (all or manual), use categories
        if (categories.length > 0 && (seriesSelectionMode === 'all' || seriesSelectionMode === 'manual')) {
          let categoriesToUse = categories;
          
          // Filter and order by selected IDs if manual mode
          if (seriesSelectionMode === 'manual' && seriesCategoryIds.length > 0) {
            categoriesToUse = seriesCategoryIds
              .map(id => categories.find(c => c.id === id))
              .filter((c): c is typeof categories[0] => c !== undefined);
          } else {
            // Apply display limit for "all" mode
            categoriesToUse = categories.slice(0, seriesDisplayLimit);
          }
          
          // Convert categories to series items format, using custom images if provided
          seriesItems = categoriesToUse.map(cat => ({
            id: cat.id,
            title: cat.name,
            subtitle: '',
            description: '',
            originalImageUrl: cat.imageUrl || '', // Keep original for restoration
            imageUrl: seriesCategoryImages[cat.id] || cat.imageUrl || '',
            link: `/category/${cat.slug}`,
          }));
        }
        
        sectionElement = (
          <SeriesGridSection
            title={section.title}
            subtitle={section.subtitle}
            content={{ items: seriesItems }}
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

      case 'hero_premium':
      case 'content_block':
        // אותו סקשן - מה שריק פשוט לא מוצג
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
              titleColor: (settings as { titleColor?: string }).titleColor,
              titleSize: (settings as { titleSize?: number }).titleSize,
              titleSizeMobile: (settings as { titleSizeMobile?: number }).titleSizeMobile,
              titleWeight: (settings as { titleWeight?: string }).titleWeight as 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | undefined,
              subtitleColor: (settings as { subtitleColor?: string }).subtitleColor,
              subtitleSize: (settings as { subtitleSize?: number }).subtitleSize,
              subtitleSizeMobile: (settings as { subtitleSizeMobile?: number }).subtitleSizeMobile,
              subtitleWeight: (settings as { subtitleWeight?: string }).subtitleWeight as 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | undefined,
              textColor: (settings as { textColor?: string }).textColor,
              textSize: (settings as { textSize?: number }).textSize,
              textSizeMobile: (settings as { textSizeMobile?: number }).textSizeMobile,
              buttonTextColor: (settings as { buttonTextColor?: string }).buttonTextColor,
              buttonBackgroundColor: (settings as { buttonBgColor?: string; buttonBackground?: string }).buttonBgColor || (settings as { buttonBackground?: string }).buttonBackground,
              buttonBorderColor: (settings as { buttonBorderColor?: string }).buttonBorderColor,
              buttonBorderWidth: (settings as { buttonBorderWidth?: number }).buttonBorderWidth,
              buttonBorderRadius: (settings as { buttonBorderRadius?: number }).buttonBorderRadius,
              buttonStyle: (settings as { buttonStyle?: string }).buttonStyle as 'filled' | 'outline' | 'underline' | undefined,
              paddingTop: (settings as { paddingTop?: number }).paddingTop,
              paddingBottom: (settings as { paddingBottom?: number }).paddingBottom,
              paddingLeft: (settings as { paddingLeft?: number }).paddingLeft,
              paddingRight: (settings as { paddingRight?: number }).paddingRight,
              marginTop: (settings as { marginTop?: number }).marginTop,
              marginBottom: (settings as { marginBottom?: number }).marginBottom,
              animation: (settings as { animation?: string }).animation as 'none' | 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | undefined,
              animationDuration: (settings as { animationDuration?: number }).animationDuration,
              zIndex: (settings as { zIndex?: number }).zIndex,
              customClass: (settings as { customClass?: string }).customClass,
              customId: (settings as { customId?: string }).customId,
              hideOnMobile: (settings as { hideOnMobile?: boolean }).hideOnMobile,
              hideOnDesktop: (settings as { hideOnDesktop?: boolean }).hideOnDesktop,
              showScrollArrow: (settings as { showScrollArrow?: boolean }).showScrollArrow,
              backgroundMaxWidth: (settings as { backgroundMaxWidth?: number }).backgroundMaxWidth,
            }}
            basePath={basePath}
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

    // Each section component now has data-section-id built-in
    // No need for wrapper overhead in either mode
    return <div key={section.id}>{sectionElement}</div>;
  };

  return (
    <div className="min-h-screen">
      {/* Scroll to top on page load */}
      <ScrollToTop />
      
      {/* Editor Section Highlighter - ONLY in preview mode */}
      {isPreviewMode && <EditorSectionHighlighter />}
      
      {/* Render all sections from database */}
      {sections.map((section, i) => renderSection(section, i))}

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
}

// Generate static paths for stores
export async function generateStaticParams() {
  return [];
}
