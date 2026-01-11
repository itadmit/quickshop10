'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

// ============================================
// Live Preview - iframe showing actual storefront
// ============================================

interface LivePreviewProps {
  storeSlug: string;
  previewMode: 'desktop' | 'mobile' | 'tablet';
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
  refreshKey: number; // Increment to force iframe refresh
  onIframeLoad?: (iframe: HTMLIFrameElement) => void; // Callback to pass iframe ref to parent
  currentPage?: string; // Page being edited (home, coming_soon, etc.)
  customDomain?: string | null; // Custom domain if configured
}

export function LivePreview({
  storeSlug,
  previewMode,
  selectedSectionId,
  onSelectSection,
  refreshKey,
  onIframeLoad,
  currentPage = 'home',
  customDomain,
}: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Preview dimensions based on device mode
  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile': 
        return { width: '375px', height: 'calc(100vh - 140px)' };
      case 'tablet': 
        return { width: '768px', height: 'calc(100vh - 140px)' };
      default: 
        return { width: '100%', maxWidth: '1400px', height: 'calc(100vh - 140px)' };
    }
  };

  const dimensions = getPreviewDimensions();

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    
    // Pass iframe reference to parent for live updates
    if (iframeRef.current && onIframeLoad) {
      onIframeLoad(iframeRef.current);
    }
    
    // Try to inject selection handlers into iframe for section clicking
    try {
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        // Add message listener for section clicks from iframe
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'section-click' && event.data?.sectionId) {
            onSelectSection(event.data.sectionId);
          }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
      }
    } catch (e) {
      // Cross-origin restrictions may apply
      console.log('Could not access iframe content');
    }
  }, [onSelectSection, onIframeLoad]);

  // Refresh iframe when refreshKey changes
  useEffect(() => {
    if (iframeRef.current && refreshKey > 0) {
      setIsLoading(true);
      iframeRef.current.src = iframeRef.current.src;
    }
  }, [refreshKey]);

  // Navigate to new page when currentPage changes
  useEffect(() => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = getPreviewUrl();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Send scroll and highlight command to iframe when selectedSectionId changes
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      // Always send highlight update (even for null to clear highlight)
      iframeRef.current.contentWindow.postMessage({
        type: 'HIGHLIGHT_SECTION',
        sectionId: selectedSectionId,
      }, '*');
      
      // Only scroll if we have a selected section
      if (selectedSectionId) {
        iframeRef.current.contentWindow.postMessage({
          type: 'SCROLL_TO_SECTION',
          sectionId: selectedSectionId,
        }, '*');
      }
    }
  }, [selectedSectionId]);

  // Listen for messages from iframe (section clicks)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SECTION_CLICKED' && event.data?.sectionId) {
        onSelectSection(event.data.sectionId);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSelectSection]);

  // Storefront URL - use special editor preview mode
  // Show different pages based on currentPage
  const getPreviewUrl = () => {
    // Handle internal pages (pages/about, pages/privacy, etc.)
    if (currentPage.startsWith('pages/')) {
      const pageSlug = currentPage.replace('pages/', '');
      return `/shops/${storeSlug}/pages/${pageSlug}?preview=true&t=${refreshKey}`;
    }
    
    switch (currentPage) {
      case 'coming_soon':
        return `/shops/${storeSlug}/coming-soon?preview=true&t=${refreshKey}`;
      case 'product':
        // Preview a sample product (first product in store will be fetched)
        return `/shops/${storeSlug}/product/sample?preview=true&t=${refreshKey}`;
      default:
        return `/shops/${storeSlug}?preview=true&t=${refreshKey}`;
    }
  };
  const previewUrl = getPreviewUrl();

  return (
    <div className="flex flex-col items-center justify-start w-full h-full">
      {/* Browser Chrome */}
      <div 
        className="bg-[#dee1e6] rounded-t-xl shadow-2xl flex flex-col"
        style={{ width: dimensions.width, maxWidth: dimensions.maxWidth, height: dimensions.height }}
      >
        {/* Traffic Light Buttons & URL Bar */}
        <div className="px-4 py-2.5 flex items-center gap-3 border-b border-gray-300/50 shrink-0">
          {/* Traffic Light Buttons */}
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-[#ff5f57] rounded-full shadow-inner" />
            <div className="w-3 h-3 bg-[#febc2e] rounded-full shadow-inner" />
            <div className="w-3 h-3 bg-[#28c840] rounded-full shadow-inner" />
          </div>

          {/* Navigation Arrows */}
          <div className="flex gap-1 mr-2">
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* URL Bar */}
          <div className="flex-1 mx-2">
            <div className="bg-white rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-inner border border-gray-200">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-xs text-gray-600 truncate flex-1">
                {customDomain 
                  ? currentPage.startsWith('pages/') 
                    ? `${customDomain}/pages/${currentPage.replace('pages/', '')}`
                    : customDomain
                  : currentPage.startsWith('pages/')
                    ? `my-quickshop.com/shops/${storeSlug}/pages/${currentPage.replace('pages/', '')}`
                    : `my-quickshop.com/shops/${storeSlug}`
                }
              </span>
              {/* Refresh Button */}
              <button 
                onClick={() => {
                  if (iframeRef.current) {
                    setIsLoading(true);
                    iframeRef.current.src = iframeRef.current.src;
                  }
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer"
                title="רענן"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm text-gray-500">טוען תצוגה מקדימה...</span>
            </div>
          </div>
        )}

        {/* Iframe - Actual Storefront */}
        <iframe
          ref={iframeRef}
          src={previewUrl}
          className="w-full bg-white flex-1"
          style={{ 
            border: 'none',
            minHeight: 0, // Important for flex child to shrink properly
          }}
          onLoad={handleIframeLoad}
          title="תצוגה מקדימה"
        />
      </div>

      {/* Device Frame for Mobile */}
      {previewMode === 'mobile' && (
        <div className="w-[375px] h-2 bg-gray-900 rounded-b-3xl flex justify-center items-center">
          <div className="w-24 h-1 bg-gray-700 rounded-full" />
        </div>
      )}
    </div>
  );
}
