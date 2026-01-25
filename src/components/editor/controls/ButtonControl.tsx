'use client';

/**
 * ButtonControl - Button styling settings with theme support
 * הגדרות עיצוב כפתור עם תמיכה בבהיר וכהה
 */

import { useState, useRef, useEffect } from 'react';
import { Settings2, X } from 'lucide-react';
import { EditorColorInline } from '../ui/EditorColorPicker';
import { EditorSlider } from '../ui/EditorSlider';
import { EditorToggleGroup } from '../ui/EditorSelect';

// Button styles presets
const BUTTON_STYLES = [
  { value: 'filled', label: 'מלא' },
  { value: 'outline', label: 'מסגרת' },
  { value: 'ghost', label: 'שקוף' },
];

interface ButtonControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  prefix?: string;  // Default: 'button'
  showAdvanced?: boolean;
}

export function ButtonControl({
  settings,
  onChange,
  prefix = 'button',
  showAdvanced = true,
}: ButtonControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get current values
  const bgColor = (settings[`${prefix}BgColor`] as string) || 
                  (settings[`${prefix}BackgroundColor`] as string) || 
                  'transparent';
  const textColor = (settings[`${prefix}TextColor`] as string) || '#000000';
  const borderColor = (settings[`${prefix}BorderColor`] as string) || '#000000';
  const borderRadius = (settings[`${prefix}BorderRadius`] as number) || 0;
  const borderWidth = (settings[`${prefix}BorderWidth`] as number) || 1;
  const buttonStyle = (settings[`${prefix}Style`] as string) || 'outline';

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

  return (
    <div className="relative py-2 group">
      <div className="flex items-center justify-between">
        <label className="text-xs text-[var(--editor-text-secondary)] group-hover:text-[var(--editor-text-primary)] transition-colors">
          עיצוב כפתור
        </label>
        
        {/* Button preview */}
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors
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
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--editor-border-default)]">
            <span className="text-xs font-medium text-[var(--editor-text-primary)]">עיצוב כפתור</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-[var(--editor-bg-hover)] transition-colors"
            >
              <X className="w-3.5 h-3.5 text-[var(--editor-text-muted)]" />
            </button>
          </div>

          {/* Preview */}
          <div className="mb-4 p-4 bg-[var(--editor-bg-primary)] rounded-lg flex items-center justify-center">
            <span
              className="px-4 py-2 text-sm transition-all"
              style={{
                backgroundColor: bgColor === 'transparent' ? 'transparent' : bgColor,
                color: textColor,
                border: `${borderWidth}px solid ${borderColor}`,
                borderRadius: `${borderRadius}px`,
              }}
            >
              כפתור לדוגמה
            </span>
          </div>

          {/* Style preset */}
          <EditorToggleGroup
            label="סגנון"
            value={buttonStyle}
            options={BUTTON_STYLES}
            onChange={(v) => {
              onChange(`${prefix}Style`, v);
              // Auto-set colors based on style
              if (v === 'filled') {
                onChange(`${prefix}BgColor`, '#000000');
                onChange(`${prefix}TextColor`, '#ffffff');
              } else if (v === 'outline') {
                onChange(`${prefix}BgColor`, 'transparent');
                onChange(`${prefix}TextColor`, '#000000');
              } else if (v === 'ghost') {
                onChange(`${prefix}BgColor`, 'transparent');
                onChange(`${prefix}BorderColor`, 'transparent');
              }
            }}
          />

          {/* Colors */}
          <EditorColorInline
            label="צבע רקע"
            value={bgColor}
            onChange={(v) => onChange(`${prefix}BgColor`, v)}
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
