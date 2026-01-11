/**
 * Platform Settings Admin Page
 * ניהול הגדרות פלטפורמה - מחירים, עמלות ותוספים
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { platformSettings, pluginPricing, users } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { PlatformSettingsForm } from './settings-form';
import { PluginPricingForm } from './plugin-pricing-form';
import { Settings, CreditCard, Puzzle, ArrowLeft, DollarSign, Percent } from 'lucide-react';

export default async function PlatformSettingsPage() {
  const session = await auth();
  
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    redirect('/login');
  }

  // Get all platform settings
  const settings = await db
    .select()
    .from(platformSettings)
    .orderBy(platformSettings.category, platformSettings.key);

  // Group settings by category
  const settingsByCategory: Record<string, typeof settings> = {};
  for (const setting of settings) {
    if (!settingsByCategory[setting.category]) {
      settingsByCategory[setting.category] = [];
    }
    settingsByCategory[setting.category].push(setting);
  }

  // Get plugin pricing
  const pluginPrices = await db
    .select()
    .from(pluginPricing)
    .orderBy(pluginPricing.pluginSlug);

  const categoryLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    subscription: { label: 'מחירי מנויים', icon: <CreditCard className="w-5 h-5" /> },
    fees: { label: 'עמלות ומיסים', icon: <Percent className="w-5 h-5" /> },
    general: { label: 'כללי', icon: <Settings className="w-5 h-5" /> },
  };

  const settingLabels: Record<string, { label: string; suffix?: string; type?: 'currency' | 'percent' | 'number' }> = {
    subscription_branding_price: { label: 'מחיר מסלול תדמית', suffix: '₪/חודש', type: 'currency' },
    subscription_quickshop_price: { label: 'מחיר מסלול קוויק שופ', suffix: '₪/חודש', type: 'currency' },
    subscription_trial_days: { label: 'ימי נסיון', suffix: 'ימים', type: 'number' },
    transaction_fee_rate: { label: 'עמלת עסקאות', suffix: '%', type: 'percent' },
    vat_rate: { label: 'אחוז מע"מ', suffix: '%', type: 'percent' },
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-display text-xl tracking-[0.3em] uppercase">
              QuickShop
            </Link>
            <span className="px-2 py-1 bg-white/20 text-xs rounded">Platform Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/60">{session.user.email}</span>
            <Link href="/logout" className="text-sm text-white/60 hover:text-white">
              התנתק
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <Link href="/admin" className="py-4 text-sm text-gray-600 hover:text-black">
              סקירה
            </Link>
            <Link href="/admin/stores" className="py-4 text-sm text-gray-600 hover:text-black">
              חנויות
            </Link>
            <Link href="/admin/users" className="py-4 text-sm text-gray-600 hover:text-black">
              משתמשים
            </Link>
            <Link href="/admin/billing" className="py-4 text-sm text-gray-600 hover:text-black">
              חיובים
            </Link>
            <Link href="/admin/settings" className="py-4 text-sm font-medium border-b-2 border-black">
              הגדרות
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="w-7 h-7" />
              הגדרות פלטפורמה
            </h1>
            <p className="text-gray-500 mt-1">ניהול מחירי מנויים, עמלות ותוספים</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Platform Settings */}
          {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
            <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                {categoryLabels[category]?.icon || <Settings className="w-5 h-5" />}
                <h2 className="font-semibold text-gray-900">
                  {categoryLabels[category]?.label || category}
                </h2>
              </div>
              <div className="p-6">
                <PlatformSettingsForm 
                  settings={categorySettings.map(s => ({
                    key: s.key,
                    value: s.value as string | number,
                    description: s.description,
                    label: settingLabels[s.key]?.label || s.key,
                    suffix: settingLabels[s.key]?.suffix,
                    type: settingLabels[s.key]?.type || 'number',
                  }))}
                />
              </div>
            </div>
          ))}

          {/* If no settings in DB yet, show defaults */}
          {settings.length === 0 && (
            <>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                  <CreditCard className="w-5 h-5" />
                  <h2 className="font-semibold text-gray-900">מחירי מנויים</h2>
                </div>
                <div className="p-6">
                  <PlatformSettingsForm 
                    settings={[
                      { key: 'subscription_branding_price', value: 299, label: 'מחיר מסלול תדמית', suffix: '₪/חודש', type: 'currency' },
                      { key: 'subscription_quickshop_price', value: 399, label: 'מחיר מסלול קוויק שופ', suffix: '₪/חודש', type: 'currency' },
                      { key: 'subscription_trial_days', value: 7, label: 'ימי נסיון', suffix: 'ימים', type: 'number' },
                    ]}
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                  <Percent className="w-5 h-5" />
                  <h2 className="font-semibold text-gray-900">עמלות ומיסים</h2>
                </div>
                <div className="p-6">
                  <PlatformSettingsForm 
                    settings={[
                      { key: 'transaction_fee_rate', value: 0.5, label: 'עמלת עסקאות', suffix: '%', type: 'percent' },
                      { key: 'vat_rate', value: 18, label: 'אחוז מע"מ', suffix: '%', type: 'percent' },
                    ]}
                  />
                </div>
              </div>
            </>
          )}

          {/* Plugin Pricing */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
              <Puzzle className="w-5 h-5" />
              <h2 className="font-semibold text-gray-900">מחירי תוספים</h2>
            </div>
            <div className="p-6">
              <PluginPricingForm plugins={pluginPrices.map(p => ({
                slug: p.pluginSlug,
                monthlyPrice: Number(p.monthlyPrice),
                trialDays: p.trialDays || 14,
                isActive: p.isActive,
              }))} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

