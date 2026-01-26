/**
 * WhatsApp Trustory Plugin - Settings Page
 * 
 * דף הגדרות התוסף - Token + Instance ID
 */

import { db } from '@/lib/db';
import { stores, storePlugins } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, Send, Settings, Users, ChevronLeft } from 'lucide-react';
import { WhatsAppSettingsForm } from './settings-form';
import { getWhatsAppStats } from './actions';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WhatsAppTrustoryPage({ params }: PageProps) {
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

  // Get stats
  const stats = await getWhatsAppStats(store.id);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp דיוור</h1>
            <p className="text-gray-500">שליחת הודעות WhatsApp דרך True Story API</p>
          </div>
        </div>

        {isConfigured && (
          <Link
            href={`/shops/${slug}/admin/plugins/whatsapp-trustory/broadcast`}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
          >
            <Send className="w-5 h-5" />
            שלח דיוור
          </Link>
        )}
      </div>

      {/* Quick Stats */}
      {isConfigured && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomersWithPhone}</p>
                <p className="text-sm text-gray-500">לקוחות (אישרו דיוור)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalContactsWithPhone}</p>
                <p className="text-sm text-gray-500">אנשי קשר</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.newsletterCount}</p>
                <p className="text-sm text-gray-500">ניוזלטר</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.clubMemberCount}</p>
                <p className="text-sm text-gray-500">חברי מועדון</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-500" />
          הגדרות חיבור
        </h2>

        <WhatsAppSettingsForm
          storeId={store.id}
          storeSlug={slug}
          initialConfig={{
            token: config.token || '',
            instanceId: config.instanceId || '',
            enabled: config.enabled ?? false,
          }}
        />
      </div>

      {/* True Story Registration */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
        <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
          <span>🚀</span>
          עדיין אין לך חשבון True Story?
        </h3>
        <p className="text-sm text-green-800 mb-4">
          True Story מספקת שירות שליחת הודעות WhatsApp באמצעות סריקת QR. 
          התשלום מתבצע ישירות מולם לפי חבילת ההודעות שתבחר.
        </p>
        <a
          href="https://true-story.net/register"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          הרשמה ל-True Story
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Help */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 mb-2">איך מקבלים Token ו-Instance ID?</h3>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>היכנס לחשבון שלך ב-<a href="https://true-story.net" target="_blank" rel="noopener" className="underline">True Story</a></li>
          <li>עבור ל-Dashboard → API Access</li>
          <li>צור Token חדש (או העתק קיים)</li>
          <li>העתק את ה-Instance ID מעמוד ה-Instances</li>
          <li>הדבק כאן ושמור</li>
        </ol>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
        <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
          <span>⚠️</span>
          אחריות ותנאי שימוש
        </h3>
        <div className="text-sm text-amber-800 space-y-2">
          <p>
            <strong>חוק הספאם:</strong> על פי חוק התקשורת (בזק ושידורים), תיקון מס' 40, 
            שליחת הודעות שיווקיות מותרת רק לאנשים שנתנו הסכמה מפורשת.
          </p>
          <p>
            <strong>הגבלת אחריות:</strong> QuickShop ו-True Story אינן אחראיות לתוכן ההודעות הנשלחות. 
            כל האחריות לתוכן ולעמידה בחוקי הספאם מוטלת על בעל החנות בלבד.
          </p>
          <p>
            <strong>מניעת ספאם:</strong> QuickShop עושה את המירב למנוע שליחת ספאם - 
            <span className="font-semibold"> לא ניתן לשלוח הודעות ללקוחות שלא אישרו קבלת דיוור.</span> 
            המערכת מציגה רק אנשי קשר שנרשמו לניוזלטר, מועדון לקוחות, או סימנו "אישור קבלת עדכונים" בצ'קאאוט.
          </p>
        </div>
      </div>
    </div>
  );
}

