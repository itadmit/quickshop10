import Link from 'next/link';
import { CartButton } from './cart-button';
import { getDemoStoreCached, getCategoriesCached } from '@/lib/db/queries';

// Header is a Server Component but uses cached data
// This prevents DB calls on every navigation!
export async function Header() {
  const store = await getDemoStoreCached();
  const categories = store ? await getCategoriesCached(store.id) : [];
  const storeName = store?.name || 'NOIR';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20" dir="rtl">
          {/* Logo */}
          <Link href="/" className="group">
            <span className="font-display text-2xl tracking-[0.3em] text-black font-light uppercase">
              {storeName}
            </span>
          </Link>

          {/* Navigation - Dynamic from DB (cached) */}
          <nav className="hidden lg:flex items-center gap-12">
            <Link href="/" className="text-[11px] tracking-[0.2em] uppercase text-gray-600 hover:text-black transition-colors duration-300">
              בית
            </Link>
            {categories.map((category) => (
              <Link 
                key={category.id}
                href={`/category/${category.slug}`} 
                className="text-[11px] tracking-[0.2em] uppercase text-gray-600 hover:text-black transition-colors duration-300"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          {/* Cart */}
          <CartButton />
        </div>
      </div>
    </header>
  );
}
