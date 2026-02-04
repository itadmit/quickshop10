'use client';

/**
 * Logos Section Settings - Content & Design
 * הגדרות סקשן לוגואים - תוכן ועיצוב
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
  GapControl,
  LayoutTypeControl,
} from '../common/grid-settings';

// ============================================
// TYPES
// ============================================

interface LogoItem {
  id: string;
  name: string;
  url: string;
  link?: string;
}

interface LogosSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: {
    logos?: LogoItem[];
  };
  settings: Record<string, unknown>;
}

interface LogosSettingsProps {
  section: LogosSection;
  onUpdate: (updates: Partial<LogosSection>) => void;
}

// ============================================
// CONTENT SETTINGS
// ============================================

export function LogosContentSettings({ section, onUpdate }: LogosSettingsProps) {
  const logos = (section.content.logos as LogoItem[]) || [];

  const updateLogos = (newLogos: LogoItem[]) => {
    onUpdate({ content: { ...section.content, logos: newLogos } });
  };

  const addLogo = () => {
    const newId = String(Date.now());
    updateLogos([...logos, { id: newId, name: 'לוגו חדש', url: '' }]);
  };

  const updateLogo = (index: number, field: keyof LogoItem, value: string) => {
    const newLogos = logos.map((logo, i) => 
      i === index ? { ...logo, [field]: value } : logo
    );
    updateLogos(newLogos);
  };

  const removeLogo = (index: number) => {
    updateLogos(logos.filter((_, i) => i !== index));
  };

  return (
    <SettingsGroup title="לוגואים">
      <div className="space-y-3">
        {logos.map((logo, index) => (
          <div key={logo.id} className="border border-[var(--editor-border-default)] rounded-lg p-3 space-y-2 bg-[var(--editor-bg-primary)]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--editor-text-muted)]">לוגו {index + 1}</span>
              <button
                onClick={() => removeLogo(index)}
                className="p-1 hover:bg-red-100 text-red-600 rounded"
              >
                ✕
              </button>
            </div>
            {logo.url ? (
              <img src={logo.url} alt={logo.name} className="w-full h-12 object-contain rounded bg-gray-50" />
            ) : (
              <div className="w-full h-12 bg-[var(--editor-bg-secondary)] rounded flex items-center justify-center text-[var(--editor-text-muted)] text-xs">
                אין תמונה
              </div>
            )}
            <input
              type="text"
              value={logo.name}
              onChange={(e) => updateLogo(index, 'name', e.target.value)}
              className="w-full text-sm border border-[var(--editor-border-default)] rounded px-2 py-1 bg-[var(--editor-bg-tertiary)] text-[var(--editor-text-primary)]"
              placeholder="שם"
            />
            <input
              type="text"
              value={logo.url}
              onChange={(e) => updateLogo(index, 'url', e.target.value)}
              className="w-full text-xs border border-[var(--editor-border-default)] rounded px-2 py-1 bg-[var(--editor-bg-tertiary)] text-[var(--editor-text-primary)]"
              placeholder="URL לוגו"
            />
            <input
              type="text"
              value={logo.link || ''}
              onChange={(e) => updateLogo(index, 'link', e.target.value)}
              className="w-full text-xs border border-[var(--editor-border-default)] rounded px-2 py-1 bg-[var(--editor-bg-tertiary)] text-[var(--editor-text-primary)]"
              placeholder="קישור (אופציונלי)"
            />
          </div>
        ))}
        <button
          onClick={addLogo}
          className="w-full py-2 border-2 border-dashed border-[var(--editor-border-default)] rounded-lg text-sm text-[var(--editor-text-muted)] hover:border-[var(--editor-border-hover)]"
        >
          + הוסף לוגו
        </button>
      </div>
    </SettingsGroup>
  );
}

// ============================================
// DESIGN SETTINGS
// ============================================

export function LogosDesignSettings({ section, onUpdate }: LogosSettingsProps) {
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
        <ColumnsControl settings={section.settings} onChange={updateSettings} options={[3, 4, 5, 6]} />
        <GapControl settings={section.settings} onChange={updateSettings} />
      </SettingsGroup>

      <SettingsGroup title="לוגואים">
        <SliderField
          label="גובה לוגו"
          value={(section.settings.logoHeight as number) || 48}
          min={24}
          max={120}
          suffix="px"
          onChange={(v) => updateSettings('logoHeight', v)}
        />
        <SwitchField
          label="גווני אפור"
          description="הצג לוגואים בגווני אפור"
          value={(section.settings.grayscale as boolean) || false}
          onChange={(v) => updateSettings('grayscale', v)}
        />
        <SliderField
          label="שקיפות"
          value={Math.round(((section.settings.opacity as number) ?? 1) * 100)}
          min={20}
          max={100}
          suffix="%"
          onChange={(v) => updateSettings('opacity', v / 100)}
        />
      </SettingsGroup>

      {(section.settings.layout as string) === 'slider' && (
        <SettingsGroup title="הגדרות סליידר">
          <SwitchField
            label="הפעלה אוטומטית"
            value={(section.settings.autoplay as boolean) !== false}
            onChange={(v) => updateSettings('autoplay', v)}
          />
          <SliderField
            label="מהירות (שניות)"
            value={(section.settings.autoplaySpeed as number) || 3}
            min={1}
            max={10}
            suffix="s"
            onChange={(v) => updateSettings('autoplaySpeed', v)}
          />
        </SettingsGroup>
      )}

      <SettingsGroup title="רקע">
        <BackgroundColorControl settings={section.settings} onChange={updateSettings} />
      </SettingsGroup>
    </div>
  );
}

