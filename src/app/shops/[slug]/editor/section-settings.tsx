'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MediaPickerModal, type MediaItem } from '@/components/admin/media-picker-modal';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { TypographyPopover } from '@/components/admin/typography-popover';
import { 
  defaultCategoryPageSettings, 
  type CategoryPageSettings,
  type AspectRatio
} from '@/lib/category-page-settings';

// ============================================
// Section Settings - Right Panel (Shopify Style) - עברית
// ============================================

interface Section {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

type HeaderLayout = 'logo-right' | 'logo-left' | 'logo-center';

// Store info for logo/favicon uploads
interface StoreInfo {
  id: string;
  slug: string;
  logoUrl: string | null;
  faviconUrl: string | null;
}

// Store theme settings interface
interface ThemeSettings {
  // Header settings
  headerLayout?: HeaderLayout;
  headerSticky?: boolean;
  headerTransparent?: boolean;
  headerShowSearch?: boolean;
  headerShowCart?: boolean;
  headerShowAccount?: boolean;
  headerNavigationMode?: 'menu' | 'categories'; // 'menu' = show custom menus, 'categories' = show all categories
  
  // Mobile menu settings
  mobileMenuShowImages?: boolean;
  mobileMenuImageStyle?: 'fullRow' | 'square'; // fullRow = full width with overlay text, square = small square image with text
  mobileMenuBgColor?: string; // Mobile sidebar background color
  megaMenuBgColor?: string; // Mega menu dropdown background color
  
  // Logo & Favicon (direct store fields, not in settings jsonb)
  logoUrl?: string;
  faviconUrl?: string;
  
  // Announcement bar settings
  announcementEnabled?: boolean;
  announcementText?: string;
  announcementLink?: string;
  announcementBgColor?: string;
  announcementTextColor?: string;
  
  // Footer settings
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
  
  // Social links
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

interface SectionSettingsProps {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
  onRemove: () => void;
  // Theme settings props
  themeSettings?: ThemeSettings;
  onThemeSettingsChange?: (settings: Partial<ThemeSettings>) => void;
  // Categories for picker
  categories?: Category[];
  // Store info for logo/favicon uploads
  storeInfo?: StoreInfo;
}

// Helper functions for typography settings conversion
const SIZE_TO_PX: Record<string, number> = {
  'xs': 12, 'sm': 14, 'md': 16, 'lg': 18, 'xl': 20,
  '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48,
};

const WEIGHT_MAP: Record<string, 'light' | 'normal' | 'medium' | 'bold' | 'extrabold'> = {
  'light': 'light', 'normal': 'normal', 'medium': 'medium',
  'semibold': 'bold', 'bold': 'bold', 'extrabold': 'extrabold',
};

// Convert old size string to px number
function sizeToPx(size: unknown, defaultPx: number = 16): number {
  if (typeof size === 'number') return size;
  if (typeof size === 'string' && SIZE_TO_PX[size]) return SIZE_TO_PX[size];
  return defaultPx;
}

// Convert old weight to new format
function mapWeight(weight: unknown, defaultWeight: 'light' | 'normal' | 'medium' | 'bold' | 'extrabold' = 'normal') {
  if (typeof weight === 'string' && WEIGHT_MAP[weight]) return WEIGHT_MAP[weight];
  return defaultWeight;
}

export function SectionSettings({ section, onUpdate, onRemove, themeSettings, onThemeSettingsChange, categories = [], storeInfo }: SectionSettingsProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'design'>('content');
  const settings = themeSettings || {};
  const updateSettings = onThemeSettingsChange || (() => {});
  
  // Get current logo/favicon from settings or store
  const currentLogoUrl = settings.logoUrl ?? storeInfo?.logoUrl ?? '';
  const currentFaviconUrl = settings.faviconUrl ?? storeInfo?.faviconUrl ?? '';

  const getSectionTitle = () => {
    const titles: Record<string, string> = {
      hero: 'באנר ראשי',
      categories: 'רשימת קטגוריות',
      products: 'מוצרים נבחרים',
      newsletter: 'ניוזלטר',
      video_banner: 'באנר וידאו',
      split_banner: 'תמונה עם טקסט',
      header: 'הדר',
      'announcement-bar': 'פס הודעות',
      footer: 'פוטר',
    };
    return titles[section.type] || 'סקשן';
  };

  // Special handling for header settings
  if (section.type === 'header') {
    return (
      <div className="flex flex-col h-full" dir="rtl">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">הגדרות הדר</h3>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6">
          {/* Logo & Favicon */}
          <SettingsGroup title="לוגו ואייקון">
            <LogoUploadField
              label="לוגו"
              value={currentLogoUrl}
              onChange={(url) => updateSettings({ logoUrl: url })}
              storeId={storeInfo?.id}
              storeSlug={storeInfo?.slug}
              hint="PNG שקוף מומלץ, רוחב מינימלי 200px"
            />
            <LogoUploadField
              label="Favicon"
              value={currentFaviconUrl}
              onChange={(url) => updateSettings({ faviconUrl: url })}
              storeId={storeInfo?.id}
              storeSlug={storeInfo?.slug}
              aspectRatio="1:1"
              hint="32x32 או 64x64 פיקסלים"
            />
          </SettingsGroup>

          {/* Layout Selection */}
          <HeaderLayoutSettings 
            currentLayout={settings.headerLayout || 'logo-right'} 
            onLayoutChange={(layout) => updateSettings({ headerLayout: layout })} 
          />
          
          {/* Navigation Mode */}
          <SettingsGroup title="ניווט">
            <div className="space-y-3">
              <p className="text-xs text-gray-500">בחרו מה יוצג בתפריט הראשי</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors" style={{
                  borderColor: (settings.headerNavigationMode || 'menu') === 'menu' ? '#000' : '#e5e7eb',
                  backgroundColor: (settings.headerNavigationMode || 'menu') === 'menu' ? '#f9fafb' : 'transparent'
                }}>
                  <input
                    type="radio"
                    name="navigationMode"
                    checked={(settings.headerNavigationMode || 'menu') === 'menu'}
                    onChange={() => updateSettings({ headerNavigationMode: 'menu' })}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">תפריט מותאם</p>
                    <p className="text-xs text-gray-500">הצג את התפריט שנוצר בניהול ניווט</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors" style={{
                  borderColor: settings.headerNavigationMode === 'categories' ? '#000' : '#e5e7eb',
                  backgroundColor: settings.headerNavigationMode === 'categories' ? '#f9fafb' : 'transparent'
                }}>
                  <input
                    type="radio"
                    name="navigationMode"
                    checked={settings.headerNavigationMode === 'categories'}
                    onChange={() => updateSettings({ headerNavigationMode: 'categories' })}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">כל הקטגוריות</p>
                    <p className="text-xs text-gray-500">הצג את כל הקטגוריות אוטומטית</p>
                  </div>
                </label>
              </div>
            </div>
          </SettingsGroup>

          {/* Mobile Menu Settings */}
          <SettingsGroup title="תפריט מובייל">
            <SwitchField
              label="הצג תמונות במובייל"
              description="הצג תמונות לצד פריטי התפריט במובייל"
              value={settings.mobileMenuShowImages ?? false}
              onChange={(v) => updateSettings({ mobileMenuShowImages: v })}
            />
            
            {settings.mobileMenuShowImages && (
              <div className="space-y-3 mt-3">
                <p className="text-xs text-gray-500">סגנון תמונות</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors" style={{
                    borderColor: (settings.mobileMenuImageStyle || 'square') === 'square' ? '#000' : '#e5e7eb',
                    backgroundColor: (settings.mobileMenuImageStyle || 'square') === 'square' ? '#f9fafb' : 'transparent'
                  }}>
                    <input
                      type="radio"
                      name="mobileImageStyle"
                      checked={(settings.mobileMenuImageStyle || 'square') === 'square'}
                      onChange={() => updateSettings({ mobileMenuImageStyle: 'square' })}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">תמונה ריבועית</p>
                      <p className="text-xs text-gray-500">תמונה קטנה עם כיתוב לידה</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors" style={{
                    borderColor: settings.mobileMenuImageStyle === 'fullRow' ? '#000' : '#e5e7eb',
                    backgroundColor: settings.mobileMenuImageStyle === 'fullRow' ? '#f9fafb' : 'transparent'
                  }}>
                    <input
                      type="radio"
                      name="mobileImageStyle"
                      checked={settings.mobileMenuImageStyle === 'fullRow'}
                      onChange={() => updateSettings({ mobileMenuImageStyle: 'fullRow' })}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">תמונה ברוחב מלא</p>
                      <p className="text-xs text-gray-500">תמונה על כל השורה עם כיתוב עליה</p>
                    </div>
                  </label>
                </div>
              </div>
            )}
            
            <ColorField
              label="צבע רקע תפריט מובייל"
              value={settings.mobileMenuBgColor || '#f9fafb'}
              onChange={(v) => updateSettings({ mobileMenuBgColor: v })}
            />
            
            <ColorField
              label="צבע רקע מגה מניו"
              value={settings.megaMenuBgColor || '#f9fafb'}
              onChange={(v) => updateSettings({ megaMenuBgColor: v })}
            />
          </SettingsGroup>
          
          {/* Header Options */}
          <SettingsGroup title="אפשרויות הדר">
            <SwitchField
              label="הדר נדבק"
              description="ההדר יישאר למעלה בזמן גלילה"
              value={settings.headerSticky ?? true}
              onChange={(v) => updateSettings({ headerSticky: v })}
            />
            <SwitchField
              label="רקע שקוף"
              description="רקע שקוף בראש העמוד (רק בדף הבית)"
              value={settings.headerTransparent ?? false}
              onChange={(v) => updateSettings({ headerTransparent: v })}
            />
          </SettingsGroup>
          
          {/* Show/Hide Elements */}
          <SettingsGroup title="אלמנטים">
            <SwitchField
              label="הצג חיפוש"
              value={settings.headerShowSearch ?? true}
              onChange={(v) => updateSettings({ headerShowSearch: v })}
            />
            <SwitchField
              label="הצג עגלה"
              value={settings.headerShowCart ?? true}
              onChange={(v) => updateSettings({ headerShowCart: v })}
            />
            <SwitchField
              label="הצג חשבון"
              value={settings.headerShowAccount ?? true}
              onChange={(v) => updateSettings({ headerShowAccount: v })}
            />
          </SettingsGroup>
        </div>
      </div>
    );
  }

  // Special handling for announcement bar settings
  if (section.type === 'announcement-bar') {
    return (
      <div className="flex flex-col h-full" dir="rtl">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">פס הודעות</h3>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6">
          <SettingsGroup title="הגדרות">
            <SwitchField
              label="הצג פס הודעות"
              value={settings.announcementEnabled ?? false}
              onChange={(v) => updateSettings({ announcementEnabled: v })}
            />
          </SettingsGroup>
          
          {settings.announcementEnabled && (
            <>
              <SettingsGroup title="תוכן">
                <TextAreaField
                  label="טקסט ההודעה"
                  value={settings.announcementText || ''}
                  onChange={(v) => updateSettings({ announcementText: v })}
                  placeholder="משלוח חינם בקניה מעל ₪200!&#10;חדש! קולקציית קיץ 2026&#10;20% הנחה לחברי מועדון"
                  hint="כל שורה = הודעה נפרדת (מתחלפת אוטומטית)"
                />
                <TextField
                  label="קישור (אופציונלי)"
                  value={settings.announcementLink || ''}
                  onChange={(v) => updateSettings({ announcementLink: v })}
                  placeholder="/products"
                />
              </SettingsGroup>
              
              <SettingsGroup title="צבעים">
                <ColorField
                  label="צבע רקע"
                  value={settings.announcementBgColor || '#000000'}
                  onChange={(v) => updateSettings({ announcementBgColor: v })}
                />
                <ColorField
                  label="צבע טקסט"
                  value={settings.announcementTextColor || '#ffffff'}
                  onChange={(v) => updateSettings({ announcementTextColor: v })}
                />
              </SettingsGroup>
            </>
          )}
        </div>
      </div>
    );
  }

  // Special handling for footer settings
  if (section.type === 'footer') {
    return (
      <div className="flex flex-col h-full" dir="rtl">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">הגדרות פוטר</h3>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6">
          {/* Display Options */}
          <SettingsGroup title="אלמנטים להצגה">
            <SwitchField
              label="הצג לוגו"
              value={settings.footerShowLogo ?? true}
              onChange={(v) => updateSettings({ footerShowLogo: v })}
            />
            <SwitchField
              label="הצג קטגוריות"
              value={settings.footerShowCategories ?? true}
              onChange={(v) => updateSettings({ footerShowCategories: v })}
            />
            <SwitchField
              label="הצג תפריט תחתון"
              value={settings.footerShowMenu ?? true}
              onChange={(v) => updateSettings({ footerShowMenu: v })}
            />
            <SwitchField
              label="הצג טופס ניוזלטר"
              value={settings.footerShowNewsletter ?? true}
              onChange={(v) => updateSettings({ footerShowNewsletter: v })}
            />
            <SwitchField
              label="הצג רשתות חברתיות"
              value={settings.footerShowSocial ?? true}
              onChange={(v) => updateSettings({ footerShowSocial: v })}
            />
            <SwitchField
              label="הצג אמצעי תשלום"
              value={settings.footerShowPayments ?? true}
              onChange={(v) => updateSettings({ footerShowPayments: v })}
            />
          </SettingsGroup>

          {/* Newsletter */}
          {settings.footerShowNewsletter && (
            <SettingsGroup title="ניוזלטר">
              <TextField
                label="כותרת"
                value={settings.footerNewsletterTitle || ''}
                onChange={(v) => updateSettings({ footerNewsletterTitle: v })}
                placeholder="הירשמו לניוזלטר"
              />
              <TextField
                label="תת-כותרת"
                value={settings.footerNewsletterSubtitle || ''}
                onChange={(v) => updateSettings({ footerNewsletterSubtitle: v })}
                placeholder="קבלו עדכונים על מוצרים חדשים והנחות"
                multiline
              />
            </SettingsGroup>
          )}

          {/* Social Links */}
          {settings.footerShowSocial && (
            <SettingsGroup title="רשתות חברתיות">
              <TextField
                label="Facebook"
                value={settings.socialFacebook || ''}
                onChange={(v) => updateSettings({ socialFacebook: v })}
                placeholder="https://facebook.com/..."
              />
              <TextField
                label="Instagram"
                value={settings.socialInstagram || ''}
                onChange={(v) => updateSettings({ socialInstagram: v })}
                placeholder="https://instagram.com/..."
              />
              <TextField
                label="TikTok"
                value={settings.socialTiktok || ''}
                onChange={(v) => updateSettings({ socialTiktok: v })}
                placeholder="https://tiktok.com/..."
              />
              <TextField
                label="YouTube"
                value={settings.socialYoutube || ''}
                onChange={(v) => updateSettings({ socialYoutube: v })}
                placeholder="https://youtube.com/..."
              />
            </SettingsGroup>
          )}

          {/* Copyright */}
          <SettingsGroup title="זכויות יוצרים">
            <TextField
              label="טקסט Copyright"
              value={settings.footerCopyright || ''}
              onChange={(v) => updateSettings({ footerCopyright: v })}
              placeholder="© 2026 שם החנות. כל הזכויות שמורות."
            />
          </SettingsGroup>

          {/* Colors */}
          <SettingsGroup title="צבעים">
            <ColorField
              label="צבע רקע"
              value={settings.footerBgColor || '#111111'}
              onChange={(v) => updateSettings({ footerBgColor: v })}
            />
            <ColorField
              label="צבע טקסט"
              value={settings.footerTextColor || '#ffffff'}
              onChange={(v) => updateSettings({ footerTextColor: v })}
            />
          </SettingsGroup>
        </div>
      </div>
    );
  }

  // Special handling for product page settings (general settings)
  if (section.type === 'product-page') {
    return <ProductPageSettingsUI settings={settings as Record<string, unknown>} updateSettings={updateSettings as (settings: Record<string, unknown>) => void} initialTab="gallery" />;
  }
  
  // Handle individual product page sections - show focused settings for each
  if (section.type.startsWith('pp-')) {
    return (
      <ProductPageSectionSettings 
        sectionType={section.type}
        settings={settings as Record<string, unknown>} 
        updateSettings={updateSettings as (settings: Record<string, unknown>) => void} 
      />
    );
  }

  // Handle category page sections
  if (section.type.startsWith('cp-')) {
    return (
      <CategoryPageSectionSettings 
        sectionType={section.type}
        settings={settings as Record<string, unknown>} 
        updateSettings={updateSettings as (settings: Record<string, unknown>) => void} 
      />
    );
  }

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header with tabs */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">{getSectionTitle()}</h3>
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreIcon />
          </button>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('content')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'content' ? 'bg-white shadow-sm' : 'text-gray-600'
            }`}
          >
            תוכן
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'design' ? 'bg-white shadow-sm' : 'text-gray-600'
            }`}
          >
            עיצוב
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'content' ? (
          <ContentSettings section={section} onUpdate={onUpdate} categories={categories} storeInfo={storeInfo} />
        ) : (
          <DesignSettings section={section} onUpdate={onUpdate} />
        )}
      </div>

      {/* Remove Section */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onRemove}
          className="w-full flex items-center justify-center gap-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <TrashIcon />
          <span className="text-sm">הסר סקשן</span>
        </button>
      </div>
    </div>
  );
}

// Content Settings (varies by section type)
function ContentSettings({ 
  section, 
  onUpdate,
  categories = [],
  storeInfo,
}: { 
  section: Section; 
  onUpdate: (updates: Partial<Section>) => void;
  categories?: Category[];
  storeInfo?: StoreInfo;
}) {
  const handleTitleChange = (value: string) => {
    onUpdate({ title: value || null });
  };

  const handleSubtitleChange = (value: string) => {
    onUpdate({ subtitle: value || null });
  };

  const updateContent = (key: string, value: unknown) => {
    onUpdate({
      content: { ...section.content, [key]: value }
    });
  };

  const updateSettings = (key: string, value: unknown) => {
    onUpdate({
      settings: { ...section.settings, [key]: value }
    });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Section Header */}
      <SettingsGroup title="כותרת סקשן">
        <TextField
          label="כותרת"
          value={section.title || ''}
          onChange={handleTitleChange}
          placeholder="הזן כותרת"
        />
        <TextField
          label="תת-כותרת"
          value={section.subtitle || ''}
          onChange={handleSubtitleChange}
          multiline
          placeholder="הזן תת-כותרת"
        />
        <ToggleField
          label="יישור טקסט"
          options={['ימין', 'מרכז', 'שמאל']}
          value={(section.settings.textAlign as string) === 'right' ? 'ימין' : (section.settings.textAlign as string) === 'left' ? 'שמאל' : 'מרכז'}
          onChange={(v) => updateSettings('textAlign', v === 'ימין' ? 'right' : v === 'שמאל' ? 'left' : 'center')}
        />
      </SettingsGroup>

      {/* Type-specific content */}
      {section.type === 'hero' && (
        <HeroContentSettings section={section} onUpdate={onUpdate} storeInfo={storeInfo} />
      )}
      {section.type === 'categories' && (
        <CategoriesContentSettings section={section} onUpdate={onUpdate} categories={categories} />
      )}
      {section.type === 'products' && (
        <ProductsContentSettings section={section} onUpdate={onUpdate} categories={categories} />
      )}
      {section.type === 'newsletter' && (
        <NewsletterContentSettings section={section} onUpdate={onUpdate} />
      )}
      {section.type === 'split_banner' && (
        <SplitBannerContentSettings section={section} onUpdate={onUpdate} storeInfo={storeInfo} />
      )}
      {section.type === 'video_banner' && (
        <VideoBannerContentSettings section={section} onUpdate={onUpdate} storeInfo={storeInfo} />
      )}
      {/* New section types */}
      {section.type === 'reviews' && (
        <ReviewsContentSettings section={section} onUpdate={onUpdate} />
      )}
      {section.type === 'image_text' && (
        <ImageTextContentSettings section={section} onUpdate={onUpdate} storeInfo={storeInfo} />
      )}
      {section.type === 'features' && (
        <FeaturesContentSettings section={section} onUpdate={onUpdate} />
      )}
      {section.type === 'banner_small' && (
        <BannerSmallContentSettings section={section} onUpdate={onUpdate} />
      )}
      {section.type === 'gallery' && (
        <GalleryContentSettings section={section} onUpdate={onUpdate} storeInfo={storeInfo} />
      )}
      {section.type === 'text_block' && (
        <TextBlockContentSettings section={section} onUpdate={onUpdate} />
      )}
      {section.type === 'logos' && (
        <LogosContentSettings section={section} onUpdate={onUpdate} storeInfo={storeInfo} />
      )}
      {section.type === 'faq' && (
        <FAQContentSettings section={section} onUpdate={onUpdate} />
      )}
      {section.type === 'contact' && (
        <ContactContentSettings section={section} onUpdate={onUpdate} />
      )}
      {/* Argania Premium section types */}
      {section.type === 'hero_premium' && (
        <HeroPremiumContentSettings section={section} onUpdate={onUpdate} storeInfo={storeInfo} />
      )}
      {section.type === 'series_grid' && (
        <SeriesGridContentSettings section={section} onUpdate={onUpdate} storeInfo={storeInfo} />
      )}
      {section.type === 'quote_banner' && (
        <QuoteBannerContentSettings section={section} onUpdate={onUpdate} storeInfo={storeInfo} />
      )}
      {section.type === 'featured_items' && (
        <FeaturedItemsContentSettings section={section} onUpdate={onUpdate} storeInfo={storeInfo} />
      )}
    </div>
  );
}

// Design Settings
function DesignSettings({ 
  section, 
  onUpdate 
}: { 
  section: Section; 
  onUpdate: (updates: Partial<Section>) => void;
}) {
  const updateSettings = (key: string, value: unknown) => {
    onUpdate({
      settings: { ...section.settings, [key]: value }
    });
  };

  // Hero-specific design settings
  if (section.type === 'hero') {
    return (
      <div className="p-4 space-y-6">
        <SettingsGroup title="טיפוגרפיה">
          <TypographyPopover
            label="כותרת"
            value={{
              color: (section.settings.titleColor as string) || '#ffffff',
              fontSize: sizeToPx(section.settings.titleSize, 48),
              fontWeight: mapWeight(section.settings.titleWeight, 'bold'),
            }}
            onChange={(typography) => {
              updateSettings('titleColor', typography.color);
              updateSettings('titleSize', typography.fontSize);
              updateSettings('titleWeight', typography.fontWeight);
            }}
            defaultColor="#ffffff"
          />
          <TypographyPopover
            label="תת-כותרת"
            value={{
              color: (section.settings.subtitleColor as string) || 'rgba(255,255,255,0.9)',
              fontSize: sizeToPx(section.settings.subtitleSize, 18),
              fontWeight: mapWeight(section.settings.subtitleWeight, 'normal'),
            }}
            onChange={(typography) => {
              updateSettings('subtitleColor', typography.color);
              updateSettings('subtitleSize', typography.fontSize);
              updateSettings('subtitleWeight', typography.fontWeight);
            }}
            defaultColor="rgba(255,255,255,0.9)"
          />
        </SettingsGroup>

        <SettingsGroup title="מיקום טקסט">
          <ToggleField
            label="יישור אופקי"
            options={['ימין', 'מרכז', 'שמאל']}
            value={(section.settings.textAlign as string) === 'right' ? 'ימין' : (section.settings.textAlign as string) === 'left' ? 'שמאל' : 'מרכז'}
            onChange={(v) => updateSettings('textAlign', v === 'ימין' ? 'right' : v === 'שמאל' ? 'left' : 'center')}
          />
          <ToggleField
            label="יישור אנכי"
            options={['למעלה', 'מרכז', 'למטה']}
            value={(section.settings.textPosition as string) === 'top' ? 'למעלה' : (section.settings.textPosition as string) === 'bottom' ? 'למטה' : 'מרכז'}
            onChange={(v) => updateSettings('textPosition', v === 'למעלה' ? 'top' : v === 'למטה' ? 'bottom' : 'center')}
          />
        </SettingsGroup>

        <SettingsGroup title="שכבה וצבעים">
          <SliderField
            label="שקיפות שכבה כהה"
            value={Math.round(((section.settings.overlay as number) || 0.3) * 100)}
            min={0}
            max={100}
            suffix="%"
            onChange={(v) => updateSettings('overlay', v / 100)}
          />
          <ColorField
            label="צבע רקע (אם אין תמונה)"
            value={(section.settings.backgroundColor as string) || 'transparent'}
            onChange={(v) => updateSettings('backgroundColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב כפתור">
          <ColorField
            label="צבע רקע"
            value={(section.settings.buttonBackground as string) || '#FFFFFF'}
            onChange={(v) => updateSettings('buttonBackground', v)}
          />
          <ColorField
            label="צבע טקסט"
            value={(section.settings.buttonTextColor as string) || '#000000'}
            onChange={(v) => updateSettings('buttonTextColor', v)}
          />
          <ColorField
            label="צבע מסגרת"
            value={(section.settings.buttonBorderColor as string) || '#FFFFFF'}
            onChange={(v) => updateSettings('buttonBorderColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="מיכל ופריסה">
          <SelectField
            label="רוחב תוכן"
            value={(section.settings.containerType as string) || 'container'}
            options={[
              { value: 'container', label: 'קונטיינר' },
              { value: 'full', label: 'רוחב מלא' },
            ]}
            onChange={(v) => updateSettings('containerType', v)}
          />
          <SliderField
            label="ריווח עליון"
            value={(section.settings.paddingTop as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('paddingTop', v)}
          />
          <SliderField
            label="ריווח תחתון"
            value={(section.settings.paddingBottom as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('paddingBottom', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="מתקדם">
          <TextField
            label="Class מותאם"
            value={(section.settings.customClass as string) || ''}
            onChange={(v) => updateSettings('customClass', v)}
            placeholder="my-custom-class"
          />
          <TextField
            label="ID מותאם"
            value={(section.settings.customId as string) || ''}
            onChange={(v) => updateSettings('customId', v)}
            placeholder="my-custom-id"
          />
          <TextField
            label="CSS מותאם"
            value={(section.settings.customCss as string) || ''}
            onChange={(v) => updateSettings('customCss', v)}
            multiline
            placeholder="color: red; font-size: 20px;"
          />
        </SettingsGroup>
      </div>
    );
  }

  // Image + Text design settings
  if (section.type === 'image_text') {
    return (
      <div className="p-4 space-y-6">
        <SettingsGroup title="תמונה">
          <SelectField
            label="מיקום תמונה"
            value={(section.settings.imagePosition as string) || 'right'}
            options={[
              { value: 'right', label: 'ימין' },
              { value: 'left', label: 'שמאל' },
            ]}
            onChange={(v) => updateSettings('imagePosition', v)}
          />
          <SelectField
            label="רוחב תמונה"
            value={(section.settings.imageWidth as string) || '50%'}
            options={[
              { value: '40%', label: '40%' },
              { value: '50%', label: '50%' },
              { value: '60%', label: '60%' },
            ]}
            onChange={(v) => updateSettings('imageWidth', v)}
          />
          <SliderField
            label="שקיפות שכבה כהה"
            value={Math.round(((section.settings.overlay as number) || 0) * 100)}
            min={0}
            max={100}
            suffix="%"
            onChange={(v) => updateSettings('overlay', v / 100)}
          />
        </SettingsGroup>

        <SettingsGroup title="טיפוגרפיה">
          <TypographyPopover
            label="כותרת"
            value={{
              color: (section.settings.titleColor as string) || '#000000',
              fontSize: sizeToPx(section.settings.titleSize, 18),
              fontWeight: mapWeight(section.settings.titleWeight, 'light'),
            }}
            onChange={(typography) => {
              updateSettings('titleColor', typography.color);
              updateSettings('titleSize', typography.fontSize);
              updateSettings('titleWeight', typography.fontWeight);
            }}
            defaultColor="#000000"
          />
          <TypographyPopover
            label="תת-כותרת"
            value={{
              color: (section.settings.subtitleColor as string) || '#4b5563',
              fontSize: sizeToPx(section.settings.subtitleSize, 18),
              fontWeight: mapWeight(section.settings.subtitleWeight, 'normal'),
            }}
            onChange={(typography) => {
              updateSettings('subtitleColor', typography.color);
              updateSettings('subtitleSize', typography.fontSize);
              updateSettings('subtitleWeight', typography.fontWeight);
            }}
            defaultColor="#4b5563"
          />
          <TypographyPopover
            label="תוכן"
            value={{
              color: (section.settings.textColor as string) || '#4b5563',
              fontSize: sizeToPx(section.settings.textSize, 14),
            }}
            onChange={(typography) => {
              updateSettings('textColor', typography.color);
              updateSettings('textSize', typography.fontSize);
            }}
            defaultColor="#4b5563"
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב כפתור">
          <ColorField
            label="צבע טקסט"
            value={(section.settings.buttonTextColor as string) || '#000000'}
            onChange={(v) => updateSettings('buttonTextColor', v)}
          />
          <ColorField
            label="צבע רקע"
            value={(section.settings.buttonBackgroundColor as string) || 'transparent'}
            onChange={(v) => updateSettings('buttonBackgroundColor', v)}
          />
          <ColorField
            label="צבע מסגרת"
            value={(section.settings.buttonBorderColor as string) || '#000000'}
            onChange={(v) => updateSettings('buttonBorderColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="צבע רקע">
          <ColorField
            label="צבע רקע סקשן"
            value={(section.settings.backgroundColor as string) || 'transparent'}
            onChange={(v) => updateSettings('backgroundColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="ריווחים">
          <SliderField
            label="ריווח עליון"
            value={(section.settings.marginTop as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginTop', v)}
          />
          <SliderField
            label="ריווח תחתון"
            value={(section.settings.marginBottom as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginBottom', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="מתקדם">
          <TextField
            label="Class מותאם"
            value={(section.settings.customClass as string) || ''}
            onChange={(v) => updateSettings('customClass', v)}
            placeholder="my-custom-class"
          />
          <TextField
            label="ID מותאם"
            value={(section.settings.customId as string) || ''}
            onChange={(v) => updateSettings('customId', v)}
            placeholder="my-custom-id"
          />
          <TextField
            label="CSS מותאם"
            value={(section.settings.customCss as string) || ''}
            onChange={(v) => updateSettings('customCss', v)}
            multiline
            placeholder="color: red; font-size: 20px;"
          />
        </SettingsGroup>
      </div>
    );
  }

  // Video Banner design settings
  if (section.type === 'video_banner') {
    return (
      <div className="p-4 space-y-6">
        <SettingsGroup title="וידאו והגדרות">
          <SliderField
            label="גובה"
            value={parseInt((section.settings.height as string)?.replace('vh', '') || '80')}
            min={30}
            max={100}
            suffix="vh"
            onChange={(v) => updateSettings('height', `${v}vh`)}
          />
          <SliderField
            label="שקיפות שכבה כהה"
            value={Math.round(((section.settings.overlay as number) || 0.2) * 100)}
            min={0}
            max={100}
            suffix="%"
            onChange={(v) => updateSettings('overlay', v / 100)}
          />
          <ColorField
            label="צבע רקע (אם אין מדיה)"
            value={(section.settings.backgroundColor as string) || '#000000'}
            onChange={(v) => updateSettings('backgroundColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="הגדרות נגן">
          <div className="flex items-center justify-between">
            <span className="text-sm">נגינה אוטומטית</span>
            <input
              type="checkbox"
              checked={(section.settings.autoplay as boolean) ?? true}
              onChange={(e) => updateSettings('autoplay', e.target.checked)}
              className="h-4 w-4"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">לופ</span>
            <input
              type="checkbox"
              checked={(section.settings.loop as boolean) ?? true}
              onChange={(e) => updateSettings('loop', e.target.checked)}
              className="h-4 w-4"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">השתקה</span>
            <input
              type="checkbox"
              checked={(section.settings.muted as boolean) ?? true}
              onChange={(e) => updateSettings('muted', e.target.checked)}
              className="h-4 w-4"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">הצג פקדים</span>
            <input
              type="checkbox"
              checked={(section.settings.controls as boolean) ?? false}
              onChange={(e) => updateSettings('controls', e.target.checked)}
              className="h-4 w-4"
            />
          </div>
        </SettingsGroup>

        <SettingsGroup title="עיצוב טקסט">
          <ToggleField
            label="יישור טקסט"
            options={['ימין', 'מרכז', 'שמאל']}
            value={(section.settings.textAlign as string) === 'right' ? 'ימין' : (section.settings.textAlign as string) === 'left' ? 'שמאל' : 'מרכז'}
            onChange={(v) => updateSettings('textAlign', v === 'ימין' ? 'right' : v === 'שמאל' ? 'left' : 'center')}
          />
          <ToggleField
            label="מיקום טקסט"
            options={['למעלה', 'מרכז', 'למטה']}
            value={(section.settings.textPosition as string) === 'top' ? 'למעלה' : (section.settings.textPosition as string) === 'bottom' ? 'למטה' : 'מרכז'}
            onChange={(v) => updateSettings('textPosition', v === 'למעלה' ? 'top' : v === 'למטה' ? 'bottom' : 'center')}
          />
        </SettingsGroup>

        <SettingsGroup title="טיפוגרפיה">
          <TypographyPopover
            label="כותרת"
            value={{
              color: (section.settings.titleColor as string) || '#ffffff',
              fontSize: sizeToPx(section.settings.titleSize, 18),
              fontWeight: mapWeight(section.settings.titleWeight, 'light'),
            }}
            onChange={(typography) => {
              updateSettings('titleColor', typography.color);
              updateSettings('titleSize', typography.fontSize);
              updateSettings('titleWeight', typography.fontWeight);
            }}
            defaultColor="#ffffff"
          />
          <TypographyPopover
            label="תת-כותרת"
            value={{
              color: (section.settings.subtitleColor as string) || 'rgba(255,255,255,0.8)',
              fontSize: sizeToPx(section.settings.subtitleSize, 14),
              fontWeight: mapWeight(section.settings.subtitleWeight, 'normal'),
            }}
            onChange={(typography) => {
              updateSettings('subtitleColor', typography.color);
              updateSettings('subtitleSize', typography.fontSize);
              updateSettings('subtitleWeight', typography.fontWeight);
            }}
            defaultColor="rgba(255,255,255,0.8)"
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב כפתור">
          <ColorField
            label="צבע טקסט"
            value={(section.settings.buttonTextColor as string) || '#ffffff'}
            onChange={(v) => updateSettings('buttonTextColor', v)}
          />
          <ColorField
            label="צבע רקע"
            value={(section.settings.buttonBackgroundColor as string) || 'transparent'}
            onChange={(v) => updateSettings('buttonBackgroundColor', v)}
          />
          <ColorField
            label="צבע מסגרת"
            value={(section.settings.buttonBorderColor as string) || '#ffffff'}
            onChange={(v) => updateSettings('buttonBorderColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="ריווחים">
          <SliderField
            label="ריווח עליון"
            value={(section.settings.marginTop as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginTop', v)}
          />
          <SliderField
            label="ריווח תחתון"
            value={(section.settings.marginBottom as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginBottom', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="מתקדם">
          <TextField
            label="Class מותאם"
            value={(section.settings.customClass as string) || ''}
            onChange={(v) => updateSettings('customClass', v)}
            placeholder="my-custom-class"
          />
          <TextField
            label="ID מותאם"
            value={(section.settings.customId as string) || ''}
            onChange={(v) => updateSettings('customId', v)}
            placeholder="my-custom-id"
          />
          <TextField
            label="CSS מותאם"
            value={(section.settings.customCss as string) || ''}
            onChange={(v) => updateSettings('customCss', v)}
            multiline
            placeholder="color: red; font-size: 20px;"
          />
        </SettingsGroup>
      </div>
    );
  }

  // Split Banner design settings
  if (section.type === 'split_banner') {
    return (
      <div className="p-4 space-y-6">
        <SettingsGroup title="פריסה">
          <SliderField
            label="גובה"
            value={parseInt((section.settings.height as string)?.replace('vh', '') || '70')}
            min={30}
            max={100}
            suffix="vh"
            onChange={(v) => updateSettings('height', `${v}vh`)}
          />
          <SliderField
            label="שקיפות שכבה כהה"
            value={Math.round(((section.settings.overlay as number) || 0.1) * 100)}
            min={0}
            max={100}
            suffix="%"
            onChange={(v) => updateSettings('overlay', v / 100)}
          />
        </SettingsGroup>

        <SettingsGroup title="טיפוגרפיה">
          <TypographyPopover
            label="כותרת"
            value={{
              color: (section.settings.titleColor as string) || '#ffffff',
              fontSize: sizeToPx(section.settings.titleSize, 18),
              fontWeight: mapWeight(section.settings.titleWeight, 'light'),
            }}
            onChange={(typography) => {
              updateSettings('titleColor', typography.color);
              updateSettings('titleSize', typography.fontSize);
              updateSettings('titleWeight', typography.fontWeight);
            }}
            defaultColor="#ffffff"
          />
        </SettingsGroup>

        <SettingsGroup title="ריווחים">
          <SliderField
            label="ריווח עליון"
            value={(section.settings.marginTop as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginTop', v)}
          />
          <SliderField
            label="ריווח תחתון"
            value={(section.settings.marginBottom as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginBottom', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="מתקדם">
          <TextField
            label="Class מותאם"
            value={(section.settings.customClass as string) || ''}
            onChange={(v) => updateSettings('customClass', v)}
            placeholder="my-custom-class"
          />
          <TextField
            label="ID מותאם"
            value={(section.settings.customId as string) || ''}
            onChange={(v) => updateSettings('customId', v)}
            placeholder="my-custom-id"
          />
          <TextField
            label="CSS מותאם"
            value={(section.settings.customCss as string) || ''}
            onChange={(v) => updateSettings('customCss', v)}
            multiline
            placeholder="color: red; font-size: 20px;"
          />
        </SettingsGroup>
      </div>
    );
  }

  // FAQ design settings
  if (section.type === 'faq') {
    return (
      <div className="p-4 space-y-6">
        <SettingsGroup title="פריסה">
          <SelectField
            label="רוחב מקסימלי"
            value={(section.settings.maxWidth as string) || 'lg'}
            options={[
              { value: 'sm', label: 'קטן' },
              { value: 'md', label: 'בינוני' },
              { value: 'lg', label: 'גדול' },
              { value: 'xl', label: 'ענק' },
            ]}
            onChange={(v) => updateSettings('maxWidth', v)}
          />
          <SelectField
            label="סגנון"
            value={(section.settings.style as string) || 'accordion'}
            options={[
              { value: 'accordion', label: 'אקורדיון' },
              { value: 'cards', label: 'כרטיסים' },
              { value: 'simple', label: 'פשוט' },
            ]}
            onChange={(v) => updateSettings('style', v)}
          />
          <ColorField
            label="צבע רקע"
            value={(section.settings.backgroundColor as string) || 'transparent'}
            onChange={(v) => updateSettings('backgroundColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב כותרת">
          <ColorField
            label="צבע"
            value={(section.settings.titleColor as string) || '#000000'}
            onChange={(v) => updateSettings('titleColor', v)}
          />
          <SelectField
            label="גודל"
            value={(section.settings.titleSize as string) || 'md'}
            options={[
              { value: 'sm', label: 'קטן' },
              { value: 'md', label: 'בינוני' },
              { value: 'lg', label: 'גדול' },
              { value: 'xl', label: 'ענק' },
            ]}
            onChange={(v) => updateSettings('titleSize', v)}
          />
          <SelectField
            label="עובי"
            value={(section.settings.titleWeight as string) || 'light'}
            options={[
              { value: 'light', label: 'דק' },
              { value: 'normal', label: 'רגיל' },
              { value: 'medium', label: 'בינוני' },
              { value: 'semibold', label: 'מעובה' },
              { value: 'bold', label: 'מודגש' },
            ]}
            onChange={(v) => updateSettings('titleWeight', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב שאלות">
          <TypographyPopover
            label="שאלה"
            value={{
              color: (section.settings.questionColor as string) || '#111827',
            }}
            onChange={(typography) => {
              updateSettings('questionColor', typography.color);
            }}
            defaultColor="#111827"
          />
          <TypographyPopover
            label="תשובה"
            value={{
              color: (section.settings.answerColor as string) || '#4b5563',
            }}
            onChange={(typography) => {
              updateSettings('answerColor', typography.color);
            }}
            defaultColor="#4b5563"
          />
        </SettingsGroup>

        <SettingsGroup title="ריווחים">
          <SliderField
            label="ריווח עליון"
            value={(section.settings.marginTop as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginTop', v)}
          />
          <SliderField
            label="ריווח תחתון"
            value={(section.settings.marginBottom as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginBottom', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="מתקדם">
          <TextField
            label="Class מותאם"
            value={(section.settings.customClass as string) || ''}
            onChange={(v) => updateSettings('customClass', v)}
            placeholder="my-custom-class"
          />
          <TextField
            label="ID מותאם"
            value={(section.settings.customId as string) || ''}
            onChange={(v) => updateSettings('customId', v)}
            placeholder="my-custom-id"
          />
          <TextField
            label="CSS מותאם"
            value={(section.settings.customCss as string) || ''}
            onChange={(v) => updateSettings('customCss', v)}
            multiline
            placeholder="color: red; font-size: 20px;"
          />
        </SettingsGroup>
      </div>
    );
  }

  // Contact design settings
  if (section.type === 'contact') {
    return (
      <div className="p-4 space-y-6">
        <SettingsGroup title="פריסה">
          <SelectField
            label="סגנון תצוגה"
            value={(section.settings.layout as string) || 'split'}
            options={[
              { value: 'simple', label: 'פשוט' },
              { value: 'split', label: 'מפוצל (מידע + טופס)' },
              { value: 'form-only', label: 'טופס בלבד' },
              { value: 'info-only', label: 'מידע בלבד' },
            ]}
            onChange={(v) => updateSettings('layout', v)}
          />
          <SelectField
            label="רוחב מקסימלי"
            value={(section.settings.maxWidth as string) || 'xl'}
            options={[
              { value: 'sm', label: 'קטן' },
              { value: 'md', label: 'בינוני' },
              { value: 'lg', label: 'גדול' },
              { value: 'xl', label: 'ענק' },
              { value: 'full', label: 'מלא' },
            ]}
            onChange={(v) => updateSettings('maxWidth', v)}
          />
          <SelectField
            label="יישור טקסט"
            value={(section.settings.textAlign as string) || 'right'}
            options={[
              { value: 'right', label: 'ימין' },
              { value: 'center', label: 'מרכז' },
              { value: 'left', label: 'שמאל' },
            ]}
            onChange={(v) => updateSettings('textAlign', v)}
          />
          <SelectField
            label="ריווח אנכי"
            value={(section.settings.paddingY as string) || 'large'}
            options={[
              { value: 'small', label: 'קטן' },
              { value: 'medium', label: 'בינוני' },
              { value: 'large', label: 'גדול' },
            ]}
            onChange={(v) => updateSettings('paddingY', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="צבעים">
          <ColorField
            label="צבע רקע"
            value={(section.settings.backgroundColor as string) || '#f9fafb'}
            onChange={(v) => updateSettings('backgroundColor', v)}
          />
          <ColorField
            label="צבע טקסט"
            value={(section.settings.textColor as string) || '#111827'}
            onChange={(v) => updateSettings('textColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="טיפוגרפיה">
          <TypographyPopover
            label="כותרת"
            value={{
              color: (section.settings.titleColor as string) || '#111827',
              fontSize: sizeToPx(section.settings.titleSize, 36),
              fontWeight: mapWeight(section.settings.titleWeight, 'light'),
            }}
            onChange={(typography) => {
              updateSettings('titleColor', typography.color);
              updateSettings('titleSize', typography.fontSize);
              updateSettings('titleWeight', typography.fontWeight);
            }}
            defaultColor="#111827"
          />
        </SettingsGroup>

        <SettingsGroup title="כפתור שליחה">
          <ColorField
            label="צבע רקע"
            value={(section.settings.buttonBackgroundColor as string) || '#000000'}
            onChange={(v) => updateSettings('buttonBackgroundColor', v)}
          />
          <ColorField
            label="צבע טקסט"
            value={(section.settings.buttonTextColor as string) || '#ffffff'}
            onChange={(v) => updateSettings('buttonTextColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="מתקדם">
          <TextField
            label="Class מותאם"
            value={(section.settings.customClass as string) || ''}
            onChange={(v) => updateSettings('customClass', v)}
            placeholder="my-custom-class"
          />
          <TextField
            label="ID מותאם"
            value={(section.settings.customId as string) || ''}
            onChange={(v) => updateSettings('customId', v)}
            placeholder="contact"
          />
        </SettingsGroup>
      </div>
    );
  }

  // Categories design settings
  if (section.type === 'categories') {
    return (
      <div className="p-4 space-y-6">
        <SettingsGroup title="פריסה">
          <SelectField
            label="סוג מיכל"
            value={(section.settings.containerType as string) || 'container'}
            options={[
              { value: 'container', label: 'תיבה עם שוליים' },
              { value: 'full', label: 'רוחב מלא' },
            ]}
            onChange={(v) => updateSettings('containerType', v)}
          />
          <SelectField
            label="פריסה"
            value={(section.settings.layout as string) || 'grid'}
            options={[
              { value: 'grid', label: 'גריד' },
              { value: 'slider', label: 'סליידר' },
            ]}
            onChange={(v) => updateSettings('layout', v)}
          />
          <SelectField
            label="עמודות"
            value={String((section.settings.columns as number) || 4)}
            options={[
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
              { value: '5', label: '5' },
              { value: '6', label: '6' },
            ]}
            onChange={(v) => updateSettings('columns', parseInt(v))}
          />
          <ColorField
            label="צבע רקע"
            value={(section.settings.backgroundColor as string) || 'transparent'}
            onChange={(v) => updateSettings('backgroundColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב כותרת">
          <ColorField
            label="צבע"
            value={(section.settings.titleColor as string) || '#000000'}
            onChange={(v) => updateSettings('titleColor', v)}
          />
          <SelectField
            label="גודל"
            value={(section.settings.titleSize as string) || 'md'}
            options={[
              { value: 'sm', label: 'קטן' },
              { value: 'md', label: 'בינוני' },
              { value: 'lg', label: 'גדול' },
              { value: 'xl', label: 'ענק' },
            ]}
            onChange={(v) => updateSettings('titleSize', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב כרטיס">
          <SelectField
            label="סגנון כרטיס"
            value={(section.settings.cardStyle as string) || 'standard'}
            options={[
              { value: 'standard', label: 'סטנדרטי' },
              { value: 'minimal', label: 'מינימלי' },
              { value: 'overlay', label: 'עם שכבה' },
            ]}
            onChange={(v) => updateSettings('cardStyle', v)}
          />
          <SelectField
            label="אפקט ריחוף"
            value={(section.settings.hoverEffect as string) || 'scale'}
            options={[
              { value: 'none', label: 'ללא' },
              { value: 'scale', label: 'הגדלה' },
              { value: 'zoom', label: 'זום' },
            ]}
            onChange={(v) => updateSettings('hoverEffect', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="ריווחים">
          <SliderField
            label="ריווח עליון"
            value={(section.settings.marginTop as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginTop', v)}
          />
          <SliderField
            label="ריווח תחתון"
            value={(section.settings.marginBottom as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginBottom', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="מתקדם">
          <TextField
            label="Class מותאם"
            value={(section.settings.customClass as string) || ''}
            onChange={(v) => updateSettings('customClass', v)}
            placeholder="my-custom-class"
          />
          <TextField
            label="ID מותאם"
            value={(section.settings.customId as string) || ''}
            onChange={(v) => updateSettings('customId', v)}
            placeholder="my-custom-id"
          />
        </SettingsGroup>
      </div>
    );
  }

  // Products design settings
  if (section.type === 'products') {
    return (
      <div className="p-4 space-y-6">
        <SettingsGroup title="פריסה">
          <SelectField
            label="סוג מיכל"
            value={(section.settings.containerType as string) || 'container'}
            options={[
              { value: 'container', label: 'תיבה עם שוליים' },
              { value: 'full', label: 'רוחב מלא' },
            ]}
            onChange={(v) => updateSettings('containerType', v)}
          />
          <SelectField
            label="פריסה"
            value={(section.settings.layout as string) || 'grid'}
            options={[
              { value: 'grid', label: 'גריד' },
              { value: 'slider', label: 'סליידר' },
            ]}
            onChange={(v) => updateSettings('layout', v)}
          />
          <SelectField
            label="עמודות"
            value={String((section.settings.columns as number) || 4)}
            options={[
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
              { value: '5', label: '5' },
              { value: '6', label: '6' },
            ]}
            onChange={(v) => updateSettings('columns', parseInt(v))}
          />
          <ColorField
            label="צבע רקע"
            value={(section.settings.backgroundColor as string) || 'transparent'}
            onChange={(v) => updateSettings('backgroundColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב כותרת">
          <ColorField
            label="צבע"
            value={(section.settings.titleColor as string) || '#000000'}
            onChange={(v) => updateSettings('titleColor', v)}
          />
          <SelectField
            label="גודל"
            value={(section.settings.titleSize as string) || 'md'}
            options={[
              { value: 'sm', label: 'קטן' },
              { value: 'md', label: 'בינוני' },
              { value: 'lg', label: 'גדול' },
              { value: 'xl', label: 'ענק' },
            ]}
            onChange={(v) => updateSettings('titleSize', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב כרטיס">
          <SelectField
            label="סגנון כרטיס"
            value={(section.settings.cardStyle as string) || 'standard'}
            options={[
              { value: 'standard', label: 'סטנדרטי' },
              { value: 'minimal', label: 'מינימלי' },
              { value: 'overlay', label: 'עם שכבה' },
            ]}
            onChange={(v) => updateSettings('cardStyle', v)}
          />
          <SelectField
            label="אפקט ריחוף"
            value={(section.settings.hoverEffect as string) || 'scale'}
            options={[
              { value: 'none', label: 'ללא' },
              { value: 'scale', label: 'הגדלה' },
              { value: 'zoom', label: 'זום' },
            ]}
            onChange={(v) => updateSettings('hoverEffect', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="ריווחים">
          <SliderField
            label="ריווח עליון"
            value={(section.settings.marginTop as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginTop', v)}
          />
          <SliderField
            label="ריווח תחתון"
            value={(section.settings.marginBottom as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginBottom', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="מתקדם">
          <TextField
            label="Class מותאם"
            value={(section.settings.customClass as string) || ''}
            onChange={(v) => updateSettings('customClass', v)}
            placeholder="my-custom-class"
          />
          <TextField
            label="ID מותאם"
            value={(section.settings.customId as string) || ''}
            onChange={(v) => updateSettings('customId', v)}
            placeholder="my-custom-id"
          />
        </SettingsGroup>
      </div>
    );
  }

  // Reviews design settings
  if (section.type === 'reviews') {
    return (
      <div className="p-4 space-y-6">
        <SettingsGroup title="פריסה">
          <SelectField
            label="פריסה"
            value={(section.settings.layout as string) || 'grid'}
            options={[
              { value: 'grid', label: 'גריד' },
              { value: 'slider', label: 'סליידר' },
            ]}
            onChange={(v) => updateSettings('layout', v)}
          />
          <SelectField
            label="עמודות"
            value={String((section.settings.columns as number) || 3)}
            options={[
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
            ]}
            onChange={(v) => updateSettings('columns', parseInt(v))}
          />
          <ColorField
            label="צבע רקע"
            value={(section.settings.backgroundColor as string) || '#f9fafb'}
            onChange={(v) => updateSettings('backgroundColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב כותרת">
          <ColorField
            label="צבע"
            value={(section.settings.titleColor as string) || '#000000'}
            onChange={(v) => updateSettings('titleColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="ריווחים">
          <SliderField
            label="ריווח עליון"
            value={(section.settings.marginTop as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginTop', v)}
          />
          <SliderField
            label="ריווח תחתון"
            value={(section.settings.marginBottom as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginBottom', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="מתקדם">
          <TextField
            label="Class מותאם"
            value={(section.settings.customClass as string) || ''}
            onChange={(v) => updateSettings('customClass', v)}
            placeholder="my-custom-class"
          />
          <TextField
            label="ID מותאם"
            value={(section.settings.customId as string) || ''}
            onChange={(v) => updateSettings('customId', v)}
            placeholder="my-custom-id"
          />
        </SettingsGroup>
      </div>
    );
  }

  // Gallery design settings
  if (section.type === 'gallery') {
    return (
      <div className="p-4 space-y-6">
        <SettingsGroup title="פריסה">
          <SelectField
            label="עמודות"
            value={String((section.settings.columns as number) || 4)}
            options={[
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
              { value: '5', label: '5' },
              { value: '6', label: '6' },
            ]}
            onChange={(v) => updateSettings('columns', parseInt(v))}
          />
          <ColorField
            label="צבע רקע"
            value={(section.settings.backgroundColor as string) || 'transparent'}
            onChange={(v) => updateSettings('backgroundColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב כותרת">
          <ColorField
            label="צבע"
            value={(section.settings.titleColor as string) || '#000000'}
            onChange={(v) => updateSettings('titleColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="ריווחים">
          <SliderField
            label="ריווח עליון"
            value={(section.settings.marginTop as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginTop', v)}
          />
          <SliderField
            label="ריווח תחתון"
            value={(section.settings.marginBottom as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginBottom', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="מתקדם">
          <TextField
            label="Class מותאם"
            value={(section.settings.customClass as string) || ''}
            onChange={(v) => updateSettings('customClass', v)}
            placeholder="my-custom-class"
          />
          <TextField
            label="ID מותאם"
            value={(section.settings.customId as string) || ''}
            onChange={(v) => updateSettings('customId', v)}
            placeholder="my-custom-id"
          />
        </SettingsGroup>
      </div>
    );
  }

  // Logos design settings
  if (section.type === 'logos') {
    return (
      <div className="p-4 space-y-6">
        <SettingsGroup title="פריסה">
          <SelectField
            label="עמודות"
            value={String((section.settings.columns as number) || 5)}
            options={[
              { value: '3', label: '3' },
              { value: '4', label: '4' },
              { value: '5', label: '5' },
              { value: '6', label: '6' },
            ]}
            onChange={(v) => updateSettings('columns', parseInt(v))}
          />
          <ColorField
            label="צבע רקע"
            value={(section.settings.backgroundColor as string) || 'transparent'}
            onChange={(v) => updateSettings('backgroundColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב כותרת">
          <ColorField
            label="צבע"
            value={(section.settings.titleColor as string) || '#000000'}
            onChange={(v) => updateSettings('titleColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="ריווחים">
          <SliderField
            label="ריווח עליון"
            value={(section.settings.marginTop as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginTop', v)}
          />
          <SliderField
            label="ריווח תחתון"
            value={(section.settings.marginBottom as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginBottom', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="מתקדם">
          <TextField
            label="Class מותאם"
            value={(section.settings.customClass as string) || ''}
            onChange={(v) => updateSettings('customClass', v)}
            placeholder="my-custom-class"
          />
          <TextField
            label="ID מותאם"
            value={(section.settings.customId as string) || ''}
            onChange={(v) => updateSettings('customId', v)}
            placeholder="my-custom-id"
          />
        </SettingsGroup>
      </div>
    );
  }

  // Custom section design settings
  if (section.type === 'custom') {
    return (
      <div className="p-4 space-y-6">
        <SettingsGroup title="עיצוב">
          <ColorField
            label="צבע רקע"
            value={(section.settings.backgroundColor as string) || 'transparent'}
            onChange={(v) => updateSettings('backgroundColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="ריווחים">
          <SliderField
            label="ריווח עליון"
            value={(section.settings.marginTop as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginTop', v)}
          />
          <SliderField
            label="ריווח תחתון"
            value={(section.settings.marginBottom as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginBottom', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="מתקדם">
          <TextField
            label="Class מותאם"
            value={(section.settings.customClass as string) || ''}
            onChange={(v) => updateSettings('customClass', v)}
            placeholder="my-custom-class"
          />
          <TextField
            label="ID מותאם"
            value={(section.settings.customId as string) || ''}
            onChange={(v) => updateSettings('customId', v)}
            placeholder="my-custom-id"
          />
          <TextField
            label="CSS מותאם"
            value={(section.settings.customCss as string) || ''}
            onChange={(v) => updateSettings('customCss', v)}
            multiline
            placeholder="color: red; font-size: 20px;"
          />
        </SettingsGroup>
      </div>
    );
  }

  // Newsletter design settings
  if (section.type === 'newsletter') {
    return (
      <div className="p-4 space-y-6">
        <SettingsGroup title="פריסה">
          <ColorField
            label="צבע רקע"
            value={(section.settings.backgroundColor as string) || '#f9fafb'}
            onChange={(v) => updateSettings('backgroundColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="טיפוגרפיה">
          <TypographyPopover
            label="כותרת"
            value={{
              color: (section.settings.titleColor as string) || '#000000',
              fontSize: sizeToPx(section.settings.titleSize, 16),
              fontWeight: mapWeight(section.settings.titleWeight, 'light'),
            }}
            onChange={(typography) => {
              updateSettings('titleColor', typography.color);
              updateSettings('titleSize', typography.fontSize);
              updateSettings('titleWeight', typography.fontWeight);
            }}
            defaultColor="#000000"
          />
          <TypographyPopover
            label="תת-כותרת"
            value={{
              color: (section.settings.subtitleColor as string) || '#6b7280',
            }}
            onChange={(typography) => {
              updateSettings('subtitleColor', typography.color);
            }}
            defaultColor="#6b7280"
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב כפתור">
          <ColorField
            label="צבע טקסט"
            value={(section.settings.buttonTextColor as string) || '#ffffff'}
            onChange={(v) => updateSettings('buttonTextColor', v)}
          />
          <ColorField
            label="צבע רקע"
            value={(section.settings.buttonBackgroundColor as string) || '#000000'}
            onChange={(v) => updateSettings('buttonBackgroundColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב שדה">
          <ColorField
            label="צבע מסגרת"
            value={(section.settings.inputBorderColor as string) || '#e5e7eb'}
            onChange={(v) => updateSettings('inputBorderColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="ריווחים">
          <SliderField
            label="ריווח עליון"
            value={(section.settings.marginTop as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginTop', v)}
          />
          <SliderField
            label="ריווח תחתון"
            value={(section.settings.marginBottom as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginBottom', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="מתקדם">
          <TextField
            label="Class מותאם"
            value={(section.settings.customClass as string) || ''}
            onChange={(v) => updateSettings('customClass', v)}
            placeholder="my-custom-class"
          />
          <TextField
            label="ID מותאם"
            value={(section.settings.customId as string) || ''}
            onChange={(v) => updateSettings('customId', v)}
            placeholder="my-custom-id"
          />
          <TextField
            label="CSS מותאם"
            value={(section.settings.customCss as string) || ''}
            onChange={(v) => updateSettings('customCss', v)}
            multiline
            placeholder="color: red; font-size: 20px;"
          />
        </SettingsGroup>
      </div>
    );
  }

  // Features design settings
  if (section.type === 'features') {
    return (
      <div className="p-4 space-y-6">
        <SettingsGroup title="פריסה">
          <SelectField
            label="עמודות"
            value={String((section.settings.columns as number) || 4)}
            options={[
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
              { value: '5', label: '5' },
              { value: '6', label: '6' },
            ]}
            onChange={(v) => updateSettings('columns', parseInt(v))}
          />
          <SelectField
            label="סגנון אייקון"
            value={(section.settings.iconStyle as string) || 'emoji'}
            options={[
              { value: 'emoji', label: 'אימוג\'י' },
              { value: 'icon', label: 'אייקון' },
              { value: 'none', label: 'ללא' },
            ]}
            onChange={(v) => updateSettings('iconStyle', v)}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm">קווי הפרדה</span>
            <input
              type="checkbox"
              checked={(section.settings.showDividers as boolean) ?? true}
              onChange={(e) => updateSettings('showDividers', e.target.checked)}
              className="h-4 w-4"
            />
          </div>
          <ColorField
            label="צבע רקע"
            value={(section.settings.backgroundColor as string) || 'transparent'}
            onChange={(v) => updateSettings('backgroundColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב כותרת ראשית">
          <ColorField
            label="צבע"
            value={(section.settings.titleColor as string) || '#000000'}
            onChange={(v) => updateSettings('titleColor', v)}
          />
          <SelectField
            label="גודל"
            value={(section.settings.titleSize as string) || 'md'}
            options={[
              { value: 'sm', label: 'קטן' },
              { value: 'md', label: 'בינוני' },
              { value: 'lg', label: 'גדול' },
              { value: 'xl', label: 'ענק' },
            ]}
            onChange={(v) => updateSettings('titleSize', v)}
          />
          <SelectField
            label="עובי"
            value={(section.settings.titleWeight as string) || 'light'}
            options={[
              { value: 'light', label: 'דק' },
              { value: 'normal', label: 'רגיל' },
              { value: 'medium', label: 'בינוני' },
              { value: 'semibold', label: 'מעובה' },
              { value: 'bold', label: 'מודגש' },
            ]}
            onChange={(v) => updateSettings('titleWeight', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב תת-כותרת">
          <ColorField
            label="צבע"
            value={(section.settings.subtitleColor as string) || '#4b5563'}
            onChange={(v) => updateSettings('subtitleColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב יתרונות">
          <TypographyPopover
            label="כותרת יתרון"
            value={{
              color: (section.settings.featureTitleColor as string) || '#111827',
            }}
            onChange={(typography) => {
              updateSettings('featureTitleColor', typography.color);
            }}
            defaultColor="#111827"
          />
          <TypographyPopover
            label="תיאור יתרון"
            value={{
              color: (section.settings.featureDescColor as string) || '#6b7280',
            }}
            onChange={(typography) => {
              updateSettings('featureDescColor', typography.color);
            }}
            defaultColor="#6b7280"
          />
          <ColorField
            label="צבע אייקון"
            value={(section.settings.iconColor as string) || '#374151'}
            onChange={(v) => updateSettings('iconColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="ריווחים">
          <SliderField
            label="ריווח עליון"
            value={(section.settings.marginTop as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginTop', v)}
          />
          <SliderField
            label="ריווח תחתון"
            value={(section.settings.marginBottom as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginBottom', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="מתקדם">
          <TextField
            label="Class מותאם"
            value={(section.settings.customClass as string) || ''}
            onChange={(v) => updateSettings('customClass', v)}
            placeholder="my-custom-class"
          />
          <TextField
            label="ID מותאם"
            value={(section.settings.customId as string) || ''}
            onChange={(v) => updateSettings('customId', v)}
            placeholder="my-custom-id"
          />
          <TextField
            label="CSS מותאם"
            value={(section.settings.customCss as string) || ''}
            onChange={(v) => updateSettings('customCss', v)}
            multiline
            placeholder="color: red; font-size: 20px;"
          />
        </SettingsGroup>
      </div>
    );
  }

  // Banner Small design settings
  if (section.type === 'banner_small') {
    return (
      <div className="p-4 space-y-6">
        <SettingsGroup title="פריסה">
          <ColorField
            label="צבע רקע"
            value={(section.settings.backgroundColor as string) || '#000000'}
            onChange={(v) => updateSettings('backgroundColor', v)}
          />
          <SelectField
            label="גודל"
            value={(section.settings.size as string) || 'medium'}
            options={[
              { value: 'small', label: 'קטן' },
              { value: 'medium', label: 'בינוני' },
              { value: 'large', label: 'גדול' },
            ]}
            onChange={(v) => updateSettings('size', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="טיפוגרפיה">
          <TypographyPopover
            label="כותרת"
            value={{
              color: (section.settings.titleColor as string) || '#ffffff',
              fontSize: sizeToPx(section.settings.titleSize, 16),
              fontWeight: mapWeight(section.settings.titleWeight, 'medium'),
            }}
            onChange={(typography) => {
              updateSettings('titleColor', typography.color);
              updateSettings('titleSize', typography.fontSize);
              updateSettings('titleWeight', typography.fontWeight);
            }}
            defaultColor="#ffffff"
          />
          <TypographyPopover
            label="תת-כותרת"
            value={{
              color: (section.settings.subtitleColor as string) || '#ffffff',
              fontWeight: mapWeight(section.settings.subtitleWeight, 'normal'),
            }}
            onChange={(typography) => {
              updateSettings('subtitleColor', typography.color);
              updateSettings('subtitleWeight', typography.fontWeight);
            }}
            defaultColor="#ffffff"
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב כפתור">
          <SelectField
            label="סגנון"
            value={(section.settings.buttonStyle as string) || 'outline'}
            options={[
              { value: 'outline', label: 'מסגרת' },
              { value: 'filled', label: 'מלא' },
              { value: 'none', label: 'ללא כפתור' },
            ]}
            onChange={(v) => updateSettings('buttonStyle', v)}
          />
          <ColorField
            label="צבע טקסט"
            value={(section.settings.buttonTextColor as string) || '#ffffff'}
            onChange={(v) => updateSettings('buttonTextColor', v)}
          />
          <ColorField
            label="צבע רקע"
            value={(section.settings.buttonBackgroundColor as string) || '#ffffff'}
            onChange={(v) => updateSettings('buttonBackgroundColor', v)}
          />
          <ColorField
            label="צבע מסגרת"
            value={(section.settings.buttonBorderColor as string) || '#ffffff'}
            onChange={(v) => updateSettings('buttonBorderColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="ריווחים">
          <SliderField
            label="ריווח עליון"
            value={(section.settings.marginTop as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginTop', v)}
          />
          <SliderField
            label="ריווח תחתון"
            value={(section.settings.marginBottom as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginBottom', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="מתקדם">
          <TextField
            label="Class מותאם"
            value={(section.settings.customClass as string) || ''}
            onChange={(v) => updateSettings('customClass', v)}
            placeholder="my-custom-class"
          />
          <TextField
            label="ID מותאם"
            value={(section.settings.customId as string) || ''}
            onChange={(v) => updateSettings('customId', v)}
            placeholder="my-custom-id"
          />
          <TextField
            label="CSS מותאם"
            value={(section.settings.customCss as string) || ''}
            onChange={(v) => updateSettings('customCss', v)}
            multiline
            placeholder="color: red; font-size: 20px;"
          />
        </SettingsGroup>
      </div>
    );
  }

  // Text Block design settings
  if (section.type === 'text_block') {
    return (
      <div className="p-4 space-y-6">
        <SettingsGroup title="פריסה">
          <SelectField
            label="רוחב מקסימלי"
            value={(section.settings.maxWidth as string) || 'lg'}
            options={[
              { value: 'sm', label: 'קטן' },
              { value: 'md', label: 'בינוני' },
              { value: 'lg', label: 'גדול' },
              { value: 'xl', label: 'ענק' },
              { value: 'full', label: 'מלא' },
            ]}
            onChange={(v) => updateSettings('maxWidth', v)}
          />
          <SelectField
            label="ריווח אנכי"
            value={(section.settings.paddingY as string) || 'medium'}
            options={[
              { value: 'small', label: 'קטן' },
              { value: 'medium', label: 'בינוני' },
              { value: 'large', label: 'גדול' },
            ]}
            onChange={(v) => updateSettings('paddingY', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="טיפוגרפיה">
          <TypographyPopover
            label="כותרת"
            value={{
              color: (section.settings.titleColor as string) || '#000000',
              fontSize: sizeToPx(section.settings.titleSize, 18),
              fontWeight: mapWeight(section.settings.titleWeight, 'light'),
            }}
            onChange={(typography) => {
              updateSettings('titleColor', typography.color);
              updateSettings('titleSize', typography.fontSize);
              updateSettings('titleWeight', typography.fontWeight);
            }}
            defaultColor="#000000"
          />
          <TypographyPopover
            label="תת-כותרת"
            value={{
              color: (section.settings.subtitleColor as string) || '#6b7280',
              fontSize: sizeToPx(section.settings.subtitleSize, 18),
              fontWeight: mapWeight(section.settings.subtitleWeight, 'normal'),
            }}
            onChange={(typography) => {
              updateSettings('subtitleColor', typography.color);
              updateSettings('subtitleSize', typography.fontSize);
              updateSettings('subtitleWeight', typography.fontWeight);
            }}
            defaultColor="#6b7280"
          />
          <TypographyPopover
            label="תוכן"
            value={{
              color: (section.settings.textColor as string) || '#374151',
              fontSize: sizeToPx(section.settings.textSize, 16),
            }}
            onChange={(typography) => {
              updateSettings('textColor', typography.color);
              updateSettings('textSize', typography.fontSize);
            }}
            defaultColor="#374151"
          />
        </SettingsGroup>

        <SettingsGroup title="עיצוב כפתור">
          <ColorField
            label="צבע טקסט"
            value={(section.settings.buttonTextColor as string) || '#000000'}
            onChange={(v) => updateSettings('buttonTextColor', v)}
          />
          <ColorField
            label="צבע רקע"
            value={(section.settings.buttonBackgroundColor as string) || 'transparent'}
            onChange={(v) => updateSettings('buttonBackgroundColor', v)}
          />
          <ColorField
            label="צבע מסגרת"
            value={(section.settings.buttonBorderColor as string) || '#000000'}
            onChange={(v) => updateSettings('buttonBorderColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="צבע רקע">
          <ColorField
            label="צבע רקע סקשן"
            value={(section.settings.backgroundColor as string) || 'transparent'}
            onChange={(v) => updateSettings('backgroundColor', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="ריווחים">
          <SliderField
            label="ריווח עליון"
            value={(section.settings.marginTop as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginTop', v)}
          />
          <SliderField
            label="ריווח תחתון"
            value={(section.settings.marginBottom as number) || 0}
            min={0}
            max={100}
            suffix="px"
            onChange={(v) => updateSettings('marginBottom', v)}
          />
        </SettingsGroup>

        <SettingsGroup title="מתקדם">
          <TextField
            label="Class מותאם"
            value={(section.settings.customClass as string) || ''}
            onChange={(v) => updateSettings('customClass', v)}
            placeholder="my-custom-class"
          />
          <TextField
            label="ID מותאם"
            value={(section.settings.customId as string) || ''}
            onChange={(v) => updateSettings('customId', v)}
            placeholder="my-custom-id"
          />
          <TextField
            label="CSS מותאם"
            value={(section.settings.customCss as string) || ''}
            onChange={(v) => updateSettings('customCss', v)}
            multiline
            placeholder="color: red; font-size: 20px;"
          />
        </SettingsGroup>
      </div>
    );
  }

  // Default design settings for other section types
  return (
    <div className="p-4 space-y-6">
      {/* General */}
      <SettingsGroup title="כללי">
        <SelectField
          label="סוג מיכל"
          value={(section.settings.containerType as string) || 'container'}
          options={[
            { value: 'container', label: 'תיבה עם שוליים' },
            { value: 'full', label: 'רוחב מלא' },
          ]}
          onChange={(v) => updateSettings('containerType', v)}
        />
        <ColorField
          label="צבע רקע"
          value={(section.settings.backgroundColor as string) || 'transparent'}
          onChange={(v) => updateSettings('backgroundColor', v)}
        />
        <SelectField
          label="פריסה"
          value={(section.settings.layout as string) || 'standard'}
          options={[
            { value: 'standard', label: 'סטנדרטי' },
            { value: 'grid', label: 'גריד' },
            { value: 'slider', label: 'סליידר' },
          ]}
          onChange={(v) => updateSettings('layout', v)}
        />
      </SettingsGroup>

      {/* Card Settings */}
      {(section.type === 'categories' || section.type === 'products') && (
        <SettingsGroup title="הגדרות כרטיס">
          <SelectField
            label="סגנון כרטיס"
            value={(section.settings.cardStyle as string) || 'standard'}
            options={[
              { value: 'standard', label: 'סטנדרטי' },
              { value: 'minimal', label: 'מינימלי' },
              { value: 'overlay', label: 'עם שכבה' },
            ]}
            onChange={(v) => updateSettings('cardStyle', v)}
          />
          <SelectField
            label="אפקט ריחוף"
            value={(section.settings.hoverEffect as string) || 'scale'}
            options={[
              { value: 'none', label: 'ללא' },
              { value: 'scale', label: 'הקטנה' },
              { value: 'zoom', label: 'זום' },
              { value: 'lift', label: 'הרמה' },
            ]}
            onChange={(v) => updateSettings('hoverEffect', v)}
          />
          <SwitchField
            label="הצג מספר מוצרים"
            value={(section.settings.showProductCount as boolean) || false}
            onChange={(v) => updateSettings('showProductCount', v)}
          />
          <SwitchField
            label="תמונות מעוגלות"
            description="לא עובד טוב עם פריסת 'תוכן בפנים'"
            value={(section.settings.imageRounded as boolean) || false}
            onChange={(v) => updateSettings('imageRounded', v)}
          />
        </SettingsGroup>
      )}

      {/* Grid Settings */}
      <SettingsGroup title="הגדרות גריד">
        <SliderField
          label="פריטים בשורה"
          value={(section.settings.columns as number) || 4}
          min={1}
          max={6}
          onChange={(v) => updateSettings('columns', v)}
        />
        <SwitchField
          label="הפעל סליידר"
          value={(section.settings.enableSlider as boolean) || false}
          onChange={(v) => updateSettings('enableSlider', v)}
        />
        <SwitchField
          label="הצג עימוד"
          value={(section.settings.showPagination as boolean) || false}
          onChange={(v) => updateSettings('showPagination', v)}
        />
        <SwitchField
          label="הצג ניווט"
          value={(section.settings.showNavigation as boolean) || false}
          onChange={(v) => updateSettings('showNavigation', v)}
        />
      </SettingsGroup>

      {/* Mobile Settings */}
      <SettingsGroup title="הגדרות מובייל">
        <SwitchField
          label="השבת סליידר"
          value={(section.settings.mobileDisableSlider as boolean) || false}
          onChange={(v) => updateSettings('mobileDisableSlider', v)}
        />
        <SwitchField
          label="גלילה אופקית"
          description="בטל לתצוגת גריד"
          value={(section.settings.mobileHorizontalScroll as boolean) || false}
          onChange={(v) => updateSettings('mobileHorizontalScroll', v)}
        />
        <SliderField
          label="רווח עמודות"
          value={(section.settings.mobileColumnGap as number) || 10}
          min={0}
          max={30}
          suffix="px"
          onChange={(v) => updateSettings('mobileColumnGap', v)}
        />
      </SettingsGroup>

      {/* Section Padding */}
      <SettingsGroup title="ריווח סקשן">
        <SliderField
          label="ריווח עליון"
          value={(section.settings.paddingTop as number) || 0}
          min={0}
          max={100}
          suffix="px"
          onChange={(v) => updateSettings('paddingTop', v)}
        />
        <SliderField
          label="ריווח תחתון"
          value={(section.settings.paddingBottom as number) || 0}
          min={0}
          max={100}
          suffix="px"
          onChange={(v) => updateSettings('paddingBottom', v)}
        />
      </SettingsGroup>

      {/* Custom CSS */}
      <CollapsibleGroup title="CSS מותאם">
        <p className="text-xs text-gray-500 mb-2">
          הוסף סגנונות מותאמים <strong>לסקשן זה בלבד</strong>.
        </p>
        <textarea
          value={(section.settings.customCss as string) || ''}
          onChange={(e) => updateSettings('customCss', e.target.value)}
          className="w-full h-24 p-3 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-blue-500"
          placeholder="h2 {
  font-size: 32px;
}"
          dir="ltr"
        />
      </CollapsibleGroup>
    </div>
  );
}

// Type-specific content settings
function HeroContentSettings({ section, onUpdate, storeInfo }: { section: Section; onUpdate: (updates: Partial<Section>) => void; storeInfo?: StoreInfo }) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  return (
    <>
      <SettingsGroup title="תמונה - מחשב">
        <ImageField
          label="תמונת רקע (דסקטופ)"
          value={(section.content.imageUrl as string) || ''}
          onChange={(v) => updateContent('imageUrl', v)}
          storeId={storeInfo?.id}
          storeSlug={storeInfo?.slug}
          hint="מומלץ: 1920x1080 או גדול יותר"
        />
      </SettingsGroup>
      <SettingsGroup title="תמונה - מובייל">
        <ImageField
          label="תמונת רקע (מובייל)"
          value={(section.content.mobileImageUrl as string) || ''}
          onChange={(v) => updateContent('mobileImageUrl', v)}
          storeId={storeInfo?.id}
          storeSlug={storeInfo?.slug}
          hint="מומלץ: 750x1334 (אופציונלי - אם ריק תוצג תמונת המחשב)"
        />
      </SettingsGroup>
      <SettingsGroup title="כפתור">
        <TextField
          label="טקסט כפתור"
          value={(section.content.buttonText as string) || ''}
          onChange={(v) => updateContent('buttonText', v)}
          placeholder="לחנות"
        />
        <TextField
          label="קישור כפתור"
          value={(section.content.buttonLink as string) || ''}
          onChange={(v) => updateContent('buttonLink', v)}
          placeholder="/products"
        />
      </SettingsGroup>
    </>
  );
}

function CategoriesContentSettings({ 
  section, 
  onUpdate, 
  categories = [] 
}: { 
  section: Section; 
  onUpdate: (updates: Partial<Section>) => void;
  categories?: Category[];
}) {
  const selectedIds = (section.content.categoryIds as string[]) || [];
  
  const toggleCategory = (categoryId: string) => {
    const newIds = selectedIds.includes(categoryId)
      ? selectedIds.filter(id => id !== categoryId)
      : [...selectedIds, categoryId];
    onUpdate({ content: { ...section.content, categoryIds: newIds } });
  };

  const selectAll = () => {
    onUpdate({ content: { ...section.content, categoryIds: categories.map(c => c.id) } });
  };

  const clearAll = () => {
    onUpdate({ content: { ...section.content, categoryIds: [] } });
  };

  // Build hierarchical structure (main categories first, then subcategories)
  const mainCategories = categories.filter(c => !c.parentId);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parentId === parentId);

  return (
    <SettingsGroup title="קטגוריות">
      <div className="space-y-3">
        {/* Quick actions */}
        <div className="flex gap-2 text-xs">
          <button 
            onClick={selectAll}
            className="text-blue-600 hover:underline"
          >
            בחר הכל
          </button>
          <span className="text-gray-300">|</span>
          <button 
            onClick={clearAll}
            className="text-blue-600 hover:underline"
          >
            נקה הכל
          </button>
          <span className="text-gray-400 mr-auto">
            {selectedIds.length} נבחרו
          </span>
        </div>

        {/* Category list with checkboxes */}
        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
          {categories.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              אין קטגוריות. הוסף קטגוריות בניהול החנות.
            </p>
          ) : (
            mainCategories.map(category => (
              <div key={category.id}>
                {/* Main category */}
                <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{category.name}</span>
                </label>
                
                {/* Subcategories */}
                {getSubcategories(category.id).map(sub => (
                  <label 
                    key={sub.id} 
                    className="flex items-center gap-2 p-2 pr-8 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(sub.id)}
                      onChange={() => toggleCategory(sub.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">{sub.name}</span>
                  </label>
                ))}
              </div>
            ))
          )}
        </div>

        <p className="text-xs text-gray-400">
          {selectedIds.length === 0 
            ? 'אם לא נבחרו קטגוריות, יוצגו כל הקטגוריות'
            : 'רק הקטגוריות שנבחרו יוצגו'}
        </p>
      </div>
    </SettingsGroup>
  );
}

function ProductsContentSettings({ 
  section, 
  onUpdate,
  categories = [],
}: { 
  section: Section; 
  onUpdate: (updates: Partial<Section>) => void;
  categories?: Category[];
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; slug: string; price: string; comparePrice: string | null; imageUrl: string | null }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const storeSlug = pathname?.split('/')[2] || '';
  
  // Use local state for immediate UI updates
  const [localType, setLocalType] = useState<string>((section.content.type as string) || 'all');
  
  // Sync with section prop when it changes
  useEffect(() => {
    setLocalType((section.content.type as string) || 'all');
  }, [section.content.type]);
  
  // ⚡ Fetch category products for real-time preview
  const fetchCategoryProducts = useCallback(async (categoryId: string) => {
    if (!categoryId || !storeSlug) return;
    
    setIsLoadingCategory(true);
    try {
      // Fetch products from category
      const response = await fetch(`/api/shops/${storeSlug}/products/by-category?categoryId=${categoryId}&limit=12`);
      if (response.ok) {
        const data = await response.json();
        // Send to preview with categoryProducts for real-time display
        onUpdate({ 
          content: { 
            ...section.content, 
            categoryId,
            categoryProducts: data.products,
          } 
        });
      }
    } catch (error) {
      console.error('Error fetching category products:', error);
    } finally {
      setIsLoadingCategory(false);
    }
  }, [storeSlug, section.content, onUpdate]);
  
  const updateContent = (keyOrUpdates: string | Record<string, unknown>, value?: unknown) => {
    if (typeof keyOrUpdates === 'string') {
      // Single update: updateContent('key', value)
      onUpdate({ content: { ...section.content, [keyOrUpdates]: value } });
    } else {
      // Multiple updates: updateContent({ key1: value1, key2: value2 })
      onUpdate({ content: { ...section.content, ...keyOrUpdates } });
    }
  };
  
  const selectedType = localType;
  const selectedCategoryId = (section.content.categoryId as string) || '';
  const selectedProductIds = (section.content.productIds as string[]) || [];
  const selectedProducts = (section.content.selectedProducts as Array<{ id: string; name: string; slug?: string; price?: string; comparePrice?: string | null; imageUrl: string | null }>) || [];
  
  // Search products dynamically
  const handleSearch = useCallback(async (term: string) => {
    if (!term.trim() || term.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/shops/${storeSlug}/products/search?q=${encodeURIComponent(term)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        // Filter out already selected products
        setSearchResults(data.products.filter((p: { id: string }) => !selectedProductIds.includes(p.id)));
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [storeSlug, selectedProductIds]);
  
  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, handleSearch]);
  
  // Add product to selection - single update for real-time preview!
  const addProduct = (product: { id: string; name: string; slug?: string; price?: string; comparePrice?: string | null; imageUrl: string | null }) => {
    const newProductIds = [...selectedProductIds, product.id];
    const newSelectedProducts = [...selectedProducts, product];
    // ⚡ Single update with both fields for immediate preview
    updateContent({
      productIds: newProductIds,
      selectedProducts: newSelectedProducts,
    });
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };
  
  // Remove product from selection - single update for real-time preview!
  const removeProduct = (productId: string) => {
    const newProductIds = selectedProductIds.filter(id => id !== productId);
    const newSelectedProducts = selectedProducts.filter(p => p.id !== productId);
    // ⚡ Single update with both fields for immediate preview
    updateContent({
      productIds: newProductIds,
      selectedProducts: newSelectedProducts,
    });
  };

  return (
    <SettingsGroup title="מוצרים">
      <SelectField
        label="הצג מוצרים"
        value={selectedType}
        options={[
          { value: 'all', label: 'כל המוצרים' },
          { value: 'featured', label: 'מוצרים מומלצים' },
          { value: 'category', label: 'לפי קטגוריה' },
          { value: 'specific', label: 'מוצרים ספציפיים' },
        ]}
        onChange={(v) => {
          // Update local state immediately for instant UI feedback
          setLocalType(v);
          
          // Prepare all updates at once
          const updates: Record<string, unknown> = { type: v };
          
          // Clear specific selections when type changes
          if (v !== 'category') {
            updates.categoryId = '';
          }
          if (v !== 'specific') {
            updates.productIds = [];
            updates.selectedProducts = [];
          }
          
          // Apply all updates in a single call
          updateContent(updates);
        }}
      />
      
      {/* Category selector */}
      {selectedType === 'category' && (
        <div className="relative">
        <SelectField
          label="בחר קטגוריה"
          value={selectedCategoryId}
          options={[
            { value: '', label: 'בחר קטגוריה...' },
            ...categories.map(c => ({ value: c.id, label: c.name }))
          ]}
            onChange={(v) => {
              // ⚡ Fetch category products for real-time preview
              fetchCategoryProducts(v);
            }}
        />
          {isLoadingCategory && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
      
      {/* Product picker */}
      {selectedType === 'specific' && (
        <div className="space-y-3">
          <label className="block text-xs font-medium text-gray-600">
            בחר מוצרים
          </label>
          
          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowResults(true)}
              placeholder="חפש מוצרים..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black/5 focus:border-black"
            />
            {isSearching && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              </div>
            )}
            
            {/* Search results dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {searchResults.map(product => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    className="w-full px-3 py-2 text-right text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    {product.imageUrl && (
                      <img 
                        src={product.imageUrl} 
                        alt="" 
                        className="w-8 h-8 object-cover rounded"
                      />
                    )}
                    <span>{product.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Selected products */}
          {selectedProducts.length > 0 && (
            <div className="space-y-2">
              {selectedProducts.map(product => (
                <div 
                  key={product.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  {product.imageUrl && (
                    <img 
                      src={product.imageUrl} 
                      alt="" 
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <span className="flex-1 text-sm truncate">{product.name}</span>
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
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
            <p className="text-xs text-gray-400 text-center py-4">
              חפש והוסף מוצרים לתצוגה
            </p>
          )}
        </div>
      )}
      
      {/* Limit slider - not for specific products */}
      {selectedType !== 'specific' && (
      <SliderField
        label="כמות להצגה"
        value={(section.content.limit as number) || 8}
        min={1}
        max={24}
        onChange={(v) => updateContent('limit', v)}
      />
      )}
    </SettingsGroup>
  );
}

function NewsletterContentSettings({ section, onUpdate }: { section: Section; onUpdate: (updates: Partial<Section>) => void }) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };
  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
  };

  return (
    <>
      <SettingsGroup title="טופס">
        <TextField
          label="טקסט placeholder"
          value={(section.content.placeholder as string) || ''}
          onChange={(v) => updateContent('placeholder', v)}
          placeholder="כתובת אימייל"
        />
        <TextField
          label="טקסט כפתור"
          value={(section.content.buttonText as string) || ''}
          onChange={(v) => updateContent('buttonText', v)}
          placeholder="הרשמה"
        />
      </SettingsGroup>
      <SettingsGroup title="עיצוב">
        <ColorField
          label="צבע רקע"
          value={(section.settings.backgroundColor as string) || '#f9fafb'}
          onChange={(v) => updateSettings('backgroundColor', v)}
        />
        <ColorField
          label="צבע טקסט"
          value={(section.settings.textColor as string) || '#000000'}
          onChange={(v) => updateSettings('textColor', v)}
        />
        <ColorField
          label="צבע כפתור"
          value={(section.settings.buttonColor as string) || '#000000'}
          onChange={(v) => updateSettings('buttonColor', v)}
        />
        <ColorField
          label="צבע טקסט כפתור"
          value={(section.settings.buttonTextColor as string) || '#ffffff'}
          onChange={(v) => updateSettings('buttonTextColor', v)}
        />
      </SettingsGroup>
    </>
  );
}

// Split Banner (באנר מפוצל) Settings - 2 images: right & left
function SplitBannerContentSettings({ section, onUpdate, storeInfo }: { section: Section; onUpdate: (updates: Partial<Section>) => void; storeInfo?: StoreInfo }) {
  const updateSide = (side: 'right' | 'left', key: string, value: string) => {
    onUpdate({ 
      content: { 
        ...section.content, 
        [side]: { 
          ...((section.content[side] as Record<string, string>) || {}), 
          [key]: value 
        } 
      } 
    });
  };

  const right = (section.content.right as { title?: string; imageUrl?: string; mobileImageUrl?: string; link?: string }) || {};
  const left = (section.content.left as { title?: string; imageUrl?: string; mobileImageUrl?: string; link?: string }) || {};

  return (
    <div className="space-y-4">
      {/* Right Side (First in RTL) */}
      <CollapsibleGroup title={`תמונה ימין${right.title ? ` - ${right.title}` : ''}`} defaultOpen={true}>
        <div className="space-y-3 pt-2">
          <TextField
            label="כותרת"
            value={right.title || ''}
            onChange={(v) => updateSide('right', 'title', v)}
            placeholder="נשים"
          />
          <ImageField
            label="תמונה (מחשב)"
            value={right.imageUrl || ''}
            onChange={(v) => updateSide('right', 'imageUrl', v)}
            storeId={storeInfo?.id}
            storeSlug={storeInfo?.slug}
          />
          <ImageField
            label="תמונה (מובייל)"
            value={right.mobileImageUrl || ''}
            onChange={(v) => updateSide('right', 'mobileImageUrl', v)}
            storeId={storeInfo?.id}
            storeSlug={storeInfo?.slug}
          />
          <TextField
            label="קישור"
            value={right.link || ''}
            onChange={(v) => updateSide('right', 'link', v)}
            placeholder="/category/women"
          />
        </div>
      </CollapsibleGroup>

      {/* Left Side (Second in RTL) */}
      <CollapsibleGroup title={`תמונה שמאל${left.title ? ` - ${left.title}` : ''}`} defaultOpen={false}>
        <div className="space-y-3 pt-2">
          <TextField
            label="כותרת"
            value={left.title || ''}
            onChange={(v) => updateSide('left', 'title', v)}
            placeholder="גברים"
          />
          <ImageField
            label="תמונה (מחשב)"
            value={left.imageUrl || ''}
            onChange={(v) => updateSide('left', 'imageUrl', v)}
            storeId={storeInfo?.id}
            storeSlug={storeInfo?.slug}
          />
          <ImageField
            label="תמונה (מובייל)"
            value={left.mobileImageUrl || ''}
            onChange={(v) => updateSide('left', 'mobileImageUrl', v)}
            storeId={storeInfo?.id}
            storeSlug={storeInfo?.slug}
          />
          <TextField
            label="קישור"
            value={left.link || ''}
            onChange={(v) => updateSide('left', 'link', v)}
            placeholder="/category/men"
          />
        </div>
      </CollapsibleGroup>
    </div>
  );
}

// Video Banner Settings
function VideoBannerContentSettings({ section, onUpdate, storeInfo }: { section: Section; onUpdate: (updates: Partial<Section>) => void; storeInfo?: StoreInfo }) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  return (
    <>
      <SettingsGroup title="מדיה - מחשב">
        <TextField
          label="קישור וידאו"
          value={(section.content.videoUrl as string) || ''}
          onChange={(v) => updateContent('videoUrl', v)}
          placeholder="https://..."
        />
        <ImageField
          label="תמונת רקע (אם אין וידאו)"
          value={(section.content.imageUrl as string) || ''}
          onChange={(v) => updateContent('imageUrl', v)}
          storeId={storeInfo?.id}
          storeSlug={storeInfo?.slug}
        />
      </SettingsGroup>

      <SettingsGroup title="מדיה - מובייל">
        <TextField
          label="קישור וידאו מובייל"
          value={(section.content.mobileVideoUrl as string) || ''}
          onChange={(v) => updateContent('mobileVideoUrl', v)}
          placeholder="https://... (אופציונלי)"
        />
        <ImageField
          label="תמונת מובייל"
          value={(section.content.mobileImageUrl as string) || ''}
          onChange={(v) => updateContent('mobileImageUrl', v)}
          storeId={storeInfo?.id}
          storeSlug={storeInfo?.slug}
        />
      </SettingsGroup>

      <SettingsGroup title="כפתור">
        <TextField
          label="טקסט כפתור"
          value={(section.content.buttonText as string) || ''}
          onChange={(v) => updateContent('buttonText', v)}
          placeholder="גלה עוד"
        />
        <TextField
          label="קישור כפתור"
          value={(section.content.buttonLink as string) || ''}
          onChange={(v) => updateContent('buttonLink', v)}
          placeholder="/products"
        />
      </SettingsGroup>
    </>
  );
}

// =====================================================
// NEW SECTION CONTENT SETTINGS
// =====================================================

// Reviews Content Settings
function ReviewsContentSettings({ section, onUpdate }: { section: Section; onUpdate: (updates: Partial<Section>) => void }) {
  const reviews = (section.content.reviews as Array<{ name: string; text: string; rating: number; date?: string }>) || [
    { name: 'שרה כ.', text: 'מוצר מעולה, ממליצה בחום!', rating: 5 },
    { name: 'דוד מ.', text: 'איכות גבוהה ומשלוח מהיר', rating: 5 },
    { name: 'רחל ל.', text: 'שירות לקוחות מצוין', rating: 4 },
  ];

  const updateReviews = (newReviews: Array<{ name: string; text: string; rating: number; date?: string }>) => {
    onUpdate({ content: { ...section.content, reviews: newReviews } });
  };

  const updateReview = (index: number, field: 'name' | 'text' | 'rating' | 'date', value: string | number) => {
    const newReviews = [...reviews];
    newReviews[index] = { ...newReviews[index], [field]: value };
    updateReviews(newReviews);
  };

  const addReview = () => {
    updateReviews([...reviews, { name: 'לקוח חדש', text: 'ביקורת', rating: 5 }]);
  };

  const removeReview = (index: number) => {
    const newReviews = reviews.filter((_, i) => i !== index);
    updateReviews(newReviews);
  };

  return (
    <>
      <SettingsGroup title="ביקורות">
        <div className="space-y-3">
          {reviews.map((review, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">ביקורת {index + 1}</span>
                <button
                  onClick={() => removeReview(index)}
                  className="p-1 hover:bg-red-100 text-red-600 rounded"
                  title="הסר"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={review.name}
                onChange={(e) => updateReview(index, 'name', e.target.value)}
                className="w-full text-sm font-medium border border-gray-200 rounded px-2 py-1"
                placeholder="שם"
              />
              <textarea
                value={review.text}
                onChange={(e) => updateReview(index, 'text', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded px-2 py-1 min-h-[60px]"
                placeholder="טקסט הביקורת"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">דירוג:</span>
                <select
                  value={review.rating}
                  onChange={(e) => updateReview(index, 'rating', parseInt(e.target.value))}
                  className="text-sm border border-gray-200 rounded px-2 py-1"
                >
                  {[5, 4, 3, 2, 1].map(n => (
                    <option key={n} value={n}>{'⭐'.repeat(n)}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          <button
            onClick={addReview}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600"
          >
            + הוסף ביקורת
          </button>
        </div>
      </SettingsGroup>
    </>
  );
}

// Image + Text Content Settings
function ImageTextContentSettings({ section, onUpdate, storeInfo }: { section: Section; onUpdate: (updates: Partial<Section>) => void; storeInfo?: StoreInfo }) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  return (
    <>
      <SettingsGroup title="תמונה">
        <ImageField
          label="תמונה"
          value={(section.content.imageUrl as string) || ''}
          onChange={(v) => updateContent('imageUrl', v)}
          storeId={storeInfo?.id}
          storeSlug={storeInfo?.slug}
        />
      </SettingsGroup>
      <SettingsGroup title="תוכן">
        <RichTextEditor
          label="טקסט"
          value={(section.content.text as string) || ''}
          onChange={(v) => updateContent('text', v)}
          placeholder="הזן טקסט..."
          minHeight={150}
        />
      </SettingsGroup>
      <SettingsGroup title="כפתור">
        <TextField
          label="טקסט כפתור"
          value={(section.content.buttonText as string) || ''}
          onChange={(v) => updateContent('buttonText', v)}
          placeholder="קרא עוד"
        />
        <TextField
          label="קישור"
          value={(section.content.buttonLink as string) || ''}
          onChange={(v) => updateContent('buttonLink', v)}
          placeholder="/about"
        />
      </SettingsGroup>
    </>
  );
}

// Features Content Settings
function FeaturesContentSettings({ section, onUpdate }: { section: Section; onUpdate: (updates: Partial<Section>) => void }) {
  const features = (section.content.features as Array<{ icon: string; title: string; description: string }>) || [
    { icon: '🚚', title: 'משלוח חינם', description: 'בהזמנה מעל ₪200' },
    { icon: '↩️', title: 'החזרות', description: '14 יום להחזרה' },
    { icon: '🔒', title: 'תשלום מאובטח', description: 'אבטחה מלאה' },
    { icon: '💬', title: 'תמיכה', description: '24/7 זמינים' },
  ];

  const updateFeatures = (newFeatures: Array<{ icon: string; title: string; description: string }>) => {
    onUpdate({ content: { ...section.content, features: newFeatures } });
  };

  const updateFeature = (index: number, field: 'icon' | 'title' | 'description', value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    updateFeatures(newFeatures);
  };

  const addFeature = () => {
    updateFeatures([...features, { icon: '⭐', title: 'יתרון חדש', description: 'תיאור' }]);
  };

  const removeFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index);
    updateFeatures(newFeatures);
  };

  const moveFeature = (index: number, direction: 'up' | 'down') => {
    const newFeatures = [...features];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= features.length) return;
    [newFeatures[index], newFeatures[newIndex]] = [newFeatures[newIndex], newFeatures[index]];
    updateFeatures(newFeatures);
  };

  return (
    <>
      <SettingsGroup title="יתרונות">
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">יתרון {index + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveFeature(index, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                    title="הזז למעלה"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveFeature(index, 'down')}
                    disabled={index === features.length - 1}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                    title="הזז למטה"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeFeature(index)}
                    className="p-1 hover:bg-red-100 text-red-600 rounded"
                    title="הסר"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={feature.icon}
                  onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                  className="w-12 text-center text-xl border border-gray-200 rounded px-1 py-1"
                  placeholder="🔥"
                />
                <input
                  type="text"
                  value={feature.title}
                  onChange={(e) => updateFeature(index, 'title', e.target.value)}
                  className="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
                  placeholder="כותרת"
                />
              </div>
              <input
                type="text"
                value={feature.description}
                onChange={(e) => updateFeature(index, 'description', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded px-2 py-1"
                placeholder="תיאור"
              />
            </div>
          ))}
          <button
            onClick={addFeature}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600"
          >
            + הוסף יתרון
          </button>
        </div>
      </SettingsGroup>
    </>
  );
}

// Banner Small Content Settings
function BannerSmallContentSettings({ section, onUpdate }: { section: Section; onUpdate: (updates: Partial<Section>) => void }) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  return (
    <>
      <SettingsGroup title="תוכן">
        <TextField
          label="אייקון (אימוג'י)"
          value={(section.content.icon as string) || ''}
          onChange={(v) => updateContent('icon', v)}
          placeholder="🎉"
        />
      </SettingsGroup>
      <SettingsGroup title="כפתור">
        <TextField
          label="טקסט כפתור"
          value={(section.content.buttonText as string) || ''}
          onChange={(v) => updateContent('buttonText', v)}
          placeholder="לחנות"
        />
        <TextField
          label="קישור"
          value={(section.content.buttonLink as string) || ''}
          onChange={(v) => updateContent('buttonLink', v)}
          placeholder="/products"
        />
      </SettingsGroup>
    </>
  );
}

// Gallery Content Settings
function GalleryContentSettings({ section, onUpdate, storeInfo }: { section: Section; onUpdate: (updates: Partial<Section>) => void; storeInfo?: StoreInfo }) {
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  
  const images = (section.content.images as Array<{ url: string; alt?: string }>) || [];

  const updateImages = (newImages: Array<{ url: string; alt?: string }>) => {
    onUpdate({ content: { ...section.content, images: newImages } });
  };

  const addImage = (url: string) => {
    updateImages([...images, { url, alt: '' }]);
    setShowMediaPicker(false);
  };

  const updateImageAlt = (index: number, alt: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], alt };
    updateImages(newImages);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    updateImages(newImages);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    updateImages(newImages);
  };

  return (
    <>
      <SettingsGroup title="תמונות גלריה">
        <div className="space-y-3">
          {images.map((image, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-2 space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden shrink-0">
                  {image.url ? (
                    <img src={image.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">📷</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={image.alt || ''}
                    onChange={(e) => updateImageAlt(index, e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                    placeholder="טקסט חלופי (alt)"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveImage(index, 'up')}
                    disabled={index === 0}
                    className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 text-xs"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveImage(index, 'down')}
                    disabled={index === images.length - 1}
                    className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 text-xs"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeImage(index)}
                    className="p-0.5 hover:bg-red-100 text-red-600 rounded text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={() => setShowMediaPicker(true)}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600"
          >
            + הוסף תמונה
          </button>
        </div>
      </SettingsGroup>

      {showMediaPicker && storeInfo && (
        <MediaPickerModal
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={(items: MediaItem[]) => items[0] && addImage(items[0].url)}
          storeId={storeInfo.id}
          storeSlug={storeInfo.slug}
        />
      )}
    </>
  );
}

// Text Block Content Settings
function TextBlockContentSettings({ section, onUpdate }: { section: Section; onUpdate: (updates: Partial<Section>) => void }) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  return (
    <>
      <SettingsGroup title="תוכן">
        <RichTextEditor
          label="טקסט"
          value={(section.content.text as string) || ''}
          onChange={(v) => updateContent('text', v)}
          placeholder="הזן טקסט..."
          minHeight={200}
        />
      </SettingsGroup>
      <SettingsGroup title="כפתור">
        <TextField
          label="טקסט כפתור"
          value={(section.content.buttonText as string) || ''}
          onChange={(v) => updateContent('buttonText', v)}
          placeholder="קרא עוד"
        />
        <TextField
          label="קישור"
          value={(section.content.buttonLink as string) || ''}
          onChange={(v) => updateContent('buttonLink', v)}
          placeholder="/about"
        />
      </SettingsGroup>
    </>
  );
}

// Logos Content Settings
function LogosContentSettings({ section, onUpdate, storeInfo }: { section: Section; onUpdate: (updates: Partial<Section>) => void; storeInfo?: StoreInfo }) {
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  
  const logos = (section.content.logos as Array<{ url: string; name?: string; link?: string }>) || [];

  const updateLogos = (newLogos: Array<{ url: string; name?: string; link?: string }>) => {
    onUpdate({ content: { ...section.content, logos: newLogos } });
  };

  const addLogo = (url: string) => {
    updateLogos([...logos, { url, name: '', link: '' }]);
    setShowMediaPicker(false);
  };

  const updateLogo = (index: number, field: 'name' | 'link', value: string) => {
    const newLogos = [...logos];
    newLogos[index] = { ...newLogos[index], [field]: value };
    updateLogos(newLogos);
  };

  const removeLogo = (index: number) => {
    const newLogos = logos.filter((_, i) => i !== index);
    updateLogos(newLogos);
  };

  const moveLogo = (index: number, direction: 'up' | 'down') => {
    const newLogos = [...logos];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= logos.length) return;
    [newLogos[index], newLogos[newIndex]] = [newLogos[newIndex], newLogos[index]];
    updateLogos(newLogos);
  };

  return (
    <>
      <SettingsGroup title="לוגואים">
        <div className="space-y-3">
          {logos.map((logo, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-2 space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden shrink-0 flex items-center justify-center">
                  {logo.url ? (
                    <img src={logo.url} alt="" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-gray-400 text-xs">לוגו</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <input
                    type="text"
                    value={logo.name || ''}
                    onChange={(e) => updateLogo(index, 'name', e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                    placeholder="שם (אופציונלי)"
                  />
                  <input
                    type="text"
                    value={logo.link || ''}
                    onChange={(e) => updateLogo(index, 'link', e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                    placeholder="קישור (אופציונלי)"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveLogo(index, 'up')}
                    disabled={index === 0}
                    className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 text-xs"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveLogo(index, 'down')}
                    disabled={index === logos.length - 1}
                    className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 text-xs"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeLogo(index)}
                    className="p-0.5 hover:bg-red-100 text-red-600 rounded text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={() => setShowMediaPicker(true)}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600"
          >
            + הוסף לוגו
          </button>
        </div>
      </SettingsGroup>

      {showMediaPicker && storeInfo && (
        <MediaPickerModal
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={(items: MediaItem[]) => items[0] && addLogo(items[0].url)}
          storeId={storeInfo.id}
          storeSlug={storeInfo.slug}
        />
      )}
    </>
  );
}

// FAQ Content Settings
function FAQContentSettings({ section, onUpdate }: { section: Section; onUpdate: (updates: Partial<Section>) => void }) {
  const faqs = (section.content.faqs as Array<{ question: string; answer: string }>) || [
    { question: 'מהי מדיניות ההחזרות?', answer: 'ניתן להחזיר מוצרים תוך 14 ימים מיום הרכישה.' },
    { question: 'כמה זמן לוקח המשלוח?', answer: 'משלוחים מגיעים תוך 3-5 ימי עסקים.' },
    { question: 'האם יש משלוח חינם?', answer: 'כן, משלוח חינם בהזמנות מעל ₪200.' },
  ];

  const updateFaqs = (newFaqs: Array<{ question: string; answer: string }>) => {
    onUpdate({ content: { ...section.content, faqs: newFaqs } });
  };

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...faqs];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    updateFaqs(newFaqs);
  };

  const addFaq = () => {
    updateFaqs([...faqs, { question: 'שאלה חדשה', answer: 'תשובה' }]);
  };

  const removeFaq = (index: number) => {
    const newFaqs = faqs.filter((_, i) => i !== index);
    updateFaqs(newFaqs);
  };

  const moveFaq = (index: number, direction: 'up' | 'down') => {
    const newFaqs = [...faqs];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= faqs.length) return;
    [newFaqs[index], newFaqs[newIndex]] = [newFaqs[newIndex], newFaqs[index]];
    updateFaqs(newFaqs);
  };

  return (
    <>
      <SettingsGroup title="שאלות ותשובות">
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">שאלה {index + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveFaq(index, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                    title="הזז למעלה"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveFaq(index, 'down')}
                    disabled={index === faqs.length - 1}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                    title="הזז למטה"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeFaq(index)}
                    className="p-1 hover:bg-red-100 text-red-600 rounded"
                    title="הסר"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={faq.question}
                onChange={(e) => updateFaq(index, 'question', e.target.value)}
                className="w-full text-sm font-medium border border-gray-200 rounded px-2 py-1"
                placeholder="שאלה"
              />
              <textarea
                value={faq.answer}
                onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded px-2 py-1 min-h-[60px]"
                placeholder="תשובה"
              />
            </div>
          ))}
          <button
            onClick={addFaq}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600"
          >
            + הוסף שאלה
          </button>
        </div>
      </SettingsGroup>
    </>
  );
}

// Contact Content Settings
function ContactContentSettings({ section, onUpdate }: { section: Section; onUpdate: (updates: Partial<Section>) => void }) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  return (
    <>
      <SettingsGroup title="פרטי התקשרות">
        <TextField
          label="אימייל"
          value={(section.content.email as string) || ''}
          onChange={(v) => updateContent('email', v)}
          placeholder="info@example.com"
        />
        <TextField
          label="טלפון"
          value={(section.content.phone as string) || ''}
          onChange={(v) => updateContent('phone', v)}
          placeholder="03-1234567"
        />
        <TextField
          label="כתובת"
          value={(section.content.address as string) || ''}
          onChange={(v) => updateContent('address', v)}
          placeholder="רחוב הדוגמה 1, תל אביב"
        />
        <TextField
          label="שעות פעילות"
          value={(section.content.hours as string) || ''}
          onChange={(v) => updateContent('hours', v)}
          placeholder="ימים א'-ה' 9:00-18:00"
        />
      </SettingsGroup>

      <SettingsGroup title="טופס יצירת קשר">
        <SwitchField
          label="הצג טופס"
          value={(section.content.showForm as boolean) ?? true}
          onChange={(v) => updateContent('showForm', v)}
        />
        {(section.content.showForm as boolean) && (
          <>
            <TextField
              label="טקסט כפתור שליחה"
              value={(section.content.submitButtonText as string) || 'שליחה'}
              onChange={(v) => updateContent('submitButtonText', v)}
            />
          </>
        )}
      </SettingsGroup>

      <SettingsGroup title="התראות">
        <TextField
          label="אימייל לקבלת התראות"
          value={(section.content.notificationEmail as string) || ''}
          onChange={(v) => updateContent('notificationEmail', v)}
          placeholder="הזינו אימייל לקבלת פניות (אופציונלי)"
        />
        <p className="text-xs text-gray-500 mt-1">
          אם ריק, ישלח לאימייל של החנות
        </p>
      </SettingsGroup>

      <SettingsGroup title="אינטגרציות">
        <TextField
          label="כתובת Webhook"
          value={(section.content.webhookUrl as string) || ''}
          onChange={(v) => updateContent('webhookUrl', v)}
          placeholder="https://..."
        />
        <p className="text-xs text-gray-500 mt-1">
          לחיבור ל-Zapier, Make או מערכות אחרות
        </p>
      </SettingsGroup>

      <SettingsGroup title="טקסט נוסף">
        <RichTextEditor
          value={(section.content.text as string) || ''}
          onChange={(v) => updateContent('text', v)}
        />
      </SettingsGroup>
    </>
  );
}

// =====================================================
// ARGANIA PREMIUM SECTION SETTINGS
// =====================================================

// Hero Premium Content Settings
function HeroPremiumContentSettings({ section, onUpdate, storeInfo }: { section: Section; onUpdate: (updates: Partial<Section>) => void; storeInfo?: StoreInfo }) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };
  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
  };

  const hasVideo = !!(section.content.videoUrl as string);

  return (
    <>
      <SettingsGroup title="וידאו רקע (דורס תמונה)">
        <TextField
          label="כתובת וידאו (דסקטופ)"
          value={(section.content.videoUrl as string) || ''}
          onChange={(v) => updateContent('videoUrl', v)}
          placeholder="https://example.com/video.mp4"
        />
        <TextField
          label="כתובת וידאו (מובייל)"
          value={(section.content.mobileVideoUrl as string) || ''}
          onChange={(v) => updateContent('mobileVideoUrl', v)}
          placeholder="אופציונלי - יוצג במקום הדסקטופ במובייל"
        />
        {hasVideo && (
          <>
            <SwitchField
              label="הפעלה אוטומטית"
              value={(section.settings.videoAutoplay as boolean) !== false}
              onChange={(v) => updateSettings('videoAutoplay', v)}
            />
            <SwitchField
              label="השתק"
              value={(section.settings.videoMuted as boolean) !== false}
              onChange={(v) => updateSettings('videoMuted', v)}
            />
            <SwitchField
              label="לופ (חזרה)"
              value={(section.settings.videoLoop as boolean) !== false}
              onChange={(v) => updateSettings('videoLoop', v)}
            />
            <SwitchField
              label="הצג פקדים"
              value={(section.settings.videoControls as boolean) || false}
              onChange={(v) => updateSettings('videoControls', v)}
            />
          </>
        )}
      </SettingsGroup>
      <SettingsGroup title="תמונת רקע - מחשב">
        <ImageField
          label="תמונה (דסקטופ)"
          value={(section.content.imageUrl as string) || ''}
          onChange={(v) => updateContent('imageUrl', v)}
          storeId={storeInfo?.id}
          storeSlug={storeInfo?.slug}
          hint={hasVideo ? "לא בשימוש - וידאו מוגדר" : "מומלץ: 1920x1080 או גדול יותר"}
        />
      </SettingsGroup>
      <SettingsGroup title="תמונת רקע - מובייל">
        <ImageField
          label="תמונה (מובייל)"
          value={(section.content.mobileImageUrl as string) || ''}
          onChange={(v) => updateContent('mobileImageUrl', v)}
          storeId={storeInfo?.id}
          storeSlug={storeInfo?.slug}
          hint={hasVideo ? "לא בשימוש - וידאו מוגדר" : "מומלץ: 750x1334 (אופציונלי)"}
        />
      </SettingsGroup>
      <SettingsGroup title="טקסט">
        <TextField
          label="אייברו (טקסט קטן)"
          value={(section.content.eyebrow as string) || ''}
          onChange={(v) => updateContent('eyebrow', v)}
          placeholder="הטבע בשיא יופיו"
        />
        <TextField
          label="כותרת ראשית"
          value={(section.content.headline as string) || ''}
          onChange={(v) => updateContent('headline', v)}
          placeholder="חווית טיפוח"
        />
        <TextField
          label="כותרת מודגשת"
          value={(section.content.headlineAccent as string) || ''}
          onChange={(v) => updateContent('headlineAccent', v)}
          placeholder="יוקרתית וטבעית"
        />
        <RichTextEditor
          label="תיאור"
          value={(section.content.description as string) || ''}
          onChange={(v) => updateContent('description', v)}
          placeholder="גלי את סדרות הטיפוח המתקדמות שלנו..."
          minHeight={100}
        />
      </SettingsGroup>
      <SettingsGroup title="כפתור ראשי">
        <TextField
          label="טקסט"
          value={(section.content.primaryButtonText as string) || ''}
          onChange={(v) => updateContent('primaryButtonText', v)}
          placeholder="לקטלוג המלא"
        />
        <TextField
          label="קישור"
          value={(section.content.primaryButtonLink as string) || ''}
          onChange={(v) => updateContent('primaryButtonLink', v)}
          placeholder="/products"
        />
        <SelectField
          label="סגנון"
          value={(section.content.primaryButtonStyle as string) || 'filled'}
          options={[
            { value: 'filled', label: 'מלא' },
            { value: 'outline', label: 'מסגרת' },
          ]}
          onChange={(v) => updateContent('primaryButtonStyle', v)}
        />
      </SettingsGroup>
      <SettingsGroup title="כפתור משני">
        <TextField
          label="טקסט"
          value={(section.content.secondaryButtonText as string) || ''}
          onChange={(v) => updateContent('secondaryButtonText', v)}
          placeholder="אבחון שיער"
        />
        <TextField
          label="קישור"
          value={(section.content.secondaryButtonLink as string) || ''}
          onChange={(v) => updateContent('secondaryButtonLink', v)}
          placeholder="/quiz"
        />
        <SelectField
          label="סגנון"
          value={(section.content.secondaryButtonStyle as string) || 'outline'}
          options={[
            { value: 'filled', label: 'מלא' },
            { value: 'outline', label: 'מסגרת' },
          ]}
          onChange={(v) => updateContent('secondaryButtonStyle', v)}
        />
      </SettingsGroup>
      <SettingsGroup title="הגדרות תצוגה">
        <TextField
          label="גובה (מחשב)"
          value={(section.settings.height as string) || '800px'}
          onChange={(v) => updateSettings('height', v)}
          placeholder="800px"
        />
        <TextField
          label="גובה (מובייל)"
          value={(section.settings.mobileHeight as string) || '600px'}
          onChange={(v) => updateSettings('mobileHeight', v)}
          placeholder="600px"
        />
        <SwitchField
          label="הצג גרדיאנט"
          description="שכבה לבנבנה שעוזרת לקריאות הטקסט"
          value={(section.settings.showGradient as boolean) !== false}
          onChange={(v) => updateSettings('showGradient', v)}
        />
        {(section.settings.showGradient as boolean) !== false && (
          <SelectField
            label="כיוון גרדיאנט"
            value={(section.settings.gradientDirection as string) || 'left'}
            options={[
              { value: 'left', label: 'משמאל (תוכן מימין)' },
              { value: 'right', label: 'מימין (תוכן משמאל)' },
              { value: 'center', label: 'מרכז' },
            ]}
            onChange={(v) => updateSettings('gradientDirection', v)}
          />
        )}
        <SliderField
          label="שקיפות שכבה כהה"
          value={Math.round(((section.settings.overlayOpacity as number) || 0.3) * 100)}
          min={0}
          max={80}
          suffix="%"
          onChange={(v) => updateSettings('overlayOpacity', v / 100)}
        />
        <ColorField
          label="צבע הדגשה"
          value={(section.settings.accentColor as string) || '#d4af37'}
          onChange={(v) => updateSettings('accentColor', v)}
        />
      </SettingsGroup>
    </>
  );
}

// Series Grid Content Settings (Action Cards)
function SeriesGridContentSettings({ section, onUpdate, storeInfo }: { section: Section; onUpdate: (updates: Partial<Section>) => void; storeInfo?: StoreInfo }) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };
  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
  };

  const items = (section.content.items as Array<{
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    imageUrl?: string;
    link: string;
  }>) || [];

  const updateItem = (index: number, key: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [key]: value };
    updateContent('items', newItems);
  };

  const addItem = () => {
    const newItems = [...items, {
      id: `item-${Date.now()}`,
      title: 'סדרה חדשה',
      subtitle: '',
      description: '',
      imageUrl: '',
      link: '/collections/new',
    }];
    updateContent('items', newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    updateContent('items', newItems);
  };

  return (
    <>
      <SettingsGroup title="הגדרות תצוגה">
        <SelectField
          label="סגנון"
          value={(section.settings.style as string) || 'cards'}
          options={[
            { value: 'cards', label: 'כרטיסים (תמונה למעלה)' },
            { value: 'overlay', label: 'שכבה על תמונה' },
          ]}
          onChange={(v) => updateSettings('style', v)}
        />
        <SelectField
          label="עמודות"
          value={String((section.settings.columns as number) || 3)}
          options={[
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
          ]}
          onChange={(v) => updateSettings('columns', parseInt(v))}
        />
        <TextField
          label="גובה מינימום לתמונות"
          value={(section.settings.minImageHeight as string) || '200px'}
          onChange={(v) => updateSettings('minImageHeight', v)}
          placeholder="200px"
        />
        <SelectField
          label="יחס תמונה"
          value={(section.settings.imageAspectRatio as string) || 'auto'}
          options={[
            { value: 'auto', label: 'אוטומטי (לפי גובה מינימום)' },
            { value: 'square', label: 'ריבוע (1:1)' },
            { value: 'portrait', label: 'פורטרט (3:4)' },
            { value: 'landscape', label: 'לנדסקייפ (16:9)' },
          ]}
          onChange={(v) => updateSettings('imageAspectRatio', v)}
        />
        <TextField
          label="טקסט כפתור"
          value={(section.settings.buttonText as string) || 'לצפייה במוצרים'}
          onChange={(v) => updateSettings('buttonText', v)}
          placeholder="לצפייה במוצרים"
        />
        <SwitchField
          label="הצג תיאור תמיד"
          description="בסגנון 'שכבה על תמונה' - התיאור יוצג תמיד ולא רק בהעברת עכבר"
          value={(section.settings.showDescriptionAlways as boolean) || false}
          onChange={(v) => updateSettings('showDescriptionAlways', v)}
        />
      </SettingsGroup>
      <SettingsGroup title="צבעים">
        <ColorField
          label="רקע סקשן"
          value={(section.settings.sectionBackground as string) || '#f9f7f4'}
          onChange={(v) => updateSettings('sectionBackground', v)}
        />
        <ColorField
          label="רקע כרטיס"
          value={(section.settings.cardBackground as string) || '#ffffff'}
          onChange={(v) => updateSettings('cardBackground', v)}
        />
        <ColorField
          label="צבע הדגשה"
          value={(section.settings.accentColor as string) || '#d4af37'}
          onChange={(v) => updateSettings('accentColor', v)}
        />
      </SettingsGroup>
      
      {/* Items Editor */}
      <div className="border-t border-gray-100 pt-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">כרטיסים ({items.length})</h4>
          <button
            onClick={addItem}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            + הוסף כרטיס
          </button>
        </div>
        
        <div className="space-y-4">
          {items.map((item, index) => (
            <CollapsibleGroup 
              key={item.id} 
              title={item.title || `כרטיס ${index + 1}`}
              defaultOpen={index === 0}
            >
              <div className="space-y-3 pt-2">
                <ImageField
                  label="תמונה"
                  value={item.imageUrl || ''}
                  onChange={(v) => updateItem(index, 'imageUrl', v)}
                  storeId={storeInfo?.id}
                  storeSlug={storeInfo?.slug}
                />
                <TextField
                  label="כותרת"
                  value={item.title || ''}
                  onChange={(v) => updateItem(index, 'title', v)}
                  placeholder="שם הסדרה"
                />
                <TextField
                  label="תת-כותרת (אייברו)"
                  value={item.subtitle || ''}
                  onChange={(v) => updateItem(index, 'subtitle', v)}
                  placeholder="קטגוריה"
                />
                <TextAreaField
                  label="תיאור"
                  value={item.description || ''}
                  onChange={(v) => updateItem(index, 'description', v)}
                  placeholder="תיאור קצר..."
                />
                <TextField
                  label="קישור"
                  value={item.link || ''}
                  onChange={(v) => updateItem(index, 'link', v)}
                  placeholder="/collections/series-name"
                />
                <button
                  onClick={() => removeItem(index)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  הסר כרטיס
                </button>
              </div>
            </CollapsibleGroup>
          ))}
        </div>
      </div>
    </>
  );
}

// Quote Banner Content Settings
function QuoteBannerContentSettings({ section, onUpdate, storeInfo }: { section: Section; onUpdate: (updates: Partial<Section>) => void; storeInfo?: StoreInfo }) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };
  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
  };

  const mediaType = (section.content.mediaType as string) || 'image';

  return (
    <>
      <SettingsGroup title="ציטוט">
        <TextAreaField
          label="טקסט הציטוט"
          value={(section.content.quote as string) || ''}
          onChange={(v) => updateContent('quote', v)}
          placeholder="היופי מתחיל בטבע..."
        />
        <TextField
          label="מקור/חתימה"
          value={(section.content.attribution as string) || ''}
          onChange={(v) => updateContent('attribution', v)}
          placeholder="צוות Argania"
        />
      </SettingsGroup>
      <SettingsGroup title="סוג מדיה">
        <SelectField
          label="סוג רקע"
          value={mediaType}
          options={[
            { value: 'image', label: 'תמונה' },
            { value: 'video', label: 'וידאו' },
          ]}
          onChange={(v) => updateContent('mediaType', v)}
        />
      </SettingsGroup>
      
      {mediaType === 'image' ? (
        <>
          <SettingsGroup title="תמונת רקע - מחשב">
            <ImageField
              label="תמונה (דסקטופ)"
              value={(section.content.imageUrl as string) || ''}
              onChange={(v) => updateContent('imageUrl', v)}
              storeId={storeInfo?.id}
              storeSlug={storeInfo?.slug}
              hint="מומלץ: 1920x800"
            />
          </SettingsGroup>
          <SettingsGroup title="תמונת רקע - מובייל">
            <ImageField
              label="תמונה (מובייל)"
              value={(section.content.mobileImageUrl as string) || ''}
              onChange={(v) => updateContent('mobileImageUrl', v)}
              storeId={storeInfo?.id}
              storeSlug={storeInfo?.slug}
              hint="אופציונלי - אם ריק תוצג תמונת המחשב"
            />
          </SettingsGroup>
        </>
      ) : (
        <>
          <SettingsGroup title="וידאו רקע - מחשב">
            <TextField
              label="קישור וידאו (דסקטופ)"
              value={(section.content.videoUrl as string) || ''}
              onChange={(v) => updateContent('videoUrl', v)}
              placeholder="https://..."
            />
          </SettingsGroup>
          <SettingsGroup title="וידאו רקע - מובייל">
            <TextField
              label="קישור וידאו (מובייל)"
              value={(section.content.mobileVideoUrl as string) || ''}
              onChange={(v) => updateContent('mobileVideoUrl', v)}
              placeholder="אופציונלי"
            />
          </SettingsGroup>
        </>
      )}
      
      <SettingsGroup title="הגדרות תצוגה">
        <TextField
          label="גובה (מחשב)"
          value={(section.settings.height as string) || '400px'}
          onChange={(v) => updateSettings('height', v)}
          placeholder="400px"
        />
        <TextField
          label="גובה (מובייל)"
          value={(section.settings.mobileHeight as string) || '350px'}
          onChange={(v) => updateSettings('mobileHeight', v)}
          placeholder="350px"
        />
        <SliderField
          label="שקיפות שכבה כהה"
          value={Math.round(((section.settings.overlay as number) || 0.4) * 100)}
          min={0}
          max={90}
          suffix="%"
          onChange={(v) => updateSettings('overlay', v / 100)}
        />
        <SelectField
          label="סגנון טקסט"
          value={(section.settings.textStyle as string) || 'italic'}
          options={[
            { value: 'italic', label: 'איטליק (סריף)' },
            { value: 'serif', label: 'סריף רגיל' },
            { value: 'sans', label: 'סאנס' },
          ]}
          onChange={(v) => updateSettings('textStyle', v)}
        />
        <SwitchField
          label="אפקט פרלקס"
          value={(section.settings.parallax as boolean) !== false}
          onChange={(v) => updateSettings('parallax', v)}
        />
      </SettingsGroup>
    </>
  );
}

// Featured Items Content Settings (Simple Image + Name Cards)
function FeaturedItemsContentSettings({ section, onUpdate, storeInfo }: { section: Section; onUpdate: (updates: Partial<Section>) => void; storeInfo?: StoreInfo }) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };
  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
  };

  const items = (section.content.items as Array<{
    id: string;
    name: string;
    imageUrl?: string;
    videoUrl?: string;
    link: string;
  }>) || [];

  const updateItem = (index: number, key: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [key]: value };
    updateContent('items', newItems);
  };

  const addItem = () => {
    const newItems = [...items, {
      id: `item-${Date.now()}`,
      name: 'פריט חדש',
      imageUrl: '',
      link: '/products/new',
    }];
    updateContent('items', newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    updateContent('items', newItems);
  };

  return (
    <>
      <SettingsGroup title="הגדרות תצוגה">
        <SelectField
          label="עמודות"
          value={String((section.settings.columns as number) || 3)}
          options={[
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
          ]}
          onChange={(v) => updateSettings('columns', parseInt(v))}
        />
        <SelectField
          label="יחס תמונה"
          value={(section.settings.imageAspectRatio as string) || 'square'}
          options={[
            { value: 'square', label: 'ריבוע (1:1)' },
            { value: 'portrait', label: 'פורטרט (3:4)' },
            { value: 'landscape', label: 'לנדסקייפ (16:9)' },
          ]}
          onChange={(v) => updateSettings('imageAspectRatio', v)}
        />
        <SelectField
          label="אפקט ריחוף"
          value={(section.settings.hoverEffect as string) || 'zoom'}
          options={[
            { value: 'zoom', label: 'זום' },
            { value: 'lift', label: 'הרמה' },
            { value: 'none', label: 'ללא' },
          ]}
          onChange={(v) => updateSettings('hoverEffect', v)}
        />
        <SelectField
          label="סגנון תמונה"
          value={(section.settings.imageStyle as string) || 'rounded'}
          options={[
            { value: 'rounded', label: 'מעוגל' },
            { value: 'square', label: 'ריבוע' },
            { value: 'circle', label: 'עיגול' },
          ]}
          onChange={(v) => updateSettings('imageStyle', v)}
        />
      </SettingsGroup>
      <SettingsGroup title="צבעים">
        <ColorField
          label="רקע סקשן"
          value={(section.settings.sectionBackground as string) || '#ffffff'}
          onChange={(v) => updateSettings('sectionBackground', v)}
        />
        <ColorField
          label="צבע טקסט"
          value={(section.settings.textColor as string) || '#1f2937'}
          onChange={(v) => updateSettings('textColor', v)}
        />
      </SettingsGroup>
      
      {/* Items Editor */}
      <div className="border-t border-gray-100 pt-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">פריטים ({items.length})</h4>
          <button
            onClick={addItem}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            + הוסף פריט
          </button>
        </div>
        
        <div className="space-y-4">
          {items.map((item, index) => (
            <CollapsibleGroup 
              key={item.id} 
              title={item.name || `פריט ${index + 1}`}
              defaultOpen={index === 0}
            >
              <div className="space-y-3 pt-2">
                <ImageField
                  label="תמונה"
                  value={item.imageUrl || ''}
                  onChange={(v) => updateItem(index, 'imageUrl', v)}
                  storeId={storeInfo?.id}
                  storeSlug={storeInfo?.slug}
                />
                <TextField
                  label="וידאו (אופציונלי - מחליף תמונה)"
                  value={item.videoUrl || ''}
                  onChange={(v) => updateItem(index, 'videoUrl', v)}
                  placeholder="https://example.com/video.mp4"
                />
                <TextField
                  label="שם"
                  value={item.name || ''}
                  onChange={(v) => updateItem(index, 'name', v)}
                  placeholder="שם הפריט"
                />
                <TextField
                  label="קישור"
                  value={item.link || ''}
                  onChange={(v) => updateItem(index, 'link', v)}
                  placeholder="/products/item-name"
                />
                <button
                  onClick={() => removeItem(index)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  הסר פריט
                </button>
              </div>
            </CollapsibleGroup>
          ))}
        </div>
      </div>
    </>
  );
}

// =====================================================
// UI Components
// =====================================================

// UI Components
function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</h4>
      {children}
    </div>
  );
}

function CollapsibleGroup({ 
  title, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-gray-100 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-1"
      >
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {isOpen && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-20 focus:outline-none focus:border-blue-500"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
        />
      )}
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500"
      />
      {hint && (
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-700">{label}</label>
      <div className="flex border border-gray-200 rounded-lg overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              value === opt 
                ? 'bg-gray-900 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function SwitchField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <label className="text-sm text-gray-700">{label}</label>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          value ? 'bg-blue-500' : 'bg-gray-200'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
            value ? 'right-1' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-gray-700 shrink-0">{label}</label>
      <div className="flex items-center gap-3 flex-1">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500"
          dir="ltr"
        />
        <div className="flex items-center gap-1 w-16">
          <input
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-12 px-2 py-1 border border-gray-200 rounded text-sm text-center focus:outline-none focus:border-blue-500"
            dir="ltr"
          />
          {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  // Handle empty, undefined, or 'transparent' values - input type="color" requires valid hex
  const displayValue = (!value || value === '' || value === 'transparent') ? '#000000' : value;
  const labelValue = (!value || value === '' || value === 'transparent') ? 'לא נבחר' : value;
  
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
        />
        <span className="text-xs text-gray-500">
          {labelValue}
        </span>
      </div>
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
  storeId,
  storeSlug,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  storeId?: string;
  storeSlug?: string;
  hint?: string;
}) {
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const handleSelect = (items: MediaItem[]) => {
    if (items.length > 0) {
      onChange(items[0].url);
    }
  };

  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1.5">{label}</label>
      
      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt=""
            className="w-full h-32 object-cover rounded-lg border border-gray-200"
          />
          <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsMediaPickerOpen(true)}
              className="p-1.5 bg-white/90 rounded shadow hover:bg-white"
              title="החלף"
            >
              <EditIcon />
            </button>
            <button
              onClick={() => onChange('')}
              className="p-1.5 bg-white/90 rounded shadow hover:bg-white"
              title="הסר"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsMediaPickerOpen(true)}
          className="w-full h-28 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center hover:border-gray-300 transition-colors cursor-pointer"
        >
          <UploadIcon />
          <span className="text-xs text-gray-500 mt-2">בחר תמונה</span>
        </button>
      )}
      
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}

      {/* Media Picker Modal */}
      {storeId && storeSlug && (
        <MediaPickerModal
          isOpen={isMediaPickerOpen}
          onClose={() => setIsMediaPickerOpen(false)}
          onSelect={handleSelect}
          storeId={storeId}
          storeSlug={storeSlug}
          multiple={false}
          maxSelect={1}
        />
      )}
    </div>
  );
}

// Logo/Favicon upload field with real upload functionality
function LogoUploadField({
  label,
  value,
  onChange,
  storeId,
  storeSlug,
  aspectRatio = '16:9',
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  storeId?: string;
  storeSlug?: string;
  aspectRatio?: string;
  hint?: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('יש להעלות קובץ תמונה בלבד');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('גודל הקובץ המקסימלי הוא 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (storeSlug) formData.append('folder', `quickshop/stores/${storeSlug}`);
      if (storeId) formData.append('storeId', storeId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      onChange(result.secure_url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('שגיאה בהעלאת הקובץ');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1.5">{label}</label>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      {value ? (
        <div className="relative group">
          <div 
            className={`bg-gray-50 rounded-lg border border-gray-200 p-3 flex items-center justify-center ${
              aspectRatio === '1:1' ? 'h-20' : 'h-24'
            }`}
          >
            <img
              src={value}
              alt=""
              className={`max-h-full max-w-full object-contain ${
                aspectRatio === '1:1' ? 'h-14 w-14' : ''
              }`}
            />
          </div>
          <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 bg-white/90 rounded shadow hover:bg-white"
              title="החלף"
            >
              <EditIcon />
            </button>
            <button
              onClick={() => onChange('')}
              className="p-1.5 bg-white/90 rounded shadow hover:bg-white"
              title="הסר"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center hover:border-gray-300 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          ) : (
            <>
              <UploadIcon />
              <span className="text-xs text-gray-500 mt-1">העלה {label.toLowerCase()}</span>
            </>
          )}
        </button>
      )}
      {hint && (
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
      )}
    </div>
  );
}

// Icons
function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}

// Header Layout Settings Component
function HeaderLayoutSettings({ 
  currentLayout, 
  onLayoutChange 
}: { 
  currentLayout: HeaderLayout; 
  onLayoutChange: (layout: HeaderLayout) => void;
}) {
  const layouts: { id: HeaderLayout; title: string; description: string }[] = [
    {
      id: 'logo-right',
      title: 'לוגו בימין',
      description: 'לוגו בימין, תפריט במרכז, אייקונים משמאל',
    },
    {
      id: 'logo-left',
      title: 'לוגו בשמאל',
      description: 'לוגו בשמאל, תפריט במרכז, אייקונים מימין',
    },
    {
      id: 'logo-center',
      title: 'לוגו במרכז',
      description: 'לוגו במרכז, חיפוש מימין ושאר אייקונים משמאל, תפריט מתחת',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-1">פריסת הדר</h4>
        <p className="text-xs text-gray-500 mb-4">בחרו את סגנון פריסת ההדר לחנות שלכם</p>
      </div>
      
      <div className="space-y-3">
        {layouts.map((layout) => (
          <button
            key={layout.id}
            onClick={() => onLayoutChange(layout.id)}
            className={`w-full p-3 rounded-xl border-2 transition-all text-right ${
              currentLayout === layout.id
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Layout Preview */}
            <div className={`bg-white rounded-lg border border-gray-100 p-2 mb-3 ${
              currentLayout === layout.id ? 'ring-1 ring-black/10' : ''
            }`}>
              <HeaderLayoutPreview layout={layout.id} isSelected={currentLayout === layout.id} />
            </div>
            
            {/* Title & Description */}
            <div className="flex items-start gap-2">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                currentLayout === layout.id 
                  ? 'border-black bg-black' 
                  : 'border-gray-300'
              }`}>
                {currentLayout === layout.id && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">{layout.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{layout.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Header Layout Preview Component - shows visual representation
function HeaderLayoutPreview({ layout, isSelected }: { layout: HeaderLayout; isSelected: boolean }) {
  const dotColor = isSelected ? 'bg-gray-600' : 'bg-gray-300';
  const barColor = isSelected ? 'bg-gray-800' : 'bg-gray-400';
  
  if (layout === 'logo-right') {
    // Logo right, menu center, icons left (RTL default)
    return (
      <div className="flex items-center justify-between h-6" dir="rtl">
        <div className={`w-8 h-3 ${barColor} rounded`} /> {/* Logo */}
        <div className="flex gap-1">
          <div className={`w-4 h-1.5 ${dotColor} rounded`} />
          <div className={`w-4 h-1.5 ${dotColor} rounded`} />
          <div className={`w-4 h-1.5 ${dotColor} rounded`} />
        </div>
        <div className="flex gap-1">
          <div className={`w-2 h-2 ${dotColor} rounded-full`} />
          <div className={`w-2 h-2 ${dotColor} rounded-full`} />
          <div className={`w-2 h-2 ${dotColor} rounded-full`} />
        </div>
      </div>
    );
  }
  
  if (layout === 'logo-left') {
    // Logo left, menu center, icons right
    return (
      <div className="flex items-center justify-between h-6" dir="rtl">
        <div className="flex gap-1">
          <div className={`w-2 h-2 ${dotColor} rounded-full`} />
          <div className={`w-2 h-2 ${dotColor} rounded-full`} />
          <div className={`w-2 h-2 ${dotColor} rounded-full`} />
        </div>
        <div className="flex gap-1">
          <div className={`w-4 h-1.5 ${dotColor} rounded`} />
          <div className={`w-4 h-1.5 ${dotColor} rounded`} />
          <div className={`w-4 h-1.5 ${dotColor} rounded`} />
        </div>
        <div className={`w-8 h-3 ${barColor} rounded`} /> {/* Logo */}
      </div>
    );
  }
  
  // logo-center - Logo center, search right, icons left, menu below
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between h-5" dir="rtl">
        <div className={`w-3 h-2 ${dotColor} rounded`} /> {/* Search */}
        <div className={`w-8 h-3 ${barColor} rounded`} /> {/* Logo */}
        <div className="flex gap-1">
          <div className={`w-2 h-2 ${dotColor} rounded-full`} />
          <div className={`w-2 h-2 ${dotColor} rounded-full`} />
        </div>
      </div>
      <div className="flex justify-center gap-1 pt-1 border-t border-gray-100">
        <div className={`w-4 h-1 ${dotColor} rounded`} />
        <div className={`w-4 h-1 ${dotColor} rounded`} />
        <div className={`w-4 h-1 ${dotColor} rounded`} />
      </div>
    </div>
  );
}

// ===========================================
// Product Page Settings UI
// ===========================================

import { 
  defaultProductPageSettings, 
  defaultTypography,
  type ProductPageSettings, 
  type ProductPageSection,
  type ProductFeature,
  availableIcons 
} from '@/lib/product-page-settings';

interface ProductPageSettingsUIProps {
  settings: Record<string, unknown>;
  updateSettings: (settings: Record<string, unknown>) => void;
  initialTab?: 'gallery' | 'features' | 'style';
}

function ProductPageSettingsUI({ settings, updateSettings, initialTab = 'gallery' }: ProductPageSettingsUIProps) {
  // Sections are shown in the right sidebar tree, not here
  const [activeTab, setActiveTab] = useState<'gallery' | 'features' | 'style'>(initialTab);
  
  // Get product page settings from store settings
  const productSettings: ProductPageSettings = {
    ...defaultProductPageSettings,
    ...(settings.productPageSettings as Partial<ProductPageSettings> || {}),
  };
  
  // Update product page settings
  const updateProductSettings = (updates: Partial<ProductPageSettings>) => {
    updateSettings({
      productPageSettings: {
        ...productSettings,
        ...updates,
      },
    });
  };
  
  // Toggle section visibility
  const toggleSection = (sectionId: string) => {
    const newSections = productSettings.sections.map(s => 
      s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s
    );
    updateProductSettings({ sections: newSections });
  };
  
  // Move section up/down
  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const sections = [...productSettings.sections].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sections.findIndex(s => s.id === sectionId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    // Swap
    [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
    
    // Update sortOrder
    const newSections = sections.map((s, i) => ({ ...s, sortOrder: i }));
    updateProductSettings({ sections: newSections });
  };
  
  // Update feature
  const updateFeature = (featureId: string, updates: Partial<ProductFeature>) => {
    const newFeatures = productSettings.features.map(f => 
      f.id === featureId ? { ...f, ...updates } : f
    );
    updateProductSettings({ features: newFeatures });
  };
  
  // Add new feature
  const addFeature = () => {
    const newFeature: ProductFeature = {
      id: `feature-${Date.now()}`,
      icon: 'check',
      text: 'חוזקה חדשה',
      isVisible: true,
    };
    updateProductSettings({ features: [...productSettings.features, newFeature] });
  };
  
  // Remove feature
  const removeFeature = (featureId: string) => {
    const newFeatures = productSettings.features.filter(f => f.id !== featureId);
    updateProductSettings({ features: newFeatures });
  };
  
  const sectionLabels: Record<string, string> = {
    breadcrumb: 'ניווט (Breadcrumb)',
    gallery: 'גלריית תמונות',
    info: 'מידע מוצר',
    features: 'חוזקות',
    description: 'תיאור',
    reviews: 'ביקורות',
    related: 'מוצרים דומים',
  };

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">הגדרות עמוד מוצר</h3>
        
        {/* Tab Switcher - No "סקשנים" tab, sections are in right sidebar */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'gallery' ? 'bg-white shadow-sm' : 'text-gray-600'
            }`}
          >
            גלריה
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'features' ? 'bg-white shadow-sm' : 'text-gray-600'
            }`}
          >
            חוזקות
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'style' ? 'bg-white shadow-sm' : 'text-gray-600'
            }`}
          >
            עיצוב
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            <SettingsGroup title="פריסת גלריה">
              <SelectField
                label="סגנון תצוגה"
                value={productSettings.gallery.layout}
                options={[
                  { value: 'carousel', label: 'קרוסלה (ברירת מחדל)' },
                  { value: 'grid', label: 'תמונות אחת מתחת לשנייה' },
                  { value: 'single', label: 'תמונה בודדת' },
                ]}
                onChange={(v) => updateProductSettings({ 
                  gallery: { ...productSettings.gallery, layout: v as ProductPageSettings['gallery']['layout'] } 
                })}
              />
              
              <SelectField
                label="מיקום תמונות קטנות"
                value={productSettings.gallery.thumbnailsPosition}
                options={[
                  { value: 'bottom', label: 'למטה' },
                  { value: 'right', label: 'מימין' },
                  { value: 'left', label: 'משמאל' },
                  { value: 'hidden', label: 'מוסתר' },
                ]}
                onChange={(v) => updateProductSettings({ 
                  gallery: { ...productSettings.gallery, thumbnailsPosition: v as ProductPageSettings['gallery']['thumbnailsPosition'] } 
                })}
              />
              
              <SelectField
                label="יחס גובה-רוחב"
                value={productSettings.gallery.aspectRatio}
                options={[
                  { value: '1:1', label: 'ריבוע (1:1)' },
                  { value: '3:4', label: 'פורטרט (3:4)' },
                  { value: '4:3', label: 'לנדסקייפ (4:3)' },
                  { value: '16:9', label: 'רחב (16:9)' },
                ]}
                onChange={(v) => updateProductSettings({ 
                  gallery: { ...productSettings.gallery, aspectRatio: v as ProductPageSettings['gallery']['aspectRatio'] } 
                })}
              />
              
              <SwitchField
                label="הפעל זום בלחיצה"
                value={productSettings.gallery.enableZoom}
                onChange={(v) => updateProductSettings({ 
                  gallery: { ...productSettings.gallery, enableZoom: v } 
                })}
              />
              
              <SwitchField
                label="הצג חצי ניווט"
                value={productSettings.gallery.showArrows ?? true}
                onChange={(v) => updateProductSettings({ 
                  gallery: { ...productSettings.gallery, showArrows: v } 
                })}
              />
              
              <SwitchField
                label="הצג נקודות במובייל"
                value={productSettings.gallery.showDotsOnMobile ?? false}
                onChange={(v) => updateProductSettings({ 
                  gallery: { ...productSettings.gallery, showDotsOnMobile: v } 
                })}
              />
              
              <SelectField
                label="תמונות ממוזערות במובייל"
                value={productSettings.gallery.thumbnailsPositionMobile ?? 'bottom'}
                options={[
                  { value: 'bottom', label: 'הצג למטה' },
                  { value: 'hidden', label: 'הסתר במובייל' },
                ]}
                onChange={(v) => updateProductSettings({ 
                  gallery: { ...productSettings.gallery, thumbnailsPositionMobile: v as 'bottom' | 'hidden' } 
                })}
              />
            </SettingsGroup>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">ערוך את החוזקות המוצגות בעמוד המוצר</p>
            
            <div className="space-y-3">
              {productSettings.features.map((feature) => (
                <div
                  key={feature.id}
                  className="p-3 rounded-lg border border-gray-200 bg-white space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateFeature(feature.id, { isVisible: !feature.isVisible })}
                      className={`p-1 rounded ${feature.isVisible ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {feature.isVisible ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                    
                    <div className="flex-1">
                      <TextField
                        label=""
                        value={feature.text}
                        onChange={(v) => updateFeature(feature.id, { text: v })}
                        placeholder="טקסט החוזקה"
                      />
                    </div>
                    
                    <button
                      onClick={() => removeFeature(feature.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  
                  <SelectField
                    label="אייקון"
                    value={feature.icon}
                    options={availableIcons.map(icon => ({ value: icon.id, label: icon.name }))}
                    onChange={(v) => updateFeature(feature.id, { icon: v })}
                  />
                </div>
              ))}
            </div>
            
            <button
              onClick={addFeature}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              + הוסף חוזקה
            </button>
          </div>
        )}

        {/* Style Tab */}
        {activeTab === 'style' && (
          <div className="space-y-4">
            <SettingsGroup title="טיפוגרפיה">
              <TypographyPopover
                label="כותרת מוצר"
                value={{ ...defaultTypography.title, ...productSettings.typography?.title }}
                onChange={(v) => updateProductSettings({ 
                  typography: { ...productSettings.typography, title: v } 
                })}
                defaultColor={defaultTypography.title.color || '#000000'}
              />
              
              <TypographyPopover
                label="מחיר"
                value={{ ...defaultTypography.price, ...productSettings.typography?.price }}
                onChange={(v) => updateProductSettings({ 
                  typography: { ...productSettings.typography, price: v } 
                })}
                defaultColor={defaultTypography.price.color || '#000000'}
              />
              
              <TypographyPopover
                label="מחיר השוואה"
                value={{ ...defaultTypography.comparePrice, ...productSettings.typography?.comparePrice }}
                onChange={(v) => updateProductSettings({ 
                  typography: { ...productSettings.typography, comparePrice: v } 
                })}
                defaultColor={defaultTypography.comparePrice.color || '#9CA3AF'}
              />
            </SettingsGroup>
            
            <SettingsGroup title="הגדרות מחיר">
              <SwitchField
                label="הצג מחיר השוואה"
                value={productSettings.price?.showComparePrice ?? true}
                onChange={(v) => updateProductSettings({ 
                  price: { ...productSettings.price, showComparePrice: v } 
                })}
              />
              
              <SwitchField
                label="הצג אחוז הנחה"
                value={productSettings.price?.showDiscount ?? true}
                onChange={(v) => updateProductSettings({ 
                  price: { ...productSettings.price, showDiscount: v } 
                })}
              />
              
              {productSettings.price?.showDiscount && (
                <SelectField
                  label="סגנון הנחה"
                  value={productSettings.price?.discountStyle || 'badge'}
                  options={[
                    { value: 'badge', label: 'תג' },
                    { value: 'text', label: 'טקסט' },
                    { value: 'both', label: 'שניהם' },
                  ]}
                  onChange={(v) => updateProductSettings({ 
                    price: { ...productSettings.price, discountStyle: v as 'badge' | 'text' | 'both' } 
                  })}
                />
              )}
            </SettingsGroup>
            
            <SettingsGroup title="מוצרים דומים">
              <TextField
                label="כותרת"
                value={productSettings.related.title}
                onChange={(v) => updateProductSettings({ 
                  related: { ...productSettings.related, title: v } 
                })}
              />
              
              <TextField
                label="תת-כותרת"
                value={productSettings.related.subtitle}
                onChange={(v) => updateProductSettings({ 
                  related: { ...productSettings.related, subtitle: v } 
                })}
              />
              
              <SliderField
                label="כמות מוצרים"
                value={productSettings.related.count}
                min={2}
                max={8}
                onChange={(v) => updateProductSettings({ 
                  related: { ...productSettings.related, count: v } 
                })}
              />
            </SettingsGroup>
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================
// Product Page Section Settings - Focused settings for each section
// ===========================================

interface ProductPageSectionSettingsProps {
  sectionType: string;
  settings: Record<string, unknown>;
  updateSettings: (settings: Record<string, unknown>) => void;
}

function ProductPageSectionSettings({ sectionType, settings, updateSettings }: ProductPageSectionSettingsProps) {
  // Get product page settings from store settings
  const productSettings: ProductPageSettings = {
    ...defaultProductPageSettings,
    ...(settings.productPageSettings as Partial<ProductPageSettings> || {}),
  };
  
  // Update product page settings
  const updateProductSettings = (updates: Partial<ProductPageSettings>) => {
    updateSettings({
      productPageSettings: {
        ...productSettings,
        ...updates,
      },
    });
  };
  
  // Toggle section visibility
  const getSectionId = () => sectionType.replace('pp-', '');
  
  const toggleVisibility = () => {
    const sectionId = getSectionId();
    const newSections = productSettings.sections.map(s => 
      s.type === sectionId ? { ...s, isVisible: !s.isVisible } : s
    );
    updateProductSettings({ sections: newSections });
  };
  
  const isVisible = productSettings.sections.find(s => s.type === getSectionId())?.isVisible ?? true;
  
  // Update feature
  const updateFeature = (featureId: string, updates: Partial<ProductFeature>) => {
    const newFeatures = productSettings.features.map(f => 
      f.id === featureId ? { ...f, ...updates } : f
    );
    updateProductSettings({ features: newFeatures });
  };
  
  // Add new feature
  const addFeature = () => {
    const newFeature: ProductFeature = {
      id: `feature-${Date.now()}`,
      icon: 'check',
      text: 'חוזקה חדשה',
      isVisible: true,
    };
    updateProductSettings({ features: [...productSettings.features, newFeature] });
  };
  
  // Remove feature
  const removeFeature = (featureId: string) => {
    const newFeatures = productSettings.features.filter(f => f.id !== featureId);
    updateProductSettings({ features: newFeatures });
  };
  
  const sectionLabels: Record<string, string> = {
    'pp-breadcrumb': 'ניווט (Breadcrumb)',
    'pp-gallery': 'גלריית תמונות',
    'pp-info': 'מידע מוצר',
    'pp-features': 'חוזקות',
    'pp-description': 'תיאור',
    'pp-reviews': 'ביקורות',
    'pp-related': 'מוצרים דומים',
  };
  
  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{sectionLabels[sectionType] || sectionType}</h3>
          <button
            onClick={toggleVisibility}
            className={`p-2 rounded-lg transition-colors ${isVisible ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}
            title={isVisible ? 'מוצג' : 'מוסתר'}
          >
            {isVisible ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          {isVisible ? 'הסקשן מוצג בעמוד' : 'הסקשן מוסתר מהעמוד'}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Gallery Section */}
        {sectionType === 'pp-gallery' && (
          <>
            <SettingsGroup title="פריסת גלריה">
              <SelectField
                label="סגנון תצוגה"
                value={productSettings.gallery.layout}
                options={[
                  { value: 'carousel', label: 'קרוסלה (ברירת מחדל)' },
                  { value: 'grid', label: 'תמונות אחת מתחת לשנייה' },
                  { value: 'single', label: 'תמונה בודדת' },
                ]}
                onChange={(v) => updateProductSettings({ 
                  gallery: { ...productSettings.gallery, layout: v as ProductPageSettings['gallery']['layout'] } 
                })}
              />
              
              <SelectField
                label="מיקום תמונות קטנות"
                value={productSettings.gallery.thumbnailsPosition}
                options={[
                  { value: 'bottom', label: 'למטה' },
                  { value: 'right', label: 'מימין' },
                  { value: 'left', label: 'משמאל' },
                  { value: 'hidden', label: 'מוסתר' },
                ]}
                onChange={(v) => updateProductSettings({ 
                  gallery: { ...productSettings.gallery, thumbnailsPosition: v as ProductPageSettings['gallery']['thumbnailsPosition'] } 
                })}
              />
              
              <SelectField
                label="יחס גובה-רוחב"
                value={productSettings.gallery.aspectRatio}
                options={[
                  { value: '1:1', label: 'ריבוע (1:1)' },
                  { value: '3:4', label: 'פורטרט (3:4)' },
                  { value: '4:3', label: 'לנדסקייפ (4:3)' },
                  { value: '16:9', label: 'רחב (16:9)' },
                ]}
                onChange={(v) => updateProductSettings({ 
                  gallery: { ...productSettings.gallery, aspectRatio: v as ProductPageSettings['gallery']['aspectRatio'] } 
                })}
              />
              
              <SwitchField
                label="הפעל זום בלחיצה"
                value={productSettings.gallery.enableZoom}
                onChange={(v) => updateProductSettings({ 
                  gallery: { ...productSettings.gallery, enableZoom: v } 
                })}
              />
              
              <SwitchField
                label="הצג חצי ניווט"
                value={productSettings.gallery.showArrows ?? true}
                onChange={(v) => updateProductSettings({ 
                  gallery: { ...productSettings.gallery, showArrows: v } 
                })}
              />
              
              <SwitchField
                label="הצג נקודות במובייל"
                value={productSettings.gallery.showDotsOnMobile ?? false}
                onChange={(v) => updateProductSettings({ 
                  gallery: { ...productSettings.gallery, showDotsOnMobile: v } 
                })}
              />
              
              <SelectField
                label="תמונות ממוזערות במובייל"
                value={productSettings.gallery.thumbnailsPositionMobile ?? 'bottom'}
                options={[
                  { value: 'bottom', label: 'הצג למטה' },
                  { value: 'hidden', label: 'הסתר במובייל' },
                ]}
                onChange={(v) => updateProductSettings({ 
                  gallery: { ...productSettings.gallery, thumbnailsPositionMobile: v as 'bottom' | 'hidden' } 
                })}
              />
            </SettingsGroup>
          </>
        )}
        
        {/* Info Section (Title & Price) */}
        {sectionType === 'pp-info' && (
          <>
            <SettingsGroup title="טיפוגרפיה">
              <TypographyPopover
                label="כותרת מוצר"
                value={{ ...defaultTypography.title, ...productSettings.typography?.title }}
                onChange={(v) => updateProductSettings({ 
                  typography: { ...productSettings.typography, title: v } 
                })}
                defaultColor={defaultTypography.title.color || '#000000'}
              />
              
              <TypographyPopover
                label="מחיר"
                value={{ ...defaultTypography.price, ...productSettings.typography?.price }}
                onChange={(v) => updateProductSettings({ 
                  typography: { ...productSettings.typography, price: v } 
                })}
                defaultColor={defaultTypography.price.color || '#000000'}
              />
              
              <TypographyPopover
                label="מחיר השוואה"
                value={{ ...defaultTypography.comparePrice, ...productSettings.typography?.comparePrice }}
                onChange={(v) => updateProductSettings({ 
                  typography: { ...productSettings.typography, comparePrice: v } 
                })}
                defaultColor={defaultTypography.comparePrice.color || '#9CA3AF'}
              />
              
              <TypographyPopover
                label="כפתור הוסף לעגלה"
                value={{ ...defaultTypography.button, ...productSettings.typography?.button }}
                onChange={(v) => updateProductSettings({ 
                  typography: { ...productSettings.typography, button: v } 
                })}
                defaultColor={defaultTypography.button.color || '#FFFFFF'}
              />
              
              <TypographyPopover
                label="תצוגת מלאי"
                value={{ ...defaultTypography.inventory, ...productSettings.typography?.inventory }}
                onChange={(v) => updateProductSettings({ 
                  typography: { ...productSettings.typography, inventory: v } 
                })}
                defaultColor={defaultTypography.inventory.color || '#6B7280'}
              />
              
              <TypographyPopover
                label="תיאור מוצר"
                value={{ ...defaultTypography.description, ...productSettings.typography?.description }}
                onChange={(v) => updateProductSettings({ 
                  typography: { ...productSettings.typography, description: v } 
                })}
                defaultColor={defaultTypography.description.color || '#4B5563'}
              />
            </SettingsGroup>
            
            <SettingsGroup title="הגדרות מחיר">
              <SwitchField
                label="הצג מחיר השוואה"
                value={productSettings.price?.showComparePrice ?? true}
                onChange={(v) => updateProductSettings({ 
                  price: { ...productSettings.price, showComparePrice: v } 
                })}
              />
              
              <SwitchField
                label="הצג הנחה"
                value={productSettings.price?.showDiscount ?? true}
                onChange={(v) => updateProductSettings({ 
                  price: { ...productSettings.price, showDiscount: v } 
                })}
              />
              
              {productSettings.price?.showDiscount && (
                <SelectField
                  label="סגנון הנחה"
                  value={productSettings.price?.discountStyle || 'badge'}
                  options={[
                    { value: 'badge', label: 'תג' },
                    { value: 'text', label: 'טקסט' },
                    { value: 'both', label: 'שניהם' },
                  ]}
                  onChange={(v) => updateProductSettings({ 
                    price: { ...productSettings.price, discountStyle: v as 'badge' | 'text' | 'both' } 
                  })}
                />
              )}
            </SettingsGroup>
            
            <SettingsGroup title="תצוגת מלאי">
              <SelectField
                label="סגנון תצוגה"
                value={productSettings.inventory?.displayStyle || 'count'}
                options={[
                  { value: 'in_stock', label: 'במלאי / אזל מהמלאי' },
                  { value: 'count', label: 'X יחידות במלאי' },
                  { value: 'low_stock', label: 'נותרו יחידות אחרונות (כשפחות מ-5)' },
                  { value: 'hidden', label: 'להסתיר' },
                ]}
                onChange={(v) => updateProductSettings({ 
                  inventory: { 
                    displayStyle: v as 'in_stock' | 'count' | 'low_stock' | 'hidden',
                    lowStockThreshold: productSettings.inventory?.lowStockThreshold || 5
                  } 
                })}
              />
              
              {(productSettings.inventory?.displayStyle === 'low_stock') && (
                <SliderField
                  label="סף מלאי נמוך"
                  value={productSettings.inventory?.lowStockThreshold || 5}
                  min={2}
                  max={10}
                  onChange={(v) => updateProductSettings({ 
                    inventory: { 
                      displayStyle: 'low_stock',
                      lowStockThreshold: v
                    } 
                  })}
                />
              )}
            </SettingsGroup>
            
            <SettingsGroup title="תיאור">
              <SwitchField
                label="הצג תיאור באקורדיון"
                value={productSettings.description?.showAsAccordion ?? false}
                onChange={(v) => updateProductSettings({ 
                  description: { showAsAccordion: v } 
                })}
              />
            </SettingsGroup>
          </>
        )}
        
        {/* Features Section */}
        {sectionType === 'pp-features' && (
          <>
            <SettingsGroup title="רשימת חוזקות">
              <p className="text-xs text-gray-500 mb-3">הוסף עד 5 יתרונות שיוצגו בעמוד המוצר</p>
              
              <div className="space-y-3">
                {productSettings.features.map((feature, index) => (
                  <div key={feature.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">חוזקה {index + 1}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateFeature(feature.id, { isVisible: !feature.isVisible })}
                          className={`p-1 rounded ${feature.isVisible ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          {feature.isVisible ? <EyeIcon /> : <EyeOffIcon />}
                        </button>
                        {productSettings.features.length > 1 && (
                          <button
                            onClick={() => removeFeature(feature.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <SelectField
                      label="אייקון"
                      value={feature.icon}
                      options={availableIcons.map(i => ({ value: i.id, label: i.name }))}
                      onChange={(v) => updateFeature(feature.id, { icon: v })}
                    />
                    
                    <TextField
                      label="טקסט"
                      value={feature.text}
                      onChange={(v) => updateFeature(feature.id, { text: v })}
                    />
                  </div>
                ))}
              </div>
              
              {productSettings.features.length < 5 && (
                <button
                  onClick={addFeature}
                  className="w-full mt-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  + הוסף חוזקה
                </button>
              )}
            </SettingsGroup>
          </>
        )}
        
        {/* Description Section */}
        {sectionType === 'pp-description' && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">התיאור נלקח אוטומטית מפרטי המוצר</p>
            <p className="text-xs mt-2">ניתן לערוך בעמוד ניהול המוצרים</p>
          </div>
        )}
        
        {/* Breadcrumb Section */}
        {sectionType === 'pp-breadcrumb' && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">הניווט נוצר אוטומטית</p>
            <p className="text-xs mt-2">מציג: חנות &gt; קטגוריה &gt; מוצר</p>
          </div>
        )}
        
        {/* Reviews Section */}
        {sectionType === 'pp-reviews' && (
          <>
            <SettingsGroup title="הגדרות ביקורות">
              <TextField
                label="כותרת"
                value={productSettings.reviews.title}
                onChange={(v) => updateProductSettings({ 
                  reviews: { ...productSettings.reviews, title: v } 
                })}
              />
              
              <SwitchField
                label="הצג דירוג"
                value={productSettings.reviews.showRating}
                onChange={(v) => updateProductSettings({ 
                  reviews: { ...productSettings.reviews, showRating: v } 
                })}
              />
              
              <SwitchField
                label="הצג כמות ביקורות"
                value={productSettings.reviews.showCount}
                onChange={(v) => updateProductSettings({ 
                  reviews: { ...productSettings.reviews, showCount: v } 
                })}
              />
            </SettingsGroup>
          </>
        )}
        
        {/* Related Products Section */}
        {sectionType === 'pp-related' && (
          <>
            <SettingsGroup title="מוצרים דומים">
              <TextField
                label="כותרת"
                value={productSettings.related.title}
                onChange={(v) => updateProductSettings({ 
                  related: { ...productSettings.related, title: v } 
                })}
              />
              
              <TextField
                label="תת-כותרת"
                value={productSettings.related.subtitle}
                onChange={(v) => updateProductSettings({ 
                  related: { ...productSettings.related, subtitle: v } 
                })}
              />
              
              <SliderField
                label="כמות מוצרים"
                value={productSettings.related.count}
                min={2}
                max={8}
                onChange={(v) => updateProductSettings({ 
                  related: { ...productSettings.related, count: v } 
                })}
              />
              
              <SwitchField
                label="הצג גם כשאין מוצרים"
                value={productSettings.related.showIfEmpty}
                onChange={(v) => updateProductSettings({ 
                  related: { ...productSettings.related, showIfEmpty: v } 
                })}
              />
            </SettingsGroup>
          </>
        )}
      </div>
    </div>
  );
}

// ===========================================
// Category Page Settings UI
// ===========================================

interface CategoryPageSectionSettingsProps {
  sectionType: string;
  settings: Record<string, unknown>;
  updateSettings: (settings: Record<string, unknown>) => void;
}

function CategoryPageSectionSettings({ sectionType, settings, updateSettings }: CategoryPageSectionSettingsProps) {
  // Get category page settings from store settings
  const categorySettings: CategoryPageSettings = {
    ...defaultCategoryPageSettings,
    ...(settings.categoryPageSettings as Partial<CategoryPageSettings> || {}),
  };
  
  // Update category page settings
  const updateCategorySettings = (updates: Partial<CategoryPageSettings>) => {
    updateSettings({
      categoryPageSettings: {
        ...categorySettings,
        ...updates,
      },
    });
  };
  
  const sectionLabels: Record<string, string> = {
    'cp-banner': 'באנר קטגוריה',
    'cp-breadcrumb': 'ניווט (Breadcrumb)',
    'cp-subcategories': 'תתי קטגוריות',
    'cp-products': 'רשת מוצרים',
  };

  const aspectRatioOptions: { value: AspectRatio; label: string }[] = [
    { value: '1:1', label: 'ריבוע (1:1)' },
    { value: '3:4', label: 'מלבן עומד (3:4)' },
    { value: '4:3', label: 'מלבן שוכב (4:3)' },
    { value: '4:5', label: 'מלבן עומד (4:5)' },
    { value: '16:9', label: 'וידאו (16:9)' },
  ];

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">{sectionLabels[sectionType] || sectionType}</h3>
      </div>
      
      {/* Section-specific settings */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Banner Settings */}
        {sectionType === 'cp-banner' && (
          <>
            <SettingsGroup title="הגדרות באנר">
              <SwitchField
                label="הצג באנר"
                value={categorySettings.banner.show}
                onChange={(v) => updateCategorySettings({ 
                  banner: { ...categorySettings.banner, show: v } 
                })}
              />
              
              {categorySettings.banner.show && (
                <>
                  <SwitchField
                    label="הצג כיתוב (שם הקטגוריה)"
                    value={categorySettings.banner.showTitle}
                    onChange={(v) => updateCategorySettings({ 
                      banner: { ...categorySettings.banner, showTitle: v } 
                    })}
                  />
                  
                  <SwitchField
                    label="הצג תיאור"
                    value={categorySettings.banner.showDescription}
                    onChange={(v) => updateCategorySettings({ 
                      banner: { ...categorySettings.banner, showDescription: v } 
                    })}
                  />
                  
                  <SwitchField
                    label="הצג קטגוריית אב"
                    value={categorySettings.banner.showParentCategory}
                    onChange={(v) => updateCategorySettings({ 
                      banner: { ...categorySettings.banner, showParentCategory: v } 
                    })}
                  />
                  
                  <SwitchField
                    label="השתמש ביחס תמונה (רטיו)"
                    value={categorySettings.banner.useAspectRatio ?? false}
                    onChange={(v) => updateCategorySettings({ 
                      banner: { ...categorySettings.banner, useAspectRatio: v } 
                    })}
                  />
                  <p className="text-xs text-gray-500 -mt-2 mb-2">
                    מומלץ לתמונות אופקיות/מלבניות. מונע זום מוגזם במובייל.
                  </p>
                  
                  {categorySettings.banner.useAspectRatio ? (
                    <>
                      <SelectField
                        label="רטיו במחשב"
                        value={categorySettings.banner.desktopAspectRatio || '21:9'}
                        options={[
                          { value: '4:3', label: 'קלאסי (4:3)' },
                          { value: '3:2', label: 'צילום (3:2)' },
                          { value: '16:9', label: 'וידאו (16:9)' },
                          { value: '2:1', label: 'פנורמי (2:1)' },
                          { value: '21:9', label: 'קולנועי (21:9)' },
                          { value: '3:1', label: 'באנר רחב (3:1)' },
                          { value: '4:1', label: 'סרט צר (4:1)' },
                        ]}
                        onChange={(v) => updateCategorySettings({ 
                          banner: { ...categorySettings.banner, desktopAspectRatio: v as any } 
                        })}
                      />
                      
                      <SelectField
                        label="רטיו במובייל"
                        value={categorySettings.banner.mobileAspectRatio || '4:3'}
                        options={[
                          { value: '4:3', label: 'קלאסי (4:3)' },
                          { value: '3:2', label: 'צילום (3:2)' },
                          { value: '16:9', label: 'וידאו (16:9)' },
                          { value: '2:1', label: 'פנורמי (2:1)' },
                          { value: '21:9', label: 'קולנועי (21:9)' },
                        ]}
                        onChange={(v) => updateCategorySettings({ 
                          banner: { ...categorySettings.banner, mobileAspectRatio: v as any } 
                        })}
                      />
                    </>
                  ) : (
                    <SelectField
                      label="גובה באנר"
                      value={categorySettings.banner.height}
                      options={[
                        { value: 'small', label: 'קטן' },
                        { value: 'medium', label: 'בינוני' },
                        { value: 'large', label: 'גדול' },
                      ]}
                      onChange={(v) => updateCategorySettings({ 
                        banner: { ...categorySettings.banner, height: v as 'small' | 'medium' | 'large' } 
                      })}
                    />
                  )}
                  
                  <SliderField
                    label="שקיפות כיהוי (%)"
                    value={categorySettings.banner.overlayOpacity}
                    min={0}
                    max={100}
                    suffix="%"
                    onChange={(v) => updateCategorySettings({ 
                      banner: { ...categorySettings.banner, overlayOpacity: v } 
                    })}
                  />
                </>
              )}
            </SettingsGroup>
          </>
        )}

        {/* Breadcrumb Settings */}
        {sectionType === 'cp-breadcrumb' && (
          <SettingsGroup title="הגדרות ניווט">
            <SwitchField
              label="הצג ניווט (Breadcrumb)"
              value={categorySettings.breadcrumb.show}
              onChange={(v) => updateCategorySettings({ 
                breadcrumb: { ...categorySettings.breadcrumb, show: v } 
              })}
            />
          </SettingsGroup>
        )}

        {/* Subcategories Settings */}
        {sectionType === 'cp-subcategories' && (
          <>
            <SettingsGroup title="הגדרות תתי קטגוריות">
              <SwitchField
                label="הצג תתי קטגוריות"
                value={categorySettings.subcategories.show}
                onChange={(v) => updateCategorySettings({ 
                  subcategories: { ...categorySettings.subcategories, show: v } 
                })}
              />
              
              {categorySettings.subcategories.show && (
                <>
                  <SelectField
                    label="כמות בשורה - מובייל"
                    value={String(categorySettings.subcategories.mobileColumns)}
                    options={[
                      { value: '1', label: '1' },
                      { value: '2', label: '2' },
                    ]}
                    onChange={(v) => updateCategorySettings({ 
                      subcategories: { ...categorySettings.subcategories, mobileColumns: parseInt(v) as 1 | 2 } 
                    })}
                  />
                  
                  <SelectField
                    label="כמות בשורה - מחשב"
                    value={String(categorySettings.subcategories.desktopColumns)}
                    options={[
                      { value: '2', label: '2' },
                      { value: '3', label: '3' },
                      { value: '4', label: '4' },
                    ]}
                    onChange={(v) => updateCategorySettings({ 
                      subcategories: { ...categorySettings.subcategories, desktopColumns: parseInt(v) as 2 | 3 | 4 } 
                    })}
                  />
                  
                  <SelectField
                    label="יחס גובה-רוחב"
                    value={categorySettings.subcategories.aspectRatio}
                    options={aspectRatioOptions}
                    onChange={(v) => updateCategorySettings({ 
                      subcategories: { ...categorySettings.subcategories, aspectRatio: v as AspectRatio } 
                    })}
                  />
                  
                  <SwitchField
                    label="הצג שכבת כיהוי"
                    value={categorySettings.subcategories.showOverlay}
                    onChange={(v) => updateCategorySettings({ 
                      subcategories: { ...categorySettings.subcategories, showOverlay: v } 
                    })}
                  />
                  
                  {categorySettings.subcategories.showOverlay && (
                    <SliderField
                      label="שקיפות כיהוי (%)"
                      value={categorySettings.subcategories.overlayOpacity}
                      min={0}
                      max={100}
                      suffix="%"
                      onChange={(v) => updateCategorySettings({ 
                        subcategories: { ...categorySettings.subcategories, overlayOpacity: v } 
                      })}
                    />
                  )}
                </>
              )}
            </SettingsGroup>
          </>
        )}

        {/* Products Grid Settings */}
        {sectionType === 'cp-products' && (
          <SettingsGroup title="הגדרות רשת מוצרים">
            <SwitchField
              label="הצג מספר פריטים"
              value={categorySettings.products.showCount}
              onChange={(v) => updateCategorySettings({ 
                products: { ...categorySettings.products, showCount: v } 
              })}
            />
            
            <SelectField
              label="כמות בשורה - מובייל"
              value={String(categorySettings.products.mobileColumns)}
              options={[
                { value: '2', label: '2' },
                { value: '3', label: '3' },
              ]}
              onChange={(v) => updateCategorySettings({ 
                products: { ...categorySettings.products, mobileColumns: parseInt(v) as 2 | 3 } 
              })}
            />
            
            <SelectField
              label="כמות בשורה - מחשב"
              value={String(categorySettings.products.desktopColumns)}
              options={[
                { value: '3', label: '3' },
                { value: '4', label: '4' },
                { value: '5', label: '5' },
              ]}
              onChange={(v) => updateCategorySettings({ 
                products: { ...categorySettings.products, desktopColumns: parseInt(v) as 3 | 4 | 5 } 
              })}
            />
          </SettingsGroup>
        )}
      </div>
    </div>
  );
}

// Helper Icons for Product Page Settings
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
