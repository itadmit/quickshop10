'use client';

import { useState } from 'react';
import { validateCoupon } from '@/app/actions/coupon';
import { type AppliedCoupon } from '@/lib/store-context';
import { useCheckoutTranslations } from '@/lib/translations/use-translations';
import type { DeepPartial } from '@/lib/translations/types';
import type { CheckoutTranslations } from '@/lib/translations/types';

// Default formatPrice function for when not inside StoreProvider
const defaultFormatPrice = (price: number) => {
  return `₪${price.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

interface CouponInputProps {
  storeId: string;
  cartTotal: number;
  appliedCoupons: AppliedCoupon[];
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: (couponId: string) => void;
  email?: string;
  cartItems?: Array<{ productId: string; quantity: number }>;
  onTriggeredGiftCoupons?: (coupons: AppliedCoupon[]) => void; // קופוני מתנה שמופעלים אוטומטית
  onActivatedCoupons?: (coupons: AppliedCoupon[]) => void; // קופונים שמופעלים על ידי קופון משולב
  hasNonStackableAutoDiscount?: boolean; // האם יש הנחה אוטומטית שלא ניתנת לשילוב
  nonStackableAutoDiscountName?: string; // שם ההנחה האוטומטית (לחיווי טוב יותר)
  translations?: DeepPartial<CheckoutTranslations> | null;
  formatPrice?: (price: number) => string; // Optional - for use outside StoreProvider (e.g., POS)
}

export function CouponInput({ 
  storeId, 
  cartTotal, 
  appliedCoupons, 
  onApply, 
  onRemove, 
  email, 
  cartItems, 
  onTriggeredGiftCoupons,
  onActivatedCoupons,
  hasNonStackableAutoDiscount = false,
  nonStackableAutoDiscountName,
  translations,
  formatPrice = defaultFormatPrice,
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const t = useCheckoutTranslations(translations);

  // Check if we can add more coupons
  // קופונים שהוזנו ידנית (לא מופעלים אוטומטית על ידי קופון אחר)
  const manuallyAppliedCoupons = appliedCoupons.filter(c => !c.triggeredByCode);
  const hasNonStackableCoupon = manuallyAppliedCoupons.some(c => !c.stackable);
  // אם יש הנחה אוטומטית לא ניתנת לשילוב, לא ניתן להוסיף קופונים
  // אם יש קופון לא-stackable, לא ניתן להוסיף קופונים נוספים
  const canAddMore = !hasNonStackableCoupon && !hasNonStackableAutoDiscount;

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
      const result = await validateCoupon(storeId, couponCode, cartTotal, email, cartItems);
      
      if (result.success) {
        // Check if new coupon is stackable when we have existing coupons
        if (appliedCoupons.length > 0 && !result.coupon.stackable) {
          setCouponError('קופון זה לא ניתן לשילוב עם קופונים אחרים');
          return;
        }
        
        onApply(result.coupon);
        setCouponCode('');
        
        // טיפול בקופוני מתנה שמופעלים אוטומטית (legacy - gift_product עם triggerCouponCodes)
        if (result.triggeredGiftCoupons && result.triggeredGiftCoupons.length > 0 && onTriggeredGiftCoupons) {
          // המרה לפורמט AppliedCoupon
          const giftCoupons: AppliedCoupon[] = result.triggeredGiftCoupons.map(gc => ({
            id: gc.id,
            code: gc.code,
            title: gc.title,
            type: gc.type,
            value: gc.value,
            minimumAmount: gc.minimumAmount,
            minimumQuantity: gc.minimumQuantity,
            stackable: gc.stackable,
            giftProductIds: gc.giftProductIds,
            appliesTo: gc.appliesTo,
            productIds: gc.productIds,
            categoryIds: gc.categoryIds,
            excludeProductIds: gc.excludeProductIds,
            triggeredByCode: gc.triggeredByCode,
          }));
          onTriggeredGiftCoupons(giftCoupons);
        }
        
        // טיפול בקופונים שמופעלים על ידי קופון משולב (combo coupon)
        if (result.activatedCoupons && result.activatedCoupons.length > 0 && onActivatedCoupons) {
          const activatedCoupons: AppliedCoupon[] = result.activatedCoupons.map(ac => ({
            id: ac.id,
            code: ac.code,
            title: ac.title,
            type: ac.type,
            value: ac.value,
            minimumAmount: ac.minimumAmount,
            minimumQuantity: ac.minimumQuantity,
            stackable: ac.stackable,
            appliesTo: ac.appliesTo,
            productIds: ac.productIds,
            categoryIds: ac.categoryIds,
            excludeProductIds: ac.excludeProductIds,
            excludeCategoryIds: ac.excludeCategoryIds,
            giftProductIds: ac.giftProductIds,
            buyQuantity: ac.buyQuantity,
            payAmount: ac.payAmount,
            getQuantity: ac.getQuantity,
            giftSameProduct: ac.giftSameProduct,
            quantityTiers: ac.quantityTiers,
            spendAmount: ac.spendAmount,
            triggeredByCode: ac.triggeredByCode,
          }));
          onActivatedCoupons(activatedCoupons);
        }
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
    if (coupon.type === 'fixed_amount') return `-${formatPrice(coupon.value)}`;
    if (coupon.type === 'free_shipping') return 'משלוח חינם';
    if (coupon.type === 'gift_card') return `-${formatPrice(coupon.value)}`;
    if (coupon.type === 'gift_product') return 'מוצר במתנה';
    if (coupon.type === 'buy_x_pay_y' && coupon.buyQuantity && coupon.payAmount) {
      return `קנה ${coupon.buyQuantity} שלם ${formatPrice(coupon.payAmount)}`;
    }
    if (coupon.type === 'buy_x_get_y' && coupon.buyQuantity && coupon.getQuantity) {
      return `קנה ${coupon.buyQuantity} קבל ${coupon.getQuantity} חינם`;
    }
    if (coupon.type === 'spend_x_pay_y' && coupon.spendAmount && coupon.payAmount) {
      return `קנה ב-₪${coupon.spendAmount} שלם ₪${coupon.payAmount}`;
    }
    if (coupon.type === 'quantity_discount' && coupon.quantityTiers && coupon.quantityTiers.length > 0) {
      const firstTier = coupon.quantityTiers[0];
      return `קנה ${firstTier.minQuantity}+ קבל ${firstTier.discountPercent}%`;
    }
    return `-₪${coupon.value}`;
  };

  return (
    <div className="bg-white p-6 shadow-sm">
      <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-3">
        {t.coupon.title}
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
                    יתרה: {formatPrice(coupon.giftCardBalance)}
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
                {t.coupon.remove}
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
            placeholder={appliedCoupons.length > 0 ? t.coupon.addAnother : t.coupon.placeholder}
            className="flex-1 px-4 py-3 border border-gray-200 focus:border-black transition-colors text-base"
            disabled={isValidating}
          />
          <button
            type="button"
            onClick={handleApply}
            disabled={isValidating || !couponCode.trim()}
            className="px-5 py-3 bg-black text-white text-base transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isValidating ? '...' : t.coupon.apply}
          </button>
        </div>
      )}
      
      {/* Info text when coupons cannot be added */}
      {!canAddMore && (
        <p className="text-xs text-gray-400 mt-2">
          {hasNonStackableAutoDiscount
            ? `לא ניתן לשלב קופון עם ההנחה האוטומטית${nonStackableAutoDiscountName ? ` "${nonStackableAutoDiscountName}"` : ''}`
            : hasNonStackableCoupon 
              ? 'הקופון שהוחל לא ניתן לשילוב עם קופונים אחרים'
              : null}
        </p>
      )}
      
      {couponError && (
        <p className="text-xs text-red-500 mt-2">{couponError}</p>
      )}
    </div>
  );
}
