import { ProductCard } from '@/components/product-card';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string | null;
  comparePrice: string | null;
  image: string | null;
  shortDescription?: string | null;
  isFeatured: boolean;
  // Stock fields
  inventory?: number | null;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  // Video card fields
  cardImage?: string | null;
  cardVideoUrl?: string | null;
  // Variant support
  hasVariants?: boolean;
}

// הנחה אוטומטית - תומך במספר הנחות!
interface AutomaticDiscount {
  name: string;           // שם ההנחה הראשונה (תאימות לאחור)
  names?: string[];       // כל שמות ההנחות
  discountedPrice: number;
  discountPercent: number;
  categoryIds?: string[]; // קטגוריות המוצר - לחישוב הנחות בצ'קאאוט
}

// Badge type for display
interface Badge {
  id: string;
  text: string;
  backgroundColor: string;
  textColor: string;
  position: string;
}

interface ProductsSectionProps {
  title: string | null;
  subtitle: string | null;
  products: Product[];
  settings: {
    columns?: number;
    gap?: number;
    showCount?: boolean;
    textAlign?: 'right' | 'center' | 'left';
    showAddToCart?: boolean; // 🆕 הצג כפתור הוספה לסל קבוע
    addToCartStyle?: 'outline' | 'filled'; // סגנון הכפתור
  };
  basePath: string;
  showDecimalPrices?: boolean;
  displayLimit?: number; // For preview mode - hide products beyond limit
  // הנחות אוטומטיות - Map של productId -> discount
  discountsMap?: Map<string, AutomaticDiscount>;
  // מדבקות - Map של productId -> badges
  badgesMap?: Map<string, Badge[]>;
  storeSlug?: string; // 🆕 Required for variants modal
  // ❤️ Wishlist support
  showWishlist?: boolean;
}

export function ProductsSection({ title, subtitle, products, settings, basePath, showDecimalPrices = false, sectionId, displayLimit, discountsMap, badgesMap, storeSlug, showWishlist = false }: ProductsSectionProps & { sectionId?: string }) {
  // Text alignment classes
  const alignClass = settings.textAlign === 'right' ? 'text-right' : settings.textAlign === 'left' ? 'text-left' : 'text-center';
  
  return (
    <section 
      id="products" 
      className="py-20 px-6 bg-white border-t border-gray-100"
      data-section-id={sectionId}
      data-section-type="products"
      data-section-name="מוצרים נבחרים"
      data-display-limit={displayLimit || ''}
    >
      <div className="max-w-7xl mx-auto">
        {/* Always render title element for live editing */}
        <h2 
          className={`font-display text-2xl md:text-3xl ${alignClass} mb-4 font-light tracking-[0.15em] uppercase ${!title ? 'hidden' : ''}`}
          data-section-title
        >
          {title || ''}
        </h2>
        
        {/* Always render subtitle element for live editing */}
        <p 
          className={`${alignClass} text-gray-400 text-xs tracking-[0.2em] uppercase mb-20 ${!subtitle ? 'hidden' : ''}`}
          data-section-subtitle
        >
          {subtitle || ''}
        </p>
        
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 ${settings.showAddToCart ? 'items-stretch' : ''}`} data-products-grid>
          {products.map((product, i) => (
            <div 
              key={product.id} 
              className={`animate-slide-up ${displayLimit && i >= displayLimit ? 'hidden' : ''} ${settings.showAddToCart ? 'h-full' : ''}`}
              style={{ animationDelay: `${i * 50}ms` }}
              data-product-index={i}
              data-product-id={product.id}
            >
              <ProductCard
                id={product.id}
                slug={product.slug}
                name={product.name}
                price={Number(product.price)}
                comparePrice={product.comparePrice ? Number(product.comparePrice) : null}
                image={product.image || '/placeholder.svg'}
                cardImage={product.cardImage}
                cardVideoUrl={product.cardVideoUrl}
                shortDescription={product.shortDescription}
                isFeatured={product.isFeatured}
                basePath={basePath}
                showDecimalPrices={showDecimalPrices}
                inventory={product.inventory}
                trackInventory={product.trackInventory}
                allowBackorder={product.allowBackorder}
                automaticDiscount={discountsMap?.get(product.id) || null}
                hasVariants={product.hasVariants}
                showAddToCart={settings.showAddToCart}
                addToCartStyle={settings.addToCartStyle}
                storeSlug={storeSlug}
                badges={badgesMap?.get(product.id) || []}
                showWishlist={showWishlist}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


