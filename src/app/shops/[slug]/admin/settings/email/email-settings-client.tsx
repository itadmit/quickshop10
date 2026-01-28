'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { EmailQuotaStatus, EmailPackageInfo } from '@/lib/email-packages';

interface Props {
  slug: string;
  storeId: string;
  quotaStatus: EmailQuotaStatus;
  packages: EmailPackageInfo[];
  subscription: {
    id: string;
    packageSlug: string;
    status: string;
    currentPeriodEnd: Date;
    emailsUsedThisPeriod: number;
    emailsLimit: number;
  } | null;
}

export default function EmailSettingsClient({
  slug,
  storeId,
  quotaStatus,
  packages,
  subscription,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handlePurchase = async (packageSlug: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/shops/${slug}/email-package/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packageSlug }),
        });

        const data = await response.json();
        
        if (data.paymentUrl) {
          // Redirect to payment page
          window.location.href = data.paymentUrl;
        } else if (data.success) {
          // Package activated (free or already paid)
          router.refresh();
        } else {
          alert(data.error || 'שגיאה ברכישת החבילה');
        }
      } catch (error) {
        console.error('Error purchasing package:', error);
        alert('שגיאה ברכישת החבילה');
      }
    });
  };

  const handleCancel = async () => {
    if (!confirm('האם אתה בטוח שברצונך לבטל את חבילת הדיוור?')) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/shops/${slug}/email-package/cancel`, {
          method: 'POST',
        });

        const data = await response.json();
        
        if (data.success) {
          router.refresh();
        } else {
          alert(data.error || 'שגיאה בביטול החבילה');
        }
      } catch (error) {
        console.error('Error cancelling package:', error);
        alert('שגיאה בביטול החבילה');
      }
    });
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">סטטוס נוכחי</h2>
        </div>

        {quotaStatus.hasPackage ? (
          <div className="p-6">
            {/* Package Info */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                  {packages.find(p => p.slug === quotaStatus.packageSlug)?.icon || '📧'}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{quotaStatus.packageName}</h3>
                  <p className="text-sm text-slate-500">
                    {quotaStatus.status === 'active' ? (
                      <>מתחדש ב-{quotaStatus.periodEnd ? new Date(quotaStatus.periodEnd).toLocaleDateString('he-IL') : '-'}</>
                    ) : (
                      <span className="text-red-600">
                        {quotaStatus.status === 'past_due' ? 'בחריגת תשלום' : 
                         quotaStatus.status === 'cancelled' ? 'בוטל' : 'לא פעיל'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              {quotaStatus.status === 'active' && (
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  בטל חבילה
                </button>
              )}
            </div>

            {/* Usage Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">מיילים ששלחת החודש</span>
                <span className="font-medium text-slate-900">
                  {quotaStatus.emailsUsed.toLocaleString()} / {quotaStatus.emailsLimit.toLocaleString()}
                </span>
              </div>
              
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(quotaStatus.percentUsed)}`}
                  style={{ width: `${Math.min(100, quotaStatus.percentUsed)}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>נותרו {quotaStatus.emailsRemaining.toLocaleString()} מיילים</span>
                <span>{quotaStatus.percentUsed}% מנוצל</span>
              </div>
            </div>

            {/* Warning if running low */}
            {quotaStatus.percentUsed >= 75 && (
              <div className={`mt-4 p-4 rounded-xl ${quotaStatus.percentUsed >= 90 ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                <div className="flex items-start gap-3">
                  <div className="text-xl">{quotaStatus.percentUsed >= 90 ? '🚨' : '⚠️'}</div>
                  <div>
                    <h4 className="font-medium text-slate-900">
                      {quotaStatus.percentUsed >= 90 ? 'מכסת המיילים כמעט נגמרה!' : 'מכסת המיילים עומדת להיגמר'}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      {quotaStatus.percentUsed >= 90
                        ? 'שדרג את החבילה כדי להמשיך לשלוח מיילים אוטומטיים.'
                        : 'שקול לשדרג את החבילה אם אתה צופה עליה בנפח המיילים.'}
                    </p>
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      שדרג עכשיו ←
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">אין חבילת דיוור פעילה</h3>
            <p className="text-sm text-slate-500 mb-4">
              רכוש חבילת דיוור כדי להפעיל אוטומציות עם שליחת מיילים
            </p>
          </div>
        )}
      </div>

      {/* Packages Grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          {quotaStatus.hasPackage ? 'שדרג או שנה חבילה' : 'בחר חבילת דיוור'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {packages.map((pkg) => {
            const isCurrentPackage = quotaStatus.packageSlug === pkg.slug;
            const isUpgrade = quotaStatus.hasPackage && 
              pkg.monthlyEmails > (quotaStatus.emailsLimit || 0);

            return (
              <div
                key={pkg.slug}
                className={`relative bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                  isCurrentPackage
                    ? 'border-indigo-500 ring-4 ring-indigo-100'
                    : pkg.isPopular
                    ? 'border-amber-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Popular Badge */}
                {pkg.isPopular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-medium text-center py-1">
                    ⭐ הכי פופולרי
                  </div>
                )}

                {/* Current Badge */}
                {isCurrentPackage && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-medium text-center py-1">
                    ✓ החבילה שלך
                  </div>
                )}

                <div className={`p-5 ${(pkg.isPopular || isCurrentPackage) ? 'pt-8' : ''}`}>
                  {/* Icon & Name */}
                  <div className="text-center mb-4">
                    <div className="text-3xl mb-2">{pkg.icon}</div>
                    <h3 className="font-semibold text-slate-900">{pkg.name.replace(/[🐣📈🚀💼📊]\s*/, '')}</h3>
                  </div>

                  {/* Emails */}
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-slate-900">
                      {pkg.monthlyEmails.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500">מיילים / חודש</div>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-4 pb-4 border-b border-slate-100">
                    <div className="text-2xl font-bold text-slate-900">
                      ₪{pkg.monthlyPrice}
                    </div>
                    <div className="text-xs text-slate-500">
                      + מע"מ (₪{pkg.monthlyPriceWithVat.toFixed(2)} סה"כ)
                    </div>
                  </div>

                  {/* Cost per email */}
                  <div className="text-center text-xs text-slate-500 mb-4">
                    ₪{(pkg.monthlyPrice / pkg.monthlyEmails).toFixed(3)} / מייל
                  </div>

                  {/* Button */}
                  <button
                    onClick={() => handlePurchase(pkg.slug)}
                    disabled={isPending || isCurrentPackage}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isCurrentPackage
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : isUpgrade
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        מעבד...
                      </span>
                    ) : isCurrentPackage ? (
                      'החבילה הנוכחית'
                    ) : isUpgrade ? (
                      'שדרג עכשיו'
                    ) : quotaStatus.hasPackage ? (
                      'החלף לחבילה זו'
                    ) : (
                      'רכוש חבילה'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <span className="text-xl">💡</span>
          איך זה עובד?
        </h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
            <span>כל מייל שנשלח מאוטומציה (עגלות נטושות, הזמנות חדשות וכו&apos;) נספר מהמכסה החודשית</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
            <span>החבילה מתחדשת אוטומטית כל חודש והמכסה מתאפסת</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
            <span>אפשר לשדרג או לשנות חבילה בכל עת - השינוי חל מיידית</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
            <span>ביטול החבילה יכנס לתוקף בסוף תקופת החיוב הנוכחית</span>
          </li>
        </ul>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">שדרג את חבילת הדיוור</h3>
            <p className="text-sm text-slate-600 mb-4">
              בחר חבילה גדולה יותר כדי להמשיך לשלוח מיילים אוטומטיים.
            </p>
            
            <div className="space-y-2 mb-6">
              {packages
                .filter(p => p.monthlyEmails > (quotaStatus.emailsLimit || 0))
                .map(pkg => (
                  <button
                    key={pkg.slug}
                    onClick={() => {
                      setSelectedPackage(pkg.slug);
                      handlePurchase(pkg.slug);
                      setShowUpgradeModal(false);
                    }}
                    className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-500 transition-colors text-right flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xl mr-2">{pkg.icon}</span>
                      <span className="font-medium">{pkg.name.replace(/[🐣📈🚀💼📊]\s*/, '')}</span>
                      <span className="text-sm text-slate-500 mr-2">
                        ({pkg.monthlyEmails.toLocaleString()} מיילים)
                      </span>
                    </div>
                    <div className="font-semibold">₪{pkg.monthlyPrice}/חודש</div>
                  </button>
                ))}
            </div>

            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

