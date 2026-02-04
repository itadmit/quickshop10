'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { MobileMenu } from '@/components/mobile-menu';
import { CartButton } from '@/components/cart-button';
import { UserButton } from '@/components/user-button';
import { SearchButton } from '@/components/search-button';
import { WishlistHeaderButton } from '@/components/wishlist-header-button';
import { LanguageSwitcher } from './language-switcher';
import { usePreviewSettings } from './preview-settings-provider';
import { MegaMenuDropdown } from '@/components/mega-menu-dropdown';
import type { SupportedLocale } from '@/lib/translations/types';

/**
 * Shop Header Client Component
 * 
 * Fully reactive header that responds to live preview settings from editor.
 * Used when in preview mode (iframe from editor).
 * 
 * PERFORMANCE:
 * - Only loaded inside preview iframe
 * - Server component used in production
 */

// Announcement Bar Component - supports rotating messages with slide animation and countdown timer
function AnnouncementBar({ 
  enabled, 
  text, 
  link, 
  bgColor, 
  textColor,
  onClose,
  countdownEnabled,
  countdownDate,
  countdownTime,
}: {
  enabled: boolean;
  text: string;
  link?: string;
  bgColor: string;
  textColor: string;
  onClose?: () => void;
  countdownEnabled?: boolean;
  countdownDate?: string; // YYYY-MM-DD
  countdownTime?: string; // HH:mm
}) {
  // Support multiple messages (each line = separate message)
  const messages = text.split('\n').filter(line => line.trim());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Countdown state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  
  // Calculate target date from countdown settings
  const targetDate = countdownEnabled && countdownDate 
    ? new Date(`${countdownDate}T${countdownTime || '00:00'}:00`)
    : null;
  
  // Countdown timer effect
  useEffect(() => {
    if (!countdownEnabled || !targetDate || isNaN(targetDate.getTime())) {
      setTimeLeft(null);
      return;
    }
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds });
    };
    
    // Calculate immediately
    calculateTimeLeft();
    
    // Update every second
    const interval = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(interval);
  }, [countdownEnabled, countdownDate, countdownTime, targetDate]);
  
  // Rotate messages every 4 seconds with animation
  useEffect(() => {
    if (messages.length <= 1) return;
    
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % messages.length);
        setIsAnimating(false);
      }, 300); // Half of animation duration
    }, 4000);
    
    return () => clearInterval(interval);
  }, [messages.length]);
  
  if (!enabled || messages.length === 0) return null;
  
  const currentMessage = messages[currentIndex];
  
  // Format countdown display
  const CountdownTimer = timeLeft ? (
    <div className="flex items-center gap-1 text-xs font-mono mr-3 opacity-90" dir="ltr">
      {timeLeft.days > 0 && (
        <>
          <span className="bg-white/20 px-1.5 py-0.5 rounded">{String(timeLeft.days).padStart(2, '0')}</span>
          <span className="opacity-60">:</span>
        </>
      )}
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{String(timeLeft.hours).padStart(2, '0')}</span>
      <span className="opacity-60">:</span>
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{String(timeLeft.minutes).padStart(2, '0')}</span>
      <span className="opacity-60">:</span>
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{String(timeLeft.seconds).padStart(2, '0')}</span>
    </div>
  ) : null;
  
  return (
    <div 
      className="relative text-center py-2.5 text-sm font-medium overflow-hidden"
      style={{ backgroundColor: bgColor, color: textColor }}
      data-section-id="announcement-bar"
      data-section-name="פס הודעות"
    >
      <div className="max-w-[1800px] mx-auto px-12 relative h-5">
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${
            isAnimating ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {link ? (
              <a href={link} className="hover:underline">
                {currentMessage}
              </a>
            ) : (
              <span>{currentMessage}</span>
            )}
            {CountdownTimer}
          </div>
        </div>
        
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity z-10"
            style={{ color: textColor }}
            aria-label="סגור הודעה"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

// Menu item interface for custom navigation
interface MenuItem {
  id: string;
  title: string;
  linkType: 'url' | 'page' | 'category' | 'product';
  resolvedUrl?: string;
  imageUrl?: string | null;
  children?: MenuItem[];
}

interface CustomerData {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  hasPassword?: boolean;
  emailVerified?: boolean;
}

export type HeaderLayout = 'logo-right' | 'logo-left' | 'logo-center';

interface ShopHeaderClientProps {
  storeName: string;
  storeId: string;
  logoUrl?: string | null;
  categories: Category[];
  menuItems?: MenuItem[];
  navigationMode?: 'menu' | 'categories';
  basePath: string;
  customer?: CustomerData | null;
  defaultLayout?: HeaderLayout;
  defaultSticky?: boolean;
  defaultTransparent?: boolean;
  defaultShowSearch?: boolean;
  defaultShowCart?: boolean;
  defaultShowAccount?: boolean;
  defaultShowWishlist?: boolean;
  defaultShowLanguageSwitcher?: boolean;
  defaultMobileMenuShowImages?: boolean;
  defaultMobileMenuImageStyle?: 'fullRow' | 'square';
  defaultMobileMenuBgColor?: string;
  defaultMegaMenuBgColor?: string;
  // Locale settings
  currentLocale?: string;
  supportedLocales?: string[];
}

export function ShopHeaderClient({ 
  storeName, 
  storeId,
  logoUrl,
  categories,
  menuItems = [],
  navigationMode = 'menu', 
  basePath, 
  customer,
  defaultLayout = 'logo-right',
  defaultSticky = true,
  defaultTransparent = false,
  defaultShowSearch = true,
  defaultShowCart = true,
  defaultShowAccount = true,
  defaultShowWishlist = false,
  defaultShowLanguageSwitcher = false,
  defaultMobileMenuShowImages = false,
  defaultMobileMenuImageStyle = 'square',
  defaultMobileMenuBgColor = '#f9fafb',
  defaultMegaMenuBgColor = '#f9fafb',
  currentLocale = 'he',
  supportedLocales = ['he'],
}: ShopHeaderClientProps) {
  const { settings, isPreviewMode } = usePreviewSettings();
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  
  // Get settings from preview or use defaults
  const layout = isPreviewMode && settings.headerLayout ? settings.headerLayout : defaultLayout;
  
  // Mobile menu settings
  const mobileMenuShowImages = isPreviewMode && settings.mobileMenuShowImages !== undefined ? settings.mobileMenuShowImages : defaultMobileMenuShowImages;
  const mobileMenuImageStyle = isPreviewMode && settings.mobileMenuImageStyle ? settings.mobileMenuImageStyle : defaultMobileMenuImageStyle;
  const mobileMenuBgColor = isPreviewMode && settings.mobileMenuBgColor ? settings.mobileMenuBgColor : defaultMobileMenuBgColor;
  const megaMenuBgColor = isPreviewMode && settings.megaMenuBgColor ? settings.megaMenuBgColor : defaultMegaMenuBgColor;
  const isSticky = isPreviewMode ? (settings.headerSticky ?? defaultSticky) : defaultSticky;
  const isTransparent = isPreviewMode ? (settings.headerTransparent ?? defaultTransparent) : defaultTransparent;
  const showSearch = isPreviewMode ? (settings.headerShowSearch ?? defaultShowSearch) : defaultShowSearch;
  const showCart = isPreviewMode ? (settings.headerShowCart ?? defaultShowCart) : defaultShowCart;
  const showAccount = isPreviewMode ? (settings.headerShowAccount ?? defaultShowAccount) : defaultShowAccount;
  const showWishlist = isPreviewMode ? (settings.headerShowWishlist ?? defaultShowWishlist) : defaultShowWishlist;
  const showLanguageSwitcher = isPreviewMode ? (settings.headerShowLanguageSwitcher ?? defaultShowLanguageSwitcher) : defaultShowLanguageSwitcher;
  
  // Logo URL from preview settings (for real-time updates in editor)
  const effectiveLogoUrl = isPreviewMode && settings.logoUrl !== undefined ? settings.logoUrl : logoUrl;
  
  // Navigation mode from preview settings (defaults to prop value)
  const effectiveNavigationMode = isPreviewMode && settings.headerNavigationMode 
    ? settings.headerNavigationMode as 'menu' | 'categories'
    : navigationMode;
  
  // Announcement bar settings (only in preview mode)
  const announcementEnabled = isPreviewMode ? (settings.announcementEnabled ?? false) : false;
  const announcementText = settings.announcementText || '';
  const announcementLink = settings.announcementLink || '';
  const announcementBgColor = settings.announcementBgColor || '#000000';
  const announcementTextColor = settings.announcementTextColor || '#ffffff';
  // Countdown timer settings
  const announcementCountdownEnabled = settings.announcementCountdownEnabled ?? false;
  const announcementCountdownDate = settings.announcementCountdownDate || '';
  const announcementCountdownTime = settings.announcementCountdownTime || '00:00';

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
  // Only show categories when explicitly set to 'categories' mode
  const showCategories = effectiveNavigationMode === 'categories';

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
      {/* Show placeholder in editor when menu is empty */}
      {menuItems.length === 0 && isPreviewMode && (
        <span className="text-[11px] tracking-[0.2em] uppercase text-gray-400 border border-dashed border-gray-300 px-4 py-2 rounded">
          הוסף פריטים בניהול ניווט
        </span>
      )}
      {menuItems.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const href = item.resolvedUrl?.startsWith('/') ? `${basePath}${item.resolvedUrl}` : item.resolvedUrl || '#';
        
        // Check if any child has an image or grandchildren for mega menu style
        const hasMegaMenu = hasChildren && item.children!.some(c => c.imageUrl);
        const hasGrandchildren = hasChildren && item.children!.some(c => c.children && c.children.length > 0);
        
        return (
          <div key={item.id} className="relative group/nav">
            <Link
              href={href}
              className="text-[11px] tracking-[0.2em] uppercase text-gray-600 hover:text-black transition-colors duration-300 flex items-center gap-1"
            >
              {item.title}
              {hasChildren && (
                <svg className="w-3 h-3 opacity-50 group-hover/nav:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </Link>
            
            {/* Mega Menu - full width dropdown with columns and images */}
            {hasChildren && (hasMegaMenu || hasGrandchildren) && (
              <>
                {/* Invisible bridge to keep hover active when moving to dropdown */}
                <div className="absolute top-full left-0 right-0 h-[40px]" />
                <div className="fixed left-0 right-0 top-[64px] sm:top-[80px] pt-0 opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-200 z-50">
                  <MegaMenuDropdown item={item} basePath={basePath} bgColor={megaMenuBgColor} />
                </div>
              </>
            )}
            
            {/* Simple dropdown for items without images/grandchildren */}
            {hasChildren && !hasMegaMenu && !hasGrandchildren && (
              <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-200 z-50">
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
  // Uses effectiveLogoUrl for real-time preview updates in editor
  const Logo = ({ className = '' }: { className?: string }) => (
    <Link href={basePath || '/'} className={`group ${className}`}>
      {effectiveLogoUrl ? (
        <Image
          src={effectiveLogoUrl}
          alt={storeName}
          width={150}
          height={50}
          className="h-8 sm:h-10 w-auto object-contain"
          priority
          key={effectiveLogoUrl} // Force re-render when logo changes
        />
      ) : (
        <span className="font-display text-lg sm:text-2xl tracking-[0.2em] sm:tracking-[0.3em] text-black font-light uppercase">
          {storeName}
        </span>
      )}
    </Link>
  );

  // Icons component - respects visibility settings
  // In RTL: first in JSX = rightmost visually, last in JSX = leftmost visually
  // cartAtStart: cart is FIRST in JSX = rightmost (for logo-left where icons are on right)
  // default: cart is LAST = leftmost (for logo-right where icons are on left)
  // MOBILE: Search moved to left side (near hamburger) to save space
  const Icons = ({ cartAtStart = false }: { cartAtStart?: boolean }) => (
    <div className="flex items-center gap-1 sm:gap-2">
      {cartAtStart && showCart && <CartButton />}
      {showLanguageSwitcher && supportedLocales.length > 1 && (
        <LanguageSwitcher 
          currentLocale={currentLocale as SupportedLocale}
          supportedLocales={supportedLocales as SupportedLocale[]}
          variant="minimal"
          className="hidden lg:flex"
        />
      )}
      {/* Search - desktop only here, mobile search is near hamburger */}
      {showSearch && <span className="hidden sm:block"><SearchButton basePath={basePath} storeId={storeId} /></span>}
      {showWishlist && <WishlistHeaderButton basePath={basePath} />}
      {showAccount && <UserButton basePath={basePath} initialCustomer={customer} />}
      {!cartAtStart && showCart && <CartButton />}
    </div>
  );

  // Header wrapper classes
  const headerClasses = `
    ${isSticky ? 'sticky top-0 z-30' : 'relative'}
    ${isTransparent ? 'bg-transparent' : 'bg-white/95 backdrop-blur-sm'}
    ${isTransparent ? 'border-transparent' : 'border-b border-gray-100'}
    transition-all duration-300
  `.trim().replace(/\s+/g, ' ');

  // Announcement bar component (shared)
  const AnnouncementBarSection = announcementEnabled && !announcementDismissed && (
    <AnnouncementBar
      enabled={announcementEnabled}
      text={announcementText}
      link={announcementLink}
      bgColor={announcementBgColor}
      textColor={announcementTextColor}
      countdownEnabled={announcementCountdownEnabled}
      countdownDate={announcementCountdownDate}
      countdownTime={announcementCountdownTime}
      onClose={() => setAnnouncementDismissed(true)}
    />
  );

  // Layout 1: Logo Right (RTL default) - לוגו בימין, תפריט במרכז, אייקונים משמאל
  // Mobile: hamburger + logo on right, cart at extreme left
  if (layout === 'logo-right') {
    return (
      <>
        {AnnouncementBarSection}
        <header className={headerClasses} data-section-id="header" data-section-type="header" data-section-name="הדר">
          <div className="max-w-[1800px] mx-auto px-2 sm:px-6 lg:px-12">
            <div className="flex items-center justify-between h-16 sm:h-20" dir="rtl">
              {/* Right: Mobile Menu + Search (mobile) + Logo */}
              <div className="flex items-center gap-1 sm:gap-2">
                <MobileMenu 
                  categories={categories} 
                  menuItems={menuItems}
                  navigationMode={effectiveNavigationMode}
                  basePath={basePath} 
                  storeName={storeName} 
                  logoUrl={logoUrl}
                  showMobileImages={mobileMenuShowImages}
                  mobileImageStyle={mobileMenuImageStyle}
                  bgColor={mobileMenuBgColor}
                />
                {/* Search - mobile only here, desktop search is with other icons */}
                {showSearch && <span className="sm:hidden"><SearchButton basePath={basePath} storeId={storeId} /></span>}
                <Logo />
              </div>
              {/* Center: Navigation */}
              <Navigation />
              {/* Left: Icons (cart at extreme left) */}
              <Icons />
            </div>
          </div>
        </header>
      </>
    );
  }

  // Layout 2: Logo Left - לוגו בשמאל, תפריט במרכז, אייקונים מימין
  // Mobile: hamburger at extreme left, logo next to it, cart at extreme right
  if (layout === 'logo-left') {
    return (
      <>
        {AnnouncementBarSection}
        <header className={headerClasses} data-section-id="header" data-section-type="header" data-section-name="הדר">
          <div className="max-w-[1800px] mx-auto px-2 sm:px-6 lg:px-12">
            <div className="flex items-center justify-between h-16 sm:h-20" dir="rtl">
              {/* Right: Icons with cart at extreme right */}
              <Icons cartAtStart />
              {/* Center: Navigation */}
              <Navigation />
              {/* Left: Logo + Search (mobile) + Mobile Menu (hamburger at extreme left) */}
              <div className="flex items-center gap-1 sm:gap-2">
                <Logo />
                {/* Search - mobile only here */}
                {showSearch && <span className="sm:hidden"><SearchButton basePath={basePath} storeId={storeId} /></span>}
                <MobileMenu 
                  categories={categories} 
                  menuItems={menuItems}
                  navigationMode={effectiveNavigationMode}
                  basePath={basePath} 
                  storeName={storeName} 
                  logoUrl={logoUrl}
                  showMobileImages={mobileMenuShowImages}
                  mobileImageStyle={mobileMenuImageStyle}
                  bgColor={mobileMenuBgColor}
                />
              </div>
            </div>
          </div>
        </header>
      </>
    );
  }

  // Layout 3: Logo Center - לוגו במרכז, תפריט מתחת
  // Mobile: hamburger on right, logo center, cart at extreme left
  return (
    <>
      {AnnouncementBarSection}
      <header className={headerClasses} data-section-id="header" data-section-type="header" data-section-name="הדר">
        <div className="max-w-[1800px] mx-auto px-2 sm:px-6 lg:px-12">
          {/* Top row: Hamburger/Search - Logo - Icons */}
          <div className="flex items-center justify-between h-16 sm:h-20" dir="rtl">
            {/* Right: Mobile Menu + Search */}
            <div className="flex items-center gap-1 sm:gap-2">
              <MobileMenu 
                categories={categories} 
                menuItems={menuItems}
                navigationMode={effectiveNavigationMode}
                basePath={basePath} 
                storeName={storeName} 
                logoUrl={logoUrl}
                showMobileImages={mobileMenuShowImages}
                mobileImageStyle={mobileMenuImageStyle}
                bgColor={mobileMenuBgColor}
              />
              {/* Search - all screen sizes, positioned near hamburger */}
              {showSearch && <SearchButton basePath={basePath} storeId={storeId} />}
            </div>
            {/* Center: Logo */}
            <Logo className="absolute left-1/2 -translate-x-1/2" />
            {/* Left: Wishlist, User, Cart at extreme left */}
            <div className="flex items-center gap-1 sm:gap-2">
              {showWishlist && <WishlistHeaderButton basePath={basePath} />}
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
    </>
  );
}

