import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';
import { AdvancedSettingsForm } from './advanced-form';

interface AdvancedSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdvancedSettingsPage({ params }: AdvancedSettingsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  return (
    <SettingsWrapper storeSlug={slug} activeTab="advanced">
      <AdvancedSettingsForm storeSlug={slug} storeName={store.name} />
    </SettingsWrapper>
  );
}

