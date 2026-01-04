import { getStoreBySlug, getProductBySlug, getProductsByStore, getProductOptions, getProductVariants, getCategoriesByStore } from '@/lib/db/queries';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { VariantSelector } from '@/components/variant-selector';
import { ProductCard } from '@/components/product-card';
import { ProductImage } from '@/components/product-image';
import { StoreFooter } from '@/components/store-footer';
import { TrackViewProduct } from '@/components/tracking-events';
import { ScrollToTop } from '@/components/scroll-to-top';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

// ISR - Revalidate every 60 seconds  
export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ slug: string; productSlug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, productSlug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Decode URL-encoded slug (for Hebrew/Unicode support)
  const decodedSlug = decodeURIComponent(productSlug);
  const product = await getProductBySlug(store.id, decodedSlug);

  if (!product) {
    notFound();
  }

  const headersList = await headers();
  const basePath = headersList.get('x-custom-domain') ? '' : `/shops/${slug}`;

  // Get variants, related products and categories in parallel - maximum speed!
  const [options, variants, allProducts, categories] = await Promise.all([
    product.hasVariants ? getProductOptions(product.id) : Promise.resolve([]),
    product.hasVariants ? getProductVariants(product.id) : Promise.resolve([]),
    getProductsByStore(store.id, 5),
    getCategoriesByStore(store.id),
  ]);

  // Get related products
  const relatedProducts = allProducts.filter(p => p.id !== product.id).slice(0, 4);

  const mainImage = product.images.find(img => img.isPrimary)?.url || product.images[0]?.url;
  const hasDiscount = product.comparePrice && Number(product.comparePrice) > Number(product.price);
  const discount = hasDiscount ? Math.round((1 - Number(product.price) / Number(product.comparePrice!)) * 100) : null;

  // Track product view
  const trackingProduct = {
    id: product.id,
    name: product.name,
    price: Number(product.price),
    compareAtPrice: product.comparePrice ? Number(product.comparePrice) : null,
    image: mainImage,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Scroll to top on page load */}
      <ScrollToTop />
      
      {/* Track ViewContent event */}
      <TrackViewProduct product={trackingProduct} />
      
      {/* Breadcrumb */}
      <nav className="py-6 px-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li><Link href={basePath || '/'} className="hover:text-black transition-colors">בית</Link></li>
            <li>/</li>
            <li><Link href={`${basePath}#products`} className="hover:text-black transition-colors">מוצרים</Link></li>
            <li>/</li>
            <li className="text-black truncate">{product.name}</li>
          </ol>
        </div>
      </nav>

      {/* Product Section */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-[3/4] bg-gray-50 overflow-hidden">
                <ProductImage 
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              
              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {product.images.map((img, i) => (
                    <div key={img.id} className="aspect-square bg-gray-50 overflow-hidden cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
                      <ProductImage 
                        src={img.url}
                        alt={`${product.name} ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              {/* Badges */}
              <div className="flex gap-3 mb-6">
                {hasDiscount && (
                  <span className="text-[10px] tracking-[0.15em] uppercase bg-black text-white px-3 py-1.5">
                    -{discount}%
                  </span>
                )}
                {product.isFeatured && (
                  <span className="text-[10px] tracking-[0.15em] uppercase border border-black px-3 py-1.5">
                    מומלץ
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-display text-3xl md:text-4xl font-light tracking-[0.05em] mb-4">
                {product.name}
              </h1>

              {/* Short Description */}
              {product.shortDescription && (
                <p className="text-gray-500 mb-6">
                  {product.shortDescription}
                </p>
              )}

              {/* Variants or Simple Add to Cart */}
              {product.hasVariants && options.length > 0 ? (
                <VariantSelector
                  productId={product.id}
                  productName={product.name}
                  productImage={mainImage || '/placeholder.svg'}
                  options={options}
                  variants={variants}
                  basePrice={Number(product.price)}
                  baseComparePrice={product.comparePrice ? Number(product.comparePrice) : null}
                />
              ) : (
                <>
                  {/* Price */}
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-2xl font-display">₪{Number(product.price).toFixed(0)}</span>
                    {hasDiscount && (
                      <span className="text-lg text-gray-400 line-through">₪{Number(product.comparePrice).toFixed(0)}</span>
                    )}
                  </div>

                  {/* Add to Cart */}
                  <AddToCartButton 
                    productId={product.id}
                    name={product.name}
                    price={Number(product.price)}
                    image={mainImage || '/placeholder.svg'}
                    className="w-full mb-4"
                  />

                  {/* Stock Status */}
                  <p className="text-sm text-gray-500 text-center mb-8">
                    {product.inventory && product.inventory > 0 
                      ? `${product.inventory} יחידות במלאי` 
                      : 'במלאי'
                    }
                  </p>
                </>
              )}

              {/* Divider */}
              <hr className="border-gray-100 my-8" />

              {/* Description */}
              {product.description && (
                <div className="mb-8">
                  <h3 className="text-[11px] tracking-[0.2em] uppercase text-black mb-4">תיאור</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                  משלוח חינם מעל ₪200
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  14 יום להחזרה
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  אחריות יצרן
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl text-center mb-4 font-light tracking-widest">
              אולי יעניין אותך
            </h2>
            <p className="text-center text-gray-500 text-sm tracking-wide mb-12">
              מוצרים נוספים שאהבו לקוחות
            </p>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
              {relatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug}
                  name={product.name}
                  price={Number(product.price)}
                  comparePrice={product.comparePrice ? Number(product.comparePrice) : null}
                  image={product.image || '/placeholder.svg'}
                  basePath={basePath}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <StoreFooter 
        storeName={store.name} 
        categories={categories} 
        basePath={basePath} 
      />
    </div>
  );
}

