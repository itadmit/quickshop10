'use client';

import { useState, useTransition } from 'react';
import { getCategoryAddons, assignAddonsToCategory } from '../../addons/actions';

interface Addon {
  id: string;
  name: string;
  fieldType: 'text' | 'select' | 'checkbox' | 'radio' | 'date';
  isRequired: boolean;
  priceAdjustment: string | null;
  isActive: boolean;
}

interface AssignedAddon extends Addon {
  isRequiredOverride: boolean | null;
  priceOverride: string | null;
  assignmentId: string;
}

interface CategoryAddonsSectionProps {
  categoryId: string;
  storeSlug: string;
  storeAddons: Addon[];
  assignedAddons: AssignedAddon[];
}

const fieldTypeLabels: Record<string, string> = {
  text: 'טקסט',
  select: 'בחירה מרשימה',
  checkbox: 'תיבת סימון',
  radio: 'בחירה בודדת',
  date: 'תאריך',
};

export function CategoryAddonsSection({
  categoryId,
  storeSlug,
  storeAddons,
  assignedAddons,
}: CategoryAddonsSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(
    assignedAddons.map(a => a.id)
  );
  const [saved, setSaved] = useState(false);

  const availableAddons = storeAddons.filter(addon => addon.isActive);

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
    setSaved(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      await assignAddonsToCategory(categoryId, storeSlug, selectedAddonIds);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  if (availableAddons.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">תוספות לקטגוריה</h2>
          <p className="text-xs text-gray-500 mt-0.5">כל המוצרים בקטגוריה יקבלו את התוספות האלה</p>
        </div>
        <div className="p-4 text-center text-gray-500 text-sm">
          <p>אין תוספות פעילות בחנות</p>
          <a
            href={`/shops/${storeSlug}/admin/addons/new`}
            className="text-blue-600 hover:text-blue-700 mt-1 inline-block"
          >
            צור תוספת חדשה →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">תוספות לקטגוריה</h2>
          <p className="text-xs text-gray-500 mt-0.5">כל המוצרים בקטגוריה יקבלו את התוספות האלה</p>
        </div>
        {selectedAddonIds.length > 0 && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {selectedAddonIds.length} נבחרו
          </span>
        )}
      </div>

      <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
        {availableAddons.map(addon => {
          const isSelected = selectedAddonIds.includes(addon.id);
          
          return (
            <label
              key={addon.id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 border border-transparent hover:bg-gray-100'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleAddon(addon.id)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm">{addon.name}</span>
                  {addon.isRequired && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                      חובה
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">{fieldTypeLabels[addon.fieldType]}</span>
                  {addon.priceAdjustment && Number(addon.priceAdjustment) > 0 && (
                    <span className="text-xs text-green-600">+₪{addon.priceAdjustment}</span>
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        {saved ? (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            נשמר!
          </span>
        ) : (
          <span className="text-xs text-gray-500">
            {selectedAddonIds.length === assignedAddons.length 
              ? 'ללא שינויים'
              : 'יש שינויים שלא נשמרו'}
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isPending ? 'שומר...' : 'שמור'}
        </button>
      </div>
    </div>
  );
}

