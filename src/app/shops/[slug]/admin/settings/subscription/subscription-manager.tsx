'use client';

import { useState } from 'react';
import { CreditCard, Calendar, AlertTriangle, CheckCircle, Clock, FileText, ExternalLink, Zap, Crown, Star } from 'lucide-react';

interface SubscriptionManagerProps {
  store: {
    id: string;
    name: string;
    slug: string;
  };
  subscription: {
    id: string;
    plan: 'trial' | 'branding' | 'quickshop';
    status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
    trialEndsAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    hasPaymentMethod: boolean;
  } | null;
  billing: {
    periodTransactionTotal: number;
    pendingTransactionFees: number;
    trialDaysRemaining: number;
  };
  invoices: {
    id: string;
    type: 'subscription' | 'transaction_fee' | 'plugin';
    amount: number;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    createdAt: string;
    payplusInvoiceUrl: string | null;
  }[];
}

const planInfo = {
  trial: { 
    name: 'תקופת נסיון', 
    price: 0, 
    color: 'blue',
    icon: Clock,
    features: ['כל הפיצ\'רים פתוחים', '7 ימים חינם', 'ללא התחייבות']
  },
  branding: { 
    name: 'אתר תדמית', 
    price: 299, 
    color: 'purple',
    icon: Star,
    features: ['אתר תדמית מקצועי', 'ללא מכירות', 'דומיין מותאם אישית', 'תמיכה בעברית']
  },
  quickshop: { 
    name: 'קוויק שופ', 
    price: 399, 
    color: 'emerald',
    icon: Crown,
    features: ['חנות מקוונת מלאה', 'מכירות ותשלומים', 'דוחות ואנליטיקס', 'תוספים מתקדמים']
  },
};

const statusInfo = {
  trial: { label: 'נסיון', color: 'blue', icon: Clock },
  active: { label: 'פעיל', color: 'green', icon: CheckCircle },
  past_due: { label: 'תשלום באיחור', color: 'yellow', icon: AlertTriangle },
  cancelled: { label: 'מבוטל', color: 'gray', icon: AlertTriangle },
  expired: { label: 'פג תוקף', color: 'red', icon: AlertTriangle },
};

const invoiceTypeLabels = {
  subscription: 'מנוי חודשי',
  transaction_fee: 'עמלות עסקאות',
  plugin: 'תוספים',
};

export function SubscriptionManager({ store, subscription, billing, invoices }: SubscriptionManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'branding' | 'quickshop'>('quickshop');

  const handleSubscribe = async (plan: 'branding' | 'quickshop') => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/platform/billing/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          plan,
          successUrl: `${window.location.origin}/shops/${store.slug}/admin/settings/subscription?success=true`,
          failureUrl: `${window.location.origin}/shops/${store.slug}/admin/settings/subscription?error=true`,
        }),
      });

      const data = await response.json();
      
      if (data.paymentPageUrl) {
        window.location.href = data.paymentPageUrl;
      } else if (data.error) {
        alert(data.error);
      } else {
        alert('שגיאה ביצירת דף תשלום');
      }
    } catch (error) {
      console.error('Error initiating subscription:', error);
      alert('שגיאה ביצירת דף תשלום');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);
  };

  // If no subscription or in trial/expired, show plan selection
  if (!subscription || subscription.status === 'trial' || subscription.status === 'expired') {
    return (
      <div className="space-y-8">
        {/* Trial Banner */}
        {subscription?.status === 'trial' && billing.trialDaysRemaining > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">תקופת נסיון</h3>
              <p className="text-blue-700 text-sm">
                נשארו לך <strong>{billing.trialDaysRemaining}</strong> ימים לנסות את כל הפיצ&apos;רים בחינם.
                בחר מסלול להמשך השימוש.
              </p>
            </div>
          </div>
        )}

        {/* Expired Banner */}
        {subscription?.status === 'expired' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">תקופת הנסיון הסתיימה</h3>
              <p className="text-red-700 text-sm">
                בחר מסלול כדי להמשיך להשתמש בחנות שלך.
              </p>
            </div>
          </div>
        )}

        {/* Plan Selection */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">בחר את המסלול שלך</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Branding Plan */}
            <div 
              className={`
                relative border-2 rounded-xl p-6 cursor-pointer transition-all
                ${selectedPlan === 'branding' 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-purple-300 bg-white'
                }
              `}
              onClick={() => setSelectedPlan('branding')}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">אתר תדמית</h3>
                  <p className="text-sm text-gray-500">לעסקים שרוצים נוכחות דיגיטלית</p>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">₪299</span>
                <span className="text-gray-500">/חודש + מע&quot;מ</span>
              </div>
              
              <ul className="space-y-2">
                {planInfo.branding.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-purple-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              {selectedPlan === 'branding' && (
                <div className="absolute top-3 left-3">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* QuickShop Plan */}
            <div 
              className={`
                relative border-2 rounded-xl p-6 cursor-pointer transition-all
                ${selectedPlan === 'quickshop' 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : 'border-gray-200 hover:border-emerald-300 bg-white'
                }
              `}
              onClick={() => setSelectedPlan('quickshop')}
            >
              <div className="absolute -top-3 right-4">
                <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  מומלץ
                </span>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">קוויק שופ</h3>
                  <p className="text-sm text-gray-500">חנות מקוונת מלאה</p>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">₪399</span>
                <span className="text-gray-500">/חודש + מע&quot;מ</span>
              </div>
              
              <ul className="space-y-2">
                {planInfo.quickshop.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              {selectedPlan === 'quickshop' && (
                <div className="absolute top-3 left-3">
                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Subscribe Button */}
          <div className="mt-6">
            <button
              onClick={() => handleSubscribe(selectedPlan)}
              disabled={isLoading}
              className={`
                w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors
                ${selectedPlan === 'quickshop' 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : 'bg-purple-600 hover:bg-purple-700'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  מעבד...
                </span>
              ) : (
                `המשך לתשלום - ${formatCurrency(planInfo[selectedPlan].price)} + מע"מ`
              )}
            </button>
            
            <p className="text-center text-sm text-gray-500 mt-2">
              + 0.5% עמלה על כל עסקה (לא כולל מע&quot;מ)
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Active subscription view
  const currentPlan = planInfo[subscription.plan];
  const currentStatus = statusInfo[subscription.status];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-${currentPlan.color}-100 rounded-xl flex items-center justify-center`}>
              <currentPlan.icon className={`w-6 h-6 text-${currentPlan.color}-600`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{currentPlan.name}</h3>
              <div className="flex items-center gap-2">
                <span className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                  bg-${currentStatus.color}-100 text-${currentStatus.color}-700
                `}>
                  <StatusIcon className="w-3 h-3" />
                  {currentStatus.label}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-left">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(currentPlan.price)}
            </div>
            <div className="text-sm text-gray-500">לחודש + מע&quot;מ</div>
          </div>
        </div>

        {/* Subscription Dates */}
        {subscription.currentPeriodEnd && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4" />
            <span>
              תקופת מנוי נוכחית עד: <strong>{formatDate(subscription.currentPeriodEnd)}</strong>
            </span>
          </div>
        )}

        {/* Payment Method */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                {subscription.hasPaymentMethod ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    אמצעי תשלום מוגדר
                  </span>
                ) : (
                  <span className="text-yellow-600">לא הוגדר אמצעי תשלום</span>
                )}
              </span>
            </div>
            <button 
              onClick={() => handleSubscribe(subscription.plan === 'trial' ? 'quickshop' : subscription.plan)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              עדכן אמצעי תשלום
            </button>
          </div>
        </div>
      </div>

      {/* Billing Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Zap className="w-4 h-4" />
            עסקאות בתקופה
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(billing.periodTransactionTotal)}
          </div>
          <div className="text-xs text-gray-500">14 ימים אחרונים</div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <FileText className="w-4 h-4" />
            עמלות צפויות
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(billing.pendingTransactionFees)}
          </div>
          <div className="text-xs text-gray-500">0.5% + מע&quot;מ</div>
        </div>
      </div>

      {/* Past Due Warning */}
      {subscription.status === 'past_due' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900">תשלום באיחור</h3>
            <p className="text-yellow-700 text-sm">
              יש בעיה עם אמצעי התשלום שלך. אנא עדכן את פרטי התשלום כדי להמשיך להשתמש בשירות.
            </p>
            <button 
              onClick={() => handleSubscribe(subscription.plan === 'trial' ? 'quickshop' : subscription.plan)}
              className="mt-2 text-sm font-medium text-yellow-800 underline hover:no-underline"
            >
              עדכן אמצעי תשלום
            </button>
          </div>
        </div>
      )}

      {/* Invoices */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">היסטוריית חשבוניות</h3>
        
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>אין חשבוניות עדיין</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">תאריך</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">סוג</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">סכום</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(invoice.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {invoiceTypeLabels[invoice.type]}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`
                        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' : ''}
                        ${invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${invoice.status === 'failed' ? 'bg-red-100 text-red-700' : ''}
                        ${invoice.status === 'refunded' ? 'bg-gray-100 text-gray-700' : ''}
                      `}>
                        {invoice.status === 'paid' && 'שולם'}
                        {invoice.status === 'pending' && 'ממתין'}
                        {invoice.status === 'failed' && 'נכשל'}
                        {invoice.status === 'refunded' && 'הוחזר'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-left">
                      {invoice.payplusInvoiceUrl && (
                        <a 
                          href={invoice.payplusInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Plan Section */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-2">שינוי מסלול</h3>
        <p className="text-sm text-gray-500 mb-4">
          רוצה לשנות מסלול? השינוי ייכנס לתוקף בתחילת תקופת החיוב הבאה.
        </p>
        
        <div className="flex gap-3">
          {subscription.plan !== 'branding' && (
            <button
              onClick={() => handleSubscribe('branding')}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              עבור לאתר תדמית (₪299)
            </button>
          )}
          {subscription.plan !== 'quickshop' && (
            <button
              onClick={() => handleSubscribe('quickshop')}
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              שדרג לקוויק שופ (₪399)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
