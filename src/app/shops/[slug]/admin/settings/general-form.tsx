'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateStoreSettings } from './actions';
import { MediaUploader, UploadedMedia } from '@/components/admin/media-uploader';

interface Store {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  currency: string;
  timezone: string | null;
}

interface GeneralSettingsFormProps {
  store: Store;
  settings: Record<string, unknown>;
}

export function GeneralSettingsForm({ store, settings }: GeneralSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: store.name,
    logoUrl: store.logoUrl || '',
    faviconUrl: store.faviconUrl || '',
    currency: store.currency,
    timezone: store.timezone || 'Asia/Jerusalem',
    contactEmail: (settings.contactEmail as string) || '',
    contactPhone: (settings.contactPhone as string) || '',
    address: (settings.address as string) || '',
    facebookUrl: (settings.facebookUrl as string) || '',
    instagramUrl: (settings.instagramUrl as string) || '',
    twitterUrl: (settings.twitterUrl as string) || '',
    // הגדרות עגלות נטושות
    abandonedCartMinutes: (settings.abandonedCartMinutes as number) || 60,
    lowStockThreshold: (settings.lowStockThreshold as number) || 5,
    // הגדרות החזרות
    returnPolicyDays: (settings.returnPolicyDays as number) || 14,
    // הגדרות תצוגת מחירים
    showDecimalPrices: (settings.showDecimalPrices as boolean) ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);

    startTransition(async () => {
      const result = await updateStoreSettings(store.id, formData);
      if (result.success) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Store Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטי החנות</h2>
        
        <div className="grid gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם החנות *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              לוגו
            </label>
            <MediaUploader
              value={formData.logoUrl ? [{ 
                id: 'logo', 
                url: formData.logoUrl, 
                filename: 'logo', 
                size: 0 
              }] : []}
              onChange={(files) => setFormData(prev => ({ 
                ...prev, 
                logoUrl: files[0]?.url || '' 
              }))}
              maxFiles={1}
              multiple={false}
              folder={`quickshop/stores/${store.slug}`}
              storeId={store.id}
              storeSlug={store.slug}
              aspectRatio="16:9"
              compact={true}
              placeholder="העלה לוגו"
            />
            <p className="text-xs text-gray-500 mt-1">
              מומלץ: PNG שקוף, רוחב מינימלי 200px
            </p>
          </div>

          {/* Favicon Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favicon
            </label>
            <MediaUploader
              value={formData.faviconUrl ? [{ 
                id: 'favicon', 
                url: formData.faviconUrl, 
                filename: 'favicon', 
                size: 0 
              }] : []}
              onChange={(files) => setFormData(prev => ({ 
                ...prev, 
                faviconUrl: files[0]?.url || '' 
              }))}
              maxFiles={1}
              multiple={false}
              folder={`quickshop/stores/${store.slug}`}
              storeId={store.id}
              storeSlug={store.slug}
              aspectRatio="1:1"
              compact={true}
              placeholder="העלה favicon"
            />
            <p className="text-xs text-gray-500 mt-1">
              מומלץ: 32x32 או 64x64 פיקסלים
            </p>
          </div>

          {/* Currency & Timezone */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                מטבע
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              >
                <option value="ILS">₪ שקל ישראלי (ILS)</option>
                <option value="USD">$ דולר אמריקאי (USD)</option>
                <option value="EUR">€ אירו (EUR)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                אזור זמן
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              >
                <option value="Asia/Jerusalem">ישראל (Asia/Jerusalem)</option>
                <option value="Europe/London">לונדון (Europe/London)</option>
                <option value="America/New_York">ניו יורק (America/New_York)</option>
              </select>
            </div>
          </div>

          {/* Price Display */}
          <div className="pt-4 border-t border-gray-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showDecimalPrices}
                onChange={(e) => setFormData(prev => ({ ...prev, showDecimalPrices: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black mt-0.5"
              />
              <div>
                <span className="font-medium text-gray-900">הצג מחירים עם אגורות</span>
                <p className="text-sm text-gray-500">
                  {formData.showDecimalPrices 
                    ? 'דוגמה: ₪99.90, ₪100.00' 
                    : 'דוגמה: ₪100, ₪99'}
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטי קשר</h2>
        
        <div className="grid gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                אימייל
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                placeholder="hello@store.com"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                טלפון
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                placeholder="03-1234567"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              כתובת
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors resize-none"
              placeholder="רחוב הרצל 15, תל אביב"
            />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">רשתות חברתיות</h2>
        
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Facebook
            </label>
            <input
              type="url"
              value={formData.facebookUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, facebookUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="https://facebook.com/..."
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instagram
            </label>
            <input
              type="url"
              value={formData.instagramUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, instagramUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="https://instagram.com/..."
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Twitter / X
            </label>
            <input
              type="url"
              value={formData.twitterUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, twitterUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="https://x.com/..."
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">הגדרות מתקדמות</h2>
        
        <div className="grid gap-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                זמן עגלה נטושה (דקות)
              </label>
              <input
                type="number"
                min="10"
                max="1440"
                value={formData.abandonedCartMinutes}
                onChange={(e) => setFormData(prev => ({ ...prev, abandonedCartMinutes: parseInt(e.target.value) || 60 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                אחרי כמה דקות הזמנה ממתינה לתשלום נחשבת לעגלה נטושה (ברירת מחדל: 60 דקות)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                סף מלאי נמוך
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 5 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                מתחת לכמה יחידות המלאי ייחשב כנמוך (ברירת מחדל: 5)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ימים להחזרה
              </label>
              <input
                type="number"
                min="0"
                max="365"
                value={formData.returnPolicyDays}
                onChange={(e) => setFormData(prev => ({ ...prev, returnPolicyDays: parseInt(e.target.value) || 14 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                תוך כמה ימים ניתן לבקש החזרה/החלפה (ברירת מחדל: 14 ימים, 0 = ללא הגבלה)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isPending ? 'שומר...' : 'שמור שינויים'}
        </button>
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            נשמר בהצלחה
          </span>
        )}
      </div>
    </form>
  );
}


