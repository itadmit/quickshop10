import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/ui';
import { GeneralSettingsForm } from './general-form';

export const dynamic = 'force-dynamic';

// ============================================
// Settings Page - Server Component
// ============================================

interface SettingsPageProps {
  params: Promise<{ slug: string }>;
}

const settingsTabs = [
  { id: 'general', label: 'כללי', href: '' },
  { id: 'payments', label: 'תשלומים', href: '/payments' },
  { id: 'tracking', label: 'Tracking', href: '/tracking' },
  { id: 'checkout', label: 'Checkout', href: '/checkout' },
  { id: 'shipping', label: 'משלוח', href: '/shipping' },
  { id: 'tax', label: 'מיסים', href: '/tax' },
  { id: 'notifications', label: 'התראות', href: '/notifications' },
];

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const settings = store.settings as Record<string, unknown> || {};

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
            <SettingsTab 
              key={tab.id}
              href={`/shops/${slug}/admin/settings${tab.href}`} 
              label={tab.label} 
              active={tab.id === 'general'} 
            />
          ))}
        </nav>

        {/* General Settings Form */}
        <div className="p-4 sm:p-6">
          <GeneralSettingsForm store={store} settings={settings} />
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`
        px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex-shrink-0
        ${active
          ? 'border-gray-900 text-gray-900'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }
      `}
    >
      {label}
    </Link>
  );
}
