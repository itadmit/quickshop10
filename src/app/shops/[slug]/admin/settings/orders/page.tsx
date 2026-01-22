import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';
import { CustomStatusesForm } from './custom-statuses-form';

// ============================================
// Order Settings Page - Custom Statuses
// ============================================

interface OrderSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function OrderSettingsPage({ params }: OrderSettingsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get existing custom statuses
  const customStatuses = (store.customOrderStatuses as Array<{
    id: string;
    name: string;
    color: string;
  }>) || [];

  return (
    <SettingsWrapper storeSlug={slug} activeTab="orders">
      <CustomStatusesForm 
        storeId={store.id} 
        storeSlug={slug}
        initialStatuses={customStatuses} 
      />
    </SettingsWrapper>
  );
}

