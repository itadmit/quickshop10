'use client';

import { useState, useRef, useEffect } from 'react';
import { dynamicVariables, type DynamicVariable, type MetafieldDefinition, getCustomFieldVariables } from '@/lib/dynamic-content';

// ============================================
// Types
// ============================================

interface DynamicSourcePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  metafields?: MetafieldDefinition[];
  /** If true, shows as inline button next to input */
  inline?: boolean;
  /** Categories to show - default is all */
  categories?: ('product' | 'variant' | 'store' | 'custom')[];
}

interface DynamicSourceButtonProps {
  onSelect: (variable: DynamicVariable) => void;
  metafields?: MetafieldDefinition[];
  categories?: ('product' | 'variant' | 'store' | 'custom')[];
}

// ============================================
// Dynamic Source Button (Shopify-style)
// ============================================

export function DynamicSourceButton({ 
  onSelect, 
  metafields = [],
  categories = ['product', 'variant', 'store', 'custom']
}: DynamicSourceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get all variables including custom fields
  const customVariables = getCustomFieldVariables(metafields);
  const allVariables = [...dynamicVariables, ...customVariables];
  
  // Filter by categories and search
  const filteredVariables = allVariables
    .filter(v => categories.includes(v.category))
    .filter(v => 
      search === '' || 
      v.label.includes(search) || 
      v.path.toLowerCase().includes(search.toLowerCase())
    );

  // Group by category
  const groupedVariables = {
    product: filteredVariables.filter(v => v.category === 'product'),
    variant: filteredVariables.filter(v => v.category === 'variant'),
    store: filteredVariables.filter(v => v.category === 'store'),
    custom: filteredVariables.filter(v => v.category === 'custom'),
  };

  const categoryLabels = {
    product: 'מוצר',
    variant: 'וריאנט',
    store: 'חנות',
    custom: 'שדות מותאמים',
  };

  const categoryIcons = {
    product: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    variant: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    store: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    custom: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors group relative"
        title="בחר מקור דינמי"
      >
        {/* Database icon - Shopify style */}
        <svg 
          className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" 
          />
        </svg>
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute left-0 top-full mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
          style={{ maxHeight: '400px' }}
        >
          {/* Header */}
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <span>בחר מקור דינמי</span>
            </div>
          </div>

          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש..."
                className="w-full pr-9 pl-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                autoFocus
              />
            </div>
          </div>

          {/* Variables List - Show custom fields (metafields) first, then built-in fields */}
          <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
            {/* Order: custom first, then product, variant, store */}
            {(['custom', 'product', 'variant', 'store'] as const).map((category) => {
              const variables = groupedVariables[category];
              if (variables.length === 0) return null;
              
              return (
                <div key={category}>
                  {/* Category Header */}
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2 sticky top-0">
                    <span className="text-gray-400">
                      {categoryIcons[category as keyof typeof categoryIcons]}
                    </span>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </span>
                  </div>
                  
                  {/* Variables */}
                  {variables.map((variable) => (
                    <button
                      key={variable.path}
                      type="button"
                      onClick={() => {
                        onSelect(variable);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className="w-full px-3 py-2.5 text-right hover:bg-blue-50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-sm text-gray-900 group-hover:text-blue-700">
                          {variable.label}
                        </div>
                        {variable.description && (
                          <div className="text-xs text-gray-400">
                            {variable.description}
                          </div>
                        )}
                      </div>
                      <code className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600">
                        {`{{${variable.path}}}`}
                      </code>
                    </button>
                  ))}
                </div>
              );
            })}

            {filteredVariables.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-400">
                לא נמצאו תוצאות
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Input with Dynamic Source Button
// ============================================

export function DynamicInput({
  value,
  onChange,
  placeholder,
  label,
  metafields = [],
  categories = ['product', 'variant', 'store', 'custom'],
}: DynamicSourcePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Check if value contains dynamic content
  const hasDynamic = value && /\{\{[^}]+\}\}/.test(value);

  const handleSelect = (variable: DynamicVariable) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue = 
        value.slice(0, start) + 
        `{{${variable.path}}}` + 
        value.slice(end);
      onChange(newValue);
      
      // Focus back and position cursor after inserted text
      setTimeout(() => {
        input.focus();
        const newPosition = start + variable.path.length + 4; // +4 for {{ and }}
        input.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      // If no input ref, just append
      onChange(value + `{{${variable.path}}}`);
    }
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs font-medium text-gray-600">
          {label}
        </label>
      )}
      <div className="relative flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            flex-1 px-3 py-2 text-sm border rounded-lg outline-none transition-colors
            ${hasDynamic 
              ? 'border-blue-300 bg-blue-50/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' 
              : 'border-gray-200 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400'
            }
          `}
          dir="auto"
        />
        <DynamicSourceButton 
          onSelect={handleSelect}
          metafields={metafields}
          categories={categories}
        />
      </div>
      
      {/* Show dynamic tag indicator */}
      {hasDynamic && (
        <div className="flex items-center gap-1 text-xs text-blue-600">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span>מחובר לתוכן דינמי</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// Textarea with Dynamic Source Button
// ============================================

export function DynamicTextarea({
  value,
  onChange,
  placeholder,
  label,
  metafields = [],
  categories = ['product', 'variant', 'store', 'custom'],
  rows = 3,
}: DynamicSourcePickerProps & { rows?: number }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Check if value contains dynamic content
  const hasDynamic = value && /\{\{[^}]+\}\}/.test(value);

  const handleSelect = (variable: DynamicVariable) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newValue = 
        value.slice(0, start) + 
        `{{${variable.path}}}` + 
        value.slice(end);
      onChange(newValue);
      
      // Focus back and position cursor after inserted text
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + variable.path.length + 4;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      onChange(value + `{{${variable.path}}}`);
    }
  };

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-gray-600">
            {label}
          </label>
          <DynamicSourceButton 
            onSelect={handleSelect}
            metafields={metafields}
            categories={categories}
          />
        </div>
      )}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`
            w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors resize-none
            ${hasDynamic 
              ? 'border-blue-300 bg-blue-50/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' 
              : 'border-gray-200 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400'
            }
          `}
          dir="auto"
        />
        {!label && (
          <div className="absolute top-2 left-2">
            <DynamicSourceButton 
              onSelect={handleSelect}
              metafields={metafields}
              categories={categories}
            />
          </div>
        )}
      </div>
      
      {/* Show dynamic tag indicator */}
      {hasDynamic && (
        <div className="flex items-center gap-1 text-xs text-blue-600">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span>מחובר לתוכן דינמי</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// Simple wrapper that just adds the button
// ============================================

export function WithDynamicSource({ 
  children, 
  onSelect,
  metafields = [],
  categories = ['product', 'variant', 'store', 'custom'],
}: { 
  children: React.ReactNode;
  onSelect: (path: string) => void;
  metafields?: MetafieldDefinition[];
  categories?: ('product' | 'variant' | 'store' | 'custom')[];
}) {
  return (
    <div className="flex items-start gap-1">
      <div className="flex-1">
        {children}
      </div>
      <div className="mt-1">
        <DynamicSourceButton 
          onSelect={(v) => onSelect(`{{${v.path}}}`)}
          metafields={metafields}
          categories={categories}
        />
      </div>
    </div>
  );
}

