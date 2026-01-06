import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { ShippingSettingsForm } from './shipping-form';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';

// ============================================
// Shipping Settings Page - Server Component
// Follows REQUIREMENTS.md: Server Component, no JS
// ============================================

interface ShippingSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ShippingSettingsPage({ params }: ShippingSettingsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const settings = (store.settings as Record<string, unknown>) || {};
  const shippingSettings = (settings.shipping as Record<string, unknown>) || {};

  return (
    <SettingsWrapper storeSlug={slug} activeTab="shipping">
      <ShippingSettingsForm storeId={store.id} settings={shippingSettings} />
    </SettingsWrapper>
  );
}
