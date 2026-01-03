'use client';

import { useEffect, useRef } from 'react';
import { tracker, type TrackingConfig } from '@/lib/tracking';
import { usePathname, useSearchParams } from 'next/navigation';

interface TrackingProviderProps {
  config: TrackingConfig;
  children: React.ReactNode;
}

/**
 * Tracking Provider Component
 * 
 * Initializes the tracking system and handles automatic PageView tracking
 * Uses requestIdleCallback to not block the main thread
 */
export function TrackingProvider({ config, children }: TrackingProviderProps) {
  const initialized = useRef(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize tracker once
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Use requestIdleCallback to not block rendering
    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
        tracker.init(config);
      });
    } else {
      // Fallback for Safari
      setTimeout(() => tracker.init(config), 1);
    }
  }, [config]);

  // Track page views on navigation
  useEffect(() => {
    if (!initialized.current) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    // Determine page type and track accordingly
    if (pathname.endsWith('/') || pathname.match(/\/shops\/[^/]+\/?$/)) {
      tracker.viewHomePage(url);
    } else {
      tracker.pageView(url, document.title);
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}

/**
 * Hook to access the tracker
 * Use for imperative tracking in components
 */
export function useTracking() {
  return tracker;
}

