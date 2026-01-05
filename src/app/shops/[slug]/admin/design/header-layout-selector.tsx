'use client';

import { useState, useTransition } from 'react';
import { updateHeaderLayout } from './actions';

interface HeaderLayoutSelectorProps {
  currentLayout: string;
  storeSlug: string;
}

const layouts = [
  {
    id: 'logo-right',
    name: 'לוגו בימין',
    description: 'לוגו בימין, תפריט במרכז, אייקונים משמאל',
    preview: (
      <div className="flex items-center justify-between w-full px-2 py-2 bg-gray-50 rounded border border-gray-200">
        <div className="w-8 h-2 bg-black rounded" title="לוגו" />
        <div className="flex gap-1">
          <div className="w-4 h-1.5 bg-gray-400 rounded" />
          <div className="w-4 h-1.5 bg-gray-400 rounded" />
          <div className="w-4 h-1.5 bg-gray-400 rounded" />
        </div>
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" />
          <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" />
          <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" />
        </div>
      </div>
    ),
  },
  {
    id: 'logo-left',
    name: 'לוגו בשמאל',
    description: 'לוגו בשמאל, תפריט במרכז, אייקונים מימין',
    preview: (
      <div className="flex items-center justify-between w-full px-2 py-2 bg-gray-50 rounded border border-gray-200">
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" />
          <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" />
          <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" />
        </div>
        <div className="flex gap-1">
          <div className="w-4 h-1.5 bg-gray-400 rounded" />
          <div className="w-4 h-1.5 bg-gray-400 rounded" />
          <div className="w-4 h-1.5 bg-gray-400 rounded" />
        </div>
        <div className="w-8 h-2 bg-black rounded" title="לוגו" />
      </div>
    ),
  },
  {
    id: 'logo-center',
    name: 'לוגו במרכז',
    description: 'לוגו במרכז, חיפוש מימין ושאר אייקונים משמאל, תפריט מתחת',
    preview: (
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center justify-between w-full px-2 py-2 bg-gray-50 rounded-t border border-gray-200">
          <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" title="חיפוש" />
          <div className="w-10 h-2 bg-black rounded" title="לוגו" />
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" />
            <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" />
          </div>
        </div>
        <div className="flex items-center justify-center w-full px-2 py-1.5 bg-gray-50 rounded-b border-x border-b border-gray-200">
          <div className="flex gap-2">
            <div className="w-4 h-1.5 bg-gray-400 rounded" />
            <div className="w-4 h-1.5 bg-gray-400 rounded" />
            <div className="w-4 h-1.5 bg-gray-400 rounded" />
          </div>
        </div>
      </div>
    ),
  },
];

export function HeaderLayoutSelector({ currentLayout, storeSlug }: HeaderLayoutSelectorProps) {
  const [selected, setSelected] = useState(currentLayout);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (layoutId: string) => {
    setSelected(layoutId);
    startTransition(async () => {
      await updateHeaderLayout(storeSlug, layoutId);
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <h2 className="text-xl font-bold text-gray-900">פריסת הדר</h2>
        <p className="text-sm text-gray-600 mt-1">
          בחרו את סגנון פריסת ההדר לחנות שלכם
        </p>
      </div>

      <div className="p-6">
        <div className="grid md:grid-cols-3 gap-4">
          {layouts.map((layout) => (
            <button
              key={layout.id}
              onClick={() => handleSelect(layout.id)}
              disabled={isPending}
              className={`
                relative p-4 rounded-xl border-2 text-right transition-all cursor-pointer
                ${selected === layout.id
                  ? 'border-black bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
                ${isPending ? 'opacity-50' : ''}
              `}
            >
              {/* Selected Badge */}
              {selected === layout.id && (
                <div className="absolute top-2 left-2 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
              
              {/* Preview */}
              <div className="mb-3">
                {layout.preview}
              </div>
              
              {/* Info */}
              <h3 className="font-semibold text-gray-900 mb-1">{layout.name}</h3>
              <p className="text-xs text-gray-500">{layout.description}</p>
            </button>
          ))}
        </div>
        
        {isPending && (
          <p className="text-sm text-gray-500 mt-4 text-center">שומר שינויים...</p>
        )}
      </div>
    </div>
  );
}

