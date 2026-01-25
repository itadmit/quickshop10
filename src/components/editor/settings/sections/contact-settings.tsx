'use client';

/**
 * Contact Section Settings - Content & Design
 * הגדרות סקשן יצירת קשר - תוכן ועיצוב
 */

import {
  SettingsGroup,
  TextField,
  TextAreaField,
  SelectField,
  SwitchField,
  ColorField,
} from '../common';
import {
  TitleTypography,
} from '../common/typography-settings';
import { BackgroundColorControl } from '../common/background-settings';

// ============================================
// TYPES
// ============================================

interface ContactSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: {
    email?: string;
    phone?: string;
    address?: string;
    hours?: string;
    showForm?: boolean;
    submitButtonText?: string;
    text?: string;
  };
  settings: Record<string, unknown>;
}

interface ContactSettingsProps {
  section: ContactSection;
  onUpdate: (updates: Partial<ContactSection>) => void;
}

// ============================================
// CONTENT SETTINGS
// ============================================

export function ContactContentSettings({ section, onUpdate }: ContactSettingsProps) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  return (
    <>
      <SettingsGroup title="פרטי התקשרות">
        <TextField
          label="אימייל"
          value={(section.content.email as string) || ''}
          onChange={(v) => updateContent('email', v)}
          placeholder="info@example.com"
        />
        <TextField
          label="טלפון"
          value={(section.content.phone as string) || ''}
          onChange={(v) => updateContent('phone', v)}
          placeholder="03-1234567"
        />
        <TextField
          label="כתובת"
          value={(section.content.address as string) || ''}
          onChange={(v) => updateContent('address', v)}
          placeholder="רחוב הדוגמה 1, תל אביב"
        />
        <TextField
          label="שעות פעילות"
          value={(section.content.hours as string) || ''}
          onChange={(v) => updateContent('hours', v)}
          placeholder="א-ה 9:00-18:00"
        />
      </SettingsGroup>

      <SettingsGroup title="טופס">
        <SwitchField
          label="הצג טופס"
          value={(section.content.showForm as boolean) !== false}
          onChange={(v) => updateContent('showForm', v)}
        />
        <TextField
          label="טקסט כפתור שליחה"
          value={(section.content.submitButtonText as string) || 'שלח הודעה'}
          onChange={(v) => updateContent('submitButtonText', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="טקסט נוסף">
        <TextAreaField
          label="טקסט חופשי"
          value={(section.content.text as string) || ''}
          onChange={(v) => updateContent('text', v)}
          placeholder="טקסט נוסף..."
          rows={3}
        />
      </SettingsGroup>
    </>
  );
}

// ============================================
// DESIGN SETTINGS
// ============================================

export function ContactDesignSettings({ section, onUpdate }: ContactSettingsProps) {
  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
  };

  return (
    <div className="p-4 space-y-6">
      <SettingsGroup title="טיפוגרפיה">
        <TitleTypography settings={section.settings} onChange={updateSettings} />
      </SettingsGroup>

      <SettingsGroup title="פריסה">
        <SelectField
          label="סגנון"
          value={(section.settings.layout as string) || 'split'}
          options={[
            { value: 'simple', label: 'פשוט' },
            { value: 'split', label: 'מפוצל' },
            { value: 'form-only', label: 'טופס בלבד' },
            { value: 'info-only', label: 'מידע בלבד' },
          ]}
          onChange={(v) => updateSettings('layout', v)}
        />
        <SelectField
          label="יישור טקסט"
          value={(section.settings.textAlign as string) || 'center'}
          options={[
            { value: 'right', label: 'ימין' },
            { value: 'center', label: 'מרכז' },
            { value: 'left', label: 'שמאל' },
          ]}
          onChange={(v) => updateSettings('textAlign', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="עיצוב כפתור">
        <ColorField
          label="צבע רקע"
          value={(section.settings.buttonBackgroundColor as string) || '#000000'}
          onChange={(v) => updateSettings('buttonBackgroundColor', v)}
        />
        <ColorField
          label="צבע טקסט"
          value={(section.settings.buttonTextColor as string) || '#ffffff'}
          onChange={(v) => updateSettings('buttonTextColor', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="רקע">
        <BackgroundColorControl settings={section.settings} onChange={updateSettings} />
        <ColorField
          label="צבע טקסט"
          value={(section.settings.textColor as string) || '#000000'}
          onChange={(v) => updateSettings('textColor', v)}
        />
      </SettingsGroup>
    </div>
  );
}

