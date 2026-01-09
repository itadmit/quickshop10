'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { deleteMetafield, toggleMetafieldStatus, MetafieldDefinition } from './actions';

interface MetafieldsDataTableProps {
  metafields: MetafieldDefinition[];
  storeSlug: string;
  storeId: string;
  fieldTypeLabels: Record<string, string>;
}

export function MetafieldsDataTable({ metafields, storeSlug, storeId, fieldTypeLabels }: MetafieldsDataTableProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (metafieldId: string, isActive: boolean) => {
    startTransition(async () => {
      await toggleMetafieldStatus(storeId, storeSlug, metafieldId, isActive);
    });
  };

  const handleDelete = (metafieldId: string, name: string) => {
    if (!confirm(`האם למחוק את השדה "${name}"?`)) return;
    
    startTransition(async () => {
      await deleteMetafield(storeId, storeSlug, metafieldId);
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שם</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סוג</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">הצגה</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {metafields.map((metafield) => (
            <tr key={metafield.id} className={isPending ? 'opacity-50' : ''}>
              <td className="px-4 py-4">
                <div className="font-medium text-gray-900">{metafield.name}</div>
                <code className="text-xs text-gray-400">{metafield.key}</code>
                {metafield.isRequired && (
                  <span className="mr-2 text-xs text-red-500">*חובה</span>
                )}
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">
                {fieldTypeLabels[metafield.type] || metafield.type}
              </td>
              <td className="px-4 py-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  {metafield.showOnProduct && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      מוצר
                    </span>
                  )}
                  {metafield.showInCheckout && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      הזמנה
                    </span>
                  )}
                  {!metafield.showOnProduct && !metafield.showInCheckout && (
                    <span className="text-gray-400 text-xs">לא מוצג</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-4 text-center">
                <button
                  onClick={() => handleToggle(metafield.id, !metafield.isActive)}
                  disabled={isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    metafield.isActive ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      metafield.isActive ? 'translate-x-1' : 'translate-x-6'
                    }`}
                  />
                </button>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/shops/${storeSlug}/admin/metafields/${metafield.id}`}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDelete(metafield.id, metafield.name)}
                    disabled={isPending}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
  );
}

