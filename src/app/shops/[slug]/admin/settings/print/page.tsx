import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { PrintSettingsForm } from './print-form';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';

// ============================================
// Print Settings Page - Server Component
// ============================================

interface PrintSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PrintSettingsPage({ params }: PrintSettingsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const settings = (store.settings as Record<string, unknown>) || {};
  const printSettings = (settings.print as Record<string, unknown>) || {};

  return (
    <SettingsWrapper storeSlug={slug} activeTab="print">
      <PrintSettingsForm storeId={store.id} settings={printSettings} />
    </SettingsWrapper>
  );
}

