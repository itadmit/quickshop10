'use client';

/**
 * Hero Section Settings - Content & Design
 * הגדרות סקשן הירו - תוכן ועיצוב
 */

import {
  SettingsGroup,
  TextField,
  TextAreaField,
  SelectField,
  SliderField,
  ColorField,
  ToggleField,
} from '../common';
import {
  TitleTypography,
  SubtitleTypography,
} from '../common/typography-settings';
import { OverlayControl, BackgroundColorControl } from '../common/background-settings';

// ============================================
// TYPES
// ============================================

interface HeroSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: {
    imageUrl?: string;
    mobileImageUrl?: string;
    videoUrl?: string;
    buttonText?: string;
    buttonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
  };
  settings: Record<string, unknown>;
}

interface HeroSettingsProps {
  section: HeroSection;
  onUpdate: (updates: Partial<HeroSection>) => void;
  storeInfo?: { id: string; slug: string };
}

// ============================================
// CONTENT SETTINGS
// ============================================

export function HeroContentSettings({ section, onUpdate, storeInfo }: HeroSettingsProps) {
  const updateContent = (key: string, value: string) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  return (
    <>
      <SettingsGroup title="מדיה">
        <TextField
          label="תמונה (מחשב)"
          value={(section.content.imageUrl as string) || ''}
          onChange={(v) => updateContent('imageUrl', v)}
          placeholder="URL תמונה"
        />
        <TextField
          label="תמונה (מובייל)"
          value={(section.content.mobileImageUrl as string) || ''}
          onChange={(v) => updateContent('mobileImageUrl', v)}
          placeholder="URL תמונה למובייל"
        />
        <TextField
          label="וידאו (אופציונלי)"
          value={(section.content.videoUrl as string) || ''}
          onChange={(v) => updateContent('videoUrl', v)}
          placeholder="URL וידאו"
        />
      </SettingsGroup>

      <SettingsGroup title="כפתור ראשי">
        <TextField
          label="טקסט"
          value={(section.content.buttonText as string) || ''}
          onChange={(v) => updateContent('buttonText', v)}
          placeholder="קנה עכשיו"
        />
        <TextField
          label="קישור"
          value={(section.content.buttonLink as string) || ''}
          onChange={(v) => updateContent('buttonLink', v)}
          placeholder="/products"
        />
      </SettingsGroup>

      <SettingsGroup title="כפתור משני">
        <TextField
          label="טקסט"
          value={(section.content.secondaryButtonText as string) || ''}
          onChange={(v) => updateContent('secondaryButtonText', v)}
          placeholder="למידע נוסף"
        />
        <TextField
          label="קישור"
          value={(section.content.secondaryButtonLink as string) || ''}
          onChange={(v) => updateContent('secondaryButtonLink', v)}
          placeholder="/about"
        />
      </SettingsGroup>
    </>
  );
}

// ============================================
// DESIGN SETTINGS
// ============================================

export function HeroDesignSettings({ section, onUpdate }: HeroSettingsProps) {
  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
  };

  return (
    <div className="p-4 space-y-6">
      <SettingsGroup title="טיפוגרפיה">
        <TitleTypography 
          settings={section.settings} 
          onChange={updateSettings}
          defaultColor="#ffffff"
        />
        <SubtitleTypography 
          settings={section.settings} 
          onChange={updateSettings}
          defaultColor="rgba(255,255,255,0.9)"
        />
      </SettingsGroup>

      <SettingsGroup title="מיקום טקסט">
        <ToggleField
          label="יישור אופקי"
          options={['ימין', 'מרכז', 'שמאל']}
          value={(section.settings.textAlign as string) === 'left' ? 'ימין' : (section.settings.textAlign as string) === 'right' ? 'שמאל' : 'מרכז'}
          onChange={(v) => updateSettings('textAlign', v === 'ימין' ? 'left' : v === 'שמאל' ? 'right' : 'center')}
        />
        <ToggleField
          label="יישור אנכי"
          options={['למעלה', 'מרכז', 'למטה']}
          value={(section.settings.textPosition as string) === 'top' ? 'למעלה' : (section.settings.textPosition as string) === 'bottom' ? 'למטה' : 'מרכז'}
          onChange={(v) => updateSettings('textPosition', v === 'למעלה' ? 'top' : v === 'למטה' ? 'bottom' : 'center')}
        />
      </SettingsGroup>

      <SettingsGroup title="שכבה וצבעים">
        <OverlayControl settings={section.settings} onChange={updateSettings} />
        <BackgroundColorControl 
          settings={section.settings} 
          onChange={updateSettings}
          label="צבע רקע (אם אין תמונה)"
        />
      </SettingsGroup>

      <SettingsGroup title="עיצוב כפתור">
        <ColorField
          label="צבע רקע"
          value={(section.settings.buttonBackground as string) || '#FFFFFF'}
          onChange={(v) => updateSettings('buttonBackground', v)}
        />
        <ColorField
          label="צבע טקסט"
          value={(section.settings.buttonTextColor as string) || '#000000'}
          onChange={(v) => updateSettings('buttonTextColor', v)}
        />
        <ColorField
          label="צבע מסגרת"
          value={(section.settings.buttonBorderColor as string) || '#FFFFFF'}
          onChange={(v) => updateSettings('buttonBorderColor', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="מיכל ופריסה">
        <SelectField
          label="רוחב תוכן"
          value={(section.settings.containerType as string) || 'container'}
          options={[
            { value: 'container', label: 'קונטיינר' },
            { value: 'full', label: 'רוחב מלא' },
          ]}
          onChange={(v) => updateSettings('containerType', v)}
        />
        <SliderField
          label="ריווח עליון"
          value={(section.settings.paddingTop as number) || 0}
          min={0}
          max={100}
          suffix="px"
          onChange={(v) => updateSettings('paddingTop', v)}
        />
        <SliderField
          label="ריווח תחתון"
          value={(section.settings.paddingBottom as number) || 0}
          min={0}
          max={100}
          suffix="px"
          onChange={(v) => updateSettings('paddingBottom', v)}
        />
      </SettingsGroup>
    </div>
  );
}

