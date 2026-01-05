import Link from 'next/link';
import { CartButton } from './cart-button';
import { UserButton } from './user-button';
import { MobileMenu } from './mobile-menu';
import { SearchButton } from './search-button';

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

// Header layout variants:
// 'logo-right': Logo right, menu center, icons left (RTL default)
// 'logo-left': Logo left, menu center, icons right
// 'logo-center': Logo center, search right + icons left, menu below
export type HeaderLayout = 'logo-right' | 'logo-left' | 'logo-center';

interface ShopHeaderProps {
  storeName: string;
  storeId: string;
  categories: Category[];
  basePath: string;
  customer?: CustomerData | null;
  layout?: HeaderLayout;
}

// Server Component - no 'use client' needed
// CSS-only dropdowns for subcategories (no JS, no hydration cost)
// Mobile menu and search are small client islands for interactivity
export function ShopHeader({ 
  storeName, 
  storeId,
  categories, 
  basePath, 
  customer,
  layout = 'logo-right'
}: ShopHeaderProps) {
  // Organize categories into parent/child structure
  const parentCategories = categories.filter(c => !c.parentId);
  const childrenMap = new Map<string, Category[]>();
  
  categories.forEach(c => {
    if (c.parentId) {
      const existing = childrenMap.get(c.parentId) || [];
      childrenMap.set(c.parentId, [...existing, c]);
    }
  });

  // Navigation component (reused in all layouts)
  const Navigation = ({ className = '' }: { className?: string }) => (
    <nav className={`hidden lg:flex items-center gap-8 xl:gap-12 ${className}`}>
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
  );

  // Logo component
  const Logo = ({ className = '' }: { className?: string }) => (
    <Link href={basePath || '/'} className={`group ${className}`}>
      <span className="font-display text-lg sm:text-2xl tracking-[0.2em] sm:tracking-[0.3em] text-black font-light uppercase">
        {storeName}
      </span>
    </Link>
  );

  // Icons component (search, user, cart)
  const Icons = ({ searchFirst = false }: { searchFirst?: boolean }) => (
    <div className="flex items-center gap-1 sm:gap-2">
      {searchFirst && <SearchButton basePath={basePath} storeId={storeId} />}
      <UserButton basePath={basePath} initialCustomer={customer} />
      <CartButton />
      {!searchFirst && <SearchButton basePath={basePath} storeId={storeId} />}
    </div>
  );

  // Layout 1: Logo Right (RTL default) - לוגו בימין, תפריט במרכז, אייקונים משמאל
  if (layout === 'logo-right') {
    return (
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20" dir="rtl">
            {/* Right: Mobile Menu + Logo */}
            <div className="flex items-center gap-2">
              <MobileMenu categories={categories} basePath={basePath} storeName={storeName} />
              <Logo />
            </div>

            {/* Center: Navigation */}
            <Navigation />

            {/* Left: Icons */}
            <Icons />
          </div>
        </div>
      </header>
    );
  }

  // Layout 2: Logo Left - לוגו בשמאל, תפריט במרכז, אייקונים מימין
  if (layout === 'logo-left') {
    return (
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20" dir="rtl">
            {/* Right: Icons */}
            <Icons />

            {/* Center: Navigation */}
            <Navigation />

            {/* Left: Logo + Mobile Menu */}
            <div className="flex items-center gap-2">
              <Logo />
              <MobileMenu categories={categories} basePath={basePath} storeName={storeName} />
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Layout 3: Logo Center - לוגו במרכז, חיפוש מימין ושאר אייקונים משמאל, תפריט מתחת
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Top row: Search - Logo - Icons */}
        <div className="flex items-center justify-between h-16 sm:h-20" dir="rtl">
          {/* Right: Search */}
          <div className="flex items-center">
            <SearchButton basePath={basePath} storeId={storeId} />
            <MobileMenu categories={categories} basePath={basePath} storeName={storeName} />
          </div>

          {/* Center: Logo */}
          <Logo className="absolute left-1/2 -translate-x-1/2" />

          {/* Left: User & Cart (no search, it's on the right) */}
          <div className="flex items-center gap-1 sm:gap-2">
            <UserButton basePath={basePath} initialCustomer={customer} />
            <CartButton />
          </div>
        </div>

        {/* Bottom row: Navigation (desktop only) */}
        <div className="hidden lg:flex justify-center border-t border-gray-100 py-3">
          <Navigation />
        </div>
      </div>
    </header>
  );
}
