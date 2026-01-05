'use client';

import { ReactNode } from 'react';
import { usePreviewSettings } from './preview-settings-provider';

/**
 * Header Wrapper Component
 * 
 * Wraps the entire header and applies live preview settings for:
 * - Sticky header (position)
 * - Transparent background
 * 
 * PERFORMANCE: Minimal JS, just CSS class changes
 */

interface HeaderWrapperProps {
  children: ReactNode;
  defaultSticky?: boolean;
  defaultTransparent?: boolean;
}

export function HeaderWrapper({
  children,
  defaultSticky = true,
  defaultTransparent = false,
}: HeaderWrapperProps) {
  const { settings, isPreviewMode } = usePreviewSettings();
  
  // Determine sticky - preview settings override server defaults
  const isSticky = isPreviewMode 
    ? (settings.headerSticky ?? defaultSticky) 
    : defaultSticky;
  
  // Determine transparent - preview settings override server defaults  
  const isTransparent = isPreviewMode 
    ? (settings.headerTransparent ?? defaultTransparent) 
    : defaultTransparent;

  return (
    <div 
      className={`
        ${isSticky ? 'sticky top-0 z-30' : 'relative'}
        ${isTransparent ? 'bg-transparent' : 'bg-white/95 backdrop-blur-sm'}
        border-b border-gray-100
      `}
    >
      {children}
    </div>
  );
}

