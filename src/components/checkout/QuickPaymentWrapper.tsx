/**
 * Quick Payment Wrapper
 * Wrapper component that handles loading QuickPayments config and rendering the form
 * Uses dynamic import for code splitting (performance)
 */

'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { PaymentFormSkeleton } from './PaymentFormSkeleton';
import { AlertCircle } from 'lucide-react';

// Dynamic import for code splitting - don't load until needed
const QuickPaymentForm = dynamic(
  () => import('./QuickPaymentForm').then(mod => ({ default: mod.QuickPaymentForm })),
  { 
    loading: () => <PaymentFormSkeleton />,
    ssr: false // Client-only component
  }
);

interface QuickPaymentConfig {
  publicKey: string;
  testMode: boolean;
  maxInstallments?: number;
}

interface QuickPaymentWrapperProps {
  storeSlug: string;
  disabled?: boolean;
}

export function QuickPaymentWrapper({
  storeSlug,
  disabled,
}: QuickPaymentWrapperProps) {
  const [config, setConfig] = useState<QuickPaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch QuickPayments configuration
  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch(`/api/shops/${storeSlug}/payments/quick/config`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('קוויק פיימנטס לא מוגדר לחנות זו');
          } else {
            setError('שגיאה בטעינת הגדרות התשלום');
          }
          return;
        }
        
        const data = await response.json();
        
        if (!data.publicKey) {
          setError('חסרות הגדרות לספק התשלום');
          return;
        }
        
        setConfig({
          publicKey: data.publicKey,
          testMode: data.testMode ?? true,
          maxInstallments: data.maxInstallments ?? 12,
        });
      } catch (err) {
        console.error('Failed to load QuickPayments config:', err);
        setError('שגיאה בטעינת מערכת התשלום');
      } finally {
        setLoading(false);
      }
    }
    
    fetchConfig();
  }, [storeSlug]);
  
  // Loading state
  if (loading) {
    return <PaymentFormSkeleton />;
  }
  
  // Error state
  if (error || !config) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">לא ניתן לטעון טופס תשלום</h3>
        <p className="text-red-600 text-sm">{error || 'נסה שוב מאוחר יותר'}</p>
      </div>
    );
  }
  
  return (
    <QuickPaymentForm
      storeSlug={storeSlug}
      publicKey={config.publicKey}
      testMode={config.testMode}
      disabled={disabled}
    />
  );
}

export default QuickPaymentWrapper;

