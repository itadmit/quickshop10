import { getStoreBySlug, getCategoriesByStore } from '@/lib/db/queries';
import { ShopHeader, type HeaderLayout } from '@/components/shop-header';
import { CartSidebar } from '@/components/cart-sidebar';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { cache } from 'react';
import { headers } from 'next/headers';
import { isPluginActive, getStoriesWithProducts, getStorePlugin, getActiveAdvisorsForFloating } from '@/lib/plugins/loader';
import { StoriesBar, type Story, type StoriesSettings } from '@/components/storefront/stories-bar';
import { FloatingAdvisorButton } from '@/components/storefront/floating-advisor-button';
import { PopupDisplay } from '@/components/storefront/popup-display';
import { TrackingProvider } from '@/components/tracking-provider';
import { StoreSettingsProvider } from '@/components/store-settings-provider';
import { PreviewSettingsProvider } from '@/components/storefront/preview-settings-provider';
import { SmartHeader, ServerHeaderHider } from '@/components/storefront/smart-header';
import type { TrackingConfig } from '@/lib/tracking';
import { db } from '@/lib/db';
import { popups } from '@/lib/db/schema';
import { eq, and, lte, or, isNull, gte } from 'drizzle-orm';

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

  // Fetch categories, customer, plugin data, and popups in parallel (server-side)
  const now = new Date();
  const [categories, customer, storiesEnabled, storiesPlugin, advisorEnabled, advisorPlugin, activeAdvisors, activePopups] = await Promise.all([
    getCategoriesByStore(store.id),
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

  return (
    <TrackingProvider config={trackingConfig}>
      <StoreSettingsProvider 
        showDecimalPrices={showDecimalPrices} 
        currency={store.currency}
      >
      {/* Preview settings provider auto-detects iframe mode */}
      <PreviewSettingsProvider initialSettings={storeSettings as Record<string, unknown>}>
        {showHeader && (
          <>
            {/* Server header - hidden in preview mode */}
            <ServerHeaderHider>
              <ShopHeader 
                storeName={store.name} 
                storeId={store.id}
                categories={categories} 
                basePath={basePath}
                customer={customerData}
                layout={headerLayout}
              />
            </ServerHeaderHider>
            
            {/* Client header - only shown in preview mode for live updates */}
            <SmartHeader
              storeName={store.name}
              storeId={store.id}
              categories={categories}
              basePath={basePath}
              customer={customerData}
              layout={headerLayout}
              headerSticky={Boolean(storeSettings.headerSticky ?? true)}
              headerTransparent={Boolean(storeSettings.headerTransparent)}
              headerShowSearch={Boolean(storeSettings.headerShowSearch ?? true)}
              headerShowCart={Boolean(storeSettings.headerShowCart ?? true)}
              headerShowAccount={Boolean(storeSettings.headerShowAccount ?? true)}
            />
            
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
      </PreviewSettingsProvider>
      </StoreSettingsProvider>
    </TrackingProvider>
  );
}

