'use client';

import { useState, useEffect } from 'react';

interface ExportButtonProps {
  storeSlug: string;
  currentType?: string;
}

interface FilterOptions {
  tags: string[];
  sources: string[];
}

export function ExportButton({ storeSlug, currentType }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedType, setSelectedType] = useState<string>(currentType || 'all');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ tags: [], sources: [] });
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);

  // Load filter options when type changes
  useEffect(() => {
    if (isOpen && selectedType && selectedType !== 'all' && selectedType !== 'customer') {
      loadFilterOptions(selectedType);
    }
  }, [isOpen, selectedType]);

  const loadFilterOptions = async (type: string) => {
    setIsLoadingFilters(true);
    try {
      const response = await fetch(`/api/shops/${storeSlug}/contacts/filters?type=${type}`);
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data);
      }
    } catch (error) {
      console.error('Failed to load filters:', error);
    } finally {
      setIsLoadingFilters(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const params = new URLSearchParams();
      if (selectedType !== 'all') {
        params.set('type', selectedType);
      }
      if (selectedTag) {
        params.set('tag', selectedTag);
      }
      if (selectedSource) {
        params.set('source', selectedSource);
      }

      const response = await fetch(`/api/shops/${storeSlug}/contacts/export?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Export failed:', errorData);
        throw new Error(errorData.error || 'Export failed');
      }

      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `contacts.csv`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('שגיאה בייצוא');
    } finally {
      setIsExporting(false);
    }
  };

  const exportTypes = [
    { id: 'all', label: 'הכל' },
    { id: 'customer', label: 'לקוחות' },
    { id: 'newsletter', label: 'ניוזלטר' },
    { id: 'club_member', label: 'מועדון' },
    { id: 'contact_form', label: 'יצירת קשר' },
    { id: 'popup_form', label: 'פופאפ' },
  ];

  const sourceLabels: Record<string, string> = {
    checkout: 'צ׳קאאוט',
    contact_page: 'עמוד יצירת קשר',
    registration: 'הרשמה',
    popup: 'פופאפ',
    newsletter: 'ניוזלטר',
    import: 'יבוא',
    manual: 'ידני',
    api: 'API',
    homepage: 'עמוד הבית',
    product_page: 'עמוד מוצר',
    category_page: 'עמוד קטגוריה',
    cart: 'עגלה',
    account: 'אזור אישי',
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setSelectedTag('');
    setSelectedSource('');
    setFilterOptions({ tags: [], sources: [] });
  };

  const showFilters = selectedType && selectedType !== 'all' && selectedType !== 'customer';

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        ייצוא CSV
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-[100] transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">ייצוא אנשי קשר</h3>
                  <p className="text-sm text-gray-500 mt-0.5">בחר את הנתונים לייצוא</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              {/* Content */}
              <div className="px-6 py-4 space-y-5 overflow-y-auto max-h-[60vh]">
                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    סוג אנשי קשר
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {exportTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleTypeChange(type.id)}
                        className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all ${
                          selectedType === type.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filters - only show for relevant types */}
                {showFilters && (
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      סינון נוסף (אופציונלי)
                    </p>
                    
                    {isLoadingFilters ? (
                      <div className="flex items-center justify-center py-4">
                        <svg className="w-5 h-5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                      </div>
                    ) : (
                      <>
                        {/* Tag Filter */}
                        {filterOptions.tags.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              תגית
                            </label>
                            <select
                              value={selectedTag}
                              onChange={(e) => setSelectedTag(e.target.value)}
                              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                              <option value="">כל התגיות</option>
                              {filterOptions.tags.map((tag) => (
                                <option key={tag} value={tag}>{tag}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        
                        {/* Source Filter */}
                        {filterOptions.sources.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              מקור הגעה
                            </label>
                            <select
                              value={selectedSource}
                              onChange={(e) => setSelectedSource(e.target.value)}
                              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                              <option value="">כל המקורות</option>
                              {filterOptions.sources.map((source) => (
                                <option key={source} value={source}>
                                  {sourceLabels[source] || source}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {filterOptions.tags.length === 0 && filterOptions.sources.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-2">
                            אין אפשרויות סינון נוספות
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      מייצא...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      ייצוא CSV
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
