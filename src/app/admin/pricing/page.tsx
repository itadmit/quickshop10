/**
 * Platform Pricing Admin Page
 * ניהול מחירים, עמלות, חריגים ומשלמים
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { platformSettings, stores, storeSubscriptions } from '@/lib/db/schema';
import { eq, and, isNotNull, or, ne, desc } from 'drizzle-orm';
import Link from 'next/link';
import { PlatformSettingsForm } from '../settings/settings-form';
import { DollarSign, Percent, Users, AlertCircle, CreditCard, Store, Settings, CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PlatformPricingPage() {
  const session = await auth();
  
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    redirect('/login');
  }

  // Get platform settings for pricing
  const settings = await db
    .select()
    .from(platformSettings)
    .orderBy(platformSettings.key);

  // Filter only pricing-related settings
  const pricingSettings = settings.filter(s => 
    ['subscription_branding_price', 'subscription_quickshop_price', 'subscription_trial_days', 'transaction_fee_rate', 'vat_rate'].includes(s.key)
  );

  // Get stores with custom pricing (exceptions)
  const exceptions = await db
    .select({
      storeId: storeSubscriptions.storeId,
      storeName: stores.name,
      storeSlug: stores.slug,
      plan: storeSubscriptions.plan,
      status: storeSubscriptions.status,
      customMonthlyPrice: storeSubscriptions.customMonthlyPrice,
      customFeePercentage: storeSubscriptions.customFeePercentage,
    })
    .from(storeSubscriptions)
    .innerJoin(stores, eq(stores.id, storeSubscriptions.storeId))
    .where(
      or(
        isNotNull(storeSubscriptions.customMonthlyPrice),
        isNotNull(storeSubscriptions.customFeePercentage)
      )
    )
    .orderBy(stores.name);

  // Get active payers (stores with active subscriptions)
  const payers = await db
    .select({
      storeId: storeSubscriptions.storeId,
      storeName: stores.name,
      storeSlug: stores.slug,
      plan: storeSubscriptions.plan,
      status: storeSubscriptions.status,
      currentPeriodEnd: storeSubscriptions.currentPeriodEnd,
      customMonthlyPrice: storeSubscriptions.customMonthlyPrice,
      cardLastFour: storeSubscriptions.cardLastFour,
      cardBrand: storeSubscriptions.cardBrand,
    })
    .from(storeSubscriptions)
    .innerJoin(stores, eq(stores.id, storeSubscriptions.storeId))
    .where(eq(storeSubscriptions.status, 'active'))
    .orderBy(desc(storeSubscriptions.currentPeriodEnd));

  const settingLabels: Record<string, { label: string; suffix?: string; type?: 'currency' | 'percent' | 'number' }> = {
    subscription_branding_price: { label: 'מחיר מסלול תדמית', suffix: '₪/חודש', type: 'currency' },
    subscription_quickshop_price: { label: 'מחיר מסלול קוויק שופ', suffix: '₪/חודש', type: 'currency' },
    subscription_trial_days: { label: 'ימי נסיון', suffix: 'ימים', type: 'number' },
    transaction_fee_rate: { label: 'עמלת עסקאות', suffix: '%', type: 'percent' },
    vat_rate: { label: 'אחוז מע"מ', suffix: '%', type: 'percent' },
  };

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('he-IL');
  };

  const getPlanLabel = (plan: string | null) => {
    switch (plan) {
      case 'branding': return 'תדמית';
      case 'quickshop': return 'קוויק שופ';
      case 'trial': return 'נסיון';
      default: return plan || '-';
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'trial': return 'bg-blue-100 text-blue-700';
      case 'past_due': return 'bg-red-100 text-red-700';
      case 'expired': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'active': return 'פעיל';
      case 'trial': return 'נסיון';
      case 'past_due': return 'חוב';
      case 'expired': return 'פג תוקף';
      case 'cancelled': return 'מבוטל';
      default: return status || '-';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-1">
            <DollarSign className="w-7 h-7 text-emerald-600" />
            מחירים ותעריפים
          </h1>
          <p className="text-gray-500">ניהול מחירי מנויים, עמלות, חריגים ומשלמים</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Platform Pricing Settings */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <Percent className="w-5 h-5 text-gray-600" />
            <div>
              <h2 className="font-semibold text-gray-900">תעריפי ברירת מחדל</h2>
              <p className="text-sm text-gray-500">מחירים שיחולו על כל החנויות (אלא אם הוגדר חריג)</p>
            </div>
          </div>
          <div className="p-6">
            {pricingSettings.length > 0 ? (
              <PlatformSettingsForm 
                settings={pricingSettings.map(s => ({
                  key: s.key,
                  value: s.value as string | number,
                  description: s.description,
                  label: settingLabels[s.key]?.label || s.key,
                  suffix: settingLabels[s.key]?.suffix,
                  type: settingLabels[s.key]?.type || 'number',
                }))}
              />
            ) : (
              <PlatformSettingsForm 
                settings={[
                  { key: 'subscription_branding_price', value: 299, label: 'מחיר מסלול תדמית', suffix: '₪/חודש', type: 'currency' },
                  { key: 'subscription_quickshop_price', value: 399, label: 'מחיר מסלול קוויק שופ', suffix: '₪/חודש', type: 'currency' },
                  { key: 'subscription_trial_days', value: 7, label: 'ימי נסיון', suffix: 'ימים', type: 'number' },
                  { key: 'transaction_fee_rate', value: 0.5, label: 'עמלת עסקאות', suffix: '%', type: 'percent' },
                  { key: 'vat_rate', value: 18, label: 'אחוז מע"מ', suffix: '%', type: 'percent' },
                ]}
              />
            )}
          </div>
        </div>

        {/* Exceptions Table - Stores with Custom Pricing */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <h2 className="font-semibold text-gray-900">חריגים</h2>
                <p className="text-sm text-gray-500">חנויות עם מחיר או עמלה מותאמים אישית</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
              {exceptions.length} חריגים
            </span>
          </div>
          
          {exceptions.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">אין חריגים</p>
              <p className="text-sm text-gray-400 mt-1">כל החנויות משתמשות בתעריפי ברירת המחדל</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-right p-4 text-sm font-medium text-gray-600">חנות</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600">מסלול</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600">סטטוס</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600">מחיר מותאם</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600">עמלה מותאמת</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {exceptions.map((store) => (
                    <tr key={store.storeId} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Store className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{store.storeName}</p>
                            <p className="text-sm text-gray-500">/{store.storeSlug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-700">{getPlanLabel(store.plan)}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(store.status)}`}>
                          {getStatusLabel(store.status)}
                        </span>
                      </td>
                      <td className="p-4">
                        {store.customMonthlyPrice ? (
                          <span className="font-semibold text-amber-600">{formatCurrency(store.customMonthlyPrice)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {store.customFeePercentage ? (
                          <span className="font-semibold text-amber-600">{(Number(store.customFeePercentage) * 100).toFixed(1)}%</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/admin/stores/${store.storeId}`}
                          className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-flex"
                          title="עריכה"
                        >
                          <Settings className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payers Table - Active Subscriptions */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-green-600" />
              <div>
                <h2 className="font-semibold text-gray-900">משלמים פעילים</h2>
                <p className="text-sm text-gray-500">חנויות עם מנוי פעיל</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              {payers.length} משלמים
            </span>
          </div>
          
          {payers.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">אין משלמים פעילים</p>
              <p className="text-sm text-gray-400 mt-1">אין חנויות עם מנוי פעיל כרגע</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-right p-4 text-sm font-medium text-gray-600">חנות</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600">מסלול</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600">מחיר חודשי</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600">אמצעי תשלום</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600">חידוש הבא</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payers.map((store) => {
                    const defaultPrice = store.plan === 'branding' ? 299 : 399;
                    const actualPrice = store.customMonthlyPrice ? Number(store.customMonthlyPrice) : defaultPrice;
                    
                    return (
                      <tr key={store.storeId} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{store.storeName}</p>
                              <p className="text-sm text-gray-500">/{store.storeSlug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            store.plan === 'quickshop' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {getPlanLabel(store.plan)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div>
                            <span className="font-semibold text-gray-900">{formatCurrency(actualPrice)}</span>
                            {store.customMonthlyPrice && (
                              <span className="mr-2 text-xs text-amber-600">(מותאם)</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {store.cardLastFour ? (
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">
                                {store.cardBrand} •••• {store.cardLastFour}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-gray-700">{formatDate(store.currentPeriodEnd)}</span>
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/admin/stores/${store.storeId}`}
                            className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-flex"
                            title="פרטים"
                          >
                            <Settings className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

