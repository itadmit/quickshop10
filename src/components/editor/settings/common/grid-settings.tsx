'use client';

/**
 * Grid Settings - Reusable grid/layout controls
 * הגדרות גריד - לשימוש חוזר בכל הסקשנים
 */

import { SliderField, SelectField, ToggleField } from './field-components';

interface GridSettingsProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

// ============================================
// COLUMNS CONTROL
// ============================================

export function ColumnsControl({ 
  settings, 
  onChange, 
  label = 'עמודות (מחשב)',
  settingKey = 'columns',
  options = [2, 3, 4],
}: GridSettingsProps & { 
  label?: string; 
  settingKey?: string;
  options?: number[];
}) {
  return (
    <SelectField
      label={label}
      value={String((settings[settingKey] as number) || 3)}
      options={options.map(n => ({ value: String(n), label: String(n) }))}
      onChange={(v) => onChange(settingKey, parseInt(v))}
    />
  );
}

export function MobileColumnsControl({ 
  settings, 
  onChange, 
  label = 'עמודות (מובייל)',
  settingKey = 'mobileColumns',
}: GridSettingsProps & { label?: string; settingKey?: string }) {
  return (
    <SelectField
      label={label}
      value={String((settings[settingKey] as number) || 1)}
      options={[
        { value: '1', label: '1' },
        { value: '2', label: '2' },
      ]}
      onChange={(v) => onChange(settingKey, parseInt(v))}
    />
  );
}

// ============================================
// GAP CONTROL
// ============================================

export function GapControl({ 
  settings, 
  onChange, 
  label = 'רווח בין פריטים',
  settingKey = 'gap',
  max = 60,
}: GridSettingsProps & { label?: string; settingKey?: string; max?: number }) {
  return (
    <SliderField
      label={label}
      value={(settings[settingKey] as number) || 24}
      min={0}
      max={max}
      suffix="px"
      onChange={(v) => onChange(settingKey, v)}
    />
  );
}

// ============================================
// LAYOUT TYPE
// ============================================

export function LayoutTypeControl({ 
  settings, 
  onChange,
  settingKey = 'layout',
}: GridSettingsProps & { settingKey?: string }) {
  return (
    <ToggleField
      label="פריסה"
      options={['גריד', 'סליידר']}
      value={(settings[settingKey] as string) === 'slider' ? 'סליידר' : 'גריד'}
      onChange={(v) => onChange(settingKey, v === 'סליידר' ? 'slider' : 'grid')}
    />
  );
}

// ============================================
// COMBINED GRID SETTINGS
// ============================================

interface FullGridProps extends GridSettingsProps {
  showColumns?: boolean;
  showMobileColumns?: boolean;
  showGap?: boolean;
  showLayout?: boolean;
  columnOptions?: number[];
}

export function FullGrid({
  settings,
  onChange,
  showColumns = true,
  showMobileColumns = true,
  showGap = true,
  showLayout = false,
  columnOptions = [2, 3, 4],
}: FullGridProps) {
  return (
    <div className="space-y-3">
      {showLayout && <LayoutTypeControl settings={settings} onChange={onChange} />}
      {showColumns && <ColumnsControl settings={settings} onChange={onChange} options={columnOptions} />}
      {showMobileColumns && <MobileColumnsControl settings={settings} onChange={onChange} />}
      {showGap && <GapControl settings={settings} onChange={onChange} />}
    </div>
  );
}
