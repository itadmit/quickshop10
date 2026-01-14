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
    layout: (settings.layout as 'steps' | 'single-page') || 'steps',
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
      {/* Checkout Layout */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">סוג צ׳ק אאוט</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <label 
            className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              formData.layout === 'steps' 
                ? 'border-black bg-gray-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="layout"
              value="steps"
              checked={formData.layout === 'steps'}
              onChange={() => setFormData(prev => ({ ...prev, layout: 'steps' }))}
              className="sr-only"
            />
            {/* Steps Icon */}
            <div className="w-12 h-12 mb-3 flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center">1</div>
                <div className="w-3 h-0.5 bg-gray-300" />
                <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center">2</div>
                <div className="w-3 h-0.5 bg-gray-300" />
                <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center">3</div>
              </div>
            </div>
            <p className="font-medium text-gray-900">שלבים</p>
            <p className="text-xs text-gray-500 text-center mt-1">פרטים ← משלוח ← תשלום</p>
            {formData.layout === 'steps' && (
              <div className="absolute top-2 left-2">
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </label>

          <label 
            className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              formData.layout === 'single-page' 
                ? 'border-black bg-gray-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="layout"
              value="single-page"
              checked={formData.layout === 'single-page'}
              onChange={() => setFormData(prev => ({ ...prev, layout: 'single-page' }))}
              className="sr-only"
            />
            {/* Single Page Icon */}
            <div className="w-12 h-12 mb-3 flex flex-col items-center justify-center">
              <div className="w-10 h-12 border-2 border-gray-400 rounded flex flex-col gap-1 p-1">
                <div className="w-full h-1.5 bg-gray-300 rounded-sm" />
                <div className="w-full h-1.5 bg-gray-300 rounded-sm" />
                <div className="w-full h-1.5 bg-gray-300 rounded-sm" />
              </div>
            </div>
            <p className="font-medium text-gray-900">עמוד אחד</p>
            <p className="text-xs text-gray-500 text-center mt-1">הכל בעמוד אחד</p>
            {formData.layout === 'single-page' && (
              <div className="absolute top-2 left-2">
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </label>
        </div>
      </div>

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


