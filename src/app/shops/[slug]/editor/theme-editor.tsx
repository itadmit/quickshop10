'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SectionTree } from './section-tree';
import { SectionSettings } from './section-settings';
import { LivePreview } from './live-preview';
import { defaultProductPageSettings } from '@/lib/product-page-settings';

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
  faviconUrl: string | null;
  themeSettings: unknown;
  settings: unknown;
  customDomain: string | null;
}

type HeaderLayout = 'logo-right' | 'logo-left' | 'logo-center';

// Theme settings interface (mirrors section-settings.tsx)
interface ThemeSettings {
  headerLayout?: HeaderLayout;
  headerSticky?: boolean;
  headerTransparent?: boolean;
  headerShowSearch?: boolean;
  headerShowCart?: boolean;
  headerShowAccount?: boolean;
  headerNavigationMode?: 'menu' | 'categories'; // 'menu' = show custom menus, 'categories' = show all categories
  // Logo & Favicon (direct store fields)
  logoUrl?: string;
  faviconUrl?: string;
  // Announcement bar
  announcementEnabled?: boolean;
  announcementText?: string;
  announcementLink?: string;
  announcementBgColor?: string;
  announcementTextColor?: string;
  footerShowLogo?: boolean;
  footerShowNewsletter?: boolean;
  footerNewsletterTitle?: string;
  footerNewsletterSubtitle?: string;
  footerShowSocial?: boolean;
  footerShowPayments?: boolean;
  footerCopyright?: string;
  footerBgColor?: string;
  footerTextColor?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialTwitter?: string;
  socialTiktok?: string;
  socialYoutube?: string;
  // Product page settings
  productPageSettings?: Record<string, unknown>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  parentId: string | null;
}

// Available pages for editing
const EDITABLE_PAGES = [
  { id: 'home', label: 'דף הבית', icon: 'home' },
  { id: 'product', label: 'עמוד מוצר', icon: 'package' },
  { id: 'coming_soon', label: 'Coming Soon', icon: 'clock' },
] as const;

interface ThemeEditorProps {
  store: Store;
  slug: string;
  sections: Section[];
  templateId: string;
  categories?: Category[];
  currentPage?: string;
  isPublished?: boolean;
}

export function ThemeEditor({
  store,
  slug,
  sections: initialSections,
  templateId,
  categories = [],
  currentPage = 'home',
  isPublished = false,
}: ThemeEditorProps) {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    // For product page, auto-select the settings pseudo-section
    currentPage === 'product' ? 'product-page' : (initialSections[0]?.id || null)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  
  // Get current page info
  const currentPageInfo = EDITABLE_PAGES.find(p => p.id === currentPage) || EDITABLE_PAGES[0];
  
  // Theme settings state - loaded from store settings
  // Original settings from DB (for comparison)
  const originalThemeSettings: ThemeSettings = {
    headerLayout: 'logo-right',
    headerSticky: true,
    headerShowSearch: true,
    headerShowCart: true,
    headerShowAccount: true,
    // Logo & Favicon from store directly
    logoUrl: store.logoUrl || '',
    faviconUrl: store.faviconUrl || '',
    announcementEnabled: false,
    footerShowLogo: true,
    footerShowNewsletter: true,
    footerShowSocial: true,
    footerShowPayments: true,
    ...(store.settings as ThemeSettings || {}),
  };
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(originalThemeSettings);
  const [pendingThemeSettings, setPendingThemeSettings] = useState<Partial<ThemeSettings>>({});
  
  // Store info for passing to section settings
  const storeInfo = {
    id: store.id,
    slug: store.slug,
    logoUrl: themeSettings.logoUrl || store.logoUrl || null,
    faviconUrl: themeSettings.faviconUrl || store.faviconUrl || null,
  };

  // Get selected section - handle special sections like header, footer, product-page
  const getSelectedSection = (): Section | null => {
    if (selectedSectionId === 'header') {
      return {
        id: 'header',
        type: 'header',
        title: 'הדר',
        subtitle: null,
        content: {},
        settings: {},
        sortOrder: -1,
        isActive: true,
      };
    }
    if (selectedSectionId === 'announcement-bar') {
      return {
        id: 'announcement-bar',
        type: 'announcement-bar',
        title: 'פס הודעות',
        subtitle: null,
        content: {},
        settings: {},
        sortOrder: -2,
        isActive: true,
      };
    }
    if (selectedSectionId === 'footer') {
      return {
        id: 'footer',
        type: 'footer',
        title: 'פוטר',
        subtitle: null,
        content: {},
        settings: {},
        sortOrder: 999,
        isActive: true,
      };
    }
    // Product page settings pseudo-section
    if (selectedSectionId === 'product-page') {
      return {
        id: 'product-page',
        type: 'product-page',
        title: 'הגדרות עמוד מוצר',
        subtitle: null,
        content: {},
        settings: {},
        sortOrder: 0,
        isActive: true,
      };
    }
    
    // Product page individual sections (pp-gallery, pp-features, etc.)
    if (selectedSectionId?.startsWith('pp-')) {
      const sectionLabels: Record<string, string> = {
        'pp-breadcrumb': 'ניווט (Breadcrumb)',
        'pp-gallery': 'גלריית תמונות',
        'pp-info': 'מידע מוצר',
        'pp-features': 'חוזקות',
        'pp-description': 'תיאור',
        'pp-reviews': 'ביקורות',
        'pp-related': 'מוצרים דומים',
      };
      return {
        id: selectedSectionId,
        type: selectedSectionId,
        title: sectionLabels[selectedSectionId] || selectedSectionId,
        subtitle: null,
        content: {},
        settings: {},
        sortOrder: 0,
        isActive: true,
      };
    }
    
    return sections.find(s => s.id === selectedSectionId) || null;
  };

  const selectedSection = getSelectedSection();
  
  // Send live preview update to iframe (NO DB SAVE - just visual preview)
  const sendPreviewUpdate = useCallback((settings: ThemeSettings) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'THEME_SETTINGS_UPDATE',
        settings,
      }, '*');
    }
  }, []);
  
  // Send product page settings update to iframe for live preview
  const sendProductPagePreviewUpdate = useCallback((productPageSettings: Record<string, unknown>) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'PRODUCT_PAGE_SETTINGS_UPDATE',
        settings: productPageSettings,
      }, '*');
    }
  }, []);
  
  // Handle theme settings change - LIVE PREVIEW only, no DB save
  const handleThemeSettingsChange = useCallback((updates: Partial<ThemeSettings>) => {
    // Update local state immediately (for UI)
    const newSettings = { ...themeSettings, ...updates };
    setThemeSettings(newSettings);
    
    // Track pending changes (not saved yet)
    setPendingThemeSettings(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
    
    // Send to iframe for LIVE preview (no DB save!)
    sendPreviewUpdate(newSettings);
    
    // If product page settings changed, send the FULL merged settings
    if ('productPageSettings' in updates) {
      // Merge with defaults to ensure all fields are present
      const fullProductSettings = {
        ...defaultProductPageSettings,
        ...(newSettings.productPageSettings as Record<string, unknown> || {}),
      };
      sendProductPagePreviewUpdate(fullProductSettings);
    }
  }, [themeSettings, sendPreviewUpdate, sendProductPagePreviewUpdate]);
  
  // Set iframe ref when loaded
  const handleIframeLoad = useCallback((iframe: HTMLIFrameElement) => {
    iframeRef.current = iframe;
    // Send current settings to iframe on load
    sendPreviewUpdate(themeSettings);
    
    // Also send product page settings if on product page
    // Use stored settings or defaults if not set
    if (currentPage === 'product') {
      const productSettings = {
        ...defaultProductPageSettings,
        ...(themeSettings.productPageSettings as Record<string, unknown> || {}),
      };
      sendProductPagePreviewUpdate(productSettings);
    }
  }, [themeSettings, sendPreviewUpdate, sendProductPagePreviewUpdate, currentPage]);
  
  // Listen for PREVIEW_READY message from iframe and send settings
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PREVIEW_READY') {
        // Send current settings
        sendPreviewUpdate(themeSettings);
        // Send product page settings if on product page
        if (currentPage === 'product') {
          const productSettings = {
            ...defaultProductPageSettings,
            ...(themeSettings.productPageSettings as Record<string, unknown> || {}),
          };
          sendProductPagePreviewUpdate(productSettings);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [themeSettings, sendPreviewUpdate, sendProductPagePreviewUpdate, currentPage]);

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
    
    // Send live update to iframe (no DB save!)
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'SECTION_CONTENT_UPDATE',
        sectionId,
        updates,
      }, '*');
    }
  }, [sections]);

  // Save all changes to DB (sections + theme settings)
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save sections and theme settings in parallel for speed
      const savePromises: Promise<Response>[] = [
        fetch(`/api/shops/${slug}/settings/sections`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sections, page: currentPage }),
        }),
      ];
      
      // Only save theme settings if there are pending changes
      if (Object.keys(pendingThemeSettings).length > 0) {
        savePromises.push(
          fetch(`/api/shops/${slug}/settings/theme`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pendingThemeSettings),
          })
        );
      }
      
      const responses = await Promise.all(savePromises);
      const allOk = responses.every(r => r.ok);
      
      if (allOk) {
        setHasChanges(false);
        setPendingThemeSettings({}); // Clear pending changes
        // Refresh the preview iframe to confirm saved state
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

      {/* Top Bar - RTL layout */}
      <header className="h-14 bg-[#1a1a2e] border-b border-white/10 flex items-center justify-between px-4 z-50" dir="rtl">
        {/* Right - Back & Store Name */}
        <div className="flex items-center gap-3">
          <Link 
            href={`/shops/${slug}/admin/design`}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="חזרה לדשבורד"
          >
            <ArrowRightIcon />
          </Link>
          <span className="text-white font-medium">{store.name}</span>
          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
            isPublished 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-amber-500/20 text-amber-400'
          }`}>
            ● {isPublished ? 'פעיל' : 'Coming Soon'}
          </span>
        </div>

        {/* Center - Page Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPageDropdown(!showPageDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            {currentPageInfo.icon === 'home' ? <HomeIcon /> : currentPageInfo.icon === 'package' ? <PackageIcon /> : <ClockIcon />}
            <span className="text-white text-sm">{currentPageInfo.label}</span>
            <ChevronDownIcon />
          </button>
          
          {/* Dropdown */}
          {showPageDropdown && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowPageDropdown(false)} 
              />
              
              {/* Dropdown Menu */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-[#2a2a3e] rounded-lg shadow-xl border border-white/10 overflow-hidden z-50">
                <div className="p-2">
                  <p className="px-3 py-2 text-[10px] uppercase tracking-wider text-white/40">עמודים</p>
                  
                  {EDITABLE_PAGES.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => {
                        if (page.id !== currentPage) {
                          // Navigate to different page
                          router.push(`/shops/${slug}/editor?page=${page.id}`);
                        }
                        setShowPageDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                        page.id === currentPage 
                          ? 'bg-white/10 text-white' 
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {page.icon === 'home' ? (
                        <HomeIcon />
                      ) : page.icon === 'package' ? (
                        <PackageIcon />
                      ) : (
                        <ClockIcon />
                      )}
                      <span className="text-sm">{page.label}</span>
                      {page.id === currentPage && (
                        <span className="mr-auto text-green-400">
                          <CheckIcon />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Store Status */}
                <div className="border-t border-white/10 p-2">
                  <div className="px-3 py-2 flex items-center justify-between">
                    <span className="text-xs text-white/50">מצב האתר:</span>
                    <span className={`text-xs font-medium ${isPublished ? 'text-green-400' : 'text-yellow-400'}`}>
                      {isPublished ? '● פתוח' : '● Coming Soon'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Left - Actions */}
        <div className="flex items-center gap-2">
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

          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
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

          <div className="w-px h-6 bg-white/10" />

          {/* Save Button */}
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
              themeSettings={themeSettings}
              onThemeSettingsChange={handleThemeSettingsChange}
              categories={categories}
              storeInfo={storeInfo}
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
            onIframeLoad={handleIframeLoad}
            currentPage={currentPage}
            customDomain={store.customDomain}
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
            headerLayout={themeSettings.headerLayout}
            currentPage={currentPage}
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
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

function PackageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
