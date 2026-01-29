'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createApiKey, toggleApiKey, deleteApiKey } from './actions';

// ============================================
// API Scopes - duplicated here to avoid importing db on client
// ============================================

const API_SCOPES = {
  // Orders
  'orders:read': 'קריאת הזמנות',
  'orders:write': 'יצירה ועדכון הזמנות',
  
  // Products
  'products:read': 'קריאת מוצרים',
  'products:write': 'יצירה, עדכון ומחיקת מוצרים',
  
  // Customers
  'customers:read': 'קריאת לקוחות',
  'customers:write': 'יצירה ועדכון לקוחות',
  
  // Discounts
  'discounts:read': 'קריאת קופונים והנחות',
  'discounts:write': 'ניהול קופונים והנחות',
  
  // Inventory
  'inventory:read': 'קריאת מלאי',
  'inventory:write': 'עדכון מלאי',
  
  // Analytics
  'analytics:read': 'קריאת אנליטיקס',
  
  // Webhooks
  'webhooks:read': 'קריאת webhooks',
  'webhooks:write': 'ניהול webhooks',
} as const;

// ============================================
// Types
// ============================================

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastFour: string;
  scopes: string[];
  rateLimit: number;
  isActive: boolean;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  totalRequests: number;
  description: string | null;
  createdAt: Date;
}

interface ApiSettingsFormProps {
  storeId: string;
  storeSlug: string;
  apiKeys: ApiKey[];
}

// ============================================
// Scope Groups for UI
// ============================================

const SCOPE_GROUPS = {
  orders: {
    label: 'הזמנות',
    scopes: ['orders:read', 'orders:write'],
  },
  products: {
    label: 'מוצרים',
    scopes: ['products:read', 'products:write'],
  },
  customers: {
    label: 'לקוחות',
    scopes: ['customers:read', 'customers:write'],
  },
  discounts: {
    label: 'קופונים והנחות',
    scopes: ['discounts:read', 'discounts:write'],
  },
  inventory: {
    label: 'מלאי',
    scopes: ['inventory:read', 'inventory:write'],
  },
  analytics: {
    label: 'אנליטיקס',
    scopes: ['analytics:read'],
  },
  webhooks: {
    label: 'Webhooks',
    scopes: ['webhooks:read', 'webhooks:write'],
  },
} as const;

// ============================================
// Create API Key Form Component
// ============================================

function CreateApiKeyForm({ storeId, storeSlug }: { storeId: string; storeSlug: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (selectedScopes.length === 0) {
      setError('יש לבחור לפחות הרשאה אחת');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const expiresAt = formData.get('expiresAt') as string;
    
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      scopes: selectedScopes,
      rateLimit: parseInt(formData.get('rateLimit') as string) || 100,
      expiresAt: expiresAt || null,
    };

    startTransition(async () => {
      const result = await createApiKey(storeId, storeSlug, data);
      
      if (result.success && result.apiKey) {
        setNewKey(result.apiKey);
        (e.target as HTMLFormElement).reset();
        setSelectedScopes([]);
        router.refresh();
      } else {
        setError(result.error || 'שגיאה ביצירת המפתח');
      }
    });
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev => 
      prev.includes(scope) 
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  const selectAllInGroup = (scopes: readonly string[]) => {
    const allSelected = scopes.every(s => selectedScopes.includes(s));
    if (allSelected) {
      setSelectedScopes(prev => prev.filter(s => !scopes.includes(s)));
    } else {
      setSelectedScopes(prev => [...new Set([...prev, ...scopes])]);
    }
  };

  const copyToClipboard = async () => {
    if (newKey) {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Show new key modal
  if (newKey) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900">המפתח נוצר בהצלחה!</h3>
            <p className="text-sm text-green-700 mt-1">
              שמור את המפתח עכשיו - לא תוכל לראות אותו שוב!
            </p>
            
            <div className="mt-4 relative">
              <div className="font-mono text-sm bg-white border border-green-200 rounded-lg p-4 pl-14 break-all" dir="ltr">
                {newKey}
              </div>
              <button
                onClick={copyToClipboard}
                className="absolute top-2 left-2 p-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                title="העתק"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-green-700" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-green-700" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="6" y="6" width="10" height="12" rx="1" />
                    <path d="M4 14V4a1 1 0 011-1h8" />
                  </svg>
                )}
              </button>
            </div>

            <button
              onClick={() => setNewKey(null)}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              הבנתי, שמרתי את המפתח
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            שם המפתח *
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="למשל: אינטגרציית ERP"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            תיאור (אופציונלי)
          </label>
          <input
            type="text"
            name="description"
            placeholder="מה המפתח מיועד לעשות"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          הרשאות *
        </label>
        <div className="space-y-3">
          {Object.entries(SCOPE_GROUPS).map(([key, group]) => (
            <div key={key} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{group.label}</span>
                <button
                  type="button"
                  onClick={() => selectAllInGroup(group.scopes)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  {group.scopes.every(s => selectedScopes.includes(s)) ? 'בטל הכל' : 'בחר הכל'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.scopes.map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => toggleScope(scope)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      selectedScopes.includes(scope)
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {API_SCOPES[scope as keyof typeof API_SCOPES]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {showAdvanced ? '- הסתר הגדרות מתקדמות' : '+ הגדרות מתקדמות'}
        </button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100 mt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              הגבלת קריאות (לדקה)
            </label>
            <input
              type="number"
              name="rateLimit"
              defaultValue={100}
              min={1}
              max={10000}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
            />
            <p className="text-xs text-gray-500 mt-1">ברירת מחדל: 100 קריאות לדקה</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תאריך תפוגה (אופציונלי)
            </label>
            <input
              type="date"
              name="expiresAt"
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
            />
            <p className="text-xs text-gray-500 mt-1">השאר ריק למפתח ללא תפוגה</p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Submit Button - aligned to start (right in RTL) */}
      <div className="flex justify-start pt-4 border-t border-gray-100 mt-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer font-medium"
        >
          {isPending ? 'יוצר מפתח...' : 'צור מפתח API'}
        </button>
      </div>
    </form>
  );
}

// ============================================
// API Key Item Component
// ============================================

function ApiKeyItem({ apiKey, storeSlug }: { apiKey: ApiKey; storeSlug: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleToggle = () => {
    startTransition(async () => {
      await toggleApiKey(apiKey.id, storeSlug, !apiKey.isActive);
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteApiKey(apiKey.id, storeSlug);
      router.refresh();
    });
  };

  const scopeLabels = apiKey.scopes.map(scope => 
    API_SCOPES[scope as keyof typeof API_SCOPES] || scope
  );

  return (
    <div className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900">{apiKey.name}</h3>
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              apiKey.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {apiKey.isActive ? 'פעיל' : 'מושבת'}
            </span>
            {apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date() && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                פג תוקף
              </span>
            )}
          </div>
          
          {apiKey.description && (
            <p className="text-sm text-gray-500 mt-1">{apiKey.description}</p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            <code className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded font-mono" dir="ltr">
              {apiKey.keyPrefix}****{apiKey.lastFour}
            </code>
          </div>
          
          <div className="flex flex-wrap gap-1.5 mt-2">
            {scopeLabels.slice(0, 5).map((label, idx) => (
              <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                {label}
              </span>
            ))}
            {scopeLabels.length > 5 && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                +{scopeLabels.length - 5} עוד
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span>{apiKey.totalRequests.toLocaleString()} קריאות</span>
            <span>{apiKey.rateLimit}/דקה</span>
            {apiKey.lastUsedAt && (
              <span>
                שימוש אחרון: {new Date(apiKey.lastUsedAt).toLocaleDateString('he-IL')}
              </span>
            )}
            {apiKey.expiresAt && (
              <span>
                תפוגה: {new Date(apiKey.expiresAt).toLocaleDateString('he-IL')}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {showConfirm ? (
            <>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? '...' : 'מחק'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                ביטול
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleToggle}
                disabled={isPending}
                className={`px-3 py-1 text-xs rounded-lg ${
                  apiKey.isActive 
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                } disabled:opacity-50`}
              >
                {isPending ? '...' : apiKey.isActive ? 'השבת' : 'הפעל'}
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="מחק מפתח"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function ApiSettingsForm({ storeId, storeSlug, apiKeys }: ApiSettingsFormProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">מפתחות API</h1>
        <p className="text-gray-500 text-sm mt-1">
          צור וניהול מפתחות גישה ל-API של החנות שלך
        </p>
      </div>

      {/* Create API Key Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">יצירת מפתח חדש</h2>
        <CreateApiKeyForm storeId={storeId} storeSlug={storeSlug} />
      </div>

      {/* API Keys List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold">מפתחות פעילים ({apiKeys.length})</h2>
        </div>
        
        {apiKeys.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <p>אין מפתחות API מוגדרים</p>
            <p className="text-sm mt-1">צור מפתח חדש כדי להתחיל להשתמש ב-API</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {apiKeys.map((apiKey) => (
              <ApiKeyItem key={apiKey.id} apiKey={apiKey} storeSlug={storeSlug} />
            ))}
          </div>
        )}
      </div>

      {/* API Documentation */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">מידע טכני</h3>
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <p className="font-medium text-gray-900 mb-1">כתובת החנות שלך</p>
            <code className="px-2 py-1 bg-gray-200 rounded text-xs font-mono" dir="ltr">
              https://my-quickshop.com/shops/{storeSlug}
            </code>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">נתיבי API זמינים</p>
            <p className="text-xs text-gray-500 mb-2">
              המפתח מזהה אוטומטית את החנות שלך
            </p>
            <div className="space-y-1">
              <code className="block px-2 py-1 bg-gray-200 rounded text-xs font-mono" dir="ltr">
                GET/POST https://my-quickshop.com/api/v1/orders
              </code>
              <code className="block px-2 py-1 bg-gray-200 rounded text-xs font-mono" dir="ltr">
                GET/POST https://my-quickshop.com/api/v1/products
              </code>
              <code className="block px-2 py-1 bg-gray-200 rounded text-xs font-mono" dir="ltr">
                GET https://my-quickshop.com/api/v1/customers
              </code>
              <code className="block px-2 py-1 bg-gray-200 rounded text-xs font-mono" dir="ltr">
                PATCH https://my-quickshop.com/api/v1/inventory/[id]
              </code>
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">אימות</p>
            <p>העבר את המפתח בכותרת הבקשה:</p>
            <code className="block mt-2 px-3 py-2 bg-gray-200 rounded text-xs font-mono" dir="ltr">
              X-API-Key: qs_live_xxxxxxxxxx
            </code>
            <p className="mt-2">או:</p>
            <code className="block mt-2 px-3 py-2 bg-gray-200 rounded text-xs font-mono" dir="ltr">
              Authorization: Bearer qs_live_xxxxxxxxxx
            </code>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Rate Limiting</p>
            <p>כל מפתח מוגבל למספר קריאות לדקה. במקרה של חריגה תקבל שגיאה 429.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">תמונות ומדיה</p>
            <div className="text-sm space-y-1">
              <p>📸 <strong>תמונות:</strong> שלח URL חיצוני. עם <code className="bg-gray-200 px-1 rounded text-xs">download_images: true</code> יורד ל-Vercel Blob (WebP).</p>
              <p>🎥 <strong>וידאו:</strong> שלח URL מ-Cloudinary או מקור אחר - נשמר כמו שהוא.</p>
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">תיעוד מלא</p>
            <div className="flex gap-3 mt-2">
              <a 
                href="/api-docs"
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                תיעוד API מלא →
              </a>
              <a 
                href={`/shops/${storeSlug}/admin/settings/webhooks`}
                className="text-blue-600 hover:underline"
              >
                הגדרת Webhooks →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

