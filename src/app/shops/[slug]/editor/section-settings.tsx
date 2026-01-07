'use client';

import { useState } from 'react';

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
  
  // Announcement bar settings
  announcementEnabled?: boolean;
  announcementText?: string;
  announcementLink?: string;
  announcementBgColor?: string;
  announcementTextColor?: string;
  
  // Footer settings
  footerShowLogo?: boolean;
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
}

export function SectionSettings({ section, onUpdate, onRemove, themeSettings, onThemeSettingsChange, categories = [] }: SectionSettingsProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'design'>('content');
  const settings = themeSettings || {};
  const updateSettings = onThemeSettingsChange || (() => {});

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
          <ContentSettings section={section} onUpdate={onUpdate} categories={categories} />
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
  categories = []
}: { 
  section: Section; 
  onUpdate: (updates: Partial<Section>) => void;
  categories?: Category[];
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
        <HeroContentSettings section={section} onUpdate={onUpdate} />
      )}
      {section.type === 'categories' && (
        <CategoriesContentSettings section={section} onUpdate={onUpdate} categories={categories} />
      )}
      {section.type === 'products' && (
        <ProductsContentSettings section={section} onUpdate={onUpdate} />
      )}
      {section.type === 'newsletter' && (
        <NewsletterContentSettings section={section} onUpdate={onUpdate} />
      )}
      {section.type === 'split_banner' && (
        <SplitBannerContentSettings section={section} onUpdate={onUpdate} />
      )}
      {section.type === 'video_banner' && (
        <VideoBannerContentSettings section={section} onUpdate={onUpdate} />
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
function HeroContentSettings({ section, onUpdate }: { section: Section; onUpdate: (updates: Partial<Section>) => void }) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
  };

  return (
    <>
      <SettingsGroup title="מדיה">
        <ImageField
          label="תמונה"
          value={(section.content.imageUrl as string) || ''}
          onChange={(v) => updateContent('imageUrl', v)}
        />
        <SliderField
          label="שקיפות שכבה"
          value={Math.round(((section.settings.overlay as number) || 0.3) * 100)}
          min={0}
          max={100}
          suffix="%"
          onChange={(v) => updateSettings('overlay', v / 100)}
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

function ProductsContentSettings({ section, onUpdate }: { section: Section; onUpdate: (updates: Partial<Section>) => void }) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  return (
    <SettingsGroup title="מוצרים">
      <SelectField
        label="הצג מוצרים"
        value={(section.content.type as string) || 'all'}
        options={[
          { value: 'all', label: 'כל המוצרים' },
          { value: 'featured', label: 'מוצרים מובחרים' },
        ]}
        onChange={(v) => updateContent('type', v)}
      />
      <SliderField
        label="כמות להצגה"
        value={(section.content.limit as number) || 8}
        min={1}
        max={24}
        onChange={(v) => updateContent('limit', v)}
      />
    </SettingsGroup>
  );
}

function NewsletterContentSettings({ section, onUpdate }: { section: Section; onUpdate: (updates: Partial<Section>) => void }) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  return (
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
  );
}

// Split Banner (באנר מפוצל) Settings - 2 images: right & left
function SplitBannerContentSettings({ section, onUpdate }: { section: Section; onUpdate: (updates: Partial<Section>) => void }) {
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
          />
          <ImageField
            label="תמונה (מובייל)"
            value={right.mobileImageUrl || ''}
            onChange={(v) => updateSide('right', 'mobileImageUrl', v)}
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
          />
          <ImageField
            label="תמונה (מובייל)"
            value={left.mobileImageUrl || ''}
            onChange={(v) => updateSide('left', 'mobileImageUrl', v)}
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
function VideoBannerContentSettings({ section, onUpdate }: { section: Section; onUpdate: (updates: Partial<Section>) => void }) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };
  
  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
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
        />
      </SettingsGroup>

      <SettingsGroup title="הגדרות וידאו">
        <SwitchField
          label="הפעלה אוטומטית"
          value={(section.settings.autoplay as boolean) ?? true}
          onChange={(v) => updateSettings('autoplay', v)}
        />
        <SwitchField
          label="לולאה"
          value={(section.settings.loop as boolean) ?? true}
          onChange={(v) => updateSettings('loop', v)}
        />
        <SwitchField
          label="השתקה"
          value={(section.settings.muted as boolean) ?? true}
          onChange={(v) => updateSettings('muted', v)}
        />
        <SwitchField
          label="הצג פקדים"
          value={(section.settings.controls as boolean) ?? false}
          onChange={(v) => updateSettings('controls', v)}
        />
        <SliderField
          label="שקיפות שכבה"
          value={Math.round(((section.settings.overlay as number) || 0.2) * 100)}
          min={0}
          max={100}
          suffix="%"
          onChange={(v) => updateSettings('overlay', v / 100)}
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
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
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
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value === 'transparent' ? '#ffffff' : value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
        />
        <span className="text-xs text-gray-500">
          {value === 'transparent' ? 'שקוף' : value}
        </span>
      </div>
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
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
          <button
            onClick={() => onChange('')}
            className="absolute top-2 left-2 p-1 bg-white/90 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <TrashIcon />
          </button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="הזן URL של תמונה"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 mb-2"
          />
          <button className="w-full h-24 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center hover:border-gray-300 transition-colors">
            <UploadIcon />
            <span className="text-xs text-gray-500 mt-2">בחר תמונה</span>
          </button>
        </div>
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
