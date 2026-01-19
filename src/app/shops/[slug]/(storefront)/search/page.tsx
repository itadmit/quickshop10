import { headers, cookies } from 'next/headers';
import { getStoreBySlug, getProductsBadgesForCards } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq, and, ilike, or } from 'drizzle-orm';
import { ProductCard } from '@/components/product-card';
import { getProductsAutomaticDiscounts } from '@/app/actions/automatic-discount';
import { trackSearchQuery } from '@/lib/actions/reports';
import { TrackSearch } from '@/components/tracking-events';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface SearchPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}

// Server Component - fast search with no client JS
export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { slug } = await params;
  const { q } = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }
  
  const headersList = await headers();
  const basePath = headersList.get('x-custom-domain') ? '' : `/shops/${slug}`;
  
  const query = q?.trim() || '';
  
  // Search products by name, description, or SKU (using relations for images)
  let searchResults: Array<{
    id: string;
    name: string;
    slug: string;
    price: string | null;
    comparePrice: string | null;
    hasVariants?: boolean;
    images: Array<{ url: string; isPrimary: boolean }>;
    // Stock fields for out-of-stock display
    inventory: number | null;
    trackInventory: boolean;
    allowBackorder: boolean;
  }> = [];
  
  if (query && query.length >= 2) {
    const searchPattern = `%${query}%`;
    
    // Use query API with relations for images
    const productsData = await db.query.products.findMany({
      where: and(
        eq(products.storeId, store.id),
        eq(products.isActive, true),
        or(
          ilike(products.name, searchPattern),
          ilike(products.description, searchPattern),
          ilike(products.sku, searchPattern)
        )
      ),
      with: {
        images: {
          orderBy: (images, { asc }) => [asc(images.sortOrder)],
          limit: 1,
        },
      },
      limit: 50,
    });
    
    searchResults = productsData.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      comparePrice: p.comparePrice,
      hasVariants: p.hasVariants,
      images: p.images,
      // Include stock fields for out-of-stock display
      inventory: p.inventory,
      trackInventory: p.trackInventory ?? true,
      allowBackorder: p.allowBackorder ?? false,
    }));
  }
  
  // For products with variants, get variant prices
  const variantProducts = searchResults.filter(p => p.hasVariants);
  if (variantProducts.length > 0) {
    const { productVariants } = await import('@/lib/db/schema');
    const { inArray, min } = await import('drizzle-orm');
    
    const variantPrices = await db
      .select({
        productId: productVariants.productId,
        minPrice: min(productVariants.price),
      })
      .from(productVariants)
      .where(inArray(productVariants.productId, variantProducts.map(p => p.id)))
      .groupBy(productVariants.productId);
    
    const variantPriceMap = new Map(variantPrices.map(v => [v.productId, v.minPrice]));
    
    searchResults = searchResults.map(p => ({
      ...p,
      price: p.hasVariants ? (variantPriceMap.get(p.id) || p.price) : p.price,
    }));
  }

  // שליפת הנחות אוטומטיות ומדבקות לתוצאות (batch - מהיר!) ⚡
  const [discountsMap, badgesMap] = await Promise.all([
    searchResults.length > 0 
      ? getProductsAutomaticDiscounts(
          store.id,
          searchResults.map(p => ({ id: p.id, price: p.price }))
        )
      : new Map(),
    searchResults.length > 0
      ? getProductsBadgesForCards(store.id, searchResults.map(p => p.id))
      : new Map(),
  ]);

  // Track search query for analytics (fire-and-forget, non-blocking) ⚡
  if (query && query.length >= 2) {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value || `anon_${Date.now()}`;
    
    // Fire and forget - don't await, don't block render
    trackSearchQuery({
      storeId: store.id,
      sessionId,
      query,
      resultsCount: searchResults.length,
    }).catch(() => {}); // Silent fail
  }
  
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Track Search event for pixels */}
      {query && query.length >= 2 && (
        <TrackSearch query={query} resultsCount={searchResults.length} />
      )}
      
      {/* Header - Centered */}
      <div className="border-b border-gray-100 py-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-display text-3xl font-light tracking-wide mb-6">חיפוש</h1>
          
          {/* Search Form - Centered */}
          <form method="get" className="w-full">
            <div className="flex gap-2">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="חפש מוצרים..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:border-black focus:outline-none transition-colors text-right"
                autoFocus
              />
              <button
                type="submit"
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                חפש
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Results */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {query ? (
          <>
            <p className="text-gray-600 mb-8 text-center">
              {searchResults.length > 0 
                ? `נמצאו ${searchResults.length} תוצאות עבור "${query}"`
                : `לא נמצאו תוצאות עבור "${query}"`
              }
            </p>
            
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {searchResults.map((product) => {
                  const primaryImage = product.images[0]?.url || '';
                  return (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      slug={product.slug}
                      price={product.price ? Number(product.price) : 0}
                      comparePrice={product.comparePrice ? Number(product.comparePrice) : undefined}
                      image={primaryImage}
                      basePath={basePath}
                      automaticDiscount={discountsMap.get(product.id) || null}
                      inventory={product.inventory}
                      trackInventory={product.trackInventory}
                      allowBackorder={product.allowBackorder}
                      badges={badgesMap.get(product.id) || []}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-4">נסה לחפש מונח אחר</p>
                <Link 
                  href={basePath || '/'}
                  className="text-black underline hover:no-underline"
                >
                  חזרה לעמוד הבית
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500">הקלד מונח חיפוש כדי למצוא מוצרים</p>
          </div>
        )}
      </div>
    </div>
  );
}
