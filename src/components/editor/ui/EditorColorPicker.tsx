'use client';

/**
 * EditorColorPicker - Modern color picker with theme support
 * בוחר צבע מודרני עם תמיכה בבהיר וכהה
 */

import { useState, useRef, useEffect } from 'react';

// Popular colors palette - 8 per row
const PRESET_COLORS = [
  // Grays
  '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#000000', '#ffffff',
  // Reds
  '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2', '#fef2f2', '#fff5f5',
  // Oranges/Yellows  
  '#ca8a04', '#eab308', '#facc15', '#fde047', '#fef08a', '#fef9c3', '#fefce8', '#fffbeb',
  // Greens
  '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7', '#f0fdf4', '#f0fff4',
  // Blues
  '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff', '#f0f9ff',
  // Purples
  '#9333ea', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff', '#faf5ff', '#fdf4ff',
  // Pinks
  '#db2777', '#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#fce7f3', '#fdf2f8', '#fff5f8',
];

interface EditorColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPresets?: boolean;
  className?: string;
}

export function EditorColorPicker({
  label,
  value,
  onChange,
  showPresets = true,
  className = '',
}: EditorColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value || '#000000');
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync local value with prop
  useEffect(() => {
    if (value) setLocalValue(value);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleColorChange = (newColor: string) => {
    setLocalValue(newColor);
    onChange(newColor);
  };

  // Display value handling
  const displayColor = localValue === 'transparent' ? '#ffffff' : localValue;
  const isTransparent = localValue === 'transparent' || !localValue;

  return (
    <div className={`relative py-1.5 group ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs text-[var(--editor-text-secondary)] group-hover:text-[var(--editor-text-primary)] transition-colors">
          {label}
        </label>
        
        <div className="flex items-center gap-2">
          {/* Color preview button */}
          <button
            ref={buttonRef}
            onClick={() => setIsOpen(!isOpen)}
            className="relative w-7 h-7 rounded border border-[var(--editor-border-default)] 
                       hover:border-[var(--editor-border-focus)] transition-colors overflow-hidden"
          >
            {/* Checkerboard for transparent */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: 'linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)',
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
              }}
            />
            {/* Color overlay */}
            <div 
              className="absolute inset-0"
              style={{ backgroundColor: displayColor }}
            />
          </button>
          
          {/* Hex input */}
          <input
            type="text"
            value={localValue}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-20 bg-[var(--editor-bg-tertiary)] text-[var(--editor-text-primary)] text-xs px-2 py-1.5 rounded
                       border border-[var(--editor-border-default)] focus:border-[var(--editor-border-focus)] outline-none transition-colors"
            dir="ltr"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-1 z-50 bg-[var(--editor-bg-secondary)] rounded-lg 
                     border border-[var(--editor-border-default)] shadow-lg p-2 w-56"
        >
          {/* Native color picker */}
          <div className="mb-2">
            <input
              type="color"
              value={displayColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-full h-20 cursor-pointer rounded border-0"
            />
          </div>

          {/* Transparent button */}
          <button
            onClick={() => handleColorChange('transparent')}
            className={`w-full py-1.5 px-2 rounded text-xs mb-2 transition-colors
                       ${isTransparent 
                         ? 'bg-[var(--editor-accent-blue)] text-white' 
                         : 'bg-[var(--editor-bg-tertiary)] text-[var(--editor-text-secondary)] hover:text-[var(--editor-text-primary)]'}`}
          >
            ללא צבע (שקוף)
          </button>

          {/* Presets */}
          {showPresets && (
            <>
              <div className="text-[10px] text-[var(--editor-text-muted)] mb-1">צבעים מוכנים</div>
              <div className="grid grid-cols-8 gap-0.5">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`w-6 h-6 rounded-sm border transition-all
                               ${localValue === color 
                                 ? 'border-[var(--editor-accent-blue)] ring-1 ring-[var(--editor-accent-blue)]' 
                                 : 'border-[var(--editor-border-default)] hover:border-[var(--editor-border-hover)]'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Simple inline color (no popover)
interface EditorColorInlineProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function EditorColorInline({
  label,
  value,
  onChange,
  className = '',
}: EditorColorInlineProps) {
  return (
    <div className={`flex items-center justify-between py-2 group ${className}`}>
      <label className="text-xs text-[var(--editor-text-secondary)] group-hover:text-[var(--editor-text-primary)] transition-colors">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded border border-[var(--editor-border-default)] cursor-pointer
                     hover:border-[var(--editor-border-focus)] transition-colors"
        />
        <span className="text-xs text-[var(--editor-text-muted)] w-16" dir="ltr">
          {value || 'לא נבחר'}
        </span>
      </div>
    </div>
  );
}
