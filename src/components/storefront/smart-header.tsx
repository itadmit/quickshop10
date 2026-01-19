'use client';

import { usePreviewSettings } from './preview-settings-provider';
import { ShopHeaderClient } from './shop-header-client';
import type { HeaderLayout } from './shop-header-client';

/**
 * Smart Header Component
 * 
 * In production: Renders nothing, parent layout uses ShopHeader (Server Component)
 * In preview mode: Renders ShopHeaderClient for live reactivity
 * 
 * This component should be used ALONGSIDE ShopHeader in layout:
 * - ShopHeader renders for production
 * - SmartHeader takes over in preview mode
 * 
 * PERFORMANCE: Zero overhead in production
 */

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface CustomerData {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  hasPassword?: boolean;
  emailVerified?: boolean;
}

interface SmartHeaderProps {
  storeName: string;
  storeId: string;
  categories: Category[];
  basePath: string;
  customer?: CustomerData | null;
  layout?: HeaderLayout;
  // Server-side settings
  headerSticky?: boolean;
  headerTransparent?: boolean;
  headerShowSearch?: boolean;
  headerShowCart?: boolean;
  headerShowAccount?: boolean;
  headerShowLanguageSwitcher?: boolean;
  // Locale settings
  currentLocale?: string;
  supportedLocales?: string[];
}

export function SmartHeader({
  storeName,
  storeId,
  categories,
  basePath,
  customer,
  layout = 'logo-right',
  headerSticky = true,
  headerTransparent = false,
  headerShowSearch = true,
  headerShowCart = true,
  headerShowAccount = true,
  headerShowLanguageSwitcher = false,
  currentLocale = 'he',
  supportedLocales = ['he'],
}: SmartHeaderProps) {
  const { isPreviewMode } = usePreviewSettings();
  
  // In production, render nothing (parent uses ShopHeader server component)
  if (!isPreviewMode) {
    return null;
  }
  
  // In preview mode, render the client header
  return (
    <ShopHeaderClient
      storeName={storeName}
      storeId={storeId}
      categories={categories}
      basePath={basePath}
      customer={customer}
      defaultLayout={layout}
      defaultSticky={headerSticky}
      defaultTransparent={headerTransparent}
      defaultShowSearch={headerShowSearch}
      defaultShowCart={headerShowCart}
      defaultShowAccount={headerShowAccount}
      defaultShowLanguageSwitcher={headerShowLanguageSwitcher}
      currentLocale={currentLocale}
      supportedLocales={supportedLocales}
    />
  );
}

/**
 * Server Header Hider
 * 
 * Hides the server header when in preview mode
 */
export function ServerHeaderHider({ children }: { children: React.ReactNode }) {
  const { isPreviewMode } = usePreviewSettings();
  
  if (isPreviewMode) {
    return null; // Hide server header in preview mode
  }
  
  return <>{children}</>;
}

