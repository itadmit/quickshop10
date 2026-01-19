'use client';

import { CartButton } from '@/components/cart-button';
import { UserButton } from '@/components/user-button';
import { SearchButton } from '@/components/search-button';
import { LanguageSwitcher } from './language-switcher';
import { usePreviewSettings } from './preview-settings-provider';
import type { SupportedLocale } from '@/lib/translations/types';

/**
 * Header Icons Component
 * 
 * Client component that wraps header icons (search, cart, account, language)
 * and responds to live preview settings from editor.
 * 
 * PERFORMANCE: 
 * - In production: Just renders icons, context returns empty
 * - In preview: Listens to settings and conditionally renders
 */

interface CustomerData {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  hasPassword?: boolean;
  emailVerified?: boolean;
}

interface HeaderIconsProps {
  basePath: string;
  storeId: string;
  customer?: CustomerData | null;
  searchFirst?: boolean; // For logo-center layout
  // Initial settings from server (defaults)
  showSearch?: boolean;
  showCart?: boolean;
  showAccount?: boolean;
  showLanguageSwitcher?: boolean;
  // Locale settings
  currentLocale?: SupportedLocale;
  supportedLocales?: SupportedLocale[];
}

export function HeaderIcons({
  basePath,
  storeId,
  customer,
  searchFirst = false,
  showSearch = true,
  showCart = true,
  showAccount = true,
  showLanguageSwitcher = false,
  currentLocale = 'he',
  supportedLocales = ['he'],
}: HeaderIconsProps) {
  const { settings, isPreviewMode } = usePreviewSettings();
  
  // Determine visibility - preview settings override server defaults
  const shouldShowSearch = isPreviewMode 
    ? (settings.headerShowSearch ?? showSearch) 
    : showSearch;
  const shouldShowCart = isPreviewMode 
    ? (settings.headerShowCart ?? showCart) 
    : showCart;
  const shouldShowAccount = isPreviewMode 
    ? (settings.headerShowAccount ?? showAccount) 
    : showAccount;
  const shouldShowLanguageSwitcher = isPreviewMode
    ? (settings.headerShowLanguageSwitcher ?? showLanguageSwitcher)
    : showLanguageSwitcher;

  return (
    <>
      {searchFirst && shouldShowSearch && (
        <SearchButton basePath={basePath} storeId={storeId} />
      )}
      {/* Language Switcher - desktop only (shown in mobile menu instead) */}
      {shouldShowLanguageSwitcher && supportedLocales.length > 1 && (
        <LanguageSwitcher
          currentLocale={currentLocale}
          supportedLocales={supportedLocales}
          variant="minimal"
          className="hidden lg:flex"
        />
      )}
      {shouldShowAccount && (
        <UserButton basePath={basePath} initialCustomer={customer} />
      )}
      {shouldShowCart && (
        <CartButton />
      )}
      {!searchFirst && shouldShowSearch && (
        <SearchButton basePath={basePath} storeId={storeId} />
      )}
    </>
  );
}



