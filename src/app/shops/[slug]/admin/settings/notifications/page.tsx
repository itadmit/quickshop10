import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { NotificationsSettingsForm } from './notifications-form';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface NotificationsSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NotificationsSettingsPage({ params }: NotificationsSettingsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const settings = store.settings as Record<string, unknown> || {};
  const notificationSettings = (settings.notifications as Record<string, unknown>) || {};

const settingsTabs = [
  { id: 'general', label: 'כללי', href: '' },
  { id: 'subscription', label: 'מנוי', href: '/subscription' },
  { id: 'domain', label: 'דומיין', href: '/domain' },
  { id: 'payments', label: 'תשלומים', href: '/payments' },
  { id: 'tracking', label: 'מעקב', href: '/tracking' },
  { id: 'checkout', label: 'קופה', href: '/checkout' },
  { id: 'shipping', label: 'משלוח', href: '/shipping' },
  { id: 'tax', label: 'מיסים', href: '/tax' },
  { id: 'notifications', label: 'התראות', href: '/notifications' },
  { id: 'gdpr', label: 'עוגיות', href: '/gdpr' },
];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">הגדרות חנות</h1>
        <p className="text-sm text-gray-500 mt-1">
          הגדר התראות אימייל ו-push
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <nav className="flex border-b border-gray-200 px-4 overflow-x-auto">
          {settingsTabs.map((tab) => (
            <SettingsTab
              key={tab.id}
              href={`/shops/${slug}/admin/settings${tab.href}`}
              label={tab.label}
              active={tab.id === 'notifications'}
            />
          ))}
        </nav>
      </div>

      {/* Notifications Settings Form */}
      <NotificationsSettingsForm 
        storeId={store.id} 
        settings={notificationSettings}
        defaultEmail={(settings.contactEmail as string) || ''} 
      />
    </div>
  );
}

function SettingsTab({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`
        px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap
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

