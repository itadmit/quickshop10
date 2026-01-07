import Link from 'next/link';
import Image from 'next/image';
import { MobileMenu } from './mobile-menu';
import { CartButton } from './cart-button';
import { UserButton } from './user-button';
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

// Menu item interface for custom navigation
export interface MenuItem {
  id: string;
  title: string;
  linkType: 'url' | 'page' | 'category' | 'product';
  resolvedUrl?: string;
  children?: MenuItem[];
}

// Header layout variants:
// 'logo-right': Logo right, menu center, icons left (RTL default)
// 'logo-left': Logo left, menu center, icons right
// 'logo-center': Logo center, search right + icons left, menu below
export type HeaderLayout = 'logo-right' | 'logo-left' | 'logo-center';

interface ShopHeaderProps {
  storeName: string;
  storeId: string;
  logoUrl?: string | null;
  categories: Category[];
  menuItems?: MenuItem[];
  navigationMode?: 'menu' | 'categories';
  basePath: string;
  customer?: CustomerData | null;
  layout?: HeaderLayout;
  // Visibility settings from DB
  showSearch?: boolean;
  showCart?: boolean;
  showAccount?: boolean;
  isSticky?: boolean;
}

// Server Component - no 'use client' needed
// CSS-only dropdowns for subcategories (no JS, no hydration cost)
// Mobile menu and search are small client islands for interactivity
export function ShopHeader({ 
  storeName, 
  storeId,
  logoUrl,
  categories, 
  menuItems = [],
  navigationMode = 'menu',
  basePath, 
  customer,
  layout = 'logo-right',
  showSearch = true,
  showCart = true,
  showAccount = true,
  isSticky = true,
}: ShopHeaderProps) {
  // Organize categories into parent/child structure (for categories mode)
  const parentCategories = categories.filter(c => !c.parentId);
  const childrenMap = new Map<string, Category[]>();
  
  categories.forEach(c => {
    if (c.parentId) {
      const existing = childrenMap.get(c.parentId) || [];
      childrenMap.set(c.parentId, [...existing, c]);
    }
  });

  // Determine if we should show categories or custom menu
  // Use categories mode if: explicitly set to 'categories' OR no menu items available
  const showCategories = navigationMode === 'categories' || menuItems.length === 0;

  // Categories Navigation component (original behavior)
  const CategoriesNavigation = ({ className = '' }: { className?: string }) => (
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

  // Menu Navigation component (custom menus from Navigation settings)
  const MenuNavigation = ({ className = '' }: { className?: string }) => (
    <nav className={`hidden lg:flex items-center gap-8 xl:gap-12 ${className}`}>
      {menuItems.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const href = item.resolvedUrl?.startsWith('/') ? `${basePath}${item.resolvedUrl}` : item.resolvedUrl || '#';
        
        return (
          <div key={item.id} className="relative group">
            <Link
              href={href}
              className="text-[11px] tracking-[0.2em] uppercase text-gray-600 hover:text-black transition-colors duration-300 flex items-center gap-1"
            >
              {item.title}
              {hasChildren && (
                <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </Link>
            
            {/* Dropdown for child items - CSS only */}
            {hasChildren && (
              <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="bg-white border border-gray-100 shadow-lg min-w-[180px]">
                  {item.children!.map((child) => {
                    const childHref = child.resolvedUrl?.startsWith('/') ? `${basePath}${child.resolvedUrl}` : child.resolvedUrl || '#';
                    return (
                      <Link
                        key={child.id}
                        href={childHref}
                        className="block px-5 py-3 text-[11px] tracking-[0.15em] uppercase text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
                      >
                        {child.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  // Navigation component - uses either categories or custom menu based on settings
  const Navigation = ({ className = '' }: { className?: string }) => 
    showCategories 
      ? <CategoriesNavigation className={className} /> 
      : <MenuNavigation className={className} />;

  // Logo component - shows image if logoUrl is provided, otherwise text
  const Logo = ({ className = '' }: { className?: string }) => (
    <Link href={basePath || '/'} className={`group ${className}`}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={storeName}
          width={150}
          height={50}
          className="h-8 sm:h-10 w-auto object-contain"
          priority
        />
      ) : (
        <span className="font-display text-lg sm:text-2xl tracking-[0.2em] sm:tracking-[0.3em] text-black font-light uppercase">
          {storeName}
        </span>
      )}
    </Link>
  );

  // Icons component - renders client components directly (no wrapper overhead)
  // Per REQUIREMENTS.md: "use client" only for cart button, search form, etc.
  // In RTL: first in JSX = rightmost visually, last in JSX = leftmost visually
  // cartAtEnd (default): cart is LAST in JSX = leftmost (for logo-right where icons are on left)
  // cartAtStart: cart is FIRST in JSX = rightmost (for logo-left where icons are on right)
  const Icons = ({ cartAtStart = false }: { cartAtStart?: boolean }) => (
    <div className="flex items-center gap-1 sm:gap-2">
      {cartAtStart && showCart && <CartButton />}
      {showSearch && <SearchButton basePath={basePath} storeId={storeId} />}
      {showAccount && <UserButton basePath={basePath} initialCustomer={customer} />}
      {!cartAtStart && showCart && <CartButton />}
    </div>
  );
  
  // Header wrapper class based on sticky setting
  const headerClass = `${isSticky ? 'sticky top-0' : 'relative'} z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100`;

  // Layout 1: Logo Right (RTL default) - לוגו בימין, תפריט במרכז, אייקונים משמאל
  if (layout === 'logo-right') {
    return (
      <header className={headerClass}>
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20" dir="rtl">
            {/* Right: Mobile Menu + Logo */}
            <div className="flex items-center gap-2">
              <MobileMenu 
                categories={categories} 
                menuItems={menuItems}
                navigationMode={navigationMode}
                basePath={basePath} 
                storeName={storeName} 
                logoUrl={logoUrl} 
              />
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
  // Mobile: hamburger at extreme left, logo next to it, cart at extreme right
  if (layout === 'logo-left') {
    return (
      <header className={headerClass}>
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20" dir="rtl">
            {/* Right (in RTL = visual right): Icons with cart at extreme right */}
            <Icons cartAtStart />

            {/* Center: Navigation */}
            <Navigation />

            {/* Left (in RTL = visual left): Mobile Menu at extreme + Logo */}
            <div className="flex items-center gap-2">
              <Logo />
              <MobileMenu 
                categories={categories} 
                menuItems={menuItems}
                navigationMode={navigationMode}
                basePath={basePath} 
                storeName={storeName} 
                logoUrl={logoUrl} 
              />
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Layout 3: Logo Center - לוגו במרכז, תפריט מתחת
  // Mobile: hamburger on right, logo center, cart at extreme left
  return (
    <header className={headerClass}>
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Top row: Hamburger/Search - Logo - Icons */}
        <div className="flex items-center justify-between h-16 sm:h-20" dir="rtl">
          {/* Right: Mobile Menu + Search (desktop) */}
          <div className="flex items-center gap-1 sm:gap-2">
            <MobileMenu 
              categories={categories} 
              menuItems={menuItems}
              navigationMode={navigationMode}
              basePath={basePath} 
              storeName={storeName} 
              logoUrl={logoUrl} 
            />
            {showSearch && <span className="hidden lg:block"><SearchButton basePath={basePath} storeId={storeId} /></span>}
          </div>

          {/* Center: Logo */}
          <Logo className="absolute left-1/2 -translate-x-1/2" />

          {/* Left: User, Search (mobile), Cart at extreme left */}
          <div className="flex items-center gap-1 sm:gap-2">
            {showSearch && <span className="lg:hidden"><SearchButton basePath={basePath} storeId={storeId} /></span>}
            {showAccount && <UserButton basePath={basePath} initialCustomer={customer} />}
            {showCart && <CartButton />}
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
