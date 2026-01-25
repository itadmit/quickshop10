'use client';

/**
 * BackgroundControl - Background color, image, and video settings
 * הגדרות רקע (צבע, תמונה, וידאו)
 * 
 * שימוש:
 * <FullBackgroundControl
 *   settings={section.settings}
 *   onChange={(key, value) => updateSettings(key, value)}
 * />
 * 
 * יוצר הגדרות: backgroundColor, backgroundImage, backgroundVideo, overlay
 */

import { useState, useRef } from 'react';
import { EditorColorPicker, EditorColorInline } from '../ui/EditorColorPicker';
import { EditorSlider } from '../ui/EditorSlider';
import { EditorSelect } from '../ui/EditorSelect';
import { Image, Film, Palette, X, Upload } from 'lucide-react';

// ============================================
// Full Background Control (Color/Image/Video)
// ============================================
type BackgroundType = 'color' | 'image' | 'video';

interface FullBackgroundControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  showOverlay?: boolean;
  defaultColor?: string;
}

export function FullBackgroundControl({
  settings,
  onChange,
  showOverlay = true,
  defaultColor = '#ffffff',
}: FullBackgroundControlProps) {
  // Determine current background type
  const hasVideo = !!(settings.backgroundVideo as string);
  const hasImage = !!(settings.backgroundImage as string);
  const initialType: BackgroundType = hasVideo ? 'video' : hasImage ? 'image' : 'color';
  
  const [bgType, setBgType] = useState<BackgroundType>(initialType);
  
  const backgroundColor = (settings.backgroundColor as string) || defaultColor;
  const backgroundImage = (settings.backgroundImage as string) || '';
  const backgroundVideo = (settings.backgroundVideo as string) || '';
  const overlay = (settings.overlay as number) || 0;
  const backgroundSize = (settings.backgroundSize as string) || 'cover';
  const backgroundPosition = (settings.backgroundPosition as string) || 'center';

  const handleTypeChange = (type: BackgroundType) => {
    setBgType(type);
    // Clear other types when switching
    if (type === 'color') {
      onChange('backgroundImage', '');
      onChange('backgroundVideo', '');
    } else if (type === 'image') {
      onChange('backgroundVideo', '');
    } else if (type === 'video') {
      onChange('backgroundImage', '');
    }
  };

  return (
    <div className="space-y-3">
      {/* Background Type Selector */}
      <div className="py-2">
        <label className="block text-xs text-[var(--editor-text-secondary)] mb-2">סוג רקע</label>
        <div className="flex gap-1.5">
          {/* Color */}
          <button
            onClick={() => handleTypeChange('color')}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-lg border transition-all ${
              bgType === 'color'
                ? 'border-[var(--editor-accent-blue)] bg-[var(--editor-accent-blue)]/5'
                : 'border-[var(--editor-border-default)] hover:border-[var(--editor-border-hover)]'
            }`}
          >
            <Palette className={`w-4 h-4 ${bgType === 'color' ? 'text-[var(--editor-accent-blue)]' : 'text-[var(--editor-text-muted)]'}`} />
            <span className={`text-[10px] ${bgType === 'color' ? 'text-[var(--editor-accent-blue)]' : 'text-[var(--editor-text-muted)]'}`}>צבע</span>
          </button>

          {/* Image */}
          <button
            onClick={() => handleTypeChange('image')}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-lg border transition-all ${
              bgType === 'image'
                ? 'border-[var(--editor-accent-blue)] bg-[var(--editor-accent-blue)]/5'
                : 'border-[var(--editor-border-default)] hover:border-[var(--editor-border-hover)]'
            }`}
          >
            <Image className={`w-4 h-4 ${bgType === 'image' ? 'text-[var(--editor-accent-blue)]' : 'text-[var(--editor-text-muted)]'}`} />
            <span className={`text-[10px] ${bgType === 'image' ? 'text-[var(--editor-accent-blue)]' : 'text-[var(--editor-text-muted)]'}`}>תמונה</span>
          </button>

          {/* Video */}
          <button
            onClick={() => handleTypeChange('video')}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-lg border transition-all ${
              bgType === 'video'
                ? 'border-[var(--editor-accent-blue)] bg-[var(--editor-accent-blue)]/5'
                : 'border-[var(--editor-border-default)] hover:border-[var(--editor-border-hover)]'
            }`}
          >
            <Film className={`w-4 h-4 ${bgType === 'video' ? 'text-[var(--editor-accent-blue)]' : 'text-[var(--editor-text-muted)]'}`} />
            <span className={`text-[10px] ${bgType === 'video' ? 'text-[var(--editor-accent-blue)]' : 'text-[var(--editor-text-muted)]'}`}>וידאו</span>
          </button>
        </div>
      </div>

      {/* Color Settings */}
      {bgType === 'color' && (
        <EditorColorPicker
          label="צבע רקע"
          value={backgroundColor}
          onChange={(v) => onChange('backgroundColor', v)}
        />
      )}

      {/* Image Settings */}
      {bgType === 'image' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[var(--editor-text-secondary)] mb-2">תמונת רקע</label>
            {backgroundImage ? (
              <div className="relative">
                <div 
                  className="w-full h-20 rounded-lg bg-cover bg-center border border-[var(--editor-border-default)]"
                  style={{ backgroundImage: `url(${backgroundImage})` }}
                />
                <button
                  onClick={() => onChange('backgroundImage', '')}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={backgroundImage}
                  onChange={(e) => onChange('backgroundImage', e.target.value)}
                  placeholder="הזן URL של תמונה..."
                  className="w-full px-3 py-2 text-xs bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                             rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none"
                  dir="ltr"
                />
                <p className="text-[10px] text-[var(--editor-text-muted)]">
                  הזן URL או העלה תמונה
                </p>
              </div>
            )}
          </div>

          <EditorSelect
            label="גודל תמונה"
            value={backgroundSize}
            options={[
              { value: 'cover', label: 'כיסוי מלא' },
              { value: 'contain', label: 'הצג הכל' },
              { value: 'auto', label: 'גודל מקורי' },
            ]}
            onChange={(v) => onChange('backgroundSize', v)}
          />

          <EditorSelect
            label="מיקום תמונה"
            value={backgroundPosition}
            options={[
              { value: 'center', label: 'מרכז' },
              { value: 'top', label: 'למעלה' },
              { value: 'bottom', label: 'למטה' },
              { value: 'left', label: 'שמאל' },
              { value: 'right', label: 'ימין' },
            ]}
            onChange={(v) => onChange('backgroundPosition', v)}
          />
        </div>
      )}

      {/* Video Settings */}
      {bgType === 'video' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[var(--editor-text-secondary)] mb-2">וידאו רקע</label>
            <input
              type="text"
              value={backgroundVideo}
              onChange={(e) => onChange('backgroundVideo', e.target.value)}
              placeholder="הזן URL של וידאו (MP4, WebM)..."
              className="w-full px-3 py-2 text-xs bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                         rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none"
              dir="ltr"
            />
            <p className="text-[10px] text-[var(--editor-text-muted)] mt-1">
              הוידאו יתנגן באופן אוטומטי ללא קול
            </p>
          </div>

          {backgroundVideo && (
            <button
              onClick={() => onChange('backgroundVideo', '')}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
              הסר וידאו
            </button>
          )}
        </div>
      )}

      {/* Overlay - only for image/video */}
      {showOverlay && (bgType === 'image' || bgType === 'video') && (
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

// ============================================
// Min Height Control
// ============================================
interface MinHeightControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function MinHeightControl({
  settings,
  onChange,
}: MinHeightControlProps) {
  const minHeight = (settings.minHeight as number) || 0;
  const minHeightUnit = (settings.minHeightUnit as string) || 'px';

  return (
    <div className="flex items-center justify-between py-2">
      <label className="text-xs text-[var(--editor-text-secondary)]">גובה מינימום</label>
      <div className="flex gap-1.5 items-center">
        <input
          type="number"
          value={minHeight || ''}
          onChange={(e) => onChange('minHeight', e.target.value ? Number(e.target.value) : 0)}
          placeholder="0"
          className="w-16 px-2 py-1.5 text-xs bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                     rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none"
          dir="ltr"
          min={0}
        />
        <EditorSelect
          label=""
          value={minHeightUnit}
          options={[
            { value: 'px', label: 'PX' },
            { value: 'vh', label: 'VH' },
          ]}
          onChange={(v) => onChange('minHeightUnit', v)}
          compact
        />
      </div>
    </div>
  );
}

// ============================================
// Simple Background Control (legacy)
// ============================================
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

// ============================================
// Simple color only
// ============================================
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

// ============================================
// Card background
// ============================================
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
