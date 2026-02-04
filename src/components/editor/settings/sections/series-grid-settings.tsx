'use client';

/**
 * Series Grid Section Settings - Content & Design
 * הגדרות סקשן גריד סדרות - תוכן ועיצוב
 */

import {
  SettingsGroup,
  TextField,
  SelectField,
  SliderField,
  SwitchField,
  ColorField,
} from '../common';
import {
  TitleTypography,
  SubtitleTypography,
} from '../common/typography-settings';
import { BackgroundColorControl } from '../common/background-settings';
import { ColumnsControl, MobileColumnsControl } from '../common/grid-settings';

// ============================================
// TYPES
// ============================================

interface SeriesItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  link: string;
}

interface SeriesGridSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: {
    items?: SeriesItem[];
  };
  settings: Record<string, unknown>;
}

interface SeriesGridSettingsProps {
  section: SeriesGridSection;
  onUpdate: (updates: Partial<SeriesGridSection>) => void;
  storeInfo?: { id: string; slug: string };
}

// ============================================
// CONTENT SETTINGS
// ============================================

export function SeriesGridContentSettings({ section, onUpdate, storeInfo }: SeriesGridSettingsProps) {
  const items = (section.content.items as SeriesItem[]) || [];

  const updateItems = (newItems: SeriesItem[]) => {
    onUpdate({ content: { ...section.content, items: newItems } });
  };

  const addItem = () => {
    const newId = String(Date.now());
    updateItems([...items, { id: newId, title: 'סדרה חדשה', link: '/' }]);
  };

  const updateItem = (index: number, field: keyof SeriesItem, value: string) => {
    const newItems = items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    updateItems(newItems);
  };

  const removeItem = (index: number) => {
    updateItems(items.filter((_, i) => i !== index));
  };

  return (
    <SettingsGroup title="סדרות">
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="border border-[var(--editor-border-default)] rounded-lg p-3 space-y-2 bg-[var(--editor-bg-primary)]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--editor-text-muted)]">סדרה {index + 1}</span>
              <button
                onClick={() => removeItem(index)}
                className="p-1 hover:bg-red-100 text-red-600 rounded"
              >
                ✕
              </button>
            </div>
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.title} className="w-full h-20 object-cover rounded" />
            )}
            <TextField
              label="כותרת"
              value={item.title}
              onChange={(v) => updateItem(index, 'title', v)}
              placeholder="שם הסדרה"
            />
            <TextField
              label="תת כותרת"
              value={item.subtitle || ''}
              onChange={(v) => updateItem(index, 'subtitle', v)}
              placeholder="תיאור קצר"
            />
            <TextField
              label="תמונה"
              value={item.imageUrl || ''}
              onChange={(v) => updateItem(index, 'imageUrl', v)}
              placeholder="URL תמונה"
            />
            <TextField
              label="קישור"
              value={item.link}
              onChange={(v) => updateItem(index, 'link', v)}
              placeholder="/category/..."
            />
          </div>
        ))}
        <button
          onClick={addItem}
          className="w-full py-2 border-2 border-dashed border-[var(--editor-border-default)] rounded-lg text-sm text-[var(--editor-text-muted)] hover:border-[var(--editor-border-hover)]"
        >
          + הוסף סדרה
        </button>
      </div>
    </SettingsGroup>
  );
}

// ============================================
// DESIGN SETTINGS
// ============================================

export function SeriesGridDesignSettings({ section, onUpdate }: SeriesGridSettingsProps) {
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
        <SelectField
          label="סגנון"
          value={(section.settings.style as string) || 'overlay'}
          options={[
            { value: 'overlay', label: 'שכבה על תמונה' },
            { value: 'cards', label: 'כרטיסים' },
          ]}
          onChange={(v) => updateSettings('style', v)}
        />
        <ColumnsControl settings={section.settings} onChange={updateSettings} />
        <MobileColumnsControl settings={section.settings} onChange={updateSettings} />
      </SettingsGroup>

      <SettingsGroup title="כרטיסים">
        <SliderField
          label="גובה כרטיס"
          value={parseInt((section.settings.cardHeight as string)?.replace('px', '') || '400')}
          min={200}
          max={600}
          suffix="px"
          onChange={(v) => updateSettings('cardHeight', `${v}px`)}
        />
        <SwitchField
          label="פינות מעוגלות"
          value={(section.settings.roundedCorners as boolean) !== false}
          onChange={(v) => updateSettings('roundedCorners', v)}
        />
        <SwitchField
          label="הצג תיאור תמיד"
          value={(section.settings.showDescriptionAlways as boolean) || false}
          onChange={(v) => updateSettings('showDescriptionAlways', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="צבעים">
        <ColorField
          label="צבע הדגשה"
          value={(section.settings.accentColor as string) || '#d4af37'}
          onChange={(v) => updateSettings('accentColor', v)}
        />
        <BackgroundColorControl settings={section.settings} onChange={updateSettings} />
      </SettingsGroup>
    </div>
  );
}

