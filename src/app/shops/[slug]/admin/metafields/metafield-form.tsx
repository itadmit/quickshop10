'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createMetafield, updateMetafield, MetafieldFormData, MetafieldDefinition } from './actions';

interface MetafieldFormProps {
  storeId: string;
  storeSlug: string;
  metafield?: MetafieldDefinition;
}

const fieldTypes = [
  { value: 'text', label: 'טקסט קצר', description: 'שורה אחת של טקסט' },
  { value: 'textarea', label: 'טקסט ארוך', description: 'מספר שורות של טקסט' },
  { value: 'number', label: 'מספר', description: 'ערך מספרי' },
  { value: 'date', label: 'תאריך', description: 'בחירת תאריך' },
  { value: 'url', label: 'קישור (URL)', description: 'כתובת אינטרנט' },
  { value: 'boolean', label: 'כן/לא', description: 'תיבת סימון' },
] as const;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\u0590-\u05FF]+/g, '_') // Replace Hebrew chars and spaces with underscore
    .replace(/[^\w_]+/g, '') // Remove non-word chars except underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

export function MetafieldForm({ storeId, storeSlug, metafield }: MetafieldFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [name, setName] = useState(metafield?.name || '');
  const [key, setKey] = useState(metafield?.key || '');
  const [type, setType] = useState<MetafieldFormData['type']>(metafield?.type || 'text');
  const [placeholder, setPlaceholder] = useState(metafield?.placeholder || '');
  const [isRequired, setIsRequired] = useState(metafield?.isRequired || false);
  const [isActive, setIsActive] = useState(metafield?.isActive ?? true);
  // Display options
  const [showOnProduct, setShowOnProduct] = useState(metafield?.showOnProduct ?? true);
  const [showInCheckout, setShowInCheckout] = useState(metafield?.showInCheckout ?? false);

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate key from name if not editing
    if (!metafield) {
      setKey(slugify(value));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'שם השדה נדרש';
    }

    if (!key.trim()) {
      newErrors.key = 'מפתח השדה נדרש';
    } else if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      newErrors.key = 'המפתח חייב להתחיל באות קטנה ולהכיל רק אותיות, מספרים וקו תחתון';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const data: MetafieldFormData = {
      name: name.trim(),
      key: key.trim().toLowerCase(),
      type,
      placeholder: placeholder.trim() || undefined,
      isRequired,
      isActive,
      showOnProduct,
      showInCheckout,
    };

    startTransition(async () => {
      let result;
      if (metafield) {
        result = await updateMetafield(storeId, storeSlug, metafield.id, data);
      } else {
        result = await createMetafield(storeId, storeSlug, data);
      }
      
      if (result.success === false) {
        setErrors({ key: result.error || 'שגיאה' });
        return;
      }
      
      router.push(`/shops/${storeSlug}/admin/metafields`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-medium text-gray-900">פרטי השדה</h2>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            שם השדה *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="למשל: חומר"
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            מפתח (לשימוש פנימי) *
          </label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="material"
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-mono ${
              errors.key ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.key && <p className="mt-1 text-sm text-red-600">{errors.key}</p>}
          <p className="mt-1 text-xs text-gray-500">אותיות קטנות באנגלית, מספרים וקו תחתון בלבד</p>
        </div>

        {/* Field Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            סוג השדה *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {fieldTypes.map((fieldType) => (
              <label
                key={fieldType.value}
                className={`relative flex flex-col p-4 border rounded-lg cursor-pointer transition-all ${
                  type === fieldType.value
                    ? 'border-black bg-gray-50 ring-1 ring-black'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={fieldType.value}
                  checked={type === fieldType.value}
                  onChange={(e) => setType(e.target.value as MetafieldFormData['type'])}
                  className="sr-only"
                />
                <span className="font-medium text-gray-900 text-sm">{fieldType.label}</span>
                <span className="text-xs text-gray-500 mt-0.5">{fieldType.description}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Placeholder */}
        {(type === 'text' || type === 'textarea' || type === 'url') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              טקסט עזר (placeholder)
            </label>
            <input
              type="text"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="למשל: הכנס את החומר..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Display Options */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-medium text-gray-900">היכן להציג</h2>
        <p className="text-sm text-gray-500">בחר היכן השדה יופיע ללקוחות</p>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnProduct}
            onChange={(e) => setShowOnProduct(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
          />
          <div>
            <span className="font-medium text-gray-900">הצג בעמוד מוצר</span>
            <p className="text-sm text-gray-500">השדה יוצג בעמוד המוצר בחזית החנות (לתצוגה בלבד)</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showInCheckout}
            onChange={(e) => setShowInCheckout(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
          />
          <div>
            <span className="font-medium text-gray-900">הצג בצ'קאאוט ושמור בהזמנה</span>
            <p className="text-sm text-gray-500">השדה יופיע בסיכום ההזמנה ויישמר בפרטי ההזמנה, במייל ובעמוד תודה</p>
          </div>
        </label>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-medium text-gray-900">הגדרות</h2>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
          />
          <div>
            <span className="font-medium text-gray-900">שדה חובה</span>
            <p className="text-sm text-gray-500">חייב למלא שדה זה בעת יצירת/עריכת מוצר</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
          />
          <div>
            <span className="font-medium text-gray-900">פעיל</span>
            <p className="text-sm text-gray-500">השדה יופיע בטופס עריכת מוצר</p>
          </div>
        </label>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isPending ? 'שומר...' : metafield ? 'עדכן שדה' : 'צור שדה'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}

