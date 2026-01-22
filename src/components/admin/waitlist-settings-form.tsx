'use client';

import { useState, useTransition } from 'react';
import { Settings as SettingsIcon, Save, Loader2 } from 'lucide-react';
import { updateWaitlistSettings, type WaitlistSettings } from '@/lib/waitlist-settings';

interface WaitlistSettingsFormProps {
  storeId: string;
  storeSlug: string;
  initialSettings: WaitlistSettings;
}

export function WaitlistSettingsForm({ storeId, storeSlug, initialSettings }: WaitlistSettingsFormProps) {
  const [settings, setSettings] = useState<WaitlistSettings>(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      try {
        const result = await updateWaitlistSettings(storeId, storeSlug, settings);
        
        if (result.success) {
          setSaveMessage({ type: 'success', text: 'ההגדרות נשמרו בהצלחה' });
        } else {
          setSaveMessage({ type: 'error', text: result.error || 'שגיאה בשמירת ההגדרות' });
        }

        // Clear message after 3 seconds
        setTimeout(() => setSaveMessage(null), 3000);
      } catch (error) {
        setSaveMessage({ type: 'error', text: 'שגיאה בשמירת ההגדרות' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 rounded-full p-2">
          <SettingsIcon className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">הגדרות רשימת המתנה</h2>
      </div>

      <div className="space-y-6">
        {/* Auto Notify */}
        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoNotify}
              onChange={(e) => setSettings(prev => ({ ...prev, autoNotify: e.target.checked }))}
              className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-900">שליחה אוטומטית</span>
              <p className="text-sm text-gray-600 mt-1">
                שלח התראות אוטומטית ללקוחות ברשימת ההמתנה כשהמוצר חוזר למלאי (ללא אישור ידני)
              </p>
            </div>
          </label>
        </div>

        {/* Notify Threshold */}
        {settings.autoNotify && (
          <div>
            <label htmlFor="threshold" className="block font-medium text-gray-900 mb-2">
              סף מינימלי לשליחה אוטומטית
            </label>
            <p className="text-sm text-gray-600 mb-3">
              שלח התראות אוטומטית רק אם יש לפחות מספר זה של ממתינים (למניעת שליחה ל-1 אדם בלבד)
            </p>
            <div className="flex items-center gap-4">
              <input
                id="threshold"
                type="number"
                min="1"
                max="100"
                value={settings.notifyThreshold}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  notifyThreshold: Math.max(1, parseInt(e.target.value) || 1) 
                }))}
                className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-700">ממתינים לפחות</span>
            </div>
          </div>
        )}

        {/* Save Message */}
        {saveMessage && (
          <div className={`p-4 rounded-lg ${
            saveMessage.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <p className="text-sm font-medium">{saveMessage.text}</p>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>שומר...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>שמור הגדרות</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}




