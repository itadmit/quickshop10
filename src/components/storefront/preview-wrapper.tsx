'use client';

import { ReactNode } from 'react';
import { usePreviewSettings } from './preview-settings-provider';

/**
 * Preview Wrapper Components
 * 
 * Small client components that wrap header elements
 * and respond to live preview settings from editor.
 * 
 * PERFORMANCE: Minimal JS, just conditional rendering
 */

// Wrapper for Search Button - hides when headerShowSearch is false
export function SearchWrapper({ children }: { children: ReactNode }) {
  const { settings, isPreviewMode } = usePreviewSettings();
  
  // In preview mode, check live settings
  if (isPreviewMode && settings.headerShowSearch === false) {
    return null;
  }
  
  return <>{children}</>;
}

// Wrapper for Cart Button - hides when headerShowCart is false
export function CartWrapper({ children }: { children: ReactNode }) {
  const { settings, isPreviewMode } = usePreviewSettings();
  
  if (isPreviewMode && settings.headerShowCart === false) {
    return null;
  }
  
  return <>{children}</>;
}

// Wrapper for Account/User Button - hides when headerShowAccount is false
export function AccountWrapper({ children }: { children: ReactNode }) {
  const { settings, isPreviewMode } = usePreviewSettings();
  
  if (isPreviewMode && settings.headerShowAccount === false) {
    return null;
  }
  
  return <>{children}</>;
}

// Wrapper for Announcement Bar
export function AnnouncementBarWrapper({ 
  children,
  fallback,
}: { 
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { settings, isPreviewMode } = usePreviewSettings();
  
  if (isPreviewMode) {
    if (settings.announcementEnabled === false) {
      return null;
    }
    if (settings.announcementEnabled === true) {
      // Show custom announcement from settings
      return (
        <div 
          className="text-center py-2 text-sm"
          style={{ 
            backgroundColor: settings.announcementBgColor || '#000',
            color: settings.announcementTextColor || '#fff',
          }}
        >
          {settings.announcementLink ? (
            <a href={settings.announcementLink} className="hover:underline">
              {settings.announcementText || 'הודעה חשובה'}
            </a>
          ) : (
            settings.announcementText || 'הודעה חשובה'
          )}
        </div>
      );
    }
  }
  
  return <>{children || fallback}</>;
}

// Generic visibility wrapper
export function VisibilityWrapper({ 
  children,
  settingKey,
  defaultVisible = true,
}: { 
  children: ReactNode;
  settingKey: keyof ReturnType<typeof usePreviewSettings>['settings'];
  defaultVisible?: boolean;
}) {
  const { settings, isPreviewMode } = usePreviewSettings();
  
  if (isPreviewMode) {
    const value = settings[settingKey];
    if (value === false) return null;
  }
  
  if (!defaultVisible && !isPreviewMode) return null;
  
  return <>{children}</>;
}










