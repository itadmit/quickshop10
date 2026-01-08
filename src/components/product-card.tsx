import Link from 'next/link';
import { AddToCartButton } from './add-to-cart-button';
import { ProductImage } from './product-image';
import { formatPrice } from '@/lib/format-price';
import { isOutOfStock } from '@/lib/inventory';

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  price: number;
  comparePrice?: number | null;
  image: string;
  shortDescription?: string | null;
  isFeatured?: boolean;
  basePath?: string; // For multi-tenant: /shops/slug
  showDecimalPrices?: boolean;
  // Stock props
  inventory?: number | null;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  // הנחה אוטומטית (מחושב בשרת)
  automaticDiscount?: {
    name: string;
    discountedPrice: number;
    discountPercent: number;
  } | null;
}

export function ProductCard({ 
  id, 
  slug, 
  name, 
  price, 
  comparePrice, 
  image, 
  isFeatured,
  basePath = '', // Default to root for backwards compatibility
  showDecimalPrices = false,
  inventory,
  trackInventory = true,
  allowBackorder = false,
  automaticDiscount,
}: ProductCardProps) {
  // הנחה אוטומטית גוברת על comparePrice
  const hasAutoDiscount = !!automaticDiscount;
  const hasCompareDiscount = !hasAutoDiscount && comparePrice && comparePrice > price;
  const hasDiscount = hasAutoDiscount || hasCompareDiscount;
  
  // מחיר סופי
  const finalPrice = hasAutoDiscount ? automaticDiscount.discountedPrice : price;
  const originalPrice = hasAutoDiscount ? price : (hasCompareDiscount ? comparePrice : null);
  
  const productUrl = basePath ? `${basePath}/product/${slug}` : `/product/${slug}`;
  const format = (p: number) => formatPrice(p, { showDecimal: showDecimalPrices });
  const outOfStock = isOutOfStock(trackInventory, inventory, allowBackorder);

  return (
    <article className="group animate-slide-up" dir="rtl">
      {/* Image */}
      <Link href={productUrl} className="block img-zoom mb-4">
        <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden">
          <ProductImage 
            src={image} 
            alt={name}
            className={`w-full h-full object-cover ${outOfStock ? 'opacity-60' : ''}`}
            loading="lazy"
          />
          
          {/* Badges */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {outOfStock && (
              <span className="text-[10px] tracking-[0.15em] uppercase bg-gray-800 px-3 py-1.5 text-white">
                אזל
              </span>
            )}
            {hasAutoDiscount && !outOfStock && (
              <span className="text-[10px] tracking-[0.15em] bg-green-600 px-3 py-1.5 text-white">
                {automaticDiscount.discountPercent}%-
              </span>
            )}
            {hasCompareDiscount && !outOfStock && (
              <span className="text-[10px] tracking-[0.15em] uppercase bg-white/90 px-3 py-1.5 text-black">
                מבצע
              </span>
            )}
          </div>
          
          {/* Quick Add - Shows on Hover (only if in stock) */}
          {!outOfStock && (
            <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <AddToCartButton 
                productId={id}
                name={name}
                price={finalPrice}
                image={image}
                inventory={inventory}
                trackInventory={trackInventory}
                allowBackorder={allowBackorder}
                className="w-full"
                automaticDiscountName={automaticDiscount?.name}
              />
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="text-center">
        <Link href={productUrl}>
          <h3 className={`text-sm font-medium mb-2 group-hover:underline underline-offset-4 transition-all ${outOfStock ? 'text-gray-400' : 'text-black'}`}>
            {name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm ${outOfStock ? 'text-gray-400' : hasAutoDiscount ? 'text-green-600 font-medium' : 'text-black'}`}>
            {format(finalPrice)}
          </span>
          {originalPrice && (
            <span className="text-sm text-gray-400 line-through">{format(originalPrice)}</span>
          )}
        </div>
      </div>
    </article>
  );
}
