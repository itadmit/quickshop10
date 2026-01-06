import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { paymentProviders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAvailableProviders } from '@/lib/payments/provider-info';
import { PaymentProvidersManager } from './providers-manager';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';

// ============================================
// Payment Settings Page - Server Component
// Follows REQUIREMENTS.md: Server Component, no JS
// ============================================

interface PaymentsSettingsPageProps {
  params: Promise<{ slug: string }>;
}

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
    <SettingsWrapper storeSlug={slug} activeTab="payments">
      <PaymentProvidersManager 
        storeId={store.id}
        storeSlug={slug}
        configuredProviders={configuredProviders}
        availableProviders={availableProviders}
      />
    </SettingsWrapper>
  );
}
