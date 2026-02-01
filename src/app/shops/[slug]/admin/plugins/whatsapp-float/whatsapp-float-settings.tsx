'use client';

/**
 * WhatsApp Float Settings Component
 * 
 * 🎨 Client component for managing WhatsApp float button settings
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  Eye, 
  MessageCircle, 
  Smartphone, 
  Monitor, 
  Palette,
  Clock,
  ArrowLeft,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { updateWhatsAppFloatConfig } from './actions';

interface WhatsAppFloatSettingsProps {
  storeId: string;
  storeSlug: string;
  initialConfig: Record<string, unknown>;
}

// WhatsApp Icon SVG for preview
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

export function WhatsAppFloatSettings({ 
  storeId, 
  storeSlug, 
  initialConfig 
}: WhatsAppFloatSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Form state
  const [config, setConfig] = useState({
    enabled: Boolean(initialConfig.enabled ?? true),
    phoneNumber: String(initialConfig.phoneNumber || ''),
    buttonColor: String(initialConfig.buttonColor || '#25D366'),
    position: String(initialConfig.position || 'left') as 'left' | 'right',
    showBubble: Boolean(initialConfig.showBubble ?? true),
    bubbleText: String(initialConfig.bubbleText || 'היי! איך אפשר לעזור? 👋'),
    bubbleDelaySeconds: Number(initialConfig.bubbleDelaySeconds || 3),
    defaultMessage: String(initialConfig.defaultMessage || 'שלום, הגעתי דרך האתר ואשמח לקבל עזרה'),
    showOnMobile: Boolean(initialConfig.showOnMobile ?? true),
    showOnDesktop: Boolean(initialConfig.showOnDesktop ?? true),
    showPulse: Boolean(initialConfig.showPulse ?? true),
    bottomOffset: Number(initialConfig.bottomOffset || 20),
    sideOffset: Number(initialConfig.sideOffset || 20),
  });

  const handleSave = async () => {
    setSaveStatus('saving');
    startTransition(async () => {
      const result = await updateWhatsAppFloatConfig(storeId, config);
      if (result.success) {
        setSaveStatus('saved');
        router.refresh();
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    });
  };

  // Preview URL
  const previewUrl = `/shops/${storeSlug}`;

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending || !config.phoneNumber}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
            ${isPending 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : saveStatus === 'saved'
                ? 'bg-green-500 text-white'
                : saveStatus === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {isPending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              שומר...
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <Save className="w-4 h-4" />
              נשמר!
            </>
          ) : saveStatus === 'error' ? (
            <>
              <Save className="w-4 h-4" />
              שגיאה
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              שמור שינויים
            </>
          )}
        </button>

        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          <Eye className="w-4 h-4" />
          צפייה בחנות
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              הגדרות בסיסיות
            </h2>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מספר וואטסאפ *
              </label>
              <input
                type="tel"
                value={config.phoneNumber}
                onChange={(e) => setConfig(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="972501234567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-left"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">
                הכנס מספר בפורמט בינלאומי (ללא + או מקפים)
              </p>
            </div>

            {/* Default Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                הודעת ברירת מחדל
              </label>
              <textarea
                value={config.defaultMessage}
                onChange={(e) => setConfig(prev => ({ ...prev, defaultMessage: e.target.value }))}
                placeholder="שלום, הגעתי דרך האתר ואשמח לקבל עזרה"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                ההודעה שתופיע מוכנה בוואטסאפ כשהלקוח לוחץ
              </p>
            </div>

            {/* Enabled Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">הפעל כפתור</span>
              <button
                onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${config.enabled ? 'bg-green-500' : 'bg-gray-200'}
                `}
                dir="ltr"
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm
                    ${config.enabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-500" />
              עיצוב
            </h2>

            {/* Button Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                צבע הכפתור
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.buttonColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, buttonColor: e.target.value }))}
                  className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={config.buttonColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, buttonColor: e.target.value }))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-left"
                  dir="ltr"
                />
                <button
                  onClick={() => setConfig(prev => ({ ...prev, buttonColor: '#25D366' }))}
                  className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  ברירת מחדל
                </button>
              </div>
            </div>

            {/* Pulse Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">אנימציית הבהוב</span>
              <button
                onClick={() => setConfig(prev => ({ ...prev, showPulse: !prev.showPulse }))}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${config.showPulse ? 'bg-green-500' : 'bg-gray-200'}
                `}
                dir="ltr"
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm
                    ${config.showPulse ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מיקום הכפתור
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfig(prev => ({ ...prev, position: 'right' }))}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors
                    ${config.position === 'right' 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  ימין
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, position: 'left' }))}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors
                    ${config.position === 'left' 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <ArrowLeft className="w-4 h-4" />
                  שמאל
                </button>
              </div>
            </div>

            {/* Offsets */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מרחק מהתחתית (px)
                </label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={config.bottomOffset}
                  onChange={(e) => setConfig(prev => ({ ...prev, bottomOffset: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מרחק מהצד (px)
                </label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={config.sideOffset}
                  onChange={(e) => setConfig(prev => ({ ...prev, sideOffset: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Bubble Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              בועית הודעה
            </h2>

            {/* Show Bubble Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">הצג בועית הודעה</span>
              <button
                onClick={() => setConfig(prev => ({ ...prev, showBubble: !prev.showBubble }))}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${config.showBubble ? 'bg-green-500' : 'bg-gray-200'}
                `}
                dir="ltr"
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm
                    ${config.showBubble ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {config.showBubble && (
              <>
                {/* Bubble Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    טקסט הבועית
                  </label>
                  <textarea
                    value={config.bubbleText}
                    onChange={(e) => setConfig(prev => ({ ...prev, bubbleText: e.target.value }))}
                    placeholder="היי! איך אפשר לעזור? 👋"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                  />
                </div>

                {/* Delay */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    השהייה לפני הצגה (שניות)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={config.bubbleDelaySeconds}
                    onChange={(e) => setConfig(prev => ({ ...prev, bubbleDelaySeconds: Number(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
              </>
            )}
          </div>

          {/* Device Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-gray-500" />
              מכשירים
            </h2>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">הצג בדסקטופ</span>
              </div>
              <button
                onClick={() => setConfig(prev => ({ ...prev, showOnDesktop: !prev.showOnDesktop }))}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${config.showOnDesktop ? 'bg-green-500' : 'bg-gray-200'}
                `}
                dir="ltr"
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm
                    ${config.showOnDesktop ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">הצג במובייל</span>
              </div>
              <button
                onClick={() => setConfig(prev => ({ ...prev, showOnMobile: !prev.showOnMobile }))}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${config.showOnMobile ? 'bg-green-500' : 'bg-gray-200'}
                `}
                dir="ltr"
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm
                    ${config.showOnMobile ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-gray-500" />
              תצוגה מקדימה
            </h2>
            
            {/* Preview Container */}
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg h-[400px] overflow-hidden">
              {/* Mock website content */}
              <div className="absolute inset-4 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
                <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center px-3 gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 p-4">
                  <div className="h-4 w-1/3 bg-gray-200 rounded mb-3" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded" />
                </div>
              </div>

              {/* WhatsApp Button Preview */}
              {config.enabled && (
                <div 
                  className="absolute z-10"
                  style={{
                    bottom: '20px',
                    ...(config.position === 'left' ? { left: '20px' } : { right: '20px' }),
                  }}
                >
                  {/* Bubble */}
                  {config.showBubble && config.bubbleText && (
                    <div 
                      className={`absolute bottom-3 ${
                        config.position === 'left' ? 'left-full ml-2' : 'right-full mr-2'
                      }`}
                    >
                      <div className="relative bg-white rounded-xl shadow-lg px-3 py-2 text-xs whitespace-nowrap">
                        <p className="text-gray-700">
                          {config.bubbleText.length > 30 
                            ? config.bubbleText.substring(0, 30) + '...' 
                            : config.bubbleText
                          }
                        </p>
                        <div 
                          className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white transform rotate-45 ${
                            config.position === 'left' ? '-left-1' : '-right-1'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Button */}
                  <div
                    className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center"
                    style={{ backgroundColor: config.buttonColor }}
                  >
                    <WhatsAppIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}

              {/* Warning if not configured */}
              {!config.phoneNumber && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="bg-white rounded-lg px-4 py-3 text-sm text-center">
                    <p className="font-medium text-gray-900">הכנס מספר וואטסאפ</p>
                    <p className="text-gray-500 text-xs mt-1">הכפתור יופיע אחרי הגדרת מספר</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <h3 className="font-medium text-green-900 mb-2">💡 טיפים</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• השתמש במספר עם קידומת המדינה (972 לישראל)</li>
              <li>• הבועית מגבירה את שיעור הלחיצות</li>
              <li>• הודעה קצרה וברורה עובדת הכי טוב</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
