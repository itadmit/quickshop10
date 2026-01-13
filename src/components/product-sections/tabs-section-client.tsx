'use client';

/**
 * Tabs Section - Client Component
 * 
 * This is the ONLY client component for tabs interactivity.
 * Content is already resolved on the server - we just handle tab switching.
 */

import { useState } from 'react';

interface ResolvedTabItem {
  id: string;
  title: string;
  content: string;
  contentSource: string;
  dynamicField?: string;
  resolvedContent: string;
}

interface TabsSectionClientProps {
  items: ResolvedTabItem[];
  style: string;
  alignment: string;
  sectionId: string;
}

export function TabsSectionClient({ 
  items, 
  style, 
  alignment, 
  sectionId 
}: TabsSectionClientProps) {
  const [activeTabId, setActiveTabId] = useState(items[0]?.id || '');

  if (items.length === 0) return null;

  const alignmentClass = alignment === 'center' 
    ? 'justify-center' 
    : alignment === 'left' 
      ? 'justify-end' 
      : 'justify-start';

  const getTabClass = (isActive: boolean) => {
    if (style === 'pills') {
      return isActive 
        ? 'bg-black text-white px-4 py-2 rounded-full text-sm font-medium'
        : 'bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm hover:bg-gray-200 transition-colors';
    }
    if (style === 'underline') {
      return isActive 
        ? 'border-b-2 border-black text-black px-4 py-2 text-sm font-medium'
        : 'border-b-2 border-transparent text-gray-500 px-4 py-2 text-sm hover:text-gray-900 transition-colors';
    }
    // Default
    return isActive 
      ? 'bg-gray-100 text-gray-900 px-4 py-2 text-sm font-medium rounded-t-lg'
      : 'text-gray-500 px-4 py-2 text-sm hover:text-gray-900 transition-colors';
  };

  const activeItem = items.find(item => item.id === activeTabId);

  return (
    <div className="product-tabs my-6" data-section-id={sectionId}>
      {/* Tab Headers */}
      <div 
        className={`flex gap-1 ${alignmentClass} ${style === 'underline' ? 'border-b border-gray-200' : ''}`}
        role="tablist"
      >
        {items.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={activeTabId === item.id}
            onClick={() => setActiveTabId(item.id)}
            className={getTabClass(activeTabId === item.id)}
          >
            {item.title}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div 
        className="pt-4 text-gray-600 text-sm leading-relaxed whitespace-pre-line"
        role="tabpanel"
      >
        {activeItem?.resolvedContent || ''}
      </div>
    </div>
  );
}

