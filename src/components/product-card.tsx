import Link from 'next/link';
import { AddToCartButton } from './add-to-cart-button';

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
}

export function ProductCard({ 
  id, 
  slug, 
  name, 
  price, 
  comparePrice, 
  image, 
  isFeatured,
  basePath = '' // Default to root for backwards compatibility
}: ProductCardProps) {
  const hasDiscount = comparePrice && comparePrice > price;
  const productUrl = basePath ? `${basePath}/product/${slug}` : `/product/${slug}`;

  return (
    <article className="group animate-slide-up" dir="rtl">
      {/* Image */}
      <Link href={productUrl} className="block img-zoom mb-4">
        <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden">
          <img 
            src={image} 
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Badges - Minimal */}
          {hasDiscount && (
            <span className="absolute top-4 right-4 text-[10px] tracking-[0.15em] uppercase bg-white/90 px-3 py-1.5 text-black">
              מבצע
            </span>
          )}
          
          {/* Quick Add - Shows on Hover */}
          <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <AddToCartButton 
              productId={id}
              name={name}
              price={price}
              image={image}
              className="w-full"
            />
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="text-center">
        <Link href={productUrl}>
          <h3 className="text-sm font-medium text-black mb-2 group-hover:underline underline-offset-4 transition-all">
            {name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm text-black">₪{price.toFixed(0)}</span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">₪{comparePrice.toFixed(0)}</span>
          )}
        </div>
      </div>
    </article>
  );
}
