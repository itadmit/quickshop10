'use client';

import { useState, useCallback, useTransition } from 'react';
import { generateCustomReport } from '@/lib/actions/custom-reports';
import { REPORT_COLUMNS, QUICK_REPORTS, type ReportSubject, type ReportParams } from '@/lib/actions/custom-reports-config';

// ============================================
// Report Builder - Client Component
// Minimal JS, fast interactions
// ============================================

interface ReportBuilderProps {
  storeId: string;
  categories: Array<{ id: string; name: string }>;
}

// Subject icons
const SUBJECT_ICONS: Record<ReportSubject, React.ReactNode> = {
  products: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  orders: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
    </svg>
  ),
  customers: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
    </svg>
  ),
  coupons: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <circle cx="9" cy="9" r="2"/>
      <circle cx="15" cy="15" r="2"/>
      <line x1="16" y1="8" x2="8" y2="16"/>
      <rect x="3" y="3" width="18" height="18" rx="2"/>
    </svg>
  ),
  inventory: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    </svg>
  ),
};

const SUBJECT_LABELS: Record<ReportSubject, string> = {
  products: 'מוצרים',
  orders: 'הזמנות',
  customers: 'לקוחות',
  coupons: 'קופונים',
  inventory: 'מלאי',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'ממתין',
  confirmed: 'אושר',
  processing: 'בטיפול',
  shipped: 'נשלח',
  delivered: 'נמסר',
  cancelled: 'בוטל',
  refunded: 'הוחזר',
};

export function ReportBuilder({ storeId, categories }: ReportBuilderProps) {
  const [isPending, startTransition] = useTransition();
  
  // Builder state
  const [subject, setSubject] = useState<ReportSubject | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [limit, setLimit] = useState(100);
  
  // Results state
  const [results, setResults] = useState<{ data: Record<string, unknown>[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle subject change
  const handleSubjectChange = useCallback((newSubject: ReportSubject) => {
    setSubject(newSubject);
    setResults(null);
    setError(null);
    
    // Set default columns
    const columns = REPORT_COLUMNS[newSubject];
    const defaults = Object.entries(columns)
      .filter(([, col]) => col.default)
      .map(([key]) => key);
    setSelectedColumns(defaults);
    
    // Set default sort
    if (newSubject === 'products') setSortBy('quantitySold');
    else if (newSubject === 'orders') setSortBy('createdAt');
    else if (newSubject === 'customers') setSortBy('totalSpent');
    else if (newSubject === 'coupons') setSortBy('usageCount');
    else if (newSubject === 'inventory') setSortBy('inventory');
  }, []);

  // Toggle column
  const toggleColumn = useCallback((col: string) => {
    setSelectedColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  }, []);

  // Load quick report
  const loadQuickReport = useCallback((template: {
    id: string;
    name: string;
    description: string;
    columns: string[];
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    limit?: number;
    filters?: { status?: string; minValue?: number; maxValue?: number };
  }) => {
    setSelectedColumns(template.columns);
    setSortBy(template.sortBy);
    setSortDirection(template.sortDirection);
    if (template.limit) setLimit(template.limit);
    if (template.filters?.status) {
      setStatus(template.filters.status);
    }
    if (template.filters?.minValue !== undefined) {
      setMinValue(String(template.filters.minValue));
    }
    if (template.filters?.maxValue !== undefined) {
      setMaxValue(String(template.filters.maxValue));
    }
  }, []);

  // Generate report
  const handleGenerate = useCallback(() => {
    if (!subject || selectedColumns.length === 0) {
      setError('בחר נושא ועמודות להצגה');
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const params: ReportParams = {
          storeId,
          subject,
          columns: selectedColumns,
          filters: {
            dateFrom,
            dateTo,
            categoryId: categoryId || undefined,
            status: status || undefined,
            minValue: minValue ? Number(minValue) : undefined,
            maxValue: maxValue ? Number(maxValue) : undefined,
          },
          sortBy,
          sortDirection,
          limit,
        };
        
        const result = await generateCustomReport(params);
        setResults(result);
      } catch (err) {
        setError('שגיאה בהפקת הדוח');
        console.error(err);
      }
    });
  }, [subject, selectedColumns, storeId, dateFrom, dateTo, categoryId, status, minValue, maxValue, sortBy, sortDirection, limit]);

  // Export to CSV
  const handleExport = useCallback(() => {
    if (!results || !subject) return;

    const columns = REPORT_COLUMNS[subject] as Record<string, { label: string; default: boolean }>;
    const headers = selectedColumns.map(col => columns[col]?.label || col);
    
    const rows = results.data.map(row => 
      selectedColumns.map(col => {
        const value = row[col];
        if (value === null || value === undefined) return '';
        if (value instanceof Date) return value.toLocaleDateString('he-IL');
        const str = String(value);
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    );

    const csv = `\uFEFF${headers.join(',')}\n${rows.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${SUBJECT_LABELS[subject]}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [results, subject, selectedColumns]);

  return (
    <div className="space-y-6">
      {/* Step 1: Subject Selection */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="font-medium mb-4">שלב 1: בחר נושא</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(Object.keys(SUBJECT_LABELS) as ReportSubject[]).map(s => (
            <button
              key={s}
              onClick={() => handleSubjectChange(s)}
              className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-all ${
                subject === s
                  ? 'border-black bg-gray-50 ring-1 ring-black'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className={subject === s ? 'text-black' : 'text-gray-500'}>
                {SUBJECT_ICONS[s]}
              </span>
              <span className={`text-sm font-medium ${subject === s ? 'text-black' : 'text-gray-600'}`}>
                {SUBJECT_LABELS[s]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {subject && (
        <>
          {/* Quick Reports */}
          {QUICK_REPORTS[subject]?.length > 0 && (
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="font-medium mb-4">⚡ דוחות מהירים</h2>
              <div className="flex flex-wrap gap-2">
                {QUICK_REPORTS[subject].map(template => (
                  <button
                    key={template.id}
                    onClick={() => loadQuickReport(template)}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <span className="font-medium">{template.name}</span>
                    <span className="text-gray-500">- {template.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Columns */}
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="font-medium mb-4">שלב 2: בחר עמודות להצגה</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(REPORT_COLUMNS[subject]).map(([key, col]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(key)}
                    onChange={() => toggleColumn(key)}
                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm">{col.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Step 3: Filters */}
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="font-medium mb-4">שלב 3: סינון (אופציונלי)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מתאריך</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">עד תאריך</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
                />
              </div>
              
              {/* Category filter for products */}
              {subject === 'products' && categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
                  >
                    <option value="">כל הקטגוריות</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status filter for orders */}
              {subject === 'orders' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
                  >
                    <option value="">כל הסטטוסים</option>
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Value range */}
              {(subject === 'customers' || subject === 'orders' || subject === 'inventory') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {subject === 'inventory' ? 'מלאי מינימום' : 'ערך מינימום'}
                    </label>
                    <input
                      type="number"
                      value={minValue}
                      onChange={e => setMinValue(e.target.value)}
                      placeholder={subject === 'inventory' ? '0' : '₪0'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {subject === 'inventory' ? 'מלאי מקסימום' : 'ערך מקסימום'}
                    </label>
                    <input
                      type="number"
                      value={maxValue}
                      onChange={e => setMaxValue(e.target.value)}
                      placeholder={subject === 'inventory' ? '100' : '₪10,000'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Step 4: Sort */}
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="font-medium mb-4">שלב 4: מיון</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מיין לפי</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
                >
                  {selectedColumns.map(col => {
                    const columns = REPORT_COLUMNS[subject] as Record<string, { label: string; default: boolean }>;
                    return (
                      <option key={col} value={col}>
                        {columns[col]?.label || col}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">כיוון</label>
                <select
                  value={sortDirection}
                  onChange={e => setSortDirection(e.target.value as 'asc' | 'desc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
                >
                  <option value="desc">יורד (הכי גבוה)</option>
                  <option value="asc">עולה (הכי נמוך)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מקסימום שורות</label>
                <select
                  value={limit}
                  onChange={e => setLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                </select>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={isPending || selectedColumns.length === 0}
              className="flex items-center gap-3 px-8 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  מעבד...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  הצג דוח חכם
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">
              {error}
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium">
                  תוצאות ({results.total} שורות)
                </h2>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  ייצוא CSV
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-right">
                      {selectedColumns.map(col => {
                        const columns = REPORT_COLUMNS[subject] as Record<string, { label: string; default: boolean }>;
                        return (
                          <th key={col} className="py-3 px-4 font-medium text-gray-500">
                            {columns[col]?.label || col}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.data.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {selectedColumns.map(col => (
                          <td key={col} className="py-3 px-4">
                            {formatCellValue(row[col], col)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Format cell value for display
function formatCellValue(value: unknown, column: string): string {
  if (value === null || value === undefined) return '—';
  
  // Date columns
  if (column.includes('At') || column.includes('Date')) {
    const date = new Date(value as string);
    return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('he-IL');
  }
  
  // Currency columns
  if (['price', 'comparePrice', 'cost', 'profit', 'total', 'subtotal', 'revenue', 'totalSpent', 'avgOrderValue', 'discountAmount', 'shippingAmount', 'totalDiscount', 'inventoryValue'].includes(column)) {
    const num = Number(value);
    return isNaN(num) ? String(value) : `₪${num.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  // Percentage columns
  if (column === 'profitMargin') {
    return String(value);
  }
  
  // Number columns
  if (['quantitySold', 'inventory', 'totalOrders', 'usageCount', 'itemCount'].includes(column)) {
    const num = Number(value);
    return isNaN(num) ? String(value) : num.toLocaleString('he-IL');
  }

  // Status columns
  if (column === 'status' || column === 'financialStatus') {
    const statusMap: Record<string, string> = {
      pending: 'ממתין',
      confirmed: 'אושר',
      processing: 'בטיפול',
      shipped: 'נשלח',
      delivered: 'נמסר',
      cancelled: 'בוטל',
      refunded: 'הוחזר',
      paid: 'שולם',
      partially_paid: 'שולם חלקית',
    };
    return statusMap[String(value)] || String(value);
  }

  // Boolean columns
  if (column === 'isActive') {
    return value ? 'פעיל' : 'לא פעיל';
  }

  // Device type
  if (column === 'deviceType') {
    const deviceMap: Record<string, string> = {
      mobile: 'מובייל',
      desktop: 'מחשב',
      tablet: 'טאבלט',
    };
    return deviceMap[String(value)] || String(value);
  }

  // Discount type
  if (column === 'type') {
    const typeMap: Record<string, string> = {
      percentage: 'אחוז',
      fixed_amount: 'סכום קבוע',
      free_shipping: 'משלוח חינם',
    };
    return typeMap[String(value)] || String(value);
  }

  return String(value);
}

