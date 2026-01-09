'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { deleteAddon, toggleAddonStatus } from './actions';
import { formatPrice } from '@/lib/format-price';

interface AddonOption {
  label: string;
  value: string;
  priceAdjustment: number;
}

interface Addon {
  id: string;
  name: string;
  fieldType: 'text' | 'select' | 'checkbox' | 'radio' | 'date';
  placeholder: string | null;
  options: AddonOption[];
  priceAdjustment: number;
  isRequired: boolean;
  maxLength: number | null;
  isActive: boolean;
  createdAt: Date;
}

interface AddonsDataTableProps {
  addons: Addon[];
  storeSlug: string;
  storeId: string;
  fieldTypeLabels: Record<string, string>;
}

export function AddonsDataTable({ addons, storeSlug, storeId, fieldTypeLabels }: AddonsDataTableProps) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`האם למחוק את התוספת "${name}"?`)) return;
    
    setDeletingId(id);
    startTransition(async () => {
      await deleteAddon(id, storeId);
      setDeletingId(null);
    });
  };

  const handleToggle = (id: string, isActive: boolean) => {
    startTransition(async () => {
      await toggleAddonStatus(id, storeId, !isActive);
    });
  };

  const getPriceDisplay = (addon: Addon) => {
    if (addon.fieldType === 'select' || addon.fieldType === 'radio') {
      const pricesWithValue = addon.options?.filter(o => (o.priceAdjustment || 0) > 0);
      if (pricesWithValue?.length) {
        const min = Math.min(...pricesWithValue.map(o => o.priceAdjustment));
        const max = Math.max(...pricesWithValue.map(o => o.priceAdjustment));
        if (min === max) return `+${formatPrice(min)}`;
        return `+${formatPrice(min)} - +${formatPrice(max)}`;
      }
      return '—';
    }
    
    if (addon.priceAdjustment > 0) {
      return `+${formatPrice(addon.priceAdjustment)}`;
    }
    
    return '—';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                שם התוספת
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                סוג שדה
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                תוספת מחיר
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                חובה
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                סטטוס
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {addons.map((addon) => (
              <tr key={addon.id} className={`hover:bg-gray-50 ${deletingId === addon.id ? 'opacity-50' : ''}`}>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{addon.name}</div>
                  {addon.placeholder && (
                    <div className="text-sm text-gray-500 truncate max-w-[200px]">
                      {addon.placeholder}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {fieldTypeLabels[addon.fieldType] || addon.fieldType}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-medium ${getPriceDisplay(addon) === '—' ? 'text-gray-400' : 'text-green-600'}`}>
                    {getPriceDisplay(addon)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {addon.isRequired ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                      חובה
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">אופציונלי</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggle(addon.id, addon.isActive)}
                    disabled={isPending}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      addon.isActive ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        addon.isActive ? '-translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/shops/${storeSlug}/admin/addons/${addon.id}`}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(addon.id, addon.name)}
                      disabled={isPending || deletingId === addon.id}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

