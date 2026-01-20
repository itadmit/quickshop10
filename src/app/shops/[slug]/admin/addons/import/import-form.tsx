'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { parseAddonsHtml, convertToAddonFormData, type ParsedAddon } from '@/lib/utils/addon-html-parser';
import { bulkCreateAddons, type AddonFormData } from '../actions';

interface ImportAddonsFormProps {
  storeId: string;
  storeSlug: string;
}

const fieldTypeLabels: Record<string, string> = {
  text: 'טקסט חופשי',
  select: 'בחירה מרשימה',
  checkbox: 'תיבת סימון',
  radio: 'בחירה בודדת',
  date: 'תאריך',
};

interface EditableAddon extends ParsedAddon {
  selected: boolean;
  editedFieldType: ParsedAddon['fieldType'];
}

export function ImportAddonsForm({ storeId, storeSlug }: ImportAddonsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [html, setHtml] = useState('');
  const [parsedAddons, setParsedAddons] = useState<EditableAddon[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [step, setStep] = useState<'input' | 'preview' | 'success'>('input');
  const [importedCount, setImportedCount] = useState(0);

  const handleParse = () => {
    if (!html.trim()) {
      setErrors(['נא להדביק קוד HTML']);
      return;
    }

    const result = parseAddonsHtml(html);
    
    setErrors(result.errors);
    setWarnings(result.warnings);
    
    if (result.addons.length > 0) {
      setParsedAddons(result.addons.map(addon => ({
        ...addon,
        selected: true,
        editedFieldType: addon.suggestedFieldType || addon.fieldType,
      })));
      setStep('preview');
    }
  };

  const toggleAddon = (index: number) => {
    setParsedAddons(prev => prev.map((addon, i) => 
      i === index ? { ...addon, selected: !addon.selected } : addon
    ));
  };

  const changeFieldType = (index: number, newType: ParsedAddon['fieldType']) => {
    setParsedAddons(prev => prev.map((addon, i) => 
      i === index ? { ...addon, editedFieldType: newType, warning: undefined } : addon
    ));
  };

  const handleImport = () => {
    const selectedAddons = parsedAddons.filter(a => a.selected);
    
    if (selectedAddons.length === 0) {
      setErrors(['נא לבחור לפחות תוספת אחת לייבוא']);
      return;
    }

    startTransition(async () => {
      const addonsToCreate: AddonFormData[] = selectedAddons.map(addon => ({
        ...convertToAddonFormData({
          ...addon,
          fieldType: addon.editedFieldType,
        }),
        isActive: true,
      }));

      await bulkCreateAddons(storeId, storeSlug, addonsToCreate);
      setImportedCount(addonsToCreate.length);
      setStep('success');
    });
  };

  const handleReset = () => {
    setHtml('');
    setParsedAddons([]);
    setErrors([]);
    setWarnings([]);
    setStep('input');
  };

  // Success state
  if (step === 'success') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">הייבוא הושלם בהצלחה!</h2>
        <p className="text-gray-600 mb-6">{importedCount} תוספות יובאו למערכת</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.push(`/shops/${storeSlug}/admin/addons`)}
            className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            צפה בתוספות
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            ייבוא נוסף
          </button>
        </div>
      </div>
    );
  }

  // Preview state
  if (step === 'preview') {
    const selectedCount = parsedAddons.filter(a => a.selected).length;
    
    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-blue-800">
              נמצאו <strong>{parsedAddons.length}</strong> תוספות • <strong>{selectedCount}</strong> נבחרו לייבוא
            </span>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-medium text-amber-800 mb-1">שים לב:</h3>
                <ul className="text-sm text-amber-700 space-y-1">
                  {warnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Addons list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">תצוגה מקדימה</h2>
            <p className="text-sm text-gray-500 mt-0.5">סמן את התוספות שברצונך לייבא ובחר את סוג השדה המתאים</p>
          </div>

          <div className="divide-y divide-gray-100">
            {parsedAddons.map((addon, index) => (
              <div
                key={index}
                className={`p-4 transition-colors ${addon.selected ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={addon.selected}
                    onChange={() => toggleAddon(index)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-gray-900">{addon.name}</h3>
                      {addon.isRequired && (
                        <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                          חובה
                        </span>
                      )}
                      {addon.warning && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                          </svg>
                          בעיה אפשרית
                        </span>
                      )}
                    </div>
                    
                    {addon.description && (
                      <p className="text-sm text-gray-500 mt-1">{addon.description}</p>
                    )}

                    {/* Options preview */}
                    {addon.options && addon.options.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {addon.options.slice(0, 3).map((opt, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {opt.label}
                            {opt.priceAdjustment > 0 && (
                              <span className="text-green-600 mr-1">+₪{opt.priceAdjustment}</span>
                            )}
                          </span>
                        ))}
                        {addon.options.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{addon.options.length - 3} נוספים
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Field type selector */}
                  <div className="flex-shrink-0">
                    <select
                      value={addon.editedFieldType}
                      onChange={(e) => changeFieldType(index, e.target.value as ParsedAddon['fieldType'])}
                      disabled={!addon.selected}
                      className={`text-sm border rounded-lg px-3 py-2 ${
                        addon.warning && addon.editedFieldType === addon.fieldType
                          ? 'border-amber-300 bg-amber-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <option value="text">טקסט חופשי</option>
                      <option value="select">בחירה מרשימה</option>
                      <option value="checkbox">תיבת סימון</option>
                      <option value="radio">בחירה בודדת</option>
                      <option value="date">תאריך</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleImport}
            disabled={isPending || selectedCount === 0}
            className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isPending ? 'מייבא...' : `ייבא ${selectedCount} תוספות`}
          </button>
          <button
            onClick={handleReset}
            disabled={isPending}
            className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            חזור
          </button>
        </div>
      </div>
    );
  }

  // Input state
  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-3">איך זה עובד?</h2>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs flex-shrink-0">1</span>
            <span>פתח את עמוד המוצר עם התוספות באתר הקיים</span>
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs flex-shrink-0">2</span>
            <span>לחץ ימני על טופס התוספות ← Inspect (בדיקה)</span>
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs flex-shrink-0">3</span>
            <span>מצא את אלמנט הטופס (לפי פלטפורמה):</span>
          </li>
        </ol>
        
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="font-medium text-gray-900 text-sm mb-1">WooCommerce</div>
            <code className="text-xs bg-gray-100 px-1 rounded">form.cart</code> או
            <code className="text-xs bg-gray-100 px-1 rounded">.wc-pao-addons-container</code>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="font-medium text-gray-900 text-sm mb-1">Shopify</div>
            <code className="text-xs bg-gray-100 px-1 rounded">product-form</code> או
            <code className="text-xs bg-gray-100 px-1 rounded">.product__options</code>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="font-medium text-gray-900 text-sm mb-1">Magento</div>
            <code className="text-xs bg-gray-100 px-1 rounded">.product-options-wrapper</code>
          </div>
        </div>

        <ol start={4} className="space-y-2 text-sm text-gray-600 mt-4">
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs flex-shrink-0">4</span>
            <span>לחץ ימני ← Copy ← Copy outerHTML</span>
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs flex-shrink-0">5</span>
            <span>הדבק את הקוד כאן למטה - המערכת תזהה את הפלטפורמה אוטומטית</span>
          </li>
        </ol>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-medium text-red-800 mb-1">שגיאות:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* HTML Input */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          קוד HTML של התוספות
        </label>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          placeholder='<form class="cart">...</form>'
          rows={12}
          dir="ltr"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-mono text-sm"
        />
        <p className="mt-2 text-xs text-gray-500">
          הדבק את קוד ה-HTML מאתר וורדפרס. המערכת תזהה אוטומטית את התוספות ותתרגם אותן.
        </p>
      </div>

      {/* Parse button */}
      <button
        onClick={handleParse}
        disabled={!html.trim()}
        className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        המשך לתצוגה מקדימה
      </button>
    </div>
  );
}

