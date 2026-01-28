/**
 * Email Settings Page - הגדרות דיוור
 * Server Component - מציג חבילות דיוור ומכסה נוכחית
 */

import { db } from '@/lib/db';
import { stores, storeEmailSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getEmailQuotaStatus, getEmailPackages } from '@/lib/email-packages';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';
import EmailSettingsClient from './email-settings-client';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EmailSettingsPage({ params }: PageProps) {
  const { slug } = await params;

  // Get store
  const store = await db
    .select({ id: stores.id, name: stores.name })
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);

  if (store.length === 0) {
    notFound();
  }

  // Get current email quota status
  const quotaStatus = await getEmailQuotaStatus(store[0].id);
  
  // Get all available packages
  const packages = await getEmailPackages();

  // Get subscription details if exists
  let subscription = null;
  if (quotaStatus.hasPackage) {
    const [sub] = await db
      .select()
      .from(storeEmailSubscriptions)
      .where(eq(storeEmailSubscriptions.storeId, store[0].id))
      .limit(1);
    subscription = sub;
  }

  return (
    <SettingsWrapper storeSlug={slug} activeTab="email">
      <EmailSettingsClient
        slug={slug}
        storeId={store[0].id}
        quotaStatus={quotaStatus}
        packages={packages}
        subscription={subscription}
      />
    </SettingsWrapper>
  );
}

