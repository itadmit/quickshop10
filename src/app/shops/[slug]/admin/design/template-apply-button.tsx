'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TemplateApplyButtonProps {
  templateId: string;
  templateName: string;
  storeSlug: string;
  isActive: boolean;
}

export function TemplateApplyButton({ 
  templateId, 
  templateName, 
  storeSlug, 
  isActive 
}: TemplateApplyButtonProps) {
  const router = useRouter();
  const [isApplying, setIsApplying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
        setShowConfirm(false);
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
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 bg-white text-black text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
      >
        החל תבנית
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50" 
            onClick={() => setShowConfirm(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div 
              className="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  החל תבנית &quot;{templateName}&quot;?
                </h3>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-800">
                    ⚠️ פעולה זו תחליף את כל הסקשנים והעיצוב הנוכחי
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={isApplying}
                    className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {isApplying ? 'מחיל...' : 'אישור'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

