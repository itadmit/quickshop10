'use client';

/**
 * EditorSelect - Modern select/dropdown with theme support
 * בחירה מודרנית עם תמיכה בבהיר וכהה
 */

import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface EditorSelectProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;  // Smaller version without label
}

export function EditorSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'בחר...',
  className = '',
  compact = false,
}: EditorSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll selected item into view when dropdown opens
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const selectedEl = dropdownRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'center' });
      }
    }
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value);

  // Compact mode - just the button without label
  if (compact) {
    return (
      <div className={`relative ${className}`} ref={ref}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 bg-[var(--editor-bg-tertiary)] rounded px-2 py-1 
                     border border-[var(--editor-border-default)] hover:border-[var(--editor-border-hover)] transition-colors"
        >
          <span className="text-xs text-[var(--editor-text-primary)]">
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown 
            className={`w-2.5 h-2.5 text-[var(--editor-text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {/* Dropdown for compact */}
        {isOpen && (
          <div 
            ref={dropdownRef}
            className="absolute right-0 top-full mt-1 z-50 bg-[var(--editor-bg-secondary)] rounded-lg 
                          border border-[var(--editor-border-default)] shadow-lg py-1 min-w-16 max-h-52 overflow-y-auto"
          >
            {options.map((option) => (
              <button
                key={option.value}
                data-selected={value === option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 text-xs
                           transition-colors
                           ${value === option.value 
                             ? 'bg-[var(--editor-accent-blue)]/10 text-[var(--editor-accent-blue)]' 
                             : 'text-[var(--editor-text-secondary)] hover:bg-[var(--editor-bg-hover)] hover:text-[var(--editor-text-primary)]'}`}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <Check className="w-3 h-3" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative py-2 group ${className}`} ref={ref}>
      <div className="flex items-center justify-between">
        <label className="text-xs text-[var(--editor-text-secondary)] group-hover:text-[var(--editor-text-primary)] transition-colors">
          {label}
        </label>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-[var(--editor-bg-tertiary)] rounded px-3 py-1.5 
                     border border-[var(--editor-border-default)] hover:border-[var(--editor-border-hover)] transition-colors min-w-24"
        >
          <span className="text-xs text-[var(--editor-text-primary)] flex-1 text-right">
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown 
            className={`w-3 h-3 text-[var(--editor-text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute left-0 top-full mt-1 z-50 bg-[var(--editor-bg-secondary)] rounded-lg 
                        border border-[var(--editor-border-default)] shadow-lg py-1 min-w-32 max-h-52 overflow-y-auto"
        >
          {options.map((option) => (
            <button
              key={option.value}
              data-selected={value === option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs
                         transition-colors
                         ${value === option.value 
                           ? 'bg-[var(--editor-accent-blue)]/10 text-[var(--editor-accent-blue)]' 
                           : 'text-[var(--editor-text-secondary)] hover:bg-[var(--editor-bg-hover)] hover:text-[var(--editor-text-primary)]'}`}
            >
              <div className="flex items-center gap-2">
                {option.icon}
                <span>{option.label}</span>
              </div>
              {value === option.value && (
                <Check className="w-3 h-3" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Button group variant (toggle between options)
interface EditorToggleGroupProps {
  label: string;
  value: string;
  options: { value: string; label: string; icon?: ReactNode }[];
  onChange: (value: string) => void;
  className?: string;
}

export function EditorToggleGroup({
  label,
  value,
  options,
  onChange,
  className = '',
}: EditorToggleGroupProps) {
  return (
    <div className={`py-2 group ${className}`}>
      <label className="block text-xs text-[var(--editor-text-secondary)] group-hover:text-[var(--editor-text-primary)] transition-colors mb-2">
        {label}
      </label>
      <div className="flex gap-1 bg-[var(--editor-bg-tertiary)] rounded p-1 border border-[var(--editor-border-default)]">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs cursor-pointer
                       transition-all
                       ${value === option.value 
                         ? 'bg-[var(--editor-bg-primary)] text-[var(--editor-text-primary)] shadow-sm' 
                         : 'text-[var(--editor-text-muted)] hover:text-[var(--editor-text-secondary)]'}`}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Icon button group (for alignment etc.)
interface EditorIconGroupProps {
  label: string;
  value: string;
  options: { value: string; icon: ReactNode; title: string }[];
  onChange: (value: string) => void;
  className?: string;
}

export function EditorIconGroup({
  label,
  value,
  options,
  onChange,
  className = '',
}: EditorIconGroupProps) {
  return (
    <div className={`flex items-center justify-between py-2 group ${className}`}>
      <label className="text-xs text-[var(--editor-text-secondary)] group-hover:text-[var(--editor-text-primary)] transition-colors">
        {label}
      </label>
      <div className="flex gap-0.5 bg-[var(--editor-bg-tertiary)] rounded p-0.5 border border-[var(--editor-border-default)]">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            title={option.title}
            className={`p-1.5 rounded transition-all cursor-pointer
                       ${value === option.value 
                         ? 'bg-[var(--editor-accent-blue)] text-white' 
                         : 'text-[var(--editor-text-muted)] hover:text-[var(--editor-text-primary)] hover:bg-[var(--editor-bg-hover)]'}`}
          >
            {option.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
