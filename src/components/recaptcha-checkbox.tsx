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
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !siteKey || !window.grecaptcha || widgetIdRef.current !== null) {
      return;
    }

    // Check if container already has content
    if (containerRef.current.children.length > 0) {
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
    } catch (error) {
      console.error('Failed to render reCAPTCHA:', error);
    }
  }, [siteKey, size, theme, onVerify, onExpire, onError]);

  const handleScriptLoad = () => {
    setScriptLoaded(true);
    if (window.grecaptcha) {
      window.grecaptcha.ready(renderWidget);
    }
  };

  useEffect(() => {
    // If script is already loaded, render immediately
    if (scriptLoaded && window.grecaptcha) {
      window.grecaptcha.ready(renderWidget);
    }
  }, [scriptLoaded, renderWidget]);

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
