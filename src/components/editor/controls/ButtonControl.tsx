'use client';

/**
 * ButtonControl - Button styling settings with theme support
 * הגדרות עיצוב כפתור עם תמיכה בבהיר וכהה
 */

import { useState, useRef, useEffect } from 'react';
import { Settings2, X } from 'lucide-react';
import { EditorColorInline } from '../ui/EditorColorPicker';
import { EditorSlider } from '../ui/EditorSlider';

interface ButtonControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onMultipleChange?: (updates: Record<string, unknown>) => void;  // For batch updates
  prefix?: string;  // Default: 'button'
  showAdvanced?: boolean;
}

export function ButtonControl({
  settings,
  onChange,
  onMultipleChange,
  prefix = 'button',
  showAdvanced = true,
}: ButtonControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get current values - check buttonBackground FIRST since that's what hero uses
  const bgColor = (settings[`${prefix}Background`] as string) || 
                  (settings[`${prefix}BgColor`] as string) || 
                  (settings[`${prefix}BackgroundColor`] as string) || 
                  '#ffffff';
  const textColor = (settings[`${prefix}TextColor`] as string) || '#000000';
  const borderColor = (settings[`${prefix}BorderColor`] as string) || bgColor;
  const borderRadius = (settings[`${prefix}BorderRadius`] as number) ?? 0;
  const borderWidth = (settings[`${prefix}BorderWidth`] as number) ?? 1;
  const buttonStyle = (settings[`${prefix}Style`] as string) || 'filled';

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

  // Handle style change with all color updates - use batch update to prevent race conditions
  const handleStyleChange = (style: string) => {
    let updates: Record<string, unknown> = {
      [`${prefix}Style`]: style,
    };
    
    // Update colors based on style - save with both key formats for compatibility
    if (style === 'filled') {
      // Default filled: white button with black text (common in hero sections)
      updates = {
        ...updates,
        [`${prefix}Background`]: '#ffffff',
        [`${prefix}BgColor`]: '#ffffff',
        [`${prefix}TextColor`]: '#000000',
        [`${prefix}BorderColor`]: '#ffffff',
        [`${prefix}BorderWidth`]: 1,
        [`${prefix}TextDecoration`]: 'none',
      };
    } else if (style === 'outline') {
      // Outline: transparent background, white text and border
      updates = {
        ...updates,
        [`${prefix}Background`]: 'transparent',
        [`${prefix}BgColor`]: 'transparent',
        [`${prefix}TextColor`]: '#ffffff',
        [`${prefix}BorderColor`]: '#ffffff',
        [`${prefix}BorderWidth`]: 2, // Make border more visible
        [`${prefix}TextDecoration`]: 'none',
      };
    } else if (style === 'underline') {
      // Underline: transparent background, text with underline
      updates = {
        ...updates,
        [`${prefix}Background`]: 'transparent',
        [`${prefix}BgColor`]: 'transparent',
        [`${prefix}TextColor`]: '#ffffff',
        [`${prefix}BorderColor`]: 'transparent',
        [`${prefix}BorderWidth`]: 0,
        [`${prefix}TextDecoration`]: 'underline',
      };
    }
    
    // Use batch update if available, otherwise fall back to sequential updates
    if (onMultipleChange) {
      onMultipleChange(updates);
    } else {
      // Fallback: apply updates one by one (may cause race conditions)
      Object.entries(updates).forEach(([key, value]) => {
        onChange(key, value);
      });
    }
  };
  
  // Helper to save with both key formats
  const handleBgColorChange = (value: string) => {
    onChange(`${prefix}Background`, value);
    onChange(`${prefix}BgColor`, value);
  };

  return (
    <div className="relative py-2 group">
      <div className="flex items-center justify-between">
        <label className="text-xs text-[var(--editor-text-secondary)] group-hover:text-[var(--editor-text-primary)] transition-colors">
          עיצוב כפתור
        </label>
        
        {/* Button preview */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors cursor-pointer
                     ${isOpen 
                       ? 'bg-[var(--editor-accent-blue)] text-white' 
                       : 'bg-[var(--editor-bg-tertiary)] text-[var(--editor-text-secondary)] hover:text-[var(--editor-text-primary)] border border-[var(--editor-border-default)]'}`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span className="text-xs">הגדרות</span>
        </button>
      </div>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-2 z-50 bg-[var(--editor-bg-secondary)] rounded-lg 
                     border border-[var(--editor-border-default)] shadow-lg p-4 w-72"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--editor-border-default)]">
            <span className="text-xs font-medium text-[var(--editor-text-primary)]">עיצוב כפתור</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-[var(--editor-bg-hover)] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-[var(--editor-text-muted)]" />
            </button>
          </div>

          {/* Style preset - Custom implementation */}
          <div className="py-2 mb-2">
            <label className="block text-xs text-[var(--editor-text-secondary)] mb-2">
              סגנון
            </label>
            <div className="flex gap-1 bg-[var(--editor-bg-tertiary)] rounded p-1 border border-[var(--editor-border-default)]">
              <button
                type="button"
                onClick={() => handleStyleChange('filled')}
                className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-all cursor-pointer
                           ${buttonStyle === 'filled' 
                             ? 'bg-[var(--editor-bg-primary)] text-[var(--editor-text-primary)] shadow-sm' 
                             : 'text-[var(--editor-text-muted)] hover:text-[var(--editor-text-secondary)]'}`}
              >
                מלא
              </button>
              <button
                type="button"
                onClick={() => handleStyleChange('outline')}
                className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-all cursor-pointer
                           ${buttonStyle === 'outline' 
                             ? 'bg-[var(--editor-bg-primary)] text-[var(--editor-text-primary)] shadow-sm' 
                             : 'text-[var(--editor-text-muted)] hover:text-[var(--editor-text-secondary)]'}`}
              >
                מסגרת
              </button>
              <button
                type="button"
                onClick={() => handleStyleChange('underline')}
                className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-all cursor-pointer
                           ${buttonStyle === 'underline' 
                             ? 'bg-[var(--editor-bg-primary)] text-[var(--editor-text-primary)] shadow-sm' 
                             : 'text-[var(--editor-text-muted)] hover:text-[var(--editor-text-secondary)]'}`}
              >
                קו תחתון
              </button>
            </div>
          </div>

          {/* Colors */}
          <EditorColorInline
            label="צבע רקע"
            value={bgColor}
            onChange={handleBgColorChange}
          />
          
          <EditorColorInline
            label="צבע טקסט"
            value={textColor}
            onChange={(v) => onChange(`${prefix}TextColor`, v)}
          />
          
          <EditorColorInline
            label="צבע מסגרת"
            value={borderColor}
            onChange={(v) => onChange(`${prefix}BorderColor`, v)}
          />

          {showAdvanced && (
            <>
              {/* Border radius */}
              <EditorSlider
                label="עיגול פינות"
                value={borderRadius}
                onChange={(v) => onChange(`${prefix}BorderRadius`, v)}
                min={0}
                max={50}
                suffix="px"
              />

              {/* Border width */}
              <EditorSlider
                label="עובי מסגרת"
                value={borderWidth}
                onChange={(v) => onChange(`${prefix}BorderWidth`, v)}
                min={0}
                max={5}
                suffix="px"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Simplified inline version
interface ButtonColorsInlineProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  prefix?: string;
}

export function ButtonColorsInline({
  settings,
  onChange,
  prefix = 'button',
}: ButtonColorsInlineProps) {
  const bgColor = (settings[`${prefix}BgColor`] as string) || 
                  (settings[`${prefix}BackgroundColor`] as string) || 
                  'transparent';
  const textColor = (settings[`${prefix}TextColor`] as string) || '#000000';
  const borderColor = (settings[`${prefix}BorderColor`] as string) || '#000000';

  return (
    <div className="space-y-2">
      <EditorColorInline
        label="רקע כפתור"
        value={bgColor}
        onChange={(v) => onChange(`${prefix}BgColor`, v)}
      />
      <EditorColorInline
        label="טקסט כפתור"
        value={textColor}
        onChange={(v) => onChange(`${prefix}TextColor`, v)}
      />
      <EditorColorInline
        label="מסגרת כפתור"
        value={borderColor}
        onChange={(v) => onChange(`${prefix}BorderColor`, v)}
      />
    </div>
  );
}
