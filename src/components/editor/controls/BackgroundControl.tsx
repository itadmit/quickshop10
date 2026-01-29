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

import { useState, useRef, useEffect } from 'react';
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
  // Determine current background type from settings
  const detectBackgroundType = (): BackgroundType => {
    const hasVideo = !!(settings.backgroundVideo as string) || !!(settings.videoUrl as string);
    const hasImage = !!(settings.backgroundImage as string) || !!(settings.imageUrl as string);
    return hasVideo ? 'video' : hasImage ? 'image' : 'color';
  };
  
  const [bgType, setBgType] = useState<BackgroundType>(detectBackgroundType);
  
  // Update bgType when settings change (e.g., when switching sections or loading)
  useEffect(() => {
    setBgType(detectBackgroundType());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.backgroundVideo, settings.videoUrl, settings.backgroundImage, settings.imageUrl]);
  
  const backgroundColor = (settings.backgroundColor as string) || defaultColor;
  // Support both backgroundImage and imageUrl (for content_block)
  const backgroundImage = (settings.backgroundImage as string) || (settings.imageUrl as string) || '';
  const mobileImage = (settings.mobileImageUrl as string) || '';
  const backgroundVideo = (settings.backgroundVideo as string) || (settings.videoUrl as string) || '';
  const mobileVideo = (settings.mobileVideoUrl as string) || '';
  const overlay = (settings.overlay as number) || 0;
  const backgroundSize = (settings.backgroundSize as string) || 'cover';
  const backgroundPosition = (settings.backgroundPosition as string) || 'center';
  const backgroundMaxWidth = (settings.backgroundMaxWidth as number) || 0;

  const handleTypeChange = (type: BackgroundType) => {
    setBgType(type);
    // Clear other types when switching
    if (type === 'color') {
      onChange('backgroundImage', '');
      onChange('imageUrl', '');
      onChange('mobileImageUrl', '');
      onChange('backgroundVideo', '');
      onChange('videoUrl', '');
      onChange('mobileVideoUrl', '');
    } else if (type === 'image') {
      onChange('backgroundVideo', '');
      onChange('videoUrl', '');
      onChange('mobileVideoUrl', '');
    } else if (type === 'video') {
      onChange('backgroundImage', '');
      onChange('imageUrl', '');
      onChange('mobileImageUrl', '');
    }
  };

  // Helper to update both legacy and new keys
  const updateImage = (value: string) => {
    onChange('backgroundImage', value);
    onChange('imageUrl', value);
  };

  const updateVideo = (value: string) => {
    onChange('backgroundVideo', value);
    onChange('videoUrl', value);
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
          {/* Desktop Image */}
          <div>
            <label className="block text-xs text-[var(--editor-text-secondary)] mb-2">תמונה (מחשב)</label>
            {backgroundImage ? (
              <div className="relative">
                <div 
                  className="w-full h-16 rounded-lg bg-cover bg-center border border-[var(--editor-border-default)]"
                  style={{ backgroundImage: `url(${backgroundImage})` }}
                />
                <button
                  onClick={() => updateImage('')}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={backgroundImage}
                onChange={(e) => updateImage(e.target.value)}
                placeholder="URL תמונה למחשב..."
                className="w-full px-3 py-2 text-xs bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                           rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none"
                dir="ltr"
              />
            )}
          </div>

          {/* Mobile Image */}
          <div>
            <label className="block text-xs text-[var(--editor-text-secondary)] mb-2">תמונה (מובייל)</label>
            {mobileImage ? (
              <div className="relative">
                <div 
                  className="w-full h-16 rounded-lg bg-cover bg-center border border-[var(--editor-border-default)]"
                  style={{ backgroundImage: `url(${mobileImage})` }}
                />
                <button
                  onClick={() => onChange('mobileImageUrl', '')}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={mobileImage}
                onChange={(e) => onChange('mobileImageUrl', e.target.value)}
                placeholder="URL תמונה למובייל (אופציונלי)..."
                className="w-full px-3 py-2 text-xs bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                           rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none"
                dir="ltr"
              />
            )}
            <p className="text-[10px] text-[var(--editor-text-muted)] mt-1">
              אם ריק, תוצג תמונת המחשב גם במובייל
            </p>
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

          {/* Max Width for Background Image */}
          <div>
            <label className="block text-xs text-[var(--editor-text-secondary)] mb-2">רוחב מירבי (px)</label>
            <input
              type="number"
              value={backgroundMaxWidth || ''}
              onChange={(e) => onChange('backgroundMaxWidth', e.target.value ? Number(e.target.value) : 0)}
              placeholder="ללא הגבלה"
              className="w-full px-3 py-2 text-xs bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                         rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none"
              dir="ltr"
              min={0}
            />
            <p className="text-[10px] text-[var(--editor-text-muted)] mt-1">
              הגדר רוחב מירבי לתמונה עם יישור אוטומטי למרכז (השאר ריק ללא הגבלה)
            </p>
          </div>
        </div>
      )}

      {/* Video Settings */}
      {bgType === 'video' && (
        <div className="space-y-3">
          {/* Desktop Video */}
          <div>
            <label className="block text-xs text-[var(--editor-text-secondary)] mb-2">וידאו (מחשב)</label>
            <input
              type="text"
              value={backgroundVideo}
              onChange={(e) => updateVideo(e.target.value)}
              placeholder="URL וידאו למחשב (MP4, WebM)..."
              className="w-full px-3 py-2 text-xs bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                         rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none"
              dir="ltr"
            />
            {backgroundVideo && (
              <button
                onClick={() => updateVideo('')}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors mt-1"
              >
                <X className="w-3 h-3" />
                הסר וידאו
              </button>
            )}
          </div>

          {/* Mobile Video */}
          <div>
            <label className="block text-xs text-[var(--editor-text-secondary)] mb-2">וידאו (מובייל)</label>
            <input
              type="text"
              value={mobileVideo}
              onChange={(e) => onChange('mobileVideoUrl', e.target.value)}
              placeholder="URL וידאו למובייל (אופציונלי)..."
              className="w-full px-3 py-2 text-xs bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                         rounded text-[var(--editor-text-primary)] focus:border-[var(--editor-border-focus)] outline-none"
              dir="ltr"
            />
            {mobileVideo && (
              <button
                onClick={() => onChange('mobileVideoUrl', '')}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors mt-1"
              >
                <X className="w-3 h-3" />
                הסר וידאו
              </button>
            )}
            <p className="text-[10px] text-[var(--editor-text-muted)] mt-1">
              אם ריק, יוצג וידאו המחשב גם במובייל
            </p>
          </div>
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
  defaultValue = 0,
}: MinHeightControlProps & { defaultValue?: number }) {
  const minHeight = (settings.minHeight as number) ?? defaultValue;
  const minHeightUnit = (settings.minHeightUnit as string) || 'px';

  return (
    <div className="flex items-center justify-between py-2">
      <label className="text-xs text-[var(--editor-text-secondary)]">גובה מינימום</label>
      <div className="flex gap-1.5 items-center">
        <input
          type="number"
          value={minHeight}
          onChange={(e) => onChange('minHeight', e.target.value ? Number(e.target.value) : defaultValue)}
          placeholder={String(defaultValue)}
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
