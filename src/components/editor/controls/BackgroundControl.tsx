'use client';

/**
 * BackgroundControl - Background color and image settings
 * הגדרות רקע (צבע ותמונה)
 * 
 * שימוש:
 * <BackgroundControl
 *   settings={section.settings}
 *   onChange={(key, value) => updateSettings(key, value)}
 * />
 * 
 * יוצר הגדרות: backgroundColor, backgroundImage, overlay
 */

import { EditorColorPicker, EditorColorInline } from '../ui/EditorColorPicker';
import { EditorSlider } from '../ui/EditorSlider';
import { EditorToggle } from '../ui/EditorToggle';

interface BackgroundControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  showImage?: boolean;
  showOverlay?: boolean;
  defaultColor?: string;
}

export function BackgroundControl({
  settings,
  onChange,
  showImage = false,
  showOverlay = false,
  defaultColor = '#ffffff',
}: BackgroundControlProps) {
  const backgroundColor = (settings.backgroundColor as string) || defaultColor;
  const overlay = (settings.overlay as number) || 0;

  return (
    <div className="space-y-2">
      <EditorColorPicker
        label="צבע רקע"
        value={backgroundColor}
        onChange={(v) => onChange('backgroundColor', v)}
      />
      
      {showOverlay && (
        <EditorSlider
          label="שכבה כהה"
          value={Math.round(overlay * 100)}
          onChange={(v) => onChange('overlay', v / 100)}
          min={0}
          max={100}
          suffix="%"
        />
      )}
    </div>
  );
}

// Simple color only
interface BackgroundColorControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  settingKey?: string;
  label?: string;
  defaultColor?: string;
}

export function BackgroundColorControl({
  settings,
  onChange,
  settingKey = 'backgroundColor',
  label = 'צבע רקע',
  defaultColor = '#ffffff',
}: BackgroundColorControlProps) {
  const color = (settings[settingKey] as string) || defaultColor;

  return (
    <EditorColorInline
      label={label}
      value={color}
      onChange={(v) => onChange(settingKey, v)}
    />
  );
}

// Card background
interface CardBackgroundControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function CardBackgroundControl({
  settings,
  onChange,
}: CardBackgroundControlProps) {
  const cardBg = (settings.cardBackground as string) || 
                 (settings.cardBgColor as string) || 
                 '#f9fafb';

  return (
    <EditorColorInline
      label="רקע כרטיס"
      value={cardBg}
      onChange={(v) => onChange('cardBackground', v)}
    />
  );
}

