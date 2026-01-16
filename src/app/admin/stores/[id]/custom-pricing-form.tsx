'use client';

import { useState, useTransition } from 'react';
import { DollarSign, Save, Percent, Info } from 'lucide-react';

interface CustomPricingFormProps {
  storeId: string;
  currentPrice: string | null;
  currentFeePercentage: string | null;
  defaultPrice: number;
  planName: string;
  isTrial?: boolean;
}

const DEFAULT_FEE = 0.5; // 0.5%

export function CustomPricingForm({ 
  storeId, 
  currentPrice, 
  currentFeePercentage,
  defaultPrice, 
  planName,
  isTrial = false,
}: CustomPricingFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(currentPrice || '');
  const [feePercentage, setFeePercentage] = useState(
    currentFeePercentage ? (parseFloat(currentFeePercentage) * 100).toString() : ''
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/stores/${storeId}/custom-pricing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            customPrice: price ? parseFloat(price) : null,
            customFeePercentage: feePercentage ? parseFloat(feePercentage) / 100 : null,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'שגיאה בשמירה');
        }

        setMessage({ type: 'success', text: 'ההגדרות עודכנו בהצלחה!' });
        setIsEditing(false);
        
        // Refresh the page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'שגיאה בשמירה';
        setMessage({ type: 'error', text: errorMessage });
      }
    });
  };

  const handleReset = () => {
    setPrice('');
    setFeePercentage('');
    setMessage(null);
  };

  const displayPrice = currentPrice ? `₪${parseFloat(currentPrice).toFixed(0)}` : `₪${defaultPrice}`;
  const displayFee = currentFeePercentage 
    ? `${(parseFloat(currentFeePercentage) * 100).toFixed(2)}%`
    : `${DEFAULT_FEE}%`;
  const isCustomPrice = currentPrice !== null;
  const isCustomFee = currentFeePercentage !== null;
  const hasAnyCustom = isCustomPrice || isCustomFee;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-gray-900">תמחור מותאם</h3>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            עריכה
          </button>
        )}
      </div>

      {/* Trial notice */}
      {isTrial && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-blue-700">
              <span className="font-medium">חנות בנסיון</span> - המחיר והעמלות שתגדיר כאן יהיו המחיר שהחנות תשלם כשתשדרג למנוי
            </div>
          </div>
        </div>
      )}

      {!isEditing ? (
        <div className="space-y-4">
          {/* Price Display */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">מחיר חודשי</span>
              {isCustomPrice && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  מותאם
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{displayPrice}</span>
              <span className="text-gray-500">/ חודש + מע״מ</span>
            </div>
            {!isCustomPrice && (
              <p className="text-xs text-gray-400 mt-1">מחיר ברירת מחדל ({planName})</p>
            )}
          </div>

          {/* Fee Display */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">עמלת עסקאות</span>
              {isCustomFee && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  מותאם
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{displayFee}</span>
              <span className="text-gray-500">+ מע״מ על כל עסקה</span>
            </div>
            {!isCustomFee && (
              <p className="text-xs text-gray-400 mt-1">עמלה ברירת מחדל</p>
            )}
          </div>
          
          {hasAnyCustom && (
            <div className="text-xs text-gray-500 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <span className="font-medium text-amber-700">ℹ️ שים לב:</span> הגדרות אלו עוקפות את ברירת המחדל של הפלטפורמה
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Price Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מחיר חודשי (₪)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={`ברירת מחדל: ₪${defaultPrice}`}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              disabled={isPending}
            />
            <p className="text-xs text-gray-500 mt-1">
              השאר ריק להשתמש במחיר ברירת מחדל
            </p>
          </div>

          {/* Fee Percentage Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              עמלת עסקאות (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={feePercentage}
                onChange={(e) => setFeePercentage(e.target.value)}
                placeholder={`ברירת מחדל: ${DEFAULT_FEE}%`}
                className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                disabled={isPending}
              />
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              השאר ריק לעמלה ברירת מחדל (0.5%)
            </p>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isPending ? 'שומר...' : 'שמור'}
            </button>
            {(price || feePercentage) && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isPending}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                איפוס
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setPrice(currentPrice || '');
                setFeePercentage(currentFeePercentage ? (parseFloat(currentFeePercentage) * 100).toString() : '');
                setMessage(null);
              }}
              disabled={isPending}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ביטול
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
