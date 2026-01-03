/**
 * Product Stories Plugin Settings
 * 
 * ⚡ Server Component for initial data load
 * 🎨 UI like Instagram Stories management
 */

import { db } from '@/lib/db';
import { stores, storePlugins, productStories, products, productImages } from '@/lib/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { isPluginActive, getStorePlugin } from '@/lib/plugins/loader';
import { getPluginDefinition } from '@/lib/plugins/registry';
import { StoriesSettings } from './stories-settings';
import { PlayCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function ProductStoriesPage({
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
  const plugin = await getStorePlugin(store.id, 'product-stories');
  
  if (!plugin) {
    // Plugin not installed - redirect to marketplace
    redirect(`/shops/${slug}/admin/plugins`);
  }

  const pluginDefinition = getPluginDefinition('product-stories');

  // Get stories with products
  const storiesData = await db
    .select({
      id: productStories.id,
      productId: productStories.productId,
      position: productStories.position,
      isActive: productStories.isActive,
      viewsCount: productStories.viewsCount,
      likesCount: productStories.likesCount,
      commentsCount: productStories.commentsCount,
      productTitle: products.name,
      productHandle: products.slug,
      productPrice: products.price,
    })
    .from(productStories)
    .innerJoin(products, eq(productStories.productId, products.id))
    .where(eq(productStories.storeId, store.id))
    .orderBy(asc(productStories.position));

  // Get product images
  const productIds = storiesData.map(s => s.productId);
  const images = productIds.length > 0
    ? await db
        .select({
          productId: productImages.productId,
          url: productImages.url,
        })
        .from(productImages)
        .where(eq(productImages.isPrimary, true))
    : [];

  const imageMap = new Map(images.map(i => [i.productId, i.url]));

  const stories = storiesData.map(story => ({
    ...story,
    productImage: imageMap.get(story.productId) || null,
    productPrice: Number(story.productPrice),
  }));

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
        <span className="text-gray-900 font-medium">סטוריז מוצרים</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
            <PlayCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">סטוריז מוצרים</h1>
            <p className="text-gray-500">
              הצג מוצרים בפורמט סטוריז אינטראקטיבי
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`
          px-4 py-2 rounded-lg font-medium text-sm
          ${config.enabled 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-600'
          }
        `}>
          {config.enabled ? 'פעיל' : 'לא פעיל'}
        </div>
      </div>

      {/* Main Content */}
      <StoriesSettings 
        storeId={store.id}
        storeSlug={slug}
        initialConfig={config as Record<string, unknown>}
        initialStories={stories}
      />
    </div>
  );
}

