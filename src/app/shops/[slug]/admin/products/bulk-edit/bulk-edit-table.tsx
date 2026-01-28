'use client';

import { useState, useRef, useEffect, useTransition, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { bulkUpdateProduct } from './actions';
import { InlineCategoryPicker, type CategoryNode } from '@/components/admin/category-picker';

// Storage key for user column preferences
const STORAGE_KEY = 'quickshop_bulk_edit_columns';

// All available columns with metadata
// isToggle marks columns that support bulk toggle (turn all on/off)
const ALL_COLUMNS = [
  { id: 'product', label: 'מוצר', required: true, width: 'w-[22%]', isToggle: false },
  { id: 'category', label: 'קטגוריה', required: false, width: 'w-[12%]', isToggle: false },
  { id: 'sku', label: 'מק״ט', required: false, width: 'w-[9%]', isToggle: false },
  { id: 'barcode', label: 'ברקוד', required: false, width: 'w-[10%]', isToggle: false },
  { id: 'price', label: 'מחיר', required: false, width: 'w-[9%]', isToggle: false },
  { id: 'comparePrice', label: 'השוואה', required: false, width: 'w-[9%]', isToggle: false },
  { id: 'cost', label: 'עלות', required: false, width: 'w-[8%]', isToggle: false },
  { id: 'weight', label: 'משקל', required: false, width: 'w-[7%]', isToggle: false },
  { id: 'inventory', label: 'מלאי', required: false, width: 'w-[7%]', isToggle: false },
  { id: 'trackInventory', label: 'ניהול מלאי', required: false, width: 'w-[8%]', isToggle: true, variantSupport: false },
  { id: 'allowBackorder', label: 'מכירה באזילה', required: false, width: 'w-[9%]', isToggle: true, variantSupport: true },
  { id: 'isActive', label: 'פעיל', required: false, width: 'w-[6%]', isToggle: true, variantSupport: true },
  { id: 'isFeatured', label: 'מומלץ', required: false, width: 'w-[6%]', isToggle: true, variantSupport: false },
] as const;

type ColumnId = typeof ALL_COLUMNS[number]['id'];

// Default visible columns
const DEFAULT_COLUMNS: ColumnId[] = ['product', 'category', 'sku', 'price', 'comparePrice', 'cost', 'inventory', 'isActive'];

interface BulkEditItem {
  id: string;
  productId: string;
  productName: string;
  variantTitle: string | null;
  sku: string | null;
  barcode: string | null;
  price: string | null;
  comparePrice: string | null;
  cost: string | null;
  weight: string | null;
  inventory: number;
  isActive: boolean;
  isFeatured: boolean;
  trackInventory: boolean;
  allowBackorder: boolean;
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

// Column selector dropdown
function ColumnSelector({
  visibleColumns,
  onToggle,
}: {
  visibleColumns: ColumnId[];
  onToggle: (columnId: ColumnId) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        <span>התאמת עמודות</span>
        <span className="text-xs text-gray-400">({visibleColumns.length - 1})</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2 border-b border-gray-100">
            <p className="text-xs text-gray-500">בחר שדות להצגה בטבלה</p>
          </div>
          <div className="p-2 max-h-80 overflow-y-auto">
            {ALL_COLUMNS.map((col) => (
              <label
                key={col.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-50 ${
                  col.required ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col.id)}
                  disabled={col.required}
                  onChange={() => !col.required && onToggle(col.id)}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm text-gray-700">{col.label}</span>
                {col.required && <span className="text-[10px] text-gray-400">(חובה)</span>}
              </label>
            ))}
          </div>
          <div className="p-2 border-t border-gray-100 flex gap-2">
            <button
              type="button"
              onClick={() => {
                // Reset to defaults (will trigger localStorage update via parent)
                ALL_COLUMNS.forEach(col => {
                  if (DEFAULT_COLUMNS.includes(col.id) !== visibleColumns.includes(col.id) && !col.required) {
                    onToggle(col.id);
                  }
                });
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              איפוס לברירת מחדל
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Toggle column header with bulk on/off actions
function ToggleColumnHeader({
  label,
  onToggleAll,
  disabled = false,
}: {
  label: string;
  onToggleAll: (value: boolean) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center gap-1 text-xs font-medium text-gray-500 uppercase hover:text-gray-700 transition-colors ${
          disabled ? 'cursor-not-allowed opacity-50' : ''
        }`}
        disabled={disabled}
      >
        {label}
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && !disabled && (
        <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <button
            type="button"
            onClick={() => {
              onToggleAll(true);
              setIsOpen(false);
            }}
            className="w-full text-right px-3 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors flex items-center gap-2"
          >
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            הדלק הכל
          </button>
          <button
            type="button"
            onClick={() => {
              onToggleAll(false);
              setIsOpen(false);
            }}
            className="w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <span className="w-3 h-3 bg-gray-300 rounded-full"></span>
            כבה הכל
          </button>
        </div>
      )}
    </div>
  );
}

export function BulkEditTable({ items, storeSlug, categories }: BulkEditTableProps) {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  
  // Load saved columns from localStorage (client-side only)
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(DEFAULT_COLUMNS);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage after hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ColumnId[];
        // Ensure required columns are always included
        const withRequired = ['product' as ColumnId, ...parsed.filter(c => c !== 'product')];
        setVisibleColumns(withRequired);
      }
    } catch {
      // Ignore errors, use defaults
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage when columns change
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
      } catch {
        // Ignore errors
      }
    }
  }, [visibleColumns, isHydrated]);

  const toggleColumn = useCallback((columnId: ColumnId) => {
    setVisibleColumns(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(c => c !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  }, []);

  // Get column info by id
  const getColumn = useCallback((id: ColumnId) => {
    return ALL_COLUMNS.find(c => c.id === id)!;
  }, []);

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

  // Bulk toggle all items for a specific column
  const handleBulkToggle = useCallback(async (field: ColumnId, value: boolean) => {
    const col = getColumn(field);
    const variantSupport = 'variantSupport' in col ? col.variantSupport : true;
    
    // Filter items that support this field
    const itemsToUpdate = items.filter(item => {
      // If field doesn't support variants and this is a variant, skip it
      if (!variantSupport && item.isVariant) return false;
      return true;
    });

    startTransition(async () => {
      // Update all items in parallel (with limit to avoid overwhelming)
      const batchSize = 10;
      for (let i = 0; i < itemsToUpdate.length; i += batchSize) {
        const batch = itemsToUpdate.slice(i, i + batchSize);
        await Promise.all(
          batch.map(item => bulkUpdateProduct(item.id, item.isVariant, { [field]: value }))
        );
      }
      router.refresh();
    });
  }, [items, getColumn, router, startTransition]);

  // Compute table width classes based on visible columns
  const tableWidthClass = useMemo(() => {
    const colCount = visibleColumns.length;
    if (colCount <= 6) return '';
    if (colCount <= 8) return 'min-w-[900px]';
    return 'min-w-[1100px]';
  }, [visibleColumns]);

  // Render cell content based on column type
  const renderCell = useCallback((item: BulkEditItem, columnId: ColumnId) => {
    switch (columnId) {
      case 'product':
        return (
          <div className="flex items-center gap-2">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.productName}
                width={32}
                height={32}
                className="w-8 h-8 object-cover rounded shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-xs leading-snug">{item.productName}</p>
              {item.variantTitle && (
                <p className="text-[11px] text-gray-500 mt-0.5">{item.variantTitle}</p>
              )}
            </div>
          </div>
        );

      case 'category':
        return !item.isVariant ? (
          <InlineCategoryPicker
            categories={categories}
            value={item.categoryId}
            displayValue={item.categoryName}
            onChange={async (categoryId) => {
              await handleUpdate(item.id, item.isVariant, 'categoryId', categoryId || '');
            }}
          />
        ) : (
          <span className="text-xs text-gray-400">-</span>
        );

      case 'sku':
        return (
          <EditableCell
            value={item.sku || ''}
            onSave={async (value) => handleUpdate(item.id, item.isVariant, 'sku', value)}
            className="text-xs"
          />
        );

      case 'barcode':
        return (
          <EditableCell
            value={item.barcode || ''}
            onSave={async (value) => handleUpdate(item.id, item.isVariant, 'barcode', value)}
            className="text-xs font-mono"
          />
        );

      case 'price':
        return (
          <EditableCell
            value={item.price || ''}
            type="price"
            onSave={async (value) => handleUpdate(item.id, item.isVariant, 'price', value)}
            prefix="₪"
            className="text-sm font-medium"
          />
        );

      case 'comparePrice':
        return (
          <EditableCell
            value={item.comparePrice || ''}
            type="price"
            onSave={async (value) => handleUpdate(item.id, item.isVariant, 'comparePrice', value)}
            prefix="₪"
            className="text-sm text-gray-500"
          />
        );

      case 'cost':
        return (
          <EditableCell
            value={item.cost || ''}
            type="price"
            onSave={async (value) => handleUpdate(item.id, item.isVariant, 'cost', value)}
            prefix="₪"
            className="text-sm text-gray-500"
          />
        );

      case 'weight':
        return (
          <EditableCell
            value={item.weight || ''}
            type="number"
            onSave={async (value) => handleUpdate(item.id, item.isVariant, 'weight', value)}
            suffix=" ק״ג"
            className="text-xs text-gray-500"
          />
        );

      case 'inventory':
        return item.trackInventory ? (
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
        );

      case 'trackInventory':
        return !item.isVariant ? (
          <ToggleSwitch
            checked={item.trackInventory}
            onChange={(checked) => {
              startTransition(async () => {
                await handleUpdate(item.id, item.isVariant, 'trackInventory', checked);
              });
            }}
            disabled={isPending}
          />
        ) : (
          <span className="text-xs text-gray-400">-</span>
        );

      case 'allowBackorder':
        return (
          <ToggleSwitch
            checked={item.allowBackorder}
            onChange={(checked) => {
              startTransition(async () => {
                await handleUpdate(item.id, item.isVariant, 'allowBackorder', checked);
              });
            }}
            disabled={isPending}
          />
        );

      case 'isActive':
        return (
          <ToggleSwitch
            checked={item.isActive}
            onChange={(checked) => {
              startTransition(async () => {
                await handleUpdate(item.id, item.isVariant, 'isActive', checked);
              });
            }}
            disabled={isPending}
          />
        );

      case 'isFeatured':
        return !item.isVariant ? (
          <ToggleSwitch
            checked={item.isFeatured}
            onChange={(checked) => {
              startTransition(async () => {
                await handleUpdate(item.id, item.isVariant, 'isFeatured', checked);
              });
            }}
            disabled={isPending}
          />
        ) : (
          <span className="text-xs text-gray-400">-</span>
        );

      default:
        return null;
    }
  }, [categories, handleUpdate, isPending, startTransition]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Toolbar */}
      <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {selectedItems.size > 0 ? (
            <>
              <span className="text-sm text-gray-600">
                נבחרו {selectedItems.size} פריטים
              </span>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                בטל בחירה
              </button>
            </>
          ) : (
            <span className="text-sm text-gray-500">{items.length} פריטים</span>
          )}
        </div>
        <ColumnSelector visibleColumns={visibleColumns} onToggle={toggleColumn} />
      </div>

      <div className={`w-full overflow-x-auto ${tableWidthClass}`}>
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-[40px] py-3 px-3">
                <input
                  type="checkbox"
                  checked={selectedItems.size === items.length && items.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
              </th>
              {visibleColumns.map(colId => {
                const col = getColumn(colId);
                const isToggleColumn = 'isToggle' in col && col.isToggle;
                return (
                  <th 
                    key={colId}
                    className={`text-right py-3 px-2 ${col.width}`}
                  >
                    {isToggleColumn ? (
                      <ToggleColumnHeader
                        label={col.label}
                        onToggleAll={(value) => handleBulkToggle(colId, value)}
                        disabled={isPending}
                      />
                    ) : (
                      <span className="text-xs font-medium text-gray-500 uppercase">{col.label}</span>
                    )}
                  </th>
                );
              })}
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase w-[50px]"></th>
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
                <td className="py-2.5 px-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                </td>
                {visibleColumns.map(colId => (
                  <td key={colId} className="py-2.5 px-2">
                    {renderCell(item, colId)}
                  </td>
                ))}
                <td className="py-2.5 px-2">
                  <Link
                    href={`/shops/${storeSlug}/admin/products/${item.productId}`}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors inline-flex"
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
