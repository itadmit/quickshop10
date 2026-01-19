import { getStoreBySlug, getFeaturedProducts, getProductsByStore, getCategoriesByStore, getPageSectionsCached, getPageSections, getProductsByCategory, getProductsByIds, getFooterMenuItems, getProductsBadgesForCards } from '@/lib/db/queries';
import { 
  HeroSection, 
  CategoriesSection, 
  ProductsSection, 
  VideoBannerSection, 
  SplitBannerSection, 
  NewsletterSection,
  // New sections - all Server Components!
  ReviewsSection,
  ImageTextSection,
  FeaturesSection,
  BannerSmallSection,
  GallerySection,
  TextBlockSection,
  LogosSection,
  FAQSection,
  HeroSliderSection,
  SeriesGridSection,
  QuoteBannerSection,
  HeroPremiumSection,
  FeaturedItemsSection,
} from '@/components/sections';
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
  if (sections.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8" dir="rtl">
        <div className="text-center max-w-md">
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
      </div>
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
        sectionElement = (
          <HeroSection
            title={section.title}
            subtitle={section.subtitle}
            content={content as { imageUrl?: string; buttonText?: string; buttonLink?: string }}
            settings={settings as { height?: string; overlay?: number }}
            basePath={basePath}
            sectionId={section.id}
          />
        );
        break;

      case 'categories':
        // Filter categories if specific ones are selected
        const categoryIds = content.categoryIds as string[] | undefined;
        // In preview mode: show all categories (filtering done via CSS)
        // In production: only show selected categories
        const categoriesToShow = isPreviewMode 
          ? categories 
          : (categoryIds && categoryIds.length > 0 ? categories.filter(cat => categoryIds.includes(cat.id)) : categories);
        
        sectionElement = (
          <CategoriesSection
            title={section.title}
            subtitle={section.subtitle}
            categories={categoriesToShow}
            settings={settings as { columns?: number; gap?: number; textAlign?: 'right' | 'center' | 'left' }}
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
        sectionElement = (
          <TextBlockSection
            title={section.title}
            subtitle={section.subtitle}
            content={content as { text?: string; buttonText?: string; buttonLink?: string }}
            settings={settings as { maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'; textAlign?: 'right' | 'center' | 'left'; backgroundColor?: string; textColor?: string; paddingY?: 'small' | 'medium' | 'large' }}
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

      case 'hero_premium':
        sectionElement = (
          <HeroPremiumSection
            title={section.title}
            subtitle={section.subtitle}
            content={content as { 
              imageUrl?: string;
              mobileImageUrl?: string;
              videoUrl?: string;
              mobileVideoUrl?: string;
              eyebrow?: string;
              headline?: string;
              headlineAccent?: string;
              description?: string;
              primaryButtonText?: string;
              primaryButtonLink?: string;
              primaryButtonStyle?: 'filled' | 'outline';
              secondaryButtonText?: string;
              secondaryButtonLink?: string;
              secondaryButtonStyle?: 'filled' | 'outline';
            }}
            settings={settings as { 
              height?: string;
              mobileHeight?: string;
              gradientDirection?: 'left' | 'right' | 'center';
              accentColor?: string;
              overlayOpacity?: number;
              videoAutoplay?: boolean;
              videoMuted?: boolean;
              videoLoop?: boolean;
              videoControls?: boolean;
            }}
            basePath={basePath}
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
