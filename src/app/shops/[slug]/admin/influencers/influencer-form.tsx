'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createInfluencer, updateInfluencer } from './actions';

interface Discount {
  id: string;
  code: string;
  type: string;
  value: string;
}

interface Influencer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  instagramHandle: string | null;
  instagramFollowers: number | null;
  tiktokHandle: string | null;
  tiktokFollowers: number | null;
  youtubeChannel: string | null;
  youtubeSubscribers: number | null;
  commissionType: string | null;
  commissionValue: string | null;
  showCommission: boolean;
  showCustomerNames: boolean;
  showOrderDetails: boolean;
  couponCode: string | null;
  discountId: string | null;
  isActive: boolean;
  notes: string | null;
}

interface InfluencerFormProps {
  storeId: string;
  storeSlug: string;
  mode: 'create' | 'edit';
  influencer?: Influencer;
  availableDiscounts: Discount[];
}

export function InfluencerForm({ 
  storeId, 
  storeSlug, 
  mode, 
  influencer, 
  availableDiscounts 
}: InfluencerFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: influencer?.name || '',
    email: influencer?.email || '',
    phone: influencer?.phone || '',
    password: '',
    instagramHandle: influencer?.instagramHandle || '',
    instagramFollowers: influencer?.instagramFollowers?.toString() || '',
    tiktokHandle: influencer?.tiktokHandle || '',
    tiktokFollowers: influencer?.tiktokFollowers?.toString() || '',
    youtubeChannel: influencer?.youtubeChannel || '',
    youtubeSubscribers: influencer?.youtubeSubscribers?.toString() || '',
    commissionType: influencer?.commissionType || 'percentage',
    commissionValue: influencer?.commissionValue || '',
    showCommission: influencer?.showCommission ?? true,
    showCustomerNames: influencer?.showCustomerNames ?? true,
    showOrderDetails: influencer?.showOrderDetails ?? true,
    discountId: influencer?.discountId || '',
    isActive: influencer?.isActive ?? true,
    notes: influencer?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('נא להזין שם');
      return;
    }

    if (!formData.email.trim()) {
      setError('נא להזין אימייל');
      return;
    }

    if (mode === 'create' && !formData.password.trim()) {
      setError('נא להזין סיסמה');
      return;
    }

    startTransition(async () => {
      try {
        const data = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          password: formData.password || null,
          instagramHandle: formData.instagramHandle.trim() || null,
          instagramFollowers: formData.instagramFollowers ? parseInt(formData.instagramFollowers) : null,
          tiktokHandle: formData.tiktokHandle.trim() || null,
          tiktokFollowers: formData.tiktokFollowers ? parseInt(formData.tiktokFollowers) : null,
          youtubeChannel: formData.youtubeChannel.trim() || null,
          youtubeSubscribers: formData.youtubeSubscribers ? parseInt(formData.youtubeSubscribers) : null,
          commissionType: formData.commissionType as 'percentage' | 'fixed_amount',
          commissionValue: formData.commissionValue ? parseFloat(formData.commissionValue) : null,
          showCommission: formData.showCommission,
          showCustomerNames: formData.showCustomerNames,
          showOrderDetails: formData.showOrderDetails,
          discountId: formData.discountId || null,
          isActive: formData.isActive,
          notes: formData.notes.trim() || null,
        };

        let result;
        if (mode === 'create') {
          result = await createInfluencer(storeId, storeSlug, data);
        } else if (influencer) {
          result = await updateInfluencer(influencer.id, storeSlug, data);
        }

        if (result?.error) {
          setError(result.error);
          return;
        }

        router.push(`/shops/${storeSlug}/admin/influencers`);
        router.refresh();
      } catch {
        setError('אירעה שגיאה. נסה שוב.');
      }
    });
  };

  // Get selected discount info
  const selectedDiscount = availableDiscounts.find(d => d.id === formData.discountId);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטי משפיען</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם מלא *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="נועה כהן"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              אימייל *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="noa@example.com"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              טלפון
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="050-1234567"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {mode === 'create' ? 'סיסמה *' : 'סיסמה חדשה'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder={mode === 'edit' ? 'השאר ריק לשמירת הסיסמה הקיימת' : '••••••••'}
              dir="ltr"
            />
            {mode === 'edit' && (
              <p className="text-xs text-gray-500 mt-1">השאר ריק אם אין צורך לשנות את הסיסמה</p>
            )}
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">רשתות חברתיות</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="text-pink-600">אינסטגרם</span> - שם משתמש
            </label>
            <input
              type="text"
              value={formData.instagramHandle}
              onChange={(e) => setFormData(prev => ({ ...prev, instagramHandle: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="@username"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              עוקבים באינסטגרם
            </label>
            <input
              type="number"
              value={formData.instagramFollowers}
              onChange={(e) => setFormData(prev => ({ ...prev, instagramFollowers: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="125000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="text-gray-900">TikTok</span> - שם משתמש
            </label>
            <input
              type="text"
              value={formData.tiktokHandle}
              onChange={(e) => setFormData(prev => ({ ...prev, tiktokHandle: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="@username"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              עוקבים בטיקטוק
            </label>
            <input
              type="number"
              value={formData.tiktokFollowers}
              onChange={(e) => setFormData(prev => ({ ...prev, tiktokFollowers: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="50000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="text-red-600">YouTube</span> - ערוץ
            </label>
            <input
              type="text"
              value={formData.youtubeChannel}
              onChange={(e) => setFormData(prev => ({ ...prev, youtubeChannel: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="שם הערוץ"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מנויים ביוטיוב
            </label>
            <input
              type="number"
              value={formData.youtubeSubscribers}
              onChange={(e) => setFormData(prev => ({ ...prev, youtubeSubscribers: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="10000"
            />
          </div>
        </div>
      </div>

      {/* Commission Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">הגדרות עמלה</h2>
        <p className="text-sm text-gray-500 mb-4">כמה המשפיען מקבל מכל מכירה (אופציונלי)</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סוג עמלה
            </label>
            <select
              value={formData.commissionType}
              onChange={(e) => setFormData(prev => ({ ...prev, commissionType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
            >
              <option value="percentage">אחוזים</option>
              <option value="fixed_amount">סכום קבוע</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ערך העמלה
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max={formData.commissionType === 'percentage' ? 100 : undefined}
                value={formData.commissionValue}
                onChange={(e) => setFormData(prev => ({ ...prev, commissionValue: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                placeholder={formData.commissionType === 'percentage' ? '10' : '50'}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {formData.commissionType === 'percentage' ? '%' : '₪'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">השאר ריק אם לא רוצים להגדיר עמלה</p>
          </div>
        </div>
      </div>

      {/* Linked Discount */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">קופון משויך</h2>
        <p className="text-sm text-gray-500 mb-4">שייך קופון למעקב אחרי המכירות של המשפיען</p>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            בחר קופון
          </label>
          <select
            value={formData.discountId}
            onChange={(e) => setFormData(prev => ({ ...prev, discountId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
          >
            <option value="">ללא שיוך</option>
            {availableDiscounts.map(discount => (
              <option key={discount.id} value={discount.id}>
                {discount.code} ({discount.value}{discount.type === 'percentage' ? '%' : '₪'})
              </option>
            ))}
          </select>
          {selectedDiscount && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
              <p className="text-sm text-purple-700">
                <strong>{selectedDiscount.code}</strong> - {selectedDiscount.value}{selectedDiscount.type === 'percentage' ? '%' : '₪'} הנחה
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link
            href={`/shops/${storeSlug}/admin/discounts/new`}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            ← צור קופון חדש
          </Link>
        </div>
      </div>

      {/* Visibility Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">הגדרות נראות בדשבורד</h2>
        <p className="text-sm text-gray-500 mb-4">שלוט מה המשפיען יראה בדשבורד שלו</p>
        
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.showCommission}
              onChange={(e) => setFormData(prev => ({ ...prev, showCommission: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 mt-0.5"
            />
            <div>
              <span className="font-medium text-gray-900">הצג עמלות</span>
              <p className="text-sm text-gray-500">המשפיען יראה את סכום העמלה שלו מכל מכירה</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.showCustomerNames}
              onChange={(e) => setFormData(prev => ({ ...prev, showCustomerNames: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 mt-0.5"
            />
            <div>
              <span className="font-medium text-gray-900">הצג שמות לקוחות</span>
              <p className="text-sm text-gray-500">המשפיען יראה את שמות הלקוחות שקנו עם הקופון שלו</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.showOrderDetails}
              onChange={(e) => setFormData(prev => ({ ...prev, showOrderDetails: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 mt-0.5"
            />
            <div>
              <span className="font-medium text-gray-900">הצג פרטי הזמנות</span>
              <p className="text-sm text-gray-500">המשפיען יראה את הסכומים המלאים של כל הזמנה</p>
            </div>
          </label>
        </div>
      </div>

      {/* Status & Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">סטטוס והערות</h2>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="font-medium text-gray-900">משפיען פעיל</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              הערות פנימיות
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors resize-none"
              placeholder="הערות פנימיות (לא יוצג למשפיען)"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Link
          href={`/shops/${storeSlug}/admin/influencers`}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          ביטול
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
        >
          {isPending ? 'שומר...' : mode === 'create' ? 'צור משפיען' : 'שמור שינויים'}
        </button>
      </div>
    </form>
  );
}

