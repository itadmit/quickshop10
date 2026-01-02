import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { paymentProviders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAvailableProviders } from '@/lib/payments/provider-info';
import { PaymentProvidersManager } from './providers-manager';

export const dynamic = 'force-dynamic';

interface PaymentsSettingsPageProps {
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

export default async function PaymentsSettingsPage({ params }: PaymentsSettingsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get configured payment providers for this store
  const configuredProviders = await db
    .select()
    .from(paymentProviders)
    .where(eq(paymentProviders.storeId, store.id));

  // Get all available providers info
  const availableProviders = getAvailableProviders();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">הגדרות חנות</h1>
        <p className="text-sm text-gray-500 mt-1">
          הגדר את אמצעי התשלום בחנות שלך
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
              active={tab.id === 'payments'} 
            />
          ))}
        </nav>

        {/* Payment Providers Manager */}
        <div className="p-6">
          <PaymentProvidersManager 
            storeId={store.id}
            storeSlug={slug}
            configuredProviders={configuredProviders}
            availableProviders={availableProviders}
          />
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

