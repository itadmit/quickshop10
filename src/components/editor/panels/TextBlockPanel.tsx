'use client';

/**
 * TextBlockPanel - Modern settings panel for text_block section (Figma-style)
 * פאנל הגדרות מודרני לסקשן בלוק טקסט
 * 
 * מבנה כמו Figma:
 * - 3 לשוניות למעלה: תוכן | עיצוב | מתקדם
 * - כל לשונית מכילה מיני-אקורדיונים
 */

import { useState } from 'react';
import { 
  EditorInput,
  EditorThemeProvider,
  ThemeToggle,
} from '../ui';

import { RichTextEditor } from '@/components/admin/rich-text-editor';

import {
  TypographyControl,
  ButtonControl,
  FullBackgroundControl,
  MinHeightControl,
  SectionWidthControl,
  AlignmentControl,
  VerticalAlignControl,
  AdvancedControl,
  VisibilityControl,
} from '../controls';

// ============================================
// Mini Accordion Component (for inside tabs)
// ============================================
interface MiniAccordionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function MiniAccordion({ title, defaultOpen = true, children }: MiniAccordionProps) {
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

interface TextBlockPanelProps {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
  onClose?: () => void;
  onDelete?: () => void;
}

type TabType = 'content' | 'design' | 'advanced';

// ============================================
// Main Component
// ============================================
export function TextBlockPanel({ section, onUpdate, onClose, onDelete }: TextBlockPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('content');

  // Update settings
  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
  };

  // Update multiple settings
  const updateMultipleSettings = (updates: Record<string, unknown>) => {
    onUpdate({ settings: { ...section.settings, ...updates } });
  };

  // Update content
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
              <h3 className="text-sm font-medium text-[var(--editor-text-primary)]">בלוק טקסט</h3>
            </div>
            <ThemeToggle />
          </div>

          {/* Tabs - Figma style */}
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

                {/* תוכן */}
                <MiniAccordion title="תוכן" defaultOpen={true}>
                  <RichTextEditor
                    value={(section.content.text as string) || ''}
                    onChange={(v) => updateContent('text', v)}
                    placeholder="הזן תוכן עשיר..."
                    minHeight={100}
                    maxHeight={300}
                  />
                </MiniAccordion>

                {/* כפתור */}
                <MiniAccordion title="כפתור" defaultOpen={false}>
                  <div className="space-y-3">
                    <EditorInput
                      label="טקסט כפתור"
                      value={(section.content.buttonText as string) || ''}
                      onChange={(v) => updateContent('buttonText', v)}
                      placeholder="קרא עוד"
                    />
                    
                    <EditorInput
                      label="קישור"
                      value={(section.content.buttonLink as string) || ''}
                      onChange={(v) => updateContent('buttonLink', v)}
                      placeholder="/about"
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
                {/* פריסה - ראשון ופתוח */}
                <MiniAccordion title="פריסה" defaultOpen={true}>
                  <div className="space-y-4">
                    {/* רוחב סקשן - קונטיינר או מלא */}
                    <SectionWidthControl
                      settings={section.settings}
                      onChange={updateSettings}
                    />
                    
                    {/* גובה מינימום */}
                    <MinHeightControl
                      settings={section.settings}
                      onChange={updateSettings}
                    />
                    
                    {/* יישור אנכי - רק כשיש גובה מינימום */}
                    <VerticalAlignControl
                      settings={section.settings}
                      onChange={updateSettings}
                    />
                    
                    <AlignmentControl
                      settings={section.settings}
                      onChange={updateSettings}
                      label="יישור טקסט"
                    />
                  </div>
                </MiniAccordion>

                {/* רקע - צבע/תמונה/וידאו */}
                <MiniAccordion title="רקע" defaultOpen={false}>
                  <FullBackgroundControl
                    settings={section.settings}
                    onChange={updateSettings}
                    defaultColor="#ffffff"
                  />
                </MiniAccordion>

                {/* טיפוגרפיה - כותרת */}
                <MiniAccordion title="כותרת" defaultOpen={false}>
                  <TypographyControl
                    label=""
                    prefix="title"
                    settings={section.settings}
                    onChange={updateSettings}
                    defaultSize={36}
                    defaultSizeMobile={28}
                    defaultColor="#000000"
                    defaultWeight="bold"
                    minSize={14}
                    maxSize={80}
                  />
                </MiniAccordion>
                
                {/* טיפוגרפיה - תת-כותרת */}
                <MiniAccordion title="תת-כותרת" defaultOpen={false}>
                  <TypographyControl
                    label=""
                    prefix="subtitle"
                    settings={section.settings}
                    onChange={updateSettings}
                    defaultSize={18}
                    defaultSizeMobile={16}
                    defaultColor="#6b7280"
                    defaultWeight="normal"
                    minSize={12}
                    maxSize={40}
                  />
                </MiniAccordion>
                
                {/* טיפוגרפיה - תוכן */}
                <MiniAccordion title="תוכן" defaultOpen={false}>
                  <TypographyControl
                    label=""
                    prefix="text"
                    settings={section.settings}
                    onChange={updateSettings}
                    defaultSize={16}
                    defaultSizeMobile={14}
                    defaultColor="#374151"
                    defaultWeight="normal"
                    minSize={12}
                    maxSize={24}
                  />
                </MiniAccordion>
                
                {/* כפתור - עיצוב */}
                <MiniAccordion title="כפתור" defaultOpen={false}>
                  <ButtonControl
                    settings={section.settings}
                    onChange={updateSettings}
                  />
                </MiniAccordion>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB: מתקדם (Advanced) */}
            {/* ========================================== */}
            {activeTab === 'advanced' && (
              <div className="space-y-0">
                {/* נראות */}
                <MiniAccordion title="נראות" defaultOpen={true}>
                  <VisibilityControl
                    settings={section.settings}
                    onChange={updateSettings}
                  />
                </MiniAccordion>
                
                {/* Advanced Control has its own mini accordions */}
                <AdvancedControl
                  settings={section.settings}
                  onChange={updateSettings}
                  onChangeMultiple={updateMultipleSettings}
                  defaults={{
                    paddingTop: 64,
                    paddingBottom: 64,
                    paddingRight: 16,
                    paddingLeft: 16,
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

        {/* Delete Section Button - Always visible at bottom */}
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
