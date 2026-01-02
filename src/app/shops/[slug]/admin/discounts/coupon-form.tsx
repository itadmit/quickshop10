'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCoupon, updateCoupon } from './actions';

interface Coupon {
  id: string;
  code: string;
  title: string | null;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: string;
  minimumAmount: string | null;
  usageLimit: number | null;
  oncePerCustomer: boolean;
  firstOrderOnly: boolean;
  stackable: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  influencerId?: string | null;
}

interface Influencer {
  id: string;
  name: string;
  email: string;
}

interface CouponFormProps {
  storeId: string;
  mode: 'create' | 'edit';
  coupon?: Coupon;
  influencers?: Influencer[];
}

export function CouponForm({ storeId, mode, coupon, influencers = [] }: CouponFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    title: coupon?.title || '',
    type: coupon?.type || 'percentage' as const,
    value: coupon?.value || '',
    minimumAmount: coupon?.minimumAmount || '',
    usageLimit: coupon?.usageLimit?.toString() || '',
    oncePerCustomer: coupon?.oncePerCustomer ?? false,
    firstOrderOnly: coupon?.firstOrderOnly ?? false,
    stackable: coupon?.stackable ?? true,
    startsAt: coupon?.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 10) : '',
    endsAt: coupon?.endsAt ? new Date(coupon.endsAt).toISOString().slice(0, 10) : '',
    isActive: coupon?.isActive ?? true,
    influencerId: coupon?.influencerId || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const data = {
          ...formData,
          value: parseFloat(formData.value) || 0,
          minimumAmount: formData.minimumAmount ? parseFloat(formData.minimumAmount) : null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
          startsAt: formData.startsAt ? new Date(formData.startsAt) : null,
          endsAt: formData.endsAt ? new Date(formData.endsAt) : null,
          influencerId: formData.influencerId || null,
        };

        if (mode === 'create') {
          const result = await createCoupon(storeId, data);
          if (result.error) {
            setError(result.error);
            return;
          }
        } else if (coupon) {
          const result = await updateCoupon(coupon.id, data);
          if (result.error) {
            setError(result.error);
            return;
          }
        }
        setIsOpen(false);
        router.refresh();
      } catch {
        setError('אירעה שגיאה. נסה שוב.');
      }
    });
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  return (
    <>
      {/* Trigger Button */}
      {mode === 'create' ? (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          קופון חדש
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="ערוך"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto modal-scroll p-6 text-right">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {mode === 'create' ? 'קופון חדש' : 'עריכת קופון'}
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    קוד קופון *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors font-mono"
                      placeholder="WELCOME15"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      צור אוטומטי
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם (אופציונלי)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                    placeholder="הנחת לקוחות חדשים"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    סוג הנחה
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'percentage' | 'fixed_amount' | 'free_shipping' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                  >
                    <option value="percentage">אחוז הנחה</option>
                    <option value="fixed_amount">סכום קבוע</option>
                    <option value="free_shipping">משלוח חינם</option>
                  </select>
                </div>

                {/* Value */}
                {formData.type !== 'free_shipping' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.type === 'percentage' ? 'אחוז הנחה' : 'סכום הנחה'} *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0"
                        max={formData.type === 'percentage' ? 100 : undefined}
                        step="0.01"
                        value={formData.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                        placeholder={formData.type === 'percentage' ? '15' : '50'}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {formData.type === 'percentage' ? '%' : '₪'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Minimum Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    סכום מינימום להזמנה
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.minimumAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, minimumAmount: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                      placeholder="100"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₪</span>
                  </div>
                </div>

                {/* Usage Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מגבלת שימושים
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                    placeholder="ללא הגבלה"
                  />
                  <p className="text-xs text-gray-500 mt-1">השאר ריק לשימוש ללא הגבלה</p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      תאריך התחלה
                    </label>
                    <input
                      type="date"
                      value={formData.startsAt}
                      onChange={(e) => setFormData(prev => ({ ...prev, startsAt: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      תאריך סיום
                    </label>
                    <input
                      type="date"
                      value={formData.endsAt}
                      onChange={(e) => setFormData(prev => ({ ...prev, endsAt: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                    />
                  </div>
                </div>

                {/* Influencer Assignment */}
                {influencers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      שיוך למשפיען
                    </label>
                    <select
                      value={formData.influencerId}
                      onChange={(e) => setFormData(prev => ({ ...prev, influencerId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                    >
                      <option value="">ללא שיוך</option>
                      {influencers.map(inf => (
                        <option key={inf.id} value={inf.id}>
                          👑 {inf.name} ({inf.email})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      משפיען משויך יראה מכירות מקופון זה בדשבורד שלו
                    </p>
                  </div>
                )}

                {/* Restrictions */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.oncePerCustomer}
                      onChange={(e) => setFormData(prev => ({ ...prev, oncePerCustomer: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black/20"
                    />
                    <span className="text-sm text-gray-700">שימוש אחד ללקוח</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.firstOrderOnly}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstOrderOnly: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black/20"
                    />
                    <span className="text-sm text-gray-700">להזמנה ראשונה בלבד</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.stackable}
                      onChange={(e) => setFormData(prev => ({ ...prev, stackable: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black/20"
                    />
                    <span className="text-sm text-gray-700">ניתן לשלב עם הנחות אחרות</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black/20"
                    />
                    <span className="text-sm text-gray-700">קופון פעיל</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-2.5 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
                  >
                    {isPending ? 'שומר...' : mode === 'create' ? 'צור קופון' : 'שמור שינויים'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

