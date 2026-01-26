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
import { MessageCircle, Send, Settings, Users, ExternalLink, HelpCircle, AlertTriangle } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">WhatsApp דיוור</h1>
          <p className="text-slate-500">שליחת הודעות WhatsApp דרך True Story API</p>
        </div>

        {isConfigured && (
          <Link
            href={`/shops/${slug}/admin/plugins/whatsapp-trustory/broadcast`}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium"
          >
            <Send className="w-4 h-4" />
            שלח דיוור
          </Link>
        )}
      </div>

      {/* Quick Stats */}
      {isConfigured && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalCustomersWithPhone}</p>
                <p className="text-sm text-slate-500">לקוחות</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalContactsWithPhone}</p>
                <p className="text-sm text-slate-500">אנשי קשר</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <Send className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.newsletterCount}</p>
                <p className="text-sm text-slate-500">ניוזלטר</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.clubMemberCount}</p>
                <p className="text-sm text-slate-500">חברי מועדון</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form - Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-400" />
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

          {/* Legal Notice */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-slate-400" />
              אחריות ותנאי שימוש
            </h3>
            <div className="text-sm text-slate-600 space-y-3">
              <p>
                <span className="font-medium text-slate-800">חוק הספאם:</span> על פי חוק התקשורת (בזק ושידורים), תיקון מס' 40, 
                שליחת הודעות שיווקיות מותרת רק לאנשים שנתנו הסכמה מפורשת.
              </p>
              <p>
                <span className="font-medium text-slate-800">הגבלת אחריות:</span> QuickShop ו-True Story אינן אחראיות לתוכן ההודעות הנשלחות. 
                כל האחריות לתוכן ולעמידה בחוקי הספאם מוטלת על בעל החנות בלבד.
              </p>
              <p>
                <span className="font-medium text-slate-800">מניעת ספאם:</span> QuickShop עושה את המירב למנוע שליחת ספאם - 
                <span className="font-semibold text-slate-900"> לא ניתן לשלוח הודעות ללקוחות שלא אישרו קבלת דיוור.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* True Story Link */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-2">אין לך חשבון True Story?</h3>
            <p className="text-sm text-slate-500 mb-4">
              True Story מספקת שירות שליחת הודעות WhatsApp. התשלום מתבצע ישירות מולם.
            </p>
            <a
              href="https://true-story.net/user/login"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              כניסה / הרשמה
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Help */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-slate-400" />
              איך מקבלים Token ו-Instance ID?
            </h3>
            <ol className="text-sm text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-xs font-medium text-slate-600 shrink-0 mt-0.5">1</span>
                <span>היכנס לחשבון שלך ב-<a href="https://true-story.net" target="_blank" rel="noopener" className="text-slate-900 underline underline-offset-2">True Story</a></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-xs font-medium text-slate-600 shrink-0 mt-0.5">2</span>
                <span>עבור ל-Dashboard → API Access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-xs font-medium text-slate-600 shrink-0 mt-0.5">3</span>
                <span>צור Token חדש (או העתק קיים)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-xs font-medium text-slate-600 shrink-0 mt-0.5">4</span>
                <span>העתק את ה-Instance ID מעמוד ה-Instances</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-xs font-medium text-slate-600 shrink-0 mt-0.5">5</span>
                <span>הדבק כאן ושמור</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

