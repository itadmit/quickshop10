'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileNavProps {
  storeSlug: string;
  storeName: string;
  influencerName: string;
  showCommission?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  requiresCommission?: boolean;
}

const navItems: NavItem[] = [
  { href: '', label: 'דשבורד', icon: 'home' },
  { href: '/coupons', label: 'הקופונים שלי', icon: 'ticket' },
  { href: '/sales', label: 'מכירות', icon: 'chart' },
  { href: '/commissions', label: 'עמלות', icon: 'money', requiresCommission: true },
  { href: '/refunds', label: 'החזרים', icon: 'refund' },
  { href: '/settings', label: 'הגדרות', icon: 'settings' },
];

const icons: Record<string, React.ReactNode> = {
  home: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  ticket: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  money: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  refund: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export function MobileNav({ storeSlug, storeName, influencerName, showCommission = true }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const basePath = `/shops/${storeSlug}/influencer`;

  const isActive = (itemHref: string) => {
    const normalizedPath = pathname.replace(basePath, '').replace(/\/$/, '') || '';
    if (itemHref === '' && normalizedPath === '') return true;
    if (itemHref !== '' && normalizedPath.startsWith(itemHref)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 right-0 left-0 h-14 bg-white border-b border-gray-200 z-50 px-4 flex items-center justify-between">
        <Link
          href={`/shops/${storeSlug}`}
          target="_blank"
          className="p-2 -mr-2 text-gray-500"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
        
        <span className="font-semibold text-gray-900 text-sm">{storeName}</span>
        
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
          aria-label="פתח תפריט"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div className={`lg:hidden fixed top-0 right-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Drawer Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">{influencerName}</p>
            <p className="text-sm text-gray-500">דשבורד משפיענים</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav Items */}
        <nav className="p-4 space-y-1">
          {navItems
            .filter(item => !item.requiresCommission || showCommission)
            .map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={`${basePath}${item.href}`}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    active 
                      ? 'bg-purple-50 text-purple-700' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className={active ? 'text-purple-500' : 'text-gray-400'}>
                    {icons[item.icon]}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={async () => {
              await fetch('/api/influencer/auth/logout', { method: 'POST' });
              window.location.reload();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">התנתקות</span>
          </button>
        </div>
      </div>
    </>
  );
}

