'use client';

/**
 * Features Section Settings - Content & Design
 * הגדרות סקשן חוזקות - תוכן ועיצוב
 */

import {
  SettingsGroup,
  SelectField,
  SwitchField,
} from '../common';
import {
  TitleTypography,
  SubtitleTypography,
} from '../common/typography-settings';
import {
  BackgroundColorControl,
  CardBackgroundControl,
} from '../common/background-settings';
import {
  ColumnsControl,
  MobileColumnsControl,
  GapControl,
  LayoutTypeControl,
} from '../common/grid-settings';
import { FEATURE_ICON_PATHS } from '@/lib/section-system';

// ============================================
// TYPES
// ============================================

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface FeaturesSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: {
    features?: Feature[];
  };
  settings: Record<string, unknown>;
}

interface FeaturesSettingsProps {
  section: FeaturesSection;
  onUpdate: (updates: Partial<FeaturesSection>) => void;
}

// ============================================
// ICON SELECTOR
// ============================================

const ICON_OPTIONS = Object.keys(FEATURE_ICON_PATHS).map(key => ({
  value: key,
  label: key.replace(/_/g, ' '),
}));

// ============================================
// CONTENT SETTINGS
// ============================================

export function FeaturesContentSettings({ section, onUpdate }: FeaturesSettingsProps) {
  const features = (section.content.features as Feature[]) || [
    { id: '1', icon: 'shield', title: 'אחריות מלאה', description: 'אחריות יצרן לשנתיים' },
    { id: '2', icon: 'truck', title: 'משלוח מהיר', description: 'משלוח עד 3 ימי עסקים' },
    { id: '3', icon: 'refresh', title: 'החזרה קלה', description: '30 יום להחזרה' },
  ];

  const updateFeatures = (newFeatures: Feature[]) => {
    onUpdate({ content: { ...section.content, features: newFeatures } });
  };

  const updateFeature = (index: number, field: keyof Feature, value: string) => {
    const newFeatures = features.map((f, i) => 
      i === index ? { ...f, [field]: value } : f
    );
    updateFeatures(newFeatures);
  };

  const addFeature = () => {
    const newId = String(Date.now());
    updateFeatures([...features, { id: newId, icon: 'star', title: 'חוזקה חדשה', description: 'תיאור' }]);
  };

  const removeFeature = (index: number) => {
    updateFeatures(features.filter((_, i) => i !== index));
  };

  return (
    <SettingsGroup title="חוזקות">
      <div className="space-y-3">
        {features.map((feature, index) => (
          <div key={feature.id} className="border border-[var(--editor-border-default)] rounded-lg p-3 space-y-2 bg-[var(--editor-bg-primary)]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--editor-text-muted)]">חוזקה {index + 1}</span>
              <button
                onClick={() => removeFeature(index)}
                className="p-1 hover:bg-red-100 text-red-600 rounded"
                title="הסר"
              >
                ✕
              </button>
            </div>
            
            {/* Icon Selector */}
            <div>
              <label className="block text-xs text-[var(--editor-text-muted)] mb-1">אייקון</label>
              <select
                value={feature.icon}
                onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                className="w-full text-sm border border-[var(--editor-border-default)] rounded px-2 py-1 bg-[var(--editor-bg-tertiary)] text-[var(--editor-text-primary)]"
              >
                {ICON_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <input
              type="text"
              value={feature.title}
              onChange={(e) => updateFeature(index, 'title', e.target.value)}
              className="w-full text-sm font-medium border border-[var(--editor-border-default)] rounded px-2 py-1 bg-[var(--editor-bg-tertiary)] text-[var(--editor-text-primary)]"
              placeholder="כותרת"
            />
            <textarea
              value={feature.description}
              onChange={(e) => updateFeature(index, 'description', e.target.value)}
              className="w-full text-sm border border-[var(--editor-border-default)] rounded px-2 py-1 min-h-[40px] bg-[var(--editor-bg-tertiary)] text-[var(--editor-text-primary)]"
              placeholder="תיאור"
            />
          </div>
        ))}
        <button
          onClick={addFeature}
          className="w-full py-2 border-2 border-dashed border-[var(--editor-border-default)] rounded-lg text-sm text-[var(--editor-text-muted)] hover:border-[var(--editor-border-hover)]"
        >
          + הוסף חוזקה
        </button>
      </div>
    </SettingsGroup>
  );
}

// ============================================
// DESIGN SETTINGS
// ============================================

export function FeaturesDesignSettings({ section, onUpdate }: FeaturesSettingsProps) {
  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Typography */}
      <SettingsGroup title="טיפוגרפיה">
        <TitleTypography settings={section.settings} onChange={updateSettings} />
        <SubtitleTypography settings={section.settings} onChange={updateSettings} />
      </SettingsGroup>

      {/* Layout */}
      <SettingsGroup title="פריסה">
        <LayoutTypeControl settings={section.settings} onChange={updateSettings} />
        <ColumnsControl settings={section.settings} onChange={updateSettings} />
        <MobileColumnsControl settings={section.settings} onChange={updateSettings} />
        <GapControl settings={section.settings} onChange={updateSettings} />
      </SettingsGroup>

      {/* Icon Style */}
      <SettingsGroup title="עיצוב אייקון">
        <SelectField
          label="גודל אייקון"
          value={(section.settings.iconSize as string) || 'md'}
          options={[
            { value: 'sm', label: 'קטן' },
            { value: 'md', label: 'בינוני' },
            { value: 'lg', label: 'גדול' },
          ]}
          onChange={(v) => updateSettings('iconSize', v)}
        />
        <SelectField
          label="צבע אייקון"
          value={(section.settings.iconColor as string) || 'accent'}
          options={[
            { value: 'accent', label: 'צבע מותג' },
            { value: 'black', label: 'שחור' },
            { value: 'gray', label: 'אפור' },
          ]}
          onChange={(v) => updateSettings('iconColor', v)}
        />
        <SwitchField
          label="רקע לאייקון"
          value={(section.settings.iconBackground as boolean) || false}
          onChange={(v) => updateSettings('iconBackground', v)}
        />
      </SettingsGroup>

      {/* Background */}
      <SettingsGroup title="רקע">
        <BackgroundColorControl settings={section.settings} onChange={updateSettings} />
        <CardBackgroundControl settings={section.settings} onChange={updateSettings} />
      </SettingsGroup>
    </div>
  );
}

