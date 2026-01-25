'use client';

/**
 * Text Block Section Settings - Content & Design
 * הגדרות סקשן בלוק טקסט - תוכן ועיצוב
 */

import {
  SettingsGroup,
  TextField,
  TextAreaField,
  SelectField,
  ColorField,
} from '../common';
import {
  TitleTypography,
  SubtitleTypography,
  TextTypography,
} from '../common/typography-settings';
import { BackgroundColorControl } from '../common/background-settings';

// ============================================
// TYPES
// ============================================

interface TextBlockSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: {
    text?: string;
    buttonText?: string;
    buttonLink?: string;
  };
  settings: Record<string, unknown>;
}

interface TextBlockSettingsProps {
  section: TextBlockSection;
  onUpdate: (updates: Partial<TextBlockSection>) => void;
}

// ============================================
// CONTENT SETTINGS
// ============================================

export function TextBlockContentSettings({ section, onUpdate }: TextBlockSettingsProps) {
  const updateContent = (key: string, value: string) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  return (
    <>
      <SettingsGroup title="תוכן">
        <TextAreaField
          label="טקסט"
          value={(section.content.text as string) || ''}
          onChange={(v) => updateContent('text', v)}
          placeholder="הכנס טקסט כאן..."
          rows={5}
          hint="תומך ב-HTML בסיסי"
        />
      </SettingsGroup>

      <SettingsGroup title="כפתור">
        <TextField
          label="טקסט כפתור"
          value={(section.content.buttonText as string) || ''}
          onChange={(v) => updateContent('buttonText', v)}
          placeholder="למידע נוסף"
        />
        <TextField
          label="קישור"
          value={(section.content.buttonLink as string) || ''}
          onChange={(v) => updateContent('buttonLink', v)}
          placeholder="/about או https://..."
        />
      </SettingsGroup>
    </>
  );
}

// ============================================
// DESIGN SETTINGS
// ============================================

export function TextBlockDesignSettings({ section, onUpdate }: TextBlockSettingsProps) {
  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
  };

  return (
    <div className="p-4 space-y-6">
      <SettingsGroup title="טיפוגרפיה">
        <TitleTypography settings={section.settings} onChange={updateSettings} />
        <SubtitleTypography settings={section.settings} onChange={updateSettings} />
        <TextTypography settings={section.settings} onChange={updateSettings} />
      </SettingsGroup>

      <SettingsGroup title="פריסה">
        <SelectField
          label="רוחב מקסימלי"
          value={(section.settings.maxWidth as string) || 'lg'}
          options={[
            { value: 'sm', label: 'קטן' },
            { value: 'md', label: 'בינוני' },
            { value: 'lg', label: 'רחב' },
            { value: 'xl', label: 'רחב מאוד' },
            { value: 'full', label: 'מלא' },
          ]}
          onChange={(v) => updateSettings('maxWidth', v)}
        />
        <SelectField
          label="ריווח אנכי"
          value={(section.settings.paddingY as string) || 'medium'}
          options={[
            { value: 'small', label: 'קטן' },
            { value: 'medium', label: 'בינוני' },
            { value: 'large', label: 'גדול' },
          ]}
          onChange={(v) => updateSettings('paddingY', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="עיצוב כפתור">
        <ColorField
          label="צבע רקע"
          value={(section.settings.buttonBackgroundColor as string) || 'transparent'}
          onChange={(v) => updateSettings('buttonBackgroundColor', v)}
        />
        <ColorField
          label="צבע טקסט"
          value={(section.settings.buttonTextColor as string) || '#000000'}
          onChange={(v) => updateSettings('buttonTextColor', v)}
        />
        <ColorField
          label="צבע מסגרת"
          value={(section.settings.buttonBorderColor as string) || '#000000'}
          onChange={(v) => updateSettings('buttonBorderColor', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="רקע">
        <BackgroundColorControl settings={section.settings} onChange={updateSettings} />
      </SettingsGroup>
    </div>
  );
}

