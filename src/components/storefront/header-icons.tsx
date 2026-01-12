'use client';

import { CartButton } from '@/components/cart-button';
import { UserButton } from '@/components/user-button';
import { SearchButton } from '@/components/search-button';
import { usePreviewSettings } from './preview-settings-provider';

/**
 * Header Icons Component
 * 
 * Client component that wraps header icons (search, cart, account)
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
}

export function HeaderIcons({
  basePath,
  storeId,
  customer,
  searchFirst = false,
  showSearch = true,
  showCart = true,
  showAccount = true,
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

  return (
    <>
      {searchFirst && shouldShowSearch && (
        <SearchButton basePath={basePath} storeId={storeId} />
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


