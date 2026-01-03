/**
 * Plugins Marketplace - חנות תוספים
 * 
 * ⚡ Server Component - טעינה מהירה
 * 🎨 UI כמו Shopify App Store
 */

import { Suspense } from 'react';
import { db } from '@/lib/db';
import { stores, storePlugins } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getPluginsWithStatus } from '@/lib/plugins/loader';
import { categoryLabels, categoryIcons } from '@/lib/plugins/registry';
import { PluginsGrid } from './plugins-grid';
import type { PluginCategory } from '@/lib/plugins/types';
import { 
  Megaphone, Crown, BarChart3, CreditCard, 
  Package, MessageCircle, Settings, Palette,
  Puzzle, Search
} from 'lucide-react';

// Map category to icon component
const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  Megaphone,
  Crown,
  BarChart3,
  CreditCard,
  Package,
  MessageCircle,
  Settings,
  Palette,
};

export default async function PluginsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // קבלת החנות
  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);

  if (!store) {
    notFound();
  }

  // קבלת כל התוספים עם סטטוס התקנה
  const plugins = await getPluginsWithStatus(store.id);

  // חישוב סטטיסטיקות
  const installedCount = plugins.filter(p => p.isInstalled).length;
  const freeCount = plugins.filter(p => p.isFree).length;
  const paidCount = plugins.filter(p => !p.isFree).length;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Puzzle className="w-7 h-7 text-gray-600" />
            חנות תוספים
          </h1>
          <p className="text-gray-500 mt-1">
            הוסף תכונות חדשות לחנות שלך
          </p>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="text-center px-4 py-2 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-700">{installedCount}</div>
            <div className="text-xs text-green-600">מותקנים</div>
          </div>
          <div className="text-center px-4 py-2 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-gray-700">{freeCount}</div>
            <div className="text-xs text-gray-600">חינמיים</div>
          </div>
          <div className="text-center px-4 py-2 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-700">{paidCount}</div>
            <div className="text-xs text-blue-600">פרימיום</div>
          </div>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(categoryLabels).map(([key, label]) => {
          const IconComponent = iconComponents[categoryIcons[key as PluginCategory]] || Puzzle;
          const count = plugins.filter(p => p.category === key).length;
          
          return (
            <button
              key={key}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <IconComponent className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">{label}</span>
              <span className="text-xs text-gray-400">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Plugins Grid */}
      <Suspense fallback={<PluginsGridSkeleton />}>
        <PluginsGrid plugins={plugins} storeSlug={slug} storeId={store.id} />
      </Suspense>
    </div>
  );
}

function PluginsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg" />
            <div className="flex-1">
              <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="h-12 bg-gray-100 rounded mb-4" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}


