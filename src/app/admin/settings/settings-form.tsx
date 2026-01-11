'use client';

/**
 * Platform Settings Form
 * טופס לעריכת הגדרות פלטפורמה
 */

import { useState, useTransition } from 'react';
import { Save, Loader2, Check } from 'lucide-react';
import { updatePlatformSettings } from './actions';

interface SettingItem {
  key: string;
  value: string | number;
  label: string;
  description?: string | null;
  suffix?: string;
  type?: 'currency' | 'percent' | 'number';
}

interface PlatformSettingsFormProps {
  settings: SettingItem[];
}

export function PlatformSettingsForm({ settings }: PlatformSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const setting of settings) {
      let displayValue: string;
      
      if (setting.type === 'percent') {
        // Convert decimal to percentage for display (0.18 -> 18)
        const numValue = Number(setting.value);
        displayValue = numValue < 1 ? String(numValue * 100) : String(numValue);
      } else {
        displayValue = String(setting.value);
      }
      
      initial[setting.key] = displayValue;
    }
    return initial;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert values back to storage format
    const storageValues: Record<string, string | number> = {};
    for (const setting of settings) {
      const inputValue = Number(values[setting.key]);
      
      if (setting.type === 'percent') {
        // Convert percentage back to decimal (18 -> 0.18)
        storageValues[setting.key] = inputValue / 100;
      } else {
        storageValues[setting.key] = inputValue;
      }
    }

    startTransition(async () => {
      await updatePlatformSettings(storageValues);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settings.map((setting) => (
          <div key={setting.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {setting.label}
            </label>
            <div className="relative">
              <input
                type="number"
                step={setting.type === 'percent' ? '0.1' : setting.type === 'currency' ? '1' : '1'}
                min="0"
                value={values[setting.key]}
                onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-left"
                dir="ltr"
              />
              {setting.suffix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {setting.suffix}
                </span>
              )}
            </div>
            {setting.description && (
              <p className="mt-1 text-xs text-gray-500">{setting.description}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? 'נשמר!' : 'שמור שינויים'}
        </button>

        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <Check className="w-4 h-4" />
            ההגדרות עודכנו בהצלחה
          </span>
        )}
      </div>
    </form>
  );
}

