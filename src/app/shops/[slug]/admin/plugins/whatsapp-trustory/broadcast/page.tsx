/**
 * WhatsApp Broadcast Page
 * 
 * דף דיוור - שליחת הודעות לרשימת אנשי קשר
 */

import { db } from '@/lib/db';
import { stores, storePlugins } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, ChevronRight, Settings } from 'lucide-react';
import { BroadcastForm } from './broadcast-form';
import { getWhatsAppStats } from '../actions';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BroadcastPage({ params }: PageProps) {
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

  // Get plugin config
  const [plugin] = await db
    .select()
    .from(storePlugins)
    .where(
      and(
        eq(storePlugins.storeId, store.id),
        eq(storePlugins.pluginSlug, 'whatsapp-trustory')
      )
    )
    .limit(1);

  if (!plugin) {
    notFound();
  }

  const config = plugin.config as { token?: string; instanceId?: string; enabled?: boolean };
  const isConfigured = !!(config.token && config.instanceId);

  // Redirect to settings if not configured
  if (!isConfigured) {
    redirect(`/shops/${slug}/admin/plugins/whatsapp-trustory`);
  }

  // Get stats
  const stats = await getWhatsAppStats(store.id);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link 
          href={`/shops/${slug}/admin/plugins/whatsapp-trustory`}
          className="hover:text-gray-700 flex items-center gap-1"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp דיוור
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">שליחת דיוור</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">שליחת דיוור</h1>
          <p className="text-gray-500">שלח הודעות WhatsApp לאנשי קשר נבחרים</p>
        </div>

        <Link
          href={`/shops/${slug}/admin/plugins/whatsapp-trustory`}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-4 h-4" />
          הגדרות
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700">{stats.totalCustomersWithPhone}</p>
            <p className="text-sm text-green-600">לקוחות (אישרו דיוור)</p>
          </div>
          <div className="w-px h-12 bg-green-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700">{stats.newsletterCount}</p>
            <p className="text-sm text-green-600">ניוזלטר</p>
          </div>
          <div className="w-px h-12 bg-green-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700">{stats.clubMemberCount}</p>
            <p className="text-sm text-green-600">חברי מועדון</p>
          </div>
          <div className="w-px h-12 bg-green-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700">{stats.totalContactsWithPhone}</p>
            <p className="text-sm text-green-600">סה"כ אנשי קשר</p>
          </div>
        </div>
      </div>

      {/* Legal Notice */}
      <div className="bg-amber-50 rounded-lg border border-amber-200 p-3 flex items-start gap-3">
        <span className="text-amber-600 text-lg">⚠️</span>
        <div className="text-sm text-amber-800">
          <p>
            <strong>מניעת ספאם:</strong> QuickShop עושה את המירב למנוע ספאם - 
            <span className="font-semibold">לא ניתן לשלוח הודעות ללקוחות שלא אישרו דיוור.</span>
          </p>
          <p className="mt-1 text-amber-700">
            QuickShop ו-True Story אינן אחראיות לתוכן ההודעות - האחריות על בעל החנות בלבד.
          </p>
        </div>
      </div>

      {/* Broadcast Form */}
      <BroadcastForm 
        storeId={store.id} 
        storeSlug={slug}
        storeName={store.name}
      />
    </div>
  );
}

