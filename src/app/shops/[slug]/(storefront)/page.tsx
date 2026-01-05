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
import Link from 'next/link';
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
  const renderSection = (section: typeof sections[0], index: number) => {
    const content = section.content as Record<string, unknown>;
    const settings = section.settings as Record<string, unknown>;

    switch (section.type) {
      case 'hero':
        return (
          <HeroSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            content={content as { imageUrl?: string; buttonText?: string; buttonLink?: string }}
            settings={settings as { height?: string; overlay?: number }}
            basePath={basePath}
          />
        );

      case 'categories':
        return (
          <CategoriesSection
            key={section.id}
            categories={categories}
            settings={settings as { columns?: number; gap?: number }}
            basePath={basePath}
          />
        );

      case 'products':
        const productContent = content as { type?: string; limit?: number };
        const productsToShow = productContent.type === 'featured' ? featuredProducts : allProducts;
        return (
          <ProductsSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            products={productsToShow}
            settings={settings as { columns?: number; gap?: number; showCount?: boolean }}
            basePath={basePath}
            showDecimalPrices={showDecimalPrices}
          />
        );

      case 'video_banner':
        return (
          <VideoBannerSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            content={content as { videoUrl?: string; imageUrl?: string; buttonText?: string; buttonLink?: string }}
            settings={settings as { height?: string; overlay?: number }}
            basePath={basePath}
          />
        );

      case 'split_banner':
        return (
          <SplitBannerSection
            key={section.id}
            content={content as { items?: { title: string; imageUrl: string; link: string }[] }}
            settings={settings as { height?: string }}
            basePath={basePath}
          />
        );

      case 'newsletter':
        return (
          <NewsletterSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            content={content as { placeholder?: string; buttonText?: string }}
            settings={settings as { maxWidth?: string }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
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
