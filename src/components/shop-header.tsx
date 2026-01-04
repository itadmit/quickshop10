import Link from 'next/link';
import { CartButton } from './cart-button';
import { UserButton } from './user-button';
import { MobileMenu } from './mobile-menu';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
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
// CSS-only dropdowns for subcategories (no JS, no hydration cost)
// Mobile menu is a small client island for interactivity
export function ShopHeader({ storeName, categories, basePath, customer }: ShopHeaderProps) {
  // Organize categories into parent/child structure
  const parentCategories = categories.filter(c => !c.parentId);
  const childrenMap = new Map<string, Category[]>();
  
  categories.forEach(c => {
    if (c.parentId) {
      const existing = childrenMap.get(c.parentId) || [];
      childrenMap.set(c.parentId, [...existing, c]);
    }
  });

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 sm:h-20" dir="rtl">
          {/* Mobile Menu Button + Logo */}
          <div className="flex items-center gap-2">
            {/* Mobile Menu - Client island, only visible on mobile */}
            <MobileMenu 
              categories={categories} 
              basePath={basePath} 
              storeName={storeName} 
            />
            
            {/* Logo */}
            <Link href={basePath || '/'} className="group">
              <span className="font-display text-lg sm:text-2xl tracking-[0.2em] sm:tracking-[0.3em] text-black font-light uppercase">
                {storeName}
              </span>
            </Link>
          </div>

          {/* Navigation - Server rendered from DB, hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-12">
            <Link 
              href={basePath || '/'} 
              className="text-[11px] tracking-[0.2em] uppercase text-gray-600 hover:text-black transition-colors duration-300"
            >
              בית
            </Link>
            {parentCategories.map((category) => {
              const children = childrenMap.get(category.id) || [];
              const hasChildren = children.length > 0;
              
              return (
                <div key={category.id} className="relative group">
                  <Link
                    href={`${basePath}/category/${category.slug}`}
                    className="text-[11px] tracking-[0.2em] uppercase text-gray-600 hover:text-black transition-colors duration-300 flex items-center gap-1"
                  >
                    {category.name}
                    {hasChildren && (
                      <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </Link>
                  
                  {/* Dropdown for subcategories - CSS only */}
                  {hasChildren && (
                    <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="bg-white border border-gray-100 shadow-lg min-w-[180px]">
                        {children.map((child) => (
                          <Link
                            key={child.id}
                            href={`${basePath}/category/${child.slug}`}
                            className="block px-5 py-3 text-[11px] tracking-[0.15em] uppercase text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Actions - User & Cart */}
          <div className="flex items-center gap-1 sm:gap-2">
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
