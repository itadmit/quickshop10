'use client';

import { useState } from 'react';
import { type Template } from '@/lib/templates';
import Image from 'next/image';

interface TemplateGridProps {
  groupedTemplates: Record<string, Template[]>;
  currentTemplateId: string;
  storeSlug: string;
}

export function TemplateGrid({ groupedTemplates, currentTemplateId, storeSlug }: TemplateGridProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSelectTemplate = (template: Template) => {
    if (template.id === currentTemplateId) return;
    setSelectedTemplate(template);
    setShowConfirm(true);
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return;

    setIsApplying(true);
    try {
      const response = await fetch(`/api/shops/${storeSlug}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          applySettings: true,
          applySections: true,
        }),
      });

      if (response.ok) {
        // Redirect to editor with success message
        window.location.href = `/shops/${storeSlug}/editor?template=${selectedTemplate.id}`;
      }
    } catch (error) {
      console.error('Error applying template:', error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      {Object.entries(groupedTemplates).map(([category, templates]) => (
        <div key={category} className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
            {category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isCurrent={currentTemplateId === template.id}
                onSelect={() => handleSelectTemplate(template)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Confirmation Modal */}
      {showConfirm && selectedTemplate && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50" 
            onClick={() => setShowConfirm(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div 
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Preview */}
              <div 
                className="h-32 relative"
                style={{ backgroundColor: selectedTemplate.cssVariables['--template-bg'] }}
              >
                <div 
                  className="absolute inset-x-0 top-0 h-10"
                  style={{ backgroundColor: selectedTemplate.cssVariables['--template-primary'] }}
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  {['--template-primary', '--template-secondary', '--template-accent'].map((key) => (
                    <div 
                      key={key}
                      className="w-8 h-8 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: selectedTemplate.cssVariables[key] }}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  החלת תבנית &quot;{selectedTemplate.name}&quot;
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedTemplate.description}
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 flex-shrink-0 mt-0.5">
                      <path d="M12 9v4M12 17h.01M12 3l9.5 16.5H2.5L12 3z" />
                    </svg>
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">שים לב</p>
                      <p>החלת התבנית תחליף את כל הסקשנים והעיצוב הנוכחי. אפשר לערוך הכל אחרי ההחלה.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleApplyTemplate}
                    disabled={isApplying}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {isApplying ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        מחיל...
                      </span>
                    ) : (
                      'החל תבנית'
                    )}
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

function TemplateCard({
  template,
  isCurrent,
  onSelect,
}: {
  template: Template;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  const primary = template.cssVariables['--template-primary'];
  const secondary = template.cssVariables['--template-secondary'];
  const accent = template.cssVariables['--template-accent'];
  const bg = template.cssVariables['--template-bg'];
  const text = template.cssVariables['--template-text'];

  return (
    <div
      className={`
        group rounded-2xl border-2 overflow-hidden bg-white transition-all cursor-pointer
        ${isCurrent 
          ? 'border-green-500 ring-4 ring-green-100' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
        }
      `}
      onClick={onSelect}
    >
      {/* Preview Area */}
      <div 
        className="h-48 relative overflow-hidden"
        style={{ backgroundColor: bg }}
      >
        {/* Mini header simulation */}
        <div 
          className="h-10 flex items-center justify-between px-4"
          style={{ backgroundColor: primary }}
        >
          <div className="flex gap-2">
            <div className="w-16 h-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
            <div className="w-12 h-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
          </div>
          <div className="w-8 h-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }} />
        </div>

        {/* Hero simulation */}
        <div className="h-24 relative" style={{ backgroundColor: secondary }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="w-24 h-3 rounded mb-2" style={{ backgroundColor: text, opacity: 0.7 }} />
            <div className="w-16 h-2 rounded" style={{ backgroundColor: text, opacity: 0.4 }} />
          </div>
        </div>

        {/* Products simulation */}
        <div className="flex gap-2 p-3">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="flex-1 h-10 rounded"
              style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
            />
          ))}
        </div>

        {/* Current badge */}
        {isCurrent && (
          <div className="absolute top-12 right-3 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full shadow">
            ✓ פעיל
          </div>
        )}

        {/* Color swatches */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <div 
            className="w-5 h-5 rounded-full border-2 border-white shadow"
            style={{ backgroundColor: primary }}
          />
          <div 
            className="w-5 h-5 rounded-full border-2 border-white shadow"
            style={{ backgroundColor: accent }}
          />
          <div 
            className="w-5 h-5 rounded-full border-2 border-white shadow"
            style={{ backgroundColor: secondary }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{template.name}</h3>
          {template.isPro && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-medium rounded-full">
              PRO
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {template.description}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            <span>{template.sections.length} סקשנים</span>
          </div>
          <span className="text-gray-300">|</span>
          <span>{template.category}</span>
        </div>
      </div>

      {/* Hover Overlay */}
      {!isCurrent && (
        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
            בחר תבנית
          </div>
        </div>
      )}
    </div>
  );
}

