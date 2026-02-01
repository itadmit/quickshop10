'use client';

/**
 * Review Settings Form - Client Component
 */

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  storeId: string;
  storeSlug: string;
  initialConfig: Record<string, unknown>;
}

export function ReviewSettingsForm({ storeId, storeSlug, initialConfig }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [config, setConfig] = useState({
    enabled: (initialConfig.enabled as boolean) ?? true,
    requireApproval: (initialConfig.requireApproval as boolean) ?? true,
    requireText: (initialConfig.requireText as boolean) ?? false,
    minTextLength: (initialConfig.minTextLength as number) ?? 10,
    allowMedia: (initialConfig.allowMedia as boolean) ?? true,
    maxMediaPerReview: (initialConfig.maxMediaPerReview as number) ?? 5,
    allowGuestReviews: (initialConfig.allowGuestReviews as boolean) ?? false,
    autoApproveVerified: (initialConfig.autoApproveVerified as boolean) ?? true,
    showVerifiedBadge: (initialConfig.showVerifiedBadge as boolean) ?? true,
    emailRequestDays: (initialConfig.emailRequestDays as number) ?? 7,
  });

  const handleSave = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/shops/${storeSlug}/plugins/product-reviews/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });

        if (res.ok) {
          router.refresh();
        }
      } catch (error) {
        console.error('Error saving config:', error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* General */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-medium mb-4">כללי</h2>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
            />
            <div>
              <span className="font-medium">מערכת ביקורות מופעלת</span>
              <p className="text-sm text-gray-500">אפשר ללקוחות לכתוב ביקורות על מוצרים</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.requireApproval}
              onChange={(e) => setConfig(prev => ({ ...prev, requireApproval: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
            />
            <div>
              <span className="font-medium">דרוש אישור ביקורות</span>
              <p className="text-sm text-gray-500">ביקורות יפורסמו רק לאחר אישור מנהל</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.autoApproveVerified}
              onChange={(e) => setConfig(prev => ({ ...prev, autoApproveVerified: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
            />
            <div>
              <span className="font-medium">אישור אוטומטי לרכישות מאומתות</span>
              <p className="text-sm text-gray-500">ביקורות מלקוחות שרכשו יאושרו אוטומטית</p>
            </div>
          </label>
        </div>
      </div>

      {/* Content Requirements */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-medium mb-4">דרישות תוכן</h2>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.requireText}
              onChange={(e) => setConfig(prev => ({ ...prev, requireText: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
            />
            <div>
              <span className="font-medium">חובה לכתוב טקסט</span>
              <p className="text-sm text-gray-500">לקוחות חייבים לכתוב טקסט בנוסף לדירוג</p>
            </div>
          </label>

          {config.requireText && (
            <div className="mr-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מינימום תווים
              </label>
              <input
                type="number"
                value={config.minTextLength}
                onChange={(e) => setConfig(prev => ({ ...prev, minTextLength: parseInt(e.target.value) || 10 }))}
                min={1}
                max={500}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
              />
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.allowGuestReviews}
              onChange={(e) => setConfig(prev => ({ ...prev, allowGuestReviews: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
            />
            <div>
              <span className="font-medium">אפשר ביקורות מאורחים</span>
              <p className="text-sm text-gray-500">גם משתמשים לא רשומים יכולים לכתוב ביקורות</p>
            </div>
          </label>
        </div>
      </div>

      {/* Media */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-medium mb-4">מדיה</h2>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.allowMedia}
              onChange={(e) => setConfig(prev => ({ ...prev, allowMedia: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
            />
            <div>
              <span className="font-medium">אפשר העלאת תמונות ווידאו</span>
              <p className="text-sm text-gray-500">לקוחות יכולים להוסיף מדיה לביקורות</p>
            </div>
          </label>

          {config.allowMedia && (
            <div className="mr-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מקסימום קבצים לביקורת
              </label>
              <input
                type="number"
                value={config.maxMediaPerReview}
                onChange={(e) => setConfig(prev => ({ ...prev, maxMediaPerReview: parseInt(e.target.value) || 5 }))}
                min={1}
                max={10}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Display */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-medium mb-4">תצוגה</h2>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showVerifiedBadge}
              onChange={(e) => setConfig(prev => ({ ...prev, showVerifiedBadge: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
            />
            <div>
              <span className="font-medium">הצג תגית &quot;רכישה מאומתת&quot;</span>
              <p className="text-sm text-gray-500">הדגש ביקורות מלקוחות שרכשו את המוצר</p>
            </div>
          </label>
        </div>
      </div>

      {/* Email */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-medium mb-4">בקשת ביקורת באימייל</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שלח בקשה לביקורת X ימים אחרי ההזמנה
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={config.emailRequestDays}
                onChange={(e) => setConfig(prev => ({ ...prev, emailRequestDays: parseInt(e.target.value) || 7 }))}
                min={1}
                max={30}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
              />
              <span className="text-sm text-gray-500">ימים</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              0 = לא לשלוח בקשות אוטומטיות
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              שומר...
            </>
          ) : (
            'שמור הגדרות'
          )}
        </button>
      </div>
    </div>
  );
}










