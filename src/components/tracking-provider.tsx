'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [isReady, setIsReady] = useState(false);
  const initStarted = useRef(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

  // Initialize tracker once
  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    // Use requestIdleCallback to not block rendering
    const doInit = () => {
      tracker.init(config);
      setIsReady(true);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[TrackingProvider] Initialized');
      }
    };

    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(doInit);
    } else {
      // Fallback for Safari
      setTimeout(doInit, 1);
    }
  }, [config]);

  // Track page views on navigation - only after tracker is ready
  // Wait for document.title to update (Next.js updates it asynchronously)
  useEffect(() => {
    if (!isReady) return;

    const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    // Avoid tracking the same path twice
    if (lastTrackedPath.current === currentPath) return;
    
    // Determine page type and track accordingly
    if (pathname === '/' || pathname.match(/\/shops\/[^/]+\/?$/)) {
      lastTrackedPath.current = currentPath;
      tracker.viewHomePage(currentPath);
      if (process.env.NODE_ENV === 'development') {
        console.log('[TrackingProvider] ViewHomePage:', currentPath);
      }
    } else {
      // Wait for document.title to update (Next.js updates it after component render)
      // Use requestAnimationFrame + setTimeout to ensure title is set
      const trackPageView = () => {
        lastTrackedPath.current = currentPath;
        tracker.pageView(currentPath, document.title);
        if (process.env.NODE_ENV === 'development') {
          console.log('[TrackingProvider] PageView:', currentPath, 'title:', document.title);
        }
      };
      
      // Use MutationObserver to detect when title changes, with fallback timeout
      const titleElement = document.querySelector('title');
      if (titleElement) {
        const initialTitle = document.title;
        let tracked = false;
        
        const observer = new MutationObserver(() => {
          if (!tracked && document.title !== initialTitle) {
            tracked = true;
            observer.disconnect();
            trackPageView();
          }
        });
        
        observer.observe(titleElement, { childList: true, characterData: true, subtree: true });
        
        // Fallback: if title doesn't change within 100ms, track anyway
        setTimeout(() => {
          if (!tracked) {
            tracked = true;
            observer.disconnect();
            trackPageView();
          }
        }, 100);
      } else {
        // No title element, track immediately
        requestAnimationFrame(trackPageView);
      }
    }
  }, [isReady, pathname, searchParams]);

  return <>{children}</>;
}

/**
 * Hook to access the tracker
 * Use for imperative tracking in components
 */
export function useTracking() {
  return tracker;
}
