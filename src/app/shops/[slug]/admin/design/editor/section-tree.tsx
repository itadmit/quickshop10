'use client';

import { useState } from 'react';

// ============================================
// Section Tree - Left Panel (Shopify Style)
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
}

const sectionTypes = [
  { type: 'hero', label: 'Hero Banner', icon: '🖼️' },
  { type: 'categories', label: 'Collection list', icon: '📑' },
  { type: 'products', label: 'Featured products', icon: '🛍️' },
  { type: 'video_banner', label: 'Video banner', icon: '🎬' },
  { type: 'split_banner', label: 'Image with text', icon: '📷' },
  { type: 'newsletter', label: 'Newsletter', icon: '✉️' },
  { type: 'custom', label: 'Custom content', icon: '✨' },
];

export function SectionTree({
  sections,
  selectedSectionId,
  onSelectSection,
  onAddSection,
  onRemoveSection,
  onReorderSections,
}: SectionTreeProps) {
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-900">Home page</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        {/* Header Section */}
        <div className="border-b border-gray-100">
          <div className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Header
          </div>
          <SectionItem
            icon="header"
            label="Announcement bar"
            isSelected={false}
            onClick={() => {}}
          />
          <SectionItem
            icon="header"
            label="Header"
            isSelected={false}
            onClick={() => {}}
            hasChildren
          />
          <AddSectionButton onClick={() => setShowAddMenu(true)} small />
        </div>

        {/* Template Sections */}
        <div className="border-b border-gray-100">
          <div className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Template
          </div>
          
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
                  <SubItem label="Add block" isAdd />
                  <SubItem label="Collection – FACE" />
                  <SubItem label="Collection – LIPS" />
                  <SubItem label="Collection – BRUSHES" />
                </div>
              )}
            </div>
          ))}
          
          <AddSectionButton 
            onClick={() => setShowAddMenu(true)} 
          />
        </div>

        {/* Footer Section */}
        <div>
          <div className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Footer
          </div>
          <AddSectionButton onClick={() => {}} small />
          <SectionItem
            icon="footer"
            label="Footer"
            isSelected={false}
            onClick={() => {}}
            hasChildren
          />
        </div>
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
      <span className={`text-sm ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
        {label}
      </span>

      {/* Disabled indicator */}
      {isDisabled && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 ml-auto">
          <path d="M17 17l-5-5m0 0l-5-5m5 5l5-5m-5 5l-5 5" />
        </svg>
      )}
    </div>
  );
}

// Sub Item Component (for expanded sections)
function SubItem({ label, isAdd }: { label: string; isAdd?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 pl-10 cursor-pointer hover:bg-gray-100 transition-colors">
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
      <span className="text-sm">Add section</span>
    </button>
  );
}

// Add Section Modal
function AddSectionModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (type: string) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl w-[400px] max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Add section</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 overflow-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-3">
            {sectionTypes.map((section) => (
              <button
                key={section.type}
                onClick={() => onAdd(section.type)}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="text-2xl mb-2">{section.icon}</div>
                <div className="text-sm font-medium text-gray-900">{section.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
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
    default:
      return (
        <svg className={iconClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      );
  }
}




