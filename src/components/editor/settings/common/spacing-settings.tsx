'use client';

/**
 * Spacing Settings - Reusable spacing/padding controls
 * הגדרות ריווח - לשימוש חוזר בכל הסקשנים
 */

import { SliderField } from './field-components';

interface SpacingSettingsProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

// ============================================
// PADDING CONTROLS
// ============================================

export function PaddingTopControl({ settings, onChange, label = 'ריווח עליון', max = 100 }: SpacingSettingsProps & { label?: string; max?: number }) {
  return (
    <SliderField
      label={label}
      value={(settings.paddingTop as number) || 0}
      min={0}
      max={max}
      suffix="px"
      onChange={(v) => onChange('paddingTop', v)}
    />
  );
}

export function PaddingBottomControl({ settings, onChange, label = 'ריווח תחתון', max = 100 }: SpacingSettingsProps & { label?: string; max?: number }) {
  return (
    <SliderField
      label={label}
      value={(settings.paddingBottom as number) || 0}
      min={0}
      max={max}
      suffix="px"
      onChange={(v) => onChange('paddingBottom', v)}
    />
  );
}

export function PaddingYControl({ settings, onChange, label = 'ריווח אנכי' }: SpacingSettingsProps & { label?: string }) {
  return (
    <SliderField
      label={label}
      value={(settings.paddingY as number) || 48}
      min={0}
      max={200}
      suffix="px"
      onChange={(v) => onChange('paddingY', v)}
    />
  );
}

// ============================================
// MARGIN CONTROLS
// ============================================

export function MarginTopControl({ settings, onChange, label = 'מרווח עליון' }: SpacingSettingsProps & { label?: string }) {
  return (
    <SliderField
      label={label}
      value={(settings.marginTop as number) || 0}
      min={0}
      max={200}
      suffix="px"
      onChange={(v) => onChange('marginTop', v)}
    />
  );
}

export function MarginBottomControl({ settings, onChange, label = 'מרווח תחתון' }: SpacingSettingsProps & { label?: string }) {
  return (
    <SliderField
      label={label}
      value={(settings.marginBottom as number) || 0}
      min={0}
      max={200}
      suffix="px"
      onChange={(v) => onChange('marginBottom', v)}
    />
  );
}

// Note: GapControl is in grid-settings.tsx to avoid duplication

// ============================================
// COMBINED SPACING GROUP
// ============================================

interface FullSpacingProps extends SpacingSettingsProps {
  showPaddingTop?: boolean;
  showPaddingBottom?: boolean;
  showMarginTop?: boolean;
  showMarginBottom?: boolean;
}

export function FullSpacing({
  settings,
  onChange,
  showPaddingTop = true,
  showPaddingBottom = true,
  showMarginTop = false,
  showMarginBottom = false,
}: FullSpacingProps) {
  return (
    <div className="space-y-3">
      {showPaddingTop && <PaddingTopControl settings={settings} onChange={onChange} />}
      {showPaddingBottom && <PaddingBottomControl settings={settings} onChange={onChange} />}
      {showMarginTop && <MarginTopControl settings={settings} onChange={onChange} />}
      {showMarginBottom && <MarginBottomControl settings={settings} onChange={onChange} />}
    </div>
  );
}
