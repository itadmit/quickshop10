import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { GDPRSettingsForm } from './gdpr-form';
import { type GDPRSettings, getDefaultGDPRSettings } from './types';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';

// ============================================
// GDPR Settings Page - Server Component
// Follows REQUIREMENTS.md: Server Component, no JS
// ============================================

interface GDPRPageProps {
  params: Promise<{ slug: string }>;
}

export default async function GDPRPage({ params }: GDPRPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const settings = (store.settings as Record<string, unknown>) || {};
  const gdprSettings = (settings.gdpr as GDPRSettings) || getDefaultGDPRSettings();

  return (
    <SettingsWrapper storeSlug={slug} activeTab="gdpr">
      <GDPRSettingsForm storeId={store.id} settings={gdprSettings} />
    </SettingsWrapper>
  );
}
