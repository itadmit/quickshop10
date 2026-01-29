import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';
import { ApiSettingsForm } from './api-settings-form';

// ============================================
// API Settings Page - Server Component
// Follows REQUIREMENTS.md: Server Component, no JS
// ============================================

interface ApiSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ApiSettingsPage({ params }: ApiSettingsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get API keys
  const storeApiKeysRaw = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.storeId, store.id))
    .orderBy(desc(apiKeys.createdAt));

  // Map to correct types (scopes from DB is unknown, cast to string[])
  const storeApiKeys = storeApiKeysRaw.map(key => ({
    ...key,
    scopes: (key.scopes as string[]) || [],
  }));

  return (
    <SettingsWrapper storeSlug={slug} activeTab="api">
      <ApiSettingsForm 
        storeId={store.id}
        storeSlug={slug}
        apiKeys={storeApiKeys}
      />
    </SettingsWrapper>
  );
}
