'use client';

/**
 * Gallery Section Settings - Content & Design
 * הגדרות סקשן גלריה - תוכן ועיצוב
 */

import {
  SettingsGroup,
  SelectField,
  SwitchField,
  SliderField,
} from '../common';
import {
  TitleTypography,
  SubtitleTypography,
} from '../common/typography-settings';
import { BackgroundColorControl } from '../common/background-settings';
import {
  ColumnsControl,
  MobileColumnsControl,
  GapControl,
  LayoutTypeControl,
} from '../common/grid-settings';

// ============================================
// TYPES
// ============================================

interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
}

interface GallerySection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: {
    images?: GalleryImage[];
  };
  settings: Record<string, unknown>;
}

interface GallerySettingsProps {
  section: GallerySection;
  onUpdate: (updates: Partial<GallerySection>) => void;
  storeInfo?: { id: string; slug: string };
}

// ============================================
// CONTENT SETTINGS
// ============================================

export function GalleryContentSettings({ section, onUpdate, storeInfo }: GallerySettingsProps) {
  const images = (section.content.images as GalleryImage[]) || [];

  const updateImages = (newImages: GalleryImage[]) => {
    onUpdate({ content: { ...section.content, images: newImages } });
  };

  const addImage = () => {
    const newId = String(Date.now());
    updateImages([...images, { id: newId, url: '', alt: '' }]);
  };

  const updateImage = (index: number, field: keyof GalleryImage, value: string) => {
    const newImages = images.map((img, i) => 
      i === index ? { ...img, [field]: value } : img
    );
    updateImages(newImages);
  };

  const removeImage = (index: number) => {
    updateImages(images.filter((_, i) => i !== index));
  };

  return (
    <SettingsGroup title="תמונות">
      <div className="space-y-3">
        {images.map((image, index) => (
          <div key={image.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">תמונה {index + 1}</span>
              <button
                onClick={() => removeImage(index)}
                className="p-1 hover:bg-red-100 text-red-600 rounded"
              >
                ✕
              </button>
            </div>
            {image.url ? (
              <img src={image.url} alt={image.alt} className="w-full h-20 object-cover rounded" />
            ) : (
              <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                אין תמונה
              </div>
            )}
            <input
              type="text"
              value={image.url}
              onChange={(e) => updateImage(index, 'url', e.target.value)}
              className="w-full text-xs border border-gray-200 rounded px-2 py-1"
              placeholder="URL תמונה"
            />
            <input
              type="text"
              value={image.alt || ''}
              onChange={(e) => updateImage(index, 'alt', e.target.value)}
              className="w-full text-xs border border-gray-200 rounded px-2 py-1"
              placeholder="טקסט חלופי"
            />
          </div>
        ))}
        <button
          onClick={addImage}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400"
        >
          + הוסף תמונה
        </button>
      </div>
    </SettingsGroup>
  );
}

// ============================================
// DESIGN SETTINGS
// ============================================

export function GalleryDesignSettings({ section, onUpdate }: GallerySettingsProps) {
  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
  };

  return (
    <div className="p-4 space-y-6">
      <SettingsGroup title="טיפוגרפיה">
        <TitleTypography settings={section.settings} onChange={updateSettings} />
        <SubtitleTypography settings={section.settings} onChange={updateSettings} />
      </SettingsGroup>

      <SettingsGroup title="פריסה">
        <LayoutTypeControl settings={section.settings} onChange={updateSettings} />
        <ColumnsControl settings={section.settings} onChange={updateSettings} options={[2, 3, 4, 5]} />
        <MobileColumnsControl settings={section.settings} onChange={updateSettings} />
        <GapControl settings={section.settings} onChange={updateSettings} />
      </SettingsGroup>

      <SettingsGroup title="תמונות">
        <SelectField
          label="יחס תמונה"
          value={(section.settings.aspectRatio as string) || 'square'}
          options={[
            { value: 'square', label: 'ריבוע (1:1)' },
            { value: '4:3', label: '4:3' },
            { value: '16:9', label: '16:9' },
            { value: 'auto', label: 'אוטומטי' },
          ]}
          onChange={(v) => updateSettings('aspectRatio', v)}
        />
        <SwitchField
          label="אפקט הגדלה בהובר"
          value={(section.settings.hoverZoom as boolean) !== false}
          onChange={(v) => updateSettings('hoverZoom', v)}
        />
        <SwitchField
          label="פתיחה בלייטבוקס"
          value={(section.settings.lightbox as boolean) !== false}
          onChange={(v) => updateSettings('lightbox', v)}
        />
      </SettingsGroup>

      {(section.settings.layout as string) === 'slider' && (
        <SettingsGroup title="הגדרות סליידר">
          <SwitchField
            label="חצים"
            value={(section.settings.showArrows as boolean) !== false}
            onChange={(v) => updateSettings('showArrows', v)}
          />
          <SwitchField
            label="נקודות"
            value={(section.settings.showDots as boolean) !== false}
            onChange={(v) => updateSettings('showDots', v)}
          />
          <SwitchField
            label="הפעלה אוטומטית"
            value={(section.settings.autoplay as boolean) || false}
            onChange={(v) => updateSettings('autoplay', v)}
          />
          {(section.settings.autoplay as boolean) && (
            <SliderField
              label="מהירות (שניות)"
              value={(section.settings.autoplaySpeed as number) || 5}
              min={2}
              max={10}
              suffix="s"
              onChange={(v) => updateSettings('autoplaySpeed', v)}
            />
          )}
        </SettingsGroup>
      )}

      <SettingsGroup title="רקע">
        <BackgroundColorControl settings={section.settings} onChange={updateSettings} />
      </SettingsGroup>
    </div>
  );
}

