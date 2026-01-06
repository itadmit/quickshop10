'use client';

import { useState, useTransition } from 'react';
import { Shield, Eye, Cookie, RefreshCw, Save, ExternalLink } from 'lucide-react';
import { updateGDPRSettings } from './actions';
import { type GDPRSettings, getDefaultGDPRSettings } from './types';

// ============================================
// GDPR Settings Form - Client Component
// ============================================

interface GDPRSettingsFormProps {
  storeId: string;
  settings: GDPRSettings;
}

export function GDPRSettingsForm({ storeId, settings }: GDPRSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<GDPRSettings>(settings);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateGDPRSettings(storeId, formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'ההגדרות נשמרו בהצלחה' });
      } else {
        setMessage({ type: 'error', text: result.error || 'שגיאה בשמירת ההגדרות' });
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const resetToDefault = () => {
    const defaults = getDefaultGDPRSettings();
    setFormData(prev => ({
      ...prev,
      customPolicyText: defaults.customPolicyText,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">הגדרות GDPR ועוגיות</h2>
            <p className="text-sm text-gray-500">נהל את הודעת העוגיות ומדיניות הפרטיות</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Enable GDPR Toggle */}
          <ToggleSetting
            checked={formData.enabled}
            onChange={(v) => setFormData({ ...formData, enabled: v })}
            title="הפעל הודעת עוגיות"
            description="הצג הודעת הסכמה לעוגיות בחנות"
          />

          {/* Use Custom Text Toggle */}
          <ToggleSetting
            checked={formData.useCustomText}
            onChange={(v) => setFormData({ ...formData, useCustomText: v })}
            title="טקסט מותאם אישית"
            description="השתמש בטקסט מותאם אישית במקום ברירת המחדל"
          />

          {/* Custom Policy Text */}
          {formData.useCustomText && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">טקסט מדיניות מותאם</h3>
                <button
                  type="button"
                  onClick={resetToDefault}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
                >
                  <RefreshCw className="w-4 h-4" />
                  שחזר ברירת מחדל
                </button>
              </div>
              <textarea
                value={formData.customPolicyText}
                onChange={(e) => setFormData({ ...formData, customPolicyText: e.target.value })}
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder="הזן את טקסט מדיניות העוגיות..."
                dir="rtl"
              />
            </div>
          )}

          {/* Policy Page URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              קישור לעמוד מדיניות פרטיות
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData.policyPageUrl}
                onChange={(e) => setFormData({ ...formData, policyPageUrl: e.target.value })}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="https://..."
                dir="ltr"
              />
              {formData.policyPageUrl && (
                <a
                  href={formData.policyPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4 text-gray-600" />
                </a>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">יוצג ככפתור "קרא עוד" בהודעת העוגיות</p>
          </div>
        </div>
      </div>

      {/* Banner Position & Style */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Eye className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">עיצוב ומיקום</h2>
            <p className="text-sm text-gray-500">התאם את המראה והמיקום של הודעת העוגיות</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Banner Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">מיקום</label>
            <select
              value={formData.bannerPosition}
              onChange={(e) => setFormData({ ...formData, bannerPosition: e.target.value as 'bottom' | 'top' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="bottom">למטה</option>
              <option value="top">למעלה</option>
            </select>
          </div>

          {/* Banner Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">סגנון</label>
            <select
              value={formData.bannerStyle}
              onChange={(e) => setFormData({ ...formData, bannerStyle: e.target.value as 'full-width' | 'box-right' | 'box-left' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="full-width">שורה מלאה</option>
              <option value="box-right">ריבוע בימין</option>
              <option value="box-left">ריבוע בשמאל</option>
            </select>
          </div>
        </div>

        {/* Show Decline Button */}
        <div className="mt-5">
          <ToggleSetting
            checked={formData.showDeclineButton}
            onChange={(v) => setFormData({ ...formData, showDeclineButton: v })}
            title="הצג כפתור דחייה"
            description="אפשר למשתמשים לדחות עוגיות לא חיוניות"
          />
        </div>

        {/* Colors */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <ColorPicker
            label="צבע רקע"
            value={formData.backgroundColor}
            onChange={(v) => setFormData({ ...formData, backgroundColor: v })}
          />
          <ColorPicker
            label="צבע טקסט"
            value={formData.textColor}
            onChange={(v) => setFormData({ ...formData, textColor: v })}
          />
          <ColorPicker
            label="צבע כפתור"
            value={formData.buttonColor}
            onChange={(v) => setFormData({ ...formData, buttonColor: v })}
          />
          <ColorPicker
            label="צבע טקסט כפתור"
            value={formData.buttonTextColor}
            onChange={(v) => setFormData({ ...formData, buttonTextColor: v })}
          />
        </div>
      </div>

      {/* Button Text Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Cookie className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">טקסט כפתורים</h2>
            <p className="text-sm text-gray-500">התאם את טקסט הכפתורים</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">כפתור אישור</label>
            <input
              type="text"
              value={formData.acceptButtonText}
              onChange={(e) => setFormData({ ...formData, acceptButtonText: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="אני מסכים"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">כפתור דחייה</label>
            <input
              type="text"
              value={formData.declineButtonText}
              onChange={(e) => setFormData({ ...formData, declineButtonText: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="לא מסכים"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          תצוגה מקדימה
        </h3>
        <div className="bg-gray-100 rounded-lg p-4 min-h-[200px] relative overflow-hidden">
          {/* Simulated page content */}
          <div className="space-y-2 opacity-30">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            <div className="h-20 bg-gray-300 rounded mt-4"></div>
          </div>

          {/* Cookie Banner Preview */}
          {formData.enabled ? (
            <div
              className={`absolute transition-all ${
                formData.bannerPosition === 'bottom' ? 'bottom-0' : 'top-0'
              } ${
                formData.bannerStyle === 'full-width'
                  ? 'left-0 right-0'
                  : formData.bannerStyle === 'box-right'
                  ? 'right-4 max-w-xs'
                  : 'left-4 max-w-xs'
              } ${
                formData.bannerStyle !== 'full-width'
                  ? formData.bannerPosition === 'bottom' ? 'bottom-4' : 'top-4'
                  : ''
              }`}
            >
              <div
                className={`p-4 shadow-lg ${formData.bannerStyle === 'full-width' ? '' : 'rounded-lg'}`}
                style={{ backgroundColor: formData.backgroundColor, color: formData.textColor }}
                dir="rtl"
              >
                <div className={`flex ${formData.bannerStyle === 'full-width' ? 'items-center justify-between' : 'flex-col gap-3'}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Cookie className="w-4 h-4" />
                      <span className="font-medium text-sm">הודעת עוגיות</span>
                    </div>
                    <p className="text-xs opacity-90">אנו משתמשים בעוגיות לשיפור חווית הגלישה.</p>
                  </div>
                  <div className={`flex gap-2 ${formData.bannerStyle === 'full-width' ? '' : 'w-full'}`}>
                    <button
                      className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer ${formData.bannerStyle !== 'full-width' ? 'flex-1' : ''}`}
                      style={{ backgroundColor: formData.buttonColor, color: formData.buttonTextColor }}
                    >
                      {formData.acceptButtonText || 'אני מסכים'}
                    </button>
                    {formData.showDeclineButton && (
                      <button
                        className={`px-3 py-1.5 rounded text-xs font-medium border cursor-pointer ${formData.bannerStyle !== 'full-width' ? 'flex-1' : ''}`}
                        style={{ borderColor: formData.textColor, color: formData.textColor, backgroundColor: 'transparent' }}
                      >
                        {formData.declineButtonText || 'לא מסכים'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">הבאנר מושבת</p>
                <p className="text-sm text-gray-400">הפעל את הודעת העוגיות כדי לראות תצוגה מקדימה</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50 cursor-pointer transition-colors"
        >
          <Save className="w-4 h-4" />
          {isPending ? 'שומר...' : 'שמור הגדרות'}
        </button>
      </div>
    </div>
  );
}

// Helper Components
function ToggleSetting({ 
  checked, 
  onChange, 
  title, 
  description 
}: { 
  checked: boolean; 
  onChange: (v: boolean) => void; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
        <div>
          <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

function ColorPicker({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-9 p-0.5 cursor-pointer border border-gray-300 rounded"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
          dir="ltr"
        />
      </div>
    </div>
  );
}

