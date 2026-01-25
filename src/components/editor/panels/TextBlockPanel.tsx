'use client';

/**
 * TextBlockPanel - Modern settings panel for text_block section
 * פאנל הגדרות מודרני לסקשן בלוק טקסט
 * 
 * מבנה כמו Shopify:
 * - אקורדיון "תוכן" = כותרת + תת-כותרת + תוכן + כפתור
 * - אקורדיון "עיצוב" = טיפוגרפיה + רקע + יישור
 * - אקורדיון "ריווחים" = spacing
 * 
 * כל הגדרה חייבת לעדכן את האייפריים בזמן אמת!
 */

import { 
  EditorSection, 
  EditorInput,
  EditorThemeProvider,
  ThemeToggle,
} from '../ui';

import { RichTextEditor } from '@/components/admin/rich-text-editor';

import {
  TypographyControl,
  ButtonControl,
  BackgroundColorControl,
  MaxWidthControl,
  AlignmentControl,
  AdvancedControl,
} from '../controls';

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
}

export function TextBlockPanel({ section, onUpdate, onClose }: TextBlockPanelProps) {
  // Update settings - triggers postMessage for real-time update
  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
  };

  // Update content
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  // Check visibility
  const isVisible = section.settings.isVisible !== false;

  return (
    <EditorThemeProvider defaultMode="light">
      <div className="flex flex-col h-full bg-[var(--editor-bg-primary)]" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--editor-border-default)] bg-[var(--editor-bg-secondary)]">
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
          
          <div className="flex items-center gap-1">
            {/* Theme toggle - in header */}
            <ThemeToggle />
            
            {/* Visibility toggle */}
            <button
              onClick={() => updateSettings('isVisible', !isVisible)}
              className={`p-1.5 rounded transition-colors
                         ${isVisible 
                           ? 'hover:bg-[var(--editor-bg-hover)]' 
                           : 'bg-[var(--editor-bg-hover)]'}`}
              title={isVisible ? 'הסתר' : 'הצג'}
            >
              {isVisible ? (
                <svg className="w-4 h-4 text-[var(--editor-text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-[var(--editor-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-0">
            
            {/* ===== תוכן - כמו Shopify, הכל ביחד ===== */}
            <EditorSection title="תוכן" defaultOpen={true}>
              {/* כותרת */}
              <EditorInput
                label="כותרת"
                value={(section.title as string) || ''}
                onChange={(v) => onUpdate({ title: v })}
                placeholder="הזן כותרת"
              />
              
              {/* תת-כותרת */}
              <EditorInput
                label="תת-כותרת"
                value={(section.subtitle as string) || ''}
                onChange={(v) => onUpdate({ subtitle: v })}
                placeholder="הזן תת-כותרת"
              />
              
              {/* תוכן עשיר */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-[var(--editor-text-secondary)] mb-2">
                  תוכן
                </label>
                <RichTextEditor
                  value={(section.content.text as string) || ''}
                  onChange={(v) => updateContent('text', v)}
                  placeholder="הזן תוכן עשיר..."
                  minHeight={100}
                  maxHeight={300}
                />
              </div>
              
              {/* כפתור */}
              <div className="pt-3 mt-3 border-t border-[var(--editor-border-default)]">
                <p className="text-xs font-medium text-[var(--editor-text-secondary)] mb-3">כפתור</p>
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
              </div>
            </EditorSection>

            {/* ===== עיצוב - כל הטיפוגרפיה והצבעים ===== */}
            <EditorSection title="עיצוב" defaultOpen={false}>
              {/* טיפוגרפיה - כותרת */}
              <TypographyControl
                label="כותרת"
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
              
              {/* טיפוגרפיה - תת-כותרת */}
              <TypographyControl
                label="תת-כותרת"
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
              
              {/* טיפוגרפיה - תוכן */}
              <TypographyControl
                label="תוכן"
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
              
              {/* הפרדה */}
              <div className="py-3 my-2">
                <div className="h-px bg-[var(--editor-border-default)]" />
              </div>
              
              {/* כפתור - עיצוב */}
              <ButtonControl
                settings={section.settings}
                onChange={updateSettings}
              />
              
              {/* הפרדה */}
              <div className="py-3 my-2">
                <div className="h-px bg-[var(--editor-border-default)]" />
              </div>
              
              {/* יישור */}
              <AlignmentControl
                settings={section.settings}
                onChange={updateSettings}
                label="יישור טקסט"
              />
              
              {/* רוחב מקסימלי */}
              <MaxWidthControl
                settings={section.settings}
                onChange={updateSettings}
              />
              
              {/* רקע */}
              <BackgroundColorControl
                settings={section.settings}
                onChange={updateSettings}
                defaultColor="#ffffff"
              />
            </EditorSection>

            {/* ===== מתקדם ===== */}
            <EditorSection title="מתקדם" defaultOpen={false}>
              <AdvancedControl
                settings={section.settings}
                onChange={updateSettings}
              />
            </EditorSection>

          </div>
        </div>
      </div>
    </EditorThemeProvider>
  );
}
