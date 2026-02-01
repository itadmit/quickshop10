'use client';

// ============================================
// Live Preview - Center Panel
// ============================================

interface Section {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string | null;
  image: string | null;
}

interface Store {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface LivePreviewProps {
  sections: Section[];
  categories: Category[];
  products: Product[];
  store: Store;
  slug: string;
  previewMode: 'desktop' | 'mobile' | 'tablet';
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
}

export function LivePreview({
  sections,
  categories,
  products,
  store,
  slug,
  previewMode,
  selectedSectionId,
  onSelectSection,
}: LivePreviewProps) {
  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile': return 'w-[375px]';
      case 'tablet': return 'w-[768px]';
      default: return 'w-full max-w-[1200px]';
    }
  };

  const basePath = `/shops/${slug}`;

  return (
    <div className={`bg-white shadow-2xl rounded-lg overflow-hidden ${getPreviewWidth()}`}>
      {/* Browser Chrome */}
      <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b border-gray-200">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 bg-red-400 rounded-full" />
          <div className="w-3 h-3 bg-yellow-400 rounded-full" />
          <div className="w-3 h-3 bg-green-400 rounded-full" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-white rounded-full px-4 py-1 text-xs text-gray-500 text-center">
            {store.name.toLowerCase().replace(/\s+/g, '')}.quickshop.co.il
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="overflow-auto max-h-[calc(100vh-200px)]">
        {/* Header Preview */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              {previewMode === 'mobile' && (
                <button className="p-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  </svg>
                </button>
              )}
              {previewMode !== 'mobile' && (
                <nav className="flex gap-4 text-xs uppercase tracking-wider">
                  <span className="text-gray-600 hover:text-black cursor-pointer">About</span>
                  <span className="text-gray-600 hover:text-black cursor-pointer">Shop</span>
                </nav>
              )}
            </div>
            <div className="font-display text-lg tracking-[0.3em] uppercase font-light">
              {store.name}
            </div>
            <div className="flex items-center gap-4">
              {previewMode !== 'mobile' && (
                <span className="text-xs text-gray-500">English</span>
              )}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              </svg>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
          </div>
        </header>

        {/* Sections */}
        {sections.filter(s => s.isActive).map((section) => (
          <div
            key={section.id}
            onClick={() => onSelectSection(section.id)}
            className={`relative cursor-pointer transition-all ${
              selectedSectionId === section.id 
                ? 'ring-2 ring-blue-500 ring-inset' 
                : 'hover:ring-2 hover:ring-blue-200 hover:ring-inset'
            }`}
          >
            {/* Selection Indicator */}
            {selectedSectionId === section.id && (
              <div className="absolute top-0 left-0 z-10 px-2 py-1 bg-blue-500 text-white text-[10px] font-medium rounded-br">
                {getSectionLabel(section.type)}
              </div>
            )}

            {/* Section Content */}
            <PreviewSection
              section={section}
              categories={categories}
              products={products}
              basePath={basePath}
              previewMode={previewMode}
            />

            {/* Hover Toolbar */}
            {selectedSectionId === section.id && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-gray-900/90 rounded-full px-2 py-1 shadow-lg">
                <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
                <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M17 17l-5-5m0 0l-5-5m5 5l5-5m-5 5l-5 5" />
                  </svg>
                </button>
                <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Footer Preview */}
        <footer className="bg-white border-t border-gray-100 py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-4 gap-8 mb-12">
              <div>
                <h4 className="font-display text-sm tracking-[0.2em] uppercase mb-4">{store.name}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  אופנה מינימליסטית ואיכותית
                </p>
              </div>
              <div>
                <h5 className="text-[10px] tracking-wider uppercase text-gray-400 mb-3">קטגוריות</h5>
                <ul className="space-y-2 text-xs text-gray-500">
                  {categories.slice(0, 4).map(cat => (
                    <li key={cat.id}>{cat.name}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-[10px] tracking-wider uppercase text-gray-400 mb-3">שירות לקוחות</h5>
                <ul className="space-y-2 text-xs text-gray-500">
                  <li>צור קשר</li>
                  <li>משלוחים</li>
                  <li>החזרות</li>
                </ul>
              </div>
              <div>
                <h5 className="text-[10px] tracking-wider uppercase text-gray-400 mb-3">עקבו אחרינו</h5>
                <ul className="space-y-2 text-xs text-gray-500">
                  <li>Instagram</li>
                  <li>Facebook</li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-gray-100 flex justify-between items-center">
              <p className="text-[10px] text-gray-400">© 2025 {store.name}</p>
              <p className="text-[10px] text-gray-300">נבנה עם QuickShop ⚡</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Preview Section Renderer
function PreviewSection({
  section,
  categories,
  products,
  basePath,
  previewMode,
}: {
  section: Section;
  categories: Category[];
  products: Product[];
  basePath: string;
  previewMode: string;
}) {
  switch (section.type) {
    case 'hero':
      return <HeroPreview section={section} basePath={basePath} />;
    case 'categories':
      return <CategoriesPreview section={section} categories={categories} basePath={basePath} previewMode={previewMode} />;
    case 'products':
      return <ProductsPreview section={section} products={products} basePath={basePath} previewMode={previewMode} />;
    case 'newsletter':
      return <NewsletterPreview section={section} />;
    case 'video_banner':
      return <VideoBannerPreview section={section} basePath={basePath} />;
    case 'split_banner':
      return <SplitBannerPreview section={section} basePath={basePath} />;
    default:
      return (
        <div className="py-20 text-center bg-gray-50">
          <p className="text-gray-400">Unknown section type: {section.type}</p>
        </div>
      );
  }
}

// Hero Preview
function HeroPreview({ section, basePath }: { section: Section; basePath: string }) {
  const content = section.content as { imageUrl?: string; buttonText?: string; buttonLink?: string };
  const settings = section.settings as { height?: string; overlay?: number };
  
  return (
    <div 
      className="relative bg-gray-200 flex items-end justify-center pb-20"
      style={{ height: settings.height || '60vh' }}
    >
      {content.imageUrl && (
        <img 
          src={content.imageUrl} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div 
        className="absolute inset-0 bg-black"
        style={{ opacity: settings.overlay || 0.3 }}
      />
      <div className="relative z-10 text-center text-white">
        {section.title && (
          <h1 className="font-display text-4xl md:text-6xl font-light tracking-[0.2em] uppercase mb-4">
            {section.title}
          </h1>
        )}
        {section.subtitle && (
          <p className="text-xs tracking-[0.3em] uppercase mb-8 text-white/80">
            {section.subtitle}
          </p>
        )}
        {content.buttonText && (
          <button className="px-8 py-3 border border-white text-[11px] tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors">
            {content.buttonText}
          </button>
        )}
      </div>
    </div>
  );
}

// Categories Preview
function CategoriesPreview({ 
  section, 
  categories, 
  basePath,
  previewMode 
}: { 
  section: Section; 
  categories: Category[]; 
  basePath: string;
  previewMode: string;
}) {
  const settings = section.settings as { columns?: number };
  const cols = previewMode === 'mobile' ? 2 : (settings.columns || 4);

  return (
    <div className="py-16 px-6 bg-white">
      {section.title && (
        <h2 className="font-display text-2xl text-center tracking-[0.2em] uppercase mb-12 font-light">
          {section.title}
        </h2>
      )}
      <div 
        className="max-w-6xl mx-auto grid gap-6"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {categories.slice(0, cols).map((category) => (
          <div key={category.id} className="text-center group cursor-pointer">
            <div className="aspect-[3/4] bg-gray-100 mb-4 overflow-hidden">
              {category.imageUrl ? (
                <img 
                  src={category.imageUrl} 
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-gray-100 to-gray-200" />
              )}
            </div>
            <span className="text-xs tracking-[0.2em] uppercase text-gray-700">
              {category.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Products Preview
function ProductsPreview({ 
  section, 
  products, 
  basePath,
  previewMode 
}: { 
  section: Section; 
  products: Product[]; 
  basePath: string;
  previewMode: string;
}) {
  const settings = section.settings as { columns?: number };
  const content = section.content as { limit?: number; displayLimit?: number };
  const cols = previewMode === 'mobile' ? 2 : (settings.columns || 4);
  const limit = content.limit || content.displayLimit || 8;

  return (
    <div className="py-16 px-6 bg-white border-t border-gray-100">
      {section.title && (
        <h2 className="font-display text-2xl text-center tracking-[0.15em] uppercase mb-4 font-light">
          {section.title}
        </h2>
      )}
      {section.subtitle && (
        <p className="text-center text-xs text-gray-400 tracking-[0.2em] uppercase mb-12">
          {section.subtitle}
        </p>
      )}
      <div 
        className="max-w-6xl mx-auto grid gap-6"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {products.slice(0, limit).map((product) => (
          <div key={product.id} className="group cursor-pointer">
            <div className="aspect-square bg-gray-100 mb-4 overflow-hidden">
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-gray-100 to-gray-200" />
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">{product.name}</h3>
            <p className="text-sm text-gray-500">
              ₪{Number(product.price || 0).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Newsletter Preview
function NewsletterPreview({ section }: { section: Section }) {
  const content = section.content as { placeholder?: string; buttonText?: string };

  return (
    <div className="py-20 px-6 bg-gray-50 text-center">
      {section.title && (
        <h2 className="font-display text-2xl tracking-[0.15em] uppercase mb-4 font-light">
          {section.title}
        </h2>
      )}
      {section.subtitle && (
        <p className="text-sm text-gray-500 mb-8">{section.subtitle}</p>
      )}
      <div className="flex max-w-md mx-auto">
        <input 
          type="email" 
          placeholder={content.placeholder || 'כתובת אימייל'}
          className="flex-1 px-6 py-3 border border-gray-200 text-sm bg-white"
          readOnly
        />
        <button className="px-6 py-3 bg-black text-white text-[11px] tracking-[0.15em] uppercase">
          {content.buttonText || 'הרשמה'}
        </button>
      </div>
    </div>
  );
}

// Video Banner Preview
function VideoBannerPreview({ section, basePath }: { section: Section; basePath: string }) {
  const content = section.content as { imageUrl?: string; videoUrl?: string };
  const settings = section.settings as { height?: string; overlay?: number };

  return (
    <div 
      className="relative bg-gray-800 flex items-center justify-center"
      style={{ height: settings.height || '60vh' }}
    >
      {content.imageUrl && (
        <img 
          src={content.imageUrl} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div 
        className="absolute inset-0 bg-black"
        style={{ opacity: settings.overlay || 0.4 }}
      />
      <div className="relative z-10 text-center text-white">
        <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center mx-auto mb-6 cursor-pointer hover:bg-white/10 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        </div>
        {section.title && (
          <h2 className="font-display text-3xl tracking-[0.2em] uppercase font-light">
            {section.title}
          </h2>
        )}
      </div>
    </div>
  );
}

// Split Banner Preview
function SplitBannerPreview({ section, basePath }: { section: Section; basePath: string }) {
  const content = section.content as { items?: { title: string; imageUrl: string }[] };
  const settings = section.settings as { height?: string };
  const items = content.items || [];

  if (items.length === 0) {
    return (
      <div className="grid grid-cols-2" style={{ height: settings.height || '50vh' }}>
        <div className="bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Add left image</span>
        </div>
        <div className="bg-gray-300 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Add right image</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2" style={{ height: settings.height || '50vh' }}>
      {items.slice(0, 2).map((item, i) => (
        <div key={i} className="relative group cursor-pointer overflow-hidden">
          {item.imageUrl && (
            <img 
              src={item.imageUrl} 
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          )}
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-xs tracking-[0.3em] uppercase font-light">
              {item.title}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper
function getSectionLabel(type: string): string {
  const labels: Record<string, string> = {
    hero: 'Slideshow',
    categories: 'Collection list',
    products: 'Featured collection',
    newsletter: 'Newsletter',
    video_banner: 'Video',
    split_banner: 'Image with text',
  };
  return labels[type] || type;
}


