'use client';

/**
 * Background Settings - Reusable background/color controls
 * הגדרות רקע - לשימוש חוזר בכל הסקשנים
 */

import { ColorField, SliderField } from './field-components';

interface BackgroundSettingsProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

// ============================================
// BACKGROUND COLOR
// ============================================

export function BackgroundColorControl({ 
  settings, 
  onChange, 
  label = 'צבע רקע',
  settingKey = 'backgroundColor',
  defaultColor = '#ffffff',
}: BackgroundSettingsProps & { label?: string; settingKey?: string; defaultColor?: string }) {
  return (
    <ColorField
      label={label}
      value={(settings[settingKey] as string) || defaultColor}
      onChange={(v) => onChange(settingKey, v)}
    />
  );
}

// ============================================
// OVERLAY OPACITY
// ============================================

export function OverlayControl({ 
  settings, 
  onChange, 
  label = 'שקיפות שכבה כהה',
  settingKey = 'overlay',
  defaultValue = 0.3,
}: BackgroundSettingsProps & { label?: string; settingKey?: string; defaultValue?: number }) {
  return (
    <SliderField
      label={label}
      value={Math.round(((settings[settingKey] as number) ?? defaultValue) * 100)}
      min={0}
      max={100}
      suffix="%"
      onChange={(v) => onChange(settingKey, v / 100)}
    />
  );
}

// ============================================
// CARD BACKGROUND
// ============================================

export function CardBackgroundControl({ 
  settings, 
  onChange, 
  label = 'צבע רקע כרטיס',
  settingKey = 'cardBackground',
  defaultColor = '#f9fafb',
}: BackgroundSettingsProps & { label?: string; settingKey?: string; defaultColor?: string }) {
  return (
    <ColorField
      label={label}
      value={(settings[settingKey] as string) || defaultColor}
      onChange={(v) => onChange(settingKey, v)}
    />
  );
}

// ============================================
// COMBINED BACKGROUND SETTINGS
// ============================================

interface FullBackgroundProps extends BackgroundSettingsProps {
  showBackgroundColor?: boolean;
  showOverlay?: boolean;
  showCardBackground?: boolean;
  backgroundLabel?: string;
  overlayLabel?: string;
  cardLabel?: string;
}

export function FullBackground({
  settings,
  onChange,
  showBackgroundColor = true,
  showOverlay = false,
  showCardBackground = false,
  backgroundLabel = 'צבע רקע',
  overlayLabel = 'שקיפות שכבה כהה',
  cardLabel = 'צבע רקע כרטיס',
}: FullBackgroundProps) {
  return (
    <div className="space-y-3">
      {showBackgroundColor && (
        <BackgroundColorControl settings={settings} onChange={onChange} label={backgroundLabel} />
      )}
      {showOverlay && (
        <OverlayControl settings={settings} onChange={onChange} label={overlayLabel} />
      )}
      {showCardBackground && (
        <CardBackgroundControl settings={settings} onChange={onChange} label={cardLabel} />
      )}
    </div>
  );
}
