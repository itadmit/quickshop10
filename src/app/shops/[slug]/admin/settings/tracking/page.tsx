import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { TrackingSettingsForm } from './tracking-form';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';

// ============================================
// Tracking Settings Page - Server Component
// Follows REQUIREMENTS.md: Server Component, no JS
// ============================================

interface TrackingSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TrackingSettingsPage({ params }: TrackingSettingsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const settings = (store.settings as Record<string, unknown>) || {};

  return (
    <SettingsWrapper storeSlug={slug} activeTab="tracking">
      <TrackingSettingsForm storeId={store.id} storeSlug={slug} settings={settings} />
    </SettingsWrapper>
  );
}
