import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { ShippingSettingsForm } from './shipping-form';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface ShippingSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ShippingSettingsPage({ params }: ShippingSettingsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const settings = store.settings as Record<string, unknown> || {};
  const shippingSettings = (settings.shipping as Record<string, unknown>) || {};

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
];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">הגדרות חנות</h1>
        <p className="text-sm text-gray-500 mt-1">
          הגדר אפשרויות משלוח
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
              active={tab.id === 'shipping'}
            />
          ))}
        </nav>
      </div>

      {/* Shipping Settings Form */}
      <ShippingSettingsForm storeId={store.id} settings={shippingSettings} />
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


