'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateCheckoutSettings } from '../actions';

interface CheckoutSettingsFormProps {
  storeId: string;
  settings: Record<string, unknown>;
}

export function CheckoutSettingsForm({ storeId, settings }: CheckoutSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    requirePhone: (settings.requirePhone as boolean) ?? true,
    requireCompany: (settings.requireCompany as boolean) ?? false,
    showZipCode: (settings.showZipCode as boolean) ?? false,
    allowNotes: (settings.allowNotes as boolean) ?? true,
    termsRequired: (settings.termsRequired as boolean) ?? false,
    successMessage: (settings.successMessage as string) || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);

    startTransition(async () => {
      const result = await updateCheckoutSettings(storeId, formData);
      if (result.success) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Required Fields */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">שדות נדרשים</h2>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">מספר טלפון</p>
              <p className="text-sm text-gray-500">דרוש להתקשרות ומשלוחים</p>
            </div>
            <input
              type="checkbox"
              checked={formData.requirePhone}
              onChange={(e) => setFormData(prev => ({ ...prev, requirePhone: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black/20"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">שם חברה</p>
              <p className="text-sm text-gray-500">שדה שם חברה בטופס כתובת</p>
            </div>
            <input
              type="checkbox"
              checked={formData.requireCompany}
              onChange={(e) => setFormData(prev => ({ ...prev, requireCompany: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black/20"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">הצג מיקוד</p>
              <p className="text-sm text-gray-500">הצג שדה מיקוד בכתובת למשלוח</p>
            </div>
            <input
              type="checkbox"
              checked={formData.showZipCode}
              onChange={(e) => setFormData(prev => ({ ...prev, showZipCode: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black/20"
            />
          </label>
        </div>
      </div>

      {/* Additional Options */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">אפשרויות נוספות</h2>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">אפשר הערות להזמנה</p>
              <p className="text-sm text-gray-500">לקוחות יוכלו להוסיף הערות</p>
            </div>
            <input
              type="checkbox"
              checked={formData.allowNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, allowNotes: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black/20"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">אישור תנאי שימוש</p>
              <p className="text-sm text-gray-500">חובה לאשר תנאים לפני רכישה</p>
            </div>
            <input
              type="checkbox"
              checked={formData.termsRequired}
              onChange={(e) => setFormData(prev => ({ ...prev, termsRequired: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black/20"
            />
          </label>
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">הודעת הצלחה</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            הודעה בדף תודה (אופציונלי)
          </label>
          <textarea
            value={formData.successMessage}
            onChange={(e) => setFormData(prev => ({ ...prev, successMessage: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors resize-none"
            placeholder="תודה על הרכישה! נשלח לך עדכון כשהמשלוח ייצא לדרך."
          />
          <p className="text-xs text-gray-500 mt-1">השאר ריק להודעת ברירת מחדל</p>
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


