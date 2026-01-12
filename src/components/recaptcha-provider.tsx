'use client';

import Script from 'next/script';
import { createContext, useContext, useState, useCallback, useRef } from 'react';

interface RecaptchaContextType {
  executeRecaptcha: (action: string) => Promise<string>;
  isReady: boolean;
  recaptchaRef: React.MutableRefObject<any>;
  resetRecaptcha: () => void;
}

const RecaptchaContext = createContext<RecaptchaContextType>({
  executeRecaptcha: async () => '',
  isReady: false,
  recaptchaRef: { current: null },
  resetRecaptcha: () => {},
});

export function useRecaptcha() {
  return useContext(RecaptchaContext);
}

interface RecaptchaProviderProps {
  children: React.ReactNode;
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (widgetId: number) => Promise<string>;
      render: (container: string | HTMLElement, options: {
        sitekey: string;
        size?: 'normal' | 'compact' | 'invisible';
        theme?: 'light' | 'dark';
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
      }) => number;
      reset: (widgetId: number) => void;
    };
  }
}

export function RecaptchaProvider({ children }: RecaptchaProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const recaptchaRef = useRef<any>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  const executeRecaptcha = useCallback(
    async (action: string): Promise<string> => {
      if (!siteKey) {
        console.warn('reCAPTCHA site key not configured');
        return '';
      }

      if (!isReady) {
        console.warn('reCAPTCHA not ready yet');
        return '';
      }

      return new Promise((resolve) => {
        try {
          // For v2, we need to execute the widget
          if (recaptchaRef.current !== null && window.grecaptcha) {
            window.grecaptcha.execute(recaptchaRef.current);
            // The token will be provided via callback
            resolve('pending'); // Placeholder - actual token comes from callback
          } else {
            resolve('');
          }
        } catch (error) {
          console.error('reCAPTCHA execution failed:', error);
          resolve('');
        }
      });
    },
    [siteKey, isReady]
  );

  const resetRecaptcha = useCallback(() => {
    if (recaptchaRef.current !== null && window.grecaptcha) {
      window.grecaptcha.reset(recaptchaRef.current);
    }
  }, []);

  const handleLoad = () => {
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => {
        setIsReady(true);
      });
    }
  };

  if (!siteKey) {
    return <>{children}</>;
  }

  return (
    <>
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=explicit`}
        onLoad={handleLoad}
        strategy="afterInteractive"
      />
      <RecaptchaContext.Provider value={{ executeRecaptcha, isReady, recaptchaRef, resetRecaptcha }}>
        {children}
      </RecaptchaContext.Provider>
    </>
  );
}

