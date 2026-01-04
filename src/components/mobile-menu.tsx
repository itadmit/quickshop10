'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface MobileMenuProps {
  categories: Category[];
  basePath: string;
  storeName: string;
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

export function MobileMenu({ categories, basePath, storeName }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Organize categories into parent/child structure
  const parentCategories = categories.filter(c => !c.parentId);
  const childrenMap = new Map<string, Category[]>();
  
  categories.forEach(c => {
    if (c.parentId) {
      const existing = childrenMap.get(c.parentId) || [];
      childrenMap.set(c.parentId, [...existing, c]);
    }
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const closeMenu = () => setIsOpen(false);

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

      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
      />
      
      {/* Sidebar - Opens from right side (RTL) */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-[320px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <span className="font-display text-lg tracking-[0.2em] font-light uppercase">
            {storeName}
          </span>
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

        {/* Navigation */}
        <nav className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          <ul className="py-4">
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
              const isExpanded = expandedCategories.has(category.id);
              
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
                        onClick={() => toggleCategory(category.id)}
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
          </ul>
        </nav>
      </div>
    </>
  );
}

