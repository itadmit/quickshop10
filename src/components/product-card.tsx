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
}: ProductCardProps) {
  const hasDiscount = comparePrice && comparePrice > price;
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
            {hasDiscount && !outOfStock && (
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
                price={price}
                image={image}
                inventory={inventory}
                trackInventory={trackInventory}
                allowBackorder={allowBackorder}
                className="w-full"
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
          <span className={`text-sm ${outOfStock ? 'text-gray-400' : 'text-black'}`}>{format(price)}</span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">{format(comparePrice)}</span>
          )}
        </div>
      </div>
    </article>
  );
}
