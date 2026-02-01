'use client';

/**
 * ProductsPanel - Modern settings panel for products section (Figma-style)
 * פאנל הגדרות מודרני לסקשן מוצרים נבחרים
 * 
 * מבנה כמו Figma:
 * - 3 לשוניות למעלה: תוכן | עיצוב | מתקדם
 * - כל לשונית מכילה מיני-אקורדיונים
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

import {
  TypographyControl,
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

interface Category {
  id: string;
  name: string;
}

interface ProductsPanelProps {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
  onClose?: () => void;
  onDelete?: () => void;
  storeSlug?: string;
}

type TabType = 'content' | 'design' | 'advanced';

// ============================================
// Main Component
// ============================================
export function ProductsPanel({ section, onUpdate, onClose, onDelete, storeSlug }: ProductsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories for the dropdown
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`/api/shops/${storeSlug}/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    }
    
    if (storeSlug) {
      fetchCategories();
    }
  }, [storeSlug]);

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
              <h3 className="text-sm font-medium text-[var(--editor-text-primary)]">מוצרים נבחרים</h3>
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
                      placeholder="פריטים נבחרים"
                    />
                    
                    <EditorInput
                      label="תת-כותרת"
                      value={(section.subtitle as string) || ''}
                      onChange={(v) => onUpdate({ subtitle: v })}
                      placeholder="הזן תת-כותרת"
                    />
                  </div>
                </MiniAccordion>

                {/* מוצרים */}
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
                          { value: '', label: loadingCategories ? 'טוען...' : 'בחר קטגוריה' },
                          ...categories.map(cat => ({ value: cat.id, label: cat.name })),
                        ]}
                        onChange={(v) => updateContent('categoryId', v)}
                      />
                    )}

                    <EditorSlider
                      label="כמות להצגה"
                      value={(content.limit as number) || (content.displayLimit as number) || 8}
                      onChange={(v) => {
                        // שומר לשני השדות לתאימות מלאה
                        onUpdate({ 
                          content: { 
                            ...section.content, 
                            limit: v,
                            displayLimit: v 
                          } 
                        });
                      }}
                      min={1}
                      max={12}
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
                    
                    {/* יישור אנכי */}
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

                {/* גריד */}
                <MiniAccordion title="גריד" defaultOpen={true}>
                  <div className="space-y-3">
                    <EditorSelect
                      label="פריסת מוצרים"
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
                      label="ריווח בין כרטיסים"
                      value={(settings.gap as number) || 32}
                      onChange={(v) => updateSettings('gap', v)}
                      min={8}
                      max={64}
                      suffix="px"
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
                    defaultSize={28}
                    defaultSizeMobile={22}
                    defaultColor="#000000"
                    defaultWeight="light"
                    minSize={14}
                    maxSize={60}
                  />
                </MiniAccordion>
                
                {/* טיפוגרפיה - תת-כותרת */}
                <MiniAccordion title="תת-כותרת" defaultOpen={false}>
                  <TypographyControl
                    label=""
                    prefix="subtitle"
                    settings={section.settings}
                    onChange={updateSettings}
                    defaultSize={12}
                    defaultSizeMobile={10}
                    defaultColor="#9ca3af"
                    defaultWeight="normal"
                    minSize={10}
                    maxSize={24}
                  />
                </MiniAccordion>

                {/* עיצוב כרטיסים */}
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

                    <EditorToggle
                      label="הצג כפתור הוספה לסל"
                      description="כפתור קבוע בכרטיס"
                      value={(settings.showAddToCart as boolean) || false}
                      onChange={(v) => updateSettings('showAddToCart', v)}
                    />
                    
                    {(settings.showAddToCart as boolean) && (
                      <EditorSelect
                        label="סגנון כפתור"
                        value={(settings.addToCartStyle as string) || 'outline'}
                        options={[
                          { value: 'outline', label: 'מסגרת' },
                          { value: 'filled', label: 'מלא' },
                        ]}
                        onChange={(v) => updateSettings('addToCartStyle', v)}
                      />
                    )}
                  </div>
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
                    paddingTop: 80,
                    paddingBottom: 80,
                    paddingRight: 24,
                    paddingLeft: 24,
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
