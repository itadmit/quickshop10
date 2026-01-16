'use client';

/**
 * Product Import Form with Column Mapping
 * 
 * שלבים:
 * 1. בחירת קובץ CSV
 * 2. מיפוי עמודות (המשתמש בוחר איזו עמודה מתאימה לאיזה שדה)
 * 3. הגדרות נוספות (קידומת תמונות, מצב בדיקה)
 * 4. ייבוא
 */

import { useState, useTransition, useCallback } from 'react';
import { Upload, FileText, Loader2, CheckCircle, XCircle, AlertTriangle, ArrowLeft, ArrowRight, Settings2 } from 'lucide-react';
import { ImportResult } from './actions';
import { ImportProgressModal } from './import-progress-modal';

interface Props {
  storeId: string;
  storeSlug: string;
}

// שדות חובה ואופציונליים לייבוא
const IMPORT_FIELDS = [
  { key: 'name', label: 'שם מוצר', required: true },
  { key: 'description', label: 'תיאור', required: false },
  { key: 'price', label: 'מחיר', required: true },
  { key: 'comparePrice', label: 'מחיר להשוואה (מבצע)', required: false },
  { key: 'sku', label: 'מק"ט / ברקוד', required: false },
  { key: 'inventory', label: 'כמות במלאי', required: false },
  { key: 'categories', label: 'קטגוריות', required: false },
  { key: 'images', label: 'תמונות', required: false },
] as const;

type FieldKey = typeof IMPORT_FIELDS[number]['key'];
type ColumnMapping = Record<FieldKey, number>;

export function ProductImportForm({ storeId, storeSlug }: Props) {
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<'upload' | 'mapping' | 'import'>('upload');
  
  // Step 1: File
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState('');
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  
  // Step 2: Column Mapping
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: -1,
    description: -1,
    price: -1,
    comparePrice: -1,
    sku: -1,
    inventory: -1,
    categories: -1,
    images: -1,
  });
  
  // Step 3: Settings
  const [imagePrefix, setImagePrefix] = useState('');
  const [testMode, setTestMode] = useState(true);
  const [updateMode, setUpdateMode] = useState(false);
  const [updateKey, setUpdateKey] = useState<'sku' | 'name'>('sku');
  
  // Modal
  const [showProgressModal, setShowProgressModal] = useState(false);
  
  // Result
  const [result, setResult] = useState<ImportResult | null>(null);

  /**
   * Full CSV Parser - handles:
   * - Multi-line fields (newlines inside quotes)
   * - Escaped quotes ("")
   * - Hebrew text
   * - Empty fields
   */
  const parseCSV = (csvText: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    // Remove BOM if present
    const text = csvText.replace(/^\uFEFF/, '');
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            // Escaped quote "" -> add single "
            currentField += '"';
            i++; // Skip next quote
          } else {
            // End of quoted field
            inQuotes = false;
          }
        } else {
          // Any char inside quotes (including newlines)
          currentField += char;
        }
      } else {
        // Not in quotes
        if (char === '"') {
          // Start of quoted field
          inQuotes = true;
        } else if (char === ',') {
          // Field separator
          currentRow.push(currentField);
          currentField = '';
        } else if (char === '\n' || char === '\r') {
          // Row separator
          currentRow.push(currentField);
          if (currentRow.length > 0 && currentRow.some(f => f.trim())) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = '';
          // Skip \r\n combo
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
        } else {
          currentField += char;
        }
      }
    }
    
    // Don't forget last field and row
    currentRow.push(currentField);
    if (currentRow.length > 0 && currentRow.some(f => f.trim())) {
      rows.push(currentRow);
    }
    
    return rows;
  };

  // Parse CSV and get header + preview rows
  const parseCSVPreview = (text: string) => {
    const allRows = parseCSV(text);
    
    if (allRows.length < 1) {
      return { columns: [], preview: [] };
    }
    
    const columns = allRows[0];
    const preview = allRows.slice(1, 4); // First 3 data rows
    
    console.log('CSV Parsed:', { 
      totalRows: allRows.length, 
      columns: columns.length, 
      columnsPreview: columns,
      firstRowPreview: preview[0]?.slice(0, 5)
    });
    
    return { columns, preview };
  };

  // Keep for backward compatibility (used in auto-detect)
  const parseCSVLine = (line: string): string[] => {
    const rows = parseCSV(line + '\n');
    return rows[0] || [];
  };

  // Auto-detect columns based on common names
  const autoDetectMapping = (columns: string[]): ColumnMapping => {
    const newMapping: ColumnMapping = {
      name: -1,
      description: -1,
      price: -1,
      comparePrice: -1,
      sku: -1,
      inventory: -1,
      categories: -1,
      images: -1,
    };

    columns.forEach((col, index) => {
      const colLower = col.toLowerCase().trim();
      
      // שם מוצר
      if (colLower.includes('שם מוצר') || colLower === 'name' || colLower === 'title') {
        if (newMapping.name === -1) newMapping.name = index;
      }
      // תיאור
      else if (colLower.includes('תיאור') || colLower === 'description') {
        if (newMapping.description === -1) newMapping.description = index;
      }
      // מחיר רגיל (לא מבצע)
      else if ((colLower.includes('מחיר') && colLower.includes('רגיל')) || colLower === 'price') {
        if (newMapping.price === -1) newMapping.price = index;
      }
      // מחיר מבצע / השוואה
      else if (colLower.includes('מבצע') || colLower.includes('השוואה') || colLower === 'compare price' || colLower === 'sale price') {
        if (newMapping.comparePrice === -1) newMapping.comparePrice = index;
      }
      // מק"ט / ברקוד
      else if (colLower.includes('מק') || colLower.includes('ברקוד') || colLower === 'sku' || colLower === 'barcode') {
        if (newMapping.sku === -1) newMapping.sku = index;
      }
      // מלאי
      else if (colLower.includes('מלאי') || colLower.includes('כמות') || colLower === 'inventory' || colLower === 'stock') {
        if (newMapping.inventory === -1) newMapping.inventory = index;
      }
      // קטגוריות
      else if (colLower.includes('קטגור') || colLower === 'categories' || colLower === 'category') {
        if (newMapping.categories === -1) newMapping.categories = index;
      }
      // תמונות
      else if (colLower.includes('תמונ') || colLower === 'images' || colLower === 'image') {
        if (newMapping.images === -1) newMapping.images = index;
      }
    });

    return newMapping;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setResult(null);
    
    const text = await selectedFile.text();
    setCsvText(text);
    
    const { columns, preview } = parseCSVPreview(text);
    setCsvColumns(columns);
    setCsvPreview(preview);
    
    // Auto-detect mapping
    const autoMapping = autoDetectMapping(columns);
    setMapping(autoMapping);
    
    // Move to mapping step
    setStep('mapping');
  };

  const handleMappingChange = (field: FieldKey, columnIndex: number) => {
    setMapping(prev => ({ ...prev, [field]: columnIndex }));
  };

  const isMappingValid = () => {
    // Check required fields
    return mapping.name >= 0 && mapping.price >= 0;
  };

  const handleSubmit = async () => {
    if (!csvText || !isMappingValid()) return;
    setShowProgressModal(true);
  };

  const handleImportComplete = useCallback((importResult: ImportResult) => {
    setResult(importResult);
  }, []);

  // Legacy submit handler (kept for reference)
  const handleLegacySubmit = async () => {
    if (!csvText || !isMappingValid()) return;

    startTransition(async () => {
      try {
        // This is now handled by the modal via SSE API
        console.log('Legacy submit - not used');
      } catch (error) {
        console.error('Import error:', error);
        setResult({
          success: false,
          imported: 0,
          failed: 0,
          errors: [error instanceof Error ? error.message : 'שגיאה בייבוא'],
          createdCategories: [],
        });
      }
    });
  };

  const resetForm = () => {
    setStep('upload');
    setFile(null);
    setCsvText('');
    setCsvColumns([]);
    setCsvPreview([]);
    setResult(null);
    setMapping({
      name: -1,
      description: -1,
      price: -1,
      comparePrice: -1,
      sku: -1,
      inventory: -1,
      categories: -1,
      images: -1,
    });
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${step === 'upload' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold">1</span>
          קובץ
        </div>
        <ArrowLeft className="w-4 h-4 text-gray-300" />
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${step === 'mapping' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold">2</span>
          מיפוי עמודות
        </div>
        <ArrowLeft className="w-4 h-4 text-gray-300" />
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${step === 'import' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold">3</span>
          ייבוא
        </div>
      </div>

      {/* Step 1: File Upload */}
      {step === 'upload' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-lg mb-4">בחר קובץ CSV</h3>
          
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all">
            <div className="text-center">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">לחץ לבחירת קובץ CSV</p>
              <p className="text-xs text-gray-400 mt-1">או גרור קובץ לכאן</p>
            </div>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'mapping' && (
        <div className="space-y-4">
          {/* File Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <FileText className="w-8 h-8 text-green-500" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{file?.name}</p>
              <p className="text-sm text-gray-500">{csvColumns.length} עמודות • {csvPreview.length} שורות לתצוגה מקדימה</p>
            </div>
            <button
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              החלף קובץ
            </button>
          </div>

          {/* Column Mapping */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              מיפוי עמודות
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              בחר איזו עמודה בקובץ מתאימה לכל שדה. שדות עם * הם חובה.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {IMPORT_FIELDS.map(field => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 mr-1">*</span>}
                  </label>
                  <select
                    value={mapping[field.key]}
                    onChange={(e) => handleMappingChange(field.key, parseInt(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                      field.required && mapping[field.key] === -1 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <option value={-1}>-- לא נבחר --</option>
                    {csvColumns.map((col, index) => (
                      <option key={index} value={index}>
                        [{index}] {col}
                      </option>
                    ))}
                  </select>
                  
                  {/* Preview value */}
                  {mapping[field.key] >= 0 && csvPreview[0] && (
                    <p className="text-xs text-gray-500 truncate">
                      דוגמה: {csvPreview[0][mapping[field.key]] || '(ריק)'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview Table */}
          {csvPreview.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
              <h4 className="font-medium text-gray-700 mb-3">תצוגה מקדימה (3 שורות ראשונות)</h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 py-1.5 text-right font-medium text-gray-600">#</th>
                    {csvColumns.map((col, i) => (
                      <th key={i} className="px-2 py-1.5 text-right font-medium text-gray-600 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-gray-100">
                      <td className="px-2 py-1.5 text-gray-400">{rowIndex + 1}</td>
                      {row.map((cell, cellIndex) => (
                        <td 
                          key={cellIndex} 
                          className={`px-2 py-1.5 max-w-[150px] truncate ${
                            Object.values(mapping).includes(cellIndex) 
                              ? 'bg-blue-50 text-blue-800' 
                              : 'text-gray-600'
                          }`}
                        >
                          {cell || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            {/* Image Prefix */}
            <div>
              <label className="text-sm font-medium text-gray-700">קידומת URL לתמונות</label>
              <input
                type="url"
                value={imagePrefix}
                onChange={(e) => setImagePrefix(e.target.value)}
                placeholder="https://example.com/images/"
                className="mt-1.5 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                התמונות יורדו, יומרו ל-WebP ויועלו לשרת
              </p>
            </div>

            {/* Test Mode */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={testMode}
                onChange={(e) => setTestMode(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <div>
                <span className="font-medium text-gray-900">מצב בדיקה</span>
                <p className="text-xs text-gray-500">מייבא רק 3 מוצרים ראשונים לבדיקה (מומלץ לפני ייבוא גדול)</p>
              </div>
            </label>

            {/* Update Mode */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateMode}
                  onChange={(e) => setUpdateMode(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <div>
                  <span className="font-medium text-gray-900">מצב עדכון מוצרים קיימים</span>
                  <p className="text-xs text-gray-500">אם מוצר קיים - עדכן אותו במקום ליצור חדש</p>
                </div>
              </label>

              {updateMode && (
                <div className="mt-3 mr-7 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-sm font-medium text-amber-800 mb-2">זיהוי מוצרים לפי:</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={updateKey === 'sku'}
                        onChange={() => setUpdateKey('sku')}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-700">מק"ט / ברקוד</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={updateKey === 'name'}
                        onChange={() => setUpdateKey('name')}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-700">שם מוצר</span>
                    </label>
                  </div>
                  <p className="text-xs text-amber-700 mt-2">
                    במצב עדכון - רק מוצרים קיימים יעודכנו, שורות שלא נמצאו ידולגו
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={resetForm}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              <ArrowRight className="w-4 h-4 inline ml-1" />
              חזור
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isMappingValid() || isPending}
              className={`flex-1 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors ${
                testMode 
                  ? 'bg-amber-500 text-white hover:bg-amber-600' 
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מייבא... (מוריד ומעבד תמונות)
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {testMode ? 'ייבוא בדיקה (3 מוצרים)' : 'התחל ייבוא מלא'}
                </>
              )}
            </button>
            
            {/* Note about image upload */}
            {isPending && (
              <div className="text-xs text-center text-gray-500 mt-2 animate-pulse">
                ⏳ התמונות מורדות מהשרת, ממירות ל-WebP ומועלות - זה יכול לקחת זמן...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className={`rounded-xl border p-5 ${
          result.success 
            ? result.isTestMode ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className={`w-5 h-5 shrink-0 mt-0.5 ${result.isTestMode ? 'text-amber-600' : 'text-green-600'}`} />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold ${
                result.success 
                  ? result.isTestMode ? 'text-amber-800' : 'text-green-800'
                  : 'text-red-800'
              }`}>
                {result.isTestMode 
                  ? 'בדיקה הושלמה!' 
                  : result.success ? 'הייבוא הושלם!' : 'הייבוא נכשל'
                }
              </h4>
              
              {result.isTestMode && result.totalInFile && (
                <div className="mt-2 p-2 bg-amber-100 rounded-lg text-xs text-amber-800">
                  🧪 מצב בדיקה: יובאו {result.imported} מתוך {result.totalInFile} מוצרים בקובץ.
                  <br />
                  <span className="font-medium">כבה את מצב הבדיקה לייבוא מלא.</span>
                </div>
              )}
              
              <div className="mt-2 space-y-1 text-sm">
                {result.imported > 0 && (
                  <p className={result.isTestMode ? 'text-amber-700' : 'text-green-700'}>
                    ✓ {result.imported} מוצרים יובאו
                  </p>
                )}
                {result.failed > 0 && (
                  <p className="text-red-700">
                    ✗ {result.failed} נכשלו
                  </p>
                )}
                {result.createdCategories.length > 0 && (
                  <p className="text-blue-700">
                    + {result.createdCategories.length} קטגוריות חדשות: {result.createdCategories.join(', ')}
                  </p>
                )}
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <h5 className="text-xs font-medium text-red-800 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    שגיאות ({result.errors.length})
                  </h5>
                  <ul className="space-y-0.5 text-xs text-red-700 max-h-32 overflow-y-auto">
                    {result.errors.slice(0, 10).map((error, i) => (
                      <li key={i} className="break-words">• {error}</li>
                    ))}
                    {result.errors.length > 10 && (
                      <li className="text-red-500 font-medium">
                        + {result.errors.length - 10} שגיאות נוספות
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Action buttons after import */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  ייבוא נוסף
                </button>
                {result.success && !result.isTestMode && (
                  <a
                    href={`/shops/${storeSlug}/admin/products`}
                    className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                  >
                    צפה במוצרים
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      <ImportProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        storeSlug={storeSlug}
        csvText={csvText}
        mapping={mapping}
        imagePrefix={imagePrefix}
        testMode={testMode}
        updateMode={updateMode}
        updateKey={updateKey}
        onComplete={handleImportComplete}
      />
    </div>
  );
}
