import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

interface CategoriesSectionProps {
  title?: string | null;
  subtitle?: string | null;
  categories: Category[];
  settings: {
    columns?: number;
    gap?: number;
    textAlign?: 'right' | 'center' | 'left';
  };
  basePath: string;
  selectedCategoryIds?: string[]; // For preview mode filtering
}

export function CategoriesSection({ title, subtitle, categories, settings, basePath, sectionId, selectedCategoryIds }: CategoriesSectionProps & { sectionId?: string }) {
  const columns = settings.columns || 4;
  // Text alignment
  const alignClass = settings.textAlign === 'right' ? 'text-right' : settings.textAlign === 'left' ? 'text-left' : 'text-center';
  // Spacing: if subtitle exists, title gets mb-4, subtitle gets mb-20
  // If only title exists, title gets mb-20
  const titleMargin = title ? (subtitle ? 'mb-4' : 'mb-20') : 'hidden';

  // Determine if category should be hidden (preview mode only)
  const shouldHideCategory = (categoryId: string) => {
    if (!selectedCategoryIds || selectedCategoryIds.length === 0) return false;
    return !selectedCategoryIds.includes(categoryId);
  };

  return (
    <section 
      className="py-20 px-6 bg-white"
      data-section-id={sectionId}
      data-section-name="רשימת קטגוריות"
      data-selected-categories={selectedCategoryIds?.join(',') || ''}
    >
      <div className="max-w-7xl mx-auto">
        {/* Title & Subtitle - always rendered for live editor updates */}
        <h2 
          className={`font-display text-2xl md:text-3xl ${alignClass} font-light tracking-[0.15em] uppercase ${titleMargin}`}
          data-section-title
        >
          {title || ''}
        </h2>
        <p 
          className={`${alignClass} text-gray-400 text-xs tracking-[0.2em] uppercase ${subtitle ? 'mb-20' : 'hidden'}`}
          data-section-subtitle
        >
          {subtitle || ''}
        </p>
        
        <div className={`grid grid-cols-2 md:grid-cols-${columns} gap-8`} data-categories-grid>
          {categories.map((category, i) => (
            <Link 
              key={category.id}
              href={`${basePath}/category/${category.slug}`}
              className={`group text-center animate-slide-up ${shouldHideCategory(category.id) ? 'hidden' : ''}`}
              style={{ animationDelay: `${i * 100}ms` }}
              data-category-id={category.id}
            >
              <div className="aspect-[3/4] bg-gray-100 mb-6 overflow-hidden">
                {category.imageUrl ? (
                  <img 
                    src={category.imageUrl} 
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-gray-50 to-gray-200 group-hover:scale-105 transition-transform duration-700" />
                )}
              </div>
              <span className="text-xs tracking-[0.25em] uppercase text-gray-800 group-hover:text-black transition-colors">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


