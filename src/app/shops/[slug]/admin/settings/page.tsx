import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { GeneralSettingsForm } from './general-form';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';

// ============================================
// General Settings Page - Server Component
// Follows REQUIREMENTS.md: Server Component, no JS
// ============================================

interface SettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const settings = (store.settings as Record<string, unknown>) || {};

  return (
    <SettingsWrapper storeSlug={slug} activeTab="general">
      <GeneralSettingsForm store={store} settings={settings} />
    </SettingsWrapper>
  );
}
