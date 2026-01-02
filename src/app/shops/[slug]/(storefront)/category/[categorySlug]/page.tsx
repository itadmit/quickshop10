import { getStoreBySlug, getCategoryBySlug, getProductsByCategory } from '@/lib/db/queries';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// ISR - Revalidate every 60 seconds
export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ slug: string; categorySlug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug, categorySlug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const category = await getCategoryBySlug(store.id, categorySlug);
  
  if (!category) {
    notFound();
  }

  const products = await getProductsByCategory(store.id, category.id);
  const basePath = `/shops/${slug}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="relative h-[50vh] min-h-[400px] bg-gray-100 overflow-hidden">
        {category.imageUrl ? (
          <img 
            src={category.imageUrl}
            alt={category.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-gray-50 to-gray-200" />
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-white font-extralight tracking-[0.3em] uppercase">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-white/80 mt-4 text-sm tracking-wide max-w-md mx-auto">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav className="py-6 px-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li><Link href={basePath} className="hover:text-black transition-colors">בית</Link></li>
            <li>/</li>
            <li className="text-black">{category.name}</li>
          </ol>
        </div>
      </nav>

      {/* Products Grid */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <p className="text-gray-400 text-sm tracking-wide">
              {products.length} פריטים
            </p>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400">אין מוצרים בקטגוריה זו</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {products.map((product, i) => (
                <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <ProductCard
                    id={product.id}
                    slug={product.slug}
                    name={product.name}
                    price={Number(product.price)}
                    comparePrice={product.comparePrice ? Number(product.comparePrice) : null}
                    image={product.image || '/placeholder.jpg'}
                    isFeatured={product.isFeatured}
                    basePath={basePath}
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

