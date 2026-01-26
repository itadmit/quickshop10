'use client';

/**
 * HeroPanel - Modern settings panel for hero section (Figma-style)
 * פאנל הגדרות מודרני לסקשן באנר ראשי
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
  ButtonControl,
  AlignmentControl,
  VerticalAlignControl,
  AdvancedControl,
  VisibilityControl,
} from '../controls';

// ============================================
// Mini Accordion Component
// ============================================
interface MiniAccordionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function MiniAccordion({ title, defaultOpen = false, children }: MiniAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--editor-border-default)] last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 py-3 hover:bg-[var(--editor-bg-secondary)] transition-colors"
      >
        <svg 
          className={`w-3 h-3 text-[var(--editor-text-muted)] transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`}
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        <span className="text-xs font-medium text-[var(--editor-text-primary)]">{title}</span>
      </button>
      {isOpen && (
        <div className="pb-3 pl-5">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================
// Image Upload Field
// ============================================
interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}

function ImageField({ label, value, onChange, hint }: ImageFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-[var(--editor-text-secondary)]">{label}</label>
      {value ? (
        <div className="relative group">
          <img 
            src={value} 
            alt={label}
            className="w-full h-32 object-cover rounded-lg border border-[var(--editor-border-default)]"
          />
          <button
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="הזן URL של תמונה..."
          className="w-full px-3 py-2 text-xs bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] 
                     rounded-lg text-[var(--editor-text-primary)] placeholder-[var(--editor-text-muted)]
                     focus:outline-none focus:border-[var(--editor-border-focus)]"
        />
      )}
      {hint && <p className="text-[10px] text-[var(--editor-text-muted)]">{hint}</p>}
    </div>
  );
}

// ============================================
// Types
// ============================================
interface Section {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

interface HeroPanelProps {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
  onClose?: () => void;
  onDelete?: () => void;
}

type TabType = 'content' | 'design' | 'advanced';

// ============================================
// Main Component
// ============================================
export function HeroPanel({ section, onUpdate, onClose, onDelete }: HeroPanelProps) {
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
            <div className="flex items-center gap-2">
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 rounded hover:bg-[var(--editor-bg-hover)] transition-colors"
                >
                  <svg className="w-4 h-4 text-[var(--editor-text-secondary)] rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              )}
              <h3 className="text-sm font-medium text-[var(--editor-text-primary)]">באנר ראשי</h3>
            </div>
            <ThemeToggle />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-[var(--editor-bg-tertiary)] rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[var(--editor-bg-primary)] text-[var(--editor-text-primary)] shadow-sm'
                    : 'text-[var(--editor-text-muted)] hover:text-[var(--editor-text-primary)] hover:bg-[var(--editor-bg-hover)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            
            {/* ========================================== */}
            {/* TAB: תוכן (Content) */}
            {/* ========================================== */}
            {activeTab === 'content' && (
              <div className="space-y-0">
                {/* כותרות */}
                <MiniAccordion title="כותרות" defaultOpen={true}>
                  <div className="space-y-3">
                    <EditorInput
                      label="כותרת"
                      value={(section.title as string) || ''}
                      onChange={(v) => onUpdate({ title: v })}
                      placeholder="הזן כותרת"
                    />
                    
                    <EditorInput
                      label="תת-כותרת"
                      value={(section.subtitle as string) || ''}
                      onChange={(v) => onUpdate({ subtitle: v })}
                      placeholder="הזן תת-כותרת"
                    />
                  </div>
                </MiniAccordion>

                {/* תמונות */}
                <MiniAccordion title="תמונות רקע" defaultOpen={true}>
                  <div className="space-y-4">
                    <ImageField
                      label="תמונה - מחשב"
                      value={(section.content.imageUrl as string) || ''}
                      onChange={(v) => updateContent('imageUrl', v)}
                      hint="מומלץ 1920x800 פיקסלים"
                    />
                    
                    <ImageField
                      label="תמונה - מובייל (אופציונלי)"
                      value={(section.content.mobileImageUrl as string) || ''}
                      onChange={(v) => updateContent('mobileImageUrl', v)}
                      hint="מומלץ 768x600 פיקסלים"
                    />
                  </div>
                </MiniAccordion>

                {/* כפתור */}
                <MiniAccordion title="כפתור" defaultOpen={false}>
                  <div className="space-y-3">
                    <EditorInput
                      label="טקסט כפתור"
                      value={(section.content.buttonText as string) || ''}
                      onChange={(v) => updateContent('buttonText', v)}
                      placeholder="לחנות"
                    />
                    
                    <EditorInput
                      label="קישור"
                      value={(section.content.buttonLink as string) || ''}
                      onChange={(v) => updateContent('buttonLink', v)}
                      placeholder="/products"
                    />
                  </div>
                </MiniAccordion>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB: עיצוב (Design) */}
            {/* ========================================== */}
            {activeTab === 'design' && (
              <div className="space-y-0">
                {/* מיקום טקסט */}
                <MiniAccordion title="מיקום טקסט" defaultOpen={true}>
                  <div className="space-y-4">
                    <AlignmentControl
                      settings={section.settings}
                      onChange={updateSettings}
                      label="יישור אופקי"
                    />
                    
                    <VerticalAlignControl
                      settings={section.settings}
                      onChange={updateSettings}
                    />
                  </div>
                </MiniAccordion>

                {/* שכבה וצבעים */}
                <MiniAccordion title="שכבה וצבעים" defaultOpen={true}>
                  <div className="space-y-4">
                    <EditorSlider
                      label="שקיפות שכבה כהה"
                      value={((section.settings.overlay as number) || 0.3) * 100}
                      onChange={(v) => updateSettings('overlay', v / 100)}
                      min={0}
                      max={100}
                      step={5}
                      suffix="%"
                    />
                    
                    <EditorColorPicker
                      label="צבע רקע (אם אין תמונה)"
                      value={(section.settings.backgroundColor as string) || '#1f2937'}
                      onChange={(v) => updateSettings('backgroundColor', v)}
                    />
                  </div>
                </MiniAccordion>

                {/* עיצוב כפתור */}
                <MiniAccordion title="עיצוב כפתור" defaultOpen={false}>
                  <ButtonControl
                    settings={section.settings}
                    onChange={updateSettings}
                  />
                </MiniAccordion>

                {/* מיכל ופריסה */}
                <MiniAccordion title="מיכל ופריסה" defaultOpen={false}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--editor-text-secondary)]">רוחב תוכן</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateSettings('sectionWidth', 'full')}
                          className={`flex-1 py-2 px-3 text-xs rounded-lg border transition-all ${
                            (section.settings.sectionWidth || 'full') === 'full'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-[var(--editor-border-default)] hover:border-[var(--editor-border-hover)]'
                          }`}
                        >
                          מלא
                        </button>
                        <button
                          onClick={() => updateSettings('sectionWidth', 'boxed')}
                          className={`flex-1 py-2 px-3 text-xs rounded-lg border transition-all ${
                            section.settings.sectionWidth === 'boxed'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-[var(--editor-border-default)] hover:border-[var(--editor-border-hover)]'
                          }`}
                        >
                          קונטיינר
                        </button>
                      </div>
                    </div>

                    <EditorSlider
                      label="ריווח עליון"
                      value={(section.settings.paddingTop as number) || 0}
                      onChange={(v) => updateSettings('paddingTop', v)}
                      min={0}
                      max={200}
                    />
                    
                    <EditorSlider
                      label="ריווח תחתון"
                      value={(section.settings.paddingBottom as number) || 0}
                      onChange={(v) => updateSettings('paddingBottom', v)}
                      min={0}
                      max={200}
                    />
                  </div>
                </MiniAccordion>

                {/* טיפוגרפיה - כותרת */}
                <MiniAccordion title="כותרת" defaultOpen={false}>
                  <TypographyControl
                    label=""
                    prefix="title"
                    settings={section.settings}
                    onChange={updateSettings}
                    defaultSize={48}
                    defaultSizeMobile={32}
                    defaultColor="#ffffff"
                    defaultWeight="bold"
                    minSize={20}
                    maxSize={100}
                  />
                </MiniAccordion>
                
                {/* טיפוגרפיה - תת-כותרת */}
                <MiniAccordion title="תת-כותרת" defaultOpen={false}>
                  <TypographyControl
                    label=""
                    prefix="subtitle"
                    settings={section.settings}
                    onChange={updateSettings}
                    defaultSize={20}
                    defaultSizeMobile={16}
                    defaultColor="#ffffff"
                    defaultWeight="normal"
                    minSize={12}
                    maxSize={40}
                  />
                </MiniAccordion>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB: מתקדם (Advanced) */}
            {/* ========================================== */}
            {activeTab === 'advanced' && (
              <div className="space-y-0">
                <MiniAccordion title="נראות" defaultOpen={true}>
                  <VisibilityControl
                    settings={section.settings}
                    onChange={updateSettings}
                  />
                </MiniAccordion>
                
                <AdvancedControl
                  settings={section.settings}
                  onChange={updateSettings}
                  onChangeMultiple={updateMultipleSettings}
                  defaults={{
                    paddingTop: 0,
                    paddingBottom: 0,
                    paddingRight: 0,
                    paddingLeft: 0,
                    marginTop: 0,
                    marginBottom: 0,
                    marginRight: 0,
                    marginLeft: 0,
                  }}
                />
              </div>
            )}

          </div>
        </div>

        {/* Delete Section Button */}
        {onDelete && (
          <div className="p-4 border-t border-[var(--editor-border-default)] bg-[var(--editor-bg-secondary)]">
            <button
              onClick={onDelete}
              className="w-full py-3 px-4 text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 
                         border border-red-200 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
              </svg>
              מחק סקשן
            </button>
          </div>
        )}
      </div>
    </EditorThemeProvider>
  );
}

