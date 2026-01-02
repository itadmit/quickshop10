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
  const router = useRouter();

  const [formData, setFormData] = useState({
    facebookPixelId: (settings.facebookPixelId as string) || '',
    facebookPixelEnabled: (settings.facebookPixelEnabled as boolean) ?? false,
    googleAnalyticsId: (settings.googleAnalyticsId as string) || '',
    googleAnalyticsEnabled: (settings.googleAnalyticsEnabled as boolean) ?? false,
    gtmContainerId: (settings.gtmContainerId as string) || '',
    gtmEnabled: (settings.gtmEnabled as boolean) ?? false,
    tiktokPixelId: (settings.tiktokPixelId as string) || '',
    tiktokPixelEnabled: (settings.tiktokPixelEnabled as boolean) ?? false,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
      </div>

      {/* Help */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">אירועים נתמכים</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>PageView</strong> - צפייה בדף</li>
          <li>• <strong>ViewContent</strong> - צפייה במוצר</li>
          <li>• <strong>AddToCart</strong> - הוספה לסל</li>
          <li>• <strong>InitiateCheckout</strong> - התחלת תשלום</li>
          <li>• <strong>Purchase</strong> - רכישה מוצלחת</li>
        </ul>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
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

