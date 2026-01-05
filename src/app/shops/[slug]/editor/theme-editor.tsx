'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { SectionTree } from './section-tree';
import { SectionSettings } from './section-settings';
import { LivePreview } from './live-preview';

// ============================================
// Theme Editor - Client Component (Shopify Style)
// Uses real iframe preview for pixel-perfect accuracy
// ============================================

interface Section {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  themeSettings: unknown;
}

interface ThemeEditorProps {
  store: Store;
  slug: string;
  sections: Section[];
  templateId: string;
}

export function ThemeEditor({
  store,
  slug,
  sections: initialSections,
  templateId,
}: ThemeEditorProps) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    initialSections[0]?.id || null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSection = sections.find(s => s.id === selectedSectionId) || null;

  // Update section data
  const updateSection = useCallback((sectionId: string, updates: Partial<Section>) => {
    setSections(prev => {
      const newSections = prev.map(s => {
        if (s.id === sectionId) {
          const updated = { ...s };
          
          if (updates.title !== undefined) updated.title = updates.title;
          if (updates.subtitle !== undefined) updated.subtitle = updates.subtitle;
          if (updates.isActive !== undefined) updated.isActive = updates.isActive;
          
          if (updates.content) {
            updated.content = { ...s.content, ...updates.content };
          }
          
          if (updates.settings) {
            updated.settings = { ...s.settings, ...updates.settings };
          }
          
          return updated;
        }
        return s;
      });
      return newSections;
    });
    setHasChanges(true);
  }, []);

  // Save all changes and refresh preview
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/shops/${slug}/settings/sections`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
      });
      
      if (response.ok) {
        setHasChanges(false);
        // Refresh the preview iframe to show changes
        setPreviewRefreshKey(prev => prev + 1);
      } else {
        alert('שגיאה בשמירה');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('שגיאה בשמירה');
    } finally {
      setIsSaving(false);
    }
  };

  // Import template from JSON
  const handleImportJSON = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.sections && Array.isArray(json.sections)) {
          setSections(json.sections.map((s: Section, i: number) => ({
            ...s,
            id: s.id || `imported-${Date.now()}-${i}`,
            sortOrder: i,
          })));
          setHasChanges(true);
          alert('התבנית יובאה בהצלחה! לחץ על "שמור" לראות את השינויים.');
        } else {
          alert('קובץ JSON לא תקין');
        }
      } catch {
        alert('שגיאה בקריאת הקובץ');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Export template to JSON
  const handleExportJSON = () => {
    const data = {
      templateId,
      storeName: store.name,
      exportDate: new Date().toISOString(),
      sections,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${store.slug}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Add new section
  const addSection = (type: string, afterSectionId?: string) => {
    const newSection: Section = {
      id: `temp-${Date.now()}`,
      type,
      title: getSectionDefaultTitle(type),
      subtitle: null,
      content: getSectionDefaultContent(type),
      settings: getSectionDefaultSettings(type),
      sortOrder: sections.length,
      isActive: true,
    };

    if (afterSectionId) {
      const index = sections.findIndex(s => s.id === afterSectionId);
      const newSections = [...sections];
      newSections.splice(index + 1, 0, newSection);
      setSections(newSections.map((s, i) => ({ ...s, sortOrder: i })));
    } else {
      setSections([...sections, newSection]);
    }
    
    setSelectedSectionId(newSection.id);
    setHasChanges(true);
  };

  // Remove section
  const removeSection = (sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(sections[0]?.id || null);
    }
    setHasChanges(true);
  };

  // Reorder sections
  const reorderSections = (fromIndex: number, toIndex: number) => {
    const newSections = [...sections];
    const [removed] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, removed);
    setSections(newSections.map((s, i) => ({ ...s, sortOrder: i })));
    setHasChanges(true);
  };

  return (
    <div className="fixed inset-0 bg-[#1a1a2e] flex flex-col" dir="rtl">
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Top Bar */}
      <header className="h-14 bg-[#1a1a2e] border-b border-white/10 flex items-center justify-between px-4 z-50">
        {/* Right - Save Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              hasChanges
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-white/10 text-white/50 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'שומר...' : hasChanges ? 'שמור שינויים' : 'שמור'}
          </button>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1 mx-2">
            <button className="p-2 text-white/30 cursor-not-allowed" title="בטל">
              <UndoIcon />
            </button>
            <button className="p-2 text-white/30 cursor-not-allowed" title="בצע שוב">
              <RedoIcon />
            </button>
          </div>

          {/* Device Toggles */}
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded-md transition-colors cursor-pointer ${
                previewMode === 'desktop' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
              }`}
              title="דסקטופ"
            >
              <DesktopIcon />
            </button>
            <button
              onClick={() => setPreviewMode('tablet')}
              className={`p-2 rounded-md transition-colors cursor-pointer ${
                previewMode === 'tablet' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
              }`}
              title="טאבלט"
            >
              <TabletIcon />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded-md transition-colors cursor-pointer ${
                previewMode === 'mobile' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
              }`}
              title="מובייל"
            >
              <MobileIcon />
            </button>
          </div>
        </div>

        {/* Center - Page Selector */}
        <div className="flex items-center gap-2">
          <HomeIcon />
          <span className="text-white text-sm">דף הבית</span>
        </div>

        {/* Left - Back, Store Name & Import/Export */}
        <div className="flex items-center gap-3">
          {/* Import/Export */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleImportJSON}
              className="px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="ייבא תבנית"
            >
              <ImportIcon />
              <span>ייבוא</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="ייצא תבנית"
            >
              <ExportIcon />
              <span>ייצוא</span>
            </button>
          </div>

          <div className="w-px h-6 bg-white/10" />

          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-medium rounded-full">
            ● פעיל
          </span>
          <span className="text-white/60 text-sm">{store.name}</span>
          <Link 
            href={`/shops/${slug}/admin/design`}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowRightIcon />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden" dir="ltr">
        {/* Left Panel - Section Settings */}
        <div className="w-[340px] bg-white border-r border-gray-200 overflow-auto">
          {selectedSection ? (
            <SectionSettings
              key={selectedSection.id}
              section={selectedSection}
              onUpdate={(updates) => updateSection(selectedSection.id, updates)}
              onRemove={() => removeSection(selectedSection.id)}
            />
          ) : (
            <div className="p-6 text-center text-gray-400" dir="rtl">
              <p>בחרו סקשן לעריכה</p>
            </div>
          )}
        </div>

        {/* Center - Live Preview (iframe of actual storefront) */}
        <div className="flex-1 bg-gray-200 overflow-auto flex items-start justify-center p-4">
          <LivePreview
            storeSlug={slug}
            previewMode={previewMode}
            selectedSectionId={selectedSectionId}
            onSelectSection={setSelectedSectionId}
            refreshKey={previewRefreshKey}
          />
        </div>

        {/* Right Panel - Section Tree */}
        <div className="w-[280px] bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          <SectionTree
            sections={sections}
            selectedSectionId={selectedSectionId}
            onSelectSection={setSelectedSectionId}
            onAddSection={addSection}
            onRemoveSection={removeSection}
            onReorderSections={reorderSections}
          />
        </div>
      </div>
    </div>
  );
}

// Helper functions for default section values
function getSectionDefaultTitle(type: string): string {
  const titles: Record<string, string> = {
    hero: 'באנר ראשי',
    categories: 'קטגוריות',
    products: 'מוצרים',
    newsletter: 'ניוזלטר',
    video_banner: 'באנר וידאו',
    split_banner: 'באנר מפוצל',
  };
  return titles[type] || 'סקשן חדש';
}

function getSectionDefaultContent(type: string): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    hero: { imageUrl: '', buttonText: 'לחנות', buttonLink: '/products' },
    categories: {},
    products: { type: 'all', limit: 8 },
    newsletter: { placeholder: 'כתובת אימייל', buttonText: 'הרשמה' },
    video_banner: { videoUrl: '', imageUrl: '' },
    split_banner: { items: [] },
  };
  return defaults[type] || {};
}

function getSectionDefaultSettings(type: string): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    hero: { height: '90vh', overlay: 0.3 },
    categories: { columns: 4, gap: 8 },
    products: { columns: 4, gap: 8, showCount: false },
    newsletter: { maxWidth: '600px' },
    video_banner: { height: '80vh', overlay: 0.4 },
    split_banner: { height: '60vh' },
  };
  return defaults[type] || {};
}

// Icons
function ArrowRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function DesktopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function TabletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function MobileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}
