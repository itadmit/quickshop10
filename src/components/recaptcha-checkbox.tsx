'use client';

import Script from 'next/script';
import { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      render: (container: HTMLElement, options: {
        sitekey: string;
        size?: 'normal' | 'compact';
        theme?: 'light' | 'dark';
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
      }) => number;
      reset: (widgetId: number) => void;
    };
  }
}

interface RecaptchaCheckboxProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  size?: 'normal' | 'compact';
  theme?: 'light' | 'dark';
}

export function RecaptchaCheckbox({
  onVerify,
  onExpire,
  onError,
  size = 'normal',
  theme = 'light',
}: RecaptchaCheckboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !siteKey || widgetIdRef.current !== null || isRendered) {
      return;
    }

    // Check if container already has content
    if (containerRef.current.children.length > 0) {
      return;
    }

    // Ensure grecaptcha is available
    if (typeof window === 'undefined' || !window.grecaptcha || !window.grecaptcha.render) {
      return;
    }

    try {
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        size,
        theme,
        callback: onVerify,
        'expired-callback': onExpire,
        'error-callback': onError,
      });
      setIsRendered(true);
    } catch (error) {
      console.error('Failed to render reCAPTCHA:', error);
    }
  }, [siteKey, size, theme, onVerify, onExpire, onError, isRendered]);

  const handleScriptLoad = () => {
    setScriptLoaded(true);
    if (window.grecaptcha) {
      window.grecaptcha.ready(renderWidget);
    }
  };

  // Check on mount if grecaptcha is already available (happens on page refresh when script is cached)
  // Also poll for a short time in case the script is still initializing
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20; // Try for up to 2 seconds
    const intervalMs = 100;

    const tryRender = () => {
      if (typeof window !== 'undefined' && window.grecaptcha && window.grecaptcha.ready) {
        setScriptLoaded(true);
        window.grecaptcha.ready(renderWidget);
        return true;
      }
      return false;
    };

    // Try immediately
    if (tryRender()) {
      return;
    }

    // Poll in case script is loading
    const interval = setInterval(() => {
      attempts++;
      if (tryRender() || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [renderWidget]);

  useEffect(() => {
    // If script is loaded, try to render
    if (scriptLoaded && window.grecaptcha) {
      window.grecaptcha.ready(renderWidget);
    }
  }, [scriptLoaded, renderWidget]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      widgetIdRef.current = null;
    };
  }, []);

  if (!siteKey) {
    return null;
  }

  return (
    <>
      <Script
        src="https://www.google.com/recaptcha/api.js?render=explicit&hl=iw"
        onLoad={handleScriptLoad}
        strategy="afterInteractive"
      />
      <div className="flex justify-center my-4">
        <div ref={containerRef} />
      </div>
    </>
  );
}
