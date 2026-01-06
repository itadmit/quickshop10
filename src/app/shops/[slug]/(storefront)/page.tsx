import { getStoreBySlug, getFeaturedProducts, getProductsByStore, getCategoriesByStore, getPageSectionsCached, getPageSections } from '@/lib/db/queries';
import { 
  HeroSection, 
  CategoriesSection, 
  ProductsSection, 
  VideoBannerSection, 
  SplitBannerSection, 
  NewsletterSection 
} from '@/components/sections';
import { StoreFooter } from '@/components/store-footer';
import { EditorSectionHighlighter } from '@/components/storefront/editor-section-highlighter';
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

  // Parallel data fetching - maximum speed!
  const [sections, categories, featuredProducts, allProducts] = await Promise.all([
    getPageSectionsCached(store.id, 'home'),
    getCategoriesByStore(store.id),
    getFeaturedProducts(store.id, 4),
    getProductsByStore(store.id, 12),
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
        const productContent = content as { type?: string; limit?: number };
        const allProductsToShow = productContent.type === 'featured' ? featuredProducts : allProducts;
        const productLimit = productContent.limit || 8;
        // In preview mode: show all products (limiting done via CSS for live preview)
        // In production: slice to limit
        const productsToShow = isPreviewMode 
          ? allProductsToShow 
          : allProductsToShow.slice(0, productLimit);
        
        sectionElement = (
          <ProductsSection
            title={section.title}
            subtitle={section.subtitle}
            products={productsToShow}
            settings={settings as { columns?: number; gap?: number; showCount?: boolean; textAlign?: 'right' | 'center' | 'left' }}
            basePath={basePath}
            showDecimalPrices={showDecimalPrices}
            sectionId={section.id}
            displayLimit={isPreviewMode ? productLimit : undefined}
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
            settings={settings as { maxWidth?: string }}
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
      />
    </div>
  );
}

// Generate static paths for stores
export async function generateStaticParams() {
  return [];
}
