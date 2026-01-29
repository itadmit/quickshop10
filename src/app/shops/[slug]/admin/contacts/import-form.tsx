'use client';

/**
 * Contact Import Form with Column Mapping
 * 
 * שלבים:
 * 1. בחירת קובץ CSV
 * 2. מיפוי עמודות (המשתמש בוחר איזו עמודה מתאימה לאיזה שדה)
 * 3. תצוגה מקדימה וייבוא
 */

import { useState, useTransition } from 'react';
import { Upload, FileText, Loader2, CheckCircle, XCircle, ArrowLeft, ArrowRight, Users } from 'lucide-react';
import { importContactsFromCSV, type ContactImportResult, type ContactColumnMapping } from './import-actions';

interface Props {
  storeId: string;
  storeSlug: string;
  onClose: () => void;
  defaultType?: 'newsletter' | 'club_member' | 'contact_form' | 'popup_form';
}

// שדות לייבוא אנשי קשר
const IMPORT_FIELDS = [
  { key: 'email', label: 'אימייל', required: true },
  { key: 'firstName', label: 'שם פרטי', required: false },
  { key: 'lastName', label: 'שם משפחה', required: false },
  { key: 'phone', label: 'טלפון', required: false },
  { key: 'birthday', label: 'תאריך לידה', required: false },
] as const;

type FieldKey = typeof IMPORT_FIELDS[number]['key'];

const typeLabels = {
  newsletter: 'ניוזלטר',
  club_member: 'מועדון לקוחות',
  contact_form: 'יצירת קשר',
  popup_form: 'פופאפ',
};

export function ContactImportForm({ storeId, storeSlug, onClose, defaultType = 'club_member' }: Props) {
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  
  // Step 1: File
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState('');
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  
  // Step 2: Column Mapping
  const [mapping, setMapping] = useState<ContactColumnMapping>({
    email: -1,
    firstName: -1,
    lastName: -1,
    phone: -1,
    birthday: -1,
  });
  
  // Settings
  const [contactType, setContactType] = useState<'newsletter' | 'club_member' | 'contact_form' | 'popup_form'>(defaultType);
  const [testMode, setTestMode] = useState(true);
  
  // Result
  const [result, setResult] = useState<ContactImportResult | null>(null);

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
            currentField += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          currentField += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          currentRow.push(currentField);
          currentField = '';
        } else if (char === '\n' || char === '\r') {
          currentRow.push(currentField);
          if (currentRow.length > 0 && currentRow.some(f => f.trim())) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = '';
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
        } else {
          currentField += char;
        }
      }
    }
    
    currentRow.push(currentField);
    if (currentRow.length > 0 && currentRow.some(f => f.trim())) {
      rows.push(currentRow);
    }
    
    return rows;
  };

  const parseCSVPreview = (text: string) => {
    const allRows = parseCSV(text);
    
    if (allRows.length < 1) {
      return { columns: [], preview: [] };
    }
    
    const columns = allRows[0];
    const preview = allRows.slice(1, 6); // First 5 data rows
    
    return { columns, preview };
  };

  // Auto-detect columns based on common names
  const autoDetectMapping = (columns: string[]): ContactColumnMapping => {
    const newMapping: ContactColumnMapping = {
      email: -1,
      firstName: -1,
      lastName: -1,
      phone: -1,
      birthday: -1,
    };

    columns.forEach((col, index) => {
      const colLower = col.toLowerCase().trim();
      
      // Email
      if (colLower.includes('מייל') || colLower.includes('אימייל') || colLower.includes('email') || colLower.includes('mail')) {
        if (newMapping.email === -1) newMapping.email = index;
      }
      // First name
      else if (colLower.includes('שם פרטי') || colLower.includes('first') || colLower === 'שם') {
        if (newMapping.firstName === -1) newMapping.firstName = index;
      }
      // Last name
      else if (colLower.includes('שם משפחה') || colLower.includes('משפחה') || colLower.includes('last')) {
        if (newMapping.lastName === -1) newMapping.lastName = index;
      }
      // Phone
      else if (colLower.includes('טלפון') || colLower.includes('נייד') || colLower.includes('phone') || colLower.includes('mobile') || colLower.includes('tel')) {
        if (newMapping.phone === -1) newMapping.phone = index;
      }
      // Birthday
      else if (colLower.includes('תאריך לידה') || colLower.includes('לידה') || colLower.includes('יום הולדת') || colLower.includes('birthday') || colLower.includes('birth')) {
        if (newMapping.birthday === -1) newMapping.birthday = index;
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
    return mapping.email >= 0;
  };

  const handleSubmit = async () => {
    if (!csvText || !isMappingValid()) return;

    startTransition(async () => {
      try {
        const importResult = await importContactsFromCSV(
          storeId,
          storeSlug,
          csvText,
          mapping,
          contactType,
          testMode ? 3 : undefined
        );
        setResult(importResult);
        setStep('preview');
      } catch (error) {
        console.error('Import error:', error);
        setResult({
          success: false,
          imported: 0,
          failed: 0,
          skipped: 0,
          errors: [error instanceof Error ? error.message : 'שגיאה בייבוא'],
        });
        setStep('preview');
      }
    });
  };

  const handleFullImport = async () => {
    if (!csvText || !isMappingValid()) return;

    setTestMode(false);
    startTransition(async () => {
      try {
        const importResult = await importContactsFromCSV(
          storeId,
          storeSlug,
          csvText,
          mapping,
          contactType,
          undefined // No limit - full import
        );
        setResult(importResult);
      } catch (error) {
        console.error('Import error:', error);
        setResult({
          success: false,
          imported: 0,
          failed: 0,
          skipped: 0,
          errors: [error instanceof Error ? error.message : 'שגיאה בייבוא'],
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
    setTestMode(true);
    setMapping({
      email: -1,
      firstName: -1,
      lastName: -1,
      phone: -1,
      birthday: -1,
    });
  };

  // Preview mapped data
  const getMappedPreview = () => {
    return csvPreview.map(row => ({
      email: mapping.email >= 0 ? row[mapping.email] || '' : '',
      firstName: mapping.firstName >= 0 ? row[mapping.firstName] || '' : '',
      lastName: mapping.lastName >= 0 ? row[mapping.lastName] || '' : '',
      phone: mapping.phone >= 0 ? row[mapping.phone] || '' : '',
      birthday: mapping.birthday >= 0 ? row[mapping.birthday] || '' : '',
    }));
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <div className={`flex items-center gap-1 ${step === 'upload' ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'upload' ? 'bg-gray-900 text-white' : 'bg-gray-200'}`}>1</span>
          העלאה
        </div>
        <ArrowLeft className="w-4 h-4 text-gray-300" />
        <div className={`flex items-center gap-1 ${step === 'mapping' ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'mapping' ? 'bg-gray-900 text-white' : 'bg-gray-200'}`}>2</span>
          מיפוי
        </div>
        <ArrowLeft className="w-4 h-4 text-gray-300" />
        <div className={`flex items-center gap-1 ${step === 'preview' ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'preview' ? 'bg-gray-900 text-white' : 'bg-gray-200'}`}>3</span>
          תוצאות
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-gray-300 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-900 font-medium mb-1">בחר קובץ CSV</p>
              <p className="text-sm text-gray-500">או גרור לכאן</p>
            </label>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="font-medium text-blue-900 mb-2">💡 פורמט הקובץ</p>
            <p className="text-blue-700">הקובץ צריך להכיל שורת כותרות עם שמות העמודות.</p>
            <p className="text-blue-700 mt-1">עמודות נתמכות: אימייל (חובה), שם פרטי, שם משפחה, טלפון, תאריך לידה</p>
          </div>
        </div>
      )}

      {/* Step 2: Mapping */}
      {step === 'mapping' && (
        <div className="space-y-4">
          {/* Contact Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סוג איש קשר
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(typeLabels) as Array<keyof typeof typeLabels>).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setContactType(type)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
                    contactType === type
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {typeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Column Mapping */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                מיפוי עמודות
              </h3>
              <p className="text-sm text-gray-500 mt-1">בחר איזו עמודה בקובץ מתאימה לכל שדה</p>
            </div>
            
            <div className="p-4 space-y-3">
              {IMPORT_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={mapping[field.key]}
                    onChange={(e) => handleMappingChange(field.key, parseInt(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value={-1}>-- לא למפות --</option>
                    {csvColumns.map((col, index) => (
                      <option key={index} value={index}>
                        {col || `עמודה ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {csvPreview.length > 0 && isMappingValid() && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">תצוגה מקדימה</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">אימייל</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">שם פרטי</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">שם משפחה</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">טלפון</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">ת. לידה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getMappedPreview().slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-900" dir="ltr">{row.email}</td>
                        <td className="px-3 py-2 text-gray-600">{row.firstName || '-'}</td>
                        <td className="px-3 py-2 text-gray-600">{row.lastName || '-'}</td>
                        <td className="px-3 py-2 text-gray-600" dir="ltr">{row.phone || '-'}</td>
                        <td className="px-3 py-2 text-gray-600">{row.birthday || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Test Mode Toggle */}
          <label className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={testMode}
              onChange={(e) => setTestMode(e.target.checked)}
              className="w-4 h-4"
            />
            <div>
              <p className="font-medium text-amber-900">מצב בדיקה</p>
              <p className="text-sm text-amber-700">ייבוא 3 שורות ראשונות בלבד לבדיקה</p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep('upload')}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 inline ml-1" />
              חזרה
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isMappingValid() || isPending}
              className="flex-1 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מייבא...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  {testMode ? 'ייבוא נסיון (3 שורות)' : 'ייבוא מלא'}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 'preview' && result && (
        <div className="space-y-4">
          {/* Result Summary */}
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <h3 className={`font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                {result.success ? 'הייבוא הושלם!' : 'הייבוא נכשל'}
              </h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                <p className="text-sm text-gray-600">יובאו</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{result.skipped}</p>
                <p className="text-sm text-gray-600">דלגו (כפולים)</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                <p className="text-sm text-gray-600">נכשלו</p>
              </div>
            </div>
            
            {result.isTestMode && (
              <p className="text-sm text-amber-700 mt-3 bg-amber-100 p-2 rounded">
                ⚠️ זהו ייבוא נסיון בלבד (3 שורות). לחץ על "ייבוא מלא" לייבוא כל הרשומות.
              </p>
            )}
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="border border-red-200 rounded-lg overflow-hidden">
              <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                <h4 className="font-medium text-red-900">שגיאות ({result.errors.length})</h4>
              </div>
              <div className="max-h-40 overflow-y-auto p-4">
                <ul className="text-sm text-red-700 space-y-1">
                  {result.errors.slice(0, 10).map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                  {result.errors.length > 10 && (
                    <li className="text-gray-500">... ועוד {result.errors.length - 10} שגיאות</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {result.isTestMode && result.success && (
              <button
                onClick={handleFullImport}
                disabled={isPending}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    מייבא הכל...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    ייבוא מלא ({result.totalInFile} רשומות)
                  </>
                )}
              </button>
            )}
            <button
              onClick={resetForm}
              className="px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              ייבוא חדש
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              סיום
            </button>
          </div>
        </div>
      )}
    </div>
  );
}









