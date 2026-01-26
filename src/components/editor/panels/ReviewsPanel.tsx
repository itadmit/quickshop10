'use client';

/**
 * ReviewsPanel - Settings panel for reviews section
 * פאנל הגדרות לסקשן ביקורות
 */

import { useState } from 'react';
import { 
  EditorInput,
  EditorThemeProvider,
  ThemeToggle,
  EditorSlider,
  EditorColorPicker,
} from '../ui';

import {
  TypographyControl,
  AlignmentControl,
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

interface ReviewsPanelProps {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
  onClose?: () => void;
  onDelete?: () => void;
}

type TabType = 'content' | 'design' | 'advanced';

export function ReviewsPanel({ section, onUpdate, onClose, onDelete }: ReviewsPanelProps) {
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

  const reviews = (section.content.reviews as Array<{author: string; text: string; rating: number}>) || [];

  const updateReview = (index: number, field: string, value: unknown) => {
    const newReviews = [...reviews];
    newReviews[index] = { ...newReviews[index], [field]: value };
    updateContent('reviews', newReviews);
  };

  const addReview = () => {
    updateContent('reviews', [...reviews, { author: '', text: '', rating: 5 }]);
  };

  const removeReview = (index: number) => {
    updateContent('reviews', reviews.filter((_, i) => i !== index));
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
            <h3 className="text-sm font-medium text-[var(--editor-text-primary)]">ביקורות</h3>
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

              <MiniAccordion title="ביקורות" defaultOpen={true}>
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <div key={index} className="p-3 bg-[var(--editor-bg-tertiary)] rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">ביקורת {index + 1}</span>
                        <button onClick={() => removeReview(index)} className="text-red-500 text-xs hover:text-red-600">מחק</button>
                      </div>
                      <EditorInput label="שם" value={review.author} onChange={(v) => updateReview(index, 'author', v)} />
                      <EditorInput label="טקסט" value={review.text} onChange={(v) => updateReview(index, 'text', v)} />
                      <EditorSlider label="דירוג" value={review.rating} onChange={(v) => updateReview(index, 'rating', v)} min={1} max={5} step={1} />
                    </div>
                  ))}
                  <button onClick={addReview} className="w-full py-2 text-xs text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50">+ הוסף ביקורת</button>
                </div>
              </MiniAccordion>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-0">
              <MiniAccordion title="פריסה" defaultOpen={true}>
                <div className="space-y-4">
                  <EditorSlider label="עמודות (מחשב)" value={(section.settings.columns as number) || 3} onChange={(v) => updateSettings('columns', v)} min={1} max={4} step={1} />
                  <EditorSlider label="עמודות (מובייל)" value={(section.settings.mobileColumns as number) || 1} onChange={(v) => updateSettings('mobileColumns', v)} min={1} max={2} step={1} />
                  <EditorSlider label="רווח בין כרטיסים" value={(section.settings.gap as number) || 24} onChange={(v) => updateSettings('gap', v)} min={8} max={48} />
                  <AlignmentControl settings={section.settings} onChange={updateSettings} label="יישור תוכן" settingKey="contentAlign" />
                </div>
              </MiniAccordion>

              <MiniAccordion title="צבעים" defaultOpen={false}>
                <div className="space-y-3">
                  <EditorColorPicker label="רקע סקשן" value={(section.settings.backgroundColor as string) || '#f9fafb'} onChange={(v) => updateSettings('backgroundColor', v)} />
                  <EditorColorPicker label="רקע כרטיס" value={(section.settings.cardBackground as string) || '#ffffff'} onChange={(v) => updateSettings('cardBackground', v)} />
                  <EditorColorPicker label="צבע כוכבים" value={(section.settings.starColor as string) || '#facc15'} onChange={(v) => updateSettings('starColor', v)} />
                </div>
              </MiniAccordion>

              <MiniAccordion title="כותרת" defaultOpen={false}>
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

