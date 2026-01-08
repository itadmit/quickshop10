'use client';

/**
 * Loyalty Checkout Widget
 * 
 * Client Component - פדיון נקודות בצ'קאאוט
 * Optimistic UI - עדכון מיידי של הסכום
 */

import { useState, useTransition } from 'react';
import { Star, Gift, Check } from 'lucide-react';

interface LoyaltyCheckoutWidgetProps {
  currentPoints: number;
  pointsValue: number;
  minPointsToRedeem: number;
  pointsRedemptionRate: number;
  onRedeemPoints: (points: number) => Promise<{ success: boolean; discountCode?: string; discountValue?: number; error?: string }>;
  maxDiscount?: number; // Maximum discount based on order total
}

export function LoyaltyCheckoutWidget({
  currentPoints,
  pointsValue,
  minPointsToRedeem,
  pointsRedemptionRate,
  onRedeemPoints,
  maxDiscount,
}: LoyaltyCheckoutWidgetProps) {
  const [isPending, startTransition] = useTransition();
  const [pointsToUse, setPointsToUse] = useState(0);
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; value: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const canRedeem = currentPoints >= minPointsToRedeem;
  const maxPointsToUse = maxDiscount 
    ? Math.min(currentPoints, Math.floor(maxDiscount / pointsRedemptionRate))
    : currentPoints;
  const discountPreview = pointsToUse * pointsRedemptionRate;
  
  const handleSliderChange = (value: number) => {
    setPointsToUse(value);
    setError(null);
  };
  
  const handleApply = () => {
    if (pointsToUse < minPointsToRedeem) {
      setError(`מינימום ${minPointsToRedeem} נקודות לפדיון`);
      return;
    }
    
    startTransition(async () => {
      const result = await onRedeemPoints(pointsToUse);
      if (result.success && result.discountCode && result.discountValue) {
        setAppliedDiscount({
          code: result.discountCode,
          value: result.discountValue,
        });
      } else {
        setError(result.error || 'שגיאה בפדיון הנקודות');
      }
    });
  };
  
  const handleRemove = () => {
    setAppliedDiscount(null);
    setPointsToUse(0);
  };
  
  // If already applied
  if (appliedDiscount) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              נוצלו {pointsToUse.toLocaleString('he-IL')} נקודות
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-green-600">
              -₪{appliedDiscount.value.toLocaleString('he-IL')}
            </span>
            <button
              onClick={handleRemove}
              className="text-xs text-green-600 hover:text-green-800 underline"
            >
              הסר
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Not enough points
  if (!canRedeem) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <Star className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600">
              יש לך <span className="font-semibold">{currentPoints.toLocaleString('he-IL')}</span> נקודות
            </p>
            <p className="text-xs text-gray-500">
              צריך לפחות {minPointsToRedeem} נקודות לפדיון
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-5 h-5 text-amber-600" />
        <h3 className="font-medium text-amber-900">השתמש בנקודות שלך</h3>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-amber-800">
            זמינות: {currentPoints.toLocaleString('he-IL')} נקודות
          </span>
          <span className="font-medium text-amber-900">
            (שווי ₪{pointsValue.toLocaleString('he-IL')})
          </span>
        </div>
        
        {/* Points Slider */}
        <input
          type="range"
          min={0}
          max={maxPointsToUse}
          step={10}
          value={pointsToUse}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
        />
        
        <div className="flex items-center justify-between text-xs text-amber-600 mt-1">
          <span>0</span>
          <span>{maxPointsToUse.toLocaleString('he-IL')}</span>
        </div>
      </div>
      
      {/* Preview */}
      <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg mb-4">
        <div>
          <p className="text-sm text-amber-800">
            {pointsToUse > 0 ? (
              <>
                <span className="font-semibold">{pointsToUse.toLocaleString('he-IL')}</span> נקודות
              </>
            ) : (
              'בחר כמות נקודות'
            )}
          </p>
        </div>
        <div className="text-left">
          <p className="text-lg font-bold text-amber-900">
            {pointsToUse > 0 ? `-₪${discountPreview.toLocaleString('he-IL')}` : '₪0'}
          </p>
        </div>
      </div>
      
      {error && (
        <p className="text-xs text-red-600 mb-3">{error}</p>
      )}
      
      <button
        onClick={handleApply}
        disabled={isPending || pointsToUse < minPointsToRedeem}
        className="w-full py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'מחיל...' : 'החל הנחה'}
      </button>
      
      <p className="text-xs text-amber-600 text-center mt-2">
        מינימום {minPointsToRedeem} נקודות
      </p>
    </div>
  );
}

