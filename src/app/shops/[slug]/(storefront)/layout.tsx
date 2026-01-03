import { getStoreBySlug, getCategoriesByStore } from '@/lib/db/queries';
import { ShopHeader } from '@/components/shop-header';
import { CartSidebar } from '@/components/cart-sidebar';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { cache } from 'react';
import { isPluginActive, getStoriesWithProducts, getStorePlugin, getActiveAdvisorsForFloating } from '@/lib/plugins/loader';
import { StoriesBar, type Story, type StoriesSettings } from '@/components/storefront/stories-bar';
import { FloatingAdvisorButton } from '@/components/storefront/floating-advisor-button';

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

  // Fetch categories, customer, and plugin data in parallel (server-side)
  const [categories, customer, storiesEnabled, storiesPlugin, advisorEnabled, activeAdvisors] = await Promise.all([
    getCategoriesByStore(store.id),
    getCurrentCustomer(),
    isPluginActive(store.id, 'product-stories'),
    getStorePlugin(store.id, 'product-stories'),
    isPluginActive(store.id, 'smart-advisor'),
    getActiveAdvisorsForFloating(store.id),
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
  
  const basePath = `/shops/${slug}`;

  // Check if we should show header (only if there's content)
  const showHeader = categories.length > 0;

  // Map customer data for props (only what we need)
  const customerData = customer ? {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    hasPassword: !!customer.passwordHash,
    emailVerified: !!customer.emailVerifiedAt,
  } : null;

  return (
    <>
      {showHeader && (
        <>
          <ShopHeader 
            storeName={store.name} 
            categories={categories} 
            basePath={basePath}
            customer={customerData}
          />
          <CartSidebar basePath={basePath} />
          {/* Stories Bar - Renders only if plugin is active and there are stories */}
          {storiesEnabled && storiesSettings && stories.length > 0 && (
            <StoriesBar
              storeSlug={slug}
              stories={stories}
              settings={storiesSettings}
              pageType="home"
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
        />
      )}
    </>
  );
}

