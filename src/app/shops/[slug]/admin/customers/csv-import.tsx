'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { importCustomersFromCSV } from './actions';

interface CSVImportProps {
  storeId: string;
}

type ImportResult = {
  success: boolean;
  imported?: number;
  skipped?: number;
  errors?: string[];
  error?: string;
};

export function CSVImport({ storeId }: CSVImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<Array<Record<string, string>>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const parseCSV = (text: string): Array<Record<string, string>> => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows: Array<Record<string, string>> = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }
    
    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setPreview(parsed.slice(0, 5)); // Show first 5 rows as preview
      setResult(null);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      
      startTransition(async () => {
        const importResult = await importCustomersFromCSV(storeId, parsed);
        setResult(importResult);
        if (importResult.success) {
          router.refresh();
        }
      });
    };
    reader.readAsText(file);
  };

  const resetModal = () => {
    setIsOpen(false);
    setPreview([]);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        ייבוא CSV
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-scroll text-right">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">ייבוא לקוחות מ-CSV</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Instructions */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-2">פורמט הקובץ:</p>
                <p className="mb-2">הקובץ צריך להכיל שורת כותרות עם העמודות הבאות:</p>
                <code className="bg-gray-200 px-2 py-1 rounded text-xs" dir="ltr">
                  email,first_name,last_name,phone,tags
                </code>
                <p className="mt-2 text-gray-500">
                  * עמודת email היא חובה. שאר העמודות אופציונליות.
                </p>
              </div>

              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  בחר קובץ CSV
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-900 file:text-white hover:file:bg-gray-800"
                />
              </div>

              {/* Preview */}
              {preview.length > 0 && !result && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    תצוגה מקדימה (5 שורות ראשונות):
                  </p>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(preview[0]).map(key => (
                            <th key={key} className="px-3 py-2 text-right font-medium text-gray-700">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="px-3 py-2 text-gray-600">
                                {val || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Result */}
              {result && (
                <div className={`rounded-lg p-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {result.success ? (
                    <>
                      <p className="font-medium text-green-800 mb-1">✓ הייבוא הושלם בהצלחה!</p>
                      <p className="text-sm text-green-700">
                        {result.imported} לקוחות יובאו
                        {result.skipped ? `, ${result.skipped} דילגו (כבר קיימים)` : ''}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-red-800 mb-1">✕ שגיאה בייבוא</p>
                      <p className="text-sm text-red-700">{result.error}</p>
                      {result.errors && result.errors.length > 0 && (
                        <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                          {result.errors.slice(0, 5).map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                          {result.errors.length > 5 && (
                            <li>... ועוד {result.errors.length - 5} שגיאות</li>
                          )}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {preview.length > 0 && !result && (
                  <button
                    onClick={handleImport}
                    disabled={isPending}
                    className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {isPending ? 'מייבא...' : 'התחל ייבוא'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={resetModal}
                  className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {result ? 'סגור' : 'ביטול'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

