/**
 * Automations Admin Page
 * Server Component - fast load, no client JS
 */

import { db } from '@/lib/db';
import { automations, stores } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { createDefaultAutomations } from '@/lib/automations';
import { getEmailQuotaStatus } from '@/lib/email-packages';
import AutomationsClient from './automations-client';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AutomationsPage({ params }: PageProps) {
  const { slug } = await params;

  // Get store
  const store = await db
    .select({ 
      id: stores.id, 
      name: stores.name,
      settings: stores.settings,
      crmTags: stores.crmTags,
    })
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);

  if (store.length === 0) {
    notFound();
  }

  // Create default automations if none exist
  await createDefaultAutomations(store[0].id);

  // Get all automations (handle case when table doesn't exist)
  let storeAutomations: typeof automations.$inferSelect[] = [];
  try {
    storeAutomations = await db
      .select()
      .from(automations)
      .where(eq(automations.storeId, store[0].id))
      .orderBy(desc(automations.createdAt));
  } catch {
    // Table might not exist yet
    console.log('[Automations] Table not ready yet');
  }

  // Check if CRM plugin is enabled
  const settings = store[0].settings as Record<string, unknown> || {};
  const plugins = (settings.plugins as string[]) || [];
  const hasCrmPlugin = plugins.includes('crm');

  // Get customer tags for action config
  const customerTags = (store[0].crmTags as Array<{id: string; label: string; color: string}>) || [];

  // Get email quota status
  let emailQuotaStatus = null;
  try {
    emailQuotaStatus = await getEmailQuotaStatus(store[0].id);
  } catch {
    console.log('[Automations] Email quota table not ready yet');
  }

  // Check if any automation uses send_email
  const hasEmailAutomations = storeAutomations.some(a => a.actionType === 'send_email' && a.isActive);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">אוטומציות</h1>
          <p className="text-sm text-slate-500 mt-1">
            הגדר אוטומציות &quot;אם זה אז זה&quot; להפעלה אוטומטית על בסיס אירועים
          </p>
        </div>
      </div>

      {/* Email Quota Status Banner */}
      {emailQuotaStatus && (
        <div className={`rounded-2xl border p-4 ${
          !emailQuotaStatus.hasPackage
            ? 'bg-amber-50 border-amber-200'
            : emailQuotaStatus.percentUsed >= 90
            ? 'bg-red-50 border-red-200'
            : emailQuotaStatus.percentUsed >= 75
            ? 'bg-amber-50 border-amber-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                !emailQuotaStatus.hasPackage
                  ? 'bg-amber-100'
                  : emailQuotaStatus.percentUsed >= 90
                  ? 'bg-red-100'
                  : emailQuotaStatus.percentUsed >= 75
                  ? 'bg-amber-100'
                  : 'bg-emerald-100'
              }`}>
                {!emailQuotaStatus.hasPackage ? '📧' : emailQuotaStatus.percentUsed >= 90 ? '🚨' : '✉️'}
              </div>
              <div>
                {!emailQuotaStatus.hasPackage ? (
                  <>
                    <h4 className="font-medium text-slate-900">אין חבילת דיוור פעילה</h4>
                    <p className="text-sm text-slate-600">
                      {hasEmailAutomations 
                        ? 'יש לך אוטומציות שליחת מייל פעילות. רכוש חבילת דיוור כדי שהן יפעלו.'
                        : 'רכוש חבילת דיוור כדי להפעיל אוטומציות עם שליחת מיילים.'}
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="font-medium text-slate-900">
                      מכסת דיוור: {emailQuotaStatus.emailsRemaining.toLocaleString()} מיילים נותרו
                    </h4>
                    <p className="text-sm text-slate-600">
                      {emailQuotaStatus.packageName} • {emailQuotaStatus.emailsUsed.toLocaleString()} / {emailQuotaStatus.emailsLimit.toLocaleString()} ({emailQuotaStatus.percentUsed}%)
                    </p>
                  </>
                )}
              </div>
            </div>
            <Link
              href={`/shops/${slug}/admin/settings/email`}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                !emailQuotaStatus.hasPackage || emailQuotaStatus.percentUsed >= 75
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {!emailQuotaStatus.hasPackage ? 'רכוש חבילה' : emailQuotaStatus.percentUsed >= 75 ? 'שדרג חבילה' : 'נהל חבילה'}
            </Link>
          </div>
          
          {/* Progress bar for active packages */}
          {emailQuotaStatus.hasPackage && (
            <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  emailQuotaStatus.percentUsed >= 90 ? 'bg-red-500' :
                  emailQuotaStatus.percentUsed >= 75 ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, emailQuotaStatus.percentUsed)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="8" width="14" height="12" rx="2"/>
              <path d="M9 8V6a3 3 0 016 0v2"/>
              <circle cx="9" cy="13" r="1.5" fill="currentColor"/>
              <circle cx="15" cy="13" r="1.5" fill="currentColor"/>
              <path d="M10 17h4"/>
              <path d="M2 12h3"/>
              <path d="M19 12h3"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">איך זה עובד?</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              אוטומציות מאפשרות לך להגדיר פעולות אוטומטיות שיקרו כשאירוע מסוים מתרחש. 
              לדוגמה: שליחת מייל אוטומטי כשלקוח נוטש עגלה, או הוספת תגית כשהזמנה שולמה.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg text-xs text-slate-600 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                שליחת אימייל
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg text-xs text-slate-600 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                שינוי סטטוס
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg text-xs text-slate-600 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                הוספת תגית
              </span>
              {hasCrmPlugin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg text-xs text-slate-600 border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  יצירת משימה (CRM)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Automations List */}
      <AutomationsClient 
        automations={storeAutomations}
        slug={slug}
        hasCrmPlugin={hasCrmPlugin}
        customerTags={customerTags}
      />
    </div>
  );
}

