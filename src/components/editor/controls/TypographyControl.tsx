'use client';

/**
 * TypographyControl - Typography settings for any text element
 * הגדרות טיפוגרפיה לכל אלמנט טקסט
 * תומך בבהיר וכהה
 */

import { useState, useRef, useEffect } from 'react';
import { Type, X } from 'lucide-react';
import { EditorSlider, EditorDualSlider } from '../ui/EditorSlider';
import { EditorColorInline } from '../ui/EditorColorPicker';
import { EditorSelect } from '../ui/EditorSelect';

// Font weights
const FONT_WEIGHTS = [
  { value: 'light', label: 'דק' },
  { value: 'normal', label: 'רגיל' },
  { value: 'medium', label: 'בינוני' },
  { value: 'semibold', label: 'חצי מודגש' },
  { value: 'bold', label: 'מודגש' },
  { value: 'extrabold', label: 'מודגש מאוד' },
];

interface TypographyControlProps {
  label: string;
  prefix: string;  // e.g., 'title', 'subtitle', 'text'
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  defaultSize?: number;
  defaultSizeMobile?: number;
  defaultColor?: string;
  defaultWeight?: string;
  showMobileSize?: boolean;
  minSize?: number;
  maxSize?: number;
}

export function TypographyControl({
  label,
  prefix,
  settings,
  onChange,
  defaultSize = 16,
  defaultSizeMobile,
  defaultColor = '#000000',
  defaultWeight = 'normal',
  showMobileSize = true,
  minSize = 10,
  maxSize = 120,
}: TypographyControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get current values
  const size = (settings[`${prefix}Size`] as number) || defaultSize;
  const sizeMobile = (settings[`${prefix}SizeMobile`] as number) || defaultSizeMobile || size;
  const color = (settings[`${prefix}Color`] as string) || defaultColor;
  const weight = (settings[`${prefix}Weight`] as string) || defaultWeight;

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

  // Update functions - these trigger postMessage via the parent's onChange
  const updateSize = (value: number) => onChange(`${prefix}Size`, value);
  const updateSizeMobile = (value: number) => onChange(`${prefix}SizeMobile`, value);
  const updateColor = (value: string) => onChange(`${prefix}Color`, value);
  const updateWeight = (value: string) => onChange(`${prefix}Weight`, value);

  return (
    <div className="relative py-2 group">
      <div className="flex items-center justify-between">
        <label className="text-xs text-[var(--editor-text-secondary)] group-hover:text-[var(--editor-text-primary)] transition-colors">
          {label}
        </label>
        
        {/* Typography button */}
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors
                     ${isOpen 
                       ? 'bg-[var(--editor-accent-blue)] text-white' 
                       : 'bg-[var(--editor-bg-tertiary)] text-[var(--editor-text-secondary)] hover:text-[var(--editor-text-primary)] border border-[var(--editor-border-default)]'}`}
        >
          <Type className="w-3.5 h-3.5" />
          <span className="text-xs">{size}px</span>
          <div 
            className="w-3 h-3 rounded-full border border-current"
            style={{ backgroundColor: color }}
          />
        </button>
      </div>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-2 z-50 bg-[var(--editor-bg-secondary)] rounded-lg 
                     border border-[var(--editor-border-default)] shadow-lg p-4 w-64 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--editor-border-default)]">
            <span className="text-xs font-medium text-[var(--editor-text-primary)]">טיפוגרפיה - {label}</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-[var(--editor-bg-hover)] transition-colors"
            >
              <X className="w-3.5 h-3.5 text-[var(--editor-text-muted)]" />
            </button>
          </div>

          {/* Size */}
          {showMobileSize ? (
            <EditorDualSlider
              label="גודל טקסט"
              desktopValue={size}
              mobileValue={sizeMobile}
              onDesktopChange={updateSize}
              onMobileChange={updateSizeMobile}
              min={minSize}
              max={maxSize}
              suffix="px"
            />
          ) : (
            <EditorSlider
              label="גודל טקסט"
              value={size}
              onChange={updateSize}
              min={minSize}
              max={maxSize}
              suffix="px"
            />
          )}

          {/* Weight */}
          <EditorSelect
            label="משקל"
            value={weight}
            options={FONT_WEIGHTS}
            onChange={updateWeight}
          />

          {/* Color */}
          <EditorColorInline
            label="צבע"
            value={color}
            onChange={updateColor}
          />
        </div>
      )}
    </div>
  );
}

// Simplified inline version (no popover)
interface TypographyInlineProps {
  label: string;
  prefix: string;
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  defaultSize?: number;
  defaultColor?: string;
  minSize?: number;
  maxSize?: number;
}

export function TypographyInline({
  label,
  prefix,
  settings,
  onChange,
  defaultSize = 16,
  defaultColor = '#000000',
  minSize = 10,
  maxSize = 120,
}: TypographyInlineProps) {
  const size = (settings[`${prefix}Size`] as number) || defaultSize;
  const color = (settings[`${prefix}Color`] as string) || defaultColor;

  return (
    <div className="space-y-2 py-2">
      <label className="block text-xs text-[var(--editor-text-secondary)]">{label}</label>
      <div className="flex items-center gap-3">
        {/* Size */}
        <div className="flex items-center gap-1 bg-[var(--editor-bg-tertiary)] rounded px-2 py-1 border border-[var(--editor-border-default)]">
          <input
            type="number"
            value={size}
            onChange={(e) => onChange(`${prefix}Size`, Number(e.target.value))}
            min={minSize}
            max={maxSize}
            className="w-10 bg-transparent text-[var(--editor-text-primary)] text-xs text-center outline-none"
            dir="ltr"
          />
          <span className="text-[var(--editor-text-muted)] text-xs">px</span>
        </div>
        
        {/* Color */}
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(`${prefix}Color`, e.target.value)}
          className="w-7 h-7 rounded border border-[var(--editor-border-default)] cursor-pointer"
        />
      </div>
    </div>
  );
}
