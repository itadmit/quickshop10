'use client';

import { useState, useTransition } from 'react';
import { RefreshCw, CreditCard, AlertTriangle, Check, X, Clock, Settings } from 'lucide-react';

interface SubscriptionManagementFormProps {
  storeId: string;
  storeName: string;
  subscription: {
    id: string;
    plan: string;
    status: string;
    trialEndsAt: Date | null;
    currentPeriodEnd: Date | null;
    hasPaymentMethod: boolean;
    billingType: 'automatic' | 'manual';
  } | null;
}

export function SubscriptionManagementForm({ 
  storeId, 
  storeName,
  subscription 
}: SubscriptionManagementFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form state
  const [extendDays, setExtendDays] = useState('7');
  const [newStatus, setNewStatus] = useState(subscription?.status || 'trial');
  const [billingType, setBillingType] = useState<'automatic' | 'manual'>(subscription?.billingType || 'automatic');
  const [trialEndDate, setTrialEndDate] = useState(
    subscription?.trialEndsAt 
      ? new Date(subscription.trialEndsAt).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );

  const handleExtendTrial = async () => {
    setMessage(null);
    
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/stores/${storeId}/subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'extend_trial',
            days: parseInt(extendDays),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'שגיאה בהארכת הנסיון');
        }

        setMessage({ type: 'success', text: `הנסיון הוארך ב-${extendDays} ימים!` });
        setTimeout(() => window.location.reload(), 1500);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'שגיאה בהארכת הנסיון';
        setMessage({ type: 'error', text: errorMessage });
      }
    });
  };

  const handleSetTrialDate = async () => {
    setMessage(null);
    
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/stores/${storeId}/subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'set_trial_date',
            date: trialEndDate,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'שגיאה בעדכון התאריך');
        }

        setMessage({ type: 'success', text: 'תאריך הנסיון עודכן!' });
        setTimeout(() => window.location.reload(), 1500);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'שגיאה בעדכון התאריך';
        setMessage({ type: 'error', text: errorMessage });
      }
    });
  };

  const handleStatusChange = async () => {
    setMessage(null);
    
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/stores/${storeId}/subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'change_status',
            status: newStatus,
            billingType,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'שגיאה בעדכון הסטטוס');
        }

        setMessage({ type: 'success', text: 'הסטטוס עודכן בהצלחה!' });
        setIsEditing(false);
        setTimeout(() => window.location.reload(), 1500);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'שגיאה בעדכון';
        setMessage({ type: 'error', text: errorMessage });
      }
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      trial: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      expired: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
      past_due: 'bg-amber-100 text-amber-700',
    };
    const labels: Record<string, string> = {
      trial: 'נסיון',
      active: 'פעיל',
      expired: 'פג תוקף',
      cancelled: 'בוטל',
      past_due: 'חוב',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('he-IL', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).format(new Date(date));
  };

  const getDaysRemaining = (endDate: Date | null) => {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Handle creating subscription if not exists
  const handleCreateSubscription = async () => {
    setMessage(null);
    
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/stores/${storeId}/subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'create_trial',
            days: 7,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'שגיאה ביצירת מנוי');
        }

        setMessage({ type: 'success', text: 'מנוי נסיון נוצר!' });
        setTimeout(() => window.location.reload(), 1500);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'שגיאה ביצירת מנוי';
        setMessage({ type: 'error', text: errorMessage });
      }
    });
  };

  if (!subscription) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600" />
          ניהול מנוי
        </h3>
        <div className="text-center py-4">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
          <p className="text-gray-500 mb-4">אין מנוי לחנות זו</p>
          
          {message && (
            <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {message.text}
            </div>
          )}
          
          <button
            onClick={handleCreateSubscription}
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
            צור מנוי נסיון (7 ימים)
          </button>
        </div>
      </div>
    );
  }

  const trialDaysRemaining = getDaysRemaining(subscription.trialEndsAt);
  const isTrialExpired = subscription.status === 'trial' && trialDaysRemaining !== null && trialDaysRemaining < 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5 text-gray-600" />
        ניהול מנוי
      </h3>

      {/* Current Status */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">סטטוס:</span>
          <div className="flex items-center gap-2">
            {getStatusBadge(subscription.status)}
            {subscription.billingType === 'manual' && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                חיוב ידני
              </span>
            )}
          </div>
        </div>
        
        {subscription.status === 'trial' && subscription.trialEndsAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">נסיון עד:</span>
            <span className={`text-sm font-medium ${isTrialExpired ? 'text-red-600' : 'text-gray-900'}`}>
              {formatDate(subscription.trialEndsAt)}
              {trialDaysRemaining !== null && (
                <span className={`mr-1 text-xs ${trialDaysRemaining < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  ({trialDaysRemaining < 0 ? `פג לפני ${Math.abs(trialDaysRemaining)} ימים` : `${trialDaysRemaining} ימים`})
                </span>
              )}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">אמצעי תשלום:</span>
          <span className={`text-sm font-medium flex items-center gap-1 ${subscription.hasPaymentMethod ? 'text-green-600' : 'text-amber-600'}`}>
            {subscription.hasPaymentMethod ? (
              <>
                <CreditCard className="w-4 h-4" />
                מוגדר
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                לא מוגדר
              </>
            )}
          </span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Quick Actions */}
      {!isEditing && (
        <div className="space-y-2">
          {/* Extend Trial - Show for trial or expired */}
          {(subscription.status === 'trial' || subscription.status === 'expired') && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">הארכת נסיון</span>
              </div>
              <div className="flex gap-2">
                <select
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm"
                  disabled={isPending}
                >
                  <option value="7">7 ימים</option>
                  <option value="14">14 ימים</option>
                  <option value="30">30 ימים</option>
                  <option value="60">60 ימים</option>
                  <option value="90">90 ימים</option>
                </select>
                <button
                  onClick={handleExtendTrial}
                  disabled={isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                  הוסף
                </button>
              </div>
            </div>
          )}

          {/* Advanced Settings Button */}
          <button
            onClick={() => setIsEditing(true)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" />
            הגדרות מתקדמות
          </button>
        </div>
      )}

      {/* Advanced Settings */}
      {isEditing && (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          {/* Set Trial End Date */}
          {(subscription.status === 'trial' || subscription.status === 'expired') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">קביעת תאריך סיום נסיון</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={trialEndDate}
                  onChange={(e) => setTrialEndDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  disabled={isPending}
                />
                <button
                  onClick={handleSetTrialDate}
                  disabled={isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                  עדכן
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                שנה את תאריך הסיום ידנית (להאריך או לקצר)
              </p>
            </div>
          )}

          {/* Status Change */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">שינוי סטטוס</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              disabled={isPending}
            >
              <option value="trial">נסיון</option>
              <option value="active">פעיל</option>
              <option value="expired">פג תוקף</option>
              <option value="cancelled">בוטל</option>
              <option value="past_due">חוב</option>
            </select>
            
            {newStatus === 'active' && !subscription.hasPaymentMethod && (
              <div className="mt-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                אין אמצעי תשלום - יש לבחור חיוב ידני
              </div>
            )}
          </div>

          {/* Billing Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">סוג חיוב</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={billingType === 'automatic'}
                  onChange={() => setBillingType('automatic')}
                  className="w-4 h-4 text-gray-900"
                  disabled={isPending}
                />
                <span className="text-sm text-gray-700">אוטומטי (כרטיס אשראי)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={billingType === 'manual'}
                  onChange={() => setBillingType('manual')}
                  className="w-4 h-4 text-gray-900"
                  disabled={isPending}
                />
                <span className="text-sm text-gray-700">ידני (העברה/שיק)</span>
              </label>
            </div>
            {billingType === 'manual' && (
              <p className="mt-1 text-xs text-gray-500">
                חנות זו לא תחויב אוטומטית. יש לגבות ידנית.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setIsEditing(false)}
              disabled={isPending}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              ביטול
            </button>
            <button
              onClick={handleStatusChange}
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              שמור
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

