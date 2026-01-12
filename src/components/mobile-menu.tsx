'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';

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
  children?: MenuItem[];
}

interface MobileMenuProps {
  categories: Category[];
  menuItems?: MenuItem[];
  navigationMode?: 'menu' | 'categories';
  basePath: string;
  storeName: string;
  logoUrl?: string | null;
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-600 hover:text-black transition-colors cursor-pointer"
      aria-label="פתח תפריט"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}

export function MobileMenu({ 
  categories, 
  menuItems = [], 
  navigationMode = 'menu', 
  basePath, 
  storeName, 
  logoUrl 
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  
  // Determine if we should show categories or custom menu
  // Only show categories when explicitly set to 'categories' mode
  const showCategories = navigationMode === 'categories';
  
  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Organize categories into parent/child structure (for categories mode)
  const parentCategories = categories.filter(c => !c.parentId);
  const childrenMap = new Map<string, Category[]>();
  
  categories.forEach(c => {
    if (c.parentId) {
      const existing = childrenMap.get(c.parentId) || [];
      childrenMap.set(c.parentId, [...existing, c]);
    }
  });

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const closeMenu = () => setIsOpen(false);

  // Mobile menu content - rendered via portal to body to escape header stacking context
  // Always render for smooth animation, control visibility via CSS
  const menuContent = mounted ? createPortal(
    <>
      {/* Overlay - Click to close */}
      <div 
        className={`fixed inset-0 bg-black/40 z-[9998] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />
      
      {/* Sidebar - Opens from right side (RTL) - Full height with smooth animation */}
      <div 
        className={`fixed top-0 right-0 bottom-0 w-full max-w-[320px] bg-white shadow-2xl z-[9999] flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        dir="rtl"
        style={{ height: '100dvh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white shrink-0">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={storeName}
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <span className="font-display text-lg tracking-[0.2em] font-light uppercase">
              {storeName}
            </span>
          )}
          <button 
            onClick={closeMenu}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-black transition-colors cursor-pointer"
            aria-label="סגור תפריט"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Navigation - fills remaining height */}
        <nav className="flex-1 overflow-y-auto bg-white">
          <ul className="py-4">
            {/* Show categories navigation */}
            {showCategories && (
              <>
                {/* Home Link */}
                <li>
                  <Link 
                    href={basePath || '/'}
                    onClick={closeMenu}
                    className="block px-6 py-4 text-sm tracking-wide text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                  >
                    בית
                  </Link>
                </li>
                
                {/* Categories */}
                {parentCategories.map((category) => {
                  const children = childrenMap.get(category.id) || [];
                  const hasChildren = children.length > 0;
                  const isExpanded = expandedItems.has(category.id);
                  
                  return (
                    <li key={category.id}>
                      <div className="flex items-center">
                        <Link
                          href={`${basePath}/category/${category.slug}`}
                          onClick={closeMenu}
                          className="flex-1 px-6 py-4 text-sm tracking-wide text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                        >
                          {category.name}
                        </Link>
                        {hasChildren && (
                          <button
                            onClick={() => toggleItem(category.id)}
                            className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-black transition-colors cursor-pointer"
                            aria-label={isExpanded ? 'סגור תת-קטגוריות' : 'פתח תת-קטגוריות'}
                          >
                            <svg 
                              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      {/* Subcategories */}
                      {hasChildren && (
                        <ul 
                          className={`bg-gray-50 overflow-hidden transition-all duration-200 ${
                            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          {children.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={`${basePath}/category/${child.slug}`}
                                onClick={closeMenu}
                                className="block pr-10 pl-6 py-3 text-sm text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </>
            )}

            {/* Show custom menu navigation */}
            {!showCategories && menuItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedItems.has(item.id);
              const href = item.resolvedUrl?.startsWith('/') ? `${basePath}${item.resolvedUrl}` : item.resolvedUrl || '#';
              
              return (
                <li key={item.id}>
                  <div className="flex items-center">
                    <Link
                      href={href}
                      onClick={closeMenu}
                      className="flex-1 px-6 py-4 text-sm tracking-wide text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                    >
                      {item.title}
                    </Link>
                    {hasChildren && (
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-black transition-colors cursor-pointer"
                        aria-label={isExpanded ? 'סגור תתי-קישורים' : 'פתח תתי-קישורים'}
                      >
                        <svg 
                          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Child items */}
                  {hasChildren && (
                    <ul 
                      className={`bg-gray-50 overflow-hidden transition-all duration-200 ${
                        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      {item.children!.map((child) => {
                        const childHref = child.resolvedUrl?.startsWith('/') ? `${basePath}${child.resolvedUrl}` : child.resolvedUrl || '#';
                        return (
                          <li key={child.id}>
                            <Link
                              href={childHref}
                              onClick={closeMenu}
                              className="block pr-10 pl-6 py-3 text-sm text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
                            >
                              {child.title}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-600 hover:text-black transition-colors cursor-pointer"
        aria-label="פתח תפריט"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {menuContent}
    </>
  );
}

