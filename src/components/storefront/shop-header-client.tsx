'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { MobileMenu } from '@/components/mobile-menu';
import { CartButton } from '@/components/cart-button';
import { UserButton } from '@/components/user-button';
import { SearchButton } from '@/components/search-button';
import { usePreviewSettings } from './preview-settings-provider';

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

// Announcement Bar Component - supports rotating messages with slide animation
function AnnouncementBar({ 
  enabled, 
  text, 
  link, 
  bgColor, 
  textColor,
  onClose,
}: {
  enabled: boolean;
  text: string;
  link?: string;
  bgColor: string;
  textColor: string;
  onClose?: () => void;
}) {
  // Support multiple messages (each line = separate message)
  const messages = text.split('\n').filter(line => line.trim());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
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
          {link ? (
            <a href={link} className="hover:underline">
              {currentMessage}
            </a>
          ) : (
            <span>{currentMessage}</span>
          )}
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
  basePath: string;
  customer?: CustomerData | null;
  defaultLayout?: HeaderLayout;
  defaultSticky?: boolean;
  defaultTransparent?: boolean;
  defaultShowSearch?: boolean;
  defaultShowCart?: boolean;
  defaultShowAccount?: boolean;
}

export function ShopHeaderClient({ 
  storeName, 
  storeId,
  logoUrl,
  categories, 
  basePath, 
  customer,
  defaultLayout = 'logo-right',
  defaultSticky = true,
  defaultTransparent = false,
  defaultShowSearch = true,
  defaultShowCart = true,
  defaultShowAccount = true,
}: ShopHeaderClientProps) {
  const { settings, isPreviewMode } = usePreviewSettings();
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  
  // Get settings from preview or use defaults
  const layout = isPreviewMode && settings.headerLayout ? settings.headerLayout : defaultLayout;
  const isSticky = isPreviewMode ? (settings.headerSticky ?? defaultSticky) : defaultSticky;
  const isTransparent = isPreviewMode ? (settings.headerTransparent ?? defaultTransparent) : defaultTransparent;
  const showSearch = isPreviewMode ? (settings.headerShowSearch ?? defaultShowSearch) : defaultShowSearch;
  const showCart = isPreviewMode ? (settings.headerShowCart ?? defaultShowCart) : defaultShowCart;
  const showAccount = isPreviewMode ? (settings.headerShowAccount ?? defaultShowAccount) : defaultShowAccount;
  
  // Announcement bar settings (only in preview mode)
  const announcementEnabled = isPreviewMode ? (settings.announcementEnabled ?? false) : false;
  const announcementText = settings.announcementText || '';
  const announcementLink = settings.announcementLink || '';
  const announcementBgColor = settings.announcementBgColor || '#000000';
  const announcementTextColor = settings.announcementTextColor || '#ffffff';

  // Organize categories into parent/child structure
  const parentCategories = categories.filter(c => !c.parentId);
  const childrenMap = new Map<string, Category[]>();
  
  categories.forEach(c => {
    if (c.parentId) {
      const existing = childrenMap.get(c.parentId) || [];
      childrenMap.set(c.parentId, [...existing, c]);
    }
  });

  // Navigation component
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

  // Icons component - respects visibility settings
  const Icons = ({ searchFirst = false, hideSearch = false, hideCartAccount = false }: { 
    searchFirst?: boolean;
    hideSearch?: boolean;
    hideCartAccount?: boolean;
  }) => (
    <div className="flex items-center gap-1 sm:gap-2">
      {searchFirst && showSearch && !hideSearch && (
        <SearchButton basePath={basePath} storeId={storeId} />
      )}
      {showAccount && !hideCartAccount && (
        <UserButton basePath={basePath} initialCustomer={customer} />
      )}
      {showCart && !hideCartAccount && (
        <CartButton />
      )}
      {!searchFirst && showSearch && !hideSearch && (
        <SearchButton basePath={basePath} storeId={storeId} />
      )}
    </div>
  );

  // Header wrapper classes
  const headerClasses = `
    ${isSticky ? 'sticky top-0 z-30' : 'relative'}
    ${isTransparent ? 'bg-transparent' : 'bg-white/95 backdrop-blur-sm'}
    border-b border-gray-100
    transition-all duration-300
  `;

  // Announcement bar component (shared)
  const AnnouncementBarSection = announcementEnabled && !announcementDismissed && (
    <AnnouncementBar
      enabled={announcementEnabled}
      text={announcementText}
      link={announcementLink}
      bgColor={announcementBgColor}
      textColor={announcementTextColor}
      onClose={() => setAnnouncementDismissed(true)}
    />
  );

  // Layout 1: Logo Right (RTL default)
  if (layout === 'logo-right') {
    return (
      <>
        {AnnouncementBarSection}
        <header className={headerClasses} data-section-id="header">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="flex items-center justify-between h-16 sm:h-20" dir="rtl">
              <div className="flex items-center gap-2">
                <MobileMenu categories={categories} basePath={basePath} storeName={storeName} />
                <Logo />
              </div>
              <Navigation />
              <Icons />
            </div>
          </div>
        </header>
      </>
    );
  }

  // Layout 2: Logo Left
  if (layout === 'logo-left') {
    return (
      <>
        {AnnouncementBarSection}
        <header className={headerClasses} data-section-id="header">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="flex items-center justify-between h-16 sm:h-20" dir="rtl">
              <Icons />
              <Navigation />
              <div className="flex items-center gap-2">
                <Logo />
                <MobileMenu categories={categories} basePath={basePath} storeName={storeName} />
              </div>
            </div>
          </div>
        </header>
      </>
    );
  }

  // Layout 3: Logo Center
  return (
    <>
      {AnnouncementBarSection}
      <header className={headerClasses} data-section-id="header">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20" dir="rtl">
            <div className="flex items-center">
              {showSearch && <SearchButton basePath={basePath} storeId={storeId} />}
              <MobileMenu categories={categories} basePath={basePath} storeName={storeName} />
            </div>
            <Logo className="absolute left-1/2 -translate-x-1/2" />
            <div className="flex items-center gap-1 sm:gap-2">
              {showAccount && <UserButton basePath={basePath} initialCustomer={customer} />}
              {showCart && <CartButton />}
            </div>
          </div>
          <div className="hidden lg:flex justify-center border-t border-gray-100 py-3">
            <Navigation />
          </div>
        </div>
      </header>
    </>
  );
}

