'use client';

/**
 * SpacingControl - Padding and margin settings
 * הגדרות ריווחים (padding, margin)
 * 
 * שימוש:
 * <SpacingControl
 *   settings={section.settings}
 *   onChange={(key, value) => updateSettings(key, value)}
 * />
 * 
 * יוצר הגדרות: paddingTop, paddingBottom, marginTop, marginBottom
 */

import { EditorSlider } from '../ui/EditorSlider';
import { EditorSection } from '../ui/EditorSection';

interface SpacingControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  showPadding?: boolean;
  showMargin?: boolean;
  maxPadding?: number;
  maxMargin?: number;
}

export function SpacingControl({
  settings,
  onChange,
  showPadding = true,
  showMargin = true,
  maxPadding = 200,
  maxMargin = 200,
}: SpacingControlProps) {
  // Get current values
  const paddingTop = (settings.paddingTop as number) || 0;
  const paddingBottom = (settings.paddingBottom as number) || 0;
  const marginTop = (settings.marginTop as number) || 0;
  const marginBottom = (settings.marginBottom as number) || 0;

  return (
    <div className="space-y-1">
      {showPadding && (
        <>
          <EditorSlider
            label="ריווח עליון"
            value={paddingTop}
            onChange={(v) => onChange('paddingTop', v)}
            min={0}
            max={maxPadding}
            suffix="px"
          />
          <EditorSlider
            label="ריווח תחתון"
            value={paddingBottom}
            onChange={(v) => onChange('paddingBottom', v)}
            min={0}
            max={maxPadding}
            suffix="px"
          />
        </>
      )}
      
      {showMargin && (
        <>
          <EditorSlider
            label="מרווח עליון"
            value={marginTop}
            onChange={(v) => onChange('marginTop', v)}
            min={0}
            max={maxMargin}
            suffix="px"
          />
          <EditorSlider
            label="מרווח תחתון"
            value={marginBottom}
            onChange={(v) => onChange('marginBottom', v)}
            min={0}
            max={maxMargin}
            suffix="px"
          />
        </>
      )}
    </div>
  );
}

// Padding only
interface PaddingControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  maxPadding?: number;
}

export function PaddingControl({
  settings,
  onChange,
  maxPadding = 200,
}: PaddingControlProps) {
  const paddingTop = (settings.paddingTop as number) || 48;
  const paddingBottom = (settings.paddingBottom as number) || 48;

  return (
    <div className="space-y-1">
      <EditorSlider
        label="ריווח עליון"
        value={paddingTop}
        onChange={(v) => onChange('paddingTop', v)}
        min={0}
        max={maxPadding}
        suffix="px"
      />
      <EditorSlider
        label="ריווח תחתון"
        value={paddingBottom}
        onChange={(v) => onChange('paddingBottom', v)}
        min={0}
        max={maxPadding}
        suffix="px"
      />
    </div>
  );
}

// Margin only
interface MarginControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  maxMargin?: number;
}

export function MarginControl({
  settings,
  onChange,
  maxMargin = 200,
}: MarginControlProps) {
  const marginTop = (settings.marginTop as number) || 0;
  const marginBottom = (settings.marginBottom as number) || 0;

  return (
    <div className="space-y-1">
      <EditorSlider
        label="מרווח עליון"
        value={marginTop}
        onChange={(v) => onChange('marginTop', v)}
        min={0}
        max={maxMargin}
        suffix="px"
      />
      <EditorSlider
        label="מרווח תחתון"
        value={marginBottom}
        onChange={(v) => onChange('marginBottom', v)}
        min={0}
        max={maxMargin}
        suffix="px"
      />
    </div>
  );
}

// Gap control (for grid layouts)
interface GapControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  settingKey?: string;
  label?: string;
  max?: number;
}

export function GapControl({
  settings,
  onChange,
  settingKey = 'gap',
  label = 'רווח בין פריטים',
  max = 60,
}: GapControlProps) {
  const gap = (settings[settingKey] as number) || 24;

  return (
    <EditorSlider
      label={label}
      value={gap}
      onChange={(v) => onChange(settingKey, v)}
      min={0}
      max={max}
      suffix="px"
    />
  );
}

