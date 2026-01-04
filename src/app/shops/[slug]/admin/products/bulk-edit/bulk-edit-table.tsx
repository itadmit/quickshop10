'use client';

import { useState, useRef, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { bulkUpdateProduct } from './actions';
import { InlineCategoryPicker, type CategoryNode } from '@/components/admin/category-picker';

interface BulkEditItem {
  id: string;
  productId: string;
  productName: string;
  variantTitle: string | null;
  sku: string | null;
  price: string | null;
  comparePrice: string | null;
  cost: string | null;
  inventory: number;
  isActive: boolean;
  trackInventory: boolean;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  isVariant: boolean;
}

interface BulkEditTableProps {
  items: BulkEditItem[];
  storeSlug: string;
  categories: CategoryNode[];
}

// Inline editable cell component
function EditableCell({
  value,
  type = 'text',
  onSave,
  className = '',
  prefix = '',
  suffix = '',
}: {
  value: string;
  type?: 'text' | 'number' | 'price';
  onSave: (value: string) => Promise<void>;
  className?: string;
  prefix?: string;
  suffix?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = useCallback(() => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }
    startTransition(async () => {
      await onSave(editValue);
      setIsEditing(false);
    });
  }, [editValue, value, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type={type === 'price' || type === 'number' ? 'number' : 'text'}
          step={type === 'price' ? '0.01' : '1'}
          min={type === 'number' ? '0' : undefined}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isPending}
          className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-black/10 focus:border-black ${className}`}
          dir={type === 'text' ? 'rtl' : 'ltr'}
        />
        {isPending && (
          <div className="absolute left-1 top-1/2 -translate-y-1/2">
            <svg className="w-3 h-3 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={`w-full text-right px-2 py-1 rounded hover:bg-gray-100 transition-colors cursor-text ${className}`}
    >
      {value ? `${prefix}${value}${suffix}` : '-'}
    </button>
  );
}

// Toggle switch for active status
function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      dir="ltr"
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-green-500' : 'bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export function BulkEditTable({ items, storeSlug, categories }: BulkEditTableProps) {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const handleUpdate = useCallback(async (
    itemId: string,
    isVariant: boolean,
    field: string,
    value: string | number | boolean
  ) => {
    await bulkUpdateProduct(itemId, isVariant, { [field]: value });
    router.refresh();
  }, [router]);

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(i => i.id)));
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Bulk actions bar */}
      {selectedItems.size > 0 && (
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-4">
          <span className="text-sm text-gray-600">
            נבחרו {selectedItems.size} פריטים
          </span>
          <button
            onClick={() => setSelectedItems(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            בטל בחירה
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-10 py-3 px-4">
                <input
                  type="checkbox"
                  checked={selectedItems.size === items.length && items.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">מוצר</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase w-32">קטגוריה</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase w-24">SKU</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase w-24">מחיר</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase w-24">מחיר השוואה</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase w-24">עלות</th>
              <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase w-20">מלאי</th>
              <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase w-16">פעיל</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase w-16">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr 
                key={item.id} 
                className={`hover:bg-gray-50 transition-colors ${
                  selectedItems.has(item.id) ? 'bg-blue-50' : ''
                }`}
              >
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                      {item.variantTitle && (
                        <p className="text-xs text-gray-500">{item.variantTitle}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2">
                  {!item.isVariant ? (
                    <InlineCategoryPicker
                      categories={categories}
                      value={item.categoryId}
                      displayValue={item.categoryName}
                      onChange={async (categoryId) => {
                        await handleUpdate(item.id, item.isVariant, 'categoryId', categoryId || '');
                      }}
                    />
                  ) : (
                    <span className="text-xs text-gray-400 px-2">-</span>
                  )}
                </td>
                <td className="py-3 px-2">
                  <EditableCell
                    value={item.sku || ''}
                    onSave={async (value) => handleUpdate(item.id, item.isVariant, 'sku', value)}
                    className="text-xs"
                  />
                </td>
                <td className="py-3 px-2">
                  <EditableCell
                    value={item.price || ''}
                    type="price"
                    onSave={async (value) => handleUpdate(item.id, item.isVariant, 'price', value)}
                    prefix="₪"
                    className="text-sm font-medium"
                  />
                </td>
                <td className="py-3 px-2">
                  <EditableCell
                    value={item.comparePrice || ''}
                    type="price"
                    onSave={async (value) => handleUpdate(item.id, item.isVariant, 'comparePrice', value)}
                    prefix="₪"
                    className="text-sm text-gray-500"
                  />
                </td>
                <td className="py-3 px-2">
                  <EditableCell
                    value={item.cost || ''}
                    type="price"
                    onSave={async (value) => handleUpdate(item.id, item.isVariant, 'cost', value)}
                    prefix="₪"
                    className="text-sm text-gray-500"
                  />
                </td>
                <td className="py-3 px-2 text-center">
                  {item.trackInventory ? (
                    <EditableCell
                      value={item.inventory.toString()}
                      type="number"
                      onSave={async (value) => handleUpdate(item.id, item.isVariant, 'inventory', parseInt(value) || 0)}
                      className={`text-sm font-medium text-center ${
                        item.inventory === 0 ? 'text-red-600' : 
                        item.inventory <= 5 ? 'text-amber-600' : 'text-gray-900'
                      }`}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">∞</span>
                  )}
                </td>
                <td className="py-3 px-2 text-center">
                  <ToggleSwitch
                    checked={item.isActive}
                    onChange={(checked) => {
                      startTransition(async () => {
                        await handleUpdate(item.id, item.isVariant, 'isActive', checked);
                      });
                    }}
                    disabled={isPending}
                  />
                </td>
                <td className="py-3 px-4">
                  <Link
                    href={`/shops/${storeSlug}/admin/products/${item.productId}`}
                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors inline-flex"
                    title="ערוך מוצר"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

