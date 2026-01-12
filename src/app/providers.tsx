'use client';

import { SessionProvider } from 'next-auth/react';
import { RecaptchaProvider } from '@/components/recaptcha-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={0} // Don't poll for session
      refetchOnWindowFocus={false} // Don't refetch on window focus
    >
      <RecaptchaProvider>
        {children}
      </RecaptchaProvider>
    </SessionProvider>
  );
}

