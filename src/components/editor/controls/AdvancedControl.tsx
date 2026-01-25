'use client';

/**
 * AdvancedControl - Advanced settings for any section
 * הגדרות מתקדמות - שוליים חיצוניים, שוליים פנימיים, Z-Index, CSS ID/Classes
 */

import { useState } from 'react';
import { EditorInput } from '../ui/EditorInput';
import { EditorSelect } from '../ui/EditorSelect';

// Unit options
const UNIT_OPTIONS = [
  { value: 'px', label: 'PX' },
  { value: '%', label: '%' },
  { value: 'em', label: 'EM' },
  { value: 'rem', label: 'REM' },
];

interface SpacingBoxProps {
  label: string;
  values: { top: string; right: string; bottom: string; left: string };
  unit: string;
  onChange: (side: 'top' | 'right' | 'bottom' | 'left', value: string) => void;
  onUnitChange: (unit: string) => void;
}

function SpacingBox({ label, values, unit, onChange, onUnitChange }: SpacingBoxProps) {
  const [linked, setLinked] = useState(false);

  const handleChange = (side: 'top' | 'right' | 'bottom' | 'left', value: string) => {
    if (linked) {
      // Update all sides when linked
      onChange('top', value);
      onChange('right', value);
      onChange('bottom', value);
      onChange('left', value);
    } else {
      onChange(side, value);
    }
  };

  return (
    <div className="py-3">
      {/* Header row with label, unit selector and link button */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[var(--editor-text-secondary)]">{label}</span>
        <div className="flex items-center gap-2">
          <EditorSelect
            label=""
            value={unit}
            options={UNIT_OPTIONS}
            onChange={onUnitChange}
            compact
          />
          {/* Link button */}
          <button
            onClick={() => setLinked(!linked)}
            className={`p-1.5 rounded transition-colors ${
              linked 
                ? 'bg-[var(--editor-accent-blue)] text-white' 
                : 'bg-[var(--editor-bg-tertiary)] text-[var(--editor-text-muted)] hover:text-[var(--editor-text-primary)]'
            }`}
            title={linked ? 'מקושר - שינוי אחד משפיע על כולם' : 'לא מקושר'}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        </div>
      </div>
      
      {/* Single row of 4 inputs - Elementor style */}
      <div className="flex gap-2">
        {/* Top */}
        <div className="flex-1">
          <input
            type="text"
            value={values.top}
            onChange={(e) => handleChange('top', e.target.value)}
            placeholder="-"
            className="w-full px-2 py-2 text-xs text-center bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                       rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none"
            dir="ltr"
          />
          <div className="text-[9px] text-center text-[var(--editor-text-muted)] mt-1">עליון</div>
        </div>
        
        {/* Right */}
        <div className="flex-1">
          <input
            type="text"
            value={values.right}
            onChange={(e) => handleChange('right', e.target.value)}
            placeholder="-"
            className="w-full px-2 py-2 text-xs text-center bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                       rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none"
            dir="ltr"
          />
          <div className="text-[9px] text-center text-[var(--editor-text-muted)] mt-1">ימין</div>
        </div>
        
        {/* Bottom */}
        <div className="flex-1">
          <input
            type="text"
            value={values.bottom}
            onChange={(e) => handleChange('bottom', e.target.value)}
            placeholder="-"
            className="w-full px-2 py-2 text-xs text-center bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                       rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none"
            dir="ltr"
          />
          <div className="text-[9px] text-center text-[var(--editor-text-muted)] mt-1">תחתון</div>
        </div>
        
        {/* Left */}
        <div className="flex-1">
          <input
            type="text"
            value={values.left}
            onChange={(e) => handleChange('left', e.target.value)}
            placeholder="-"
            className="w-full px-2 py-2 text-xs text-center bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                       rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none"
            dir="ltr"
          />
          <div className="text-[9px] text-center text-[var(--editor-text-muted)] mt-1">שמאל</div>
        </div>
      </div>
    </div>
  );
}

interface AdvancedControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function AdvancedControl({ settings, onChange }: AdvancedControlProps) {
  // Margin values
  const marginUnit = (settings.marginUnit as string) || 'px';
  const marginTop = (settings.marginTop as string) || '';
  const marginRight = (settings.marginRight as string) || '';
  const marginBottom = (settings.marginBottom as string) || '';
  const marginLeft = (settings.marginLeft as string) || '';

  // Padding values
  const paddingUnit = (settings.paddingUnit as string) || 'px';
  const paddingTop = (settings.paddingTop as string) || '';
  const paddingRight = (settings.paddingRight as string) || '';
  const paddingBottom = (settings.paddingBottom as string) || '';
  const paddingLeft = (settings.paddingLeft as string) || '';

  // Z-Index
  const zIndex = (settings.zIndex as string) || '';

  // CSS ID & Classes
  const customId = (settings.customId as string) || '';
  const customClass = (settings.customClass as string) || '';

  return (
    <div className="space-y-4">
      {/* Margin - שוליים חיצוניים */}
      <SpacingBox
        label="שוליים חיצוניים"
        values={{ top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft }}
        unit={marginUnit}
        onChange={(side, value) => onChange(`margin${side.charAt(0).toUpperCase() + side.slice(1)}`, value)}
        onUnitChange={(unit) => onChange('marginUnit', unit)}
      />

      {/* Padding - שוליים פנימיים */}
      <SpacingBox
        label="שוליים פנימיים"
        values={{ top: paddingTop, right: paddingRight, bottom: paddingBottom, left: paddingLeft }}
        unit={paddingUnit}
        onChange={(side, value) => onChange(`padding${side.charAt(0).toUpperCase() + side.slice(1)}`, value)}
        onUnitChange={(unit) => onChange('paddingUnit', unit)}
      />

      {/* Z-Index */}
      <div className="py-2">
        <label className="block text-xs text-[var(--editor-text-secondary)] mb-2">Z-Index</label>
        <input
          type="number"
          value={zIndex}
          onChange={(e) => onChange('zIndex', e.target.value)}
          placeholder="auto"
          className="w-24 px-3 py-2 text-xs bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                     rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none"
          dir="ltr"
        />
      </div>

      {/* Separator */}
      <div className="h-px bg-[var(--editor-border-default)]" />

      {/* CSS ID */}
      <div className="py-2">
        <label className="block text-xs text-[var(--editor-text-secondary)] mb-2">CSS ID</label>
        <input
          type="text"
          value={customId}
          onChange={(e) => onChange('customId', e.target.value)}
          placeholder="my-section"
          className="w-full px-3 py-2 text-xs bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                     rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none"
          dir="ltr"
        />
        <p className="text-[10px] text-[var(--editor-text-muted)] mt-1.5">
          ניתן להוסיף CSS ID מותאם אישית ללא סולמית, לדוגמא: my-id
        </p>
      </div>

      {/* CSS Classes */}
      <div className="py-2">
        <label className="block text-xs text-[var(--editor-text-secondary)] mb-2">CSS Classes</label>
        <input
          type="text"
          value={customClass}
          onChange={(e) => onChange('customClass', e.target.value)}
          placeholder="class1 class2"
          className="w-full px-3 py-2 text-xs bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                     rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none"
          dir="ltr"
        />
        <p className="text-[10px] text-[var(--editor-text-muted)] mt-1.5">
          ניתן להוסיף מספר קלאסים מופרדים ברווח
        </p>
      </div>
    </div>
  );
}

