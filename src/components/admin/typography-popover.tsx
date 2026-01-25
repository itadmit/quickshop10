'use client';

import { useState, useRef, useEffect } from 'react';
import { Pencil, X, Type, RotateCcw, Monitor, Smartphone } from 'lucide-react';

interface TypographySettings {
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  fontSizeUnit?: 'px' | 'rem';
  fontSizeMobile?: number;
  fontSizeMobileUnit?: 'px' | 'rem';
  fontWeight?: 'light' | 'normal' | 'medium' | 'bold' | 'extrabold';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: number;
  letterSpacingUnit?: 'px' | 'rem';
  lineHeight?: number;
  lineHeightUnit?: 'px' | 'rem';
}

interface TypographyPopoverProps {
  label: string;
  value: TypographySettings;
  onChange: (settings: TypographySettings) => void;
  defaultFontFamily?: string;
  defaultColor?: string;
}

const FONT_FAMILIES = [
  { value: 'default', label: 'ברירת מחדל' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Lucida Console', label: 'Lucida Console' },
];

const WEIGHTS = [
  { value: 'light', label: 'דק' },
  { value: 'normal', label: 'רגיל' },
  { value: 'medium', label: 'בינוני' },
  { value: 'bold', label: 'מודגש' },
  { value: 'extrabold', label: 'מודגש מאוד' },
];

const TEXT_TRANSFORM = [
  { value: 'none', label: 'רגיל' },
  { value: 'uppercase', label: 'אותיות גדולות' },
  { value: 'capitalize', label: 'אות גדולה בהתחלה' },
  { value: 'lowercase', label: 'אותיות קטנות' },
];

export function TypographyPopover({
  label,
  value,
  onChange,
  defaultFontFamily = 'default',
  defaultColor = '#000000',
}: TypographyPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Local state for mobile font size to allow independent dragging
  const [localMobileFontSize, setLocalMobileFontSize] = useState<number | undefined>(value.fontSizeMobile);
  
  // Sync local state when value prop changes from parent
  useEffect(() => {
    if (value.fontSizeMobile !== undefined) {
      setLocalMobileFontSize(value.fontSizeMobile);
    }
  }, [value.fontSizeMobile]);

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
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const updateSetting = <K extends keyof TypographySettings>(
    key: K,
    newValue: TypographySettings[K]
  ) => {
    onChange({ ...value, [key]: newValue });
  };
  
  const updateMobileFontSize = (newSize: number) => {
    setLocalMobileFontSize(newSize);
    onChange({ ...value, fontSizeMobile: newSize });
  };

  const resetToDefaults = () => {
    onChange({
      color: defaultColor,
      fontFamily: defaultFontFamily,
      fontSize: 16,
      fontSizeUnit: 'px',
      fontWeight: 'normal',
      textTransform: 'none',
      letterSpacing: 0,
      letterSpacingUnit: 'px',
      lineHeight: 1.5,
      lineHeightUnit: 'rem',
    });
  };

  const hasCustomSettings = 
    (value.fontFamily && value.fontFamily !== defaultFontFamily) ||
    (value.fontSize && value.fontSize !== 16) ||
    (value.fontWeight && value.fontWeight !== 'normal') ||
    (value.textTransform && value.textTransform !== 'none') ||
    (value.letterSpacing && value.letterSpacing !== 0) ||
    (value.lineHeight && value.lineHeight !== 1.5);

  return (
    <div className="relative">
      {/* Label and Button Row */}
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-gray-700">{label}</label>
        <div className="flex items-center gap-1">
          {/* Color picker - separate from modal */}
          <label className="relative cursor-pointer">
            <div 
              className="w-5 h-5 rounded border border-gray-200 hover:border-gray-400 transition-colors"
              style={{ backgroundColor: value.color || defaultColor }}
            />
            <input
              type="color"
              value={value.color || defaultColor}
              onChange={(e) => updateSetting('color', e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
          {/* Edit button for typography modal */}
          <button
            ref={buttonRef}
            onClick={() => setIsOpen(!isOpen)}
            className={`
              p-1.5 rounded hover:bg-gray-100 transition-colors
              ${isOpen ? 'bg-gray-100' : ''}
              ${hasCustomSettings ? 'text-blue-600' : 'text-gray-400'}
            `}
            title="עריכת טיפוגרפיה"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-72 max-h-[600px] overflow-y-auto"
          style={{ direction: 'rtl' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-sm">טיפוגרפיה</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={resetToDefaults}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                title="איפוס לברירת מחדל"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 space-y-4">
            {/* Font Family */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">פונט</label>
              <select
                value={value.fontFamily || defaultFontFamily}
                onChange={(e) => updateSetting('fontFamily', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font.value} value={font.value}>{font.label}</option>
                ))}
              </select>
            </div>

            {/* Font Size - Desktop */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500 flex items-center gap-1">
                  <Monitor className="w-3 h-3" />
                  גודל (דסקטופ)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={value.fontSize || 16}
                    onChange={(e) => updateSetting('fontSize', parseFloat(e.target.value) || 16)}
                    className="w-14 text-xs border border-gray-200 rounded px-1.5 py-0.5 text-center"
                    min="8"
                    max="200"
                  />
                  <select
                    value={value.fontSizeUnit || 'px'}
                    onChange={(e) => updateSetting('fontSizeUnit', e.target.value as 'px' | 'rem')}
                    className="text-xs border border-gray-200 rounded px-1 py-0.5"
                  >
                    <option value="px">px</option>
                    <option value="rem">rem</option>
                  </select>
                </div>
              </div>
              <div className="px-2">
                <input
                  type="range"
                  min="8"
                  max="200"
                  value={value.fontSize || 16}
                  onChange={(e) => updateSetting('fontSize', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Font Size - Mobile */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  גודל (מובייל)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={localMobileFontSize ?? value.fontSize ?? 16}
                    onChange={(e) => updateMobileFontSize(parseFloat(e.target.value) || 16)}
                    className="w-14 text-xs border border-gray-200 rounded px-1.5 py-0.5 text-center"
                    min="8"
                    max="200"
                  />
                  <select
                    value={value.fontSizeMobileUnit || value.fontSizeUnit || 'px'}
                    onChange={(e) => updateSetting('fontSizeMobileUnit', e.target.value as 'px' | 'rem')}
                    className="text-xs border border-gray-200 rounded px-1 py-0.5"
                  >
                    <option value="px">px</option>
                    <option value="rem">rem</option>
                  </select>
                </div>
              </div>
              <div className="px-2">
                <input
                  type="range"
                  min="8"
                  max="200"
                  value={localMobileFontSize ?? value.fontSize ?? 16}
                  onChange={(e) => updateMobileFontSize(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Font Weight */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">עובי</label>
              <select
                value={value.fontWeight || 'normal'}
                onChange={(e) => updateSetting('fontWeight', e.target.value as TypographySettings['fontWeight'])}
                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5"
              >
                {WEIGHTS.map((weight) => (
                  <option key={weight.value} value={weight.value}>{weight.label}</option>
                ))}
              </select>
            </div>

            {/* Text Transform */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">טרנספורם</label>
              <select
                value={value.textTransform || 'none'}
                onChange={(e) => updateSetting('textTransform', e.target.value as TypographySettings['textTransform'])}
                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5"
              >
                {TEXT_TRANSFORM.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Letter Spacing */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500">מרווח בין אותיות</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={value.letterSpacing || 0}
                    onChange={(e) => updateSetting('letterSpacing', parseFloat(e.target.value) || 0)}
                    className="w-14 text-xs border border-gray-200 rounded px-1.5 py-0.5 text-center"
                    min="-5"
                    max="20"
                    step="0.1"
                  />
                  <select
                    value={value.letterSpacingUnit || 'px'}
                    onChange={(e) => updateSetting('letterSpacingUnit', e.target.value as 'px' | 'rem')}
                    className="text-xs border border-gray-200 rounded px-1 py-0.5"
                  >
                    <option value="px">px</option>
                    <option value="rem">rem</option>
                  </select>
                </div>
              </div>
              <div className="px-2">
                <input
                  type="range"
                  min="-5"
                  max="20"
                  step="0.1"
                  value={value.letterSpacing || 0}
                  onChange={(e) => updateSetting('letterSpacing', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Line Height */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500">גובה שורה</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={value.lineHeight || 1.5}
                    onChange={(e) => updateSetting('lineHeight', parseFloat(e.target.value) || 1.5)}
                    className="w-14 text-xs border border-gray-200 rounded px-1.5 py-0.5 text-center"
                    min="0.5"
                    max="5"
                    step="0.1"
                  />
                  <select
                    value={value.lineHeightUnit || 'rem'}
                    onChange={(e) => updateSetting('lineHeightUnit', e.target.value as 'px' | 'rem')}
                    className="text-xs border border-gray-200 rounded px-1 py-0.5"
                  >
                    <option value="rem">rem</option>
                    <option value="px">px</option>
                  </select>
                </div>
              </div>
              <div className="px-2">
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={value.lineHeight || 1.5}
                  onChange={(e) => updateSetting('lineHeight', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
