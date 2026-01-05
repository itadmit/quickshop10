import { getStoreBySlug, getFeaturedProducts, getProductsByStore, getCategoriesByStore, getPageSectionsCached } from '@/lib/db/queries';
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
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

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

  // If no sections exist, show "Coming Soon" page
  if (sections.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Coming Soon Hero */}
        <section className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1a1a1a_0%,#000_100%)]" />
          
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <p className="text-white/40 text-[10px] tracking-[0.5em] uppercase mb-8 animate-fade-in">
              {store.name}
            </p>
            
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-extralight tracking-[0.2em] mb-8 animate-slide-up uppercase">
              Coming Soon
            </h1>
            
            <div className="w-16 h-px bg-white/20 mx-auto mb-8" />
            
            <p className="text-white/50 text-sm tracking-wide leading-relaxed mb-12 animate-slide-up" style={{ animationDelay: '200ms' }}>
              אנחנו עובדים על משהו מיוחד.
              <br />
              השאירו את האימייל שלכם ונעדכן אתכם כשנפתח.
            </p>

            {/* Newsletter signup */}
            <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-3 animate-slide-up" style={{ animationDelay: '400ms' }}>
              <input 
                type="email" 
                placeholder="כתובת אימייל"
                className="flex-1 px-6 py-4 bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-white/30 transition-colors"
              />
              <button className="px-8 py-4 bg-white text-black text-[11px] tracking-[0.15em] uppercase hover:bg-white/90 transition-colors cursor-pointer">
                עדכנו אותי
              </button>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
            <div className="flex gap-6">
              <a href="#" className="text-white/30 hover:text-white/60 transition-colors text-xs tracking-wide">Instagram</a>
              <a href="#" className="text-white/30 hover:text-white/60 transition-colors text-xs tracking-wide">Facebook</a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 px-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <p className="text-[10px] text-white/20 tracking-wide">
              © 2025 {store.name}
            </p>
            <p className="text-[10px] text-white/20 tracking-wide">
              נבנה עם QuickShop ⚡
            </p>
          </div>
        </footer>
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
