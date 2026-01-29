'use client';

import { useState, useMemo, useCallback } from 'react';

// Types
export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  getValue?: (row: T) => number | string; // For custom sort values
  className?: string;
}

interface SortableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  footer?: React.ReactNode;
  emptyMessage?: string;
}

// Sort icon component
function SortIcon({ direction }: { direction: SortDirection }) {
  return (
    <span className="inline-flex flex-col mr-1 text-[10px] leading-none">
      <span className={direction === 'asc' ? 'text-black' : 'text-gray-300'}>▲</span>
      <span className={direction === 'desc' ? 'text-black' : 'text-gray-300'}>▼</span>
    </span>
  );
}

export function SortableTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyField,
  footer,
  emptyMessage = 'אין נתונים',
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      // Cycle: desc -> asc -> null
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection(null);
        setSortKey(null);
      } else {
        setSortDirection('desc');
      }
    } else {
      setSortKey(key);
      setSortDirection('desc'); // Default to descending (highest first)
    }
  }, [sortKey, sortDirection]);

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const column = columns.find(c => c.key === sortKey);
      
      let aValue: number | string;
      let bValue: number | string;
      
      if (column?.getValue) {
        aValue = column.getValue(a);
        bValue = column.getValue(b);
      } else {
        aValue = a[sortKey as keyof T] as number | string;
        bValue = b[sortKey as keyof T] as number | string;
      }

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle strings
      const aStr = String(aValue || '');
      const bStr = String(bValue || '');
      return sortDirection === 'asc' 
        ? aStr.localeCompare(bStr, 'he') 
        : bStr.localeCompare(aStr, 'he');
    });
  }, [data, sortKey, sortDirection, columns]);

  if (!data.length) {
    return <p className="text-gray-500 text-center py-12">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-right">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`py-3 px-4 font-medium text-gray-500 text-sm ${
                  col.sortable ? 'cursor-pointer hover:text-black select-none' : ''
                } ${col.className || ''}`}
                onClick={() => col.sortable && handleSort(String(col.key))}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <SortIcon direction={sortKey === col.key ? sortDirection : null} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedData.map((row) => (
            <tr key={String(row[keyField])} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={String(col.key)} className={`py-3 px-4 ${col.className || ''}`}>
                  {col.render 
                    ? col.render(row[col.key as keyof T], row)
                    : String(row[col.key as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot>{footer}</tfoot>}
      </table>
    </div>
  );
}

// Export Button Component
interface ExportButtonProps {
  data: Record<string, unknown>[];
  columns: { key: string; label: string }[];
  filename: string;
}

export function ExportButton({ data, columns, filename }: ExportButtonProps) {
  const handleExport = useCallback(() => {
    // Create CSV content
    const headers = columns.map(c => c.label).join(',');
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col.key];
        // Escape commas and quotes in values
        const strValue = String(value ?? '');
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      }).join(',')
    ).join('\n');
    
    const csv = `\uFEFF${headers}\n${rows}`; // BOM for Hebrew support
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data, columns, filename]);

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      ייצוא CSV
    </button>
  );
}

