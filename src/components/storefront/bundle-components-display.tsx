import { db } from '@/lib/db';
import { productBundles, bundleComponents, products, productVariants, productImages } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import Image from 'next/image';
import Link from 'next/link';

interface BundleComponentsDisplayProps {
  productId: string;
  storeSlug: string;
}

export async function BundleComponentsDisplay({ productId, storeSlug }: BundleComponentsDisplayProps) {
  // Get bundle settings
  const bundle = await db.query.productBundles.findFirst({
    where: eq(productBundles.productId, productId),
  });

  if (!bundle || !bundle.showComponentsOnPage) {
    return null;
  }

  // Get components
  const componentsData = await db
    .select({
      component: bundleComponents,
      product: {
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
      },
      variant: {
        id: productVariants.id,
        title: productVariants.title,
        price: productVariants.price,
      },
    })
    .from(bundleComponents)
    .innerJoin(products, eq(bundleComponents.productId, products.id))
    .leftJoin(productVariants, eq(bundleComponents.variantId, productVariants.id))
    .where(eq(bundleComponents.bundleId, bundle.id))
    .orderBy(bundleComponents.sortOrder);

  if (componentsData.length === 0) {
    return null;
  }

  // Get primary images for component products
  const productIds = componentsData.map(c => c.product.id);
  const images = await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
    })
    .from(productImages)
    .where(and(
      inArray(productImages.productId, productIds),
      eq(productImages.isPrimary, true)
    ));

  const imageMap = new Map(images.map(img => [img.productId, img.url]));

  // Calculate total components price
  const componentsTotal = componentsData.reduce((total, c) => {
    const price = c.variant?.price 
      ? parseFloat(c.variant.price)
      : c.product.price 
        ? parseFloat(c.product.price)
        : 0;
    return total + (price * c.component.quantity);
  }, 0);

  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h3 className="font-semibold text-gray-900">הערכה כוללת:</h3>
      </div>
      
      <div className="space-y-3">
        {componentsData.map(({ component, product, variant }) => {
          const imageUrl = imageMap.get(product.id);
          const price = variant?.price ? parseFloat(variant.price) : product.price ? parseFloat(product.price) : 0;
          
          return (
            <div key={component.id} className="flex items-center gap-3">
              <div className="relative w-12 h-12 flex-shrink-0">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {component.quantity > 1 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {component.quantity}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <Link 
                  href={`/shops/${storeSlug}/product/${product.slug}`}
                  className="text-sm font-medium text-gray-900 hover:text-purple-600 transition-colors line-clamp-1"
                >
                  {product.name}
                </Link>
                {variant && (
                  <p className="text-xs text-gray-500">{variant.title}</p>
                )}
              </div>
              
              <div className="text-left text-sm">
                {component.quantity > 1 && (
                  <span className="text-gray-400 text-xs">{component.quantity}× </span>
                )}
                <span className="text-gray-600">₪{price.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-3 border-t border-purple-200 flex items-center justify-between">
        <span className="text-sm text-gray-600">ערך אם נרכש בנפרד:</span>
        <span className="text-sm line-through text-gray-400">₪{componentsTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}

