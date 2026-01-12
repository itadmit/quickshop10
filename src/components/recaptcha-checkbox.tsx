'use client';

import { useEffect, useRef } from 'react';
import { useRecaptcha } from './recaptcha-provider';

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
  const { isReady, recaptchaRef } = useRecaptcha();
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!isReady || !containerRef.current || !siteKey || !window.grecaptcha) {
      return;
    }

    // Render reCAPTCHA widget
    try {
      const widgetId = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        size,
        theme,
        callback: (token: string) => {
          onVerify(token);
        },
        'expired-callback': () => {
          onExpire?.();
        },
        'error-callback': () => {
          onError?.();
        },
      });

      // Store widget ID in ref for later use
      recaptchaRef.current = widgetId;
    } catch (error) {
      console.error('Failed to render reCAPTCHA:', error);
    }
  }, [isReady, siteKey, size, theme, onVerify, onExpire, onError, recaptchaRef]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className="flex justify-center my-4">
      <div ref={containerRef} />
    </div>
  );
}

