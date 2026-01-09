'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

// ============================================
// OrderFilters - Advanced Filters like Shopify
// Server-side filtering for speed (REQUIREMENTS.md)
// ============================================

interface FilterOption {
  value: string;
  label: string;
}

interface OrderFiltersProps {
  categories: FilterOption[];
  couponCodes: string[];
  shippingMethods: string[];
  paymentMethods: string[];
  cities: string[];
}

// Filter definitions
const FINANCIAL_STATUS_OPTIONS = [
  { value: 'pending', label: 'ממתין לתשלום' },
  { value: 'paid', label: 'שולם' },
  { value: 'refunded', label: 'הוחזר' },
  { value: 'partially_refunded', label: 'הוחזר חלקית' },
];

const FULFILLMENT_STATUS_OPTIONS = [
  { value: 'unfulfilled', label: 'לא נשלח' },
  { value: 'partial', label: 'נשלח חלקית' },
  { value: 'fulfilled', label: 'נשלח' },
];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  'credit_card': 'כרטיס אשראי',
  'cash': 'מזומן',
  'bank_transfer': 'העברה בנקאית',
  'bit': 'ביט',
  'paypal': 'פייפאל',
};

export function OrderFilters({ 
  categories, 
  couponCodes, 
  shippingMethods, 
  paymentMethods, 
  cities 
}: OrderFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get current filter values from URL
  const currentFilters = {
    itemCountMin: searchParams.get('itemCountMin') || '',
    itemCountMax: searchParams.get('itemCountMax') || '',
    categoryId: searchParams.get('categoryId') || '',
    couponCode: searchParams.get('couponCode') || '',
    totalMin: searchParams.get('totalMin') || '',
    totalMax: searchParams.get('totalMax') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    shippingMethod: searchParams.get('shippingMethod') || '',
    paymentMethod: searchParams.get('paymentMethod') || '',
    city: searchParams.get('city') || '',
    financialStatus: searchParams.get('financialStatus') || '',
    fulfillmentStatus: searchParams.get('fulfillmentStatus') || '',
  };
  
  // Count active filters
  const activeFilterCount = Object.values(currentFilters).filter(v => v).length;
  
  // Dropdown states
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  
  // Range filter states
  const [itemCountMin, setItemCountMin] = useState(currentFilters.itemCountMin);
  const [itemCountMax, setItemCountMax] = useState(currentFilters.itemCountMax);
  const [totalMin, setTotalMin] = useState(currentFilters.totalMin);
  const [totalMax, setTotalMax] = useState(currentFilters.totalMax);
  const [dateFrom, setDateFrom] = useState(currentFilters.dateFrom);
  const [dateTo, setDateTo] = useState(currentFilters.dateTo);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Update URL with new filter
  const applyFilter = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
    setOpenFilter(null);
    setSearchText('');
  }, [router, pathname, searchParams]);
  
  // Apply range filter
  const applyRangeFilter = (minKey: string, maxKey: string, minValue: string, maxValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (minValue) params.set(minKey, minValue);
    else params.delete(minKey);
    
    if (maxValue) params.set(maxKey, maxValue);
    else params.delete(maxKey);
    
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
    setOpenFilter(null);
  };
  
  // Clear specific filter
  const clearFilter = (key: string, additionalKey?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    if (additionalKey) params.delete(additionalKey);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
    setOpenFilter(null);
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    Object.keys(currentFilters).forEach(key => params.delete(key));
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Get label for active filter
  const getFilterLabel = (key: string): string => {
    switch (key) {
      case 'itemCountMin':
      case 'itemCountMax':
        if (currentFilters.itemCountMin && currentFilters.itemCountMax) {
          return `${currentFilters.itemCountMin}-${currentFilters.itemCountMax} פריטים`;
        }
        return currentFilters.itemCountMin ? `מעל ${currentFilters.itemCountMin}` : `עד ${currentFilters.itemCountMax}`;
      case 'totalMin':
      case 'totalMax':
        if (currentFilters.totalMin && currentFilters.totalMax) {
          return `₪${currentFilters.totalMin}-${currentFilters.totalMax}`;
        }
        return currentFilters.totalMin ? `מעל ₪${currentFilters.totalMin}` : `עד ₪${currentFilters.totalMax}`;
      case 'dateFrom':
      case 'dateTo':
        if (currentFilters.dateFrom && currentFilters.dateTo) {
          return `${currentFilters.dateFrom} - ${currentFilters.dateTo}`;
        }
        return currentFilters.dateFrom ? `מ-${currentFilters.dateFrom}` : `עד ${currentFilters.dateTo}`;
      case 'categoryId':
        return categories.find(c => c.value === currentFilters.categoryId)?.label || 'קטגוריה';
      case 'financialStatus':
        return FINANCIAL_STATUS_OPTIONS.find(s => s.value === currentFilters.financialStatus)?.label || 'תשלום';
      case 'fulfillmentStatus':
        return FULFILLMENT_STATUS_OPTIONS.find(s => s.value === currentFilters.fulfillmentStatus)?.label || 'משלוח';
      case 'paymentMethod':
        return PAYMENT_METHOD_LABELS[currentFilters.paymentMethod] || currentFilters.paymentMethod;
      case 'shippingMethod':
        return currentFilters.shippingMethod;
      case 'city':
        return currentFilters.city;
      case 'couponCode':
        return currentFilters.couponCode;
      default:
        return '';
    }
  };

  // Render dropdown content based on filter type
  const renderDropdown = () => {
    if (!openFilter) return null;
    
    switch (openFilter) {
      case 'menu':
        return (
          <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-80 overflow-y-auto">
            <div className="px-3 py-2 border-b border-gray-100">
              <input
                type="text"
                placeholder="חיפוש פילטר..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {[
              { id: 'financialStatus', label: 'סטטוס תשלום', show: true },
              { id: 'fulfillmentStatus', label: 'סטטוס משלוח', show: true },
              { id: 'itemCount', label: 'מספר פריטים', show: true },
              { id: 'total', label: 'סכום הזמנה', show: true },
              { id: 'date', label: 'תאריך', show: true },
              { id: 'shippingMethod', label: 'שיטת משלוח', show: shippingMethods.length > 0 },
              { id: 'paymentMethod', label: 'אמצעי תשלום', show: paymentMethods.length > 0 },
              { id: 'city', label: 'יעד (עיר)', show: cities.length > 0 },
              { id: 'category', label: 'קטגוריה', show: categories.length > 0 },
              { id: 'coupon', label: 'קופון', show: couponCodes.length > 0 },
            ]
              .filter(f => f.show && f.label.includes(searchText))
              .map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setOpenFilter(filter.id)}
                  className="w-full px-4 py-2 text-sm text-right text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  {filter.label}
                </button>
              ))}
          </div>
        );
      
      case 'financialStatus':
        return (
          <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            {FINANCIAL_STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => applyFilter('financialStatus', opt.value)}
                className={`w-full px-4 py-2 text-sm text-right hover:bg-gray-50 cursor-pointer ${
                  currentFilters.financialStatus === opt.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        );
        
      case 'fulfillmentStatus':
        return (
          <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            {FULFILLMENT_STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => applyFilter('fulfillmentStatus', opt.value)}
                className={`w-full px-4 py-2 text-sm text-right hover:bg-gray-50 cursor-pointer ${
                  currentFilters.fulfillmentStatus === opt.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        );
      
      case 'itemCount':
        return (
          <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
            <p className="text-sm text-gray-600 mb-3">טווח פריטים:</p>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="number"
                min="0"
                placeholder="מ-"
                value={itemCountMin}
                onChange={(e) => setItemCountMin(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                min="0"
                placeholder="עד"
                value={itemCountMax}
                onChange={(e) => setItemCountMax(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-between">
              <button onClick={() => { setItemCountMin(''); setItemCountMax(''); clearFilter('itemCountMin', 'itemCountMax'); }} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">נקה</button>
              <button onClick={() => applyRangeFilter('itemCountMin', 'itemCountMax', itemCountMin, itemCountMax)} className="px-4 py-1.5 text-sm bg-black text-white rounded-lg hover:bg-gray-800 cursor-pointer">החל</button>
            </div>
          </div>
        );
        
      case 'total':
        return (
          <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
            <p className="text-sm text-gray-600 mb-3">סכום הזמנה (₪):</p>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="number"
                min="0"
                placeholder="מ-"
                value={totalMin}
                onChange={(e) => setTotalMin(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                min="0"
                placeholder="עד"
                value={totalMax}
                onChange={(e) => setTotalMax(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-between">
              <button onClick={() => { setTotalMin(''); setTotalMax(''); clearFilter('totalMin', 'totalMax'); }} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">נקה</button>
              <button onClick={() => applyRangeFilter('totalMin', 'totalMax', totalMin, totalMax)} className="px-4 py-1.5 text-sm bg-black text-white rounded-lg hover:bg-gray-800 cursor-pointer">החל</button>
            </div>
          </div>
        );
        
      case 'date':
        return (
          <div className="absolute top-full right-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
            <p className="text-sm text-gray-600 mb-3">טווח תאריכים:</p>
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 w-8">מ-</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 w-8">עד</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => { setDateFrom(''); setDateTo(''); clearFilter('dateFrom', 'dateTo'); }} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">נקה</button>
              <button onClick={() => applyRangeFilter('dateFrom', 'dateTo', dateFrom, dateTo)} className="px-4 py-1.5 text-sm bg-black text-white rounded-lg hover:bg-gray-800 cursor-pointer">החל</button>
            </div>
          </div>
        );
        
      case 'shippingMethod':
        return (
          <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-48 overflow-y-auto">
            {shippingMethods.map(method => (
              <button
                key={method}
                onClick={() => applyFilter('shippingMethod', method)}
                className={`w-full px-4 py-2 text-sm text-right hover:bg-gray-50 cursor-pointer ${
                  currentFilters.shippingMethod === method ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        );
        
      case 'paymentMethod':
        return (
          <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            {paymentMethods.map(method => (
              <button
                key={method}
                onClick={() => applyFilter('paymentMethod', method)}
                className={`w-full px-4 py-2 text-sm text-right hover:bg-gray-50 cursor-pointer ${
                  currentFilters.paymentMethod === method ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                {PAYMENT_METHOD_LABELS[method] || method}
              </button>
            ))}
          </div>
        );
        
      case 'city':
        return (
          <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                placeholder="חיפוש עיר..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {cities.filter(c => c.includes(searchText)).map(c => (
                <button
                  key={c}
                  onClick={() => applyFilter('city', c)}
                  className={`w-full px-4 py-2 text-sm text-right hover:bg-gray-50 cursor-pointer ${
                    currentFilters.city === c ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        );
        
      case 'category':
        return (
          <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                placeholder="חיפוש קטגוריה..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {categories.filter(c => c.label.includes(searchText)).map(cat => (
                <button
                  key={cat.value}
                  onClick={() => applyFilter('categoryId', cat.value)}
                  className={`w-full px-4 py-2 text-sm text-right hover:bg-gray-50 cursor-pointer ${
                    currentFilters.categoryId === cat.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        );
        
      case 'coupon':
        return (
          <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                placeholder="חיפוש קופון..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {couponCodes.filter(c => c.toLowerCase().includes(searchText.toLowerCase())).map(code => (
                <button
                  key={code}
                  onClick={() => applyFilter('couponCode', code)}
                  className={`w-full px-4 py-2 text-sm text-right hover:bg-gray-50 cursor-pointer ${
                    currentFilters.couponCode === code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Get active filter chips to display
  const getActiveFilters = (): Array<{ key: string; label: string; clearKey: string; additionalClearKey?: string }> => {
    const filters = [];
    
    if (currentFilters.financialStatus) {
      filters.push({ key: 'financialStatus', label: getFilterLabel('financialStatus'), clearKey: 'financialStatus' });
    }
    if (currentFilters.fulfillmentStatus) {
      filters.push({ key: 'fulfillmentStatus', label: getFilterLabel('fulfillmentStatus'), clearKey: 'fulfillmentStatus' });
    }
    if (currentFilters.itemCountMin || currentFilters.itemCountMax) {
      filters.push({ key: 'itemCount', label: getFilterLabel('itemCountMin'), clearKey: 'itemCountMin', additionalClearKey: 'itemCountMax' });
    }
    if (currentFilters.totalMin || currentFilters.totalMax) {
      filters.push({ key: 'total', label: getFilterLabel('totalMin'), clearKey: 'totalMin', additionalClearKey: 'totalMax' });
    }
    if (currentFilters.dateFrom || currentFilters.dateTo) {
      filters.push({ key: 'date', label: getFilterLabel('dateFrom'), clearKey: 'dateFrom', additionalClearKey: 'dateTo' });
    }
    if (currentFilters.shippingMethod) {
      filters.push({ key: 'shippingMethod', label: getFilterLabel('shippingMethod'), clearKey: 'shippingMethod' });
    }
    if (currentFilters.paymentMethod) {
      filters.push({ key: 'paymentMethod', label: getFilterLabel('paymentMethod'), clearKey: 'paymentMethod' });
    }
    if (currentFilters.city) {
      filters.push({ key: 'city', label: getFilterLabel('city'), clearKey: 'city' });
    }
    if (currentFilters.categoryId) {
      filters.push({ key: 'category', label: getFilterLabel('categoryId'), clearKey: 'categoryId' });
    }
    if (currentFilters.couponCode) {
      filters.push({ key: 'coupon', label: getFilterLabel('couponCode'), clearKey: 'couponCode' });
    }
    
    return filters;
  };

  const activeFilters = getActiveFilters();

  return (
    <div className="relative flex flex-wrap items-center gap-2" ref={containerRef}>
      {/* Add Filter Button */}
      <div className="relative">
        <button
          onClick={() => setOpenFilter(openFilter === 'menu' ? null : 'menu')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>הוסף פילטר</span>
        </button>
        
        {renderDropdown()}
      </div>
      
      {/* Active filter chips */}
      {activeFilters.map(filter => (
        <button
          key={filter.key}
          onClick={() => setOpenFilter(openFilter === filter.key ? null : filter.key)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-blue-50 border border-blue-200 text-blue-700 cursor-pointer"
        >
          <span>{filter.label}</span>
          <span 
            onClick={(e) => { e.stopPropagation(); clearFilter(filter.clearKey, filter.additionalClearKey); }}
            className="hover:text-blue-900 font-bold"
          >
            ×
          </span>
        </button>
      ))}
      
      {/* Clear all button */}
      {activeFilterCount > 1 && (
        <button
          onClick={clearAllFilters}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        >
          נקה הכל
        </button>
      )}
    </div>
  );
}
