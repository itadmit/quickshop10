import { getStoreBySlug, getProductsByStore, getCategoriesByStore, getFooterMenuItems } from '@/lib/db/queries';
import { ProductCard } from '@/components/product-card';
import { StoreFooter } from '@/components/store-footer';
import { EditorSectionHighlighter } from '@/components/storefront/editor-section-highlighter';
import { getProductsAutomaticDiscounts } from '@/app/actions/automatic-discount';
import { isOutOfStock } from '@/lib/inventory';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

// ISR - Revalidate every 60 seconds for performance ⚡
export const revalidate = 60;

interface ProductsPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * All Products Page
 * 
 * Shows all products from the store in a grid layout.
 * Server Component for maximum performance (per REQUIREMENTS.md).
 * Can be linked from navigation menu using URL type with "/products".
 */
export default async function ProductsPage({ params }: ProductsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Fetch all products, categories and footer menu in parallel ⚡
  const [rawProducts, categories, footerMenuItems] = await Promise.all([
    getProductsByStore(store.id),
    getCategoriesByStore(store.id),
    getFooterMenuItems(store.id),
  ]);

  // Apply out-of-stock display settings from store settings
  const storeSettings = (store.settings as Record<string, unknown>) || {};
  const hideOutOfStock = Boolean(storeSettings.hideOutOfStock);
  const moveOutOfStockToBottom = storeSettings.moveOutOfStockToBottom !== false; // Default true
  
  // Helper to check if product is out of stock
  const checkOutOfStock = (p: typeof rawProducts[0]) => 
    isOutOfStock(p.trackInventory, p.inventory, p.allowBackorder);
  
  // Filter and sort products based on settings
  let products = rawProducts;
  
  if (hideOutOfStock) {
    products = rawProducts.filter(p => !checkOutOfStock(p));
  } else if (moveOutOfStockToBottom) {
    const inStock = rawProducts.filter(p => !checkOutOfStock(p));
    const outOfStock = rawProducts.filter(p => checkOutOfStock(p));
    products = [...inStock, ...outOfStock];
  }

  // חישוב הנחות אוטומטיות לכל המוצרים (batch - שליפה אחת!) ⚡
  const discountsMap = await getProductsAutomaticDiscounts(
    store.id,
    products.map(p => ({ 
      id: p.id, 
      price: p.price, 
      categoryIds: [] // No specific category
    }))
  );

  // Check for custom domain
  const headersList = await headers();
  const isCustomDomain = !!headersList.get('x-custom-domain');
  const basePath = isCustomDomain ? '' : `/shops/${slug}`;
  
  // Get price display settings
  const showDecimalPrices = Boolean(storeSettings.showDecimalPrices);
  
  // Get page title from store settings or use default
  const allProductsTitle = (storeSettings.allProductsTitle as string) || 'כל המוצרים';
  const allProductsDescription = (storeSettings.allProductsDescription as string) || '';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="relative h-[40vh] min-h-[300px] bg-gray-100 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-b from-gray-50 to-gray-200" />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-white font-extralight tracking-[0.3em] uppercase">
              {allProductsTitle}
            </h1>
            {allProductsDescription && (
              <p className="text-white/80 mt-4 text-sm tracking-wide max-w-md mx-auto">
                {allProductsDescription}
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
            <li className="text-black">{allProductsTitle}</li>
          </ol>
        </div>
      </nav>

      {/* Category Filters (optional - show top-level categories) */}
      {categories.filter(c => !c.parentId).length > 0 && (
        <section className="py-8 px-6 border-b border-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`${basePath}/products`}
                className="px-4 py-2 text-sm border border-black bg-black text-white rounded-full transition-colors"
              >
                הכל
              </Link>
              {categories.filter(c => !c.parentId).slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  href={`${basePath}/category/${cat.slug}`}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-600 hover:border-black hover:text-black rounded-full transition-colors"
                >
                  {cat.name}
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
                אין מוצרים להצגה
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
                    cardImage={product.cardImage}
                    cardVideoUrl={product.cardVideoUrl}
                    isFeatured={product.isFeatured}
                    basePath={basePath}
                    showDecimalPrices={showDecimalPrices}
                    inventory={product.inventory}
                    trackInventory={product.trackInventory}
                    allowBackorder={product.allowBackorder}
                    automaticDiscount={discountsMap.get(product.id) || null}
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
        storeSlug={slug}
        categories={categories} 
        basePath={basePath}
        settings={store.settings as Record<string, unknown>}
        footerMenuItems={footerMenuItems}
      />
      
      {/* Editor Section Highlighter (only in preview mode) */}
      <EditorSectionHighlighter />
    </div>
  );
}

