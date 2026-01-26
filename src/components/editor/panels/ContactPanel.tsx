'use client';

/**
 * ContactPanel - Settings panel for contact section
 * פאנל הגדרות לסקשן יצירת קשר
 */

import { useState } from 'react';
import { 
  EditorInput,
  EditorThemeProvider,
  ThemeToggle,
  EditorColorPicker,
} from '../ui';

import {
  TypographyControl,
  ButtonControl,
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

interface Section {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

interface ContactPanelProps {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
  onClose?: () => void;
  onDelete?: () => void;
}

type TabType = 'content' | 'design' | 'advanced';

export function ContactPanel({ section, onUpdate, onClose, onDelete }: ContactPanelProps) {
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
            <h3 className="text-sm font-medium text-[var(--editor-text-primary)]">יצירת קשר</h3>
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

              <MiniAccordion title="פרטי קשר" defaultOpen={true}>
                <div className="space-y-3">
                  <EditorInput label="אימייל" value={(section.content.email as string) || ''} onChange={(v) => updateContent('email', v)} placeholder="contact@example.com" />
                  <EditorInput label="טלפון" value={(section.content.phone as string) || ''} onChange={(v) => updateContent('phone', v)} placeholder="050-1234567" />
                  <EditorInput label="כתובת" value={(section.content.address as string) || ''} onChange={(v) => updateContent('address', v)} placeholder="תל אביב, ישראל" />
                  <EditorInput label="שעות פעילות" value={(section.content.hours as string) || ''} onChange={(v) => updateContent('hours', v)} placeholder="א'-ה' 9:00-18:00" />
                </div>
              </MiniAccordion>

              <MiniAccordion title="טופס" defaultOpen={false}>
                <div className="space-y-3">
                  <EditorInput label="טקסט כפתור" value={(section.content.buttonText as string) || 'שלח הודעה'} onChange={(v) => updateContent('buttonText', v)} />
                  <EditorInput label="הודעת הצלחה" value={(section.content.successMessage as string) || 'ההודעה נשלחה בהצלחה!'} onChange={(v) => updateContent('successMessage', v)} />
                </div>
              </MiniAccordion>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-0">
              <MiniAccordion title="צבעים" defaultOpen={true}>
                <div className="space-y-3">
                  <EditorColorPicker label="רקע סקשן" value={(section.settings.backgroundColor as string) || '#ffffff'} onChange={(v) => updateSettings('backgroundColor', v)} />
                </div>
              </MiniAccordion>

              <MiniAccordion title="כותרת" defaultOpen={false}>
                <TypographyControl label="" prefix="title" settings={section.settings} onChange={updateSettings} defaultSize={30} defaultSizeMobile={24} defaultColor="#000000" defaultWeight="bold" />
              </MiniAccordion>

              <MiniAccordion title="כפתור" defaultOpen={false}>
                <ButtonControl settings={section.settings} onChange={updateSettings} />
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

