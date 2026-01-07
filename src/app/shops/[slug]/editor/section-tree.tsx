'use client';

import { useState } from 'react';

// ============================================
// Section Tree - Left Panel (Shopify Style) - עברית
// ============================================

interface Section {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  isActive: boolean;
}

interface SectionTreeProps {
  sections: Section[];
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
  onAddSection: (type: string, afterSectionId?: string) => void;
  onRemoveSection: (id: string) => void;
  onReorderSections: (fromIndex: number, toIndex: number) => void;
  headerLayout?: 'logo-right' | 'logo-left' | 'logo-center';
  currentPage?: string;
}

// Page labels
const PAGE_LABELS: Record<string, string> = {
  home: 'דף הבית',
  product: 'עמוד מוצר',
  coming_soon: 'Coming Soon',
};

const sectionTypes = [
  // באנרים
  { type: 'hero', label: 'באנר ראשי', icon: '🖼️', category: 'באנרים' },
  { type: 'video_banner', label: 'באנר וידאו', icon: '🎬', category: 'באנרים' },
  { type: 'split_banner', label: 'באנר מפוצל', icon: '📷', category: 'באנרים' },
  { type: 'banner_small', label: 'באנר קטן', icon: '📢', category: 'באנרים' },
  // תוכן
  { type: 'image_text', label: 'תמונה + טקסט', icon: '🖼️', category: 'תוכן' },
  { type: 'text_block', label: 'בלוק טקסט', icon: '📝', category: 'תוכן' },
  { type: 'features', label: 'יתרונות', icon: '✨', category: 'תוכן' },
  { type: 'faq', label: 'שאלות נפוצות', icon: '❓', category: 'תוכן' },
  // קטלוג
  { type: 'categories', label: 'קטגוריות', icon: '📑', category: 'קטלוג' },
  { type: 'products', label: 'מוצרים', icon: '🛍️', category: 'קטלוג' },
  // סושיאל והמלצות
  { type: 'reviews', label: 'ביקורות', icon: '⭐', category: 'סושיאל' },
  { type: 'gallery', label: 'גלריה', icon: '🖼️', category: 'סושיאל' },
  { type: 'logos', label: 'לוגואים', icon: '🏢', category: 'סושיאל' },
  // אחר
  { type: 'newsletter', label: 'ניוזלטר', icon: '✉️', category: 'אחר' },
  { type: 'custom', label: 'מותאם אישית', icon: '⚙️', category: 'אחר' },
];

export function SectionTree({
  sections,
  selectedSectionId,
  onSelectSection,
  onAddSection,
  onRemoveSection,
  onReorderSections,
  headerLayout,
  currentPage = 'home',
}: SectionTreeProps) {
  const pageLabel = PAGE_LABELS[currentPage] || currentPage;
  const isComingSoon = currentPage === 'coming_soon';
  const isProductPage = currentPage === 'product';
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const toggleExpand = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorderSections(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
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

  // Special UI for Product Page - Similar to home page structure
  if (isProductPage) {
    // Product page section types with their icons and labels
    const productPageSections = [
      { id: 'pp-gallery', icon: 'gallery', label: 'גלריית תמונות', category: 'main' },
      { id: 'pp-info', icon: 'product-info', label: 'מידע מוצר', category: 'main' },
      { id: 'pp-features', icon: 'features', label: 'חוזקות', category: 'main' },
      { id: 'pp-description', icon: 'description', label: 'תיאור', category: 'main' },
      { id: 'pp-reviews', icon: 'reviews', label: 'ביקורות', category: 'extra' },
      { id: 'pp-related', icon: 'related', label: 'מוצרים דומים', category: 'extra' },
    ];

    return (
      <div className="flex flex-col h-full" dir="rtl">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900">{pageLabel}</h2>
        </div>

        {/* Scrollable Content - Same structure as home page */}
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
            <SectionItem
              icon="breadcrumb"
              label="ניווט (Breadcrumb)"
              isSelected={selectedSectionId === 'pp-breadcrumb'}
              onClick={() => onSelectSection('pp-breadcrumb')}
            />
          </div>
          
          {/* Main Content Sections */}
          <div className="border-b border-gray-100">
            <div className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
              תוכן מוצר
            </div>
            
            {productPageSections.filter(s => s.category === 'main').map((section) => (
              <SectionItem
                key={section.id}
                icon={section.icon}
                label={section.label}
                isSelected={selectedSectionId === section.id}
                onClick={() => onSelectSection(section.id)}
              />
            ))}
          </div>
          
          {/* Extra Sections */}
          <div className="border-b border-gray-100">
            <div className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
              סקשנים נוספים
            </div>
            
            {productPageSections.filter(s => s.category === 'extra').map((section) => (
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
          
          {sections.map((section, index) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={draggedIndex === index ? 'opacity-50' : ''}
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
}: {
  icon: string;
  label: string;
  isSelected: boolean;
  onClick: () => void;
  isExpanded?: boolean;
  onToggle?: () => void;
  hasChildren?: boolean;
  isDisabled?: boolean;
}) {
  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
        ${isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-50'}
        ${isDisabled ? 'opacity-50' : ''}
      `}
      onClick={onClick}
    >
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
        <div className="w-[16px]" />
      )}

      {/* Icon */}
      <SectionIcon type={icon} />

      {/* Label */}
      <span className={`text-sm flex-1 ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
        {label}
      </span>

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
function AddSectionButton({ onClick, small }: { onClick: () => void; small?: boolean }) {
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
      <span className="text-sm">הוסף סקשן</span>
    </button>
  );
}

// Add Section Floating Panel (Shopify-style)
function AddSectionModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (type: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(sectionTypes.map(s => s.category).filter(Boolean)))];

  // Filter sections
  const filteredSections = sectionTypes.filter((section) => {
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
  }, {} as Record<string, typeof sectionTypes>);

  return (
    <>
      {/* Backdrop - subtle */}
      <div 
        className="fixed inset-0 bg-black/20 z-40" 
        onClick={onClose}
      />
      
      {/* Floating Panel - positioned to the left of sidebar */}
      <div 
        className="fixed right-[340px] top-[80px] bottom-[80px] w-[320px] bg-white rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">הוסף סקשן</h3>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש סקשנים..."
              className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 py-2 border-b border-gray-100 flex gap-1 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
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
        <div className="flex-1 overflow-y-auto p-3">
          {filteredSections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-3 text-gray-300">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <p className="text-sm">לא נמצאו סקשנים</p>
            </div>
          ) : selectedCategory === 'all' ? (
            // Grouped view when "all" is selected
            Object.entries(groupedSections).map(([category, sections]) => (
              <div key={category} className="mb-4">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 px-1">
                  {category}
                </div>
                <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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
  section: { type: string; label: string; icon: string };
  onAdd: (type: string) => void;
}) {
  return (
    <button
      onClick={() => onAdd(section.type)}
      className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all text-right group"
    >
      <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center text-lg transition-colors">
        {section.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 truncate">
          {section.label}
        </div>
      </div>
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        className="text-gray-300 group-hover:text-blue-500 transition-colors"
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
