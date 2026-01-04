import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

interface CategoriesSectionProps {
  categories: Category[];
  settings: {
    columns?: number;
    gap?: number;
  };
  basePath: string;
}

export function CategoriesSection({ categories, settings, basePath }: CategoriesSectionProps) {
  const columns = settings.columns || 4;

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className={`grid grid-cols-2 md:grid-cols-${columns} gap-8`}>
          {categories.map((category, i) => (
            <Link 
              key={category.id}
              href={`${basePath}/category/${category.slug}`}
              className="group text-center animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
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


