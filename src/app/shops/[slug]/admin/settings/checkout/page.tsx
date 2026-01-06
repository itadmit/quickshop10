import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { CheckoutSettingsForm } from './checkout-form';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';

// ============================================
// Checkout Settings Page - Server Component
// Follows REQUIREMENTS.md: Server Component, no JS
// ============================================

interface CheckoutSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CheckoutSettingsPage({ params }: CheckoutSettingsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const settings = (store.settings as Record<string, unknown>) || {};
  const checkoutSettings = (settings.checkout as Record<string, unknown>) || {};

  return (
    <SettingsWrapper storeSlug={slug} activeTab="checkout">
      <CheckoutSettingsForm storeId={store.id} settings={checkoutSettings} />
    </SettingsWrapper>
  );
}
