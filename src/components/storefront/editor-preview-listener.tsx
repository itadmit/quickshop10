'use client';

import { useEffect, useState, createContext, useContext } from 'react';

/**
 * Editor Preview Listener
 * 
 * This component listens for postMessage from the editor parent window
 * and provides theme settings overrides for live preview.
 * 
 * PERFORMANCE: Only loaded when ?preview=true is in URL
 * The context provides settings that override DB values for instant preview
 */

// Theme settings interface (same as editor)
export interface ThemeSettings {
  headerLayout?: 'logo-right' | 'logo-left' | 'logo-center';
  headerSticky?: boolean;
  headerTransparent?: boolean;
  headerShowSearch?: boolean;
  headerShowCart?: boolean;
  headerShowAccount?: boolean;
  announcementEnabled?: boolean;
  announcementText?: string;
  announcementLink?: string;
  announcementBgColor?: string;
  announcementTextColor?: string;
  footerShowLogo?: boolean;
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

interface PreviewContextValue {
  isPreviewMode: boolean;
  previewSettings: ThemeSettings | null;
}

const PreviewContext = createContext<PreviewContextValue>({
  isPreviewMode: false,
  previewSettings: null,
});

export function usePreviewSettings() {
  return useContext(PreviewContext);
}

export function EditorPreviewListener({ 
  children,
  initialSettings,
}: { 
  children: React.ReactNode;
  initialSettings?: ThemeSettings;
}) {
  const [previewSettings, setPreviewSettings] = useState<ThemeSettings | null>(
    initialSettings || null
  );

  useEffect(() => {
    // Listen for messages from editor parent window
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'THEME_SETTINGS_UPDATE') {
        console.log('[Preview] Received settings update:', event.data.settings);
        setPreviewSettings(event.data.settings);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Let parent know we're ready to receive updates
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <PreviewContext.Provider value={{ 
      isPreviewMode: true, 
      previewSettings 
    }}>
      {children}
    </PreviewContext.Provider>
  );
}


