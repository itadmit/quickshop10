import { getStoreBySlug } from '@/lib/db/queries';
import { notFound, redirect } from 'next/navigation';
import { getStorePlugin } from '@/lib/plugins/loader';
import Link from 'next/link';
import { TagsSettings } from './tags-settings';

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/shops/${slug}/admin/plugins/crm`}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">הגדרות CRM</h1>
                <p className="text-sm text-gray-500">ניהול תגיות והגדרות</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-3xl mx-auto">
        <TagsSettings 
          storeId={store.id} 
          storeSlug={slug}
          initialTags={crmTags} 
        />
      </div>
    </div>
  );
}

