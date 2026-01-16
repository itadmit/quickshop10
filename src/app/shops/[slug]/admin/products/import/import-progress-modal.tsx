'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Loader2, CheckCircle, XCircle, Package, AlertTriangle, SkipForward, RefreshCw, Plus } from 'lucide-react';

interface ImportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  csvText: string;
  mapping: Record<string, number>;
  imagePrefix: string;
  testMode: boolean;
  updateMode: boolean;
  updateKey: 'sku' | 'name';
  onComplete: (result: ImportResult) => void;
}

interface ImportResult {
  success: boolean;
  imported: number;
  updated?: number;
  skipped?: number;
  failed: number;
  errors?: string[];
  createdCategories: string[];
  totalInFile: number;
  isTestMode: boolean;
}

export function ImportProgressModal({
  isOpen,
  onClose,
  storeSlug,
  csvText,
  mapping,
  imagePrefix,
  testMode,
  updateMode,
  updateKey,
  onComplete,
}: ImportProgressModalProps) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('מתחיל...');
  const [logs, setLogs] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Start import when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Reset state
    setProgress(0);
    setStep('מתחיל...');
    setLogs([]);
    setIsComplete(false);
    setError(null);
    setResult(null);

    // Start SSE connection
    const startImport = async () => {
      try {
        const response = await fetch(`/api/shops/${storeSlug}/products/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvText, mapping, imagePrefix, testMode, updateMode, updateKey }),
        });

        if (!response.ok) {
          throw new Error('Failed to start import');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                switch (data.type) {
                  case 'progress':
                    setProgress(data.percent);
                    setStep(data.step);
                    break;
                  case 'log':
                    setLogs(prev => [...prev, data.message]);
                    break;
                  case 'complete':
                    setIsComplete(true);
                    setResult(data.result);
                    onComplete(data.result);
                    break;
                  case 'error':
                    setError(data.message);
                    setIsComplete(true);
                    break;
                }
              } catch {}
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה בייבוא');
        setIsComplete(true);
      }
    };

    startImport();

    return () => {
      eventSourceRef.current?.close();
    };
  }, [isOpen, storeSlug, csvText, mapping, imagePrefix, testMode, updateMode, updateKey, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {isComplete ? (
              result?.success ? (
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
              )
            ) : (
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isComplete 
                  ? (result?.success ? 'הפעולה הושלמה!' : 'הפעולה נכשלה') 
                  : (updateMode ? 'מעדכן מוצרים...' : 'מייבא מוצרים...')
                }
              </h2>
              <p className="text-sm text-gray-500">{step}</p>
            </div>
          </div>
          {isComplete && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Warning - process stops if window closed */}
        {!isComplete && (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2 text-amber-700 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>סגירת החלון תעצור את התהליך. נא להמתין עד לסיום.</span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">התקדמות</span>
            <span className="text-sm font-bold text-gray-900">{progress}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                isComplete 
                  ? result?.success ? 'bg-green-500' : 'bg-red-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50 min-h-[300px] max-h-[400px]">
          <div className="space-y-1 font-mono text-sm">
            {logs.map((log, i) => (
              <div 
                key={i} 
                className={`py-1 px-2 rounded ${
                  log.includes('עודכן') || log.includes('נוצר') || log.includes('הועלתה') || log.includes('הושלם') 
                    ? 'bg-green-50 text-green-700' :
                  log.includes('שגיאה') || log.includes('נכשל') 
                    ? 'bg-red-50 text-red-700' :
                  log.includes('דילוג') || log.includes('לא נמצא') 
                    ? 'bg-amber-50 text-amber-700' :
                  'text-gray-600'
                }`}
              >
                {log}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Results Summary */}
        {isComplete && result && (
          <div className={`p-5 border-t ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="flex flex-col items-center">
                <Plus className="w-5 h-5 text-green-600 mb-1" />
                <div className="text-xl font-bold text-green-600">{result.imported}</div>
                <div className="text-xs text-gray-500">חדשים</div>
              </div>
              <div className="flex flex-col items-center">
                <RefreshCw className="w-5 h-5 text-blue-600 mb-1" />
                <div className="text-xl font-bold text-blue-600">{result.updated || 0}</div>
                <div className="text-xs text-gray-500">עודכנו</div>
              </div>
              <div className="flex flex-col items-center">
                <SkipForward className="w-5 h-5 text-amber-600 mb-1" />
                <div className="text-xl font-bold text-amber-600">{result.skipped || 0}</div>
                <div className="text-xs text-gray-500">דולגו</div>
              </div>
              <div className="flex flex-col items-center">
                <XCircle className="w-5 h-5 text-red-600 mb-1" />
                <div className="text-xl font-bold text-red-600">{result.failed}</div>
                <div className="text-xs text-gray-500">נכשלו</div>
              </div>
            </div>
            
            {result.createdCategories.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600 text-center">
                {result.createdCategories.length} קטגוריות חדשות נוצרו
              </div>
            )}
            
            {result.isTestMode && (
              <div className="mt-4 p-3 bg-amber-100 rounded-lg text-center">
                <Package className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-amber-800">מצב בדיקה</p>
                <p className="text-xs text-amber-600">רק 3 שורות ראשונות עובדו</p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-5 border-t bg-red-50">
            <div className="flex items-center gap-3 text-red-700">
              <XCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        {isComplete && (
          <div className="p-5 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              סגור
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
