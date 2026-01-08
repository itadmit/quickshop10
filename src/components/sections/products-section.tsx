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
}

// הנחה אוטומטית
interface AutomaticDiscount {
  name: string;
  discountedPrice: number;
  discountPercent: number;
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
  };
  basePath: string;
  showDecimalPrices?: boolean;
  displayLimit?: number; // For preview mode - hide products beyond limit
  // הנחות אוטומטיות - Map של productId -> discount
  discountsMap?: Map<string, AutomaticDiscount>;
}

export function ProductsSection({ title, subtitle, products, settings, basePath, showDecimalPrices = false, sectionId, displayLimit, discountsMap }: ProductsSectionProps & { sectionId?: string }) {
  // Text alignment classes
  const alignClass = settings.textAlign === 'right' ? 'text-right' : settings.textAlign === 'left' ? 'text-left' : 'text-center';
  
  return (
    <section 
      id="products" 
      className="py-20 px-6 bg-white border-t border-gray-100"
      data-section-id={sectionId}
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
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8" data-products-grid>
          {products.map((product, i) => (
            <div 
              key={product.id} 
              className={`animate-slide-up ${displayLimit && i >= displayLimit ? 'hidden' : ''}`}
              style={{ animationDelay: `${i * 50}ms` }}
              data-product-index={i}
            >
              <ProductCard
                id={product.id}
                slug={product.slug}
                name={product.name}
                price={Number(product.price)}
                comparePrice={product.comparePrice ? Number(product.comparePrice) : null}
                image={product.image || '/placeholder.svg'}
                shortDescription={product.shortDescription}
                isFeatured={product.isFeatured}
                basePath={basePath}
                showDecimalPrices={showDecimalPrices}
                inventory={product.inventory}
                trackInventory={product.trackInventory}
                allowBackorder={product.allowBackorder}
                automaticDiscount={discountsMap?.get(product.id) || null}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


