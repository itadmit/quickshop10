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
  EditorColorPicker,
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
  content_block: 'בלוק תוכן',
  text_block: 'בלוק טקסט',
  hero: 'באנר ראשי',
  hero_premium: 'באנר פרימיום',
  hero_slider: 'סליידר הירו',
  products: 'מוצרים (גריד)',
  products_slider: 'מוצרים (סליידר)',
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
  quote_banner: 'באנר ציטוט',
  split_banner: 'באנר מפוצל',
  featured_items: 'פריטים מובחרים',
  series_grid: 'סדרות',
  custom: 'HTML מותאם',
};

// Sections that should NOT show title/subtitle editors
const SECTIONS_WITHOUT_TITLES = ['custom'];

// content_block - סקשן אחד, אותן הגדרות
// מה שריק בתוכן פשוט לא מוצג

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
  content_block: {
    showButton: true,
    titleDefaults: { size: 36, sizeMobile: 28, weight: 'bold', color: '#000000' },
    subtitleDefaults: { size: 18, sizeMobile: 16, weight: 'normal', color: '#6b7280' },
    textDefaults: { size: 16, sizeMobile: 14, color: '#374151' },
    paddingDefaults: { top: 64, bottom: 64, left: 24, right: 24 },
  },
  text_block: {
    showButton: true,
    titleDefaults: { size: 36, sizeMobile: 28, weight: 'bold', color: '#000000' },
    subtitleDefaults: { size: 18, sizeMobile: 16, weight: 'normal', color: '#6b7280' },
    textDefaults: { size: 16, sizeMobile: 14, color: '#374151' },
    paddingDefaults: { top: 64, bottom: 64, left: 16, right: 16 },
  },
  hero: {
    showButton: true,
    titleDefaults: { size: 96, sizeMobile: 48, weight: 'extralight', color: '#ffffff' },
    subtitleDefaults: { size: 14, sizeMobile: 12, weight: 'normal', color: 'rgba(255,255,255,0.9)' },
    paddingDefaults: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  hero_premium: {
    showButton: true,
    titleDefaults: { size: 96, sizeMobile: 48, weight: 'extralight', color: '#ffffff' },
    subtitleDefaults: { size: 14, sizeMobile: 12, weight: 'normal', color: 'rgba(255,255,255,0.9)' },
    textDefaults: { size: 16, sizeMobile: 14, color: '#ffffff' },
    paddingDefaults: { top: 0, bottom: 80, left: 24, right: 24 },
  },
  hero_slider: {
    showButton: true,
    titleDefaults: { size: 72, sizeMobile: 36, weight: 'extralight', color: '#ffffff' },
    subtitleDefaults: { size: 18, sizeMobile: 14, weight: 'normal', color: 'rgba(255,255,255,0.9)' },
    paddingDefaults: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  products: {
    showGrid: true,
    showCards: true,
    titleDefaults: { size: 28, sizeMobile: 22, weight: 'light', color: '#000000' },
    subtitleDefaults: { size: 12, sizeMobile: 10, weight: 'normal', color: '#9ca3af' },
    paddingDefaults: { top: 80, bottom: 80, left: 24, right: 24 },
  },
  products_slider: {
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
    titleDefaults: { size: 32, sizeMobile: 24, weight: 'light', color: '#000000' },
    subtitleDefaults: { size: 16, sizeMobile: 14, weight: 'normal', color: '#6b7280' },
    textDefaults: { size: 16, sizeMobile: 14, color: '#374151' },
    paddingDefaults: { top: 0, bottom: 0, left: 0, right: 0 },
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
  custom: {
    // No title/subtitle, just HTML code
    paddingDefaults: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  quote_banner: {
    showButton: false,
    titleDefaults: { size: 48, sizeMobile: 32, weight: 'normal', color: '#ffffff' },
    subtitleDefaults: { size: 18, sizeMobile: 16, weight: 'normal', color: '#ffffff' },
    paddingDefaults: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  split_banner: {
    showButton: false, // אין כפתור בבאנר מפוצל - הקליק על כל הצד
    titleDefaults: { size: 32, sizeMobile: 24, weight: 'light', color: '#ffffff' },
    subtitleDefaults: { size: 16, sizeMobile: 14, weight: 'normal', color: 'rgba(255,255,255,0.9)' },
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
  
  // Track initial values to show warning only when changed
  const [initialCardStyle] = useState(() => (section.settings?.cardStyle as string) || 'standard');
  const [initialDisplayType] = useState(() => (section.content?.type as string) || (section.content?.displayBy as string) || 'all');
  
  // Product search state
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSearchResults, setProductSearchResults] = useState<Array<{id: string; name: string; imageUrl?: string; price?: number}>>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showProductResults, setShowProductResults] = useState(false);
  
  // Search products effect
  useEffect(() => {
    if (!productSearchTerm || productSearchTerm.length < 2) {
      setProductSearchResults([]);
      return;
    }
    
    const searchProducts = async () => {
      setIsSearchingProducts(true);
      try {
        const response = await fetch(`/api/shops/${storeSlug}/products/search?q=${encodeURIComponent(productSearchTerm)}`);
        if (response.ok) {
          const data = await response.json();
          setProductSearchResults(data.products || []);
        }
      } catch (error) {
        console.error('Error searching products:', error);
      } finally {
        setIsSearchingProducts(false);
      }
    };
    
    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [productSearchTerm, storeSlug]);

  // Listen for messages from Google Business connect popup
  useEffect(() => {
    if (section.type !== 'google_reviews') return;
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'google-business-connected') {
        const { accountId, businessName, businessImage, averageRating, totalReviews, googlePlaceUrl, reviews } = event.data;
        onUpdate({ 
          content: { 
            ...section.content, 
            googleAccountId: accountId,
            businessName: businessName || '',
            businessImage: businessImage || '',
            averageRating: averageRating || 0,
            totalReviews: totalReviews || 0,
            googlePlaceUrl: googlePlaceUrl || '',
            reviews: reviews || []
          } 
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [section.type, section.content, onUpdate]);

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
  
  const updateMultipleContent = (updates: Record<string, unknown>) => {
    onUpdate({ content: { ...section.content, ...updates } });
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
                {/* כותרות - משותף לכולם (חוץ מ-custom) */}
                {!SECTIONS_WITHOUT_TITLES.includes(sectionType) && (
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
                )}

                {/* תוכן ספציפי לפי סוג הסקשן */}
                <SectionContentEditor 
                  sectionType={sectionType}
                  content={content}
                  settings={settings}
                  updateContent={updateContent}
                  updateMultipleContent={updateMultipleContent}
                  updateSettings={updateSettings}
                  categories={categories}
                  storeSlug={storeSlug}
                  initialDisplayType={initialDisplayType}
                  productSearchTerm={productSearchTerm}
                  setProductSearchTerm={setProductSearchTerm}
                  productSearchResults={productSearchResults}
                  isSearchingProducts={isSearchingProducts}
                  showProductResults={showProductResults}
                  setShowProductResults={setShowProductResults}
                />
              </div>
            )}

            {/* ========================================== */}
            {/* TAB: עיצוב - משותף לכולם */}
            {/* ========================================== */}
            {activeTab === 'design' && (
              <div className="space-y-0">
                {/* פריסה - מינימלי ל-custom */}
                {sectionType === 'custom' ? (
                  <MiniAccordion title="מרווחים" defaultOpen={true}>
                    <div className="space-y-4">
                      <SectionWidthControl
                        settings={section.settings}
                        onChange={updateSettings}
                      />
                    </div>
                  </MiniAccordion>
                ) : (
                  <MiniAccordion title="פריסה" defaultOpen={true}>
                    <div className="space-y-4">
                      <SectionWidthControl
                        settings={section.settings}
                        onChange={updateSettings}
                      />
                      
                      <MinHeightControl
                        settings={section.settings}
                        onChange={updateSettings}
                        defaultValue={
                          // For hero/video_banner with media - 90vh, for text_block - 400px
                          (section.type === 'hero' || section.type === 'hero_premium' || section.type === 'hero_slider' || section.type === 'video_banner') 
                            ? 90
                            : (section.type === 'content_block' || section.type === 'text_block')
                              ? ((section.content?.imageUrl || section.content?.videoUrl) ? 90 : 400)
                              : 0
                        }
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
                    
                    {/* מיקום תמונה - רק ל-image_text */}
                    {section.type === 'image_text' && (
                      <>
                        <EditorSelect
                          label="מיקום תמונה"
                          value={(settings.imagePosition as string) || 'right'}
                          options={[
                            { value: 'right', label: 'ימין' },
                            { value: 'left', label: 'שמאל' },
                          ]}
                          onChange={(v) => updateSettings('imagePosition', v)}
                        />
                        <EditorSelect
                          label="רוחב תמונה"
                          value={(settings.imageWidth as string) || '50%'}
                          options={[
                            { value: '40%', label: '40%' },
                            { value: '50%', label: '50%' },
                            { value: '60%', label: '60%' },
                          ]}
                          onChange={(v) => updateSettings('imageWidth', v)}
                        />
                      </>
                    )}
                    
                    {/* פרללקס - רק ל-quote_banner */}
                    {section.type === 'quote_banner' && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">אפקט פרללקס</span>
                        <button
                          onClick={() => updateSettings('parallax', !settings.parallax)}
                          className={`w-10 h-5 rounded-full transition-colors ${
                            settings.parallax !== false ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              settings.parallax !== false ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </MiniAccordion>
                )}

                {/* גריד/סליידר - רק לסקשנים עם גריד */}
                {designConfig.showGrid && (
                  <MiniAccordion title={sectionType === 'products_slider' ? 'סליידר' : 'גריד'} defaultOpen={true}>
                    <div className="space-y-3">
                      {/* בורר פריסה - לא מציגים בסקשני מוצרים כי יש סקשנים נפרדים */}
                      {!['products', 'products_slider'].includes(sectionType) && (
                        <EditorSelect
                          label="פריסה"
                          value={(settings.layout as string) || 'grid'}
                          options={[
                            { value: 'grid', label: 'גריד' },
                            { value: 'slider', label: 'סליידר' },
                          ]}
                          onChange={(v) => updateSettings('layout', v)}
                        />
                      )}
                      
                      {/* הגדרות עמודות - לכל סקשני גריד (לא סליידר רגיל) */}
                      {(settings.layout !== 'slider' || ['products', 'products_slider'].includes(sectionType)) && (
                        <>
                          <EditorSlider
                            label="עמודות (מחשב)"
                            value={(settings.columns as number) || 4}
                            onChange={(v) => updateSettings('columns', v)}
                            min={2}
                            max={6}
                            suffix=""
                          />
                          
                          <EditorSlider
                            label="עמודות (מובייל)"
                            value={(settings.mobileColumns as number) || 2}
                            onChange={(v) => updateSettings('mobileColumns', v)}
                            min={1}
                            max={3}
                            suffix=""
                          />
                        </>
                      )}
                      
                      {/* הגדרות סליידר - רק למצב סליידר (לא לסקשני products) */}
                      {settings.layout === 'slider' && !['products', 'products_slider'].includes(sectionType) && (
                        <>
                          <EditorSlider
                            label="רוחב כרטיס"
                            value={(settings.cardWidth as number) || 320}
                            onChange={(v) => updateSettings('cardWidth', v)}
                            min={280}
                            max={450}
                            suffix="px"
                          />
                          
                          <EditorToggle
                            label="ניגון אוטומטי"
                            value={(settings.autoplay as boolean) === true}
                            onChange={(v) => updateSettings('autoplay', v)}
                          />
                          
                          {settings.autoplay && (
                            <EditorSlider
                              label="משך (שניות)"
                              value={((settings.autoplayInterval as number) || 5000) / 1000}
                              min={2}
                              max={10}
                              step={1}
                              suffix="s"
                              onChange={(v) => updateSettings('autoplayInterval', v * 1000)}
                            />
                          )}
                          
                          <EditorToggle
                            label="הצג חצים"
                            value={(settings.showArrows as boolean) !== false}
                            onChange={(v) => updateSettings('showArrows', v)}
                          />
                          
                          <EditorToggle
                            label="לופ אינסופי"
                            value={(settings.loop as boolean) !== false}
                            onChange={(v) => updateSettings('loop', v)}
                          />
                        </>
                      )}
                      
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

                {/* רקע - לא רלוונטי לסליידר הירו, באנר מפוצל, תמונה+טקסט ו-custom */}
                {section.type !== 'hero_slider' && section.type !== 'split_banner' && section.type !== 'image_text' && section.type !== 'custom' && (
                  <MiniAccordion title="רקע" defaultOpen={false}>
                    <FullBackgroundControl
                      settings={{
                        ...section.settings,
                        // Merge content values for content_block sections
                        imageUrl: (section.content?.imageUrl as string) || (section.settings?.imageUrl as string),
                        mobileImageUrl: (section.content?.mobileImageUrl as string) || (section.settings?.mobileImageUrl as string),
                        videoUrl: (section.content?.videoUrl as string) || (section.settings?.videoUrl as string),
                        mobileVideoUrl: (section.content?.mobileVideoUrl as string) || (section.settings?.mobileVideoUrl as string),
                      }}
                      onChange={(key, value) => {
                        // For content_block, image/video go to content, others to settings
                        if (['imageUrl', 'mobileImageUrl', 'videoUrl', 'mobileVideoUrl'].includes(key)) {
                          updateContent(key, value);
                        } else {
                          updateSettings(key, value);
                        }
                      }}
                      defaultColor="#ffffff"
                    />
                  </MiniAccordion>
                )}

                {/* חץ גלילה - רק לסקשנים עם רקע */}
                {['content_block', 'hero', 'hero_premium', 'text_block'].includes(section.type) && (
                  <MiniAccordion title="חץ גלילה" defaultOpen={false}>
                    <EditorToggle
                      label="הצג חץ"
                      value={(section.settings?.showScrollArrow as boolean) !== false}
                      onChange={(v) => updateSettings('showScrollArrow', v)}
                    />
                  </MiniAccordion>
                )}

                {/* טיפוגרפיה - לא ל-custom */}
                {sectionType !== 'custom' && (
                  <>
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
                  </>
                )}
                
                {/* תוכן - רק לסקשנים עם תוכן (לא ל-custom) */}
                {sectionType !== 'custom' && designConfig.textDefaults && (
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

                {/* מפריד - רק לסקשנים products ו-products_slider */}
                {['products', 'products_slider'].includes(sectionType) && (
                  <MiniAccordion title="מפריד" defaultOpen={false}>
                    <div className="space-y-3">
                      <EditorToggle
                        label="הפעל מפריד"
                        value={(settings.showDivider as boolean) !== false}
                        onChange={(v) => updateSettings('showDivider', v)}
                      />
                      
                      {(settings.showDivider as boolean) !== false && (
                        <>
                          <EditorColorPicker
                            label="צבע מפריד"
                            value={(settings.dividerColor as string) || '#C9A962'}
                            onChange={(v) => updateSettings('dividerColor', v)}
                          />
                          
                          <EditorSlider
                            label="עובי מפריד"
                            value={(settings.dividerHeight as number) || 2}
                            onChange={(v) => updateSettings('dividerHeight', v)}
                            min={1}
                            max={8}
                            suffix="px"
                          />
                        </>
                      )}
                    </div>
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
                      {((settings.cardStyle as string) || 'standard') !== initialCardStyle && (
                        <p className="text-[11px] text-red-500 -mt-1">* שינוי סגנון יכנס לתוקף לאחר שמירה</p>
                      )}
                      
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
                      
                      <EditorSelect
                        label="יישור טקסט בכרטיס"
                        value={(settings.cardTextAlign as string) || 'center'}
                        options={[
                          { value: 'right', label: 'ימין' },
                          { value: 'center', label: 'מרכז' },
                          { value: 'left', label: 'שמאל' },
                        ]}
                        onChange={(v) => updateSettings('cardTextAlign', v)}
                      />
                      
                      <EditorSelect
                        label="מקסימום שורות לשם מוצר"
                        value={String((settings.productNameLines as number) || 2)}
                        options={[
                          { value: '1', label: 'שורה אחת' },
                          { value: '2', label: '2 שורות' },
                          { value: '3', label: '3 שורות' },
                          { value: 'none', label: 'ללא הגבלה' },
                        ]}
                        onChange={(v) => updateSettings('productNameLines', v === 'none' ? 0 : parseInt(v))}
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
  updateMultipleContent: (updates: Record<string, unknown>) => void;
  updateSettings: (key: string, value: unknown) => void;
  categories?: Array<{ id: string; name: string }>;
  storeSlug?: string;
  initialDisplayType?: string;
  // Product search state
  productSearchTerm: string;
  setProductSearchTerm: (term: string) => void;
  productSearchResults: Array<{id: string; name: string; imageUrl?: string; price?: number}>;
  isSearchingProducts: boolean;
  showProductResults: boolean;
  setShowProductResults: (show: boolean) => void;
}

function SectionContentEditor({
  sectionType,
  content,
  settings,
  updateContent,
  updateMultipleContent,
  updateSettings,
  categories = [],
  storeSlug,
  initialDisplayType = 'all',
  productSearchTerm,
  setProductSearchTerm,
  productSearchResults,
  isSearchingProducts,
  showProductResults,
  setShowProductResults,
}: SectionContentEditorProps) {
  
  switch (sectionType) {
    // ==========================================
    // בלוק תוכן - סקשן אחד, אותן הגדרות בדיוק
    // כולם משתמשים באותו פאנל ובאותה קומפוננטה
    // ==========================================
    case 'content_block':
    case 'text_block':
    case 'hero':
    case 'hero_premium':
      // תוכן בלבד - רקע בלשונית עיצוב
      return (
        <>
          {/* תוכן טקסט */}
          <MiniAccordion title="תוכן" defaultOpen={true}>
            <RichTextEditor
              value={(content.text as string) || ''}
              onChange={(v) => updateContent('text', v)}
              placeholder="הזן תוכן..."
              minHeight={80}
              maxHeight={200}
            />
          </MiniAccordion>

          {/* כפתור */}
          <MiniAccordion title="כפתור" defaultOpen={false}>
            <div className="space-y-3">
              <EditorInput
                label="טקסט כפתור"
                value={(content.buttonText as string) || ''}
                onChange={(v) => updateContent('buttonText', v)}
                placeholder="לחנות"
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
    // מוצרים נבחרים (גריד או סליידר)
    // ==========================================
    case 'products':
    case 'products_slider': {
      const isSliderSection = sectionType === 'products_slider';
      const selectedProducts = (content.selectedProducts as Array<{id: string; name: string; imageUrl?: string}>) || [];
      const displayType = (content.type as string) || (content.displayBy as string) || 'all';
      
      const addProductToSelection = (product: {id: string; name: string; imageUrl?: string}) => {
        if (!selectedProducts.find(p => p.id === product.id)) {
          const newProducts = [...selectedProducts, product];
          updateMultipleContent({
            selectedProducts: newProducts,
            productIds: newProducts.map(p => p.id),
          });
        }
        setProductSearchTerm('');
        setShowProductResults(false);
      };
      
      const removeProductFromSelection = (productId: string) => {
        const newProducts = selectedProducts.filter(p => p.id !== productId);
        updateMultipleContent({
          selectedProducts: newProducts,
          productIds: newProducts.map(p => p.id),
        });
      };
      
      return (
        <MiniAccordion title="מוצרים" defaultOpen={true}>
          <div className="space-y-3">
            <EditorSelect
              label="הצג מוצרים"
              value={displayType}
              options={[
                { value: 'all', label: 'כל המוצרים' },
                { value: 'category', label: 'לפי קטגוריה' },
                { value: 'featured', label: 'מוצרים מומלצים' },
                { value: 'specific', label: 'מוצרים בודדים' },
              ]}
              onChange={(v) => {
                // Update all content fields at once to avoid race conditions
                const updates: Record<string, unknown> = {
                  type: v,
                  displayBy: v,
                };
                // Clear selections when changing type
                if (v !== 'category') {
                  updates.categoryId = '';
                }
                if (v !== 'specific') {
                  updates.productIds = [];
                  updates.selectedProducts = [];
                }
                updateMultipleContent(updates);
              }}
            />
            <div className="mt-2 p-2 rounded-md bg-red-50 border border-red-100">
              <p className="text-[11px] text-red-600">שימו לב: השינויים בסקשן זה יוצגו לאחר שמירה.</p>
            </div>

            {displayType === 'category' && (
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
            
            {/* Product picker for specific products */}
            {displayType === 'specific' && (
              <div className="space-y-3">
                <label className="block text-xs font-medium" style={{ color: 'var(--editor-text-secondary)' }}>
                  חפש והוסף מוצרים
                </label>
                
                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    onFocus={() => setShowProductResults(true)}
                    placeholder="הקלד לחיפוש..."
                    className="w-full px-3 py-2 text-sm rounded-lg border transition-colors"
                    style={{
                      backgroundColor: 'var(--editor-bg-secondary)',
                      borderColor: 'var(--editor-border-default)',
                      color: 'var(--editor-text-primary)',
                    }}
                  />
                  {isSearchingProducts && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                  )}
                  
                  {/* Search results dropdown */}
                  {showProductResults && productSearchResults.length > 0 && (
                    <div 
                      className="absolute z-50 w-full mt-1 rounded-lg shadow-lg max-h-60 overflow-auto border"
                      style={{
                        backgroundColor: 'var(--editor-bg-primary)',
                        borderColor: 'var(--editor-border-default)',
                      }}
                    >
                      {productSearchResults.map(product => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addProductToSelection(product)}
                          className="w-full px-3 py-2 text-right text-sm hover:bg-[var(--editor-bg-hover)] flex items-center gap-2"
                        >
                          {product.imageUrl && (
                            <img 
                              src={product.imageUrl} 
                              alt="" 
                              className="w-8 h-8 object-cover rounded"
                            />
                          )}
                          <span style={{ color: 'var(--editor-text-primary)' }}>{product.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Selected products */}
                {selectedProducts.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs" style={{ color: 'var(--editor-text-muted)' }}>
                      {selectedProducts.length} מוצרים נבחרו
                    </span>
                    {selectedProducts.map(product => (
                      <div 
                        key={product.id}
                        className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ backgroundColor: 'var(--editor-bg-secondary)' }}
                      >
                        {product.imageUrl && (
                          <img 
                            src={product.imageUrl} 
                            alt="" 
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <span className="flex-1 text-sm truncate" style={{ color: 'var(--editor-text-primary)' }}>
                          {product.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeProductFromSelection(product.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedProducts.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: 'var(--editor-text-muted)' }}>
                    חפש והוסף מוצרים לתצוגה
                  </p>
                )}
              </div>
            )}

            {/* Limit slider - not for specific products */}
            {displayType !== 'specific' && (
              <EditorSlider
                label="כמות להצגה"
                value={(content.limit as number) || (content.displayLimit as number) || 8}
                onChange={(v) => {
                  // חייב לשמור לשני השדות בקריאה אחת כדי שלא יידרסו
                  updateMultipleContent({ limit: v, displayLimit: v });
                }}
                min={1}
                max={24}
                suffix=""
              />
            )}
            
            <EditorSelect
              label="יחס תמונה"
              value={(settings.imageAspectRatio as string) || 'portrait'}
              options={[
                { value: 'square', label: 'ריבוע (1:1)' },
                { value: 'portrait', label: 'פורטרט (3:4)' },
                { value: 'portrait-tall', label: 'פורטרט גבוה (2:3)' },
                { value: 'landscape', label: 'לנדסקייפ (16:9)' },
              ]}
              onChange={(v) => updateSettings('imageAspectRatio', v)}
            />
            
            <EditorSelect
              label="מיקום תמונה"
              value={(settings.imagePosition as string) || 'center'}
              options={[
                { value: 'top', label: 'למעלה (פנים/ראש)' },
                { value: 'center', label: 'מרכז' },
                { value: 'bottom', label: 'למטה (רגליים)' },
              ]}
              onChange={(v) => updateSettings('imagePosition', v)}
            />
            
            <EditorSelect
              label="התאמת תמונה"
              value={(settings.imageFit as string) || 'cover'}
              options={[
                { value: 'cover', label: 'ממלא (חותך)' },
                { value: 'contain', label: 'מתאים (מראה הכל)' },
                { value: 'fill', label: 'מותח (עלול לעוות)' },
              ]}
              onChange={(v) => updateSettings('imageFit', v)}
            />

            <EditorToggle
              label="הצג כפתור הוספה לסל"
              value={(settings.showAddToCart as boolean) || false}
              onChange={(v) => updateSettings('showAddToCart', v)}
            />
            
            {/* Slider-specific settings */}
            {isSliderSection && (
              <>
                <div className="pt-3 border-t border-[var(--editor-border-default)]">
                  <span className="text-xs font-medium text-[var(--editor-text-muted)]">הגדרות סליידר</span>
                </div>
                
                <EditorToggle
                  label="הצג חצים"
                  value={(settings.showArrows as boolean) !== false}
                  onChange={(v) => updateSettings('showArrows', v)}
                />
                
                <EditorToggle
                  label="הצג נקודות"
                  value={(settings.showDots as boolean) !== false}
                  onChange={(v) => updateSettings('showDots', v)}
                />
                
                <EditorSelect
                  label="סגנון חצים"
                  value={(settings.arrowStyle as string) || 'circle'}
                  options={[
                    { value: 'circle', label: 'עיגול' },
                    { value: 'square', label: 'ריבוע' },
                    { value: 'minimal', label: 'מינימלי' },
                  ]}
                  onChange={(v) => updateSettings('arrowStyle', v)}
                />
                
                {(settings.arrowStyle as string) !== 'minimal' && (
                  <>
                    <EditorColorPicker
                      label="צבע רקע חצים"
                      value={(settings.arrowBgColor as string) || '#ffffff'}
                      onChange={(v) => updateSettings('arrowBgColor', v)}
                    />
                    <EditorColorPicker
                      label="צבע חץ"
                      value={(settings.arrowColor as string) || '#374151'}
                      onChange={(v) => updateSettings('arrowColor', v)}
                    />
                  </>
                )}
                
                <EditorSelect
                  label="סגנון נקודות"
                  value={(settings.dotsStyle as string) || 'dots'}
                  options={[
                    { value: 'dots', label: 'נקודות' },
                    { value: 'lines', label: 'קווים' },
                    { value: 'numbers', label: 'מספרים' },
                  ]}
                  onChange={(v) => updateSettings('dotsStyle', v)}
                />
                
                <EditorColorPicker
                  label="צבע נקודות פעילות"
                  value={(settings.dotsActiveColor as string) || '#111827'}
                  onChange={(v) => updateSettings('dotsActiveColor', v)}
                />
                <EditorColorPicker
                  label="צבע נקודות לא פעילות"
                  value={(settings.dotsInactiveColor as string) || '#d1d5db'}
                  onChange={(v) => updateSettings('dotsInactiveColor', v)}
                />
                
                <EditorToggle
                  label="הפעלה אוטומטית"
                  value={(settings.autoplay as boolean) || false}
                  onChange={(v) => updateSettings('autoplay', v)}
                />
                
                {(settings.autoplay as boolean) && (
                  <EditorSlider
                    label="מהירות (שניות)"
                    value={((settings.autoplayInterval as number) || 5000) / 1000}
                    min={2}
                    max={10}
                    suffix="שניות"
                    onChange={(v) => updateSettings('autoplayInterval', v * 1000)}
                  />
                )}
                
                <EditorToggle
                  label="לופ אינסופי"
                  value={(settings.loop as boolean) !== false}
                  onChange={(v) => updateSettings('loop', v)}
                />
              </>
            )}
          </div>
        </MiniAccordion>
      );
    }

    // ==========================================
    // באנר ראשי
    // ==========================================
    case 'hero':
      return (
        <>
          <MiniAccordion title="כפתור" defaultOpen={true}>
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
    // ביקורות
    // ==========================================
    case 'reviews': {
      const reviewsList = (content.reviews as Array<{
        id?: string;
        author: string;
        rating: number;
        text: string;
      }>) || [];
      
      const addReview = () => {
        const newReview = {
          id: `review-${Date.now()}`,
          author: `לקוח ${reviewsList.length + 1}`,
          rating: 5,
          text: 'ביקורת חדשה',
        };
        updateContent('reviews', [...reviewsList, newReview]);
      };
      
      const updateReview = (index: number, key: string, value: unknown) => {
        const updated = reviewsList.map((r, i) => 
          i === index ? { ...r, [key]: value } : r
        );
        updateContent('reviews', updated);
      };
      
      const removeReview = (index: number) => {
        if (reviewsList.length <= 1) return;
        updateContent('reviews', reviewsList.filter((_, i) => i !== index));
      };
      
      const moveReview = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === reviewsList.length - 1) return;
        const newList = [...reviewsList];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        updateContent('reviews', newList);
      };
      
      return (
        <MiniAccordion title={`ביקורות (${reviewsList.length})`} defaultOpen={true}>
          <div className="space-y-3">
            {reviewsList.map((review, index) => (
              <div 
                key={review.id || index}
                className="border border-[var(--editor-border-default)] rounded-lg p-3 bg-[var(--editor-bg-tertiary)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[var(--editor-text-secondary)]">
                    ביקורת {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveReview(index, 'up')} disabled={index === 0} className="p-1 hover:bg-[var(--editor-bg-hover)] rounded disabled:opacity-30" title="הזז למעלה">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>
                    </button>
                    <button onClick={() => moveReview(index, 'down')} disabled={index === reviewsList.length - 1} className="p-1 hover:bg-[var(--editor-bg-hover)] rounded disabled:opacity-30" title="הזז למטה">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                    </button>
                    <button onClick={() => removeReview(index)} disabled={reviewsList.length <= 1} className="p-1 hover:bg-red-100 text-red-500 rounded disabled:opacity-30" title="מחק">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <EditorInput label="שם" value={review.author || ''} onChange={(v) => updateReview(index, 'author', v)} placeholder="שם הלקוח" />
                  <EditorSlider label="דירוג" value={review.rating || 5} min={1} max={5} suffix="⭐" onChange={(v) => updateReview(index, 'rating', v)} />
                  <EditorInput label="טקסט" value={review.text || ''} onChange={(v) => updateReview(index, 'text', v)} placeholder="תוכן הביקורת" />
                </div>
              </div>
            ))}
            <button onClick={addReview} className="w-full py-2 border-2 border-dashed border-[var(--editor-border-default)] rounded-lg text-sm text-[var(--editor-text-secondary)] hover:border-[var(--editor-accent)] hover:text-[var(--editor-accent)] transition-colors">
              + הוסף ביקורת
            </button>
          </div>
        </MiniAccordion>
      );
    }

    // ==========================================
    // ביקורות גוגל - רק חיבור, לא עריכה ידנית
    // ==========================================
    case 'google_reviews': {
      const isConnected = !!(content.googleAccountId);
      const businessName = (content.businessName as string) || '';
      const totalReviews = (content.totalReviews as number) || 0;
      const averageRating = (content.averageRating as number) || 0;
      
      const handleConnectGoogle = () => {
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(
          `/shops/${storeSlug}/admin/settings/integrations/google-business/connect`,
          'google-auth',
          `width=${width},height=${height},left=${left},top=${top},popup=yes`
        );
      };
      
      return (
        <MiniAccordion title="חיבור לגוגל" defaultOpen={true}>
          <div className="space-y-3">
            {isConnected ? (
              <>
                <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    מחובר לגוגל ביזנס
                  </div>
                  <div className="text-xs text-green-600 space-y-0.5">
                    <p><strong>{businessName}</strong></p>
                    <p>⭐ {averageRating.toFixed(1)} ({totalReviews} ביקורות)</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    updateContent('googleAccountId', null);
                    updateContent('businessName', '');
                    updateContent('businessImage', '');
                    updateContent('averageRating', 0);
                    updateContent('totalReviews', 0);
                    updateContent('googlePlaceUrl', '');
                    updateContent('reviews', []);
                  }}
                  className="w-full py-2 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  נתק חיבור
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleConnectGoogle}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-700">התחבר לגוגל ביזנס</span>
                </button>
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-[10px] text-amber-700">
                    💡 הזן את פרטי העסק והביקורות מגוגל
                  </p>
                </div>
              </>
            )}
          </div>
        </MiniAccordion>
      );
    }

    // ==========================================
    // חוזקות / פיצ'רים
    // ==========================================
    case 'features':
      const FEATURE_ICONS = [
        { value: 'truck', label: 'משלוח' },
        { value: 'refresh', label: 'החזרה' },
        { value: 'shield', label: 'אבטחה' },
        { value: 'message', label: 'הודעה' },
        { value: 'star', label: 'כוכב' },
        { value: 'heart', label: 'לב' },
        { value: 'check', label: 'וי' },
        { value: 'clock', label: 'שעון' },
        { value: 'gift', label: 'מתנה' },
        { value: 'sparkles', label: 'נצנוץ' },
        { value: 'percent', label: 'הנחה' },
        { value: 'award', label: 'פרס' },
        { value: 'zap', label: 'מהירות' },
      ];
      
      const rawFeatures = (content.features as Array<{ icon?: string; title: string; description?: string }>) || [
        { icon: 'truck', title: 'משלוח מהיר', description: 'עד 3 ימי עסקים' },
        { icon: 'refresh', title: 'החזרות חינם', description: 'עד 30 יום' },
        { icon: 'shield', title: 'תשלום מאובטח', description: 'אבטחה מלאה' },
      ];
      
      const featuresList = rawFeatures.map(f => ({
        icon: f.icon || 'sparkles',
        title: f.title,
        description: f.description || '',
      }));
      
      const updateFeaturesList = (newFeatures: Array<{ icon: string; title: string; description: string }>) => {
        updateContent('features', newFeatures);
      };
      
      const updateFeatureItem = (index: number, field: 'icon' | 'title' | 'description', value: string) => {
        const newFeatures = [...featuresList];
        newFeatures[index] = { ...newFeatures[index], [field]: value };
        updateFeaturesList(newFeatures);
      };
      
      const addFeatureItem = () => {
        updateFeaturesList([...featuresList, { icon: 'star', title: 'יתרון חדש', description: 'תיאור היתרון' }]);
      };
      
      const removeFeatureItem = (index: number) => {
        const newFeatures = featuresList.filter((_, i) => i !== index);
        updateFeaturesList(newFeatures);
      };
      
      const moveFeatureItem = (index: number, direction: 'up' | 'down') => {
        const newFeatures = [...featuresList];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= featuresList.length) return;
        [newFeatures[index], newFeatures[newIndex]] = [newFeatures[newIndex], newFeatures[index]];
        updateFeaturesList(newFeatures);
      };
      
      return (
        <MiniAccordion title="חוזקות" defaultOpen={true}>
          <div className="space-y-3">
            {featuresList.map((feature, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">חוזקה {index + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveFeatureItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 text-xs"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveFeatureItem(index, 'down')}
                      disabled={index === featuresList.length - 1}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 text-xs"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeFeatureItem(index)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                {/* Icon Selector */}
                <select
                  value={feature.icon}
                  onChange={(e) => updateFeatureItem(index, 'icon', e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 bg-white"
                >
                  {FEATURE_ICONS.map((icon) => (
                    <option key={icon.value} value={icon.value}>
                      {icon.label}
                    </option>
                  ))}
                </select>
                
                {/* Title */}
                <input
                  type="text"
                  value={feature.title}
                  onChange={(e) => updateFeatureItem(index, 'title', e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1.5"
                  placeholder="כותרת החוזקה"
                />
                
                {/* Description */}
                <input
                  type="text"
                  value={feature.description}
                  onChange={(e) => updateFeatureItem(index, 'description', e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1.5"
                  placeholder="תיאור קצר"
                />
              </div>
            ))}
            <button
              onClick={addFeatureItem}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-gray-400 hover:text-gray-600"
            >
              + הוסף חוזקה
            </button>
          </div>
        </MiniAccordion>
      );

    // ==========================================
    // שאלות נפוצות
    // ==========================================
    case 'faq': {
      const faqItems = (content.items as Array<{
        id?: string;
        question: string;
        answer: string;
      }>) || [];
      
      const addFaqItem = () => {
        const newItem = {
          id: `faq-${Date.now()}`,
          question: `שאלה ${faqItems.length + 1}`,
          answer: 'תשובה...',
        };
        updateContent('items', [...faqItems, newItem]);
      };
      
      const updateFaqItem = (index: number, key: string, value: unknown) => {
        const updated = faqItems.map((item, i) => 
          i === index ? { ...item, [key]: value } : item
        );
        updateContent('items', updated);
      };
      
      const removeFaqItem = (index: number) => {
        if (faqItems.length <= 1) return;
        updateContent('items', faqItems.filter((_, i) => i !== index));
      };
      
      const moveFaqItem = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === faqItems.length - 1) return;
        const newList = [...faqItems];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        updateContent('items', newList);
      };
      
      return (
        <MiniAccordion title={`שאלות (${faqItems.length})`} defaultOpen={true}>
          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <div 
                key={item.id || index}
                className="border border-[var(--editor-border-default)] rounded-lg p-3 bg-[var(--editor-bg-tertiary)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[var(--editor-text-secondary)]">
                    שאלה {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveFaqItem(index, 'up')} disabled={index === 0} className="p-1 hover:bg-[var(--editor-bg-hover)] rounded disabled:opacity-30" title="הזז למעלה">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>
                    </button>
                    <button onClick={() => moveFaqItem(index, 'down')} disabled={index === faqItems.length - 1} className="p-1 hover:bg-[var(--editor-bg-hover)] rounded disabled:opacity-30" title="הזז למטה">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                    </button>
                    <button onClick={() => removeFaqItem(index)} disabled={faqItems.length <= 1} className="p-1 hover:bg-red-100 text-red-500 rounded disabled:opacity-30" title="מחק">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <EditorInput label="שאלה" value={item.question || ''} onChange={(v) => updateFaqItem(index, 'question', v)} placeholder="השאלה" />
                  <EditorInput label="תשובה" value={item.answer || ''} onChange={(v) => updateFaqItem(index, 'answer', v)} placeholder="התשובה" />
                </div>
              </div>
            ))}
            <button onClick={addFaqItem} className="w-full py-2 border-2 border-dashed border-[var(--editor-border-default)] rounded-lg text-sm text-[var(--editor-text-secondary)] hover:border-[var(--editor-accent)] hover:text-[var(--editor-accent)] transition-colors">
              + הוסף שאלה
            </button>
          </div>
        </MiniAccordion>
      );
    }

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
    case 'logos': {
      const logosList = (content.logos as Array<{
        id?: string;
        imageUrl: string;
        alt?: string;
        link?: string;
      }>) || [];
      
      const addLogo = () => {
        const newLogo = {
          id: `logo-${Date.now()}`,
          imageUrl: '',
          alt: `לוגו ${logosList.length + 1}`,
          link: '',
        };
        updateContent('logos', [...logosList, newLogo]);
      };
      
      const updateLogo = (index: number, key: string, value: unknown) => {
        const updated = logosList.map((l, i) => 
          i === index ? { ...l, [key]: value } : l
        );
        updateContent('logos', updated);
      };
      
      const removeLogo = (index: number) => {
        if (logosList.length <= 1) return;
        updateContent('logos', logosList.filter((_, i) => i !== index));
      };
      
      const moveLogo = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === logosList.length - 1) return;
        const newList = [...logosList];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        updateContent('logos', newList);
      };
      
      return (
        <MiniAccordion title={`לוגואים (${logosList.length})`} defaultOpen={true}>
          <div className="space-y-3">
            {logosList.map((logo, index) => (
              <div 
                key={logo.id || index}
                className="border border-[var(--editor-border-default)] rounded-lg p-3 bg-[var(--editor-bg-tertiary)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[var(--editor-text-secondary)]">
                    לוגו {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveLogo(index, 'up')} disabled={index === 0} className="p-1 hover:bg-[var(--editor-bg-hover)] rounded disabled:opacity-30" title="הזז למעלה">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>
                    </button>
                    <button onClick={() => moveLogo(index, 'down')} disabled={index === logosList.length - 1} className="p-1 hover:bg-[var(--editor-bg-hover)] rounded disabled:opacity-30" title="הזז למטה">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                    </button>
                    <button onClick={() => removeLogo(index)} disabled={logosList.length <= 1} className="p-1 hover:bg-red-100 text-red-500 rounded disabled:opacity-30" title="מחק">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <EditorInput label="תמונה" value={logo.imageUrl || ''} onChange={(v) => updateLogo(index, 'imageUrl', v)} placeholder="https://..." />
                  {logo.imageUrl && (
                    <div className="h-12 bg-gray-50 rounded flex items-center justify-center">
                      <img src={logo.imageUrl} alt="" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                  <EditorInput label="קישור (אופציונלי)" value={logo.link || ''} onChange={(v) => updateLogo(index, 'link', v)} placeholder="https://..." />
                </div>
              </div>
            ))}
            <button onClick={addLogo} className="w-full py-2 border-2 border-dashed border-[var(--editor-border-default)] rounded-lg text-sm text-[var(--editor-text-secondary)] hover:border-[var(--editor-accent)] hover:text-[var(--editor-accent)] transition-colors">
              + הוסף לוגו
            </button>
          </div>
        </MiniAccordion>
      );
    }

    // ==========================================
    // גלריה
    // ==========================================
    case 'gallery': {
      const imagesList = (content.images as Array<{
        id?: string;
        url: string;
        alt?: string;
      }>) || [];
      
      const addImage = () => {
        const newImage = {
          id: `img-${Date.now()}`,
          url: '',
          alt: `תמונה ${imagesList.length + 1}`,
        };
        updateContent('images', [...imagesList, newImage]);
      };
      
      const updateImage = (index: number, key: string, value: unknown) => {
        const updated = imagesList.map((img, i) => 
          i === index ? { ...img, [key]: value } : img
        );
        updateContent('images', updated);
      };
      
      const removeImage = (index: number) => {
        if (imagesList.length <= 1) return;
        updateContent('images', imagesList.filter((_, i) => i !== index));
      };
      
      const moveImage = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === imagesList.length - 1) return;
        const newList = [...imagesList];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        updateContent('images', newList);
      };
      
      return (
        <MiniAccordion title={`תמונות (${imagesList.length})`} defaultOpen={true}>
          <div className="space-y-3">
            {imagesList.map((image, index) => (
              <div 
                key={image.id || index}
                className="border border-[var(--editor-border-default)] rounded-lg p-3 bg-[var(--editor-bg-tertiary)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[var(--editor-text-secondary)]">
                    תמונה {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveImage(index, 'up')} disabled={index === 0} className="p-1 hover:bg-[var(--editor-bg-hover)] rounded disabled:opacity-30" title="הזז למעלה">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>
                    </button>
                    <button onClick={() => moveImage(index, 'down')} disabled={index === imagesList.length - 1} className="p-1 hover:bg-[var(--editor-bg-hover)] rounded disabled:opacity-30" title="הזז למטה">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                    </button>
                    <button onClick={() => removeImage(index)} disabled={imagesList.length <= 1} className="p-1 hover:bg-red-100 text-red-500 rounded disabled:opacity-30" title="מחק">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <EditorInput label="כתובת תמונה" value={image.url || ''} onChange={(v) => updateImage(index, 'url', v)} placeholder="https://..." />
                  {image.url && (
                    <div className="aspect-square bg-gray-50 rounded overflow-hidden">
                      <img src={image.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <EditorInput label="טקסט חלופי" value={image.alt || ''} onChange={(v) => updateImage(index, 'alt', v)} placeholder="תיאור התמונה" />
                </div>
              </div>
            ))}
            <button onClick={addImage} className="w-full py-2 border-2 border-dashed border-[var(--editor-border-default)] rounded-lg text-sm text-[var(--editor-text-secondary)] hover:border-[var(--editor-accent)] hover:text-[var(--editor-accent)] transition-colors">
              + הוסף תמונה
            </button>
          </div>
        </MiniAccordion>
      );
    }

    // ==========================================
    // תמונה וטקסט
    // ==========================================
    case 'image_text':
      return (
        <>
          <MiniAccordion title="תמונה" defaultOpen={true}>
            <div className="space-y-3">
              <EditorInput
                label="כתובת תמונה"
                value={(content.imageUrl as string) || ''}
                onChange={(v) => updateContent('imageUrl', v)}
                placeholder="https://..."
              />
              {(content.imageUrl as string) && (
                <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                  <img src={content.imageUrl as string} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
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
        </>
      );

    // ==========================================
    // באנר קטן
    // ==========================================
    case 'banner_small':
      return (
        <MiniAccordion title="כפתור" defaultOpen={true}>
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
      );

    // ==========================================
    // באנר ציטוט - פאנל פשוט, שאר ההגדרות בלשונית עיצוב
    // ==========================================
    case 'quote_banner':
      return (
        <MiniAccordion title="ציטוט" defaultOpen={true}>
          <div className="space-y-3">
            <EditorInput
              label="טקסט הציטוט"
              value={(content.quote as string) || ''}
              onChange={(v) => updateContent('quote', v)}
              placeholder="הציטוט שלכם כאן"
            />
            
            <EditorInput
              label="מקור / שם המחבר"
              value={(content.attribution as string) || ''}
              onChange={(v) => updateContent('attribution', v)}
              placeholder="שם המחבר (אופציונלי)"
            />
          </div>
        </MiniAccordion>
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
                label="קישור וידאו (MP4)"
                value={(content.videoUrl as string) || ''}
                onChange={(v) => updateContent('videoUrl', v)}
                placeholder="https://example.com/video.mp4"
              />
              <p className="text-[10px] text-gray-400">הזן קישור ישיר לקובץ MP4</p>
              
              <div className="pt-2 space-y-2">
                <EditorToggle
                  label="הפעל אוטומטית"
                  value={(settings.autoplay as boolean) !== false}
                  onChange={(v) => updateSettings('autoplay', v)}
                />
                <EditorToggle
                  label="השתק"
                  value={(settings.muted as boolean) !== false}
                  onChange={(v) => updateSettings('muted', v)}
                />
                <EditorToggle
                  label="לופ"
                  value={(settings.loop as boolean) !== false}
                  onChange={(v) => updateSettings('loop', v)}
                />
                <EditorToggle
                  label="הצג פקדים"
                  value={(settings.controls as boolean) || false}
                  onChange={(v) => updateSettings('controls', v)}
                />
              </div>
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
    // באנר מפוצל - 2 צדדים (ימין ושמאל)
    // מבוסס על אותו מבנה של hero_slider אבל בלי ריפיטר
    // ==========================================
    case 'split_banner': {
      const rightSide = (content.right as { title?: string; imageUrl?: string; mobileImageUrl?: string; link?: string }) || {};
      const leftSide = (content.left as { title?: string; imageUrl?: string; mobileImageUrl?: string; link?: string }) || {};
      
      const updateSide = (side: 'right' | 'left', key: string, value: string) => {
        const currentSide = side === 'right' ? rightSide : leftSide;
        updateContent(side, { ...currentSide, [key]: value });
      };
      
      return (
        <>
          {/* צד ימין (ראשון ב-RTL) */}
          <MiniAccordion title={`צד ימין${rightSide.title ? ` - ${rightSide.title}` : ''}`} defaultOpen={true}>
            <div className="space-y-2">
              <EditorInput
                label="כותרת"
                value={rightSide.title || ''}
                onChange={(v) => updateSide('right', 'title', v)}
                placeholder="נשים"
              />
              
              <EditorInput
                label="תמונה (מחשב)"
                value={rightSide.imageUrl || ''}
                onChange={(v) => updateSide('right', 'imageUrl', v)}
                placeholder="https://..."
              />
              {rightSide.imageUrl && (
                <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                  <img src={rightSide.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              
              <EditorInput
                label="תמונה (מובייל)"
                value={rightSide.mobileImageUrl || ''}
                onChange={(v) => updateSide('right', 'mobileImageUrl', v)}
                placeholder="אופציונלי - תמונה אחרת למובייל"
              />
              
              <EditorInput
                label="קישור"
                value={rightSide.link || ''}
                onChange={(v) => updateSide('right', 'link', v)}
                placeholder="/category/women"
              />
            </div>
          </MiniAccordion>
          
          {/* צד שמאל (שני ב-RTL) */}
          <MiniAccordion title={`צד שמאל${leftSide.title ? ` - ${leftSide.title}` : ''}`} defaultOpen={false}>
            <div className="space-y-2">
              <EditorInput
                label="כותרת"
                value={leftSide.title || ''}
                onChange={(v) => updateSide('left', 'title', v)}
                placeholder="גברים"
              />
              
              <EditorInput
                label="תמונה (מחשב)"
                value={leftSide.imageUrl || ''}
                onChange={(v) => updateSide('left', 'imageUrl', v)}
                placeholder="https://..."
              />
              {leftSide.imageUrl && (
                <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                  <img src={leftSide.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              
              <EditorInput
                label="תמונה (מובייל)"
                value={leftSide.mobileImageUrl || ''}
                onChange={(v) => updateSide('left', 'mobileImageUrl', v)}
                placeholder="אופציונלי - תמונה אחרת למובייל"
              />
              
              <EditorInput
                label="קישור"
                value={leftSide.link || ''}
                onChange={(v) => updateSide('left', 'link', v)}
                placeholder="/category/men"
              />
            </div>
          </MiniAccordion>
        </>
      );
    }

    // ==========================================
    // קטגוריות
    // ==========================================
    case 'categories':
      const categorySelectionMode = (content.selectionMode as string) || 'all';
      const selectedCategoryIds = (content.categoryIds as string[]) || [];
      const categoryImages = (content.categoryImages as Record<string, string>) || {};
      
      const updateCategoryImage = (catId: string, imageUrl: string) => {
        const newImages = { ...categoryImages, [catId]: imageUrl };
        if (!imageUrl) delete newImages[catId];
        updateContent('categoryImages', newImages);
      };
      
      return (
        <>
          <MiniAccordion title="קטגוריות" defaultOpen={true}>
            <div className="space-y-3">
              {/* Selection Mode */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--editor-text-secondary)' }}>
                  מקור קטגוריות
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateContent('selectionMode', 'all')}
                    className={`flex-1 py-2 px-3 text-xs rounded-lg border transition-all ${
                      categorySelectionMode === 'all'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    הכל
                  </button>
                  <button
                    onClick={() => updateContent('selectionMode', 'manual')}
                    className={`flex-1 py-2 px-3 text-xs rounded-lg border transition-all ${
                      categorySelectionMode === 'manual'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    בחירה ידנית
                  </button>
                </div>
              </div>
              
              {/* Manual Selection */}
              {categorySelectionMode === 'manual' && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium" style={{ color: 'var(--editor-text-secondary)' }}>
                    בחר קטגוריות (לפי סדר ההופעה)
                  </label>
                  
                  {/* Selected Categories - Reorderable with custom image */}
                  {selectedCategoryIds.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {selectedCategoryIds.map((catId, index) => {
                        const cat = categories.find(c => c.id === catId);
                        if (!cat) return null;
                        const hasCustomImage = catId in categoryImages;
                        
                        return (
                          <div 
                            key={catId}
                            className="bg-blue-50 border border-blue-200 rounded-lg text-xs overflow-hidden"
                          >
                            <div className="flex items-center gap-2 p-2">
                              <span className="text-gray-400 cursor-move">⋮⋮</span>
                              <span className="flex-1 font-medium">{cat.name}</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    if (index > 0) {
                                      const newIds = [...selectedCategoryIds];
                                      [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
                                      updateContent('categoryIds', newIds);
                                    }
                                  }}
                                  disabled={index === 0}
                                  className="p-1 hover:bg-blue-100 rounded disabled:opacity-30"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={() => {
                                    if (index < selectedCategoryIds.length - 1) {
                                      const newIds = [...selectedCategoryIds];
                                      [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
                                      updateContent('categoryIds', newIds);
                                    }
                                  }}
                                  disabled={index === selectedCategoryIds.length - 1}
                                  className="p-1 hover:bg-blue-100 rounded disabled:opacity-30"
                                >
                                  ↓
                                </button>
                                <button
                                  onClick={() => {
                                    const newIds = selectedCategoryIds.filter(id => id !== catId);
                                    updateContent('categoryIds', newIds);
                                    // Also remove custom image if exists
                                    if (categoryImages[catId]) {
                                      const newImages = { ...categoryImages };
                                      delete newImages[catId];
                                      updateContent('categoryImages', newImages);
                                    }
                                  }}
                                  className="p-1 hover:bg-red-100 text-red-500 rounded"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                            
                            {/* Custom Image Option */}
                            <div className="px-2 pb-2 pt-1 border-t border-blue-200/50">
                              {hasCustomImage ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    {categoryImages[catId] && (
                                      <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                        <img 
                                          src={categoryImages[catId]} 
                                          alt="" 
                                          className="w-full h-full object-cover"
                                          onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                      </div>
                                    )}
                                    <input
                                      type="text"
                                      value={categoryImages[catId] || ''}
                                      onChange={(e) => updateCategoryImage(catId, e.target.value)}
                                      placeholder="URL תמונה..."
                                      className="flex-1 px-2 py-1.5 text-[10px] border border-gray-200 rounded-md focus:border-blue-400 focus:outline-none"
                                    />
                                    <button
                                      onClick={() => updateCategoryImage(catId, '')}
                                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                      title="הסר תמונה מותאמת"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => updateCategoryImage(catId, 'https://')}
                                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  תמונה מותאמת
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Available Categories */}
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    {categories
                      .filter(cat => !selectedCategoryIds.includes(cat.id))
                      .map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            updateContent('categoryIds', [...selectedCategoryIds, cat.id]);
                          }}
                          className="w-full text-right px-3 py-2 text-xs hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          + {cat.name}
                        </button>
                      ))}
                    {categories.filter(cat => !selectedCategoryIds.includes(cat.id)).length === 0 && (
                      <div className="px-3 py-2 text-xs text-gray-400 text-center">
                        כל הקטגוריות נבחרו
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {categorySelectionMode === 'all' && (
                <EditorSlider
                  label="כמות להצגה"
                  value={(content.displayLimit as number) || 6}
                  onChange={(v) => updateContent('displayLimit', v)}
                  min={1}
                  max={12}
                  suffix=""
                />
              )}
            </div>
          </MiniAccordion>
          
          <MiniAccordion title="תצוגה">
            <div className="space-y-3">
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
        </>
      );

    // ==========================================
    // פריטים מובחרים
    // ==========================================
    case 'featured_items':
      const featuredItems = (content.items as Array<{id: string; name: string; imageUrl?: string; link: string}>) || [];
      
      const addFeaturedItem = () => {
        const newItem = {
          id: crypto.randomUUID(),
          name: `פריט ${featuredItems.length + 1}`,
          imageUrl: '',
          link: '/products',
        };
        updateContent('items', [...featuredItems, newItem]);
      };
      
      const updateFeaturedItem = (index: number, field: string, value: string) => {
        const newItems = [...featuredItems];
        newItems[index] = { ...newItems[index], [field]: value };
        updateContent('items', newItems);
      };
      
      const removeFeaturedItem = (index: number) => {
        const newItems = featuredItems.filter((_, i) => i !== index);
        updateContent('items', newItems);
      };
      
      const moveFeaturedItem = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= featuredItems.length) return;
        const newItems = [...featuredItems];
        [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
        updateContent('items', newItems);
      };
      
      return (
        <MiniAccordion title="פריטים" defaultOpen={true}>
          <div className="space-y-3">
            {/* Items List */}
            <div className="space-y-2">
              {featuredItems.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">פריט {index + 1}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveFeaturedItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 text-xs"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveFeaturedItem(index, 'down')}
                        disabled={index === featuredItems.length - 1}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 text-xs"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeFeaturedItem(index)}
                        className="p-1 hover:bg-red-100 text-red-500 rounded text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  <EditorInput
                    label="שם"
                    value={item.name}
                    onChange={(v) => updateFeaturedItem(index, 'name', v)}
                    placeholder="שם הפריט"
                  />
                  
                  <EditorInput
                    label="קישור"
                    value={item.link}
                    onChange={(v) => updateFeaturedItem(index, 'link', v)}
                    placeholder="/products או כתובת מלאה"
                  />
                  
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--editor-text-secondary)' }}>
                      תמונה
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={item.imageUrl || ''}
                        onChange={(e) => updateFeaturedItem(index, 'imageUrl', e.target.value)}
                        placeholder="URL תמונה"
                        className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded"
                      />
                    </div>
                    {item.imageUrl && (
                      <div className="mt-2 aspect-video bg-gray-100 rounded overflow-hidden">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {featuredItems.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">אין פריטים. לחץ להוספה.</p>
              )}
            </div>
            
            {/* Add Button */}
            <button
              onClick={addFeaturedItem}
              className="w-full py-2 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              + הוסף פריט
            </button>
          </div>
        </MiniAccordion>
      );

    // ==========================================
    // סדרות
    // ==========================================
    case 'series_grid':
      const seriesSelectionMode = (content.selectionMode as string) || 'all';
      const selectedSeriesIds = (content.categoryIds as string[]) || [];
      const seriesImages = (content.categoryImages as Record<string, string>) || {};
      const seriesStyle = (settings.style as string) || 'cards';
      
      const updateSeriesImage = (catId: string, imageUrl: string) => {
        const newImages = { ...seriesImages, [catId]: imageUrl };
        if (!imageUrl) delete newImages[catId];
        updateContent('categoryImages', newImages);
      };
      
      return (
        <>
          <MiniAccordion title="סדרות" defaultOpen={true}>
            <div className="space-y-3">
              {/* Style Selection */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--editor-text-secondary)' }}>
                  סגנון תצוגה
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSettings('style', 'cards')}
                    className={`flex-1 py-3 px-3 text-xs rounded-lg border transition-all flex flex-col items-center gap-1 ${
                      seriesStyle === 'cards'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <rect x="3" y="3" width="7" height="10" rx="1" strokeWidth="1.5"/>
                      <rect x="14" y="3" width="7" height="10" rx="1" strokeWidth="1.5"/>
                      <line x1="3" y1="16" x2="10" y2="16" strokeWidth="1.5"/>
                      <line x1="14" y1="16" x2="21" y2="16" strokeWidth="1.5"/>
                    </svg>
                    כרטיסים
                  </button>
                  <button
                    onClick={() => updateSettings('style', 'overlay')}
                    className={`flex-1 py-3 px-3 text-xs rounded-lg border transition-all flex flex-col items-center gap-1 ${
                      seriesStyle === 'overlay'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <rect x="3" y="3" width="7" height="10" rx="1" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2"/>
                      <rect x="14" y="3" width="7" height="10" rx="1" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2"/>
                      <line x1="4" y1="10" x2="9" y2="10" strokeWidth="1.5"/>
                      <line x1="15" y1="10" x2="20" y2="10" strokeWidth="1.5"/>
                    </svg>
                    אוברליי
                  </button>
                </div>
                <p className="text-[10px] text-red-500 mt-1">* שינוי סגנון יכנס לתוקף לאחר שמירה</p>
              </div>
              
              {/* Selection Mode */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--editor-text-secondary)' }}>
                  מקור סדרות
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateContent('selectionMode', 'all')}
                    className={`flex-1 py-2 px-3 text-xs rounded-lg border transition-all ${
                      seriesSelectionMode === 'all'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    הכל
                  </button>
                  <button
                    onClick={() => updateContent('selectionMode', 'manual')}
                    className={`flex-1 py-2 px-3 text-xs rounded-lg border transition-all ${
                      seriesSelectionMode === 'manual'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    בחירה ידנית
                  </button>
                </div>
              </div>
              
              {/* Manual Selection */}
              {seriesSelectionMode === 'manual' && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium" style={{ color: 'var(--editor-text-secondary)' }}>
                    בחר קטגוריות (לפי סדר ההופעה)
                  </label>
                  
                  {/* Selected Categories - Reorderable with custom image */}
                  {selectedSeriesIds.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {selectedSeriesIds.map((catId, index) => {
                        const cat = categories.find(c => c.id === catId);
                        if (!cat) return null;
                        const hasCustomImage = catId in seriesImages;
                        
                        return (
                          <div 
                            key={catId}
                            className="bg-blue-50 border border-blue-200 rounded-lg text-xs overflow-hidden"
                          >
                            <div className="flex items-center gap-2 p-2">
                              <span className="text-gray-400 cursor-move">⋮⋮</span>
                              <span className="flex-1 font-medium">{cat.name}</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    if (index > 0) {
                                      const newIds = [...selectedSeriesIds];
                                      [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
                                      updateContent('categoryIds', newIds);
                                    }
                                  }}
                                  disabled={index === 0}
                                  className="p-1 hover:bg-blue-100 rounded disabled:opacity-30"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={() => {
                                    if (index < selectedSeriesIds.length - 1) {
                                      const newIds = [...selectedSeriesIds];
                                      [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
                                      updateContent('categoryIds', newIds);
                                    }
                                  }}
                                  disabled={index === selectedSeriesIds.length - 1}
                                  className="p-1 hover:bg-blue-100 rounded disabled:opacity-30"
                                >
                                  ↓
                                </button>
                                <button
                                  onClick={() => {
                                    const newIds = selectedSeriesIds.filter(id => id !== catId);
                                    updateContent('categoryIds', newIds);
                                    // Also remove custom image if exists
                                    if (seriesImages[catId]) {
                                      const newImages = { ...seriesImages };
                                      delete newImages[catId];
                                      updateContent('categoryImages', newImages);
                                    }
                                  }}
                                  className="p-1 hover:bg-red-100 text-red-500 rounded"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                            
                            {/* Custom Image Option */}
                            <div className="px-2 pb-2 pt-1 border-t border-blue-200/50">
                              {hasCustomImage ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    {seriesImages[catId] && (
                                      <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                        <img 
                                          src={seriesImages[catId]} 
                                          alt="" 
                                          className="w-full h-full object-cover"
                                          onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                      </div>
                                    )}
                                    <input
                                      type="text"
                                      value={seriesImages[catId] || ''}
                                      onChange={(e) => updateSeriesImage(catId, e.target.value)}
                                      placeholder="URL תמונה..."
                                      className="flex-1 px-2 py-1.5 text-[10px] border border-gray-200 rounded-md focus:border-blue-400 focus:outline-none"
                                    />
                                    <button
                                      onClick={() => updateSeriesImage(catId, '')}
                                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                      title="הסר תמונה מותאמת"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => updateSeriesImage(catId, 'https://')}
                                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  תמונה מותאמת
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Available Categories */}
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    {categories
                      .filter(cat => !selectedSeriesIds.includes(cat.id))
                      .map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            updateContent('categoryIds', [...selectedSeriesIds, cat.id]);
                          }}
                          className="w-full text-right px-3 py-2 text-xs hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          + {cat.name}
                        </button>
                      ))}
                    {categories.filter(cat => !selectedSeriesIds.includes(cat.id)).length === 0 && (
                      <div className="px-3 py-2 text-xs text-gray-400 text-center">
                        כל הקטגוריות נבחרו
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {seriesSelectionMode === 'all' && (
                <EditorSlider
                  label="כמות להצגה"
                  value={(content.displayLimit as number) || 4}
                  onChange={(v) => updateContent('displayLimit', v)}
                  min={1}
                  max={12}
                  suffix=""
                />
              )}
            </div>
          </MiniAccordion>
        </>
      );

    // ==========================================
    // סליידר הירו
    // ==========================================
    case 'hero_slider':
      const slides = (content.slides as Array<{
        id: string;
        title?: string;
        subtitle?: string;
        imageUrl?: string;
        mobileImageUrl?: string;
        mobileImagePosition?: string;
        videoUrl?: string;
        buttonText?: string;
        buttonLink?: string;
      }>) || [];
      
      const addSlide = () => {
        const newSlide = {
          id: `slide-${Date.now()}`,
          title: `שקופית ${slides.length + 1}`,
          subtitle: '',
          imageUrl: '',
          buttonText: '',
          buttonLink: '',
        };
        updateContent('slides', [...slides, newSlide]);
      };
      
      const updateSlide = (slideId: string, key: string, value: unknown) => {
        const updatedSlides = slides.map(slide => 
          slide.id === slideId ? { ...slide, [key]: value } : slide
        );
        updateContent('slides', updatedSlides);
      };
      
      const removeSlide = (slideId: string) => {
        if (slides.length <= 1) return;
        updateContent('slides', slides.filter(s => s.id !== slideId));
      };
      
      const moveSlide = (slideId: string, direction: 'up' | 'down') => {
        const index = slides.findIndex(s => s.id === slideId);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === slides.length - 1) return;
        
        const newSlides = [...slides];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
        updateContent('slides', newSlides);
      };
      
      return (
        <>
          {/* הגדרות סליידר */}
          <MiniAccordion title="הגדרות סליידר" defaultOpen={false}>
            <div className="space-y-3">
              <EditorToggle
                label="ניגון אוטומטי"
                value={(settings.autoplay as boolean) !== false}
                onChange={(v) => updateSettings('autoplay', v)}
              />
              
              {(settings.autoplay !== false) && (
                <EditorSlider
                  label="משך שקופית (שניות)"
                  value={((settings.autoplayInterval as number) || 5000) / 1000}
                  min={2}
                  max={15}
                  step={1}
                  suffix="s"
                  onChange={(v) => updateSettings('autoplayInterval', v * 1000)}
                />
              )}
              
              <EditorToggle
                label="לופ אינסופי"
                value={(settings.loop as boolean) !== false}
                onChange={(v) => updateSettings('loop', v)}
              />
              
              <EditorToggle
                label="הצג נקודות ניווט"
                value={(settings.showDots as boolean) !== false}
                onChange={(v) => updateSettings('showDots', v)}
              />
              
              <EditorToggle
                label="הצג חצים"
                value={(settings.showArrows as boolean) !== false}
                onChange={(v) => updateSettings('showArrows', v)}
              />
            </div>
          </MiniAccordion>
          
          {/* שקופיות */}
          <MiniAccordion title={`שקופיות (${slides.length})`} defaultOpen={true}>
            <div className="space-y-3">
              {slides.map((slide, index) => (
                <div 
                  key={slide.id}
                  className="border border-[var(--editor-border-default)] rounded-lg p-3 bg-[var(--editor-bg-tertiary)]"
                >
                  {/* Slide Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-[var(--editor-text-secondary)]">
                      שקופית {index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveSlide(slide.id, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-[var(--editor-bg-hover)] rounded disabled:opacity-30"
                        title="הזז למעלה"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 15l-6-6-6 6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveSlide(slide.id, 'down')}
                        disabled={index === slides.length - 1}
                        className="p-1 hover:bg-[var(--editor-bg-hover)] rounded disabled:opacity-30"
                        title="הזז למטה"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => removeSlide(slide.id)}
                        disabled={slides.length <= 1}
                        className="p-1 hover:bg-red-100 text-red-500 rounded disabled:opacity-30"
                        title="מחק שקופית"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Slide Content */}
                  <div className="space-y-2">
                    <EditorInput
                      label="כותרת"
                      value={slide.title || ''}
                      onChange={(v) => updateSlide(slide.id, 'title', v)}
                      placeholder="כותרת השקופית"
                    />
                    
                    <EditorInput
                      label="תת-כותרת"
                      value={slide.subtitle || ''}
                      onChange={(v) => updateSlide(slide.id, 'subtitle', v)}
                      placeholder="תיאור קצר"
                    />
                    
                    <EditorInput
                      label="תמונת רקע"
                      value={slide.imageUrl || ''}
                      onChange={(v) => updateSlide(slide.id, 'imageUrl', v)}
                      placeholder="https://..."
                    />
                    
                    <EditorInput
                      label="תמונה למובייל"
                      value={slide.mobileImageUrl || ''}
                      onChange={(v) => updateSlide(slide.id, 'mobileImageUrl', v)}
                      placeholder="אופציונלי - תמונה אחרת למובייל"
                    />
                    
                    <EditorSelect
                      label="מיקום תמונה (מובייל)"
                      value={(slide.mobileImagePosition as string) || 'center'}
                      options={[
                        { value: 'right', label: 'ימין' },
                        { value: 'center', label: 'מרכז' },
                        { value: 'left', label: 'שמאל' },
                      ]}
                      onChange={(v) => updateSlide(slide.id, 'mobileImagePosition', v)}
                    />
                    
                    <EditorInput
                      label="וידאו רקע"
                      value={slide.videoUrl || ''}
                      onChange={(v) => updateSlide(slide.id, 'videoUrl', v)}
                      placeholder="https://...mp4"
                    />
                    
                    <div className="pt-2 border-t border-[var(--editor-border-default)]">
                      <EditorInput
                        label="טקסט כפתור"
                        value={slide.buttonText || ''}
                        onChange={(v) => updateSlide(slide.id, 'buttonText', v)}
                        placeholder="לחנות"
                      />
                      
                      <EditorInput
                        label="קישור כפתור"
                        value={slide.buttonLink || ''}
                        onChange={(v) => updateSlide(slide.id, 'buttonLink', v)}
                        placeholder="/products"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add Slide Button */}
              <button
                onClick={addSlide}
                className="w-full py-2 border-2 border-dashed border-[var(--editor-border-default)] rounded-lg text-sm text-[var(--editor-text-secondary)] hover:border-[var(--editor-accent)] hover:text-[var(--editor-accent)] transition-colors"
              >
                + הוסף שקופית
              </button>
            </div>
          </MiniAccordion>
        </>
      );

    // ==========================================
    // HTML מותאם אישית
    // ==========================================
    case 'custom':
      return (
        <MiniAccordion title="קוד HTML" defaultOpen={true}>
          <div className="space-y-3">
            <textarea
              value={(content.html as string) || ''}
              onChange={(e) => updateContent('html', e.target.value)}
              placeholder="<div>הזן קוד HTML כאן...</div>"
              className="w-full h-48 p-3 text-sm font-mono bg-[var(--editor-bg-tertiary)] border border-[var(--editor-border-default)] rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-[var(--editor-accent)]"
              dir="ltr"
            />
            <p className="text-[11px] text-[var(--editor-text-muted)]">
              הזן קוד HTML מותאם אישית. הקוד יוצג כפי שהוא.
            </p>
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

