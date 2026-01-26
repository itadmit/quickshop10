'use client';

/**
 * WhatsApp Settings Form
 * 
 * טופס הגדרות - Token + Instance ID
 */

import { useState, useTransition } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle, XCircle, Send } from 'lucide-react';
import { saveWhatsAppConfig, testWhatsAppConnection } from './actions';

interface Props {
  storeId: string;
  storeSlug: string;
  initialConfig: {
    token: string;
    instanceId: string;
    enabled: boolean;
  };
}

export function WhatsAppSettingsForm({ storeId, storeSlug, initialConfig }: Props) {
  const [token, setToken] = useState(initialConfig.token);
  const [instanceId, setInstanceId] = useState(initialConfig.instanceId);
  const [enabled, setEnabled] = useState(initialConfig.enabled);
  const [showToken, setShowToken] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  
  const [isPending, startTransition] = useTransition();
  const [isTesting, setIsTesting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveWhatsAppConfig(storeId, storeSlug, {
        token,
        instanceId,
        enabled,
      });
      setSaveStatus(result.success ? 'success' : 'error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    });
  };

  const handleTest = async () => {
    if (!token || !instanceId || !testPhone) {
      setTestResult({ success: false, message: 'יש למלא את כל השדות כולל מספר לבדיקה' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testWhatsAppConnection(token, instanceId, testPhone);
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: 'שגיאה בבדיקת החיבור' });
    } finally {
      setIsTesting(false);
    }
  };

  const isConfigured = token && instanceId;

  return (
    <div className="space-y-6">
      {/* Token Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          API Token
        </label>
        <div className="relative">
          <input
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="הזן את ה-Token מ-True Story"
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Instance ID Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instance ID
        </label>
        <input
          type="text"
          value={instanceId}
          onChange={(e) => setInstanceId(e.target.value)}
          placeholder="הזן את ה-Instance ID"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          dir="ltr"
        />
      </div>

      {/* Enable Toggle */}
      <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
        <div>
          <p className="font-medium text-gray-900">הפעל שליחת הודעות</p>
          <p className="text-sm text-gray-500">כשמופעל, ניתן לשלוח הודעות מהדיוור ומהאוטומציות</p>
        </div>
        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            enabled ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              enabled ? 'right-0.5' : 'right-6'
            }`}
          />
        </button>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors font-medium"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            שומר...
          </>
        ) : saveStatus === 'success' ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-400" />
            נשמר בהצלחה!
          </>
        ) : saveStatus === 'error' ? (
          <>
            <XCircle className="w-5 h-5 text-red-400" />
            שגיאה בשמירה
          </>
        ) : (
          'שמור הגדרות'
        )}
      </button>

      {/* Test Connection */}
      {isConfigured && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-medium text-gray-900 mb-4">בדיקת חיבור</h3>
          
          <div className="flex gap-3">
            <input
              type="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="מספר טלפון לבדיקה (למשל 0501234567)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              dir="ltr"
            />
            <button
              onClick={handleTest}
              disabled={isTesting || !testPhone}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
            >
              {isTesting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              שלח בדיקה
            </button>
          </div>

          {testResult && (
            <div
              className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                testResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <p className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                {testResult.message}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

