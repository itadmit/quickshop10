'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { SectionTree } from './section-tree';
import { SectionSettings } from './section-settings';
import { LivePreview } from './live-preview';

// ============================================
// Theme Editor - Client Component (Shopify Style)
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

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string | null;
  image: string | null;
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
  categories: Category[];
  products: Product[];
  templateId: string;
}

export function ThemeEditor({
  store,
  slug,
  sections: initialSections,
  categories,
  products,
  templateId,
}: ThemeEditorProps) {
  const [sections, setSections] = useState(initialSections);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    initialSections[0]?.id || null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');

  const selectedSection = sections.find(s => s.id === selectedSectionId) || null;

  // Update section data
  const updateSection = useCallback((sectionId: string, updates: Partial<Section>) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, ...updates } : s
    ));
    setHasChanges(true);
  }, []);

  // Save all changes
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
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
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
    <div className="fixed inset-0 bg-[#1a1a2e] flex flex-col" dir="ltr">
      {/* Top Bar */}
      <header className="h-14 bg-[#1a1a2e] border-b border-white/10 flex items-center justify-between px-4">
        {/* Left - Back & Store Name */}
        <div className="flex items-center gap-3">
          <Link 
            href={`/shops/${slug}/admin/design`}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeftIcon />
          </Link>
          <span className="text-white/60 text-sm">{store.name}</span>
          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-medium rounded-full">
            ● Live
          </span>
        </div>

        {/* Center - Page Selector */}
        <div className="flex items-center gap-2">
          <HomeIcon />
          <span className="text-white text-sm">Home page</span>
        </div>

        {/* Right - Device Toggles & Save */}
        <div className="flex items-center gap-2">
          {/* Device Toggles */}
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded-md transition-colors ${
                previewMode === 'desktop' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              <DesktopIcon />
            </button>
            <button
              onClick={() => setPreviewMode('tablet')}
              className={`p-2 rounded-md transition-colors ${
                previewMode === 'tablet' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              <TabletIcon />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded-md transition-colors ${
                previewMode === 'mobile' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              <MobileIcon />
            </button>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1 mx-2">
            <button className="p-2 text-white/30 cursor-not-allowed">
              <UndoIcon />
            </button>
            <button className="p-2 text-white/30 cursor-not-allowed">
              <RedoIcon />
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              hasChanges
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-white/10 text-white/50 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'שומר...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Section Tree */}
        <div className="w-[280px] bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <SectionTree
            sections={sections}
            selectedSectionId={selectedSectionId}
            onSelectSection={setSelectedSectionId}
            onAddSection={addSection}
            onRemoveSection={removeSection}
            onReorderSections={reorderSections}
          />
        </div>

        {/* Center - Live Preview */}
        <div className="flex-1 bg-gray-100 overflow-auto flex items-start justify-center p-6">
          <LivePreview
            sections={sections}
            categories={categories}
            products={products}
            store={store}
            slug={slug}
            previewMode={previewMode}
            selectedSectionId={selectedSectionId}
            onSelectSection={setSelectedSectionId}
          />
        </div>

        {/* Right Panel - Section Settings */}
        <div className="w-[340px] bg-white border-l border-gray-200 overflow-auto">
          {selectedSection ? (
            <SectionSettings
              section={selectedSection}
              onUpdate={(updates) => updateSection(selectedSection.id, updates)}
              onRemove={() => removeSection(selectedSection.id)}
            />
          ) : (
            <div className="p-6 text-center text-gray-400">
              <p>בחרו סקשן לעריכה</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getSectionDefaultTitle(type: string): string {
  const titles: Record<string, string> = {
    hero: 'Hero Banner',
    categories: 'Categories',
    products: 'Products',
    newsletter: 'Newsletter',
    video_banner: 'Video Banner',
    split_banner: 'Split Banner',
  };
  return titles[type] || 'New Section';
}

function getSectionDefaultContent(type: string): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    hero: { imageUrl: '', buttonText: 'Shop Now', buttonLink: '/products' },
    categories: {},
    products: { type: 'all', limit: 8 },
    newsletter: { placeholder: 'Enter your email', buttonText: 'Subscribe' },
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
function ArrowLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" />
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


