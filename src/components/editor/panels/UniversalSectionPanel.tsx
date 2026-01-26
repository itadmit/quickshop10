'use client';

/**
 * UniversalSectionPanel - פאנל משותף לכל הסקשנים
 * 
 * מבנה אחיד לכל הסקשנים:
 * - לשונית תוכן: משתנה לפי סוג הסקשן (contentConfig)
 * - לשונית עיצוב: משותפת לכולם (פריסה, רקע, טיפוגרפיה, כפתור)
 * - לשונית מתקדם: משותפת לכולם (נראות, ריווחים, CSS)
 */

import { useState, useEffect } from 'react';
import { 
  EditorInput,
  EditorSlider,
  EditorSelect,
  EditorToggle,
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
// Mini Accordion Component
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

type TabType = 'content' | 'design' | 'advanced';

// Section display names
const SECTION_NAMES: Record<string, string> = {
  text_block: 'בלוק טקסט',
  hero: 'באנר ראשי',
  products: 'מוצרים נבחרים',
  categories: 'קטגוריות',
  reviews: 'ביקורות',
  features: 'חוזקות',
  faq: 'שאלות נפוצות',
  newsletter: 'ניוזלטר',
  contact: 'יצירת קשר',
  logos: 'לוגואים',
  gallery: 'גלריה',
  image_text: 'תמונה וטקסט',
  banner_small: 'באנר קטן',
  video_banner: 'באנר וידאו',
  split_banner: 'באנר מפוצל',
  featured_items: 'פריטים מובחרים',
  series_grid: 'סדרות',
};

// Design config per section type
interface DesignConfig {
  showButton?: boolean;
  showGrid?: boolean;
  showCards?: boolean;
  titleDefaults?: { size: number; sizeMobile: number; weight: string; color: string };
  subtitleDefaults?: { size: number; sizeMobile: number; weight: string; color: string };
  textDefaults?: { size: number; sizeMobile: number; color: string };
  paddingDefaults?: { top: number; bottom: number; left: number; right: number };
}

const DESIGN_CONFIG: Record<string, DesignConfig> = {
  text_block: {
    showButton: true,
    titleDefaults: { size: 36, sizeMobile: 28, weight: 'bold', color: '#000000' },
    subtitleDefaults: { size: 18, sizeMobile: 16, weight: 'normal', color: '#6b7280' },
    textDefaults: { size: 16, sizeMobile: 14, color: '#374151' },
    paddingDefaults: { top: 64, bottom: 64, left: 16, right: 16 },
  },
  hero: {
    showButton: true,
    titleDefaults: { size: 48, sizeMobile: 32, weight: 'bold', color: '#ffffff' },
    subtitleDefaults: { size: 18, sizeMobile: 16, weight: 'normal', color: '#ffffff' },
    paddingDefaults: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  products: {
    showGrid: true,
    showCards: true,
    titleDefaults: { size: 28, sizeMobile: 22, weight: 'light', color: '#000000' },
    subtitleDefaults: { size: 12, sizeMobile: 10, weight: 'normal', color: '#9ca3af' },
    paddingDefaults: { top: 80, bottom: 80, left: 24, right: 24 },
  },
  reviews: {
    showGrid: true,
    showCards: true,
    titleDefaults: { size: 28, sizeMobile: 22, weight: 'bold', color: '#000000' },
    subtitleDefaults: { size: 16, sizeMobile: 14, weight: 'normal', color: '#6b7280' },
    paddingDefaults: { top: 64, bottom: 64, left: 16, right: 16 },
  },
  features: {
    showGrid: true,
    titleDefaults: { size: 28, sizeMobile: 22, weight: 'bold', color: '#000000' },
    subtitleDefaults: { size: 16, sizeMobile: 14, weight: 'normal', color: '#6b7280' },
    paddingDefaults: { top: 64, bottom: 64, left: 16, right: 16 },
  },
  faq: {
    titleDefaults: { size: 28, sizeMobile: 22, weight: 'bold', color: '#000000' },
    subtitleDefaults: { size: 16, sizeMobile: 14, weight: 'normal', color: '#6b7280' },
    paddingDefaults: { top: 64, bottom: 64, left: 16, right: 16 },
  },
  newsletter: {
    showButton: true,
    titleDefaults: { size: 28, sizeMobile: 22, weight: 'bold', color: '#000000' },
    subtitleDefaults: { size: 16, sizeMobile: 14, weight: 'normal', color: '#6b7280' },
    paddingDefaults: { top: 64, bottom: 64, left: 16, right: 16 },
  },
  contact: {
    showButton: true,
    titleDefaults: { size: 28, sizeMobile: 22, weight: 'bold', color: '#000000' },
    subtitleDefaults: { size: 16, sizeMobile: 14, weight: 'normal', color: '#6b7280' },
    paddingDefaults: { top: 64, bottom: 64, left: 16, right: 16 },
  },
  logos: {
    showGrid: true,
    titleDefaults: { size: 24, sizeMobile: 20, weight: 'bold', color: '#000000' },
    subtitleDefaults: { size: 14, sizeMobile: 12, weight: 'normal', color: '#6b7280' },
    paddingDefaults: { top: 48, bottom: 48, left: 16, right: 16 },
  },
  gallery: {
    showGrid: true,
    titleDefaults: { size: 28, sizeMobile: 22, weight: 'bold', color: '#000000' },
    subtitleDefaults: { size: 16, sizeMobile: 14, weight: 'normal', color: '#6b7280' },
    paddingDefaults: { top: 64, bottom: 64, left: 16, right: 16 },
  },
  image_text: {
    showButton: true,
    titleDefaults: { size: 32, sizeMobile: 24, weight: 'bold', color: '#000000' },
    subtitleDefaults: { size: 16, sizeMobile: 14, weight: 'normal', color: '#6b7280' },
    textDefaults: { size: 16, sizeMobile: 14, color: '#374151' },
    paddingDefaults: { top: 64, bottom: 64, left: 16, right: 16 },
  },
  banner_small: {
    showButton: true,
    titleDefaults: { size: 24, sizeMobile: 20, weight: 'bold', color: '#ffffff' },
    subtitleDefaults: { size: 14, sizeMobile: 12, weight: 'normal', color: '#ffffff' },
    paddingDefaults: { top: 48, bottom: 48, left: 24, right: 24 },
  },
  video_banner: {
    showButton: true,
    titleDefaults: { size: 48, sizeMobile: 32, weight: 'bold', color: '#ffffff' },
    subtitleDefaults: { size: 18, sizeMobile: 16, weight: 'normal', color: '#ffffff' },
    paddingDefaults: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  split_banner: {
    showButton: true,
    titleDefaults: { size: 32, sizeMobile: 24, weight: 'bold', color: '#000000' },
    subtitleDefaults: { size: 16, sizeMobile: 14, weight: 'normal', color: '#6b7280' },
    textDefaults: { size: 16, sizeMobile: 14, color: '#374151' },
    paddingDefaults: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  categories: {
    showGrid: true,
    titleDefaults: { size: 28, sizeMobile: 22, weight: 'bold', color: '#000000' },
    subtitleDefaults: { size: 14, sizeMobile: 12, weight: 'normal', color: '#6b7280' },
    paddingDefaults: { top: 64, bottom: 64, left: 16, right: 16 },
  },
  featured_items: {
    showGrid: true,
    showCards: true,
    titleDefaults: { size: 28, sizeMobile: 22, weight: 'light', color: '#000000' },
    subtitleDefaults: { size: 12, sizeMobile: 10, weight: 'normal', color: '#9ca3af' },
    paddingDefaults: { top: 80, bottom: 80, left: 24, right: 24 },
  },
  series_grid: {
    showGrid: true,
    titleDefaults: { size: 28, sizeMobile: 22, weight: 'bold', color: '#000000' },
    subtitleDefaults: { size: 14, sizeMobile: 12, weight: 'normal', color: '#6b7280' },
    paddingDefaults: { top: 64, bottom: 64, left: 16, right: 16 },
  },
};

// ============================================
// Props
// ============================================
interface UniversalSectionPanelProps {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
  onClose?: () => void;
  onDelete?: () => void;
  storeSlug?: string;
  categories?: Array<{ id: string; name: string }>;
}

// ============================================
// Main Component
// ============================================
export function UniversalSectionPanel({ 
  section, 
  onUpdate, 
  onClose, 
  onDelete,
  storeSlug,
  categories = [],
}: UniversalSectionPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('content');

  const sectionType = section.type;
  const sectionName = SECTION_NAMES[sectionType] || sectionType;
  const designConfig = DESIGN_CONFIG[sectionType] || {};

  // Update functions
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

  const settings = section.settings || {};
  const content = section.content || {};

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
              <h3 className="text-sm font-medium text-[var(--editor-text-primary)]">{sectionName}</h3>
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
            {/* TAB: תוכן - משתנה לפי סוג הסקשן */}
            {/* ========================================== */}
            {activeTab === 'content' && (
              <div className="space-y-0">
                {/* כותרות - משותף לכולם */}
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

                {/* תוכן ספציפי לפי סוג הסקשן */}
                <SectionContentEditor 
                  sectionType={sectionType}
                  content={content}
                  settings={settings}
                  updateContent={updateContent}
                  updateSettings={updateSettings}
                  categories={categories}
                  storeSlug={storeSlug}
                />
              </div>
            )}

            {/* ========================================== */}
            {/* TAB: עיצוב - משותף לכולם */}
            {/* ========================================== */}
            {activeTab === 'design' && (
              <div className="space-y-0">
                {/* פריסה */}
                <MiniAccordion title="פריסה" defaultOpen={true}>
                  <div className="space-y-4">
                    <SectionWidthControl
                      settings={section.settings}
                      onChange={updateSettings}
                    />
                    
                    <MinHeightControl
                      settings={section.settings}
                      onChange={updateSettings}
                    />
                    
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

                {/* גריד - רק לסקשנים עם גריד */}
                {designConfig.showGrid && (
                  <MiniAccordion title="גריד" defaultOpen={true}>
                    <div className="space-y-3">
                      <EditorSelect
                        label="פריסה"
                        value={(settings.layout as string) || 'grid'}
                        options={[
                          { value: 'grid', label: 'גריד' },
                          { value: 'slider', label: 'סליידר' },
                        ]}
                        onChange={(v) => updateSettings('layout', v)}
                      />
                      
                      <EditorSlider
                        label="עמודות (מחשב)"
                        value={(settings.columns as number) || 4}
                        onChange={(v) => updateSettings('columns', v)}
                        min={2}
                        max={6}
                      />
                      
                      <EditorSlider
                        label="עמודות (מובייל)"
                        value={(settings.mobileColumns as number) || 2}
                        onChange={(v) => updateSettings('mobileColumns', v)}
                        min={1}
                        max={3}
                      />
                      
                      <EditorSlider
                        label="ריווח"
                        value={(settings.gap as number) || 24}
                        onChange={(v) => updateSettings('gap', v)}
                        min={8}
                        max={64}
                        suffix="px"
                      />
                    </div>
                  </MiniAccordion>
                )}

                {/* רקע */}
                <MiniAccordion title="רקע" defaultOpen={false}>
                  <FullBackgroundControl
                    settings={section.settings}
                    onChange={updateSettings}
                    defaultColor="#ffffff"
                  />
                </MiniAccordion>

                {/* כותרת */}
                <MiniAccordion title="כותרת" defaultOpen={false}>
                  <TypographyControl
                    label=""
                    prefix="title"
                    settings={section.settings}
                    onChange={updateSettings}
                    defaultSize={designConfig.titleDefaults?.size || 28}
                    defaultSizeMobile={designConfig.titleDefaults?.sizeMobile || 22}
                    defaultColor={designConfig.titleDefaults?.color || '#000000'}
                    defaultWeight={designConfig.titleDefaults?.weight || 'bold'}
                    minSize={14}
                    maxSize={80}
                  />
                </MiniAccordion>
                
                {/* תת-כותרת */}
                <MiniAccordion title="תת-כותרת" defaultOpen={false}>
                  <TypographyControl
                    label=""
                    prefix="subtitle"
                    settings={section.settings}
                    onChange={updateSettings}
                    defaultSize={designConfig.subtitleDefaults?.size || 16}
                    defaultSizeMobile={designConfig.subtitleDefaults?.sizeMobile || 14}
                    defaultColor={designConfig.subtitleDefaults?.color || '#6b7280'}
                    defaultWeight={designConfig.subtitleDefaults?.weight || 'normal'}
                    minSize={10}
                    maxSize={40}
                  />
                </MiniAccordion>
                
                {/* תוכן - רק לסקשנים עם תוכן */}
                {designConfig.textDefaults && (
                  <MiniAccordion title="תוכן" defaultOpen={false}>
                    <TypographyControl
                      label=""
                      prefix="text"
                      settings={section.settings}
                      onChange={updateSettings}
                      defaultSize={designConfig.textDefaults.size}
                      defaultSizeMobile={designConfig.textDefaults.sizeMobile}
                      defaultColor={designConfig.textDefaults.color}
                      defaultWeight="normal"
                      minSize={12}
                      maxSize={24}
                    />
                  </MiniAccordion>
                )}
                
                {/* כפתור - רק לסקשנים עם כפתור */}
                {designConfig.showButton && (
                  <MiniAccordion title="כפתור" defaultOpen={false}>
                    <ButtonControl
                      settings={section.settings}
                      onChange={updateSettings}
                      onMultipleChange={updateMultipleSettings}
                    />
                  </MiniAccordion>
                )}

                {/* כרטיסים - רק לסקשנים עם כרטיסים */}
                {designConfig.showCards && (
                  <MiniAccordion title="כרטיסים" defaultOpen={false}>
                    <div className="space-y-3">
                      <EditorSelect
                        label="סגנון כרטיס"
                        value={(settings.cardStyle as string) || 'standard'}
                        options={[
                          { value: 'standard', label: 'סטנדרטי' },
                          { value: 'minimal', label: 'מינימלי' },
                          { value: 'overlay', label: 'עם שכבה' },
                        ]}
                        onChange={(v) => updateSettings('cardStyle', v)}
                      />
                      
                      <EditorSelect
                        label="אפקט ריחוף"
                        value={(settings.hoverEffect as string) || 'scale'}
                        options={[
                          { value: 'none', label: 'ללא' },
                          { value: 'scale', label: 'הגדלה' },
                          { value: 'zoom', label: 'זום' },
                        ]}
                        onChange={(v) => updateSettings('hoverEffect', v)}
                      />
                    </div>
                  </MiniAccordion>
                )}
              </div>
            )}

            {/* ========================================== */}
            {/* TAB: מתקדם - משותף לכולם */}
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
                    paddingTop: designConfig.paddingDefaults?.top || 64,
                    paddingBottom: designConfig.paddingDefaults?.bottom || 64,
                    paddingRight: designConfig.paddingDefaults?.right || 16,
                    paddingLeft: designConfig.paddingDefaults?.left || 16,
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

        {/* Delete Button */}
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

// ============================================
// Section Content Editor - הגדרות תוכן ספציפיות לכל סקשן
// ============================================
interface SectionContentEditorProps {
  sectionType: string;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  updateContent: (key: string, value: unknown) => void;
  updateSettings: (key: string, value: unknown) => void;
  categories?: Array<{ id: string; name: string }>;
  storeSlug?: string;
}

function SectionContentEditor({
  sectionType,
  content,
  settings,
  updateContent,
  updateSettings,
  categories = [],
  storeSlug,
}: SectionContentEditorProps) {
  
  switch (sectionType) {
    // ==========================================
    // בלוק טקסט
    // ==========================================
    case 'text_block':
      return (
        <>
          <MiniAccordion title="תוכן" defaultOpen={true}>
            <RichTextEditor
              value={(content.text as string) || ''}
              onChange={(v) => updateContent('text', v)}
              placeholder="הזן תוכן עשיר..."
              minHeight={100}
              maxHeight={300}
            />
          </MiniAccordion>

          <MiniAccordion title="כפתור" defaultOpen={false}>
            <div className="space-y-3">
              <EditorInput
                label="טקסט כפתור"
                value={(content.buttonText as string) || ''}
                onChange={(v) => updateContent('buttonText', v)}
                placeholder="קרא עוד"
              />
              
              <EditorInput
                label="קישור"
                value={(content.buttonLink as string) || ''}
                onChange={(v) => updateContent('buttonLink', v)}
                placeholder="/about"
              />
            </div>
          </MiniAccordion>
        </>
      );

    // ==========================================
    // מוצרים נבחרים
    // ==========================================
    case 'products':
      return (
        <MiniAccordion title="מוצרים" defaultOpen={true}>
          <div className="space-y-3">
            <EditorSelect
              label="הצג מוצרים"
              value={(content.displayBy as string) || 'category'}
              options={[
                { value: 'category', label: 'לפי קטגוריה' },
                { value: 'featured', label: 'מוצרים מומלצים' },
                { value: 'all', label: 'כל המוצרים' },
              ]}
              onChange={(v) => updateContent('displayBy', v)}
            />

            {(content.displayBy as string) === 'category' && (
              <EditorSelect
                label="בחר קטגוריה"
                value={(content.categoryId as string) || ''}
                options={[
                  { value: '', label: 'בחר קטגוריה' },
                  ...categories.map(cat => ({ value: cat.id, label: cat.name })),
                ]}
                onChange={(v) => updateContent('categoryId', v)}
              />
            )}

            <EditorSlider
              label="כמות להצגה"
              value={(content.displayLimit as number) || 4}
              onChange={(v) => updateContent('displayLimit', v)}
              min={1}
              max={12}
            />

            <EditorToggle
              label="הצג כפתור הוספה לסל"
              value={(settings.showAddToCart as boolean) || false}
              onChange={(v) => updateSettings('showAddToCart', v)}
            />
          </div>
        </MiniAccordion>
      );

    // ==========================================
    // באנר ראשי
    // ==========================================
    case 'hero':
      return (
        <>
          <MiniAccordion title="תמונה" defaultOpen={true}>
            <div className="space-y-3">
              <EditorInput
                label="תמונת רקע"
                value={(content.imageUrl as string) || ''}
                onChange={(v) => updateContent('imageUrl', v)}
                placeholder="URL תמונה"
              />
              
              <EditorInput
                label="תמונה למובייל"
                value={(content.mobileImageUrl as string) || ''}
                onChange={(v) => updateContent('mobileImageUrl', v)}
                placeholder="URL תמונה למובייל"
              />

              <EditorSlider
                label="שכבה כהה"
                value={((settings.overlay as number) || 0) * 100}
                onChange={(v) => updateSettings('overlay', v / 100)}
                min={0}
                max={100}
                suffix="%"
              />
            </div>
          </MiniAccordion>

          <MiniAccordion title="כפתור" defaultOpen={false}>
            <div className="space-y-3">
              <EditorInput
                label="טקסט כפתור"
                value={(content.buttonText as string) || ''}
                onChange={(v) => updateContent('buttonText', v)}
                placeholder="לצפייה"
              />
              
              <EditorInput
                label="קישור"
                value={(content.buttonLink as string) || ''}
                onChange={(v) => updateContent('buttonLink', v)}
                placeholder="/products"
              />
            </div>
          </MiniAccordion>

          <MiniAccordion title="אפשרויות" defaultOpen={false}>
            <EditorToggle
              label="הצג חץ גלילה"
              value={(settings.showScrollArrow as boolean) !== false}
              onChange={(v) => updateSettings('showScrollArrow', v)}
            />
          </MiniAccordion>
        </>
      );

    // ==========================================
    // ביקורות
    // ==========================================
    case 'reviews':
      return (
        <MiniAccordion title="ביקורות" defaultOpen={true}>
          <div className="space-y-3">
            <p className="text-xs text-[var(--editor-text-muted)]">
              הביקורות נטענות אוטומטית מהמערכת
            </p>
            
            <EditorToggle
              label="הצג כוכבים"
              value={(settings.showStars as boolean) !== false}
              onChange={(v) => updateSettings('showStars', v)}
            />
            
            <EditorToggle
              label="הצג תאריך"
              value={(settings.showDate as boolean) !== false}
              onChange={(v) => updateSettings('showDate', v)}
            />
          </div>
        </MiniAccordion>
      );

    // ==========================================
    // חוזקות / פיצ'רים
    // ==========================================
    case 'features':
      return (
        <MiniAccordion title="פיצ'רים" defaultOpen={true}>
          <p className="text-xs text-[var(--editor-text-muted)]">
            ערוך את הפיצ'רים ישירות על האלמנט באייפריים
          </p>
        </MiniAccordion>
      );

    // ==========================================
    // שאלות נפוצות
    // ==========================================
    case 'faq':
      return (
        <MiniAccordion title="שאלות" defaultOpen={true}>
          <p className="text-xs text-[var(--editor-text-muted)]">
            ערוך את השאלות ישירות על האלמנט באייפריים
          </p>
        </MiniAccordion>
      );

    // ==========================================
    // ניוזלטר
    // ==========================================
    case 'newsletter':
      return (
        <>
          <MiniAccordion title="טופס" defaultOpen={true}>
            <div className="space-y-3">
              <EditorInput
                label="טקסט כפתור"
                value={(content.buttonText as string) || 'הרשמה'}
                onChange={(v) => updateContent('buttonText', v)}
                placeholder="הרשמה"
              />
              
              <EditorInput
                label="placeholder"
                value={(content.placeholder as string) || 'כתובת אימייל'}
                onChange={(v) => updateContent('placeholder', v)}
                placeholder="כתובת אימייל"
              />
            </div>
          </MiniAccordion>

          <MiniAccordion title="הודעה" defaultOpen={false}>
            <EditorInput
              label="הודעת הצלחה"
              value={(content.successMessage as string) || 'תודה על ההרשמה!'}
              onChange={(v) => updateContent('successMessage', v)}
              placeholder="תודה על ההרשמה!"
            />
          </MiniAccordion>
        </>
      );

    // ==========================================
    // יצירת קשר
    // ==========================================
    case 'contact':
      return (
        <>
          <MiniAccordion title="פרטי קשר" defaultOpen={true}>
            <div className="space-y-3">
              <EditorInput
                label="אימייל"
                value={(content.email as string) || ''}
                onChange={(v) => updateContent('email', v)}
                placeholder="info@example.com"
              />
              
              <EditorInput
                label="טלפון"
                value={(content.phone as string) || ''}
                onChange={(v) => updateContent('phone', v)}
                placeholder="03-1234567"
              />
              
              <EditorInput
                label="כתובת"
                value={(content.address as string) || ''}
                onChange={(v) => updateContent('address', v)}
                placeholder="רחוב הדוגמה 1, תל אביב"
              />
              
              <EditorInput
                label="שעות פעילות"
                value={(content.hours as string) || ''}
                onChange={(v) => updateContent('hours', v)}
                placeholder="א'-ה' 9:00-18:00"
              />
            </div>
          </MiniAccordion>

          <MiniAccordion title="טופס" defaultOpen={false}>
            <div className="space-y-3">
              <EditorToggle
                label="הצג טופס"
                value={(content.showForm as boolean) !== false}
                onChange={(v) => updateContent('showForm', v)}
              />
              
              <EditorInput
                label="טקסט כפתור"
                value={(content.submitButtonText as string) || 'שליחה'}
                onChange={(v) => updateContent('submitButtonText', v)}
                placeholder="שליחה"
              />

              <EditorInput
                label="תגית טופס"
                value={(content.formTag as string) || ''}
                onChange={(v) => updateContent('formTag', v)}
                placeholder="יצירת קשר"
              />
            </div>
          </MiniAccordion>
        </>
      );

    // ==========================================
    // לוגואים
    // ==========================================
    case 'logos':
      return (
        <MiniAccordion title="לוגואים" defaultOpen={true}>
          <p className="text-xs text-[var(--editor-text-muted)]">
            ערוך את הלוגואים ישירות על האלמנט באייפריים
          </p>
        </MiniAccordion>
      );

    // ==========================================
    // גלריה
    // ==========================================
    case 'gallery':
      return (
        <MiniAccordion title="גלריה" defaultOpen={true}>
          <p className="text-xs text-[var(--editor-text-muted)]">
            ערוך את התמונות ישירות על האלמנט באייפריים
          </p>
        </MiniAccordion>
      );

    // ==========================================
    // תמונה וטקסט
    // ==========================================
    case 'image_text':
      return (
        <>
          <MiniAccordion title="תמונה" defaultOpen={true}>
            <EditorInput
              label="URL תמונה"
              value={(content.imageUrl as string) || ''}
              onChange={(v) => updateContent('imageUrl', v)}
              placeholder="https://..."
            />
          </MiniAccordion>

          <MiniAccordion title="תוכן" defaultOpen={true}>
            <RichTextEditor
              value={(content.text as string) || ''}
              onChange={(v) => updateContent('text', v)}
              placeholder="הזן תוכן..."
              minHeight={100}
              maxHeight={200}
            />
          </MiniAccordion>

          <MiniAccordion title="כפתור" defaultOpen={false}>
            <div className="space-y-3">
              <EditorInput
                label="טקסט כפתור"
                value={(content.buttonText as string) || ''}
                onChange={(v) => updateContent('buttonText', v)}
                placeholder="קרא עוד"
              />
              
              <EditorInput
                label="קישור"
                value={(content.buttonLink as string) || ''}
                onChange={(v) => updateContent('buttonLink', v)}
                placeholder="/about"
              />
            </div>
          </MiniAccordion>

          <MiniAccordion title="פריסה" defaultOpen={false}>
            <EditorSelect
              label="מיקום תמונה"
              value={(settings.imagePosition as string) || 'right'}
              options={[
                { value: 'right', label: 'ימין' },
                { value: 'left', label: 'שמאל' },
              ]}
              onChange={(v) => updateSettings('imagePosition', v)}
            />
          </MiniAccordion>
        </>
      );

    // ==========================================
    // באנר קטן
    // ==========================================
    case 'banner_small':
      return (
        <>
          <MiniAccordion title="רקע" defaultOpen={true}>
            <EditorInput
              label="תמונת רקע"
              value={(content.imageUrl as string) || ''}
              onChange={(v) => updateContent('imageUrl', v)}
              placeholder="URL תמונה"
            />
          </MiniAccordion>

          <MiniAccordion title="כפתור" defaultOpen={false}>
            <div className="space-y-3">
              <EditorInput
                label="טקסט כפתור"
                value={(content.buttonText as string) || ''}
                onChange={(v) => updateContent('buttonText', v)}
                placeholder="לצפייה"
              />
              
              <EditorInput
                label="קישור"
                value={(content.buttonLink as string) || ''}
                onChange={(v) => updateContent('buttonLink', v)}
                placeholder="/products"
              />
            </div>
          </MiniAccordion>
        </>
      );

    // ==========================================
    // באנר וידאו
    // ==========================================
    case 'video_banner':
      return (
        <>
          <MiniAccordion title="וידאו" defaultOpen={true}>
            <div className="space-y-3">
              <EditorInput
                label="URL וידאו"
                value={(content.videoUrl as string) || ''}
                onChange={(v) => updateContent('videoUrl', v)}
                placeholder="https://..."
              />
              
              <EditorInput
                label="תמונת פולבק"
                value={(content.posterUrl as string) || ''}
                onChange={(v) => updateContent('posterUrl', v)}
                placeholder="URL תמונה"
              />
            </div>
          </MiniAccordion>

          <MiniAccordion title="כפתור" defaultOpen={false}>
            <div className="space-y-3">
              <EditorInput
                label="טקסט כפתור"
                value={(content.buttonText as string) || ''}
                onChange={(v) => updateContent('buttonText', v)}
                placeholder="לצפייה"
              />
              
              <EditorInput
                label="קישור"
                value={(content.buttonLink as string) || ''}
                onChange={(v) => updateContent('buttonLink', v)}
                placeholder="/products"
              />
            </div>
          </MiniAccordion>
        </>
      );

    // ==========================================
    // באנר מפוצל
    // ==========================================
    case 'split_banner':
      return (
        <>
          <MiniAccordion title="תמונה" defaultOpen={true}>
            <EditorInput
              label="URL תמונה"
              value={(content.imageUrl as string) || ''}
              onChange={(v) => updateContent('imageUrl', v)}
              placeholder="https://..."
            />
          </MiniAccordion>

          <MiniAccordion title="תוכן" defaultOpen={true}>
            <RichTextEditor
              value={(content.text as string) || ''}
              onChange={(v) => updateContent('text', v)}
              placeholder="הזן תוכן..."
              minHeight={100}
              maxHeight={200}
            />
          </MiniAccordion>

          <MiniAccordion title="כפתור" defaultOpen={false}>
            <div className="space-y-3">
              <EditorInput
                label="טקסט כפתור"
                value={(content.buttonText as string) || ''}
                onChange={(v) => updateContent('buttonText', v)}
                placeholder="לצפייה"
              />
              
              <EditorInput
                label="קישור"
                value={(content.buttonLink as string) || ''}
                onChange={(v) => updateContent('buttonLink', v)}
                placeholder="/products"
              />
            </div>
          </MiniAccordion>

          <MiniAccordion title="פריסה" defaultOpen={false}>
            <EditorSelect
              label="מיקום תמונה"
              value={(settings.imagePosition as string) || 'right'}
              options={[
                { value: 'right', label: 'ימין' },
                { value: 'left', label: 'שמאל' },
              ]}
              onChange={(v) => updateSettings('imagePosition', v)}
            />
          </MiniAccordion>
        </>
      );

    // ==========================================
    // קטגוריות
    // ==========================================
    case 'categories':
      return (
        <MiniAccordion title="קטגוריות" defaultOpen={true}>
          <div className="space-y-3">
            <EditorSlider
              label="כמות להצגה"
              value={(content.displayLimit as number) || 6}
              onChange={(v) => updateContent('displayLimit', v)}
              min={1}
              max={12}
            />
            
            <EditorToggle
              label="הצג תמונות"
              value={(settings.showImages as boolean) !== false}
              onChange={(v) => updateSettings('showImages', v)}
            />
            
            <EditorToggle
              label="הצג כמות מוצרים"
              value={(settings.showCount as boolean) || false}
              onChange={(v) => updateSettings('showCount', v)}
            />
          </div>
        </MiniAccordion>
      );

    // ==========================================
    // פריטים מובחרים
    // ==========================================
    case 'featured_items':
      return (
        <MiniAccordion title="פריטים" defaultOpen={true}>
          <div className="space-y-3">
            <EditorSlider
              label="כמות להצגה"
              value={(content.displayLimit as number) || 4}
              onChange={(v) => updateContent('displayLimit', v)}
              min={1}
              max={12}
            />
            
            <EditorToggle
              label="הצג כפתור הוספה לסל"
              value={(settings.showAddToCart as boolean) || false}
              onChange={(v) => updateSettings('showAddToCart', v)}
            />
          </div>
        </MiniAccordion>
      );

    // ==========================================
    // סדרות
    // ==========================================
    case 'series_grid':
      return (
        <MiniAccordion title="סדרות" defaultOpen={true}>
          <div className="space-y-3">
            <EditorSlider
              label="כמות להצגה"
              value={(content.displayLimit as number) || 4}
              onChange={(v) => updateContent('displayLimit', v)}
              min={1}
              max={12}
            />
          </div>
        </MiniAccordion>
      );

    // ==========================================
    // ברירת מחדל
    // ==========================================
    default:
      return (
        <MiniAccordion title="תוכן" defaultOpen={true}>
          <p className="text-xs text-[var(--editor-text-muted)]">
            אין הגדרות נוספות לסקשן זה
          </p>
        </MiniAccordion>
      );
  }
}

