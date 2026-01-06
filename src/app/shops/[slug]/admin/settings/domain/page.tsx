import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { DomainForm } from './domain-form';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';

// ============================================
// Domain Settings Page - Server Component
// Follows REQUIREMENTS.md: Server Component, no JS
// ============================================

interface DomainSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DomainSettingsPage({ params }: DomainSettingsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  return (
    <SettingsWrapper storeSlug={slug} activeTab="domain">
      <DomainForm 
        storeId={store.id}
        storeSlug={slug}
        currentDomain={store.customDomain}
      />
    </SettingsWrapper>
  );
}
