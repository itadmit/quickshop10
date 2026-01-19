import Link from 'next/link';
import { AddToCartButton } from './add-to-cart-button';
import { ProductCardAddToCart } from './product-card-add-to-cart';
import { ProductImage } from './product-image';
import { ProductBadges } from './storefront/product-badges';
import { formatPrice } from '@/lib/format-price';
import { isOutOfStock } from '@/lib/inventory';
import { getVideoThumbnailUrl, isVideoUrl } from '@/lib/cloudinary';

// Badge type for display
interface Badge {
  id: string;
  text: string;
  backgroundColor: string;
  textColor: string;
  position: string;
}

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  price: number;
  comparePrice?: number | null;
  image: string;
  /** Video thumbnail to display instead of image (when displayAsCard is enabled) */
  cardImage?: string | null;
  /** Video URL for autoplay (when displayAsCard is enabled) */
  cardVideoUrl?: string | null;
  shortDescription?: string | null;
  isFeatured?: boolean;
  basePath?: string; // For multi-tenant: /shops/slug
  showDecimalPrices?: boolean;
  // Stock props
  inventory?: number | null;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  // הנחה אוטומטית (מחושב בשרת) - תומך במספר הנחות!
  automaticDiscount?: {
    name: string;           // שם ההנחה הראשונה (תאימות לאחור)
    names?: string[];       // כל שמות ההנחות
    discountedPrice: number;
    discountPercent: number;
    categoryIds?: string[]; // קטגוריות המוצר - לחישוב הנחות בצ'קאאוט
  } | null;
  // 🆕 Quick Add support
  hasVariants?: boolean;
  showAddToCart?: boolean; // כפתור קבוע (לא רק hover)
  addToCartStyle?: 'outline' | 'filled'; // סגנון הכפתור
  storeSlug?: string; // Required for variants modal
  // 🏷️ Product badges
  badges?: Badge[];
}

export function ProductCard({ 
  id, 
  slug, 
  name, 
  price, 
  comparePrice, 
  image, 
  cardImage,
  cardVideoUrl,
  isFeatured,
  basePath = '', // Default to root for backwards compatibility
  showDecimalPrices = false,
  inventory,
  trackInventory = true,
  allowBackorder = false,
  automaticDiscount,
  hasVariants = false,
  showAddToCart = false,
  addToCartStyle = 'outline',
  storeSlug,
  badges = [],
}: ProductCardProps) {
  // Use video thumbnail (cardImage) if available, otherwise use regular image
  // If cardImage is a video URL, generate a thumbnail from it
  const displayImage = cardImage 
    ? (isVideoUrl(cardImage) ? getVideoThumbnailUrl(cardImage) : cardImage)
    : image;
  // Track if we're showing video content (has video URL for autoplay)
  const isVideoCard = !!cardVideoUrl;
  // הנחה אוטומטית גוברת על comparePrice
  // 🔑 בודקים שיש הנחה בפועל (discountPercent > 0)
  const hasAutoDiscount = !!automaticDiscount && automaticDiscount.discountPercent > 0;
  const hasCompareDiscount = !hasAutoDiscount && comparePrice && comparePrice > price;
  const hasDiscount = hasAutoDiscount || hasCompareDiscount;
  
  // מחיר סופי
  const finalPrice = hasAutoDiscount ? automaticDiscount.discountedPrice : price;
  const originalPrice = hasAutoDiscount ? price : (hasCompareDiscount ? comparePrice : null);
  
  const productUrl = basePath ? `${basePath}/product/${slug}` : `/product/${slug}`;
  const format = (p: number) => formatPrice(p, { showDecimal: showDecimalPrices });
  const outOfStock = isOutOfStock(trackInventory, inventory, allowBackorder);

  return (
    <article className={`group animate-slide-up ${showAddToCart ? 'h-full flex flex-col' : ''}`} dir="rtl">
      {/* Image or Video */}
      <Link href={productUrl} className="block img-zoom mb-4 flex-shrink-0">
        <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden">
          {isVideoCard ? (
            // Autoplay muted video for video cards
            <video
              src={cardVideoUrl}
              poster={displayImage}
              autoPlay
              muted
              loop
              playsInline
              className={`w-full h-full object-cover ${outOfStock ? 'opacity-60' : ''}`}
            />
          ) : (
            <ProductImage 
              src={displayImage} 
              alt={name}
              className={`w-full h-full object-cover ${outOfStock ? 'opacity-60' : ''}`}
              loading="lazy"
            />
          )}
          
          {/* Video badge when showing video */}
          {isVideoCard && (
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 rounded text-white text-[10px] font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            </div>
          )}
          
          {/* System Badges (out of stock, discount) */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            {outOfStock && (
              <span className="text-[10px] tracking-[0.15em] uppercase bg-gray-800 px-3 py-1.5 text-white">
                אזל
              </span>
            )}
            {hasAutoDiscount && !outOfStock && (
              <span className="text-[10px] tracking-[0.15em] bg-green-500 px-3 py-1.5 text-white">
                {automaticDiscount.discountPercent}%-
              </span>
            )}
            {hasCompareDiscount && !outOfStock && (
              <span className="text-[10px] tracking-[0.15em] uppercase bg-white/90 px-3 py-1.5 text-black">
                מבצע
              </span>
            )}
          </div>
          
          {/* Custom Product Badges */}
          <ProductBadges badges={badges} />
          
          {/* Quick Add Button - Hover only (when showAddToCart is OFF) */}
          {/* ⚠️ IMPORTANT: Always pass ORIGINAL price! Discount is calculated at checkout */}
          {!showAddToCart && !outOfStock && hasVariants && storeSlug && (
            // Product with variants - needs modal for selection (hover mode)
            <ProductCardAddToCart
              productId={id}
              name={name}
              price={price}
              image={image}
              inventory={inventory}
              trackInventory={trackInventory}
              allowBackorder={allowBackorder}
              hasVariants={true}
              storeSlug={storeSlug}
              showAlways={false}
              automaticDiscountName={automaticDiscount?.names?.join(' + ') || automaticDiscount?.name}
              categoryIds={automaticDiscount?.categoryIds}
            />
          )}
          {!showAddToCart && !outOfStock && !hasVariants && (
            // Simple product - hover only
            <div className="absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
              <AddToCartButton 
                productId={id}
                name={name}
                price={price}
                image={image}
                inventory={inventory}
                trackInventory={trackInventory}
                allowBackorder={allowBackorder}
                className="w-full"
                automaticDiscountName={automaticDiscount?.names?.join(' + ') || automaticDiscount?.name}
                categoryIds={automaticDiscount?.categoryIds}
              />
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className={`text-center ${showAddToCart ? 'flex-1 flex flex-col' : ''}`}>
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
        
        {/* Add to Cart Button - BELOW the card (when showAddToCart is ON) */}
        {showAddToCart && !outOfStock && (
          <div className="mt-auto pt-3">
            {hasVariants && storeSlug ? (
              <ProductCardAddToCart
                productId={id}
                name={name}
                price={price}
                image={image}
                inventory={inventory}
                trackInventory={trackInventory}
                allowBackorder={allowBackorder}
                hasVariants={true}
                storeSlug={storeSlug}
                showAlways={true}
                automaticDiscountName={automaticDiscount?.names?.join(' + ') || automaticDiscount?.name}
                categoryIds={automaticDiscount?.categoryIds}
                positionBelow={true}
                buttonStyle={addToCartStyle}
              />
            ) : (
              <AddToCartButton 
                productId={id}
                name={name}
                price={price}
                image={image}
                inventory={inventory}
                trackInventory={trackInventory}
                allowBackorder={allowBackorder}
                className="w-full"
                variant={addToCartStyle === 'filled' ? 'primary' : 'outline'}
                automaticDiscountName={automaticDiscount?.names?.join(' + ') || automaticDiscount?.name}
                categoryIds={automaticDiscount?.categoryIds}
              />
            )}
          </div>
        )}
      </div>
    </article>
  );
}
