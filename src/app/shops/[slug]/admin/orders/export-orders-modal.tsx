'use client';

import { useState } from 'react';
import { Download, Calendar, X } from 'lucide-react';

// ============================================
// ExportOrdersModal - Date range picker for CSV export
// ============================================

interface ExportOrdersModalProps {
  storeSlug: string;
  isOpen: boolean;
  onClose: () => void;
}

type PeriodOption = {
  value: string;
  label: string;
  getRange: () => { from: string; to: string };
};

const periodOptions: PeriodOption[] = [
  {
    value: 'today',
    label: 'היום',
    getRange: () => {
      const today = new Date().toISOString().split('T')[0];
      return { from: today, to: today };
    },
  },
  {
    value: 'yesterday',
    label: 'אתמול',
    getRange: () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      return { from: yesterday, to: yesterday };
    },
  },
  {
    value: '7d',
    label: 'השבוע',
    getRange: () => {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      return { from, to };
    },
  },
  {
    value: '30d',
    label: 'החודש',
    getRange: () => {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      return { from, to };
    },
  },
  {
    value: '90d',
    label: '90 יום',
    getRange: () => {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
      return { from, to };
    },
  },
  {
    value: '6m',
    label: 'חצי שנה',
    getRange: () => {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0];
      return { from, to };
    },
  },
  {
    value: '1y',
    label: 'שנה',
    getRange: () => {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0];
      return { from, to };
    },
  },
  {
    value: 'all',
    label: 'הכל',
    getRange: () => {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - 3650 * 86400000).toISOString().split('T')[0];
      return { from, to };
    },
  },
];

export function ExportOrdersModal({ storeSlug, isOpen, onClose }: ExportOrdersModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const isCustom = selectedPeriod === 'custom';
  const canExport = isCustom ? (customFrom && customTo) : true;

  const handleExport = async () => {
    if (!canExport) return;

    setIsExporting(true);

    try {
      // Get date range
      let from: string, to: string;
      
      if (isCustom) {
        from = customFrom;
        to = customTo;
      } else {
        const option = periodOptions.find(o => o.value === selectedPeriod);
        if (!option) return;
        const range = option.getRange();
        from = range.from;
        to = range.to;
      }

      // Build export URL
      const exportUrl = `/api/shops/${storeSlug}/orders/export?from=${from}&to=${to}`;
      
      // Trigger download
      const response = await fetch(exportUrl);
      
      if (!response.ok) {
        const error = await response.text();
        alert(error || 'שגיאה בייצוא ההזמנות');
        return;
      }

      // Get the CSV content
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders_${from}_${to}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error('Export error:', error);
      alert('שגיאה בייצוא ההזמנות');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={() => !isExporting && onClose()}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">ייצוא הזמנות</h3>
              <p className="text-sm text-gray-500">בחר טווח תאריכים לייצוא</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Quick period options */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedPeriod(option.value)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
                  selectedPeriod === option.value
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-sm text-gray-500">או</span>
            </div>
          </div>

          {/* Custom date range */}
          <button
            onClick={() => setSelectedPeriod('custom')}
            className={`w-full px-4 py-3 mb-3 text-sm rounded-lg border transition-colors cursor-pointer flex items-center gap-3 ${
              isCustom
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            תאריך מותאם אישית
          </button>

          {isCustom && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">מתאריך</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    max={customTo || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">עד תאריך</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    min={customFrom}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-black focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            ביטול
          </button>
          <button
            onClick={handleExport}
            disabled={!canExport || isExporting}
            className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                מייצא...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                הורד CSV
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Export button component for the page header
interface ExportOrdersButtonProps {
  storeSlug: string;
}

export function ExportOrdersButton({ storeSlug }: ExportOrdersButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <Download className="w-4 h-4" />
        ייצוא
      </button>
      
      <ExportOrdersModal
        storeSlug={storeSlug}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

