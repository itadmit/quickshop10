'use client';

import { useState, useMemo } from 'react';
import { 
  Image, 
  Video, 
  LayoutGrid, 
  FileText, 
  Sparkles, 
  HelpCircle, 
  Tag, 
  ShoppingBag, 
  Star, 
  Images, 
  Building2, 
  Mail, 
  Code,
  Megaphone,
  Phone,
  Users,
  Layers,
  Quote,
  Grid3X3,
  Crown
} from 'lucide-react';

// ============================================
// Section Tree - Left Panel (Shopify Style) - עברית
// ============================================

interface Section {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  isActive: boolean;
  sortOrder: number;
  settings?: {
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
    [key: string]: unknown;
  };
}

interface SectionTreeProps {
  sections: Section[];
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
  onAddSection: (type: string, zone?: string) => void;
  onRemoveSection: (id: string) => void;
  onReorderSections: (fromIndex: number, toIndex: number) => void;
  onApplyTemplate?: (templateId: string) => void;
  headerLayout?: 'logo-right' | 'logo-left' | 'logo-center';
  currentPage?: string;
}

// Page labels
const PAGE_LABELS: Record<string, string> = {
  home: 'דף הבית',
  product: 'עמוד מוצר',
  category: 'עמוד קטגוריה',
  coming_soon: 'Coming Soon',
};

// Icon component type for section types
type SectionIconComponent = React.ComponentType<{ className?: string }>;

// Section types for home page
const sectionTypes: Array<{ type: string; label: string; icon: SectionIconComponent; category: string }> = [
  // באנרים
  { type: 'hero', label: 'באנר ראשי', icon: Image, category: 'באנרים' },
  { type: 'hero_premium', label: 'באנר פרימיום', icon: Crown, category: 'באנרים' },
  { type: 'hero_slider', label: 'סליידר הירו', icon: Layers, category: 'באנרים' },
  { type: 'video_banner', label: 'באנר וידאו', icon: Video, category: 'באנרים' },
  { type: 'split_banner', label: 'באנר מפוצל', icon: LayoutGrid, category: 'באנרים' },
  { type: 'banner_small', label: 'באנר קטן', icon: Megaphone, category: 'באנרים' },
  { type: 'quote_banner', label: 'באנר ציטוט', icon: Quote, category: 'באנרים' },
  // תוכן
  { type: 'image_text', label: 'תמונה + טקסט', icon: Image, category: 'תוכן' },
  { type: 'text_block', label: 'בלוק טקסט', icon: FileText, category: 'תוכן' },
  { type: 'features', label: 'חוזקות', icon: Sparkles, category: 'תוכן' },
  { type: 'faq', label: 'שאלות נפוצות', icon: HelpCircle, category: 'תוכן' },
  // קטלוג
  { type: 'categories', label: 'קטגוריות', icon: Tag, category: 'קטלוג' },
  { type: 'products', label: 'מוצרים', icon: ShoppingBag, category: 'קטלוג' },
  { type: 'series_grid', label: 'גריד סדרות', icon: Grid3X3, category: 'קטלוג' },
  // סושיאל והמלצות
  { type: 'reviews', label: 'ביקורות', icon: Star, category: 'סושיאל' },
  { type: 'gallery', label: 'גלריה', icon: Images, category: 'סושיאל' },
  { type: 'logos', label: 'לוגואים', icon: Building2, category: 'סושיאל' },
  { type: 'featured_items', label: 'פריטים מובילים', icon: Users, category: 'סושיאל' },
  // אחר
  { type: 'newsletter', label: 'ניוזלטר', icon: Mail, category: 'אחר' },
  { type: 'contact', label: 'יצירת קשר', icon: Phone, category: 'אחר' },
  { type: 'custom', label: 'מותאם אישית', icon: Code, category: 'אחר' },
];

// Section types for PRODUCT PAGE - fully editable sections
const productSectionTypes: Array<{ type: string; label: string; icon: SectionIconComponent; category: string }> = [
  // פריסה
  { type: 'breadcrumb', label: 'פירורי לחם', icon: Tag, category: 'פריסה' },
  { type: 'divider', label: 'קו מפריד', icon: Code, category: 'פריסה' },
  { type: 'spacer', label: 'רווח', icon: Code, category: 'פריסה' },
  // מוצר - סקשנים ייעודיים
  { type: 'product_gallery', label: 'גלריה', icon: Images, category: 'מוצר' },
  { type: 'product_badges', label: 'מדבקות מבצעים', icon: Tag, category: 'מוצר' },
  { type: 'product_title', label: 'שם מוצר', icon: FileText, category: 'מוצר' },
  { type: 'product_price', label: 'מחירים', icon: ShoppingBag, category: 'מוצר' },
  { type: 'product_short_desc', label: 'תיאור קצר', icon: FileText, category: 'מוצר' },
  { type: 'product_inventory', label: 'חיווי מלאי', icon: ShoppingBag, category: 'מוצר' },
  { type: 'product_add_to_cart', label: 'כפתור הוספה לסל', icon: ShoppingBag, category: 'מוצר' },
  { type: 'product_description', label: 'תיאור מוצר', icon: FileText, category: 'מוצר' },
  { type: 'product_reviews', label: 'ביקורות', icon: Star, category: 'מוצר' },
  { type: 'product_related', label: 'אולי יעניין אותך', icon: Grid3X3, category: 'מוצר' },
  { type: 'product_upsells', label: 'מוצרי אפסייל', icon: ShoppingBag, category: 'מוצר' },
  // תוכן (עם תמיכה בתוכן דינמי {{product.x}})
  { type: 'text_block', label: 'בלוק טקסט', icon: FileText, category: 'תוכן' },
  { type: 'accordion', label: 'אקורדיון', icon: Layers, category: 'תוכן' },
  { type: 'tabs', label: 'לשוניות', icon: LayoutGrid, category: 'תוכן' },
  { type: 'features', label: 'חוזקות', icon: Sparkles, category: 'תוכן' },
  { type: 'image_text', label: 'תמונה + טקסט', icon: Image, category: 'תוכן' },
  { type: 'video', label: 'וידאו', icon: Video, category: 'תוכן' },
];

// Get label for product page sections
const getProductSectionLabel = (type: string): string => {
  return productSectionTypes.find(s => s.type === type)?.label || type;
};

// Get icon name for product page sections
const getProductSectionIcon = (type: string): string => {
  const icons: Record<string, string> = {
    // פריסה
    breadcrumb: 'breadcrumb',
    divider: 'divider',
    spacer: 'spacer',
    // מוצר
    product_gallery: 'gallery',
    product_badges: 'badge',
    product_title: 'text',
    product_price: 'price',
    product_short_desc: 'description',
    product_inventory: 'inventory',
    product_add_to_cart: 'cart',
    product_description: 'description',
    product_reviews: 'reviews',
    product_related: 'related',
    product_upsells: 'upsell',
    // Legacy
    product_info: 'product-info',
    // תוכן
    text_block: 'text',
    accordion: 'accordion',
    tabs: 'tabs',
    features: 'features',
    image_text: 'image',
    video: 'video',
  };
  return icons[type] || 'section';
};

export function SectionTree({
  sections,
  selectedSectionId,
  onSelectSection,
  onAddSection,
  onRemoveSection,
  onReorderSections,
  onApplyTemplate,
  headerLayout,
  currentPage = 'home',
}: SectionTreeProps) {
  const pageLabel = PAGE_LABELS[currentPage] || currentPage;
  const isComingSoon = currentPage === 'coming_soon';
  const isProductPage = currentPage === 'product';
  const isCategoryPage = currentPage === 'category';
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [addToZone, setAddToZone] = useState<'info' | 'content' | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Sort sections by sortOrder for display
  const sortedSections = useMemo(() => 
    [...sections].sort((a, b) => a.sortOrder - b.sortOrder),
    [sections]
  );

  const toggleExpand = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [draggedZone, setDraggedZone] = useState<string | null>(null);
  
  const handleDragStart = (index: number, zone?: string) => {
    setDraggedIndex(index);
    setDraggedZone(zone || null);
    setDropTargetIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number, zone?: string) => {
    e.preventDefault();
    // Only allow drop in same zone (for product page)
    if (draggedZone && zone && draggedZone !== zone) {
      return; // Don't allow cross-zone drops
    }
    // Only update visual indicator, don't reorder yet
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDragEnd = () => {
    // Perform reorder only on drop
    if (draggedIndex !== null && dropTargetIndex !== null && draggedIndex !== dropTargetIndex) {
      // Simply swap the sortOrder values of the two sections
      // This is simpler and works correctly for zone-based ordering
      const fromSection = sortedSections[draggedIndex];
      const toSection = sortedSections[dropTargetIndex];
      
      if (fromSection && toSection) {
        // Swap sortOrder values
        onReorderSections(fromSection.sortOrder, toSection.sortOrder);
      }
    }
    setDraggedIndex(null);
    setDropTargetIndex(null);
    setDraggedZone(null);
  };
  
  const handleDragLeave = () => {
    // Clear drop target when leaving
  };

  const getSectionLabel = (type: string): string => {
    return sectionTypes.find(s => s.type === type)?.label || type;
  };

  const getSectionIcon = (type: string): string => {
    const icons: Record<string, string> = {
      hero: 'slideshow',
      categories: 'collection',
      products: 'products',
      video_banner: 'video',
      split_banner: 'image',
      newsletter: 'email',
      custom: 'code',
    };
    return icons[type] || 'section';
  };

  // ============================================
  // PRODUCT PAGE V2 - Fully Editable Like Home Page
  // Sections are stored in stores.productPageSections JSON
  // ============================================
  if (isProductPage) {
    return (
      <div className="flex flex-col h-full" dir="rtl">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-medium text-gray-900">{pageLabel}</h2>
            {/* Template Picker Button */}
            {onApplyTemplate && (
              <button
                onClick={() => setShowTemplateMenu(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Layers className="w-3.5 h-3.5" />
                תבניות
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">גרור לסידור מחדש • לחץ + להוספה</p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto">
          {/* Header Section (Global - not part of sections) */}
          <div className="border-b border-gray-100">
            <div className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
              כותרת עליונה
            </div>
            <SectionItem
              icon="header"
              label="פס הודעות"
              isSelected={selectedSectionId === 'announcement-bar'}
              onClick={() => onSelectSection('announcement-bar')}
            />
            <SectionItem
              icon="header"
              label="הדר"
              isSelected={selectedSectionId === 'header'}
              onClick={() => onSelectSection('header')}
              hasChildren
              isExpanded={expandedSections.has('header')}
              onToggle={() => toggleExpand('header')}
            />
            {expandedSections.has('header') && (
              <div className="bg-gray-50 border-y border-gray-100 py-2 px-4">
                <span className="text-xs text-gray-500">
                  פריסה: {headerLayout === 'logo-left' ? 'לוגו בשמאל' : 
                           headerLayout === 'logo-center' ? 'לוגו במרכז' : 'לוגו בימין'}
                </span>
              </div>
            )}
          </div>
          
          {/* Product Page Layout Zones */}
          {(() => {
            // Define section zones
            const topTypes = ['breadcrumb']; // ראש תוכן - פירורי לחם
            const galleryTypes = ['product_gallery'];
            // אזור מידע מוצר - משמאל לגלריה (כולל תיאור וחוזקות!)
            const infoTypes = ['product_badges', 'product_title', 'product_price', 'product_short_desc', 'product_inventory', 'product_add_to_cart', 'product_description', 'features', 'accordion', 'tabs'];
            // אזור תוכן - מתחת לגלריה+מידע
            const contentTypes = ['text_block', 'image_text', 'video', 'divider', 'spacer', 'product_reviews', 'product_related', 'product_upsells'];
            
            const topSections = sortedSections.filter(s => topTypes.includes(s.type));
            const gallerySections = sortedSections.filter(s => galleryTypes.includes(s.type));
            const infoSections = sortedSections.filter(s => infoTypes.includes(s.type));
            const contentSections = sortedSections.filter(s => contentTypes.includes(s.type));
            
            return (
              <>
                {/* Top Zone - Breadcrumb */}
                <div className="border-b border-gray-100">
                  <div className="p-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-amber-100 rounded flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                        <path d="M3 12h18M3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4"/>
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-700">ראש תוכן</span>
                      <span className="text-[10px] text-gray-400 block">פירורי לחם, ניווט</span>
                    </div>
                  </div>
                  {topSections.map((section) => {
                    const globalIndex = sortedSections.findIndex(s => s.id === section.id);
                    return (
                      <div
                        key={section.id}
                        draggable
                        onDragStart={() => handleDragStart(globalIndex, 'top')}
                        onDragOver={(e) => handleDragOver(e, globalIndex, 'top')}
                        onDragEnd={handleDragEnd}
                        className={`${draggedIndex === globalIndex ? 'opacity-50' : ''} ${dropTargetIndex === globalIndex && draggedZone === 'top' ? 'border-t-2 border-amber-500' : ''}`}
                      >
                        <SectionItem
                          icon={getProductSectionIcon(section.type)}
                          label={section.title || getProductSectionLabel(section.type)}
                          isSelected={selectedSectionId === section.id}
                          onClick={() => onSelectSection(section.id)}
                          isDisabled={!section.isActive}
                          hideOnMobile={section.settings?.hideOnMobile}
                          hideOnDesktop={section.settings?.hideOnDesktop}
                        />
                      </div>
                    );
                  })}
                  {topSections.length === 0 && (
                    <div className="px-4 py-2 text-xs text-gray-400 italic">אין פירורי לחם</div>
                  )}
                </div>

                {/* Gallery Zone - Right Side */}
                <div className="border-b border-gray-100">
                  <div className="p-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-700">אזור גלריה</span>
                      <span className="text-[10px] text-gray-400 block">צד ימין</span>
                    </div>
                  </div>
                  {gallerySections.map((section) => {
                    const globalIndex = sortedSections.findIndex(s => s.id === section.id);
                    return (
                      <div
                        key={section.id}
                        draggable
                        onDragStart={() => handleDragStart(globalIndex, 'gallery')}
                        onDragOver={(e) => handleDragOver(e, globalIndex, 'gallery')}
                        onDragEnd={handleDragEnd}
                        className={`${draggedIndex === globalIndex ? 'opacity-50' : ''} ${dropTargetIndex === globalIndex && draggedZone === 'gallery' ? 'border-t-2 border-purple-500' : ''}`}
                      >
                        <SectionItem
                          icon={getProductSectionIcon(section.type)}
                          label={section.title || getProductSectionLabel(section.type)}
                          isSelected={selectedSectionId === section.id}
                          onClick={() => onSelectSection(section.id)}
                          isDisabled={!section.isActive}
                          hideOnMobile={section.settings?.hideOnMobile}
                          hideOnDesktop={section.settings?.hideOnDesktop}
                        />
                      </div>
                    );
                  })}
                  {gallerySections.length === 0 && (
                    <div className="px-4 py-2 text-xs text-gray-400 italic">לא הוגדרה גלריה</div>
                  )}
                </div>

                {/* Info Zone - Left Side of Gallery */}
                <div className="border-b border-gray-100">
                  <div className="p-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                        <path d="M4 4h16v16H4z"/>
                        <path d="M4 4v16"/>
                        <path d="M12 4v16"/>
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-700">אזור מידע מוצר</span>
                      <span className="text-[10px] text-gray-400 block">משמאל לגלריה • שם, מחיר, תיאור, חוזקות</span>
                    </div>
                  </div>
                  {infoSections.map((section) => {
                    const globalIndex = sortedSections.findIndex(s => s.id === section.id);
                    return (
                      <div
                        key={section.id}
                        draggable
                        onDragStart={() => handleDragStart(globalIndex, 'info')}
                        onDragOver={(e) => handleDragOver(e, globalIndex, 'info')}
                        onDragEnd={handleDragEnd}
                        className={`${draggedIndex === globalIndex ? 'opacity-50' : ''} ${dropTargetIndex === globalIndex && draggedZone === 'info' ? 'border-t-2 border-blue-500' : ''}`}
                      >
                        <SectionItem
                          icon={getProductSectionIcon(section.type)}
                          label={section.title || getProductSectionLabel(section.type)}
                          isSelected={selectedSectionId === section.id}
                          onClick={() => onSelectSection(section.id)}
                          isDisabled={!section.isActive}
                          hideOnMobile={section.settings?.hideOnMobile}
                          hideOnDesktop={section.settings?.hideOnDesktop}
                        />
                      </div>
                    );
                  })}
                  {infoSections.length === 0 && (
                    <div className="px-4 py-2 text-xs text-gray-400 italic">לא הוגדרו שדות מידע</div>
                  )}
                  <AddSectionButton 
                    onClick={() => {
                      setAddToZone('info');
                      setShowAddMenu(true);
                    }}
                    label="הוסף לאזור מידע"
                  />
                </div>

                {/* Content Zone - Below Gallery+Info */}
                <div className="border-b border-gray-100">
                  <div className="p-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                        <rect x="3" y="3" width="18" height="7" rx="1"/>
                        <rect x="3" y="14" width="18" height="7" rx="1"/>
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-700">אזור תוכן</span>
                      <span className="text-[10px] text-gray-400 block">מתחת לגלריה • ביקורות, מוצרים קשורים</span>
                    </div>
                  </div>
                  {contentSections.map((section) => {
                    const globalIndex = sortedSections.findIndex(s => s.id === section.id);
                    return (
                      <div
                        key={section.id}
                        draggable
                        onDragStart={() => handleDragStart(globalIndex, 'content')}
                        onDragOver={(e) => handleDragOver(e, globalIndex, 'content')}
                        onDragEnd={handleDragEnd}
                        className={`${draggedIndex === globalIndex ? 'opacity-50' : ''} ${dropTargetIndex === globalIndex && draggedZone === 'content' ? 'border-t-2 border-green-500' : ''}`}
                      >
                        <SectionItem
                          icon={getProductSectionIcon(section.type)}
                          label={section.title || getProductSectionLabel(section.type)}
                          isSelected={selectedSectionId === section.id}
                          onClick={() => onSelectSection(section.id)}
                          isDisabled={!section.isActive}
                          hideOnMobile={section.settings?.hideOnMobile}
                          hideOnDesktop={section.settings?.hideOnDesktop}
                        />
                      </div>
                    );
                  })}
                  {contentSections.length === 0 && (
                    <div className="px-4 py-2 text-xs text-gray-400 italic">לא הוגדר תוכן נוסף</div>
                  )}
                  <AddSectionButton 
                    onClick={() => {
                      setAddToZone('content');
                      setShowAddMenu(true);
                    }}
                    label="הוסף לאזור תוכן"
                  />
                </div>
              </>
            );
          })()}

          {/* Footer Section (Global - not part of sections) */}
          <div>
            <div className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
              פוטר
            </div>
            <SectionItem
              icon="footer"
              label="פוטר"
              isSelected={selectedSectionId === 'footer'}
              onClick={() => onSelectSection('footer')}
              hasChildren
              isExpanded={expandedSections.has('footer')}
              onToggle={() => toggleExpand('footer')}
            />
            {expandedSections.has('footer') && (
              <div className="bg-gray-50 border-y border-gray-100 py-2 px-4">
                <span className="text-xs text-gray-500">
                  לוגו • ניוזלטר • רשתות חברתיות
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Add Section Modal - Product Page specific types */}
        {showAddMenu && (
          <AddSectionModal
            onClose={() => {
              setShowAddMenu(false);
              setAddToZone(null);
            }}
            onAdd={(type) => {
              // Pass zone info to determine correct sortOrder
              onAddSection(type, addToZone || undefined);
              setShowAddMenu(false);
              setAddToZone(null);
            }}
            sectionTypes={productSectionTypes}
            currentZone={addToZone}
          />
        )}

        {/* Template Picker Modal */}
        {showTemplateMenu && onApplyTemplate && (
          <ProductTemplatePickerModal
            onClose={() => setShowTemplateMenu(false)}
            onSelect={(templateId) => {
              onApplyTemplate(templateId);
              setShowTemplateMenu(false);
            }}
          />
        )}
      </div>
    );
  }

  // Special UI for Category Page
  if (isCategoryPage) {
    const categoryPageSections = [
      { id: 'cp-banner', icon: 'hero', label: 'באנר קטגוריה', category: 'main' },
      { id: 'cp-breadcrumb', icon: 'breadcrumb', label: 'ניווט (Breadcrumb)', category: 'main' },
      { id: 'cp-subcategories', icon: 'categories', label: 'תתי קטגוריות', category: 'main' },
      { id: 'cp-products', icon: 'products', label: 'רשת מוצרים', category: 'main' },
    ];

    return (
      <div className="flex flex-col h-full" dir="rtl">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900">{pageLabel}</h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto">
          {/* Header Section */}
          <div className="border-b border-gray-100">
            <div className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
              כותרת עליונה
            </div>
            <SectionItem
              icon="header"
              label="פס הודעות"
              isSelected={selectedSectionId === 'announcement-bar'}
              onClick={() => onSelectSection('announcement-bar')}
            />
            <SectionItem
              icon="header"
              label="הדר"
              isSelected={selectedSectionId === 'header'}
              onClick={() => onSelectSection('header')}
              hasChildren
              isExpanded={expandedSections.has('header')}
              onToggle={() => toggleExpand('header')}
            />
            {expandedSections.has('header') && (
              <div className="bg-gray-50 border-y border-gray-100 py-2 px-4">
                <span className="text-xs text-gray-500">
                  פריסה: {headerLayout === 'logo-left' ? 'לוגו בשמאל' : 
                           headerLayout === 'logo-center' ? 'לוגו במרכז' : 'לוגו בימין'}
                </span>
              </div>
            )}
          </div>
          
          {/* Main Content Sections */}
          <div className="border-b border-gray-100">
            <div className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
              תוכן קטגוריה
            </div>
            
            {categoryPageSections.map((section) => (
              <SectionItem
                key={section.id}
                icon={section.icon}
                label={section.label}
                isSelected={selectedSectionId === section.id}
                onClick={() => onSelectSection(section.id)}
              />
            ))}
          </div>

          {/* Footer Section */}
          <div>
            <div className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
              פוטר
            </div>
            <SectionItem
              icon="footer"
              label="פוטר"
              isSelected={selectedSectionId === 'footer'}
              onClick={() => onSelectSection('footer')}
              hasChildren
              isExpanded={expandedSections.has('footer')}
              onToggle={() => toggleExpand('footer')}
            />
            {expandedSections.has('footer') && (
              <div className="bg-gray-50 border-y border-gray-100 py-2 px-4">
                <span className="text-xs text-gray-500">
                  לוגו • ניוזלטר • רשתות חברתיות
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-900">{pageLabel}</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        {/* Header Section - only for home page */}
        {!isComingSoon && (
          <div className="border-b border-gray-100">
            <div className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
              כותרת עליונה
            </div>
            <SectionItem
              icon="header"
              label="פס הודעות"
              isSelected={selectedSectionId === 'announcement-bar'}
              onClick={() => onSelectSection('announcement-bar')}
            />
            <SectionItem
              icon="header"
              label="הדר"
              isSelected={selectedSectionId === 'header'}
              onClick={() => onSelectSection('header')}
              hasChildren
              isExpanded={expandedSections.has('header')}
              onToggle={() => toggleExpand('header')}
            />
            {/* Header layout preview when expanded */}
            {expandedSections.has('header') && (
              <div className="bg-gray-50 border-y border-gray-100 py-2 px-4">
                <span className="text-xs text-gray-500">
                  פריסה: {headerLayout === 'logo-left' ? 'לוגו בשמאל' : 
                           headerLayout === 'logo-center' ? 'לוגו במרכז' : 'לוגו בימין'}
                </span>
              </div>
            )}
            <AddSectionButton onClick={() => setShowAddMenu(true)} small />
          </div>
        )}

        {/* Template Sections */}
        <div className="border-b border-gray-100">
          <div className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
            {isComingSoon ? 'סקשנים' : 'תבנית'}
          </div>
          
          {/* Empty state for Coming Soon */}
          {sections.length === 0 && isComingSoon && (
            <div className="px-4 py-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 mb-1">אין עדיין סקשנים</p>
              <p className="text-xs text-gray-400">לחץ על &quot;הוסף סקשן&quot; כדי להתחיל</p>
            </div>
          )}
          
          {sortedSections.map((section, index) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDragLeave={handleDragLeave}
              className={`${draggedIndex === index ? 'opacity-50' : ''} ${dropTargetIndex === index ? 'border-t-2 border-blue-500' : ''}`}
            >
              <SectionItem
                icon={getSectionIcon(section.type)}
                label={section.title || getSectionLabel(section.type)}
                isSelected={selectedSectionId === section.id}
                onClick={() => onSelectSection(section.id)}
                isExpanded={expandedSections.has(section.id)}
                onToggle={() => toggleExpand(section.id)}
                hasChildren={section.type === 'categories' || section.type === 'products'}
                isDisabled={!section.isActive}
                hideOnMobile={section.settings?.hideOnMobile}
                hideOnDesktop={section.settings?.hideOnDesktop}
              />
              
              {/* Expanded children */}
              {expandedSections.has(section.id) && section.type === 'categories' && (
                <div className="bg-gray-50 border-y border-gray-100">
                  <SubItem label="הוסף בלוק" isAdd />
                  <SubItem label="קטגוריה – נשים" />
                  <SubItem label="קטגוריה – גברים" />
                  <SubItem label="קטגוריה – אקססוריז" />
                </div>
              )}
            </div>
          ))}
          
          <AddSectionButton 
            onClick={() => setShowAddMenu(true)} 
          />
        </div>

        {/* Footer Section - only for home page */}
        {!isComingSoon && (
          <div>
            <div className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
              פוטר
            </div>
            <SectionItem
              icon="footer"
              label="פוטר"
              isSelected={selectedSectionId === 'footer'}
              onClick={() => onSelectSection('footer')}
              hasChildren
              isExpanded={expandedSections.has('footer')}
              onToggle={() => toggleExpand('footer')}
            />
            {/* Footer sub-items when expanded */}
            {expandedSections.has('footer') && (
              <div className="bg-gray-50 border-y border-gray-100 py-2 px-4">
                <span className="text-xs text-gray-500">
                  לוגו • ניוזלטר • רשתות חברתיות
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Section Modal */}
      {showAddMenu && (
        <AddSectionModal
          onClose={() => setShowAddMenu(false)}
          onAdd={(type) => {
            onAddSection(type);
            setShowAddMenu(false);
          }}
        />
      )}
    </div>
  );
}


// Section Item Component
function SectionItem({
  icon,
  label,
  isSelected,
  onClick,
  isExpanded,
  onToggle,
  hasChildren,
  isDisabled,
  hideOnMobile,
  hideOnDesktop,
}: {
  icon: string;
  label: string;
  isSelected: boolean;
  onClick: () => void;
  isExpanded?: boolean;
  onToggle?: () => void;
  hasChildren?: boolean;
  isDisabled?: boolean;
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
}) {
  return (
    <div
      className={`
        flex items-center gap-1.5 px-2 py-2 cursor-pointer transition-colors group
        ${isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-50'}
        ${isDisabled ? 'opacity-50' : ''}
      `}
      onClick={onClick}
    >
      {/* Drag Handle - always visible, on the left (end in RTL) */}
      <div className="order-last cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 mr-auto">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="8" cy="6" r="2"/>
          <circle cx="16" cy="6" r="2"/>
          <circle cx="8" cy="12" r="2"/>
          <circle cx="16" cy="12" r="2"/>
          <circle cx="8" cy="18" r="2"/>
          <circle cx="16" cy="18" r="2"/>
        </svg>
      </div>

      {/* Expand Toggle */}
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className="p-0.5 hover:bg-gray-200 rounded"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      ) : (
        <div className="w-[14px]" />
      )}

      {/* Icon */}
      <SectionIcon type={icon} />

      {/* Label */}
      <span className={`text-sm flex-1 truncate ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
        {label}
      </span>

      {/* Visibility badges */}
      <div className="flex items-center gap-1">
        {hideOnMobile && (
          <span className="px-1 py-0.5 text-[9px] bg-orange-100 text-orange-700 rounded" title="מוסתר במובייל">
            📱
          </span>
        )}
        {hideOnDesktop && (
          <span className="px-1 py-0.5 text-[9px] bg-purple-100 text-purple-700 rounded" title="מוסתר במחשב">
            🖥️
          </span>
        )}
      </div>

      {/* Disabled indicator */}
      {isDisabled && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
          <path d="M17 17l-5-5m0 0l-5-5m5 5l5-5m-5 5l-5 5" />
        </svg>
      )}
    </div>
  );
}

// Sub Item Component (for expanded sections)
function SubItem({ label, isAdd }: { label: string; isAdd?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 pr-10 cursor-pointer hover:bg-gray-100 transition-colors">
      {isAdd ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          <span className="text-xs text-blue-500">{label}</span>
        </>
      ) : (
        <>
          <div className="w-3 h-3 rounded bg-gray-300" />
          <span className="text-xs text-gray-600">{label}</span>
        </>
      )}
    </div>
  );
}

// Add Section Button
function AddSectionButton({ onClick, small, label }: { onClick: () => void; small?: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-2 px-3 text-blue-500 hover:bg-blue-50 transition-colors
        ${small ? 'py-1.5' : 'py-2'}
      `}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8M8 12h8" />
      </svg>
      <span className="text-sm">{label || 'הוסף סקשן'}</span>
    </button>
  );
}

// Add Section Popover (attached to sidebar)
// Now accepts custom sectionTypes for product page support
function AddSectionModal({
  onClose,
  onAdd,
  sectionTypes: customSectionTypes,
  currentZone,
}: {
  onClose: () => void;
  onAdd: (type: string) => void;
  sectionTypes?: typeof sectionTypes; // Optional - use default if not provided
  currentZone?: 'info' | 'content' | null;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Define zone-specific section types for product page
  // accordion and tabs can be added to both zones
  const infoZoneTypes = ['product_badges', 'product_title', 'product_price', 'product_short_desc', 'product_inventory', 'product_add_to_cart', 'product_description', 'features', 'accordion', 'tabs'];
  const contentZoneTypes = ['accordion', 'tabs', 'text_block', 'image_text', 'video', 'divider', 'spacer', 'product_reviews', 'product_related', 'product_upsells'];

  // Use custom section types if provided, otherwise use default
  let availableSectionTypes = customSectionTypes || sectionTypes;
  
  // Filter by zone if specified
  if (currentZone === 'info') {
    availableSectionTypes = availableSectionTypes.filter(s => infoZoneTypes.includes(s.type));
  } else if (currentZone === 'content') {
    availableSectionTypes = availableSectionTypes.filter(s => contentZoneTypes.includes(s.type));
  }

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(availableSectionTypes.map(s => s.category).filter(Boolean)))];

  // Filter sections
  const filteredSections = availableSectionTypes.filter((section) => {
    const matchesSearch = 
      section.label.includes(searchTerm) ||
      section.type.includes(searchTerm);
    const matchesCategory = 
      selectedCategory === 'all' || 
      section.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group filtered sections by category
  const groupedSections = filteredSections.reduce((acc, section) => {
    const cat = section.category || 'אחר';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(section);
    return acc;
  }, {} as Record<string, typeof availableSectionTypes>);

  return (
    <>
      {/* Invisible click-outside backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Popover Panel - attached to sidebar, below header */}
      <div 
        className="fixed right-[240px] top-[56px] bottom-0 w-[320px] bg-white shadow-xl z-50 flex flex-col border-l border-gray-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900 text-sm">הוסף סקשן</h3>
            <button 
              onClick={onClose} 
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש סקשנים..."
              className="w-full pr-8 pl-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-3 py-2 border-b border-gray-100 flex gap-1 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'הכל' : category}
            </button>
          ))}
        </div>

        {/* Sections List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredSections.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-2 text-gray-300">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <p className="text-xs">לא נמצאו סקשנים</p>
            </div>
          ) : selectedCategory === 'all' ? (
            // Grouped view when "all" is selected
            Object.entries(groupedSections).map(([category, sections]) => (
              <div key={category} className="mb-3">
                <div className="text-xs font-medium text-gray-400 mb-1.5 px-1">
                  {category}
                </div>
                <div className="space-y-1">
                  {sections.map((section) => (
                    <SectionTypeButton
                      key={section.type}
                      section={section}
                      onAdd={onAdd}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Flat list when specific category is selected
            <div className="space-y-1">
              {filteredSections.map((section) => (
                <SectionTypeButton
                  key={section.type}
                  section={section}
                  onAdd={onAdd}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Section Type Button for the Add Panel
function SectionTypeButton({
  section,
  onAdd,
}: {
  section: { type: string; label: string; icon: SectionIconComponent };
  onAdd: (type: string) => void;
}) {
  const IconComponent = section.icon;
  
  return (
    <button
      onClick={() => onAdd(section.type)}
      className="w-full flex items-center gap-2.5 p-2 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-right group"
    >
      <div className="w-8 h-8 rounded bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
        <IconComponent className="w-4 h-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-700 group-hover:text-gray-900 truncate">
          {section.label}
        </div>
      </div>
      <svg 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        className="text-gray-300 group-hover:text-gray-500 transition-colors"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}

// Section Icon Component
function SectionIcon({ type }: { type: string }) {
  const iconClasses = "w-5 h-5 text-gray-400";
  
  switch (type) {
    case 'slideshow':
    case 'hero':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 9h6v6H9z" />
        </svg>
      );
    case 'collection':
    case 'categories':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case 'products':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case 'video':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="5,3 19,12 5,21" />
        </svg>
      );
    case 'image':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      );
    case 'email':
    case 'newsletter':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 6l-10 7L2 6" />
        </svg>
      );
    case 'header':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="5" rx="1" />
          <path d="M3 12h18M3 17h12" />
        </svg>
      );
    case 'footer':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="16" width="18" height="5" rx="1" />
          <path d="M3 7h18M3 12h12" />
        </svg>
      );
    // Product Page Section Icons
    case 'breadcrumb':
    case 'navigation':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h4l3 9l4-18l3 9h4" />
        </svg>
      );
    case 'gallery':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      );
    case 'product-info':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      );
    case 'features':
    case 'strengths':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case 'description':
    case 'text':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      );
    case 'reviews':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'related':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case 'badge':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" />
        </svg>
      );
    case 'price':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case 'inventory':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case 'cart':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      );
    case 'upsell':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      );
    case 'accordion':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="4" rx="1" />
          <rect x="3" y="10" width="18" height="4" rx="1" />
          <rect x="3" y="17" width="18" height="4" rx="1" />
        </svg>
      );
    case 'tabs':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="8" width="18" height="13" rx="2" />
          <path d="M7 3h10a2 2 0 0 1 2 2v3H5V5a2 2 0 0 1 2-2z" />
        </svg>
      );
    case 'divider':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12h16" />
        </svg>
      );
    case 'spacer':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeDasharray="2 2" />
        </svg>
      );
    case 'settings':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 'eye':
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    default:
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      );
  }
}

// ============================================
// Product Template Picker Modal
// ============================================

import { productPageTemplates } from '@/lib/product-page-sections';

interface ProductTemplatePickerModalProps {
  onClose: () => void;
  onSelect: (templateId: string) => void;
}

function ProductTemplatePickerModal({ onClose, onSelect }: ProductTemplatePickerModalProps) {
  // Template preview icons based on their structure
  const getTemplatePreview = (templateId: string) => {
    switch (templateId) {
      case 'clean':
        return (
          <div className="w-full h-full flex gap-1 p-2">
            <div className="w-1/2 bg-gray-200 rounded" />
            <div className="w-1/2 flex flex-col gap-1">
              <div className="h-4 bg-gray-300 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="flex-1" />
              <div className="h-6 bg-blue-200 rounded" />
            </div>
          </div>
        );
      case 'detailed':
        return (
          <div className="w-full h-full flex flex-col gap-1 p-2">
            <div className="flex gap-1 flex-1">
              <div className="w-1/2 bg-gray-200 rounded" />
              <div className="w-1/2 flex flex-col gap-1">
                <div className="h-3 bg-gray-300 rounded w-3/4" />
                <div className="h-2 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
            <div className="h-3 bg-amber-100 border border-amber-200 rounded" />
            <div className="h-3 bg-amber-100 border border-amber-200 rounded" />
          </div>
        );
      case 'fashion':
        return (
          <div className="w-full h-full flex flex-col gap-1 p-2">
            <div className="flex-1 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto" />
            <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto" />
            <div className="h-5 bg-blue-200 rounded" />
          </div>
        );
      case 'tabs':
        return (
          <div className="w-full h-full flex flex-col gap-1 p-2">
            <div className="flex gap-1 flex-1">
              <div className="w-1/2 bg-gray-200 rounded" />
              <div className="w-1/2 flex flex-col gap-1">
                <div className="h-3 bg-gray-300 rounded w-3/4" />
                <div className="h-2 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
            <div className="flex gap-0.5 border-b border-gray-200 pb-1">
              <div className="h-2 w-8 bg-blue-300 rounded-t" />
              <div className="h-2 w-8 bg-gray-200 rounded-t" />
              <div className="h-2 w-8 bg-gray-200 rounded-t" />
            </div>
            <div className="h-6 bg-gray-100 rounded" />
          </div>
        );
      default:
        return (
          <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
            <Layers className="w-6 h-6 text-gray-400" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">בחר תבנית לעמוד מוצר</h2>
            <p className="text-sm text-gray-500 mt-0.5">התבנית תחליף את כל הסקשנים הקיימים</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 grid grid-cols-2 gap-4 max-h-[60vh] overflow-auto">
          {productPageTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              className="group text-right border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
            >
              {/* Preview */}
              <div className="aspect-[4/3] bg-gray-50 rounded-lg mb-3 overflow-hidden border border-gray-100 group-hover:border-blue-200 transition-colors">
                {getTemplatePreview(template.id)}
              </div>
              {/* Info */}
              <h3 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                {template.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {template.description}
              </p>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}
