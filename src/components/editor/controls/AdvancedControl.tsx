'use client';

/**
 * AdvancedControl - Advanced settings for any section (Figma-style mini accordions)
 * הגדרות מתקדמות - ריווחים, מיקום, CSS מתקדם
 */

import { useState } from 'react';
import { EditorSelect } from '../ui/EditorSelect';

// Unit options
const UNIT_OPTIONS = [
  { value: 'px', label: 'PX' },
  { value: '%', label: '%' },
  { value: 'em', label: 'EM' },
  { value: 'rem', label: 'REM' },
];

// ============================================
// Mini Accordion Component (Figma style)
// ============================================
interface MiniAccordionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  endContent?: React.ReactNode;
}

function MiniAccordion({ title, defaultOpen = true, children, endContent }: MiniAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--editor-border-default)] last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 hover:bg-[var(--editor-bg-secondary)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg 
            className={`w-3 h-3 text-[var(--editor-text-muted)] transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`}
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
          <span className="text-xs font-medium text-[var(--editor-text-primary)]">{title}</span>
        </div>
        {endContent && (
          <div onClick={(e) => e.stopPropagation()}>
            {endContent}
          </div>
        )}
      </button>
      {isOpen && (
        <div className="pb-3 pl-5">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================
// Spacing Box Component (4 inputs in a row)
// ============================================
interface SpacingBoxProps {
  label: string;
  values: { top: string; right: string; bottom: string; left: string };
  defaults: { top: number; right: number; bottom: number; left: number };
  unit: string;
  onChange: (side: 'top' | 'right' | 'bottom' | 'left', value: string) => void;
  onChangeAll: (values: { top: string; right: string; bottom: string; left: string }) => void;
  onUnitChange: (unit: string) => void;
}

function SpacingBox({ label, values, defaults, unit, onChange, onChangeAll, onUnitChange }: SpacingBoxProps) {
  const [linked, setLinked] = useState(false);

  // Clean value - remove whitespace, keep only numbers and minus sign
  const cleanValue = (val: string): string => {
    const cleaned = val.trim();
    if (cleaned === '' || cleaned === '-') return cleaned;
    return cleaned.replace(/[^\d-]/g, '').replace(/(?!^)-/g, '');
  };

  const linkedValue = linked 
    ? (values.top || values.right || values.bottom || values.left || String(defaults.top))
    : null;

  const handleChange = (side: 'top' | 'right' | 'bottom' | 'left', value: string) => {
    const cleanedValue = cleanValue(value);
    const valueToSend = cleanedValue === '' ? String(defaults[side]) : cleanedValue;
    
    if (linked) {
      const allValue = cleanedValue === '' ? String(defaults.top) : cleanedValue;
      onChangeAll({ top: allValue, right: allValue, bottom: allValue, left: allValue });
    } else {
      onChange(side, valueToSend);
    }
  };

  const handleLinkToggle = () => {
    if (!linked) {
      const firstValue = values.top || String(defaults.top);
      onChangeAll({ top: firstValue, right: firstValue, bottom: firstValue, left: firstValue });
    }
    setLinked(!linked);
  };

  const getDisplayValue = (side: 'top' | 'right' | 'bottom' | 'left') => {
    if (linked) return linkedValue || String(defaults[side]);
    return values[side] || String(defaults[side]);
  };

  const isDifferentFromDefault = (
    values.top !== String(defaults.top) && values.top !== '' ||
    values.right !== String(defaults.right) && values.right !== '' ||
    values.bottom !== String(defaults.bottom) && values.bottom !== '' ||
    values.left !== String(defaults.left) && values.left !== ''
  );

  const handleReset = () => {
    onChangeAll({ 
      top: String(defaults.top), 
      right: String(defaults.right), 
      bottom: String(defaults.bottom), 
      left: String(defaults.left) 
    });
    setLinked(false);
  };

  return (
    <div className="py-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-[var(--editor-text-muted)]">{label}</span>
        <div className="flex items-center gap-1">
          <EditorSelect
            label=""
            value={unit}
            options={UNIT_OPTIONS}
            onChange={onUnitChange}
            compact
          />
          <button
            onClick={handleLinkToggle}
            className={`p-1 rounded transition-colors ${
              linked 
                ? 'bg-[var(--editor-accent-blue)] text-white' 
                : 'bg-[var(--editor-bg-tertiary)] text-[var(--editor-text-muted)] hover:text-[var(--editor-text-primary)]'
            }`}
            title={linked ? 'מקושר' : 'לא מקושר'}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {linked ? (
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              ) : (
                <>
                  <path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-3 3a5 5 0 0 0 0 7.07" />
                  <path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l3-3a5 5 0 0 0 0-7.07" />
                  <path d="M2 2l20 20" />
                </>
              )}
            </svg>
          </button>
          {isDifferentFromDefault && (
            <button
              onClick={handleReset}
              className="p-1 rounded transition-colors bg-[var(--editor-bg-tertiary)] text-[var(--editor-text-muted)] hover:text-red-500"
              title="אפס"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* 4 Inputs */}
      <div className="flex gap-1.5">
        {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
          <div key={side} className="flex-1">
            <input
              type="number"
              value={getDisplayValue(side)}
              onChange={(e) => handleChange(side, e.target.value)}
              className="w-full px-1 py-1.5 text-[11px] text-center bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                         rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto"
              dir="ltr"
            />
            <div className="text-[9px] text-center text-[var(--editor-text-muted)] mt-0.5">
              {side === 'top' ? '↑' : side === 'right' ? '→' : side === 'bottom' ? '↓' : '←'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Animation Settings Component
// ============================================
type AnimationType = 'none' | 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight';

interface AnimationSettingsProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

function AnimationSettings({ settings, onChange }: AnimationSettingsProps) {
  const animation = (settings.animation as AnimationType) || 'none';
  const animationDuration = (settings.animationDuration as number) || 0.6;

  const animationOptions: { value: AnimationType; label: string; icon: React.ReactNode }[] = [
    { 
      value: 'none', 
      label: 'ללא',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M4.93 4.93l14.14 14.14" />
        </svg>
      )
    },
    { 
      value: 'fadeIn', 
      label: 'פייד',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" opacity="0.3" />
          <circle cx="12" cy="12" r="6" />
        </svg>
      )
    },
    { 
      value: 'slideUp', 
      label: 'מלמטה',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      )
    },
    { 
      value: 'slideDown', 
      label: 'מלמעלה',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      )
    },
    { 
      value: 'slideRight', 
      label: 'מימין',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      )
    },
    { 
      value: 'slideLeft', 
      label: 'משמאל',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      )
    },
  ];

  return (
    <div className="space-y-3">
      {/* Animation Type */}
      <div>
        <label className="block text-[11px] text-[var(--editor-text-muted)] mb-2">סוג אנימציה</label>
        <div className="grid grid-cols-3 gap-1.5">
          {animationOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange('animation', opt.value)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border transition-all ${
                animation === opt.value
                  ? 'border-[var(--editor-accent-blue)] bg-[var(--editor-accent-blue)]/5 text-[var(--editor-accent-blue)]'
                  : 'border-[var(--editor-border-default)] text-[var(--editor-text-muted)] hover:border-[var(--editor-border-hover)] hover:text-[var(--editor-text-primary)]'
              }`}
            >
              {opt.icon}
              <span className="text-[9px]">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration - only show if animation is not 'none' */}
      {animation !== 'none' && (
        <div className="flex items-center justify-between py-2">
          <label className="text-[11px] text-[var(--editor-text-muted)]">משך אנימציה</label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={animationDuration}
              onChange={(e) => onChange('animationDuration', parseFloat(e.target.value) || 0.6)}
              step={0.1}
              min={0.1}
              max={3}
              className="w-16 px-2 py-1.5 text-[11px] bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                         rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none text-center"
              dir="ltr"
            />
            <span className="text-[10px] text-[var(--editor-text-muted)]">שניות</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Main AdvancedControl Component
// ============================================
interface SpacingDefaults {
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
}

interface AdvancedControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onChangeMultiple?: (updates: Record<string, unknown>) => void;
  onDelete?: () => void;
  defaults?: SpacingDefaults;
}

const DEFAULT_SPACING: SpacingDefaults = {
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,
  paddingTop: 64,
  paddingRight: 16,
  paddingBottom: 64,
  paddingLeft: 16,
};

export function AdvancedControl({ settings, onChange, onChangeMultiple, onDelete, defaults }: AdvancedControlProps) {
  const sectionDefaults = { ...DEFAULT_SPACING, ...defaults };

  const getSpacingValue = (key: keyof SpacingDefaults): string => {
    const val = settings[key];
    if (val === null || val === undefined || val === '') {
      return String(sectionDefaults[key] ?? 0);
    }
    return String(val);
  };

  // Margin
  const marginUnit = (settings.marginUnit as string) || 'px';
  const marginValues = {
    top: getSpacingValue('marginTop'),
    right: getSpacingValue('marginRight'),
    bottom: getSpacingValue('marginBottom'),
    left: getSpacingValue('marginLeft'),
  };

  // Padding
  const paddingUnit = (settings.paddingUnit as string) || 'px';
  const paddingValues = {
    top: getSpacingValue('paddingTop'),
    right: getSpacingValue('paddingRight'),
    bottom: getSpacingValue('paddingBottom'),
    left: getSpacingValue('paddingLeft'),
  };

  // Z-Index & CSS
  const zIndex = (settings.zIndex as string) || '';
  const customId = (settings.customId as string) || '';
  const customClass = (settings.customClass as string) || '';

  const batchUpdate = (updates: Record<string, unknown>) => {
    if (onChangeMultiple) {
      onChangeMultiple(updates);
    } else {
      Object.entries(updates).forEach(([key, value]) => {
        onChange(key, value);
      });
    }
  };

  return (
    <div>
      {/* ============================================ */}
      {/* SPACING ACCORDION - ריווחים */}
      {/* ============================================ */}
      <MiniAccordion title="ריווחים" defaultOpen={true}>
        <SpacingBox
          label="שוליים פנימיים (Padding)"
          values={paddingValues}
          defaults={{ 
            top: sectionDefaults.paddingTop ?? 64, 
            right: sectionDefaults.paddingRight ?? 16, 
            bottom: sectionDefaults.paddingBottom ?? 64, 
            left: sectionDefaults.paddingLeft ?? 16 
          }}
          unit={paddingUnit}
          onChange={(side, value) => onChange(`padding${side.charAt(0).toUpperCase() + side.slice(1)}`, value)}
          onChangeAll={(vals) => batchUpdate({
            paddingTop: vals.top,
            paddingRight: vals.right,
            paddingBottom: vals.bottom,
            paddingLeft: vals.left,
          })}
          onUnitChange={(unit) => onChange('paddingUnit', unit)}
        />

        <SpacingBox
          label="שוליים חיצוניים (Margin)"
          values={marginValues}
          defaults={{ 
            top: sectionDefaults.marginTop ?? 0, 
            right: sectionDefaults.marginRight ?? 0, 
            bottom: sectionDefaults.marginBottom ?? 0, 
            left: sectionDefaults.marginLeft ?? 0 
          }}
          unit={marginUnit}
          onChange={(side, value) => onChange(`margin${side.charAt(0).toUpperCase() + side.slice(1)}`, value)}
          onChangeAll={(vals) => batchUpdate({
            marginTop: vals.top,
            marginRight: vals.right,
            marginBottom: vals.bottom,
            marginLeft: vals.left,
          })}
          onUnitChange={(unit) => onChange('marginUnit', unit)}
        />
      </MiniAccordion>

      {/* ============================================ */}
      {/* POSITION ACCORDION - מיקום */}
      {/* ============================================ */}
      <MiniAccordion title="מיקום" defaultOpen={false}>
        <div className="py-2">
          <label className="block text-[11px] text-[var(--editor-text-muted)] mb-1.5">Z-Index</label>
          <input
            type="number"
            value={zIndex}
            onChange={(e) => onChange('zIndex', e.target.value)}
            placeholder="auto"
            className="w-20 px-2 py-1.5 text-[11px] bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                       rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none"
            dir="ltr"
          />
          <p className="text-[9px] text-[var(--editor-text-muted)] mt-1">
            מספר גבוה יותר = מעל אלמנטים אחרים
          </p>
        </div>
      </MiniAccordion>

      {/* ============================================ */}
      {/* ANIMATION ACCORDION - אנימציה */}
      {/* ============================================ */}
      <MiniAccordion title="אנימציה" defaultOpen={false}>
        <AnimationSettings settings={settings} onChange={onChange} />
      </MiniAccordion>

      {/* ============================================ */}
      {/* CSS ACCORDION - CSS מתקדם */}
      {/* ============================================ */}
      <MiniAccordion title="CSS מתקדם" defaultOpen={false}>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-[var(--editor-text-muted)] mb-1.5">CSS ID</label>
            <input
              type="text"
              value={customId}
              onChange={(e) => onChange('customId', e.target.value)}
              placeholder="my-section"
              className="w-full px-2 py-1.5 text-[11px] bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                         rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[var(--editor-text-muted)] mb-1.5">CSS Classes</label>
            <input
              type="text"
              value={customClass}
              onChange={(e) => onChange('customClass', e.target.value)}
              placeholder="class1 class2"
              className="w-full px-2 py-1.5 text-[11px] bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                         rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none"
              dir="ltr"
            />
          </div>
        </div>
      </MiniAccordion>

      {/* ============================================ */}
      {/* DELETE SECTION */}
      {/* ============================================ */}
      {onDelete && (
        <div className="pt-4 border-t border-[var(--editor-border-default)] mt-2">
          <button
            onClick={onDelete}
            className="w-full py-2.5 px-4 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 
                       border border-red-200 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
            </svg>
            מחק סקשן
          </button>
        </div>
      )}
    </div>
  );
}
