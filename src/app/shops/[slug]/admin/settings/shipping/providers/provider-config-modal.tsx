'use client';

/**
 * Shipping Provider Configuration Modal
 * Client Component - minimal JS for form handling
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ShippingProviderInfo } from '@/lib/shipping/types';
import type { shippingProviders } from '@/lib/db/schema';
import { X, Loader2, CheckCircle, XCircle } from 'lucide-react';

type ShippingProvider = typeof shippingProviders.$inferSelect;

interface ShippingProviderConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerInfo: ShippingProviderInfo;
  existingConfig?: ShippingProvider;
  storeSlug: string;
}

export function ShippingProviderConfigModal({
  isOpen,
  onClose,
  providerInfo,
  existingConfig,
  storeSlug,
}: ShippingProviderConfigModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state - credentials (use defaultValue if no existing config)
  const [credentials, setCredentials] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    providerInfo.requiredCredentials.forEach(cred => {
      const existingValue = (existingConfig?.credentials as Record<string, string>)?.[cred.key];
      initial[cred.key] = existingValue || cred.defaultValue || '';
    });
    return initial;
  });

  // Form state - settings
  const [testMode, setTestMode] = useState(existingConfig?.testMode ?? true);
  const [displayName, setDisplayName] = useState(existingConfig?.displayName || providerInfo.nameHe);

  // Sender address settings
  interface ShippingSettings {
    senderName: string;
    senderPhone: string;
    senderStreet: string;
    senderCity: string;
    senderZipCode: string;
    autoSendOnPayment: boolean;
  }
  const [settings, setSettings] = useState<ShippingSettings>(() => {
    const existingSettings = existingConfig?.settings as Partial<ShippingSettings> || {};
    return {
      senderName: existingSettings.senderName || '',
      senderPhone: existingSettings.senderPhone || '',
      senderStreet: existingSettings.senderStreet || '',
      senderCity: existingSettings.senderCity || '',
      senderZipCode: existingSettings.senderZipCode || '',
      autoSendOnPayment: existingSettings.autoSendOnPayment ?? false,
    };
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const method = existingConfig ? 'PATCH' : 'POST';
      const response = await fetch(`/api/shops/${storeSlug}/settings/shipping/${providerInfo.type}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials,
          settings,
          testMode,
          displayName,
          isActive: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'שגיאה בשמירת ההגדרות');
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`/api/shops/${storeSlug}/settings/shipping/${providerInfo.type}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials, testMode }),
      });

      const data = await response.json();
      setTestResult({
        success: data.success,
        message: data.success ? 'החיבור הצליח!' : (data.error || 'החיבור נכשל'),
      });
    } catch {
      setTestResult({ success: false, message: 'שגיאה בבדיקת החיבור' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('האם למחוק את הספק? כל ההגדרות יימחקו.')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/shops/${storeSlug}/settings/shipping/${providerInfo.type}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
        onClose();
      }
    } catch (err) {
      setError('שגיאה במחיקת הספק');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {existingConfig ? 'עריכת' : 'הגדרת'} {providerInfo.nameHe}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                הזן את פרטי החיבור לספק המשלוחים
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שם תצוגה
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              />
            </div>

            {/* Credentials */}
            {providerInfo.requiredCredentials.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">פרטי התחברות</h3>
                {providerInfo.requiredCredentials.map(cred => (
                  <div key={cred.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {cred.labelHe}
                      {cred.required && <span className="text-red-500 mr-1">*</span>}
                    </label>
                    <input
                      type={cred.type}
                      value={credentials[cred.key] || ''}
                      onChange={e => setCredentials({ ...credentials, [cred.key]: e.target.value })}
                      required={cred.required}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                      placeholder={cred.placeholder || (existingConfig && cred.type === 'password' ? '••••••••' : '')}
                    />
                    {cred.defaultValue && !credentials[cred.key] && (
                      <p className="text-xs text-gray-400 mt-1">ברירת מחדל: {cred.defaultValue}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Sender Address */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">כתובת השולח</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם
                  </label>
                  <input
                    type="text"
                    value={settings.senderName}
                    onChange={e => setSettings({ ...settings, senderName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    טלפון
                  </label>
                  <input
                    type="tel"
                    value={settings.senderPhone}
                    onChange={e => setSettings({ ...settings, senderPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  רחוב ומספר
                </label>
                <input
                  type="text"
                  value={settings.senderStreet}
                  onChange={e => setSettings({ ...settings, senderStreet: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    עיר
                  </label>
                  <input
                    type="text"
                    value={settings.senderCity}
                    onChange={e => setSettings({ ...settings, senderCity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מיקוד
                  </label>
                  <input
                    type="text"
                    value={settings.senderZipCode}
                    onChange={e => setSettings({ ...settings, senderZipCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Auto Send on Payment Toggle */}
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">שליחה אוטומטית לאחר תשלום</div>
                <p className="text-sm text-gray-500">הזמנות יישלחו אוטומטית ל{providerInfo.nameHe} לאחר התשלום</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, autoSendOnPayment: !settings.autoSendOnPayment })}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.autoSendOnPayment ? 'bg-blue-500' : 'bg-gray-200'}
                `}
                dir="ltr"
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                    ${settings.autoSendOnPayment ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {/* Test Mode Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">מצב בדיקות</div>
                <p className="text-sm text-gray-500">משלוחים לא יישלחו באמת</p>
              </div>
              <button
                type="button"
                onClick={() => setTestMode(!testMode)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${testMode ? 'bg-yellow-500' : 'bg-green-500'}
                `}
                dir="ltr"
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                    ${testMode ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {/* Test Connection Button */}
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  בודק חיבור...
                </>
              ) : (
                'בדוק חיבור'
              )}
            </button>

            {/* Test Result */}
            {testResult && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              {existingConfig ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  מחק ספק
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {existingConfig ? 'שמור שינויים' : 'הוסף ספק'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

