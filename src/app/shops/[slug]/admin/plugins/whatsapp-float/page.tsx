/**
 * WhatsApp Float Button Plugin Settings
 * 
 * ⚡ Server Component for initial data load
 * 🎨 Simple settings page for WhatsApp floating button
 */

import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { getStorePlugin } from '@/lib/plugins/loader';
import { getPluginDefinition } from '@/lib/plugins/registry';
import { WhatsAppFloatSettings } from './whatsapp-float-settings';
import { MessageCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function WhatsAppFloatPage({
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
  const plugin = await getStorePlugin(store.id, 'whatsapp-float');
  
  if (!plugin) {
    // Plugin not installed - redirect to marketplace
    redirect(`/shops/${slug}/admin/plugins`);
  }

  const pluginDefinition = getPluginDefinition('whatsapp-float');

  // Get config with defaults
  const defaultConfig = pluginDefinition?.defaultConfig || {};
  const config = {
    ...defaultConfig,
    ...(plugin.config as Record<string, unknown>),
  };

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
        <span className="text-gray-900 font-medium">כפתור וואטסאפ</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">כפתור וואטסאפ צף</h1>
            <p className="text-gray-500">
              כפתור וואטסאפ צף בפינת המסך עם הודעה מותאמת
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`
          px-4 py-2 rounded-lg font-medium text-sm
          ${config.enabled && config.phoneNumber
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-600'
          }
        `}>
          {config.enabled && config.phoneNumber ? 'פעיל' : 'לא פעיל'}
        </div>
      </div>

      {/* Main Content */}
      <WhatsAppFloatSettings 
        storeId={store.id}
        storeSlug={slug}
        initialConfig={config as Record<string, unknown>}
      />
    </div>
  );
}
