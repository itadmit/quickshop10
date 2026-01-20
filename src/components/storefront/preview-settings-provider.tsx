'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

/**
 * Preview Settings Provider
 * 
 * Listens for postMessage from editor and provides live settings updates.
 * Auto-detects if running inside iframe from editor.
 * 
 * PERFORMANCE: 
 * - Zero overhead in production (not in iframe)
 * - Small client component for preview mode only
 */

interface ThemeSettings {
  headerLayout?: 'logo-right' | 'logo-left' | 'logo-center';
  headerSticky?: boolean;
  headerTransparent?: boolean;
  headerShowSearch?: boolean;
  headerShowCart?: boolean;
  headerShowAccount?: boolean;
  headerShowWishlist?: boolean;
  headerShowLanguageSwitcher?: boolean;
  headerNavigationMode?: 'menu' | 'categories';
  // Mobile menu settings
  mobileMenuShowImages?: boolean;
  mobileMenuImageStyle?: 'fullRow' | 'square';
  mobileMenuBgColor?: string;
  megaMenuBgColor?: string;
  // Logo & Favicon
  logoUrl?: string;
  faviconUrl?: string;
  // Announcement bar
  announcementEnabled?: boolean;
  announcementText?: string;
  announcementLink?: string;
  announcementBgColor?: string;
  announcementTextColor?: string;
  // Countdown timer
  announcementCountdownEnabled?: boolean;
  announcementCountdownDate?: string;
  announcementCountdownTime?: string;
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
}

interface PreviewSettingsContextValue {
  settings: ThemeSettings;
  isPreviewMode: boolean;
  highlightedSectionId: string | null;
}

const PreviewSettingsContext = createContext<PreviewSettingsContextValue>({
  settings: {},
  isPreviewMode: false,
  highlightedSectionId: null,
});

export function usePreviewSettings() {
  return useContext(PreviewSettingsContext);
}

// Hook to get a specific setting with live preview support
export function useHeaderSetting<K extends keyof ThemeSettings>(
  key: K,
  defaultValue: ThemeSettings[K],
  serverValue?: ThemeSettings[K]
): ThemeSettings[K] {
  const { settings, isPreviewMode } = usePreviewSettings();
  
  // In preview mode, use live settings from editor
  if (isPreviewMode && settings[key] !== undefined) {
    return settings[key];
  }
  
  // Otherwise use server value or default
  return serverValue ?? defaultValue;
}

interface PreviewSettingsProviderProps {
  children: ReactNode;
  initialSettings?: ThemeSettings;
}

export function PreviewSettingsProvider({ 
  children, 
  initialSettings = {},
}: PreviewSettingsProviderProps) {
  const [settings, setSettings] = useState<ThemeSettings>(initialSettings);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [highlightedSectionId, setHighlightedSectionId] = useState<string | null>(null);

  useEffect(() => {
    // Auto-detect preview mode: check if in iframe AND has preview=true in URL
    const isInIframe = window.parent !== window;
    const urlParams = new URLSearchParams(window.location.search);
    const hasPreviewParam = urlParams.get('preview') === 'true';
    
    const inPreviewMode = isInIframe && hasPreviewParam;
    setIsPreviewMode(inPreviewMode);
    
    if (!inPreviewMode) return;

    // Listen for messages from editor parent window
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'THEME_SETTINGS_UPDATE') {
        setSettings(prev => ({ ...prev, ...event.data.settings }));
      }
      if (event.data?.type === 'HIGHLIGHT_SECTION') {
        setHighlightedSectionId(event.data.sectionId);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Let parent know we're ready
    window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <PreviewSettingsContext.Provider value={{ settings, isPreviewMode, highlightedSectionId }}>
      {children}
    </PreviewSettingsContext.Provider>
  );
}

