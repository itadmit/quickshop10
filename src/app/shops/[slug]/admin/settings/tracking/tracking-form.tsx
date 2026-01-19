'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateTrackingSettings } from '../actions';

interface TrackingSettingsFormProps {
  storeId: string;
  storeSlug: string;
  settings: Record<string, unknown>;
}

export function TrackingSettingsForm({ storeId, storeSlug, settings }: TrackingSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [copiedFeed, setCopiedFeed] = useState<string | null>(null);
  const router = useRouter();
  
  // Feed URLs
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://my-quickshop.com';
  const facebookFeedUrl = `${baseUrl}/api/shops/${storeSlug}/feeds/facebook`;
  const googleFeedUrl = `${baseUrl}/api/shops/${storeSlug}/feeds/google`;
  
  const copyToClipboard = async (url: string, feedName: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedFeed(feedName);
      setTimeout(() => setCopiedFeed(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
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
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
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
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
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
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
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

      {/* Product Feeds */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">פידים למוצרים (XML)</h3>
            <p className="text-sm text-gray-500">קטלוג מוצרים לפרסום בפייסבוק וגוגל</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Facebook Catalog Feed */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="font-medium text-gray-900">Facebook Catalog Feed</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={facebookFeedUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-gray-600"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(facebookFeedUrl, 'facebook')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
              >
                {copiedFeed === 'facebook' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    הועתק!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    העתק
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              הוסף ב-Facebook Commerce Manager → Catalog → Data Sources → Data Feed
            </p>
          </div>
          
          {/* Google Merchant Feed */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium text-gray-900">Google Merchant Center Feed</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={googleFeedUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-green-200 rounded-lg text-sm text-gray-600"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(googleFeedUrl, 'google')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
              >
                {copiedFeed === 'google' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    הועתק!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    העתק
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-green-600 mt-2">
              הוסף ב-Google Merchant Center → Products → Feeds → Add feed → Scheduled fetch
            </p>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">14 אירועים נתמכים 🚀</h3>
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
