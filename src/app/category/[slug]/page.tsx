import { getDemoStore, getCategoryBySlug, getProductsByCategory, getCategoriesByStore } from '@/lib/db/queries';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// ISR - Revalidate every 60 seconds
export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const store = await getDemoStore();
  
  if (!store) {
    notFound();
  }

  const [category, categories] = await Promise.all([
    getCategoryBySlug(store.id, slug),
    getCategoriesByStore(store.id),
  ]);

  if (!category) {
    notFound();
  }

  const products = await getProductsByCategory(store.id, category.id);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center">
          <nav className="mb-8">
            <ol className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <li><Link href="/" className="hover:text-black transition-colors">בית</Link></li>
              <li>/</li>
              <li className="text-black">{category.name}</li>
            </ol>
          </nav>
          <h1 className="font-serif text-4xl md:text-6xl font-light tracking-[0.1em] mb-4">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-gray-500 max-w-2xl mx-auto">
              {category.description}
            </p>
          )}
        </div>
      </section>

      {/* Categories Filter */}
      <section className="py-8 px-6 border-b border-gray-100 sticky top-16 bg-white/95 backdrop-blur-sm z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            <Link 
              href="/#products"
              className="text-[11px] tracking-[0.2em] uppercase text-gray-400 hover:text-black transition-colors"
            >
              הכל
            </Link>
            {categories.map((cat) => (
              <Link 
                key={cat.id}
                href={`/category/${cat.slug}`}
                className={`text-[11px] tracking-[0.2em] uppercase transition-colors ${
                  cat.slug === slug 
                    ? 'text-black border-b border-black' 
                    : 'text-gray-400 hover:text-black'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-500 text-sm tracking-wide mb-12">
            {products.length} מוצרים
          </p>
          
          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400">אין מוצרים בקטגוריה זו</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
              {products.map((product, i) => (
                <div key={product.id} style={{ animationDelay: `${i * 50}ms` }}>
                  <ProductCard
                    id={product.id}
                    slug={product.slug}
                    name={product.name}
                    price={Number(product.price)}
                    comparePrice={product.comparePrice ? Number(product.comparePrice) : null}
                    image={product.image || '/placeholder.svg'}
                    shortDescription={product.shortDescription}
                    isFeatured={product.isFeatured}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Generate static paths for categories
export async function generateStaticParams() {
  const store = await getDemoStore();
  if (!store) return [];
  
  const categories = await getCategoriesByStore(store.id);
  return categories.map((cat) => ({ slug: cat.slug }));
}


