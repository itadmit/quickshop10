'use client';

/**
 * Newsletter Section Settings - Content & Design
 * הגדרות סקשן ניוזלטר - תוכן ועיצוב
 */

import {
  SettingsGroup,
  TextField,
  ColorField,
} from '../common';
import {
  TitleTypography,
  SubtitleTypography,
} from '../common/typography-settings';
import { BackgroundColorControl } from '../common/background-settings';

// ============================================
// TYPES
// ============================================

interface NewsletterSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: {
    placeholder?: string;
    buttonText?: string;
  };
  settings: Record<string, unknown>;
}

interface NewsletterSettingsProps {
  section: NewsletterSection;
  onUpdate: (updates: Partial<NewsletterSection>) => void;
}

// ============================================
// CONTENT SETTINGS
// ============================================

export function NewsletterContentSettings({ section, onUpdate }: NewsletterSettingsProps) {
  const updateContent = (key: string, value: string) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  return (
    <>
      <SettingsGroup title="טופס">
        <TextField
          label="טקסט placeholder"
          value={(section.content.placeholder as string) || 'כתובת אימייל'}
          onChange={(v) => updateContent('placeholder', v)}
          placeholder="כתובת אימייל"
        />
        <TextField
          label="טקסט כפתור"
          value={(section.content.buttonText as string) || 'הרשמה'}
          onChange={(v) => updateContent('buttonText', v)}
          placeholder="הרשמה"
        />
      </SettingsGroup>
    </>
  );
}

// ============================================
// DESIGN SETTINGS
// ============================================

export function NewsletterDesignSettings({ section, onUpdate }: NewsletterSettingsProps) {
  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
  };

  return (
    <div className="p-4 space-y-6">
      <SettingsGroup title="טיפוגרפיה">
        <TitleTypography settings={section.settings} onChange={updateSettings} />
        <SubtitleTypography settings={section.settings} onChange={updateSettings} />
      </SettingsGroup>

      <SettingsGroup title="עיצוב כפתור">
        <ColorField
          label="צבע רקע כפתור"
          value={(section.settings.buttonBackgroundColor as string) || '#000000'}
          onChange={(v) => updateSettings('buttonBackgroundColor', v)}
        />
        <ColorField
          label="צבע טקסט כפתור"
          value={(section.settings.buttonTextColor as string) || '#ffffff'}
          onChange={(v) => updateSettings('buttonTextColor', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="עיצוב שדה">
        <ColorField
          label="צבע מסגרת"
          value={(section.settings.inputBorderColor as string) || '#e5e7eb'}
          onChange={(v) => updateSettings('inputBorderColor', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="רקע">
        <BackgroundColorControl 
          settings={section.settings} 
          onChange={updateSettings}
          defaultColor="#f9fafb"
        />
      </SettingsGroup>
    </div>
  );
}

