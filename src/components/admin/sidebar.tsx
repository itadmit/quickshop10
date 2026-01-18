'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

// ============================================
// AdminSidebar - Untitled UI Style
// Client Component (מינימום JS לניווט)
// Responsive - מוסתר במובייל, נפתח בלחיצה
// ============================================

interface PluginMenuItem {
  icon: string;
  label: string;
  href: string;
  section: string;
  badge?: string;
}

interface AdminSidebarProps {
  storeSlug: string;
  unreadOrdersCount?: number;
  pluginMenuItems?: PluginMenuItem[];
}

interface SubMenuItem {
  label: string;
  href: string;
}

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  children?: SubMenuItem[];
}

// Main menu items
const mainMenuItems: MenuItem[] = [
  {
    label: 'ראשי',
    href: '',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    label: 'הזמנות',
    href: '/orders',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <path d="M9 12h6"/>
        <path d="M9 16h6"/>
      </svg>
    ),
  },
  {
    label: 'החזרות והחלפות',
    href: '/returns',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"/>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
      </svg>
    ),
  },
  {
    label: 'מוצרים',
    href: '/products',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    ),
  },
  {
    label: 'ניהול מלאי',
    href: '/products/inventory',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    label: 'רשימת המתנה',
    href: '/waitlist',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
      </svg>
    ),
    children: [
      {
        label: 'כל הממתינים',
        href: '/waitlist',
      },
      {
        label: 'סטטיסטיקות',
        href: '/waitlist/stats',
      },
    ],
  },
  {
    label: 'עריכה קבוצתית',
    href: '/products/bulk-edit',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
  },
  {
    label: 'קטגוריות',
    href: '/categories',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    label: 'תוספות מותאמות',
    href: '/addons',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M12 8v8"/>
        <path d="M8 12h8"/>
      </svg>
    ),
  },
  {
    label: 'שדות מותאמים',
    href: '/metafields',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    label: 'אנשי קשר',
    href: '/contacts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
];


// Sales & Marketing
const salesMenuItems: MenuItem[] = [
  {
    label: 'קופונים',
    href: '/discounts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="9" r="2"/>
        <circle cx="15" cy="15" r="2"/>
        <line x1="16" y1="8" x2="8" y2="16"/>
        <rect x="3" y="3" width="18" height="18" rx="2"/>
      </svg>
    ),
  },
  {
    label: 'הנחות אוטומטיות',
    href: '/discounts/automatic',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    label: 'משפיענים',
    href: '/influencers',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
        <path d="M5 20h14"/>
      </svg>
    ),
  },
  {
    label: 'גיפט קארדס',
    href: '/gift-cards',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="18" height="13" rx="2"/>
        <path d="M3 11h18"/>
        <path d="M12 8v13"/>
        <path d="M8 8c0-1.5.5-4 4-4s4 2.5 4 4"/>
      </svg>
    ),
  },
  {
    label: 'עגלות נטושות',
    href: '/abandoned',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
      </svg>
    ),
  },
  {
    label: 'פופאפים',
    href: '/popups',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M8 12h8"/>
        <path d="M12 8v8"/>
      </svg>
    ),
  },
];

// Analytics
const analyticsMenuItems: MenuItem[] = [
  {
    label: 'דוחות',
    href: '/reports',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
];


// Content
const contentMenuItems: MenuItem[] = [
  {
    label: 'עיצוב',
    href: '/design',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z"/>
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
        <path d="M2 2l7.586 7.586"/>
        <circle cx="11" cy="11" r="2"/>
      </svg>
    ),
  },
  {
    label: 'עמודים',
    href: '/pages',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    label: 'ניווט',
    href: '/navigation',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    ),
  },
  {
    label: 'מדיה',
    href: '/media',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
];


// Plugins
const pluginsMenuItems: MenuItem[] = [
  {
    label: 'חנות תוספים',
    href: '/plugins',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
];


// Settings
const settingsMenuItems: MenuItem[] = [
  {
    label: 'הגדרות',
    href: '/settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
    children: [
      { label: 'כללי', href: '/settings' },
      { label: 'דומיין מותאם', href: '/settings/domain' },
      { label: 'משלוחים', href: '/settings/shipping' },
      { label: 'תשלומים', href: '/settings/payments' },
      { label: 'צ\'קאאוט', href: '/settings/checkout' },
      { label: 'מיסים', href: '/settings/tax' },
      { label: 'התראות', href: '/settings/notifications' },
      { label: 'מעקב ואנליטיקס', href: '/settings/tracking' },
      { label: 'צוות', href: '/settings/team' },
      { label: 'Webhooks', href: '/settings/webhooks' },
    ],
  },
];

// Help & Guides - external link
const helpMenuItem: MenuItem = {
  label: 'מדריכים ועזרה',
  href: '/help',
  icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
};


// Map of lucide icon names to inline SVGs for dynamic plugins
const getPluginIcon = (iconName: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    PlayCircle: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="10 8 16 12 10 16 10 8"/>
      </svg>
    ),
    ImagePlus: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7"/>
        <line x1="16" y1="5" x2="22" y2="5"/>
        <line x1="19" y1="2" x2="19" y2="8"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
      </svg>
    ),
    Crown: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
      </svg>
    ),
    BarChart: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10"/>
        <line x1="18" y1="20" x2="18" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="16"/>
      </svg>
    ),
    MessageCircle: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
      </svg>
    ),
    Banknote: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2"/>
        <circle cx="12" cy="12" r="2"/>
        <path d="M6 12h.01M18 12h.01"/>
      </svg>
    ),
    CalendarOff: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.18 4.18A2 2 0 003 6v14a2 2 0 002 2h14a2 2 0 001.82-1.18"/>
        <path d="M21 15.5V6a2 2 0 00-2-2H9.5"/>
        <path d="M16 2v4"/>
        <path d="M3 10h7"/>
        <path d="M21 10h-5.5"/>
        <line x1="2" y1="2" x2="22" y2="22"/>
      </svg>
    ),
  };
  
  return iconMap[iconName] || (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  );
};

export function AdminSidebar({ storeSlug, unreadOrdersCount = 0, pluginMenuItems = [] }: AdminSidebarProps) {
  const pathname = usePathname();
  const basePath = `/shops/${storeSlug}/admin`;
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Listen for mobile menu toggle event from header
  useEffect(() => {
    const handleToggle = () => setMobileOpen(prev => !prev);
    window.addEventListener('toggle-mobile-menu', handleToggle);
    return () => window.removeEventListener('toggle-mobile-menu', handleToggle);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Collect all menu hrefs to check for more specific matches
  const allMenuHrefs = [
    ...mainMenuItems,
    ...salesMenuItems,
    ...analyticsMenuItems,
    ...contentMenuItems,
    ...pluginsMenuItems,
    ...settingsMenuItems,
    ...pluginMenuItems,
  ].map(item => item.href);

  const isActive = (href: string) => {
    const fullPath = `${basePath}${href}`;
    
    // Root path - exact match only
    if (href === '') {
      return pathname === basePath || pathname === `${basePath}/`;
    }
    
    // Exact match
    if (pathname === fullPath || pathname === `${fullPath}/`) {
      return true;
    }
    
    // Check if pathname starts with this path
    if (pathname.startsWith(`${fullPath}/`)) {
      // Only mark as active if there's no MORE SPECIFIC menu item that matches
      const hasMoreSpecificMatch = allMenuHrefs.some(otherHref => {
        if (otherHref === href) return false;
        // Check if other href is more specific (longer and starts with current)
        if (otherHref.startsWith(`${href}/`)) {
          const otherFullPath = `${basePath}${otherHref}`;
          // If that more specific item matches the current path
          return pathname === otherFullPath || pathname.startsWith(`${otherFullPath}/`);
        }
        return false;
      });
      
      return !hasMoreSpecificMatch;
    }
    
    return false;
  };

  // Get badge for orders
  const getBadge = (href: string): number | undefined => {
    if (href === '/orders' && unreadOrdersCount > 0) {
      return unreadOrdersCount;
    }
    return undefined;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-14 right-0 bottom-0 w-64 bg-white border-l border-gray-200 overflow-y-auto z-50
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        md:z-40
      `}>
        {/* Mobile Close Button */}
        <button 
          onClick={() => setMobileOpen(false)}
          className="md:hidden absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <nav className="p-4 pt-12 md:pt-4">
          {/* Main Section */}
          <MenuSection items={mainMenuItems} basePath={basePath} isActive={isActive} getBadge={getBadge} />
          
          {/* Sales & Marketing */}
          <MenuLabel>מכירות ושיווק</MenuLabel>
          <MenuSection items={salesMenuItems} basePath={basePath} isActive={isActive} getBadge={getBadge} />
          
          {/* Analytics */}
          <MenuLabel>אנליטיקס</MenuLabel>
          <MenuSection items={analyticsMenuItems} basePath={basePath} isActive={isActive} getBadge={getBadge} />
          
          {/* Content */}
          <MenuLabel>תוכן</MenuLabel>
          <MenuSection items={contentMenuItems} basePath={basePath} isActive={isActive} getBadge={getBadge} />
          
          {/* Divider */}
          <div className="my-4 border-t border-gray-100" />
          
          {/* Plugins */}
          <MenuLabel>תוספים</MenuLabel>
          <MenuSection items={pluginsMenuItems} basePath={basePath} isActive={isActive} getBadge={getBadge} />
          
          {/* Dynamic Plugin Menu Items */}
          {pluginMenuItems.length > 0 && (
            <ul className="space-y-1">
              {pluginMenuItems.map((plugin) => {
                const active = isActive(plugin.href);
                
                return (
                  <li key={plugin.href}>
                    <Link
                      href={`${basePath}${plugin.href}`}
                      className={`
                        flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-150 group
                        ${active 
                          ? 'bg-gray-100 text-gray-900 font-medium' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <span className={`flex-shrink-0 transition-colors ${active ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>
                        {getPluginIcon(plugin.icon)}
                      </span>
                      <span className="flex-1">{plugin.label}</span>
                      {plugin.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-pink-100 text-pink-700">
                          {plugin.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          
          {/* Divider */}
          <div className="my-4 border-t border-gray-100" />
          
          {/* Settings */}
          <MenuSection items={settingsMenuItems} basePath={basePath} isActive={isActive} getBadge={getBadge} />
          
          {/* Help - External Link */}
          <a
            href="/help"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 mt-2 text-sm rounded-lg transition-all duration-150 text-gray-600 hover:bg-gray-50 hover:text-gray-900 group"
          >
            <span className="flex-shrink-0 transition-colors text-gray-400 group-hover:text-gray-600">
              {helpMenuItem.icon}
            </span>
            <span className="flex-1">{helpMenuItem.label}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </nav>
      </aside>
    </>
  );
}

// ============================================
// Helper Components
// ============================================

function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-5 pb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
      {children}
    </p>
  );
}

function MenuSection({ 
  items, 
  basePath, 
  isActive, 
  getBadge 
}: { 
  items: MenuItem[]; 
  basePath: string; 
  isActive: (href: string) => boolean;
  getBadge: (href: string) => number | undefined;
}) {
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = isActive(item.href);
        const badge = getBadge(item.href);
        
        return (
          <li key={item.href}>
            <Link
              href={`${basePath}${item.href}`}
              className={`
                flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-150 group
                ${active 
                  ? 'bg-gray-100 text-gray-900 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <span className={`flex-shrink-0 transition-colors ${active ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {badge !== undefined && (
                <span className="min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full bg-gray-200 text-gray-700 flex items-center justify-center">
                  {badge}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
