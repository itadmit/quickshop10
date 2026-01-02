'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { PaymentProviderInfo } from '@/lib/payments/types';
import type { paymentProviders } from '@/lib/db/schema';

// Type for configured provider from database
type PaymentProvider = typeof paymentProviders.$inferSelect;

interface ProviderConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerInfo: PaymentProviderInfo;
  existingConfig?: PaymentProvider;
  storeSlug: string;
}

export function ProviderConfigModal({
  isOpen,
  onClose,
  providerInfo,
  existingConfig,
  storeSlug,
}: ProviderConfigModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [testMode, setTestMode] = useState(true);
  const [displayName, setDisplayName] = useState('');

  // Initialize form with existing config
  useEffect(() => {
    if (existingConfig) {
      const existingCreds = existingConfig.credentials as Record<string, string> || {};
      setCredentials(existingCreds);
      setTestMode(existingConfig.testMode);
      setDisplayName(existingConfig.displayName || '');
    } else {
      setCredentials({});
      setTestMode(true);
      setDisplayName('');
    }
    setTestResult(null);
    setError(null);
  }, [existingConfig, isOpen]);

  // Handle credential change
  const handleCredentialChange = (key: string, value: string) => {
    setCredentials(prev => ({ ...prev, [key]: value }));
    setTestResult(null);
    setError(null);
  };

  // Test connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const response = await fetch(`/api/shops/${storeSlug}/settings/payments/${providerInfo.type}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials,
          testMode,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTestResult({ success: true, message: 'החיבור הצליח!' });
      } else {
        setTestResult({ success: false, message: data.error || 'החיבור נכשל' });
      }
    } catch {
      setTestResult({ success: false, message: 'שגיאה בבדיקת החיבור' });
    } finally {
      setIsTesting(false);
    }
  };

  // Save configuration
  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const method = existingConfig ? 'PATCH' : 'POST';
      const response = await fetch(`/api/shops/${storeSlug}/settings/payments/${providerInfo.type}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials,
          testMode,
          displayName: displayName || providerInfo.nameHe,
          isActive: existingConfig?.isActive ?? true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.refresh();
        onClose();
      } else {
        setError(data.error || 'שגיאה בשמירת ההגדרות');
      }
    } catch {
      setError('שגיאה בשמירת ההגדרות');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if form is valid
  const isValid = providerInfo.requiredCredentials
    .filter(c => c.required)
    .every(c => credentials[c.key]?.trim());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                הגדרת {providerInfo.nameHe}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                הזן את פרטי החיבור מחברת הסליקה
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Test/Production Mode Toggle */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <button
                onClick={() => setTestMode(!testMode)}
                dir="ltr"
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 cursor-pointer
                  ${testMode ? 'bg-yellow-500' : 'bg-green-500'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                    ${testMode ? 'translate-x-1' : 'translate-x-6'}
                  `}
                />
              </button>
              <div>
                <div className="font-medium text-gray-900">מצב בדיקות</div>
                <p className="text-sm text-gray-500">
                  {testMode ? 'תשלומים לא יחויבו באמת' : 'תשלומים אמיתיים פעילים'}
                </p>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                שם תצוגה (אופציונלי)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={providerInfo.nameHe}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Credentials Fields */}
            {providerInfo.requiredCredentials.map((cred) => (
              <div key={cred.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {cred.labelHe}
                  {cred.required && <span className="text-red-500 mr-1">*</span>}
                </label>
                <input
                  type={cred.type}
                  value={credentials[cred.key] || ''}
                  onChange={(e) => handleCredentialChange(cred.key, e.target.value)}
                  placeholder={`הזן ${cred.labelHe}`}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow font-mono text-sm"
                  dir="ltr"
                />
              </div>
            ))}

            {/* Test Result */}
            {testResult && (
              <div className={`p-4 rounded-lg ${
                testResult.success 
                  ? 'bg-green-50 border border-green-100' 
                  : 'bg-red-50 border border-red-100'
              }`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className={`font-medium ${
                    testResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {testResult.message}
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <span className="text-red-700">{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button
              onClick={handleTestConnection}
              disabled={!isValid || isTesting}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {isTesting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  בודק חיבור...
                </span>
              ) : (
                'בדוק חיבור'
              )}
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer"
              >
                ביטול
              </button>
              <button
                onClick={handleSave}
                disabled={!isValid || isLoading}
                className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {isLoading ? 'שומר...' : 'שמור'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

