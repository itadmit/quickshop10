'use client';

import Script from 'next/script';
import { createContext, useContext, useState, useCallback } from 'react';

interface RecaptchaContextType {
  executeRecaptcha: (action: string) => Promise<string>;
  isReady: boolean;
}

const RecaptchaContext = createContext<RecaptchaContextType>({
  executeRecaptcha: async () => '',
  isReady: false,
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
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export function RecaptchaProvider({ children }: RecaptchaProviderProps) {
  const [isReady, setIsReady] = useState(false);
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

      try {
        const token = await window.grecaptcha.execute(siteKey, { action });
        return token;
      } catch (error) {
        console.error('reCAPTCHA execution failed:', error);
        return '';
      }
    },
    [siteKey, isReady]
  );

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
        src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
        onLoad={handleLoad}
        strategy="afterInteractive"
      />
      <RecaptchaContext.Provider value={{ executeRecaptcha, isReady }}>
        {children}
      </RecaptchaContext.Provider>
    </>
  );
}

