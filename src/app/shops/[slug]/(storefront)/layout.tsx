import { getStoreBySlug, getCategoriesByStore, getMainMenuWithItems, type MenuItem } from '@/lib/db/queries';
import { ShopHeader, type HeaderLayout } from '@/components/shop-header';
import { CartSidebar } from '@/components/cart-sidebar';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { cache } from 'react';
import { headers } from 'next/headers';
import { isPluginActive, getStoriesWithProducts, getStorePlugin, getActiveAdvisorsForFloating } from '@/lib/plugins/loader';
import { StoriesBar, type Story, type StoriesSettings } from '@/components/storefront/stories-bar';
import { FloatingAdvisorButton } from '@/components/storefront/floating-advisor-button';
import { PopupDisplay } from '@/components/storefront/popup-display';
import { GamificationPopup } from '@/components/storefront/gamification/gamification-popup';
import { CookieBanner, type GDPRSettings } from '@/components/storefront/cookie-banner';
import { TrackingProvider } from '@/components/tracking-provider';
import { StoreSettingsProvider } from '@/components/store-settings-provider';
import { StoreProvider } from '@/lib/store-context';
import type { TrackingConfig } from '@/lib/tracking';
import { db } from '@/lib/db';
import { popups, gamificationCampaigns, gamificationPrizes } from '@/lib/db/schema';
import { eq, and, lte, or, isNull, gte, asc } from 'drizzle-orm';

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
  const [categories, mainMenu, customer, storiesEnabled, storiesPlugin, advisorEnabled, advisorPlugin, activeAdvisors, activePopups, wheelEnabled, scratchEnabled, activeGamificationCampaigns] = await Promise.all([
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
  ]);
  
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

  // Check if we should show header (only if there's content)
  const showHeader = categories.length > 0;

  // Build tracking configuration from store settings
  const storeSettings = (store.settings as Record<string, unknown>) || {};
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
  
  // Get menu items for header navigation (only if using menu mode)
  const menuItems: MenuItem[] = headerNavigationMode === 'menu' && mainMenu?.items 
    ? mainMenu.items 
    : [];
  
  // Get GDPR/Cookie banner settings
  const gdprSettings = storeSettings.gdpr as GDPRSettings | undefined;
  
  // Check if preview mode (from middleware header)
  // PERFORMANCE: Only load client components in preview mode
  const isPreviewMode = headersList.get('x-preview-mode') === 'true';

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
        defaultTransparent={Boolean(storeSettings.headerTransparent)}
        defaultShowSearch={Boolean(storeSettings.headerShowSearch ?? true)}
        defaultShowCart={Boolean(storeSettings.headerShowCart ?? true)}
        defaultShowAccount={Boolean(storeSettings.headerShowAccount ?? true)}
      />
    </PreviewSettingsProvider>
  ) : (
    // PRODUCTION: Server component (zero JS) - respects DB settings
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
      showCart={Boolean(storeSettings.headerShowCart ?? true)}
      showAccount={Boolean(storeSettings.headerShowAccount ?? true)}
      isSticky={Boolean(storeSettings.headerSticky ?? true)}
    />
  );

  return (
    <StoreProvider storeSlug={slug}>
      <TrackingProvider config={trackingConfig}>
        <StoreSettingsProvider 
          showDecimalPrices={showDecimalPrices} 
          currency={store.currency}
        >
          {showHeader && (
            <>
              {HeaderContent}
              <CartSidebar basePath={basePath} />
              {/* Stories Bar - Renders only if plugin is active and there are stories */}
              {storiesEnabled && storiesSettings && stories.length > 0 && (
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
          
          {/* Floating Advisor Button - Renders only if plugin is active and has advisors */}
          {advisorEnabled && activeAdvisors.length > 0 && (
            <FloatingAdvisorButton 
              storeSlug={slug} 
              storeId={store.id} 
              advisors={activeAdvisors}
              basePath={basePath}
              position={(advisorPlugin?.config as Record<string, unknown>)?.floatingButtonPosition as 'left' | 'right' || 'right'}
            />
          )}

          {/* Popup Display - Renders active popups */}
          {activePopups.length > 0 && (
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

          {/* Gamification Popup - Wheel of Fortune / Scratch Card */}
          <GamificationPopupLoader 
            campaigns={activeGamificationCampaigns}
            storeSlug={slug}
            storeName={store.name}
            wheelEnabled={wheelEnabled}
            scratchEnabled={scratchEnabled}
          />

          {/* Cookie Consent Banner - GDPR Compliance */}
          {gdprSettings?.enabled && (
            <CookieBanner settings={gdprSettings} storeSlug={slug} />
          )}
        </StoreSettingsProvider>
      </TrackingProvider>
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

