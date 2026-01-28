'use client';

import { useState, useTransition } from 'react';
import { updateKitchenDisplayConfig } from './actions';
import { 
  Settings, Bell, Volume2, ArrowUp, ArrowDown, 
  Square, LayoutGrid, Palette, Moon, Image, User, 
  Phone, FileText, Clock, Save, Loader2, 
  CheckCircle2, AlertCircle, Check, CreditCard, Package
} from 'lucide-react';

// ============================================
// Kitchen Display Settings Component
// Client Component - נדרש עבור forms ו-state
// Compact 2-column layout
// ============================================

interface KitchenDisplayConfig {
  // Statuses to display
  displayOrderStatuses: string[];
  displayFinancialStatuses: string[];
  displayFulfillmentStatuses: string[];
  // Action statuses
  successStatus: string;
  successCustomStatus: string | null;
  cancelStatus: string;
  cancelCustomStatus: string | null;
  // Sound
  soundEnabled: boolean;
  soundVolume: number;
  // Display
  refreshInterval: number;
  sortOrder: 'oldest_first' | 'newest_first';
  showCustomerPhone: boolean;
  showCustomerName: boolean;
  showOrderNotes: boolean;
  showProductImages: boolean;
  cardSize: 'small' | 'medium' | 'large';
  darkMode: boolean;
  warningTimeMinutes: number;
  dangerTimeMinutes: number;
}

interface CustomStatus {
  id: string;
  name: string;
  color: string;
}

interface KitchenDisplaySettingsProps {
  storeId: string;
  storeSlug: string;
  config: KitchenDisplayConfig;
  customStatuses: CustomStatus[];
}

// סטטוסי הזמנה
const ORDER_STATUSES = [
  { value: 'pending', label: 'ממתין', color: 'bg-amber-100 text-amber-800' },
  { value: 'confirmed', label: 'אושר', color: 'bg-blue-100 text-blue-800' },
  { value: 'processing', label: 'בהכנה', color: 'bg-violet-100 text-violet-800' },
  { value: 'shipped', label: 'נשלח', color: 'bg-teal-100 text-teal-800' },
  { value: 'delivered', label: 'נמסר', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'cancelled', label: 'מבוטל', color: 'bg-red-100 text-red-800' },
  { value: 'refunded', label: 'הוחזר', color: 'bg-rose-100 text-rose-800' },
];

// סטטוסי תשלום
const FINANCIAL_STATUSES = [
  { value: 'pending', label: 'ממתין לתשלום', color: 'bg-amber-100 text-amber-800' },
  { value: 'paid', label: 'שולם', color: 'bg-green-100 text-green-800' },
  { value: 'partially_paid', label: 'שולם חלקית', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'refunded', label: 'הוחזר', color: 'bg-red-100 text-red-800' },
  { value: 'partially_refunded', label: 'הוחזר חלקית', color: 'bg-orange-100 text-orange-800' },
];

// סטטוסי לוגיסטיקה
const FULFILLMENT_STATUSES = [
  { value: 'unfulfilled', label: 'לא נשלח', color: 'bg-slate-100 text-slate-800' },
  { value: 'partial', label: 'נשלח חלקית', color: 'bg-sky-100 text-sky-800' },
  { value: 'fulfilled', label: 'נשלח', color: 'bg-green-100 text-green-800' },
];

const DISPLAY_OPTIONS = [
  { key: 'darkMode', label: 'מצב כהה', icon: Moon },
  { key: 'showProductImages', label: 'תמונות', icon: Image },
  { key: 'showCustomerName', label: 'שם לקוח', icon: User },
  { key: 'showCustomerPhone', label: 'טלפון', icon: Phone },
  { key: 'showOrderNotes', label: 'הערות', icon: FileText },
] as const;

export function KitchenDisplaySettings({ 
  storeId, 
  storeSlug, 
  config, 
  customStatuses 
}: KitchenDisplaySettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [localConfig, setLocalConfig] = useState<KitchenDisplayConfig>(config);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateKitchenDisplayConfig(storeId, localConfig);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'ההגדרות נשמרו!' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'שגיאה' });
      }
    });
  };

  const handleTestSound = async () => {
    try {
      const audio = new Audio('/sounds/kitchen-bell.mp3');
      audio.volume = localConfig.soundVolume / 100;
      await audio.play();
    } catch (error) {
      alert('לא ניתן להשמיע את הצליל');
    }
  };

  const toggleStatus = (
    field: 'displayOrderStatuses' | 'displayFinancialStatuses' | 'displayFulfillmentStatuses',
    status: string
  ) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: prev[field].includes(status)
        ? prev[field].filter((s: string) => s !== status)
        : [...prev[field], status]
    }));
  };

  return (
    <div className="space-y-8">
      {/* Save Message */}
      {saveMessage && (
        <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
          saveMessage.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {saveMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {saveMessage.text}
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-2 gap-8">
        
        {/* ========== עמודה שמאל - תצוגה ========== */}
        <div className="space-y-6">
          
          {/* תצוגה מקדימה */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-slate-500" />
              תצוגה מקדימה
              <span className="text-xs font-normal mr-auto px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {localConfig.darkMode ? 'מצב כהה' : 'מצב בהיר'}
              </span>
            </h3>
            <div className={`rounded-xl p-4 border transition-colors ${
              localConfig.darkMode 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-start gap-4">
                {localConfig.showProductImages && (
                  <div className={`w-14 h-14 rounded-lg flex-shrink-0 ${
                    localConfig.darkMode ? 'bg-slate-700' : 'bg-slate-200'
                  }`}></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold ${localConfig.darkMode ? 'text-white' : 'text-slate-900'}`}>
                      #1234
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">ממתין</span>
                  </div>
                  {localConfig.showCustomerName && (
                    <p className={`text-sm ${localConfig.darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      ישראל ישראלי
                    </p>
                  )}
                  {localConfig.showCustomerPhone && (
                    <p className={`text-sm ${localConfig.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      050-1234567
                    </p>
                  )}
                  {localConfig.showOrderNotes && (
                    <p className={`text-sm mt-2 ${localConfig.darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      📝 הערה: בלי בצל
                    </p>
                  )}
                </div>
                <div className="text-left">
                  <span className="px-3 py-1.5 bg-green-500 text-white text-sm font-bold rounded-lg">
                    02:45
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* תצוגת כרטיס */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-slate-500" />
              תצוגת כרטיס
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {DISPLAY_OPTIONS.map(option => {
                const Icon = option.icon;
                const isActive = localConfig[option.key as keyof KitchenDisplayConfig];
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setLocalConfig(prev => ({ 
                      ...prev, 
                      [option.key]: !prev[option.key as keyof KitchenDisplayConfig] 
                    }))}
                    className={`p-3 rounded-xl border text-sm transition-all flex items-center gap-2 ${
                      isActive
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                    {isActive && <Check className="w-4 h-4 mr-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* תצוגה - מיון וגודל */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <LayoutGrid className="w-5 h-5 text-slate-500" />
              תצוגה
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-2">מיון הזמנות</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setLocalConfig(prev => ({ ...prev, sortOrder: 'oldest_first' }))}
                    className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      localConfig.sortOrder === 'oldest_first'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" />
                    ישן←חדש
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalConfig(prev => ({ ...prev, sortOrder: 'newest_first' }))}
                    className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      localConfig.sortOrder === 'newest_first'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <ArrowDown className="w-4 h-4" />
                    חדש←ישן
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-slate-600 mb-2">גודל כרטיסים</label>
                <div className="flex gap-3">
                  {[
                    { value: 'small', label: 'S' },
                    { value: 'medium', label: 'M' },
                    { value: 'large', label: 'L' },
                  ].map(size => (
                    <button
                      key={size.value}
                      type="button"
                      onClick={() => setLocalConfig(prev => ({ ...prev, cardSize: size.value as 'small' | 'medium' | 'large' }))}
                      className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                        localConfig.cardSize === size.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== עמודה ימין - הגדרות ========== */}
        <div className="space-y-6">
          
          {/* סטטוסי הזמנה */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-slate-500" />
              סטטוס הזמנה להצגה
            </h3>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map(status => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => toggleStatus('displayOrderStatuses', status.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    localConfig.displayOrderStatuses.includes(status.value)
                      ? `${status.color} ring-2 ring-offset-1 ring-slate-400`
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {localConfig.displayOrderStatuses.includes(status.value) && (
                    <Check className="w-3.5 h-3.5 inline ml-1" />
                  )}
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* סטטוסי תשלום */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-slate-500" />
              סטטוס תשלום להצגה
            </h3>
            <div className="flex flex-wrap gap-2">
              {FINANCIAL_STATUSES.map(status => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => toggleStatus('displayFinancialStatuses', status.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    localConfig.displayFinancialStatuses.includes(status.value)
                      ? `${status.color} ring-2 ring-offset-1 ring-slate-400`
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {localConfig.displayFinancialStatuses.includes(status.value) && (
                    <Check className="w-3.5 h-3.5 inline ml-1" />
                  )}
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* סטטוסי לוגיסטיקה */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-slate-500" />
              סטטוס משלוח להצגה
            </h3>
            <div className="flex flex-wrap gap-2">
              {FULFILLMENT_STATUSES.map(status => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => toggleStatus('displayFulfillmentStatuses', status.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    localConfig.displayFulfillmentStatuses.includes(status.value)
                      ? `${status.color} ring-2 ring-offset-1 ring-slate-400`
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {localConfig.displayFulfillmentStatuses.includes(status.value) && (
                    <Check className="w-3.5 h-3.5 inline ml-1" />
                  )}
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* פעולות כפתורים */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <LayoutGrid className="w-5 h-5 text-slate-500" />
              פעולות כפתורים
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  סטטוס אחרי "אישור"
                </label>
                <select
                  value={localConfig.successStatus}
                  onChange={(e) => setLocalConfig(prev => ({ 
                    ...prev, 
                    successStatus: e.target.value,
                    successCustomStatus: null 
                  }))}
                  className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  {ORDER_STATUSES.filter(s => !['pending', 'cancelled'].includes(s.value)).map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {customStatuses.length > 0 && (
                <div>
                  <label className="block text-sm text-slate-600 mb-2">
                    או סטטוס מותאם
                  </label>
                  <select
                    value={localConfig.successCustomStatus || ''}
                    onChange={(e) => setLocalConfig(prev => ({ 
                      ...prev, 
                      successCustomStatus: e.target.value || null 
                    }))}
                    className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">ללא</option>
                    {customStatuses.map(status => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  סטטוס אחרי "ביטול"
                </label>
                <select
                  value={localConfig.cancelStatus}
                  onChange={(e) => setLocalConfig(prev => ({ 
                    ...prev, 
                    cancelStatus: e.target.value
                  }))}
                  className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cancelled">מבוטל</option>
                  <option value="refunded">הוחזר</option>
                </select>
              </div>
            </div>
          </div>

          {/* התראות קוליות */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-slate-500" />
              התראות קוליות
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">צליל בהזמנה חדשה</span>
                <button
                  type="button"
                  onClick={() => setLocalConfig(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    localConfig.soundEnabled ? 'bg-green-500' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    localConfig.soundEnabled ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
              
              {localConfig.soundEnabled && (
                <>
                  <div>
                    <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                      <span>עוצמה</span>
                      <span>{localConfig.soundVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={localConfig.soundVolume}
                      onChange={(e) => setLocalConfig(prev => ({ ...prev, soundVolume: Number(e.target.value) }))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleTestSound}
                    className="w-full py-2.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                    בדוק צליל
                  </button>
                </>
              )}
              
              <div>
                <label className="block text-sm text-slate-600 mb-2">רענון כל</label>
                <select
                  value={localConfig.refreshInterval}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, refreshInterval: Number(e.target.value) }))}
                  className="w-full p-3 text-sm border border-slate-200 rounded-xl"
                >
                  <option value={30}>30 שניות</option>
                  <option value={60}>דקה</option>
                  <option value={90}>דקה וחצי</option>
                  <option value={120}>2 דקות</option>
                </select>
              </div>
            </div>
          </div>

          {/* צבעי שעון */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-slate-500" />
              צבעי שעון
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                  <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                  צהוב אחרי
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={localConfig.warningTimeMinutes}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, warningTimeMinutes: Number(e.target.value) }))}
                    className="w-16 p-2.5 text-sm border border-slate-200 rounded-xl text-center"
                  />
                  <span className="text-sm text-slate-500">דק׳</span>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  אדום אחרי
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={localConfig.dangerTimeMinutes}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, dangerTimeMinutes: Number(e.target.value) }))}
                    className="w-16 p-2.5 text-sm border border-slate-200 rounded-xl text-center"
                  />
                  <span className="text-sm text-slate-500">דק׳</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className={`px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium transition-all flex items-center gap-2 text-sm ${
            isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              שומר...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              שמור הגדרות
            </>
          )}
        </button>
      </div>
    </div>
  );
}
