'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SectionTree } from './section-tree';
import { SectionSettings } from './section-settings';
import { LivePreview } from './live-preview';
import { defaultProductPageSettings } from '@/lib/product-page-settings';
import { defaultCategoryPageSettings } from '@/lib/category-page-settings';

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
  // Mobile menu settings
  mobileMenuShowImages?: boolean;
  mobileMenuImageStyle?: 'fullRow' | 'square';
  mobileMenuBgColor?: string;
  megaMenuBgColor?: string;
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
  footerShowCategories?: boolean;
  footerShowMenu?: boolean;
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
  // Category page settings
  categoryPageSettings?: Record<string, unknown>;
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
  { id: 'category', label: 'עמוד קטגוריה', icon: 'folder' },
  { id: 'coming_soon', label: 'Coming Soon', icon: 'clock' },
] as const;

// Internal page interface
interface InternalPage {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

// Metafield definition for dynamic source picker
interface MetafieldForPicker {
  id: string;
  name: string;
  key: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'url' | 'boolean';
  isActive: boolean;
  showOnProduct: boolean;
}

interface ThemeEditorProps {
  store: Store;
  slug: string;
  sections: Section[];
  templateId: string;
  categories?: Category[];
  currentPage?: string;
  isPublished?: boolean;
  internalPages?: InternalPage[];
  metafields?: MetafieldForPicker[];
}

export function ThemeEditor({
  store,
  slug,
  sections: initialSections,
  templateId,
  categories = [],
  currentPage = 'home',
  isPublished = false,
  internalPages: initialInternalPages = [],
  metafields = [],
}: ThemeEditorProps) {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    // For product page, auto-select the settings pseudo-section
    // For category page, auto-select the banner section
    currentPage === 'product' ? 'product-page' : 
    currentPage === 'category' ? 'cp-banner' : 
    (initialSections[0]?.id || null)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const [internalPages, setInternalPages] = useState<InternalPage[]>(initialInternalPages);
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  // Page settings modal state
  const [showPageSettingsModal, setShowPageSettingsModal] = useState(false);
  const [pageSettingsForm, setPageSettingsForm] = useState({
    title: '',
    slug: '',
    seoTitle: '',
    seoDescription: '',
    isPublished: false,
  });
  const [isSavingPageSettings, setIsSavingPageSettings] = useState(false);
  const [isDeletingPage, setIsDeletingPage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Save as template modal
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Debounced auto-refresh for product page sections
  const productPageRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sectionsRef = useRef(sections); // Track sections for debounced save
  sectionsRef.current = sections;
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (productPageRefreshTimeoutRef.current) {
        clearTimeout(productPageRefreshTimeoutRef.current);
      }
    };
  }, []);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  
  // Get current page info - check internal pages first
  const isInternalPage = currentPage.startsWith('pages/');
  const currentInternalPage = isInternalPage 
    ? internalPages.find(p => `pages/${p.slug}` === currentPage)
    : null;
  const currentPageInfo = currentInternalPage
    ? { id: currentPage, label: currentInternalPage.title, icon: 'file' as const }
    : (EDITABLE_PAGES.find(p => p.id === currentPage) || EDITABLE_PAGES[0]);
  
  // Create new internal page
  const handleCreatePage = async () => {
    if (!newPageTitle.trim() || !newPageSlug.trim()) return;
    
    setIsCreatingPage(true);
    try {
      const response = await fetch(`/api/shops/${slug}/editor/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newPageTitle.trim(), pageSlug: newPageSlug.trim() }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Add to local state
        setInternalPages(prev => [...prev, {
          id: data.page.id,
          title: data.page.title,
          slug: data.page.slug,
          isPublished: data.page.isPublished,
        }]);
        
        // Navigate to the new page
        router.push(`/shops/${slug}/editor?page=${data.pageIdentifier}`);
        setShowNewPageModal(false);
        setNewPageTitle('');
        setNewPageSlug('');
      } else {
        alert(data.error || 'שגיאה ביצירת העמוד');
      }
    } catch (error) {
      console.error('Create page error:', error);
      alert('שגיאה ביצירת העמוד');
    } finally {
      setIsCreatingPage(false);
    }
  };
  
  // Auto-generate slug from title
  const handleNewPageTitleChange = (title: string) => {
    setNewPageTitle(title);
    // Generate slug from title (Hebrew-friendly)
    const generatedSlug = title
      .trim()
      .replace(/[\s\u200B-\u200D\uFEFF\u00A0\u2000-\u200A\u2028\u2029]+/g, '-')
      .replace(/[.,;:!?()[\]{}'"\`~@#$%^&*+=|\\<>\/]+/g, '-')
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    setNewPageSlug(generatedSlug);
  };
  
  // Open page settings modal for current internal page
  const openPageSettings = () => {
    if (!currentInternalPage) return;
    setPageSettingsForm({
      title: currentInternalPage.title,
      slug: currentInternalPage.slug,
      seoTitle: currentInternalPage.seoTitle || '',
      seoDescription: currentInternalPage.seoDescription || '',
      isPublished: currentInternalPage.isPublished,
    });
    setShowPageSettingsModal(true);
  };
  
  // Save page settings
  const handleSavePageSettings = async () => {
    if (!currentInternalPage) return;
    
    setIsSavingPageSettings(true);
    try {
      const response = await fetch(`/api/shops/${slug}/editor/pages/${currentInternalPage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pageSettingsForm.title.trim(),
          pageSlug: pageSettingsForm.slug.trim(),
          seoTitle: pageSettingsForm.seoTitle.trim() || null,
          seoDescription: pageSettingsForm.seoDescription.trim() || null,
          isPublished: pageSettingsForm.isPublished,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update local state
        setInternalPages(prev => prev.map(p => 
          p.id === currentInternalPage.id 
            ? { 
                ...p, 
                title: pageSettingsForm.title.trim(),
                slug: pageSettingsForm.slug.trim(),
                seoTitle: pageSettingsForm.seoTitle.trim() || null,
                seoDescription: pageSettingsForm.seoDescription.trim() || null,
                isPublished: pageSettingsForm.isPublished,
              }
            : p
        ));
        
        // If slug changed, redirect to new URL
        if (pageSettingsForm.slug.trim() !== currentInternalPage.slug) {
          router.push(`/shops/${slug}/editor?page=pages/${pageSettingsForm.slug.trim()}`);
        }
        
        setShowPageSettingsModal(false);
        // Refresh preview
        setPreviewRefreshKey(k => k + 1);
      } else {
        alert(data.error || 'שגיאה בשמירת ההגדרות');
      }
    } catch (error) {
      console.error('Save page settings error:', error);
      alert('שגיאה בשמירת ההגדרות');
    } finally {
      setIsSavingPageSettings(false);
    }
  };
  
  // Delete page
  const handleDeletePage = async () => {
    if (!currentInternalPage) return;
    
    setIsDeletingPage(true);
    try {
      const response = await fetch(`/api/shops/${slug}/editor/pages/${currentInternalPage.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Remove from local state
        setInternalPages(prev => prev.filter(p => p.id !== currentInternalPage.id));
        // Redirect to home
        router.push(`/shops/${slug}/editor?page=home`);
      } else {
        alert(data.error || 'שגיאה במחיקת העמוד');
      }
    } catch (error) {
      console.error('Delete page error:', error);
      alert('שגיאה במחיקת העמוד');
    } finally {
      setIsDeletingPage(false);
      setShowDeleteConfirm(false);
    }
  };
  
  // Save page as template
  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) return;
    
    setIsSavingTemplate(true);
    try {
      const response = await fetch(`/api/shops/${slug}/page-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName.trim(),
          description: templateDescription.trim() || null,
          pageSlug: currentPage,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setShowSaveTemplateModal(false);
        setTemplateName('');
        setTemplateDescription('');
        alert('התבנית נשמרה בהצלחה!');
      } else {
        alert(data.error || 'שגיאה בשמירת התבנית');
      }
    } catch (error) {
      console.error('Save template error:', error);
      alert('שגיאה בשמירת התבנית');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Toggle page publish status
  const handleTogglePublish = async () => {
    if (!currentInternalPage) return;
    
    const newStatus = !currentInternalPage.isPublished;
    
    try {
      const response = await fetch(`/api/shops/${slug}/editor/pages/${currentInternalPage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: newStatus }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setInternalPages(prev => prev.map(p => 
          p.id === currentInternalPage.id 
            ? { ...p, isPublished: newStatus }
            : p
        ));
        setPageSettingsForm(prev => ({ ...prev, isPublished: newStatus }));
      } else {
        alert(data.error || 'שגיאה בעדכון סטטוס הפרסום');
      }
    } catch (error) {
      console.error('Toggle publish error:', error);
    }
  };
  
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

    // Category page individual sections (cp-banner, cp-subcategories, etc.)
    if (selectedSectionId?.startsWith('cp-')) {
      const sectionLabels: Record<string, string> = {
        'cp-banner': 'באנר קטגוריה',
        'cp-breadcrumb': 'ניווט (Breadcrumb)',
        'cp-subcategories': 'תתי קטגוריות',
        'cp-products': 'רשת מוצרים',
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

  // Send category page settings update to iframe for live preview
  const sendCategoryPagePreviewUpdate = useCallback((categoryPageSettings: Record<string, unknown>) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'CATEGORY_PAGE_SETTINGS_UPDATE',
        settings: categoryPageSettings,
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

    // If category page settings changed, send the FULL merged settings
    if ('categoryPageSettings' in updates) {
      // Merge with defaults to ensure all fields are present
      const fullCategorySettings = {
        ...defaultCategoryPageSettings,
        ...(newSettings.categoryPageSettings as Record<string, unknown> || {}),
      };
      sendCategoryPagePreviewUpdate(fullCategorySettings);
    }
  }, [themeSettings, sendPreviewUpdate, sendProductPagePreviewUpdate, sendCategoryPagePreviewUpdate]);
  
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
      
      // V2: Also send gallery settings from the product_gallery section if it exists
      const gallerySection = sections.find(s => s.type === 'product_gallery');
      if (gallerySection?.settings) {
        const gallerySectionSettings = gallerySection.settings as Record<string, unknown>;
        sendProductPagePreviewUpdate({
          gallery: {
            layout: gallerySectionSettings.layout || 'carousel',
            thumbnailsPosition: gallerySectionSettings.thumbnailsPosition || 'bottom',
            thumbnailsPositionMobile: gallerySectionSettings.thumbnailsPositionMobile || 'bottom',
            aspectRatio: gallerySectionSettings.aspectRatio || '3:4',
            enableZoom: gallerySectionSettings.enableZoom ?? true,
            showArrows: gallerySectionSettings.showArrows ?? true,
            showDotsOnMobile: gallerySectionSettings.showDotsOnMobile ?? false,
          },
        });
      }
    }

    // Also send category page settings if on category page
    if (currentPage === 'category') {
      const categorySettings = {
        ...defaultCategoryPageSettings,
        ...(themeSettings.categoryPageSettings as Record<string, unknown> || {}),
      };
      sendCategoryPagePreviewUpdate(categorySettings);
    }
  }, [themeSettings, sections, sendPreviewUpdate, sendProductPagePreviewUpdate, sendCategoryPagePreviewUpdate, currentPage]);
  
  // Listen for messages from iframe (PREVIEW_READY, SECTION_CLICKED, etc.)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle section click from preview - select the section in the editor
      if (event.data?.type === 'SECTION_CLICKED') {
        const sectionId = event.data.sectionId as string;
        if (sectionId) {
          setSelectedSectionId(sectionId);
        }
      }
      
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
          
          // V2: Also send gallery settings from the product_gallery section
          const gallerySection = sections.find(s => s.type === 'product_gallery');
          if (gallerySection?.settings) {
            const gallerySectionSettings = gallerySection.settings as Record<string, unknown>;
            sendProductPagePreviewUpdate({
              gallery: {
                layout: gallerySectionSettings.layout || 'carousel',
                thumbnailsPosition: gallerySectionSettings.thumbnailsPosition || 'bottom',
                thumbnailsPositionMobile: gallerySectionSettings.thumbnailsPositionMobile || 'bottom',
                aspectRatio: gallerySectionSettings.aspectRatio || '3:4',
                enableZoom: gallerySectionSettings.enableZoom ?? true,
                showArrows: gallerySectionSettings.showArrows ?? true,
                showDotsOnMobile: gallerySectionSettings.showDotsOnMobile ?? false,
              },
            });
          }
        }
        // Send category page settings if on category page
        if (currentPage === 'category') {
          const categorySettings = {
            ...defaultCategoryPageSettings,
            ...(themeSettings.categoryPageSettings as Record<string, unknown> || {}),
          };
          sendCategoryPagePreviewUpdate(categorySettings);
        }
      }
      // Also handle CATEGORY_PREVIEW_READY
      if (event.data?.type === 'CATEGORY_PREVIEW_READY') {
        sendPreviewUpdate(themeSettings);
        const categorySettings = {
          ...defaultCategoryPageSettings,
          ...(themeSettings.categoryPageSettings as Record<string, unknown> || {}),
        };
        sendCategoryPagePreviewUpdate(categorySettings);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [themeSettings, sendPreviewUpdate, sendProductPagePreviewUpdate, sendCategoryPagePreviewUpdate, currentPage]);

  // Update section data - updates local state only, no auto-save
  // Save happens when user clicks "שמור"
  const updateSection = useCallback((sectionId: string, updates: Partial<Section>) => {
    setSections(prev => prev.map(s => {
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
    }));
    setHasChanges(true);
    
    // Send live update to iframe for visual preview (both home and product pages)
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'SECTION_CONTENT_UPDATE',
        sectionId,
        updates,
      }, '*');
      
      // For product_gallery sections, also send PRODUCT_PAGE_SETTINGS_UPDATE for live preview
      // This syncs the gallery settings with the live preview system
      const section = sections.find(s => s.id === sectionId);
      if (section?.type === 'product_gallery' && updates.settings) {
        const mergedSettings = { ...section.settings, ...updates.settings };
        iframeRef.current.contentWindow.postMessage({
          type: 'PRODUCT_PAGE_SETTINGS_UPDATE',
          settings: {
            gallery: {
              layout: mergedSettings.layout || 'carousel',
              thumbnailsPosition: mergedSettings.thumbnailsPosition || 'bottom',
              thumbnailsPositionMobile: mergedSettings.thumbnailsPositionMobile || 'bottom',
              aspectRatio: mergedSettings.aspectRatio || '3:4',
              enableZoom: mergedSettings.enableZoom ?? true,
              showArrows: mergedSettings.showArrows ?? true,
              showDotsOnMobile: mergedSettings.showDotsOnMobile ?? false,
            },
          },
        }, '*');
      }
    }
  }, [sections]);


  // Save all changes to DB (sections + theme settings)
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simple parallel save - sections and theme settings
      const savePromises: Promise<Response>[] = [
        fetch(`/api/shops/${slug}/settings/sections`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sections, page: currentPage }),
        }),
      ];
      
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
        setPendingThemeSettings({});
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

  // Add new section - add to local state and inject placeholder in iframe
  const addSection = (type: string, zone?: string) => {
    // Define zone types for product page
    const defaultInfoTypes = ['product_badges', 'product_title', 'product_price', 'product_short_desc', 'product_inventory', 'product_add_to_cart', 'product_description', 'features'];
    const defaultContentTypes = ['text_block', 'image_text', 'video', 'divider', 'spacer', 'product_reviews', 'product_related', 'product_upsells'];
    const flexibleTypes = ['accordion', 'tabs'];
    
    // Calculate the correct sortOrder based on zone
    let targetSortOrder = sections.length;
    
    if (zone === 'info') {
      // Find the last info section and place after it (including flexible types with zone='info')
      const infoSections = sections.filter(s => 
        defaultInfoTypes.includes(s.type) || 
        (flexibleTypes.includes(s.type) && s.settings?.zone === 'info')
      );
      if (infoSections.length > 0) {
        const maxInfoSortOrder = Math.max(...infoSections.map(s => s.sortOrder));
        targetSortOrder = maxInfoSortOrder + 1;
      } else {
        // No info sections yet, place after gallery (which is usually sortOrder 1)
        const gallerySections = sections.filter(s => s.type === 'product_gallery');
        targetSortOrder = gallerySections.length > 0 ? Math.max(...gallerySections.map(s => s.sortOrder)) + 1 : 1;
      }
    } else if (zone === 'content') {
      // Find the last content section and place after it
      const contentSections = sections.filter(s => 
        defaultContentTypes.includes(s.type) || 
        (flexibleTypes.includes(s.type) && (s.settings?.zone === 'content' || !s.settings?.zone))
      );
      if (contentSections.length > 0) {
        const maxContentSortOrder = Math.max(...contentSections.map(s => s.sortOrder));
        targetSortOrder = maxContentSortOrder + 1;
      } else {
        // No content sections yet, place at the end
        targetSortOrder = sections.length;
      }
    }
    
    // Use real UUID from the start - no temp IDs, no mapping needed!
    const defaultSettings = getSectionDefaultSettings(type);
    const newSection: Section = {
      id: crypto.randomUUID(),
      type,
      title: getSectionDefaultTitle(type),
      subtitle: null,
      content: getSectionDefaultContent(type),
      settings: zone ? { ...defaultSettings, zone } : defaultSettings,
      sortOrder: targetSortOrder,
      isActive: true,
    };

    // Shift sortOrder of sections that come after
    let newSections = sections.map(s => {
      if (s.sortOrder >= targetSortOrder) {
        return { ...s, sortOrder: s.sortOrder + 1 };
      }
      return s;
    });
    newSections = [...newSections, newSection];
    
    setSections(newSections);
    setSelectedSectionId(newSection.id);
    setHasChanges(true);
    
    // Send message to iframe to add section (works for both home and product pages)
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'SECTION_ADD',
        sectionId: newSection.id,
        sectionType: type,
        title: newSection.title,
        subtitle: newSection.subtitle,
        content: newSection.content,
        settings: newSection.settings,
        sortOrder: newSection.sortOrder,
        zone,
      }, '*');

      // Scroll to the new section after a short delay
      setTimeout(() => {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'SCROLL_TO_SECTION',
            sectionId: newSection.id,
          }, '*');
        }
      }, 100);
    }
  };

  // Remove section - update local state and hide in iframe
  const removeSection = (sectionId: string) => {
    const newSections = sections.filter(s => s.id !== sectionId);
    setSections(newSections);
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(newSections[0]?.id || null);
    }
    setHasChanges(true);
    
    // Send message to iframe to hide/remove the section
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'SECTION_REMOVE',
        sectionId,
      }, '*');
    }
  };

  // Apply template - replace all sections with template sections (Product Page V2)
  const applyTemplate = (templateId: string) => {
    // Import dynamically to avoid circular deps
    import('@/lib/product-page-sections').then(({ productPageTemplates }) => {
      const template = productPageTemplates.find(t => t.id === templateId);
      if (!template) return;
      
      // Generate new unique IDs for each section
      const newSections: Section[] = template.sections.map((s, index) => ({
        id: crypto.randomUUID(),
        type: s.type,
        title: s.title,
        subtitle: s.subtitle,
        content: { ...s.content },
        settings: { ...s.settings },
        sortOrder: index,
        isActive: s.isActive,
      }));
      
      setSections(newSections);
      setSelectedSectionId(newSections[0]?.id || null);
      setHasChanges(true);
      
      // Refresh preview to show new template
      setPreviewRefreshKey(k => k + 1);
    });
  };

  // Reorder sections - swap sortOrder values between two sections
  // Save happens when user clicks "שמור"
  // fromSortOrder and toSortOrder are the sortOrder values of the sections being swapped
  const reorderSections = (fromSortOrder: number, toSortOrder: number) => {
    // Find the two sections to swap
    const fromSection = sections.find(s => s.sortOrder === fromSortOrder);
    const toSection = sections.find(s => s.sortOrder === toSortOrder);
    
    if (!fromSection || !toSection) return;
    
    // Swap their sortOrder values
    const updatedSections = sections.map(s => {
      if (s.id === fromSection.id) {
        return { ...s, sortOrder: toSortOrder };
      }
      if (s.id === toSection.id) {
        return { ...s, sortOrder: fromSortOrder };
      }
      return s;
    });
    
    setSections(updatedSections);
    setHasChanges(true);
    
    // Send swap message to iframe for live preview
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'SECTION_SWAP',
        fromId: fromSection.id,
        toId: toSection.id,
      }, '*');
    }
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
      <header className="h-14 bg-[#1a1a2e] border-b border-white/10 flex items-center justify-between px-4 z-50 relative" dir="rtl">
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

        {/* Center - Page Selector Dropdown (Absolutely Centered) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowPageDropdown(!showPageDropdown)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-white"
          >
              {currentPageInfo.icon === 'home' ? <HomeIcon /> : currentPageInfo.icon === 'package' ? <PackageIcon /> : currentPageInfo.icon === 'file' ? <FileIcon /> : <ClockIcon />}
            <span className="text-sm">{currentPageInfo.label}</span>
              {isInternalPage && currentInternalPage && !currentInternalPage.isPublished && (
                <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">טיוטה</span>
              )}
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
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#2a2a3e] rounded-lg shadow-xl border border-white/10 overflow-hidden z-50 max-h-[80vh] overflow-y-auto">
                <div className="p-2">
                  <p className="px-3 py-2 text-[10px] uppercase tracking-wider text-white/40">עמודי מערכת</p>
                  
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
                
                {/* Internal Pages */}
                <div className="border-t border-white/10 p-2">
                  <p className="px-3 py-2 text-[10px] uppercase tracking-wider text-white/40">עמודים פנימיים</p>
                  
                  {internalPages.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-white/30">אין עמודים פנימיים</p>
                  ) : (
                    internalPages.map((page) => {
                      const pageId = `pages/${page.slug}`;
                      return (
                        <button
                          key={page.id}
                          onClick={() => {
                            if (pageId !== currentPage) {
                              router.push(`/shops/${slug}/editor?page=${pageId}`);
                            }
                            setShowPageDropdown(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                            pageId === currentPage 
                              ? 'bg-white/10 text-white' 
                              : 'text-white/70 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <FileIcon />
                          <span className="text-sm truncate">{page.title}</span>
                          {!page.isPublished && (
                            <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">טיוטה</span>
                          )}
                          {pageId === currentPage && (
                            <span className="mr-auto text-green-400">
                              <CheckIcon />
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                  
                  {/* Add New Page Button */}
                  <button
                    onClick={() => {
                      setShowPageDropdown(false);
                      setShowNewPageModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer text-white/70 hover:bg-white/5 hover:text-white mt-1"
                  >
                    <PlusIcon />
                    <span className="text-sm">הוסף עמוד חדש</span>
                  </button>
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
          
          {/* Page Settings Button - Only for internal pages */}
          {isInternalPage && currentInternalPage && (
            <button
              onClick={openPageSettings}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="הגדרות עמוד"
            >
              <SettingsIcon />
            </button>
          )}
        </div>

        {/* Left - Actions */}
        <div className="flex items-center gap-2">
          {/* Import/Export/Save Template */}
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
            <button
              onClick={() => setShowSaveTemplateModal(true)}
              className="px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="שמור כתבנית לשימוש חוזר"
            >
              <TemplateIcon />
              <span>שמור כתבנית</span>
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
              metafields={metafields}
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
            onApplyTemplate={currentPage === 'product' ? applyTemplate : undefined}
            headerLayout={themeSettings.headerLayout}
            currentPage={currentPage}
          />
        </div>
      </div>
      
      {/* New Page Modal */}
      {showNewPageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">עמוד חדש</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם העמוד *
                </label>
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={(e) => handleNewPageTitleChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="אודות, תקנון, צור קשר..."
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  כתובת URL *
                </label>
                <div className="flex">
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-200 rounded-r-lg text-gray-500 text-sm">
                    /pages/
                  </span>
                  <input
                    type="text"
                    value={newPageSlug}
                    onChange={(e) => setNewPageSlug(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-black/10"
                    placeholder="about"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreatePage}
                disabled={isCreatingPage || !newPageTitle.trim() || !newPageSlug.trim()}
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isCreatingPage ? 'יוצר...' : 'צור עמוד'}
              </button>
              <button
                onClick={() => {
                  setShowNewPageModal(false);
                  setNewPageTitle('');
                  setNewPageSlug('');
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Save as Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">שמור כתבנית</h2>
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              שמרו את הסקשנים של העמוד הנוכחי כתבנית לשימוש חוזר בעמודים חדשים.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם התבנית *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="לדוגמה: תבנית אודות"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תיאור (אופציונלי)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
                  placeholder="תיאור קצר לתבנית..."
                />
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{sections.length}</span> סקשנים יישמרו בתבנית
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveAsTemplate}
                disabled={isSavingTemplate || !templateName.trim()}
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSavingTemplate ? 'שומר...' : 'שמור תבנית'}
              </button>
              <button
                onClick={() => {
                  setShowSaveTemplateModal(false);
                  setTemplateName('');
                  setTemplateDescription('');
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Settings Modal */}
      {showPageSettingsModal && currentInternalPage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">הגדרות עמוד</h2>
              <button
                onClick={() => setShowPageSettingsModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם העמוד *
                </label>
                <input
                  type="text"
                  value={pageSettingsForm.title}
                  onChange={(e) => setPageSettingsForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="אודות"
                />
              </div>
              
              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  כתובת URL *
                </label>
                <div className="flex">
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-200 rounded-r-lg text-gray-500 text-sm">
                    /pages/
                  </span>
                  <input
                    type="text"
                    value={pageSettingsForm.slug}
                    onChange={(e) => setPageSettingsForm(prev => ({ ...prev, slug: e.target.value }))}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-black/10"
                    placeholder="about"
                    dir="ltr"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">אפשר להשתמש גם בעברית</p>
              </div>
              
              {/* Publish Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">מצב פרסום</p>
                  <p className="text-xs text-gray-500">
                    {pageSettingsForm.isPublished ? 'העמוד מפורסם ונגיש לכולם' : 'העמוד בטיוטה - לא נגיש לגולשים'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pageSettingsForm.isPublished}
                    onChange={(e) => setPageSettingsForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
              
              {/* SEO Section */}
              <div className="border-t pt-5">
                <p className="text-sm font-medium text-gray-700 mb-3">הגדרות SEO</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      כותרת SEO
                    </label>
                    <input
                      type="text"
                      value={pageSettingsForm.seoTitle}
                      onChange={(e) => setPageSettingsForm(prev => ({ ...prev, seoTitle: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
                      placeholder="כותרת שתוצג בתוצאות החיפוש (אופציונלי)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      תיאור SEO
                    </label>
                    <textarea
                      value={pageSettingsForm.seoDescription}
                      onChange={(e) => setPageSettingsForm(prev => ({ ...prev, seoDescription: e.target.value }))}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
                      placeholder="תיאור קצר שיופיע בתוצאות החיפוש (אופציונלי)"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={handleSavePageSettings}
                disabled={isSavingPageSettings || !pageSettingsForm.title.trim() || !pageSettingsForm.slug.trim()}
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSavingPageSettings ? 'שומר...' : 'שמור'}
              </button>
              <button
                onClick={() => setShowPageSettingsModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
            </div>
            
            {/* Delete Section */}
            <div className="mt-6 pt-4 border-t">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  מחק עמוד
                </button>
              ) : (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-800 mb-3">
                    האם למחוק את העמוד &quot;{currentInternalPage.title}&quot;?
                    <br />
                    <span className="text-xs text-red-600">פעולה זו בלתי הפיכה!</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeletePage}
                      disabled={isDeletingPage}
                      className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isDeletingPage ? 'מוחק...' : 'כן, מחק'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 border border-gray-200 text-sm rounded-lg hover:bg-white transition-colors"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions for default section values
function getSectionDefaultTitle(type: string): string {
  const titles: Record<string, string> = {
    // Home page sections
    hero: 'באנר ראשי',
    categories: 'קטגוריות',
    products: 'מוצרים',
    newsletter: 'ניוזלטר',
    video_banner: 'באנר וידאו',
    split_banner: 'באנר מפוצל',
    contact: 'צור קשר',
    // Product page sections (V2)
    product_gallery: '',
    product_info: '',
    product_description: '',
    product_reviews: 'ביקורות',
    product_related: 'אולי יעניין אותך',
    product_upsells: 'מוצרים נוספים',
    accordion: '',
    tabs: '',
    breadcrumb: '',
    divider: '',
    spacer: '',
  };
  return titles[type] || 'סקשן חדש';
}

function getSectionDefaultContent(type: string): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    hero: { 
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920',
      buttonText: 'לחנות', 
      buttonLink: '/products' 
    },
    banner: {
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920',
      buttonText: 'גלה עוד',
      buttonLink: '/products'
    },
    banner_small: {
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920',
      buttonText: 'קנה עכשיו',
      buttonLink: '/products'
    },
    categories: { limit: 6 },
    products: { type: 'all', limit: 8 },
    newsletter: { 
      placeholder: 'כתובת אימייל', 
      buttonText: 'הרשמה',
      description: 'הירשמו לניוזלטר שלנו וקבלו עדכונים על מבצעים והנחות בלעדיות'
    },
    video_banner: { 
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 
      imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1920',
      buttonText: 'צפה עכשיו',
      buttonLink: '#'
    },
    split_banner: { 
      items: [
        { title: 'קטגוריה 1', imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800', link: '/products' },
        { title: 'קטגוריה 2', imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800', link: '/products' }
      ] 
    },
    text_block: {
      text: '<p>זהו טקסט לדוגמה. ניתן לערוך אותו לפי הצורך ולהוסיף תוכן מותאם אישית לעסק שלכם.</p>',
      buttonText: 'קרא עוד',
      buttonLink: '#'
    },
    image_text: {
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      text: '<p>זהו טקסט לדוגמה שמופיע לצד התמונה. ניתן לערוך אותו ולהתאים לתוכן שלכם.</p>',
      buttonText: 'קרא עוד',
      buttonLink: '#'
    },
    gallery: {
      images: [
        { url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600', alt: 'תמונה 1' },
        { url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600', alt: 'תמונה 2' },
        { url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600', alt: 'תמונה 3' },
        { url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600', alt: 'תמונה 4' }
      ]
    },
    features: {
      items: [
        { icon: 'truck', title: 'משלוח חינם', description: 'משלוח חינם בהזמנה מעל 200₪' },
        { icon: 'shield', title: 'תשלום מאובטח', description: 'כל התשלומים מאובטחים ומוצפנים' },
        { icon: 'refresh', title: 'החזרה קלה', description: '14 ימי החזרה ללא שאלות' }
      ]
    },
    reviews: {
      items: [
        { name: 'לקוח מרוצה', rating: 5, text: 'שירות מעולה ומוצרים איכותיים!', date: new Date().toISOString() }
      ]
    },
    faq: {
      items: [
        { question: 'מהם זמני המשלוח?', answer: 'משלוחים מגיעים תוך 3-5 ימי עסקים.' },
        { question: 'מהי מדיניות ההחזרות?', answer: 'ניתן להחזיר מוצרים תוך 14 יום מרגע הקבלה.' }
      ]
    },
    brands: {
      images: []
    },
    contact: {
      email: 'info@example.com',
      phone: '03-1234567',
      address: 'רחוב הדוגמה 1, תל אביב',
      hours: "ימים א'-ה' 9:00-18:00",
      showForm: true,
      submitButtonText: 'שליחה',
      notificationEmail: '', // אימייל לקבלת התראות
      webhookUrl: '', // כתובת webhook לשליחה
    },
    custom: {
      html: '<div class="text-center p-8"><p>תוכן מותאם אישית</p></div>'
    },
    // Product page sections (V2)
    product_gallery: {},
    product_info: {},
    product_description: {},
    product_reviews: {},
    product_related: {},
    product_upsells: {},
    accordion: {
      items: [
        { id: '1', title: 'מפרט טכני', content: '', isOpen: false, contentSource: 'static' },
        { id: '2', title: 'חומרים', content: '', isOpen: false, contentSource: 'static' },
        { id: '3', title: 'משלוחים והחזרות', content: 'משלוח חינם מעל ₪200. ניתן להחזיר תוך 14 יום.', isOpen: false, contentSource: 'static' },
      ]
    },
    tabs: {
      items: [
        { id: '1', title: 'פרטים', content: '', contentSource: 'dynamic', dynamicField: 'product.description' },
        { id: '2', title: 'מפרט', content: '', contentSource: 'static' },
        { id: '3', title: 'משלוח', content: 'משלוח תוך 3-5 ימי עסקים.', contentSource: 'static' },
      ]
    },
    breadcrumb: {},
    divider: {},
    spacer: {},
    video: {
      videoUrl: '',
    }
  };
  return defaults[type] || {};
}

function getSectionDefaultSettings(type: string): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    // Home page sections
    hero: { height: '90vh', overlay: 0.3 },
    categories: { columns: 4, gap: 8 },
    products: { columns: 4, gap: 8, showCount: false },
    newsletter: { maxWidth: '600px' },
    video_banner: { height: '80vh', overlay: 0.4 },
    split_banner: { height: '60vh' },
    contact: { layout: 'split', maxWidth: 'xl', textAlign: 'right', paddingY: 'large' },
    // Product page sections (V2)
    product_gallery: {
      layout: 'carousel',
      thumbnailsPosition: 'bottom',
      thumbnailsPositionMobile: 'bottom',
      aspectRatio: '3:4',
      enableZoom: true,
      showArrows: true,
      showDotsOnMobile: false,
    },
    product_info: {
      showComparePrice: true,
      showDiscount: true,
      discountStyle: 'badge',
      inventoryDisplay: 'count',
      lowStockThreshold: 5,
    },
    product_description: {
      style: 'text',
    },
    product_reviews: {
      showRating: true,
      showCount: true,
      showPhotos: true,
      style: 'list',
    },
    product_related: {
      count: 4,
      source: 'same_category',
      showIfEmpty: false,
    },
    product_upsells: {
      count: 4,
    },
    accordion: {
      allowMultiple: false,
      style: 'bordered',
    },
    tabs: {
      style: 'underline',
      alignment: 'right',
    },
    breadcrumb: {
      showHome: true,
      showCategory: true,
      separator: '/',
    },
    divider: {},
    spacer: { height: '40px' },
    video: { autoplay: false, controls: true },
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

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function TemplateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="4" />
      <rect x="14" y="10" width="7" height="11" />
      <rect x="3" y="13" width="7" height="8" />
    </svg>
  );
}
