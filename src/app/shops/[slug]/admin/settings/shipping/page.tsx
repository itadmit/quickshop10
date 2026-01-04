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
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 overflow-x-auto">
          <SettingsTab href={`/shops/${slug}/admin/settings`} label="כללי" />
          <SettingsTab href={`/shops/${slug}/admin/settings/tracking`} label="Tracking" />
          <SettingsTab href={`/shops/${slug}/admin/settings/checkout`} label="Checkout" />
          <SettingsTab href={`/shops/${slug}/admin/settings/shipping`} label="משלוח" active />
          <SettingsTab href={`/shops/${slug}/admin/settings/notifications`} label="התראות" />
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
      className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active
          ? 'border-black text-black'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </Link>
  );
}


