'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useCallback, useState, useTransition } from 'react';

// ============================================
// DataTable - Client Component (מינימום JS)
// טבלה אחידה עם Tabs, Search, Selection, Pagination
// ============================================

// --- Tab Types ---
export interface Tab {
  id: string;
  label: string;
  count?: number;
}

// --- Column Types ---
export interface Column<T> {
  key: string;
  header: string;
  /** רוחב בפיקסלים או אחוזים */
  width?: string;
  /** יישור */
  align?: 'right' | 'center' | 'left';
  /** פונקציית רנדור */
  render: (item: T) => React.ReactNode;
}

// --- Bulk Action Types ---
export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
  /** פונקציה שמקבלת את ה-IDs שנבחרו */
  onAction: (selectedIds: string[]) => void | Promise<void>;
}

// --- Props ---
interface DataTableProps<T> {
  /** הנתונים להצגה */
  data: T[];
  /** הגדרת עמודות */
  columns: Column<T>[];
  /** מפתח ייחודי לכל שורה */
  getRowKey: (item: T) => string;
  /** לינק לשורה (אופציונלי) */
  getRowHref?: (item: T) => string;
  /** Tabs לסינון */
  tabs?: Tab[];
  /** Tab נוכחי */
  currentTab?: string;
  /** שם הפרמטר ב-URL עבור tabs (ברירת מחדל: status) */
  tabParamName?: string;
  /** האם להציג חיפוש */
  searchable?: boolean;
  /** placeholder לחיפוש */
  searchPlaceholder?: string;
  /** ערך חיפוש נוכחי */
  searchValue?: string;
  /** Pagination */
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
  };
  /** האם לאפשר בחירה */
  selectable?: boolean;
  /** פעולות bulk */
  bulkActions?: BulkAction[];
  /** Empty state */
  emptyState?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Additional URL params to preserve on tab/search change */
  additionalParams?: Record<string, string>;
  /** Extra content to render in pagination bar (e.g., per-page selector) */
  paginationExtra?: React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  getRowHref,
  tabs,
  currentTab = 'all',
  tabParamName = 'status',
  searchable = true,
  searchPlaceholder = 'חיפוש...',
  searchValue = '',
  pagination,
  selectable = true,
  bulkActions,
  emptyState,
  loading = false,
  additionalParams = {},
  paginationExtra,
}: DataTableProps<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Get all row IDs
  const allIds = data.map(item => getRowKey(item));
  const isAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

  // Selection handlers
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk action handler
  const handleBulkAction = async (action: BulkAction) => {
    if (selectedIds.size === 0) return;
    
    setIsProcessing(true);
    try {
      await action.onAction(Array.from(selectedIds));
      setSelectedIds(new Set());
    } finally {
      setIsProcessing(false);
    }
  };

  // Update URL params
  const updateParams = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Apply additional params first (to preserve them)
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset page when filtering
    if (tabParamName in updates || 'search' in updates) {
      params.delete('page');
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [searchParams, pathname, router, tabParamName, additionalParams]);

  // Handle tab click
  const handleTabClick = (tabId: string) => {
    updateParams({ [tabParamName]: tabId === 'all' ? undefined : tabId });
    setSelectedIds(new Set()); // Clear selection on tab change
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: localSearch || undefined });
    setSelectedIds(new Set()); // Clear selection on search
  };

  // Handle clear search
  const handleClearSearch = () => {
    setLocalSearch('');
    updateParams({ search: undefined });
    setSelectedIds(new Set());
  };

  const isLoading = loading || isPending || isProcessing;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Bulk Actions Bar - Shows when items are selected */}
      {selectable && selectedIds.size > 0 && (
        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-b border-gray-200 text-gray-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleClearSelection}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="בטל בחירה"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <span className="text-xs sm:text-sm font-medium">
              {selectedIds.size} נבחרו
            </span>
          </div>
          
          {bulkActions && bulkActions.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {bulkActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleBulkAction(action)}
                  disabled={isProcessing}
                  className={`
                    px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer
                    ${action.variant === 'danger' 
                      ? 'bg-white text-red-600 border border-red-300 hover:bg-red-50' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {action.icon}
                  <span className="hidden sm:inline">{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs + Search Row */}
      <div className="border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 sm:px-4 py-3">
          {/* Tabs - horizontal scroll on mobile */}
          {tabs && tabs.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`
                    px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer
                    ${currentTab === tab.id 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`
                      mr-1 sm:mr-1.5 px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full
                      ${currentTab === tab.id 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-100 text-gray-500'
                      }
                    `}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Spacer when no tabs */}
          {(!tabs || tabs.length === 0) && <div />}

          {/* Search */}
          {searchable && (
            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <svg 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full sm:w-48 md:w-64 pr-9 pl-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Table - horizontally scrollable on mobile */}
      <div className={`relative overflow-x-auto ${isLoading ? 'opacity-60' : ''}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}

        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {/* Selection Column */}
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <label className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/20 cursor-pointer"
                    />
                  </label>
                </th>
              )}
              {columns.map((col) => (
                <th 
                  key={col.key}
                  style={{ width: col.width }}
                  className={`
                    px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider
                    ${col.align === 'center' ? 'text-center' : ''}
                    ${col.align === 'left' ? 'text-left' : 'text-right'}
                  `}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12">
                  {emptyState || (
                    <div className="text-center text-gray-500">
                      לא נמצאו תוצאות
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const rowKey = getRowKey(item);
                const rowHref = getRowHref?.(item);
                const isSelected = selectedIds.has(rowKey);
                
                return (
                  <tr 
                    key={rowKey} 
                    className={`
                      hover:bg-gray-50 transition-colors 
                      ${rowHref ? 'cursor-pointer' : ''}
                      ${isSelected ? 'bg-gray-50' : ''}
                    `}
                    onClick={rowHref ? () => router.push(rowHref) : undefined}
                  >
                    {/* Selection Cell */}
                    {selectable && (
                      <td className="w-12 px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <label className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(rowKey)}
                            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/20 cursor-pointer"
                          />
                        </label>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td 
                        key={col.key}
                        className={`
                          px-4 py-4 text-sm
                          ${col.align === 'center' ? 'text-center' : ''}
                          ${col.align === 'left' ? 'text-left' : 'text-right'}
                        `}
                      >
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - show if more than 1 page OR if there's extra content (like per-page selector) */}
      {pagination && (pagination.totalPages > 1 || paginationExtra) && (
        <div className="px-3 sm:px-4 py-3 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
            מציג {((pagination.currentPage - 1) * pagination.perPage) + 1} - {Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems)} מתוך {pagination.totalItems}
          </div>
          
          {/* Extra content in center (e.g., per-page selector) */}
          {paginationExtra && (
            <div className="order-3 sm:order-2">
              {paginationExtra}
            </div>
          )}
          
          {/* Only show navigation buttons if more than 1 page */}
          {pagination.totalPages > 1 ? (
            <div className="flex items-center gap-2 order-1 sm:order-3">
              <PaginationButton
                href={pagination.currentPage > 1 ? `${pathname}?${getPageParams(searchParams, pagination.currentPage - 1)}` : undefined}
                disabled={pagination.currentPage === 1}
              >
                הקודם
              </PaginationButton>
              <span className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-600">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <PaginationButton
                href={pagination.currentPage < pagination.totalPages ? `${pathname}?${getPageParams(searchParams, pagination.currentPage + 1)}` : undefined}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                הבא
              </PaginationButton>
            </div>
          ) : (
            <div className="order-1 sm:order-3" />
          )}
        </div>
      )}
    </div>
  );
}

// Helper: Get page params
function getPageParams(searchParams: URLSearchParams, page: number): string {
  const params = new URLSearchParams(searchParams.toString());
  params.set('page', page.toString());
  return params.toString();
}

// Pagination Button
function PaginationButton({ 
  href, 
  disabled, 
  children 
}: { 
  href?: string; 
  disabled?: boolean; 
  children: React.ReactNode;
}) {
  const baseClasses = "px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-colors";
  
  if (disabled || !href) {
    return (
      <span className={`${baseClasses} border-gray-200 text-gray-400 cursor-not-allowed`}>
        {children}
      </span>
    );
  }

  return (
    <Link 
      href={href}
      className={`${baseClasses} border-gray-200 text-gray-700 hover:bg-gray-100`}
    >
      {children}
    </Link>
  );
}

// ============================================
// Badge Component - סטטוסים
// ============================================

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    error: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
