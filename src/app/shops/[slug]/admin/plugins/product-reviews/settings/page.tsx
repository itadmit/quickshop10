/**
 * Product Reviews Settings Page
 * 
 * Configure review settings: moderation, text requirements, media limits
 */

import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { storePlugins } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ReviewSettingsForm } from './review-settings-form';
import { getPluginDefinition } from '@/lib/plugins/registry';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ReviewSettingsPage({ params }: PageProps) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) return <div>חנות לא נמצאה</div>;

  // Get current plugin config
  const [plugin] = await db
    .select()
    .from(storePlugins)
    .where(and(
      eq(storePlugins.storeId, store.id),
      eq(storePlugins.pluginSlug, 'product-reviews')
    ))
    .limit(1);

  const defaultConfig = getPluginDefinition('product-reviews')?.defaultConfig || {};
  const config = plugin?.config || defaultConfig;

  return (
    <div className="p-6 max-w-3xl">
      {/* Back Link */}
      <Link
        href={`/shops/${slug}/admin/plugins/product-reviews`}
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowRight className="w-4 h-4" />
        חזרה לרשימת הביקורות
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">הגדרות ביקורות</h1>
        <p className="text-gray-500 text-sm mt-1">
          הגדר איך לקוחות יכולים לכתוב ביקורות ואיך הן מוצגות
        </p>
      </div>

      <ReviewSettingsForm 
        storeId={store.id}
        storeSlug={slug}
        initialConfig={config as Record<string, unknown>}
      />
    </div>
  );
}

