'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { EmailQuotaStatus, EmailPackageInfo } from '@/lib/email-packages';

// Package display names
function getPackageName(slug: string): string {
  const names: Record<string, string> = {
    starter: 'Starter',
    basic: 'Basic',
    growth: 'Growth',
    pro: 'Pro',
    scale: 'Scale',
  };
  return names[slug] || slug;
}

// Package icons as SVG
function PackageIcon({ slug }: { slug: string }) {
  const iconClass = "w-6 h-6 text-slate-600";
  
  switch (slug) {
    case 'starter':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
      );
    case 'basic':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
      );
    case 'growth':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        </svg>
      );
    case 'pro':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
        </svg>
      );
    case 'scale':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      );
  }
}

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
  paymentMethod: {
    lastFour: string;
    brand: string;
    expiry: string;
  } | null;
}

export default function EmailSettingsClient({
  slug,
  storeId,
  quotaStatus,
  packages,
  subscription,
  paymentMethod,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingPackage, setPendingPackage] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPurchasePackage, setSelectedPurchasePackage] = useState<string | null>(null);

  const handlePurchaseClick = (packageSlug: string) => {
    setSelectedPurchasePackage(packageSlug);
    setShowConfirmModal(true);
  };

  const handleConfirmPurchase = () => {
    if (selectedPurchasePackage) {
      handlePurchase(selectedPurchasePackage);
      setShowConfirmModal(false);
      setSelectedPurchasePackage(null);
    }
  };

  const handlePurchase = async (packageSlug: string) => {
    setPendingPackage(packageSlug);
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
          setPendingPackage(null);
        }
      } catch (error) {
        console.error('Error purchasing package:', error);
        alert('שגיאה ברכישת החבילה');
        setPendingPackage(null);
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
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                  <PackageIcon slug={quotaStatus.packageSlug || ''} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{getPackageName(quotaStatus.packageSlug || '')}</h3>
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
                    <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-slate-100 flex items-center justify-center">
                      <PackageIcon slug={pkg.slug} />
                    </div>
                    <h3 className="font-semibold text-slate-900">{getPackageName(pkg.slug)}</h3>
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
                    onClick={() => handlePurchaseClick(pkg.slug)}
                    disabled={pendingPackage !== null || isCurrentPackage}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isCurrentPackage
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : isUpgrade
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {pendingPackage === pkg.slug ? (
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
            <span>המכסה נספרת רק על מיילים שנשלחים <strong>מאוטומציות שיצרת</strong> (עגלות נטושות, תזכורות וכו&apos;)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
            <span><strong>לא נספרים:</strong> מיילי מערכת (אישור הזמנה, הזמנת צוות, איפוס סיסמה וכו&apos;) - אלו חינם ללא הגבלה</span>
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
                      setShowUpgradeModal(false);
                      handlePurchaseClick(pkg.slug);
                    }}
                    className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-500 transition-colors text-right flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <PackageIcon slug={pkg.slug} />
                      </div>
                      <span className="font-medium">{getPackageName(pkg.slug)}</span>
                      <span className="text-sm text-slate-500">
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

      {/* Confirm Purchase Modal */}
      {showConfirmModal && selectedPurchasePackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">אישור רכישה</h3>
              
              {(() => {
                const pkg = packages.find(p => p.slug === selectedPurchasePackage);
                if (!pkg) return null;
                return (
                  <>
                    <p className="text-slate-600 mb-4">
                      האם אתה בטוח שברצונך לרכוש את חבילת <strong>{getPackageName(pkg.slug)}</strong>?
                    </p>
                    
                    <div className="bg-slate-50 rounded-xl p-4 mb-4 text-right space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">חבילה:</span>
                        <span className="font-medium">{getPackageName(pkg.slug)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">מיילים:</span>
                        <span className="font-medium">{pkg.monthlyEmails.toLocaleString()} / חודש</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">מחיר:</span>
                        <span className="font-medium">₪{pkg.monthlyPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">מע״מ (18%):</span>
                        <span className="font-medium">₪{(pkg.monthlyPrice * 0.18).toFixed(2)}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-2 mt-2">
                        <div className="flex justify-between text-lg">
                          <span className="font-semibold text-slate-900">סה״כ:</span>
                          <span className="font-bold text-indigo-600">₪{pkg.monthlyPriceWithVat.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {paymentMethod ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
                        <div className="flex items-center justify-center gap-2 text-emerald-700">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                          </svg>
                          <span className="font-medium">
                            {paymentMethod.brand} •••• {paymentMethod.lastFour}
                            {paymentMethod.expiry && ` (${paymentMethod.expiry})`}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-600 mt-1">החיוב יבוצע מהכרטיס השמור</p>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                        <p className="text-sm text-amber-700">
                          אין אמצעי תשלום שמור. יש להוסיף כרטיס אשראי תחילה.
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedPurchasePackage(null);
                }}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                ביטול
              </button>
              <button
                onClick={handleConfirmPurchase}
                disabled={!paymentMethod || pendingPackage !== null}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {pendingPackage ? 'מעבד...' : 'אישור ותשלום'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

