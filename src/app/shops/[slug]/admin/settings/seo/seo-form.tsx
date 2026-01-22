'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSeoSettings } from './actions';
import { MediaUploader } from '@/components/admin/media-uploader';

// ============================================
// SEO Settings Form
// ============================================

interface Store {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  customDomain: string | null;
}

interface SeoSettingsFormProps {
  store: Store;
  seoSettings: Record<string, unknown>;
}

export function SeoSettingsForm({ store, seoSettings }: SeoSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    siteTitle: (seoSettings.siteTitle as string) || '',
    siteDescription: (seoSettings.siteDescription as string) || '',
    ogImage: (seoSettings.ogImage as string) || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);

    startTransition(async () => {
      const result = await updateSeoSettings(store.id, formData);
      if (result.success) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  // Build preview URL
  const siteUrl = store.customDomain 
    ? `https://${store.customDomain}` 
    : `https://${store.slug}.quickshop.co.il`;

  // Preview values
  const previewTitle = formData.siteTitle 
    ? `${store.name} | ${formData.siteTitle}`
    : store.name;
  const previewDescription = formData.siteDescription || `חנות ${store.name} - קנו אונליין במחירים משתלמים`;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Google Preview */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">תצוגה מקדימה בגוגל</h3>
        
        <div className="bg-gray-50 rounded-lg p-4 max-w-2xl" dir="ltr">
          {/* Google Search Result Preview */}
          <div className="font-sans">
            <div className="text-sm text-gray-600 mb-1">{siteUrl}</div>
            <h3 className="text-xl text-blue-800 hover:underline cursor-pointer mb-1">
              {previewTitle}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {previewDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Social Share Preview */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">תצוגה מקדימה בשיתוף (WhatsApp, Facebook)</h3>
        
        <div className="bg-gray-50 rounded-lg overflow-hidden max-w-md border border-gray-200">
          {/* OG Image Preview */}
          <div className="aspect-[1.91/1] bg-gray-200 relative">
            {formData.ogImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={formData.ogImage} 
                alt="OG Preview" 
                className="w-full h-full object-cover"
              />
            ) : store.logoUrl ? (
              <div className="w-full h-full flex items-center justify-center bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={store.logoUrl} 
                  alt="Logo" 
                  className="max-w-[60%] max-h-[60%] object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/quickshop-og.png" 
                  alt="QuickShop" 
                  className="max-w-[60%] max-h-[60%] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="text-white text-2xl font-bold absolute">QuickShop</span>
              </div>
            )}
          </div>
          
          {/* OG Text Preview */}
          <div className="p-3 bg-white" dir="rtl">
            <div className="text-xs text-gray-500 uppercase mb-1">
              {store.customDomain || `${store.slug}.quickshop.co.il`}
            </div>
            <h4 className="font-semibold text-gray-900 text-sm mb-1">{previewTitle}</h4>
            <p className="text-xs text-gray-600 line-clamp-2">{previewDescription}</p>
          </div>
        </div>
      </div>

      {/* SEO Fields */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">הגדרות SEO</h3>
        
        <div className="space-y-6">
          {/* Site Title */}
          <div>
            <label htmlFor="siteTitle" className="block text-sm font-medium text-gray-700 mb-2">
              כותרת האתר (Tagline)
            </label>
            <input
              type="text"
              id="siteTitle"
              value={formData.siteTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, siteTitle: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-right"
              placeholder="לדוגמה: אופנה בסגנון, חנות הבגדים המובילה"
              maxLength={60}
              dir="rtl"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">
                יופיע בטאב הדפדפן אחרי שם החנות
              </p>
              <span className={`text-xs ${formData.siteTitle.length > 50 ? 'text-amber-600' : 'text-gray-400'}`}>
                {formData.siteTitle.length}/60
              </span>
            </div>
          </div>

          {/* Meta Description */}
          <div>
            <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 mb-2">
              תיאור האתר (Meta Description)
            </label>
            <textarea
              id="siteDescription"
              value={formData.siteDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, siteDescription: e.target.value }))}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-right resize-none"
              placeholder="תיאור קצר של החנות שיופיע בתוצאות החיפוש של גוגל"
              maxLength={160}
              dir="rtl"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">
                מומלץ 120-160 תווים
              </p>
              <span className={`text-xs ${formData.siteDescription.length > 150 ? 'text-amber-600' : 'text-gray-400'}`}>
                {formData.siteDescription.length}/160
              </span>
            </div>
          </div>

          {/* OG Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              תמונת שיתוף (OG Image)
            </label>
            <MediaUploader
              value={formData.ogImage ? [{ 
                id: 'og-image', 
                url: formData.ogImage, 
                filename: 'og-image', 
                size: 0 
              }] : []}
              onChange={(files) => setFormData(prev => ({ 
                ...prev, 
                ogImage: files[0]?.url || '' 
              }))}
              maxFiles={1}
              multiple={false}
              folder={`quickshop/stores/${store.slug}`}
              storeId={store.id}
              storeSlug={store.slug}
              aspectRatio="1.91:1"
              compact={false}
              placeholder="העלה תמונת שיתוף"
            />
            <p className="text-xs text-gray-500 mt-2">
              מומלץ: 1200x630 פיקסלים. תופיע כשמשתפים את האתר ב-WhatsApp, Facebook וכו׳.
              <br />
              אם לא תעלה תמונה, ישתמש בלוגו החנות. אם אין לוגו, יוצג לוגו QuickShop.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-2 text-sm text-green-600">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            נשמר בהצלחה
          </span>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isPending ? 'שומר...' : 'שמור שינויים'}
        </button>
      </div>
    </form>
  );
}



