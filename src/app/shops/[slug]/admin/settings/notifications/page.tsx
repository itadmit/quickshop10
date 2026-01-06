import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { NotificationsSettingsForm } from './notifications-form';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';

// ============================================
// Notifications Settings Page - Server Component
// Follows REQUIREMENTS.md: Server Component, no JS
// ============================================

interface NotificationsSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NotificationsSettingsPage({ params }: NotificationsSettingsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const settings = (store.settings as Record<string, unknown>) || {};
  const notificationSettings = (settings.notifications as Record<string, unknown>) || {};

  return (
    <SettingsWrapper storeSlug={slug} activeTab="notifications">
      <NotificationsSettingsForm 
        storeId={store.id} 
        settings={notificationSettings}
        defaultEmail={(settings.contactEmail as string) || ''} 
      />
    </SettingsWrapper>
  );
}
