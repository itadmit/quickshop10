import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { SeoSettingsForm } from './seo-form';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';

// ============================================
// SEO Settings Page - Server Component
// Follows REQUIREMENTS.md: Server Component, no JS
// ============================================

interface SeoSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SeoSettingsPage({ params }: SeoSettingsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const seoSettings = (store.seoSettings as Record<string, unknown>) || {};

  return (
    <SettingsWrapper storeSlug={slug} activeTab="seo">
      <SeoSettingsForm 
        store={{
          id: store.id,
          name: store.name,
          slug: store.slug,
          logoUrl: store.logoUrl,
          customDomain: store.customDomain,
        }} 
        seoSettings={seoSettings} 
      />
    </SettingsWrapper>
  );
}








