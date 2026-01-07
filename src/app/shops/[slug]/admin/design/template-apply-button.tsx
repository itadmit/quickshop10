'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TemplateApplyButtonProps {
  templateId: string;
  templateName: string;
  templateDescription: string;
  templateColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  sectionsCount: number;
  storeSlug: string;
  isActive: boolean;
}

export function TemplateApplyButton({ 
  templateId, 
  templateName,
  templateDescription,
  templateColors,
  sectionsCount,
  storeSlug, 
  isActive 
}: TemplateApplyButtonProps) {
  const router = useRouter();
  const [isApplying, setIsApplying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (isActive) {
    return (
      <a
        href={`/shops/${storeSlug}/editor`}
        className="px-4 py-2 bg-white text-black text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
      >
        ערוך עיצוב
      </a>
    );
  }

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const response = await fetch(`/api/shops/${storeSlug}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          applySettings: true,
          applySections: true,
        }),
      });

      if (response.ok) {
        router.refresh();
        setShowPreview(false);
      }
    } catch (error) {
      console.error('Error applying template:', error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowPreview(true)}
        className="px-4 py-2 bg-white text-black text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
      >
        תצוגה מקדימה
      </button>

      {/* Preview Modal */}
      {showPreview && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-50" 
            onClick={() => setShowPreview(false)}
          />
          <div className="fixed inset-4 md:inset-8 z-50 flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-4">
                {/* Color swatches */}
                <div className="flex gap-1">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: templateColors.primary }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow -mr-2"
                    style={{ backgroundColor: templateColors.accent }}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    תצוגה מקדימה: {templateName}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {templateDescription}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Preview iframe */}
            <div className="flex-1 bg-gray-100 p-4 overflow-hidden">
              <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Browser chrome */}
                <div className="bg-gray-200 px-4 py-2 flex items-center gap-2 border-b border-gray-300">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 bg-red-400 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                    <div className="w-3 h-3 bg-green-400 rounded-full" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white rounded px-3 py-1 text-xs text-gray-500 text-center">
                      תצוגה מקדימה של תבנית {templateName}
                    </div>
                  </div>
                </div>
                {/* Iframe with template preview */}
                <iframe
                  src={`/api/shops/${storeSlug}/templates/preview?templateId=${templateId}`}
                  className="w-full h-[calc(100%-40px)] border-0"
                  title={`תצוגה מקדימה: ${templateName}`}
                />
              </div>
            </div>

            {/* Footer with actions */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                  {sectionsCount} סקשנים
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-700">
                  ⚠️ החלה תחליף את העיצוב הנוכחי
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  ביטול
                </button>
                <button
                  onClick={handleApply}
                  disabled={isApplying}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {isApplying ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      מחיל...
                    </>
                  ) : (
                    'החל תבנית'
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

