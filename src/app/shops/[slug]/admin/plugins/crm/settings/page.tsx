import { getStoreBySlug } from '@/lib/db/queries';
import { notFound, redirect } from 'next/navigation';
import { getStorePlugin } from '@/lib/plugins/loader';
import { TagsSettings } from './tags-settings';
import { CrmNav } from '../crm-nav';

// ============================================
// CRM Plugin - Settings Page
// Manage CRM tags and configuration
// ============================================

interface SettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CRMSettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }

  // Check if plugin is installed
  const plugin = await getStorePlugin(store.id, 'crm');
  if (!plugin || !plugin.isActive) {
    redirect(`/shops/${slug}/admin/plugins?install=crm`);
  }

  // Get CRM tags for this store
  const crmTags = (store.crmTags as Array<{
    id: string;
    label: string;
    color: string;
    isDefault?: boolean;
  }>) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">מערכת CRM</h1>
        <p className="text-gray-500">ניהול תגיות והגדרות</p>
      </div>

      {/* Navigation */}
      <CrmNav storeSlug={slug} />

      <div className="max-w-3xl">
        <TagsSettings 
          storeId={store.id} 
          storeSlug={slug}
          initialTags={crmTags} 
        />
      </div>
    </div>
  );
}
