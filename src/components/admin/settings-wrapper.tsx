import Link from 'next/link';
import { PageHeader } from '@/components/admin/ui';

// ============================================
// Settings Wrapper - Server Component
// Shared wrapper for all tabbed settings pages
// Follows REQUIREMENTS.md: Server Component, no JS
// ============================================

interface SettingsWrapperProps {
  children: React.ReactNode;
  storeSlug: string;
  activeTab?: string;
}

// Settings tabs - defined once, used everywhere
const settingsTabs = [
  { id: 'general', label: 'כללי', path: '' },
  { id: 'seo', label: 'SEO', path: '/seo' },
  { id: 'subscription', label: 'מנוי', path: '/subscription' },
  { id: 'domain', label: 'דומיין', path: '/domain' },
  { id: 'payments', label: 'תשלומים', path: '/payments' },
  { id: 'orders', label: 'הזמנות', path: '/orders' },
  { id: 'tracking', label: 'מעקב', path: '/tracking' },
  { id: 'checkout', label: 'קופה', path: '/checkout' },
  { id: 'shipping', label: 'משלוח', path: '/shipping' },
  { id: 'print', label: 'הדפסה', path: '/print' },
  { id: 'tax', label: 'מיסים', path: '/tax' },
  { id: 'notifications', label: 'התראות', path: '/notifications' },
  { id: 'languages', label: 'שפות', path: '/languages' },
  { id: 'gdpr', label: 'עוגיות', path: '/gdpr' },
  { id: 'advanced', label: 'מתקדם', path: '/advanced' },
];

export function SettingsWrapper({ children, storeSlug, activeTab = 'general' }: SettingsWrapperProps) {
  const basePath = `/shops/${storeSlug}/admin/settings`;
  
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="הגדרות חנות"
        description="הגדר את פרטי החנות, עיצוב, ואפשרויות נוספות"
      />

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <nav className="flex border-b border-gray-200 px-2 sm:px-4 overflow-x-auto scrollbar-hide">
          {settingsTabs.map((tab) => (
            <Link
              key={tab.id}
              href={`${basePath}${tab.path}`}
              className={`
                px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex-shrink-0
                ${tab.id === activeTab
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

