'use client';

import { useState } from 'react';
import { validateCoupon } from '@/app/actions/coupon';

type DiscountType = 
  | 'percentage' 
  | 'fixed_amount' 
  | 'free_shipping'
  | 'buy_x_pay_y'
  | 'buy_x_get_y'
  | 'quantity_discount'
  | 'spend_x_pay_y'
  | 'gift_card';

export type AppliedCoupon = {
  id: string;
  code: string;
  title: string | null;
  type: DiscountType;
  value: number;
  stackable: boolean;
  minimumAmount: number | null;
  isGiftCard?: boolean;
  giftCardBalance?: number;
};

interface CouponInputProps {
  cartTotal: number;
  appliedCoupons: AppliedCoupon[];
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: (couponId: string) => void;
  email?: string;
}

export function CouponInput({ cartTotal, appliedCoupons, onApply, onRemove, email }: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Check if we can add more coupons
  const hasNonStackableCoupon = appliedCoupons.some(c => !c.stackable);
  const canAddMore = !hasNonStackableCoupon && appliedCoupons.length < 3; // Max 3 coupons

  const handleApply = async () => {
    setCouponError('');
    
    if (!couponCode.trim()) return;

    // Check if already applied
    if (appliedCoupons.some(c => c.code === couponCode.toUpperCase())) {
      setCouponError('קופון זה כבר הוחל');
      return;
    }

    // Check if can add more
    if (!canAddMore) {
      setCouponError('לא ניתן לשלב קופון נוסף');
      return;
    }
    
    setIsValidating(true);
    
    try {
      const result = await validateCoupon(couponCode, cartTotal, email);
      
      if (result.success) {
        // Check if new coupon is stackable when we have existing coupons
        if (appliedCoupons.length > 0 && !result.coupon.stackable) {
          setCouponError('קופון זה לא ניתן לשילוב עם קופונים אחרים');
          return;
        }
        
        onApply(result.coupon);
        setCouponCode('');
      } else {
        setCouponError(result.error);
      }
    } catch {
      setCouponError('שגיאה בבדיקת הקופון');
    } finally {
      setIsValidating(false);
    }
  };

  const formatCouponValue = (coupon: AppliedCoupon) => {
    if (coupon.type === 'percentage') return `-${coupon.value}%`;
    if (coupon.type === 'free_shipping') return 'משלוח חינם';
    if (coupon.type === 'gift_card') return `-₪${coupon.value.toFixed(0)}`;
    return `-₪${coupon.value}`;
  };

  return (
    <div className="bg-white p-6 shadow-sm">
      <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-3">
        יש לך קופון?
      </label>
      
      {/* Applied coupons list */}
      {appliedCoupons.length > 0 && (
        <div className="space-y-2 mb-3">
          {appliedCoupons.map(coupon => (
            <div 
              key={coupon.id} 
              className={`flex items-center justify-between px-4 py-3 ${
                coupon.isGiftCard 
                  ? 'bg-purple-50 border border-purple-200' 
                  : 'bg-green-50 border border-green-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {coupon.isGiftCard ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                    <rect x="3" y="8" width="18" height="13" rx="2"/>
                    <path d="M12 8V3M7 8V6a2 2 0 012-2h0a2 2 0 012 2v2m0-2a2 2 0 012-2h0a2 2 0 012 2v2"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                <span className={`text-sm font-medium ${coupon.isGiftCard ? 'text-purple-700' : 'text-green-700'}`}>
                  {coupon.code}
                </span>
                <span className={`text-xs ${coupon.isGiftCard ? 'text-purple-600' : 'text-green-600'}`}>
                  ({formatCouponValue(coupon)})
                </span>
                {coupon.isGiftCard && coupon.giftCardBalance && (
                  <span className="text-[10px] text-purple-400 mr-1">
                    יתרה: ₪{coupon.giftCardBalance.toFixed(0)}
                  </span>
                )}
                {!coupon.stackable && !coupon.isGiftCard && (
                  <span className="text-[10px] text-gray-400 mr-1">לא ניתן לשילוב</span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => onRemove(coupon.id)}
                className="text-xs text-gray-500 hover:text-black underline cursor-pointer"
              >
                הסר
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Add coupon input */}
      {canAddMore && (
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApply())}
            placeholder={appliedCoupons.length > 0 ? "הוסף קופון נוסף" : "הזן קוד קופון"}
            className="flex-1 px-4 py-3 border border-gray-200 focus:border-black transition-colors text-sm"
            disabled={isValidating}
          />
          <button
            type="button"
            onClick={handleApply}
            disabled={isValidating || !couponCode.trim()}
            className="px-5 py-3 bg-black text-white text-sm transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isValidating ? '...' : 'החל'}
          </button>
        </div>
      )}
      
      {/* Info text when max coupons reached */}
      {!canAddMore && appliedCoupons.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          {hasNonStackableCoupon 
            ? 'הקופון שהוחל לא ניתן לשילוב עם קופונים אחרים'
            : 'הגעת למקסימום הקופונים'}
        </p>
      )}
      
      {couponError && (
        <p className="text-xs text-red-500 mt-2">{couponError}</p>
      )}
    </div>
  );
}
