import { getStoreBySlug, getCategoriesByStore, getMainMenuWithItems, type MenuItem } from '@/lib/db/queries';
import { ShopHeader, type HeaderLayout } from '@/components/shop-header';
import { CartSidebar } from '@/components/cart-sidebar';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { cache } from 'react';
import { headers, cookies } from 'next/headers';
import { detectLocaleWithGeo, getUITranslations } from '@/lib/translations';
import { TranslationsProvider } from '@/lib/translations/use-translations';
import { isRTL, getDirection } from '@/lib/translations';
import { isPluginActive, getStoriesWithProducts, getStorePlugin, getActiveAdvisorsForFloating } from '@/lib/plugins/loader';
import { CatalogModeProvider, type CatalogModeConfig } from '@/components/storefront/catalog-mode-provider';
import { WhatsAppFloatButton, type WhatsAppFloatConfig } from '@/components/storefront/whatsapp-float-button';
import { StoriesBar, type Story, type StoriesSettings } from '@/components/storefront/stories-bar';
import { FloatingAdvisorButton } from '@/components/storefront/floating-advisor-button';
import { PopupDisplay } from '@/components/storefront/popup-display';
import { GamificationPopup } from '@/components/storefront/gamification/gamification-popup';
import { CookieBanner, type GDPRSettings } from '@/components/storefront/cookie-banner';
import { TrackingProvider } from '@/components/tracking-provider';
import { StoreSettingsProvider } from '@/components/store-settings-provider';
import { StoreProvider } from '@/lib/store-context';
import { WishlistProvider } from '@/components/wishlist-provider';
import { getWishlistProductIds } from '@/lib/actions/wishlist';
import type { TrackingConfig } from '@/lib/tracking';
import { db } from '@/lib/db';
import { popups, gamificationCampaigns, gamificationPrizes } from '@/lib/db/schema';
import { eq, and, lte, or, isNull, gte, asc } from 'drizzle-orm';
import { getTemplateById, getDefaultTemplate } from '@/lib/templates';

// Dynamic imports for preview mode ONLY (keeps production bundle clean)
import nextDynamic from 'next/dynamic';
const PreviewSettingsProvider = nextDynamic(
  () => import('@/components/storefront/preview-settings-provider').then(m => m.PreviewSettingsProvider),
  { ssr: true }
);
const ShopHeaderClient = nextDynamic(
  () => import('@/components/storefront/shop-header-client').then(m => m.ShopHeaderClient),
  { ssr: true }
);
// Announcement bar - client component for countdown timer
const AnnouncementBar = nextDynamic(
  () => import('@/components/storefront/announcement-bar').then(m => m.AnnouncementBar),
  { ssr: true }
);

// Force dynamic rendering because we use cookies for customer auth
export const dynamic = 'force-dynamic';

// Cache store lookup for this request
const getStore = cache(async (slug: string) => {
  return getStoreBySlug(slug);
});

interface StorefrontLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function StorefrontLayout({ children, params }: StorefrontLayoutProps) {
  const { slug } = await params;
  const store = await getStore(slug);
  
  // Store existence is already checked in parent layout
  if (!store) {
    return <>{children}</>;
  }

  // Fetch categories, customer, plugin data, menus, and popups in parallel (server-side)
  const now = new Date();
  const [categories, mainMenu, customer, storiesEnabled, storiesPlugin, advisorEnabled, advisorPlugin, activeAdvisors, activePopups, wheelEnabled, scratchEnabled, activeGamificationCampaigns, whatsappFloatEnabled, whatsappFloatPlugin, catalogModePlugin] = await Promise.all([
    getCategoriesByStore(store.id),
    getMainMenuWithItems(store.id),
    getCurrentCustomer(),
    isPluginActive(store.id, 'product-stories'),
    getStorePlugin(store.id, 'product-stories'),
    isPluginActive(store.id, 'smart-advisor'),
    getStorePlugin(store.id, 'smart-advisor'),
    getActiveAdvisorsForFloating(store.id),
    // Fetch active popups with valid date range
    db.query.popups.findMany({
      where: and(
        eq(popups.storeId, store.id),
        eq(popups.isActive, true),
        or(isNull(popups.startDate), lte(popups.startDate, now)),
        or(isNull(popups.endDate), gte(popups.endDate, now))
      ),
    }),
    // Gamification plugins
    isPluginActive(store.id, 'wheel-of-fortune'),
    isPluginActive(store.id, 'scratch-card'),
    // Fetch active gamification campaigns
    db.query.gamificationCampaigns.findMany({
      where: and(
        eq(gamificationCampaigns.storeId, store.id),
        eq(gamificationCampaigns.isActive, true),
        or(isNull(gamificationCampaigns.startDate), lte(gamificationCampaigns.startDate, now)),
        or(isNull(gamificationCampaigns.endDate), gte(gamificationCampaigns.endDate, now))
      ),
    }),
    // WhatsApp Float plugin
    isPluginActive(store.id, 'whatsapp-float'),
    getStorePlugin(store.id, 'whatsapp-float'),
    // Catalog Mode plugin
    getStorePlugin(store.id, 'catalog-mode'),
  ]);
  
  // Fetch wishlist items for logged-in customers
  const wishlistItems = customer ? await getWishlistProductIds(customer.id) : [];
  
  // Fetch stories only if plugin is active
  let stories: Story[] = [];
  let storiesSettings: StoriesSettings | null = null;
  
  if (storiesEnabled && storiesPlugin) {
    const [storiesData] = await Promise.all([
      getStoriesWithProducts(store.id),
    ]);
    
    const config = (storiesPlugin.config as Record<string, unknown>) || {};
    
    stories = storiesData.map(s => ({
      id: s.id,
      productId: s.productId,
      position: s.position,
      viewsCount: s.viewsCount,
      likesCount: s.likesCount,
      commentsCount: s.commentsCount,
      customMediaUrl: s.customMediaUrl,
      customMediaType: s.customMediaType,
      product: {
        id: s.product.id,
        title: s.product.title,
        handle: s.product.handle,
        price: s.product.price,
        compareAtPrice: s.product.compareAtPrice,
        description: s.product.description,
        image: s.product.image,
      },
      isViewed: s.isViewed ?? false,
      isLiked: s.isLiked ?? false,
    }));
    
    storiesSettings = {
      displayMode: String(config.displayMode || 'home_only'),
      autoAdvanceSeconds: Number(config.autoAdvanceSeconds || 5),
      showProductInfo: Boolean(config.showProductInfo ?? true),
      allowLikes: Boolean(config.allowLikes ?? true),
      allowComments: Boolean(config.allowComments ?? true),
      allowQuickAdd: Boolean(config.allowQuickAdd ?? true),
      circleBorderColor: String(config.circleBorderColor || '#e91e63'),
      viewedBorderColor: String(config.viewedBorderColor || '#9e9e9e'),
    };
  }
  
  // Check if we're on a custom domain
  const headersList = await headers();
  const customDomain = headersList.get('x-custom-domain');
  const isCustomDomain = !!customDomain;
  
  // On custom domain: use root paths. On platform: use /shops/slug
  const basePath = isCustomDomain ? '' : `/shops/${slug}`;
  
  // 🆕 Check if we're on checkout page - no plugins/widgets should appear there
  const pathname = headersList.get('x-pathname') || '';
  const isCheckoutPage = pathname.includes('/checkout');
  // Check if homepage (for transparent header - only on homepage)
  // Note: x-pathname is set in middleware with the ORIGINAL pathname before any rewrite
  // For custom domain: pathname is '/' or '' (homepage)
  // For platform domain: pathname is '/shops/slug' or '/shops/slug/' (homepage)
  const isHomePage = isCustomDomain 
    ? (pathname === '/' || pathname === '')
    : (pathname === `/shops/${slug}` || pathname === `/shops/${slug}/`);

  // Always show header - categories/menu items are optional
  // Header contains logo, cart, search etc. which should always be visible
  const showHeader = true;

  // Build tracking configuration from store settings
  const storeSettings = (store.settings as Record<string, unknown>) || {};
  
  // Extract shipping settings for free shipping threshold
  const shippingSettings = (storeSettings.shipping as Record<string, unknown>) || {};
  const freeShippingThreshold = shippingSettings.enableFreeShipping 
    ? (shippingSettings.freeShippingThreshold as number) || undefined 
    : undefined;
  const trackingConfig: TrackingConfig = {
    storeId: store.id,
    storeSlug: slug,
    currency: (storeSettings.currency as string) || 'ILS',
    
    // Facebook Pixel
    facebookPixelId: (storeSettings.facebookPixelId as string) || undefined,
    facebookPixelEnabled: Boolean(storeSettings.facebookPixelEnabled),
    facebookAccessToken: (storeSettings.facebookAccessToken as string) || undefined,
    
    // Google Analytics 4
    googleAnalyticsId: (storeSettings.googleAnalyticsId as string) || undefined,
    googleAnalyticsEnabled: Boolean(storeSettings.googleAnalyticsEnabled),
    googleApiSecret: (storeSettings.googleApiSecret as string) || undefined,
    
    // Google Tag Manager
    gtmContainerId: (storeSettings.gtmContainerId as string) || undefined,
    gtmEnabled: Boolean(storeSettings.gtmEnabled),
    
    // TikTok Pixel
    tiktokPixelId: (storeSettings.tiktokPixelId as string) || undefined,
    tiktokPixelEnabled: Boolean(storeSettings.tiktokPixelEnabled),
    tiktokAccessToken: (storeSettings.tiktokAccessToken as string) || undefined,
    
    // Server-Side Tracking - ALWAYS enabled for Redis analytics
    // Even without social media tokens, we still want to track events in Redis
    serverSideEnabled: true,
  };

  // Map customer data for props (only what we need)
  const customerData = customer ? {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    hasPassword: !!customer.passwordHash,
    emailVerified: !!customer.emailVerifiedAt,
  } : null;

  // Get price display settings
  const showDecimalPrices = Boolean(storeSettings.showDecimalPrices);
  
  // Get header layout from store settings
  const headerLayout = (storeSettings.headerLayout as HeaderLayout) || 'logo-right';
  
  // Get navigation mode from store settings (menu = custom menus, categories = show all categories)
  const headerNavigationMode = (storeSettings.headerNavigationMode as 'menu' | 'categories') || 'menu';
  
  // 🌍 Locale settings for language switcher
  const supportedLocales = ((store.supportedLocales as string[]) || ['he']) as import('@/lib/translations/types').SupportedLocale[];
  const defaultLocale = ((store.defaultLocale as string) || 'he') as import('@/lib/translations/types').SupportedLocale;
  
  // Detect locale from cookie, URL, geo, or Accept-Language
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('preferred_locale')?.value;
  const countryCodeHeader = headersList.get('x-vercel-ip-country');
  const countryCode = countryCodeHeader ? countryCodeHeader : null;
  const acceptLanguageHeader = headersList.get('accept-language');
  const acceptLanguage = acceptLanguageHeader || undefined;
  
  const currentLocale = detectLocaleWithGeo({
    cookieLocale,
    urlLocale: undefined, // Can be added later if needed
    countryCode,
    acceptLanguage,
    supportedLocales,
    defaultLocale,
  });
  
  const showLanguageSwitcher = Boolean(storeSettings.headerShowLanguageSwitcher) && supportedLocales.length > 1;
  
  // 🌍 Load translations for current locale (only if store has multiple languages or custom translations)
  const hasMultipleLanguages = supportedLocales.length > 1;
  const shouldLoadTranslations = hasMultipleLanguages || store.hasCustomTranslations || currentLocale !== 'he';
  const translations = shouldLoadTranslations 
    ? await getUITranslations(store.id, currentLocale, hasMultipleLanguages, store.hasCustomTranslations ?? false)
    : null;
  
  // Get direction (RTL/LTR) for current locale
  const direction = getDirection(currentLocale);
  
  // Get menu items for header navigation (only if using menu mode)
  const menuItems: MenuItem[] = headerNavigationMode === 'menu' && mainMenu?.items 
    ? mainMenu.items 
    : [];
  
  // Get GDPR/Cookie banner settings
  const gdprSettings = storeSettings.gdpr as GDPRSettings | undefined;
  
  // Check if preview mode (from middleware header)
  // PERFORMANCE: Only load client components in preview mode
  const isPreviewMode = headersList.get('x-preview-mode') === 'true';

  // Get template CSS variables (Server-Side - Zero JS!)
  const templateId = (storeSettings.templateId as string) || 'noir';
  const template = getTemplateById(templateId) || getDefaultTemplate();
  const cssVariables = Object.entries(template.cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n    ');

  // ============================================================
  // CATALOG MODE CONFIG
  // Parse from plugin - must be before HeaderContent
  // ============================================================
  const catalogModeConfig: CatalogModeConfig | null = catalogModePlugin?.isActive ? {
    enabled: Boolean((catalogModePlugin.config as Record<string, unknown>)?.enabled),
    mode: ((catalogModePlugin.config as Record<string, unknown>)?.mode as 'all' | 'categories') || 'all',
    categoryIds: ((catalogModePlugin.config as Record<string, unknown>)?.categoryIds as string[]) || [],
    hideCartButton: Boolean((catalogModePlugin.config as Record<string, unknown>)?.hideCartButton ?? true),
    hideCartSidebar: Boolean((catalogModePlugin.config as Record<string, unknown>)?.hideCartSidebar ?? true),
    hideAddToCart: Boolean((catalogModePlugin.config as Record<string, unknown>)?.hideAddToCart ?? true),
    hidePrices: Boolean((catalogModePlugin.config as Record<string, unknown>)?.hidePrices ?? false),
    blockCheckout: Boolean((catalogModePlugin.config as Record<string, unknown>)?.blockCheckout ?? true),
    showContactButton: Boolean((catalogModePlugin.config as Record<string, unknown>)?.showContactButton),
    contactButtonText: String((catalogModePlugin.config as Record<string, unknown>)?.contactButtonText || 'צור קשר להזמנה'),
    contactButtonUrl: String((catalogModePlugin.config as Record<string, unknown>)?.contactButtonUrl || ''),
  } : null;

  // Check if cart should be hidden (catalog mode on all site)
  const shouldHideCartGlobally = catalogModeConfig?.enabled && 
    catalogModeConfig.mode === 'all' && 
    catalogModeConfig.hideCartButton;
  
  const shouldHideCartSidebarGlobally = catalogModeConfig?.enabled && 
    catalogModeConfig.mode === 'all' && 
    catalogModeConfig.hideCartSidebar;

  // ============================================================
  // PERFORMANCE ARCHITECTURE (per REQUIREMENTS.md):
  // 
  // PRODUCTION (99.9% of requests):
  // - ShopHeader = Server Component (0 JS, instant HTML)
  // - No PreviewSettingsProvider loaded
  // - No ShopHeaderClient loaded
  // - Result: ~0KB extra JS for header
  //
  // PREVIEW MODE (editor iframe only):
  // - ShopHeaderClient = Client Component (reactive to postMessage)
  // - PreviewSettingsProvider wraps for live updates
  // - Result: Full interactivity for editor
  // ============================================================

  // Header content based on mode
  const HeaderContent = isPreviewMode ? (
    // PREVIEW: Client component with live updates
    <PreviewSettingsProvider initialSettings={storeSettings as Record<string, unknown>}>
      <ShopHeaderClient
        storeName={store.name}
        storeId={store.id}
        logoUrl={store.logoUrl}
        categories={categories}
        menuItems={menuItems}
        navigationMode={headerNavigationMode}
        basePath={basePath}
        customer={customerData}
        defaultLayout={headerLayout}
        defaultSticky={Boolean(storeSettings.headerSticky ?? true)}
        defaultTransparent={isHomePage ? Boolean(storeSettings.headerTransparent) : false}
        defaultShowSearch={Boolean(storeSettings.headerShowSearch ?? true)}
        defaultShowCart={!shouldHideCartGlobally && Boolean(storeSettings.headerShowCart ?? true)}
        defaultShowAccount={Boolean(storeSettings.headerShowAccount ?? true)}
        defaultShowWishlist={Boolean(storeSettings.headerShowWishlist)}
        defaultShowLanguageSwitcher={showLanguageSwitcher}
        currentLocale={currentLocale}
        supportedLocales={supportedLocales}
      />
    </PreviewSettingsProvider>
  ) : (
    // PRODUCTION: Server component (zero JS) - respects DB settings
    // Announcement bar is client component for countdown timer
    <>
      {Boolean(storeSettings.announcementEnabled) && (
        <AnnouncementBar
          enabled={Boolean(storeSettings.announcementEnabled)}
          text={(storeSettings.announcementText as string) || ''}
          link={(storeSettings.announcementLink as string) || ''}
          bgColor={(storeSettings.announcementBgColor as string) || '#000000'}
          textColor={(storeSettings.announcementTextColor as string) || '#ffffff'}
          countdownEnabled={Boolean(storeSettings.announcementCountdownEnabled)}
          countdownDate={(storeSettings.announcementCountdownDate as string) || ''}
          countdownTime={(storeSettings.announcementCountdownTime as string) || '00:00'}
        />
      )}
      <ShopHeader 
        storeName={store.name} 
        storeId={store.id}
        logoUrl={store.logoUrl}
        categories={categories}
        menuItems={menuItems}
        navigationMode={headerNavigationMode}
        basePath={basePath}
        customer={customerData}
        layout={headerLayout}
        showSearch={Boolean(storeSettings.headerShowSearch ?? true)}
        showCart={!shouldHideCartGlobally && Boolean(storeSettings.headerShowCart ?? true)}
        showAccount={Boolean(storeSettings.headerShowAccount ?? true)}
        showWishlist={Boolean(storeSettings.headerShowWishlist)}
        showLanguageSwitcher={showLanguageSwitcher}
        isSticky={Boolean(storeSettings.headerSticky ?? true)}
        isTransparent={isHomePage ? Boolean(storeSettings.headerTransparent) : false}
        mobileMenuShowImages={Boolean(storeSettings.mobileMenuShowImages ?? false)}
        mobileMenuImageStyle={(storeSettings.mobileMenuImageStyle as 'fullRow' | 'square') ?? 'square'}
        mobileMenuBgColor={(storeSettings.mobileMenuBgColor as string) ?? '#f9fafb'}
        megaMenuBgColor={(storeSettings.megaMenuBgColor as string) ?? '#f9fafb'}
        currentLocale={currentLocale}
        supportedLocales={supportedLocales}
      />
    </>
  );

  // Get custom code from settings (Server-Side injection)
  const customCss = (storeSettings.customCss as string) || '';
  const customHeadCode = (storeSettings.customHeadCode as string) || '';
  const customBodyStartCode = (storeSettings.customBodyStartCode as string) || '';
  const customBodyEndCode = (storeSettings.customBodyEndCode as string) || '';
  
  // Global typography settings
  const headingFont = (storeSettings.headingFont as string) || 'Noto Sans Hebrew';
  const bodyFont = (storeSettings.bodyFont as string) || 'Assistant';

  return (
    <StoreProvider storeSlug={slug}>
      {/* Google Fonts Preconnect */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Google Fonts - Hebrew fonts bundle */}
      <link 
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Alef:wght@400;700&family=Arimo:ital,wght@0,400..700;1,400..700&family=Assistant:wght@200..800&family=Heebo:wght@100..900&family=IBM+Plex+Sans+Hebrew:wght@100;200;300;400;500;600;700&family=Noto+Rashi+Hebrew:wght@100..900&family=Noto+Sans+Hebrew:wght@100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Pacifico&family=Rubik:ital,wght@0,300..900;1,300..900&family=Varela+Round&display=swap"
      />
      
      {/* Template CSS Variables - Server-Side (Zero JS!) */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          ${cssVariables}
          --font-display: '${headingFont}', sans-serif;
          --font-sans: '${bodyFont}', sans-serif;
        }
        body {
          font-family: '${bodyFont}', sans-serif;
        }
        h1, h2, h3, h4, h5, h6, .font-display {
          font-family: '${headingFont}', sans-serif;
        }
        ${customCss}
      ` }} />
      
      {/* Custom Head Code - Server-Side injection */}
      {customHeadCode && (
        <div dangerouslySetInnerHTML={{ __html: customHeadCode }} />
      )}
      
      {/* Custom Body Start Code - Server-Side injection */}
      {customBodyStartCode && (
        <div dangerouslySetInnerHTML={{ __html: customBodyStartCode }} />
      )}
      
      <TrackingProvider config={trackingConfig}>
        <StoreSettingsProvider 
          showDecimalPrices={showDecimalPrices} 
          currency={store.currency}
        >
          <WishlistProvider 
            storeId={store.id} 
            customerId={customer?.id || null}
            initialItems={wishlistItems}
          >
          <CatalogModeProvider config={catalogModeConfig}>
          {/* 🌍 Translations Provider - wraps entire storefront */}
          {translations ? (
            <TranslationsProvider translations={translations} locale={currentLocale}>
              <div dir={direction}>
                {showHeader && (
                  <>
                    {HeaderContent}
                    {/* Cart Sidebar - hide when catalog mode is active on all site */}
                    {!shouldHideCartSidebarGlobally && (
                      <CartSidebar 
                        basePath={basePath} 
                        storeSlug={slug} 
                        freeShippingThreshold={freeShippingThreshold}
                        translations={translations.cart}
                      />
                    )}
                  </>
                )}
                {/* Stories Bar - Renders only if plugin is active and there are stories (not on checkout) */}
                {!isCheckoutPage && storiesEnabled && storiesSettings && stories.length > 0 && (
                  <StoriesBar
                    storeSlug={slug}
                    stories={stories}
                    settings={storiesSettings}
                    pageType="home"
                    basePath={basePath}
                  />
                )}
                <main>{children}</main>
                
                {/* Floating Advisor Button - Renders only if plugin is active and has advisors (not on checkout) */}
                {!isCheckoutPage && advisorEnabled && activeAdvisors.length > 0 && (
                  <FloatingAdvisorButton 
                    storeSlug={slug} 
                    storeId={store.id} 
                    advisors={activeAdvisors}
                    basePath={basePath}
                    position={(advisorPlugin?.config as Record<string, unknown>)?.floatingButtonPosition as 'left' | 'right' || 'right'}
                  />
                )}

                {/* Popup Display - Renders active popups (not on checkout) */}
                {!isCheckoutPage && activePopups.length > 0 && (
                  <PopupDisplay 
                    popups={activePopups.map(p => ({
                      id: p.id,
                      name: p.name,
                      type: p.type,
                      trigger: p.trigger,
                      triggerValue: p.triggerValue || 3,
                      position: p.position,
                      frequency: p.frequency,
                      frequencyDays: p.frequencyDays || 7,
                      targetPages: p.targetPages,
                      customTargetUrls: (p.customTargetUrls as string[]) || [],
                      showOnDesktop: p.showOnDesktop,
                      showOnMobile: p.showOnMobile,
                      content: p.content as Record<string, unknown>,
                      style: p.style as Record<string, unknown>,
                    }))}
                    storeSlug={slug}
                  />
                )}

                {/* Gamification Popup - Wheel of Fortune / Scratch Card (not on checkout) */}
                {!isCheckoutPage && (
                  <GamificationPopupLoader 
                    campaigns={activeGamificationCampaigns}
                    storeSlug={slug}
                    storeName={store.name}
                    wheelEnabled={wheelEnabled}
                    scratchEnabled={scratchEnabled}
                  />
                )}

                {/* WhatsApp Float Button - Renders only if plugin is active (not on checkout) */}
                {!isCheckoutPage && whatsappFloatEnabled && whatsappFloatPlugin && (
                  <WhatsAppFloatButton 
                    config={{
                      phoneNumber: String((whatsappFloatPlugin.config as Record<string, unknown>)?.phoneNumber || ''),
                      buttonColor: String((whatsappFloatPlugin.config as Record<string, unknown>)?.buttonColor || '#25D366'),
                      position: ((whatsappFloatPlugin.config as Record<string, unknown>)?.position as 'left' | 'right') || 'left',
                      showBubble: Boolean((whatsappFloatPlugin.config as Record<string, unknown>)?.showBubble ?? true),
                      bubbleText: String((whatsappFloatPlugin.config as Record<string, unknown>)?.bubbleText || 'היי! איך אפשר לעזור? 👋'),
                      bubbleDelaySeconds: Number((whatsappFloatPlugin.config as Record<string, unknown>)?.bubbleDelaySeconds || 3),
                      defaultMessage: String((whatsappFloatPlugin.config as Record<string, unknown>)?.defaultMessage || 'שלום, הגעתי דרך האתר ואשמח לקבל עזרה'),
                      showOnMobile: Boolean((whatsappFloatPlugin.config as Record<string, unknown>)?.showOnMobile ?? true),
                      showOnDesktop: Boolean((whatsappFloatPlugin.config as Record<string, unknown>)?.showOnDesktop ?? true),
                      showPulse: Boolean((whatsappFloatPlugin.config as Record<string, unknown>)?.showPulse ?? true),
                      bottomOffset: Number((whatsappFloatPlugin.config as Record<string, unknown>)?.bottomOffset || 20),
                      sideOffset: Number((whatsappFloatPlugin.config as Record<string, unknown>)?.sideOffset || 20),
                    }}
                  />
                )}

                {/* Cookie Consent Banner - GDPR Compliance */}
                {gdprSettings?.enabled && (
                  <CookieBanner settings={gdprSettings} storeSlug={slug} />
                )}
              </div>
            </TranslationsProvider>
          ) : (
            // Fallback: No translations (Hebrew only store)
            <div dir="rtl">
              {showHeader && (
                <>
                  {HeaderContent}
                  {/* Cart Sidebar - hide when catalog mode is active on all site */}
                  {!shouldHideCartSidebarGlobally && (
                    <CartSidebar 
                      basePath={basePath} 
                      storeSlug={slug} 
                      freeShippingThreshold={freeShippingThreshold}
                    />
                  )}
                  {/* Stories Bar - Renders only if plugin is active and there are stories (not on checkout) */}
                  {!isCheckoutPage && storiesEnabled && storiesSettings && stories.length > 0 && (
                    <StoriesBar
                      storeSlug={slug}
                      stories={stories}
                      settings={storiesSettings}
                      pageType="home"
                      basePath={basePath}
                    />
                  )}
                </>
              )}
              <main>{children}</main>
              
              {/* Floating Advisor Button - Renders only if plugin is active and has advisors (not on checkout) */}
              {!isCheckoutPage && advisorEnabled && activeAdvisors.length > 0 && (
                <FloatingAdvisorButton 
                  storeSlug={slug} 
                  storeId={store.id} 
                  advisors={activeAdvisors}
                  basePath={basePath}
                  position={(advisorPlugin?.config as Record<string, unknown>)?.floatingButtonPosition as 'left' | 'right' || 'right'}
                />
              )}

              {/* Popup Display - Renders active popups (not on checkout) */}
              {!isCheckoutPage && activePopups.length > 0 && (
                <PopupDisplay 
                  popups={activePopups.map(p => ({
                    id: p.id,
                    name: p.name,
                    type: p.type,
                    trigger: p.trigger,
                    triggerValue: p.triggerValue || 3,
                    position: p.position,
                    frequency: p.frequency,
                    frequencyDays: p.frequencyDays || 7,
                    targetPages: p.targetPages,
                    customTargetUrls: (p.customTargetUrls as string[]) || [],
                    showOnDesktop: p.showOnDesktop,
                    showOnMobile: p.showOnMobile,
                    content: p.content as Record<string, unknown>,
                    style: p.style as Record<string, unknown>,
                  }))}
                  storeSlug={slug}
                />
              )}

              {/* Gamification Popup - Wheel of Fortune / Scratch Card (not on checkout) */}
              {!isCheckoutPage && (
                <GamificationPopupLoader 
                  campaigns={activeGamificationCampaigns}
                  storeSlug={slug}
                  storeName={store.name}
                  wheelEnabled={wheelEnabled}
                  scratchEnabled={scratchEnabled}
                />
              )}

              {/* WhatsApp Float Button - Renders only if plugin is active (not on checkout) */}
              {!isCheckoutPage && whatsappFloatEnabled && whatsappFloatPlugin && (
                <WhatsAppFloatButton 
                  config={{
                    phoneNumber: String((whatsappFloatPlugin.config as Record<string, unknown>)?.phoneNumber || ''),
                    buttonColor: String((whatsappFloatPlugin.config as Record<string, unknown>)?.buttonColor || '#25D366'),
                    position: ((whatsappFloatPlugin.config as Record<string, unknown>)?.position as 'left' | 'right') || 'left',
                    showBubble: Boolean((whatsappFloatPlugin.config as Record<string, unknown>)?.showBubble ?? true),
                    bubbleText: String((whatsappFloatPlugin.config as Record<string, unknown>)?.bubbleText || 'היי! איך אפשר לעזור? 👋'),
                    bubbleDelaySeconds: Number((whatsappFloatPlugin.config as Record<string, unknown>)?.bubbleDelaySeconds || 3),
                    defaultMessage: String((whatsappFloatPlugin.config as Record<string, unknown>)?.defaultMessage || 'שלום, הגעתי דרך האתר ואשמח לקבל עזרה'),
                    showOnMobile: Boolean((whatsappFloatPlugin.config as Record<string, unknown>)?.showOnMobile ?? true),
                    showOnDesktop: Boolean((whatsappFloatPlugin.config as Record<string, unknown>)?.showOnDesktop ?? true),
                    showPulse: Boolean((whatsappFloatPlugin.config as Record<string, unknown>)?.showPulse ?? true),
                    bottomOffset: Number((whatsappFloatPlugin.config as Record<string, unknown>)?.bottomOffset || 20),
                    sideOffset: Number((whatsappFloatPlugin.config as Record<string, unknown>)?.sideOffset || 20),
                  }}
                />
              )}

              {/* Cookie Consent Banner - GDPR Compliance */}
              {gdprSettings?.enabled && (
                <CookieBanner settings={gdprSettings} storeSlug={slug} />
              )}
            </div>
          )}
          </CatalogModeProvider>
          </WishlistProvider>
        </StoreSettingsProvider>
      </TrackingProvider>
      
      {/* Custom Body End Code - Server-Side injection */}
      {customBodyEndCode && (
        <div dangerouslySetInnerHTML={{ __html: customBodyEndCode }} />
      )}
    </StoreProvider>
  );
}

// Helper component to load gamification with prizes
async function GamificationPopupLoader({
  campaigns,
  storeSlug,
  storeName,
  wheelEnabled,
  scratchEnabled,
}: {
  campaigns: typeof gamificationCampaigns.$inferSelect[];
  storeSlug: string;
  storeName: string;
  wheelEnabled: boolean;
  scratchEnabled: boolean;
}) {
  // Filter campaigns by enabled plugins
  const enabledCampaigns = campaigns.filter(c => 
    (c.type === 'wheel' && wheelEnabled) || (c.type === 'scratch' && scratchEnabled)
  );

  if (enabledCampaigns.length === 0) {
    return null;
  }

  // Fetch prizes for all campaigns
  const campaignsWithPrizes = await Promise.all(
    enabledCampaigns.map(async (campaign) => {
      const prizes = await db
        .select({
          id: gamificationPrizes.id,
          name: gamificationPrizes.name,
          type: gamificationPrizes.type,
          color: gamificationPrizes.color,
          icon: gamificationPrizes.icon,
        })
        .from(gamificationPrizes)
        .where(
          and(
            eq(gamificationPrizes.campaignId, campaign.id),
            eq(gamificationPrizes.isActive, true)
          )
        )
        .orderBy(asc(gamificationPrizes.sortOrder));

      return {
        id: campaign.id,
        type: campaign.type,
        title: campaign.title,
        subtitle: campaign.subtitle,
        buttonText: campaign.buttonText,
        primaryColor: campaign.primaryColor,
        secondaryColor: campaign.secondaryColor,
        backgroundColor: campaign.backgroundColor,
        textColor: campaign.textColor,
        collectName: campaign.collectName,
        collectEmail: campaign.collectEmail,
        collectPhone: campaign.collectPhone,
        collectBirthday: campaign.collectBirthday,
        requireMarketingConsent: campaign.requireMarketingConsent,
        requirePrivacyConsent: campaign.requirePrivacyConsent,
        privacyPolicyUrl: campaign.privacyPolicyUrl,
        termsUrl: campaign.termsUrl,
        trigger: campaign.trigger,
        triggerValue: campaign.triggerValue || 3,
        frequency: campaign.frequency,
        frequencyDays: campaign.frequencyDays || 7,
        targetPages: campaign.targetPages,
        showOnDesktop: campaign.showOnDesktop,
        showOnMobile: campaign.showOnMobile,
        prizes,
      };
    })
  );

  // Only show campaigns with prizes
  const validCampaigns = campaignsWithPrizes.filter(c => c.prizes.length > 0);

  if (validCampaigns.length === 0) {
    return null;
  }

  return (
    <GamificationPopup
      campaigns={validCampaigns}
      storeSlug={storeSlug}
      storeName={storeName}
    />
  );
}

