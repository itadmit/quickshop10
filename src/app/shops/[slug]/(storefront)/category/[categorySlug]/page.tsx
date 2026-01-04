import { getStoreBySlug, getCategoryBySlug, getProductsByCategory, getSubcategories, getCategoryById, getCategoriesByStore } from '@/lib/db/queries';
import { ProductCard } from '@/components/product-card';
import { StoreFooter } from '@/components/store-footer';
import { TrackViewCategory } from '@/components/tracking-events';
import Link from 'next/link';
import { headers } from 'next/headers';
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

  // Decode URL-encoded slug (for Hebrew/Unicode support)
  const decodedCategorySlug = decodeURIComponent(categorySlug);
  const category = await getCategoryBySlug(store.id, decodedCategorySlug);
  
  if (!category) {
    notFound();
  }

  // Fetch products, subcategories, parent category and all categories in parallel
  const [products, subcategories, parentCategory, allCategories] = await Promise.all([
    getProductsByCategory(store.id, category.id),
    getSubcategories(store.id, category.id),
    category.parentId ? getCategoryById(category.parentId) : null,
    getCategoriesByStore(store.id),
  ]);

  // Check for custom domain
  const headersList = await headers();
  const isCustomDomain = !!headersList.get('x-custom-domain');
  const basePath = isCustomDomain ? '' : `/shops/${slug}`;
  
  const hasSubcategories = subcategories.length > 0;
  const isSubcategory = !!category.parentId;

  return (
    <div className="min-h-screen bg-white">
      {/* Track ViewCategory event */}
      <TrackViewCategory 
        categoryId={category.id} 
        categoryName={category.name} 
        productsCount={products.length}
      />
      
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
            {isSubcategory && parentCategory && (
              <p className="text-white/70 text-sm tracking-widest uppercase mb-2">
                {parentCategory.name}
              </p>
            )}
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
            <li><Link href={basePath || '/'} className="hover:text-black transition-colors">בית</Link></li>
            <li>/</li>
            {isSubcategory && parentCategory && (
              <>
                <li>
                  <Link href={`${basePath}/category/${parentCategory.slug}`} className="hover:text-black transition-colors">
                    {parentCategory.name}
                  </Link>
                </li>
                <li>/</li>
              </>
            )}
            <li className="text-black">{category.name}</li>
          </ol>
        </div>
      </nav>

      {/* Subcategories Grid (if parent category) */}
      {hasSubcategories && (
        <section className="py-12 px-6 border-b border-gray-100">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-center text-sm tracking-[0.3em] uppercase text-gray-500 mb-8">
              קטגוריות משנה
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`${basePath}/category/${sub.slug}`}
                  className="group relative aspect-[4/3] bg-gray-100 overflow-hidden"
                >
                  {sub.imageUrl ? (
                    <img
                      src={sub.imageUrl}
                      alt={sub.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-gray-100 to-gray-200" />
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <span className="text-white text-sm tracking-[0.2em] uppercase font-light">
                      {sub.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
              <p className="text-gray-400">
                {hasSubcategories ? 'עיינו בתתי-הקטגוריות למציאת מוצרים' : 'אין מוצרים בקטגוריה זו'}
              </p>
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
                    image={product.image || '/placeholder.svg'}
                    isFeatured={product.isFeatured}
                    basePath={basePath}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <StoreFooter 
        storeName={store.name} 
        categories={allCategories} 
        basePath={basePath} 
      />
    </div>
  );
}
