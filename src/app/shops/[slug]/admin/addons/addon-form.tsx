'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createAddon, updateAddon, AddonFormData, AddonOption } from './actions';

interface AddonFormProps {
  storeId: string;
  storeSlug: string;
  addon?: {
    id: string;
    name: string;
    fieldType: 'text' | 'select' | 'checkbox' | 'radio' | 'date';
    placeholder: string | null;
    options: AddonOption[];
    priceAdjustment: number;
    isRequired: boolean;
    maxLength: number | null;
    isActive: boolean;
  };
}

const fieldTypes = [
  { value: 'text', label: 'טקסט חופשי', description: 'שדה טקסט לכתיבה חופשית (למשל: רקמה אישית)' },
  { value: 'select', label: 'בחירה מרשימה', description: 'דרופדאון עם מספר אפשרויות' },
  { value: 'checkbox', label: 'תיבת סימון', description: 'אפשרות כן/לא (למשל: אריזת מתנה)' },
  { value: 'radio', label: 'בחירה בודדת', description: 'כפתורי רדיו - בחירה אחת מתוך כמה' },
  { value: 'date', label: 'תאריך', description: 'בחירת תאריך (למשל: תאריך משלוח רצוי)' },
] as const;

export function AddonForm({ storeId, storeSlug, addon }: AddonFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [name, setName] = useState(addon?.name || '');
  const [fieldType, setFieldType] = useState<AddonFormData['fieldType']>(addon?.fieldType || 'text');
  const [placeholder, setPlaceholder] = useState(addon?.placeholder || '');
  const [priceAdjustment, setPriceAdjustment] = useState(addon?.priceAdjustment?.toString() || '');
  const [isRequired, setIsRequired] = useState(addon?.isRequired || false);
  const [maxLength, setMaxLength] = useState(addon?.maxLength?.toString() || '');
  const [isActive, setIsActive] = useState(addon?.isActive ?? true);
  const [options, setOptions] = useState<AddonOption[]>(
    addon?.options?.length ? addon.options : [{ label: '', value: '', priceAdjustment: 0 }]
  );

  const needsOptions = fieldType === 'select' || fieldType === 'radio';

  const addOption = () => {
    setOptions([...options, { label: '', value: '', priceAdjustment: 0 }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, field: keyof AddonOption, value: string | number) => {
    const newOptions = [...options];
    if (field === 'priceAdjustment') {
      newOptions[index][field] = Number(value) || 0;
    } else {
      newOptions[index][field] = value as string;
    }
    // Auto-fill value from label if empty
    if (field === 'label' && !newOptions[index].value) {
      newOptions[index].value = (value as string).toLowerCase().replace(/\s+/g, '_');
    }
    setOptions(newOptions);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'שם התוספת נדרש';
    }

    if (needsOptions) {
      const validOptions = options.filter(o => o.label.trim());
      if (validOptions.length < 1) {
        newErrors.options = 'נדרשת לפחות אפשרות אחת';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const data: AddonFormData = {
      name: name.trim(),
      fieldType,
      placeholder: placeholder.trim() || undefined,
      priceAdjustment: needsOptions ? 0 : (Number(priceAdjustment) || 0),
      isRequired,
      maxLength: fieldType === 'text' && maxLength ? Number(maxLength) : undefined,
      isActive,
      options: needsOptions ? options.filter(o => o.label.trim()).map(o => ({
        label: o.label.trim(),
        value: o.value.trim() || o.label.trim().toLowerCase().replace(/\s+/g, '_'),
        priceAdjustment: o.priceAdjustment || 0,
      })) : undefined,
    };

    startTransition(async () => {
      if (addon) {
        await updateAddon(addon.id, storeId, data);
      } else {
        await createAddon(storeId, data);
      }
      router.push(`/shops/${storeSlug}/admin/addons`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-medium text-gray-900">פרטי התוספת</h2>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            שם התוספת *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="למשל: רקמה אישית"
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Field Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            סוג השדה *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fieldTypes.map((type) => (
              <label
                key={type.value}
                className={`relative flex flex-col p-4 border rounded-lg cursor-pointer transition-all ${
                  fieldType === type.value
                    ? 'border-black bg-gray-50 ring-1 ring-black'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="fieldType"
                  value={type.value}
                  checked={fieldType === type.value}
                  onChange={(e) => setFieldType(e.target.value as AddonFormData['fieldType'])}
                  className="sr-only"
                />
                <span className="font-medium text-gray-900">{type.label}</span>
                <span className="text-xs text-gray-500 mt-1">{type.description}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Placeholder (for text/date) */}
        {(fieldType === 'text' || fieldType === 'date') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              טקסט עזר (placeholder)
            </label>
            <input
              type="text"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="למשל: הכנס את הטקסט לרקמה..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        )}

        {/* Max Length (for text) */}
        {fieldType === 'text' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מקסימום תווים
            </label>
            <input
              type="number"
              value={maxLength}
              onChange={(e) => setMaxLength(e.target.value)}
              placeholder="ללא הגבלה"
              min="1"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Options (for select/radio) */}
      {needsOptions && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">אפשרויות</h2>
            <button
              type="button"
              onClick={addOption}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              הוסף אפשרות
            </button>
          </div>

          {errors.options && <p className="text-sm text-red-600">{errors.options}</p>}

          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => updateOption(index, 'label', e.target.value)}
                    placeholder="שם האפשרות"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div className="w-32">
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+₪</span>
                    <input
                      type="number"
                      value={option.priceAdjustment || ''}
                      onChange={(e) => updateOption(index, 'priceAdjustment', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  disabled={options.length <= 1}
                  className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price (for simple types) */}
      {!needsOptions && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-medium text-gray-900">תמחור</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תוספת מחיר
            </label>
            <div className="relative max-w-xs">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₪</span>
              <input
                type="number"
                value={priceAdjustment}
                onChange={(e) => setPriceAdjustment(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-4 py-2.5 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {fieldType === 'checkbox' ? 'הסכום שיתווסף אם הלקוח יסמן' : 'הסכום שיתווסף למחיר המוצר'}
            </p>
          </div>
        </div>
      )}

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
            <p className="text-sm text-gray-500">הלקוח חייב למלא את השדה הזה</p>
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
            <p className="text-sm text-gray-500">התוספת תופיע במוצרים שמשוייכת אליהם</p>
          </div>
        </label>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isPending ? 'שומר...' : addon ? 'עדכן תוספת' : 'צור תוספת'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}

