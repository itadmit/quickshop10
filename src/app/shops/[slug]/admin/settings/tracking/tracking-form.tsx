'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateTrackingSettings } from '../actions';

interface TrackingSettingsFormProps {
  storeId: string;
  settings: Record<string, unknown>;
}

export function TrackingSettingsForm({ storeId, settings }: TrackingSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    // Facebook
    facebookPixelId: (settings.facebookPixelId as string) || '',
    facebookPixelEnabled: (settings.facebookPixelEnabled as boolean) ?? false,
    facebookAccessToken: (settings.facebookAccessToken as string) || '',
    // Google
    googleAnalyticsId: (settings.googleAnalyticsId as string) || '',
    googleAnalyticsEnabled: (settings.googleAnalyticsEnabled as boolean) ?? false,
    googleApiSecret: (settings.googleApiSecret as string) || '',
    // GTM
    gtmContainerId: (settings.gtmContainerId as string) || '',
    gtmEnabled: (settings.gtmEnabled as boolean) ?? false,
    // TikTok
    tiktokPixelId: (settings.tiktokPixelId as string) || '',
    tiktokPixelEnabled: (settings.tiktokPixelEnabled as boolean) ?? false,
    tiktokAccessToken: (settings.tiktokAccessToken as string) || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);

    startTransition(async () => {
      const result = await updateTrackingSettings(storeId, formData);
      if (result.success) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  const hasServerSideConfig = formData.facebookAccessToken || formData.tiktokAccessToken || formData.googleApiSecret;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Server-Side Tracking Badge */}
      {hasServerSideConfig && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">Server-Side Tracking פעיל</p>
            <p className="text-xs text-green-600">הנתונים נשלחים גם מהשרת - עוקף חסימות iOS 14+ ו-Ad Blockers</p>
          </div>
        </div>
      )}

      {/* Facebook Pixel */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Facebook Pixel</h3>
              <p className="text-sm text-gray-500">מעקב המרות ופרסום בפייסבוק</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.facebookPixelEnabled}
              onChange={(e) => setFormData(prev => ({ ...prev, facebookPixelEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
          </label>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pixel ID
            </label>
            <input
              type="text"
              value={formData.facebookPixelId}
              onChange={(e) => setFormData(prev => ({ ...prev, facebookPixelId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="1234567890123456"
              dir="ltr"
            />
          </div>
          {showAdvanced && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Token <span className="text-xs text-gray-400">(ל-Conversions API)</span>
              </label>
              <input
                type="password"
                value={formData.facebookAccessToken}
                onChange={(e) => setFormData(prev => ({ ...prev, facebookAccessToken: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                placeholder="EAAxxxxxx..."
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">ניתן להשיג ב-Events Manager → Settings → Generate Access Token</p>
            </div>
          )}
        </div>
      </div>

      {/* Google Analytics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.84 2.998a1.5 1.5 0 0 0-2.121 0l-4.95 4.95-1.414-1.414a1.5 1.5 0 0 0-2.121 2.121l2.475 2.475a1.5 1.5 0 0 0 2.121 0l6.01-6.01a1.5 1.5 0 0 0 0-2.122zM12 22c-5.523 0-10-4.477-10-10S6.477 2 12 2v2a8 8 0 1 0 8 8h2c0 5.523-4.477 10-10 10z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Google Analytics 4</h3>
              <p className="text-sm text-gray-500">מעקב תנועה והתנהגות משתמשים</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.googleAnalyticsEnabled}
              onChange={(e) => setFormData(prev => ({ ...prev, googleAnalyticsEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
          </label>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Measurement ID
            </label>
            <input
              type="text"
              value={formData.googleAnalyticsId}
              onChange={(e) => setFormData(prev => ({ ...prev, googleAnalyticsId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="G-XXXXXXXXXX"
              dir="ltr"
            />
          </div>
          {showAdvanced && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Secret <span className="text-xs text-gray-400">(ל-Measurement Protocol)</span>
              </label>
              <input
                type="password"
                value={formData.googleApiSecret}
                onChange={(e) => setFormData(prev => ({ ...prev, googleApiSecret: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                placeholder="xxxxxxxxxxxxxxxx"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">ניתן להשיג ב-GA4 → Admin → Data Streams → Measurement Protocol API secrets</p>
            </div>
          )}
        </div>
      </div>

      {/* GTM */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0L1.5 6v12L12 24l10.5-6V6L12 0zm0 2.25L20.25 7v10L12 21.75 3.75 17V7L12 2.25z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Google Tag Manager</h3>
              <p className="text-sm text-gray-500">ניהול תגיות מרכזי</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.gtmEnabled}
              onChange={(e) => setFormData(prev => ({ ...prev, gtmEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Container ID
          </label>
          <input
            type="text"
            value={formData.gtmContainerId}
            onChange={(e) => setFormData(prev => ({ ...prev, gtmContainerId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
            placeholder="GTM-XXXXXXX"
            dir="ltr"
          />
        </div>
      </div>

      {/* TikTok Pixel */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">TikTok Pixel</h3>
              <p className="text-sm text-gray-500">מעקב המרות בטיקטוק</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.tiktokPixelEnabled}
              onChange={(e) => setFormData(prev => ({ ...prev, tiktokPixelEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
          </label>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pixel ID
            </label>
            <input
              type="text"
              value={formData.tiktokPixelId}
              onChange={(e) => setFormData(prev => ({ ...prev, tiktokPixelId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="XXXXXXXXXXXXXXXXX"
              dir="ltr"
            />
          </div>
          {showAdvanced && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Token <span className="text-xs text-gray-400">(ל-Events API)</span>
              </label>
              <input
                type="password"
                value={formData.tiktokAccessToken}
                onChange={(e) => setFormData(prev => ({ ...prev, tiktokAccessToken: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                placeholder="xxxxxxxxxxxxxxxx"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">ניתן להשיג ב-TikTok Ads Manager → Events → Web Events → Settings</p>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg 
          className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {showAdvanced ? 'הסתר הגדרות מתקדמות' : 'הצג הגדרות מתקדמות (Server-Side Tracking)'}
      </button>

      {/* Events List */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">14 אירועים נתמכים - יותר משופיפיי! 🚀</h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div className="space-y-1">
            <p>• <strong>PageView</strong> - צפייה בדף</p>
            <p>• <strong>ViewHomePage</strong> - צפייה בדף הבית</p>
            <p>• <strong>Search</strong> - חיפוש</p>
            <p>• <strong>ViewCategory</strong> - צפייה בקטגוריה</p>
            <p>• <strong>ViewContent</strong> - צפייה במוצר</p>
            <p>• <strong>AddToCart</strong> - הוספה לסל</p>
            <p>• <strong>RemoveFromCart</strong> - הסרה מסל</p>
          </div>
          <div className="space-y-1">
            <p>• <strong>UpdateCart</strong> - עדכון כמות</p>
            <p>• <strong>InitiateCheckout</strong> - התחלת תשלום</p>
            <p>• <strong>AddShippingInfo</strong> - בחירת משלוח</p>
            <p>• <strong>AddPaymentInfo</strong> - בחירת תשלום</p>
            <p>• <strong>Purchase</strong> - רכישה מוצלחת</p>
            <p>• <strong>CompleteRegistration</strong> - הרשמה</p>
            <p>• <strong>Contact</strong> - יצירת קשר</p>
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
