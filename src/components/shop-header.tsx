import Link from 'next/link';
import { CartButton } from './cart-button';
import { UserButton } from './user-button';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CustomerData {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  hasPassword?: boolean;
  emailVerified?: boolean;
}

interface ShopHeaderProps {
  storeName: string;
  categories: Category[];
  basePath: string;
  customer?: CustomerData | null;
}

// Server Component - no 'use client' needed
export function ShopHeader({ storeName, categories, basePath, customer }: ShopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20" dir="rtl">
          {/* Logo */}
          <Link href={basePath} className="group">
            <span className="font-display text-2xl tracking-[0.3em] text-black font-light uppercase">
              {storeName}
            </span>
          </Link>

          {/* Navigation - Server rendered from DB */}
          <nav className="hidden lg:flex items-center gap-12">
            <Link 
              href={basePath} 
              className="text-[11px] tracking-[0.2em] uppercase text-gray-600 hover:text-black transition-colors duration-300"
            >
              בית
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`${basePath}/category/${category.slug}`}
                className="text-[11px] tracking-[0.2em] uppercase text-gray-600 hover:text-black transition-colors duration-300"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          {/* Actions - User & Cart */}
          <div className="flex items-center gap-2">
            {/* User Button - Customer data from server */}
            <UserButton basePath={basePath} initialCustomer={customer} />
            
            {/* Cart - Client island */}
            <CartButton />
          </div>
        </div>
      </div>
    </header>
  );
}

