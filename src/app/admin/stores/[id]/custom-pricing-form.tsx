'use client';

import { useState, useTransition } from 'react';
import { DollarSign, Save, X } from 'lucide-react';

interface CustomPricingFormProps {
  storeId: string;
  currentPrice: string | null;
  defaultPrice: number;
  planName: string;
}

export function CustomPricingForm({ storeId, currentPrice, defaultPrice, planName }: CustomPricingFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(currentPrice || '');
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
            customPrice: price ? parseFloat(price) : null 
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'שגיאה בשמירה');
        }

        setMessage({ type: 'success', text: 'המחיר עודכן בהצלחה!' });
        setIsEditing(false);
        
        // Refresh the page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error: any) {
        setMessage({ type: 'error', text: error.message || 'שגיאה בשמירה' });
      }
    });
  };

  const handleReset = () => {
    setPrice('');
    setMessage(null);
  };

  const displayPrice = currentPrice ? `₪${parseFloat(currentPrice).toFixed(0)}` : `₪${defaultPrice}`;
  const isCustom = currentPrice !== null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-gray-900">מחיר חודשי</h3>
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

      {!isEditing ? (
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{displayPrice}</span>
              <span className="text-gray-500">/ חודש</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {isCustom ? (
                <span className="text-amber-600 font-medium">מחיר מותאם אישית</span>
              ) : (
                `מחיר ברירת מחדל (${planName})`
              )}
            </p>
          </div>
          
          {isCustom && (
            <div className="text-xs text-gray-500 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <span className="font-medium text-amber-700">ℹ️ שים לב:</span> מחיר זה עוקף את מחיר ברירת המחדל הפלטפורמה
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מחיר חודשי (₪)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={`ברירת מחדל: ₪${defaultPrice}`}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              disabled={isPending}
            />
            <p className="text-xs text-gray-500 mt-1">
              השאר ריק כדי להשתמש במחיר ברירת המחדל (₪{defaultPrice})
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
            {price && (
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

