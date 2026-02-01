'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, Code, RotateCcw, AlertTriangle } from 'lucide-react';

interface ExportThemeButtonProps {
  templateId: string;
  template: {
    id: string;
    name: string;
    description: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
  } | undefined;
  storeSlug: string;
}

export function ExportThemeButton({ templateId, template, storeSlug }: ExportThemeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = () => {
    if (!template) return;
    
    const themeData = {
      templateId,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        colors: template.colors,
        fonts: template.fonts,
      },
      storeSlug,
      exportDate: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(themeData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `theme-${storeSlug}-${templateId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const handleResetTemplate = async () => {
    setIsResetting(true);
    try {
      const response = await fetch(`/api/shops/${storeSlug}/template/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });

      if (response.ok) {
        setShowResetModal(false);
        setIsOpen(false);
        router.refresh();
      } else {
        alert('שגיאה באיפוס התבנית');
      }
    } catch (error) {
      console.error('Reset template error:', error);
      alert('שגיאה באיפוס התבנית');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="אפשרויות"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>

      {/* Dropdown Menu - Opens upward */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[100]">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-right"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>הורד תבנית</span>
          </button>
          <Link
            href={`/shops/${storeSlug}/admin/design/custom-code`}
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-right"
          >
            <Code className="w-4 h-4 text-gray-500" />
            <span>קוד מותאם</span>
          </Link>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => {
              setShowResetModal(true);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-right"
          >
            <RotateCcw className="w-4 h-4" />
            <span>איפוס תבנית</span>
          </button>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowResetModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" dir="rtl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">איפוס תבנית</h3>
                <p className="text-sm text-gray-500">פעולה בלתי הפיכה</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              האם אתה בטוח שברצונך לאפס את התבנית לברירת המחדל? 
              כל השינויים שביצעת יימחקו לצמיתות.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleResetTemplate}
                disabled={isResetting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isResetting ? 'מאפס...' : 'כן, אפס תבנית'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
