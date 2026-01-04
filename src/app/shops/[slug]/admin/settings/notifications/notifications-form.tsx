'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateNotificationSettings } from '../actions';

interface NotificationsSettingsFormProps {
  storeId: string;
  settings: Record<string, unknown>;
  defaultEmail: string;
}

export function NotificationsSettingsForm({ storeId, settings, defaultEmail }: NotificationsSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    emailOnOrder: (settings.emailOnOrder as boolean) ?? true,
    emailOnLowStock: (settings.emailOnLowStock as boolean) ?? true,
    emailOnOutOfStock: (settings.emailOnOutOfStock as boolean) ?? true,
    lowStockThreshold: (settings.lowStockThreshold as number) ?? 5,
    notificationEmail: (settings.notificationEmail as string) || defaultEmail,
    emailSenderName: (settings.emailSenderName as string) || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);

    startTransition(async () => {
      const result = await updateNotificationSettings(storeId, formData);
      if (result.success) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">הגדרות אימייל</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              אימייל להתראות
            </label>
            <input
              type="email"
              value={formData.notificationEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, notificationEmail: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="hello@store.com"
              dir="ltr"
            />
            <p className="text-xs text-gray-500 mt-1">כל ההתראות יישלחו לכתובת זו</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם השולח באימיילים ללקוחות
            </label>
            <input
              type="text"
              value={formData.emailSenderName}
              onChange={(e) => setFormData(prev => ({ ...prev, emailSenderName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="לדוגמה: צוות החנות שלי"
            />
            <p className="text-xs text-gray-500 mt-1">
              השם שיופיע כשולח באימיילים ללקוחות (תזכורת עגלה נטושה, אישור הזמנה וכו&apos;). 
              אם ריק, ישמש שם החנות.
            </p>
          </div>
        </div>
      </div>

      {/* Order Notifications */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">התראות הזמנות</h2>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">הזמנה חדשה</p>
              <p className="text-sm text-gray-500">קבל אימייל כשמתקבלת הזמנה חדשה</p>
            </div>
            <input
              type="checkbox"
              checked={formData.emailOnOrder}
              onChange={(e) => setFormData(prev => ({ ...prev, emailOnOrder: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black/20"
            />
          </label>
        </div>
      </div>

      {/* Inventory Notifications */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">התראות מלאי</h2>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">מלאי נמוך</p>
              <p className="text-sm text-gray-500">קבל התראה כשמלאי מוצר יורד מתחת לסף</p>
            </div>
            <input
              type="checkbox"
              checked={formData.emailOnLowStock}
              onChange={(e) => setFormData(prev => ({ ...prev, emailOnLowStock: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black/20"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">מוצר אזל</p>
              <p className="text-sm text-gray-500">קבל התראה כשמוצר אזל מהמלאי</p>
            </div>
            <input
              type="checkbox"
              checked={formData.emailOnOutOfStock}
              onChange={(e) => setFormData(prev => ({ ...prev, emailOnOutOfStock: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black/20"
            />
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סף מלאי נמוך
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 5 }))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              />
              <span className="text-gray-500">יחידות</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">התראה תישלח כשמלאי מוצר יורד מתחת למספר זה</p>
          </div>
        </div>
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


