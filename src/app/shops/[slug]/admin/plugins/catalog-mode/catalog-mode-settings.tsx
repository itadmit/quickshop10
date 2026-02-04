'use client';

/**
 * Catalog Mode Settings Component
 * 
 * 🎨 Client component for managing catalog mode settings
 */

import { useState } from 'react';
import { updateCatalogModeConfig, type CatalogModeConfig } from './actions';
import { 
  BookOpen, 
  ShoppingCart, 
  CreditCard, 
  Eye, 
  EyeOff,
  Phone,
  Check,
  Loader2,
  AlertTriangle,
  FolderTree,
  Globe
} from 'lucide-react';

interface CatalogModeSettingsProps {
  storeId: string;
  storeSlug: string;
  initialConfig: Record<string, unknown>;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export function CatalogModeSettings({ 
  storeId, 
  storeSlug, 
  initialConfig,
  categories 
}: CatalogModeSettingsProps) {
  const [config, setConfig] = useState<CatalogModeConfig>({
    enabled: Boolean(initialConfig.enabled),
    mode: (initialConfig.mode as 'all' | 'categories') || 'all',
    categoryIds: (initialConfig.categoryIds as string[]) || [],
    hideCartButton: Boolean(initialConfig.hideCartButton ?? true),
    hideCartSidebar: Boolean(initialConfig.hideCartSidebar ?? true),
    hideAddToCart: Boolean(initialConfig.hideAddToCart ?? true),
    blockCheckout: Boolean(initialConfig.blockCheckout ?? true),
    showContactButton: Boolean(initialConfig.showContactButton),
    contactButtonText: String(initialConfig.contactButtonText || 'צור קשר להזמנה'),
    contactButtonUrl: String(initialConfig.contactButtonUrl || ''),
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateCatalogModeConfig(storeId, config);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'שגיאה בשמירה');
    }

    setSaving(false);
  };

  const toggleCategory = (categoryId: string) => {
    setConfig(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      {config.enabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-amber-800">מצב קטלוג פעיל</p>
            <p className="text-sm text-amber-700 mt-1">
              {config.mode === 'all' 
                ? 'לקוחות לא יוכלו להוסיף מוצרים לעגלה או לבצע רכישות בכל האתר.'
                : `מצב קטלוג פעיל על ${config.categoryIds.length} קטגוריות שנבחרו.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Enable Toggle */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.enabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {config.enabled ? (
                  <EyeOff className="w-5 h-5 text-blue-600" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">הפעלת מצב קטלוג</h3>
                <p className="text-sm text-gray-500">הסתר אפשרויות רכישה והפוך לקטלוג צפייה בלבד</p>
              </div>
            </div>
            <button
              onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                config.enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  config.enabled ? 'right-0.5' : 'right-7'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mode Selection */}
        {config.enabled && (
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-medium text-gray-900 mb-4">מצב פעולה</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* All Site */}
              <button
                onClick={() => setConfig(prev => ({ ...prev, mode: 'all' }))}
                className={`p-4 rounded-xl border-2 text-right transition-all ${
                  config.mode === 'all'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Globe className={`w-5 h-5 ${config.mode === 'all' ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className={`font-medium ${config.mode === 'all' ? 'text-blue-900' : 'text-gray-700'}`}>
                    כל האתר
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  מצב קטלוג יחול על כל המוצרים והקטגוריות באתר
                </p>
              </button>

              {/* By Categories */}
              <button
                onClick={() => setConfig(prev => ({ ...prev, mode: 'categories' }))}
                className={`p-4 rounded-xl border-2 text-right transition-all ${
                  config.mode === 'categories'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <FolderTree className={`w-5 h-5 ${config.mode === 'categories' ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className={`font-medium ${config.mode === 'categories' ? 'text-blue-900' : 'text-gray-700'}`}>
                    לפי קטגוריות
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  בחר קטגוריות ספציפיות שיהיו במצב קטלוג
                </p>
              </button>
            </div>

            {/* Category Selection */}
            {config.mode === 'categories' && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  בחר קטגוריות (מוצרים בקטגוריות אלו לא יהיו זמינים לרכישה)
                </label>
                {categories.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-500">
                    אין קטגוריות בחנות. צור קטגוריות כדי להשתמש במצב זה.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {categories.map((category) => (
                      <label
                        key={category.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          config.categoryIds.includes(category.id)
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={config.categoryIds.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-900">{category.name}</span>
                        <span className="text-xs text-gray-400">/{category.slug}</span>
                      </label>
                    ))}
                  </div>
                )}
                {config.mode === 'categories' && config.categoryIds.length > 0 && (
                  <p className="text-sm text-blue-600 mt-2">
                    נבחרו {config.categoryIds.length} קטגוריות
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Visibility Options */}
        {config.enabled && (
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-medium text-gray-900 mb-4">מה להסתיר?</h3>
            <div className="space-y-4">
              {/* Hide Cart Button */}
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-gray-500" />
                  <div>
                    <span className="text-gray-900">הסתר כפתור עגלה</span>
                    <p className="text-xs text-gray-500">הסתר את אייקון העגלה מהתפריט העליון</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.hideCartButton}
                  onChange={(e) => setConfig(prev => ({ ...prev, hideCartButton: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </label>

              {/* Hide Cart Sidebar */}
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-500" />
                  <div>
                    <span className="text-gray-900">הסתר סיידבר עגלה</span>
                    <p className="text-xs text-gray-500">מנע פתיחת חלון העגלה הצדדי</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.hideCartSidebar}
                  onChange={(e) => setConfig(prev => ({ ...prev, hideCartSidebar: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </label>

              {/* Hide Add to Cart */}
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-gray-500" />
                  <div>
                    <span className="text-gray-900">הסתר כפתורי &quot;הוסף לסל&quot;</span>
                    <p className="text-xs text-gray-500">הסתר מדף מוצר, כרטיסי מוצרים, ומוצרים מומלצים</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.hideAddToCart}
                  onChange={(e) => setConfig(prev => ({ ...prev, hideAddToCart: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </label>

              {/* Block Checkout */}
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-500" />
                  <div>
                    <span className="text-gray-900">חסום דפי צ&apos;קאאוט ועגלה</span>
                    <p className="text-xs text-gray-500">הפנה מבקרים לדף הבית אם מנסים להגיע לדפים אלו</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.blockCheckout}
                  onChange={(e) => setConfig(prev => ({ ...prev, blockCheckout: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </label>
            </div>
          </div>
        )}

        {/* Contact Button Option */}
        {config.enabled && (
          <div className="p-6">
            <h3 className="font-medium text-gray-900 mb-4">כפתור צור קשר (אופציונלי)</h3>
            <p className="text-sm text-gray-500 mb-4">
              הצג כפתור &quot;צור קשר&quot; במקום כפתור &quot;הוסף לסל&quot; בדף מוצר
            </p>
            
            <label className="flex items-center justify-between cursor-pointer mb-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900">הפעל כפתור צור קשר</span>
              </div>
              <input
                type="checkbox"
                checked={config.showContactButton}
                onChange={(e) => setConfig(prev => ({ ...prev, showContactButton: e.target.checked }))}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </label>

            {config.showContactButton && (
              <div className="space-y-4 pr-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    טקסט הכפתור
                  </label>
                  <input
                    type="text"
                    value={config.contactButtonText}
                    onChange={(e) => setConfig(prev => ({ ...prev, contactButtonText: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="צור קשר להזמנה"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    קישור (URL או וואטסאפ)
                  </label>
                  <input
                    type="text"
                    value={config.contactButtonUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, contactButtonUrl: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://wa.me/972501234567 או /contact"
                    dir="ltr"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    דוגמאות: https://wa.me/972501234567, /contact, mailto:info@store.com
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div>
          {error && (
            <p className="text-red-600 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </p>
          )}
          {success && (
            <p className="text-green-600 text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              ההגדרות נשמרו בהצלחה
            </p>
          )}
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              שומר...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              שמור הגדרות
            </>
          )}
        </button>
      </div>
    </div>
  );
}
