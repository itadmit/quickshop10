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

interface ProductsSectionProps {
  title: string | null;
  subtitle: string | null;
  products: Product[];
  settings: {
    columns?: number;
    gap?: number;
    showCount?: boolean;
  };
  basePath: string;
  showDecimalPrices?: boolean;
}

export function ProductsSection({ title, subtitle, products, settings, basePath, showDecimalPrices = false }: ProductsSectionProps) {
  return (
    <section id="products" className="py-20 px-6 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        {title && (
          <h2 className="font-display text-2xl md:text-3xl text-center mb-4 font-light tracking-[0.15em] uppercase">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-center text-gray-400 text-xs tracking-[0.2em] uppercase mb-20">
            {subtitle}
          </p>
        )}
        {settings.showCount && !subtitle && (
          <p className="text-center text-gray-400 text-xs tracking-[0.2em] uppercase mb-20">
            {products.length} פריטים
          </p>
        )}
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {products.map((product, i) => (
            <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
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
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


