/**
 * Catalog Mode Plugin Settings
 * 
 * ⚡ Server Component for initial data load
 * 📦 Settings page for catalog mode - hide cart and checkout
 */

import { db } from '@/lib/db';
import { stores, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { getStorePlugin } from '@/lib/plugins/loader';
import { getPluginDefinition } from '@/lib/plugins/registry';
import { CatalogModeSettings } from './catalog-mode-settings';
import { BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function CatalogModePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Get store
  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);

  if (!store) {
    notFound();
  }

  // Check if plugin is installed
  const plugin = await getStorePlugin(store.id, 'catalog-mode');
  
  if (!plugin) {
    // Plugin not installed - redirect to marketplace
    redirect(`/shops/${slug}/admin/plugins`);
  }

  const pluginDefinition = getPluginDefinition('catalog-mode');

  // Get config with defaults
  const defaultConfig = pluginDefinition?.defaultConfig || {};
  const config = {
    ...defaultConfig,
    ...(plugin.config as Record<string, unknown>),
  };

  // Fetch store categories
  const storeCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categories)
    .where(eq(categories.storeId, store.id));

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link 
          href={`/shops/${slug}/admin/plugins`}
          className="hover:text-gray-700 transition-colors"
        >
          תוספים
        </Link>
        <ArrowRight className="w-4 h-4 rotate-180" />
        <span className="text-gray-900 font-medium">מצב קטלוג</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">מצב קטלוג</h1>
            <p className="text-gray-500">
              הפוך את החנות לקטלוג דיגיטלי - ללא עגלה ורכישה
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`
          px-4 py-2 rounded-lg font-medium text-sm
          ${config.enabled
            ? 'bg-blue-100 text-blue-700' 
            : 'bg-gray-100 text-gray-600'
          }
        `}>
          {config.enabled ? 'פעיל' : 'לא פעיל'}
        </div>
      </div>

      {/* Main Content */}
      <CatalogModeSettings 
        storeId={store.id}
        storeSlug={slug}
        initialConfig={config as Record<string, unknown>}
        categories={storeCategories}
      />
    </div>
  );
}
