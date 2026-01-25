'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Calendar, AlertTriangle, CheckCircle, Clock, FileText, ExternalLink, Zap, Crown, Star, Shield, Sparkles, TrendingUp, Package, ShoppingCart, BarChart3, Gift, X } from 'lucide-react';

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
    customMonthlyPrice?: string | null;
    // Billing details for invoices
    billingName?: string | null;
    billingEmail?: string | null;
    vatNumber?: string | null;
  } | null;
  billing: {
    periodTransactionTotal: number;
    pendingTransactionFees: number;
    trialDaysRemaining: number;
    trialTransactionsTotal?: number;
    trialTransactionsCount?: number;
    trialFees?: number;
  };
  invoices: {
    id: string;
    type: 'subscription' | 'transaction_fee' | 'plugin';
    amount: number;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    createdAt: string;
    payplusInvoiceUrl: string | null;
  }[];
  // 💰 Custom prices from database (super admin can override)
  prices?: {
    branding: number;
    quickshop: number;
  };
  paymentResult?: {
    success?: boolean;
    error?: boolean;
    transactionUid?: string;
  };
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

export function SubscriptionManager({ store, subscription, billing, invoices, prices, paymentResult }: SubscriptionManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'branding' | 'quickshop'>('quickshop');
  const [showSuccessMessage, setShowSuccessMessage] = useState(paymentResult?.success || false);
  const [showErrorMessage, setShowErrorMessage] = useState(paymentResult?.error || false);
  
  // Billing details state
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    useCustomName: !!(subscription?.billingName && subscription.billingName !== store.name),
    billingName: subscription?.billingName || store.name,
    billingEmail: subscription?.billingEmail || '',
    vatNumber: subscription?.vatNumber || '',
  });
  const [isSavingBilling, setIsSavingBilling] = useState(false);

  // Clear URL params and refresh page after successful payment
  useEffect(() => {
    if (paymentResult?.success || paymentResult?.error) {
      // Remove query params from URL after showing message
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      url.searchParams.delete('error');
      url.searchParams.delete('transaction_uid');
      window.history.replaceState({}, '', url.toString());
      
      // If payment was successful, refresh the page after 2 seconds to update subscription status
      // This gives the callback time to process
      if (paymentResult?.success) {
        const timer = setTimeout(() => {
          console.log('[Subscription] Refreshing page after successful payment');
          window.location.reload();
        }, 2000); // Reduced to 2 seconds for faster update
        
        return () => clearTimeout(timer);
      }
    }
  }, [paymentResult]);
  
  // 💰 Check if store has custom pricing from super admin
  const hasCustomPrice = subscription?.customMonthlyPrice !== null && subscription?.customMonthlyPrice !== undefined;
  const customPrice = hasCustomPrice ? parseFloat(subscription!.customMonthlyPrice!) : null;
  
  // 💰 Get actual prices (custom from store or global or default)
  // If store has custom price, use it for both plans
  const brandingPrice = customPrice ?? prices?.branding ?? planInfo.branding.price;
  const quickshopPrice = customPrice ?? prices?.quickshop ?? planInfo.quickshop.price;

  const handleSubscribe = async (plan: 'branding' | 'quickshop') => {
    setIsLoading(true);
    try {
      // First, save billing details to ensure they're used in payment
      const billingResponse = await fetch(`/api/shops/${store.slug}/billing-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingName: billingDetails.useCustomName ? billingDetails.billingName : store.name,
          billingEmail: billingDetails.billingEmail,
          vatNumber: billingDetails.vatNumber,
        }),
      });

      if (!billingResponse.ok) {
        console.error('Failed to save billing details, continuing with payment...');
      }

      // Then initiate payment
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

  const handleSaveBillingDetails = async () => {
    setIsSavingBilling(true);
    try {
      const response = await fetch(`/api/shops/${store.slug}/billing-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingName: billingDetails.useCustomName ? billingDetails.billingName : store.name,
          billingEmail: billingDetails.billingEmail,
          vatNumber: billingDetails.vatNumber,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setShowBillingForm(false);
        // Refresh page to show updated data
        window.location.reload();
      } else {
        alert(data.error || 'שגיאה בשמירת פרטי החיוב');
      }
    } catch (error) {
      console.error('Error saving billing details:', error);
      alert('שגיאה בשמירת פרטי החיוב');
    } finally {
      setIsSavingBilling(false);
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
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate actual price (custom or default)
  const getActualPrice = (plan: 'branding' | 'quickshop') => {
    if (subscription?.customMonthlyPrice) {
      return parseFloat(subscription.customMonthlyPrice);
    }
    return planInfo[plan].price;
  };

  // Success/Error Messages Component
  const renderPaymentMessages = () => {
    if (showSuccessMessage) {
      return (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-1">התשלום בוצע בהצלחה!</h3>
            <p className="text-sm text-green-700">
              המנוי שלך הופעל. תוכל להתחיל להשתמש בכל הפיצ'רים של המסלול שבחרת.
            </p>
            {paymentResult?.transactionUid && (
              <p className="text-xs text-green-600 mt-2">
                מספר עסקה: {paymentResult.transactionUid.substring(0, 8)}...
              </p>
            )}
          </div>
          <button
            onClick={() => setShowSuccessMessage(false)}
            className="text-green-600 hover:text-green-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      );
    }

    if (showErrorMessage) {
      return (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-1">התשלום נכשל</h3>
            <p className="text-sm text-red-700">
              לא הצלחנו לעבד את התשלום. אנא נסה שוב או פנה לתמיכה.
            </p>
          </div>
          <button
            onClick={() => setShowErrorMessage(false)}
            className="text-red-600 hover:text-red-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      );
    }

    return null;
  };

  // If no subscription or in trial/expired, show plan selection
  if (!subscription || subscription.status === 'trial' || subscription.status === 'expired') {
    return (
      <div className="space-y-8">
        {/* Payment Messages */}
        {renderPaymentMessages()}

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">בחר את המסלול שלך</h1>
          <p className="text-gray-600">הגדר את פרטי החנות, עיצוב, ואפשרויות נוספות</p>
        </div>

        {/* Trial/Expired Banner */}
        {subscription?.status === 'trial' && billing.trialDaysRemaining > 0 ? (
          <div className={`
            rounded-2xl p-5 flex items-center gap-4
            ${billing.trialDaysRemaining <= 2 
              ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200' 
              : billing.trialDaysRemaining <= 4
                ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'
            }
          `}>
            <div className={`
              w-14 h-14 rounded-2xl flex items-center justify-center
              ${billing.trialDaysRemaining <= 2 
                ? 'bg-red-100' 
                : billing.trialDaysRemaining <= 4
                  ? 'bg-amber-100'
                  : 'bg-blue-100'
              }
            `}>
              <Clock className={`
                w-7 h-7
                ${billing.trialDaysRemaining <= 2 
                  ? 'text-red-600' 
                  : billing.trialDaysRemaining <= 4
                    ? 'text-amber-600'
                    : 'text-blue-600'
                }
              `} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-bold ${
                  billing.trialDaysRemaining <= 2 
                    ? 'text-red-900' 
                    : billing.trialDaysRemaining <= 4
                      ? 'text-amber-900'
                      : 'text-blue-900'
                }`}>
                  תקופת נסיון
                </h3>
                <span className={`
                  px-2.5 py-0.5 rounded-full text-xs font-bold
                  ${billing.trialDaysRemaining <= 2 
                    ? 'bg-red-500 text-white' 
                    : billing.trialDaysRemaining <= 4
                      ? 'bg-amber-500 text-white'
                      : 'bg-blue-500 text-white'
                  }
                `}>
                  {billing.trialDaysRemaining} ימים נותרו
                </span>
              </div>
              <p className={`text-sm ${
                billing.trialDaysRemaining <= 2 
                  ? 'text-red-700' 
                  : billing.trialDaysRemaining <= 4
                    ? 'text-amber-700'
                    : 'text-blue-700'
              }`}>
                {billing.trialDaysRemaining <= 2 
                  ? 'תקופת הנסיון עומדת להסתיים! בחר מסלול עכשיו כדי להמשיך.' 
                  : 'כל הפיצ\'רים פתוחים לך בחינם. בחר מסלול להמשך השימוש.'
                }
              </p>
            </div>
          </div>
        ) : subscription?.status === 'expired' ? (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-1">תקופת הנסיון הסתיימה</h3>
              <p className="text-red-700 text-sm">
                בחר מסלול כדי להמשיך להשתמש בחנות שלך. כל הנתונים שלך נשמרים!
              </p>
            </div>
          </div>
        ) : null}
        
        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Branding Plan */}
          <div 
            className={`
              relative bg-white rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
              ${selectedPlan === 'branding' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-purple-300'
              }
            `}
            onClick={() => setSelectedPlan('branding')}
          >
            {/* Selection indicator */}
            <div className={`
              absolute top-4 left-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
              ${selectedPlan === 'branding'
                ? 'border-purple-500 bg-purple-500'
                : 'border-gray-300'
              }
            `}>
              {selectedPlan === 'branding' && (
                <CheckCircle className="w-4 h-4 text-white" />
              )}
            </div>
            
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center">
                  <Star className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">אתר תדמית</h3>
                  <p className="text-gray-500 text-sm">לעסקים שרוצים נוכחות דיגיטלית</p>
                </div>
              </div>
              
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">₪{brandingPrice}</span>
                  <span className="text-gray-500">/חודש</span>
                  {hasCustomPrice && (
                    <span className="mr-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                      מחיר מותאם
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">+ מע״מ 18%</p>
              </div>
              
              {/* Features */}
              <ul className="space-y-3">
                <FeatureItem icon={<Globe className="w-4 h-4" />} color="purple">
                  אתר תדמית מקצועי
                </FeatureItem>
                <FeatureItem icon={<Sparkles className="w-4 h-4" />} color="purple">
                  דומיין מותאם אישית
                </FeatureItem>
                <FeatureItem icon={<Shield className="w-4 h-4" />} color="purple">
                  תמיכה בעברית
                </FeatureItem>
                <FeatureItem icon={<Package className="w-4 h-4" />} color="purple" disabled>
                  ללא מכירות
                </FeatureItem>
              </ul>
            </div>
          </div>

          {/* QuickShop Plan */}
          <div 
            className={`
              relative bg-white rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
              ${selectedPlan === 'quickshop' 
                ? 'border-emerald-500 bg-emerald-50' 
                : 'border-gray-200 hover:border-emerald-300'
              }
            `}
            onClick={() => setSelectedPlan('quickshop')}
          >
            {/* Selection indicator */}
            <div className={`
              absolute top-4 left-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
              ${selectedPlan === 'quickshop'
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-gray-300'
              }
            `}>
              {selectedPlan === 'quickshop' && (
                <CheckCircle className="w-4 h-4 text-white" />
              )}
            </div>
            
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">קוויק שופ</h3>
                  <p className="text-gray-500 text-sm">חנות מקוונת מלאה</p>
                </div>
              </div>
              
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">₪{quickshopPrice}</span>
                  <span className="text-gray-500">/חודש</span>
                  {hasCustomPrice && (
                    <span className="mr-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                      מחיר מותאם
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">+ מע״מ 18% + 0.5% עמלות + 18% מע״מ</p>
              </div>
              
              {/* Features */}
              <ul className="space-y-3">
                <FeatureItem icon={<ShoppingCart className="w-4 h-4" />} color="emerald">
                  חנות מקוונת מלאה
                </FeatureItem>
                <FeatureItem icon={<CreditCard className="w-4 h-4" />} color="emerald">
                  מכירות ותשלומים
                </FeatureItem>
                <FeatureItem icon={<BarChart3 className="w-4 h-4" />} color="emerald">
                  דוחות ואנליטיקס
                </FeatureItem>
                <FeatureItem icon={<Gift className="w-4 h-4" />} color="emerald">
                  תוספים מתקדמים
                </FeatureItem>
              </ul>
            </div>
          </div>
        </div>

        {/* Billing Details - Show BEFORE payment button */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">פרטים לחשבונית מס</h3>
            <div className="flex items-center gap-3">
              {showBillingForm && (
                <button
                  onClick={handleSaveBillingDetails}
                  disabled={isSavingBilling || (billingDetails.useCustomName && !billingDetails.billingName.trim())}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSavingBilling ? 'שומר...' : 'שמור'}
                </button>
              )}
              <button
                onClick={() => setShowBillingForm(!showBillingForm)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showBillingForm ? 'ביטול' : 'עריכה'}
              </button>
            </div>
          </div>
          
          {showBillingForm ? (
            <div className="p-6 space-y-4">
              {/* Use different name checkbox */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={billingDetails.useCustomName}
                  onChange={(e) => setBillingDetails(prev => ({ 
                    ...prev, 
                    useCustomName: e.target.checked,
                    billingName: e.target.checked ? prev.billingName : store.name
                  }))}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">הוצא חשבונית על שם אחר (לא שם החנות)</span>
              </label>
              
              {/* Billing Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם לחשבונית {billingDetails.useCustomName && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={billingDetails.billingName}
                  onChange={(e) => setBillingDetails(prev => ({ ...prev, billingName: e.target.value }))}
                  disabled={!billingDetails.useCustomName}
                  placeholder={store.name}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                    billingDetails.useCustomName 
                      ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
                />
                {!billingDetails.useCustomName && (
                  <p className="text-xs text-gray-500 mt-1">החשבונית תוצא על שם החנות: {store.name}</p>
                )}
              </div>
              
              {/* VAT Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ח.פ / ע.מ (אופציונלי)
                </label>
                <input
                  type="text"
                  value={billingDetails.vatNumber}
                  onChange={(e) => setBillingDetails(prev => ({ ...prev, vatNumber: e.target.value }))}
                  placeholder="לדוגמה: 123456789"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              {/* Billing Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  אימייל לקבלת חשבוניות
                </label>
                <input
                  type="email"
                  value={billingDetails.billingEmail}
                  onChange={(e) => setBillingDetails(prev => ({ ...prev, billingEmail: e.target.value }))}
                  placeholder="finance@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">שם לחשבונית:</span>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {subscription?.billingName || store.name}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">ח.פ / ע.מ:</span>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {subscription?.vatNumber || '—'}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">אימייל לחשבוניות:</span>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {subscription?.billingEmail || '—'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trial Transaction Fees Notice */}
        {subscription?.status === 'trial' && typeof billing.trialTransactionsCount === 'number' && billing.trialTransactionsCount > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 mb-2">עמלות עסקאות מתקופת הנסיון</h3>
                <p className="text-amber-800 text-sm mb-3">
                  בתקופת הנסיון בוצעו <strong>{billing.trialTransactionsCount} עסקאות</strong> בסך כולל של <strong>{formatCurrency(billing.trialTransactionsTotal || 0)}</strong>.
                </p>
                <div className="bg-white/60 rounded-lg p-3 border border-amber-200/50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-amber-700">עמלת עסקאות (0.5% + מע״מ)</span>
                    <span className="font-bold text-amber-900">{formatCurrency(billing.trialFees || 0)}</span>
                  </div>
                </div>
                <p className="text-xs text-amber-600 mt-3">
                  💳 סכום זה יחויב מהכרטיס שלך באופן אוטומטי לאחר השלמת תשלום המנוי
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Subscribe Button */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <button
            onClick={() => handleSubscribe(selectedPlan)}
            disabled={isLoading}
            className={`
              w-full py-4 px-6 rounded-xl font-bold text-white text-lg transition-all
              ${selectedPlan === 'quickshop' 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700' 
                : 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700'
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
              <>
                המשך לתשלום - {formatCurrency(selectedPlan === 'quickshop' ? quickshopPrice : brandingPrice)} + מע״מ
              </>
            )}
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-4 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            תשלום מאובטח • ביטול בכל עת
          </p>
        </div>
      </div>
    );
  }

  // Active subscription view
  const currentPlan = planInfo[subscription.plan];
  const currentStatus = statusInfo[subscription.status];
  const StatusIcon = currentStatus.icon;
  const actualPrice = subscription.customMonthlyPrice 
    ? parseFloat(subscription.customMonthlyPrice) 
    : currentPlan.price;

  return (
    <div className="space-y-6">
      {/* Payment Messages */}
      {renderPaymentMessages()}

      {/* Current Plan Card */}
      <div className={`
        rounded-2xl overflow-hidden
        ${subscription.plan === 'quickshop' 
          ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
          : 'bg-gradient-to-br from-purple-500 to-violet-600'
        }
      `}>
        <div className="p-6 text-white">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <currentPlan.icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{currentPlan.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`
                    inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${subscription.status === 'active' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-yellow-400 text-yellow-900'
                    }
                  `}>
                    <StatusIcon className="w-3 h-3" />
                    {currentStatus.label}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-left">
              <div className="text-3xl font-bold">
                {formatCurrency(actualPrice)}
              </div>
              <div className="text-white/70 text-sm">לחודש + מע״מ</div>
              {subscription.customMonthlyPrice && (
                <div className="text-white/50 text-xs mt-1">מחיר מותאם אישית</div>
              )}
            </div>
          </div>

          {/* Subscription Dates */}
          {subscription.currentPeriodEnd && (
            <div className="flex items-center gap-2 text-sm bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <Calendar className="w-4 h-4" />
              <span>
                תקופת מנוי נוכחית עד: <strong>{formatDate(subscription.currentPeriodEnd)}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-white px-6 py-4">
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
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <TrendingUp className="w-4 h-4" />
            עסקאות בתקופה
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(billing.periodTransactionTotal)}
          </div>
          <div className="text-xs text-gray-400 mt-1">14 ימים אחרונים</div>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <FileText className="w-4 h-4" />
            עמלות צפויות
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(billing.pendingTransactionFees)}
          </div>
          <div className="text-xs text-gray-400 mt-1">0.5% + מע״מ</div>
        </div>
      </div>

      {/* Past Due Warning */}
      {subscription.status === 'past_due' && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-bold text-yellow-900 mb-1">תשלום באיחור</h3>
            <p className="text-yellow-700 text-sm mb-3">
              יש בעיה עם אמצעי התשלום שלך. אנא עדכן את פרטי התשלום כדי להמשיך להשתמש בשירות.
            </p>
            <button 
              onClick={() => handleSubscribe(subscription.plan === 'trial' ? 'quickshop' : subscription.plan)}
              className="text-sm font-medium text-yellow-800 bg-yellow-200 hover:bg-yellow-300 px-4 py-2 rounded-lg transition-colors"
            >
              עדכן אמצעי תשלום
            </button>
          </div>
        </div>
      )}

      {/* Billing Details */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">פרטים לחשבונית מס</h3>
          <div className="flex items-center gap-3">
            {showBillingForm && (
              <button
                onClick={handleSaveBillingDetails}
                disabled={isSavingBilling || (billingDetails.useCustomName && !billingDetails.billingName.trim())}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSavingBilling ? 'שומר...' : 'שמור'}
              </button>
            )}
            <button
              onClick={() => setShowBillingForm(!showBillingForm)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showBillingForm ? 'ביטול' : 'עריכה'}
            </button>
          </div>
        </div>
        
        {showBillingForm ? (
          <div className="p-6 space-y-4">
            {/* Use different name checkbox */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={billingDetails.useCustomName}
                onChange={(e) => setBillingDetails(prev => ({ 
                  ...prev, 
                  useCustomName: e.target.checked,
                  billingName: e.target.checked ? prev.billingName : store.name
                }))}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">הוצא חשבונית על שם אחר (לא שם החנות)</span>
            </label>
            
            {/* Billing Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שם לחשבונית {billingDetails.useCustomName && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={billingDetails.billingName}
                onChange={(e) => setBillingDetails(prev => ({ ...prev, billingName: e.target.value }))}
                disabled={!billingDetails.useCustomName}
                placeholder={store.name}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm ${
                  billingDetails.useCustomName 
                    ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              />
              {!billingDetails.useCustomName && (
                <p className="text-xs text-gray-500 mt-1">החשבונית תוצא על שם החנות: {store.name}</p>
              )}
            </div>
            
            {/* VAT Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ח.פ / ע.מ (אופציונלי)
              </label>
              <input
                type="text"
                value={billingDetails.vatNumber}
                onChange={(e) => setBillingDetails(prev => ({ ...prev, vatNumber: e.target.value }))}
                placeholder="לדוגמה: 123456789"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            {/* Billing Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                אימייל לקבלת חשבוניות
              </label>
              <input
                type="email"
                value={billingDetails.billingEmail}
                onChange={(e) => setBillingDetails(prev => ({ ...prev, billingEmail: e.target.value }))}
                placeholder="finance@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveBillingDetails}
                disabled={isSavingBilling || (billingDetails.useCustomName && !billingDetails.billingName.trim())}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSavingBilling ? 'שומר...' : 'שמור פרטים'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">שם לחשבונית:</span>
                <p className="font-medium text-gray-900 mt-0.5">
                  {subscription?.billingName || store.name}
                </p>
              </div>
              <div>
                <span className="text-gray-500">ח.פ / ע.מ:</span>
                <p className="font-medium text-gray-900 mt-0.5">
                  {subscription?.vatNumber || '—'}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">אימייל לחשבוניות:</span>
                <p className="font-medium text-gray-900 mt-0.5">
                  {subscription?.billingEmail || '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">היסטוריית חשבוניות</h3>
        </div>
        
        {invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">אין חשבוניות עדיין</p>
            <p className="text-sm text-gray-400 mt-1">חשבוניות יופיעו כאן לאחר התשלום הראשון</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">תאריך</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">סוג</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">סכום</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(invoice.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {invoiceTypeLabels[invoice.type]}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`
                      inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
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
                  <td className="px-6 py-4 text-left">
                    {invoice.payplusInvoiceUrl && (
                      <a 
                        href={invoice.payplusInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors inline-flex"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Change Plan Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">שינוי מסלול</h3>
        <p className="text-sm text-gray-500 mb-4">
          רוצה לשנות מסלול? השינוי ייכנס לתוקף בתחילת תקופת החיוב הבאה.
        </p>
        
        <div className="flex gap-3">
          {subscription.plan !== 'branding' && (
            <button
              onClick={() => handleSubscribe('branding')}
              disabled={isLoading}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              עבור לאתר תדמית (₪299)
            </button>
          )}
          {subscription.plan !== 'quickshop' && (
            <button
              onClick={() => handleSubscribe('quickshop')}
              disabled={isLoading}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              שדרג לקוויק שופ (₪399)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Feature item component
function FeatureItem({ 
  icon, 
  color, 
  children, 
  disabled = false 
}: { 
  icon: React.ReactNode; 
  color: 'purple' | 'emerald'; 
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <li className={`flex items-center gap-3 text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
      <div className={`
        w-6 h-6 rounded-lg flex items-center justify-center
        ${disabled 
          ? 'bg-gray-100 text-gray-400' 
          : color === 'purple' 
            ? 'bg-purple-100 text-purple-600' 
            : 'bg-emerald-100 text-emerald-600'
        }
      `}>
        {icon}
      </div>
      {children}
    </li>
  );
}

// Globe icon component
function Globe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}
