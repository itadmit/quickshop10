'use client';

/**
 * FeaturesPanel - Settings panel for features section
 * פאנל הגדרות לסקשן חוזקות
 */

import { useState } from 'react';
import { 
  EditorInput,
  EditorThemeProvider,
  ThemeToggle,
  EditorSlider,
  EditorColorPicker,
  EditorSelect,
} from '../ui';

import {
  TypographyControl,
  AdvancedControl,
  VisibilityControl,
} from '../controls';

// Mini Accordion
function MiniAccordion({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[var(--editor-border-default)] last:border-b-0">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center gap-2 py-3 hover:bg-[var(--editor-bg-secondary)] transition-colors">
        <svg className={`w-3 h-3 text-[var(--editor-text-muted)] transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
        <span className="text-xs font-medium text-[var(--editor-text-primary)]">{title}</span>
      </button>
      {isOpen && <div className="pb-3 pl-5">{children}</div>}
    </div>
  );
}

const ICONS = [
  { value: 'truck', label: '🚚 משלוח' },
  { value: 'refresh', label: '🔄 החזרות' },
  { value: 'shield', label: '🛡️ אבטחה' },
  { value: 'message', label: '💬 תמיכה' },
  { value: 'heart', label: '❤️ לב' },
  { value: 'check', label: '✓ וי' },
  { value: 'sparkles', label: '✨ כוכבים' },
  { value: 'clock', label: '⏰ שעון' },
  { value: 'gift', label: '🎁 מתנה' },
];

interface Section {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

interface FeaturesPanelProps {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
  onClose?: () => void;
  onDelete?: () => void;
}

type TabType = 'content' | 'design' | 'advanced';

export function FeaturesPanel({ section, onUpdate, onClose, onDelete }: FeaturesPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('content');

  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
  };

  const updateMultipleSettings = (updates: Record<string, unknown>) => {
    onUpdate({ settings: { ...section.settings, ...updates } });
  };

  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  const features = (section.content.features as Array<{icon: string; title: string; description: string}>) || [];

  const updateFeature = (index: number, field: string, value: unknown) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    updateContent('features', newFeatures);
  };

  const addFeature = () => {
    updateContent('features', [...features, { icon: 'sparkles', title: '', description: '' }]);
  };

  const removeFeature = (index: number) => {
    updateContent('features', features.filter((_, i) => i !== index));
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'content', label: 'תוכן' },
    { id: 'design', label: 'עיצוב' },
    { id: 'advanced', label: 'מתקדם' },
  ];

  return (
    <EditorThemeProvider defaultMode="light">
      <div className="flex flex-col h-full bg-[var(--editor-bg-primary)]" dir="rtl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--editor-border-default)] bg-[var(--editor-bg-secondary)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[var(--editor-text-primary)]">חוזקות</h3>
            <ThemeToggle />
          </div>
          <div className="flex gap-1 p-1 bg-[var(--editor-bg-tertiary)] rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[var(--editor-bg-primary)] text-[var(--editor-text-primary)] shadow-sm'
                    : 'text-[var(--editor-text-muted)] hover:text-[var(--editor-text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'content' && (
            <div className="space-y-0">
              <MiniAccordion title="כותרות" defaultOpen={true}>
                <div className="space-y-3">
                  <EditorInput label="כותרת" value={(section.title as string) || ''} onChange={(v) => onUpdate({ title: v })} />
                  <EditorInput label="תת-כותרת" value={(section.subtitle as string) || ''} onChange={(v) => onUpdate({ subtitle: v })} />
                </div>
              </MiniAccordion>

              <MiniAccordion title="חוזקות" defaultOpen={true}>
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div key={index} className="p-3 bg-[var(--editor-bg-tertiary)] rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">חוזק {index + 1}</span>
                        <button onClick={() => removeFeature(index)} className="text-red-500 text-xs hover:text-red-600">מחק</button>
                      </div>
                      <EditorSelect label="אייקון" value={feature.icon} onChange={(v) => updateFeature(index, 'icon', v)} options={ICONS} />
                      <EditorInput label="כותרת" value={feature.title} onChange={(v) => updateFeature(index, 'title', v)} />
                      <EditorInput label="תיאור" value={feature.description} onChange={(v) => updateFeature(index, 'description', v)} />
                    </div>
                  ))}
                  <button onClick={addFeature} className="w-full py-2 text-xs text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50">+ הוסף חוזק</button>
                </div>
              </MiniAccordion>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-0">
              <MiniAccordion title="פריסה" defaultOpen={true}>
                <div className="space-y-4">
                  <EditorSlider label="עמודות (מחשב)" value={(section.settings.columns as number) || 4} onChange={(v) => updateSettings('columns', v)} min={2} max={6} step={1} />
                  <EditorSlider label="עמודות (מובייל)" value={(section.settings.mobileColumns as number) || 2} onChange={(v) => updateSettings('mobileColumns', v)} min={1} max={3} step={1} />
                  <EditorSlider label="רווח" value={(section.settings.gap as number) || 32} onChange={(v) => updateSettings('gap', v)} min={16} max={64} />
                </div>
              </MiniAccordion>

              <MiniAccordion title="אייקונים" defaultOpen={false}>
                <div className="space-y-3">
                  <EditorColorPicker label="צבע אייקון" value={(section.settings.iconColor as string) || '#000000'} onChange={(v) => updateSettings('iconColor', v)} />
                  <EditorSlider label="גודל אייקון" value={(section.settings.iconSize as number) || 48} onChange={(v) => updateSettings('iconSize', v)} min={24} max={80} />
                </div>
              </MiniAccordion>

              <MiniAccordion title="צבעים" defaultOpen={false}>
                <div className="space-y-3">
                  <EditorColorPicker label="רקע" value={(section.settings.backgroundColor as string) || '#ffffff'} onChange={(v) => updateSettings('backgroundColor', v)} />
                  <EditorColorPicker label="צבע כותרת פריט" value={(section.settings.featureTitleColor as string) || '#111827'} onChange={(v) => updateSettings('featureTitleColor', v)} />
                  <EditorColorPicker label="צבע תיאור" value={(section.settings.featureDescriptionColor as string) || '#6b7280'} onChange={(v) => updateSettings('featureDescriptionColor', v)} />
                </div>
              </MiniAccordion>

              <MiniAccordion title="כותרת ראשית" defaultOpen={false}>
                <TypographyControl label="" prefix="title" settings={section.settings} onChange={updateSettings} defaultSize={30} defaultSizeMobile={24} defaultColor="#000000" defaultWeight="bold" />
              </MiniAccordion>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-0">
              <MiniAccordion title="נראות" defaultOpen={true}>
                <VisibilityControl settings={section.settings} onChange={updateSettings} />
              </MiniAccordion>
              <AdvancedControl settings={section.settings} onChange={updateSettings} onChangeMultiple={updateMultipleSettings} defaults={{ paddingTop: 64, paddingBottom: 64 }} />
            </div>
          )}
        </div>

        {onDelete && (
          <div className="p-4 border-t border-[var(--editor-border-default)] bg-[var(--editor-bg-secondary)]">
            <button onClick={onDelete} className="w-full py-3 px-4 text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              מחק סקשן
            </button>
          </div>
        )}
      </div>
    </EditorThemeProvider>
  );
}

