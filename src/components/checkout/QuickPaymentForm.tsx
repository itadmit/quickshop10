'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { useCheckoutTranslations } from '@/lib/translations/use-translations';
import type { DeepPartial } from '@/lib/translations/types';
import type { CheckoutTranslations } from '@/lib/translations/types';

export interface QuickPaymentFormProps {
  publicKey: string;
  testMode: boolean;
  storeSlug: string;
  disabled?: boolean;
  translations?: DeepPartial<CheckoutTranslations> | null;
}

export interface QuickPaymentFormRef {
  tokenize: (data: {
    amount: number;
    currency?: string;
    orderId: string;
    productName?: string;
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string;
  }) => Promise<{ token: string; cardMask?: string; cardType?: string }>;
  isReady: () => boolean;
}

// Skeleton for the payment form (prevents CLS)
export function PaymentFormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" style={{ minHeight: '280px' }}>
      <div className="h-12 bg-gray-200 rounded" /> {/* Card number */}
      <div className="flex gap-4">
        <div className="h-12 bg-gray-200 rounded flex-1" /> {/* Expiry */}
        <div className="h-12 bg-gray-200 rounded w-24" /> {/* CVV */}
      </div>
      <div className="h-12 bg-gray-200 rounded" /> {/* Social ID */}
    </div>
  );
}

// PayMe SDK types (based on official documentation)
interface PayMeHostedFields {
  create: (fieldType: string, options?: Record<string, unknown>) => {
    mount: (selector: string) => Promise<void>;
    on: (event: string, callback: (data: unknown) => void) => void;
  };
}

interface TokenizeData {
  payerFirstName?: string;
  payerLastName?: string;
  payerEmail?: string;
  payerPhone?: string;
  payerSocialId?: string;
  total: {
    label: string;
    amount: {
      currency: string;
      value: string;
    };
  };
}

interface TokenizeResult {
  token: string;
  card?: {
    cardMask: string;
    expiry: string;
  };
  type: string;
  testMode: boolean;
}

interface PayMeInstance {
  hostedFields: () => PayMeHostedFields;
  tokenize: (data: TokenizeData) => Promise<TokenizeResult>;
}

interface PayMeSDK {
  create: (publicKey: string, options: { testMode: boolean; language?: string }) => Promise<PayMeInstance>;
  fields: {
    NUMBER: string;
    EXPIRATION: string;
    CVC: string;
  };
}

declare global {
  interface Window {
    PayMe?: PayMeSDK;
  }
}

export const QuickPaymentForm = forwardRef<QuickPaymentFormRef, QuickPaymentFormProps>(
  function QuickPaymentForm({ publicKey, testMode, disabled = false, translations }, ref) {
    const t = useCheckoutTranslations(translations);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const [fieldsReady, setFieldsReady] = useState(false);
    const [socialId, setSocialId] = useState(''); // Social ID for Israeli cards
    
    const instanceRef = useRef<PayMeInstance | null>(null);
    const cardNumberRef = useRef<HTMLDivElement>(null);
    const cardExpiryRef = useRef<HTMLDivElement>(null);
    const cardCvcRef = useRef<HTMLDivElement>(null);
    const mountedRef = useRef(false);

    // Load PayMe SDK dynamically (official CDN)
    useEffect(() => {
      if (typeof window === 'undefined') return;
      
      // Check if already loaded
      if (window.PayMe) {
        setSdkLoaded(true);
        return;
      }

      const script = document.createElement('script');
      // Official PayMe CDN for Hosted Fields
      script.src = 'https://cdn.payme.io/hf/v1/hostedfields.js';
      script.async = true;
      script.onload = () => setSdkLoaded(true);
      script.onerror = () => {
        setError('שגיאה בטעינת מערכת התשלום');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    }, []);

    // Initialize hosted fields after SDK loads
    useEffect(() => {
      if (!sdkLoaded || !window.PayMe || mountedRef.current) return;
      if (!cardNumberRef.current || !cardExpiryRef.current || !cardCvcRef.current) return;

      const initPayMe = async () => {
        try {
          // Create PayMe instance (returns Promise per documentation)
          const instance = await window.PayMe!.create(publicKey, { 
            testMode,
            language: 'he' // Hebrew for RTL
          });
          
          instanceRef.current = instance;

          // Get Hosted Fields manager
          const fields = instance.hostedFields();
          
          // Create protected fields (per documentation)
          const cardNumber = fields.create('cardNumber', {
            placeholder: '1234 5678 9012 3456',
            styles: {
              base: {
                fontSize: '16px',
                color: '#1f2937',
                fontFamily: 'inherit',
                textAlign: 'right',
                direction: 'ltr',
              },
            },
          });
          
          const expiration = fields.create('cardExpiration', {
            placeholder: 'MM/YY',
            styles: {
              base: {
                fontSize: '16px',
                color: '#1f2937',
                fontFamily: 'inherit',
                textAlign: 'center',
              },
            },
          });
          
          const cvc = fields.create('cvc', {
            placeholder: 'CVV',
            styles: {
              base: {
                fontSize: '16px',
                color: '#1f2937',
                fontFamily: 'inherit',
                textAlign: 'center',
              },
            },
          });

          // Mount fields to containers (only card fields are hosted)
          await Promise.all([
            cardNumber.mount('#quick-card-number'),
            expiration.mount('#quick-card-expiry'),
            cvc.mount('#quick-card-cvc'),
          ]);
          
          mountedRef.current = true;
          setFieldsReady(true);
          setIsLoading(false);
        } catch (err) {
          console.error('PayMe init error:', err);
          setError('שגיאה באתחול מערכת התשלום');
          setIsLoading(false);
        }
      };

      initPayMe();
    }, [sdkLoaded, publicKey, testMode]);

    // Expose tokenize function via ref
    useImperativeHandle(ref, () => ({
      tokenize: async (data) => {
        // In TEST MODE: Skip real tokenization and return a mock token
        // This allows testing the full checkout flow without real card details
        if (testMode) {
          console.log('=== TEST MODE: Returning mock token ===');
          console.log('Data:', JSON.stringify(data, null, 2));
          
          // Generate a mock token for test mode
          const mockToken = `test_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          
          return {
            token: mockToken,
            cardMask: '****-****-****-4242',
            cardType: 'visa',
          };
        }
        
        // PRODUCTION MODE: Real tokenization
        if (!instanceRef.current) {
          throw new Error('מערכת התשלום לא מוכנה');
        }

        // Validate social ID - required in production mode
        if (!socialId || socialId.length < 5) {
          throw new Error('נא להזין תעודת זהות תקינה');
        }

        // Parse customer name into first/last (per PayMe documentation)
        const nameParts = (data.customerName || '').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Per documentation: tokenize with sale data
        console.log('=== QuickPayment tokenize start ===');
        console.log('Data:', JSON.stringify(data, null, 2));
        console.log('SocialId:', socialId);
        console.log('Instance ready:', !!instanceRef.current);
        
        const tokenizePayload = {
          payerFirstName: firstName,
          payerLastName: lastName,
          payerEmail: data.customerEmail,
          payerPhone: data.customerPhone,
          payerSocialId: socialId,
          total: {
            label: data.productName || `הזמנה ${data.orderId}`,
            amount: {
              currency: data.currency || 'ILS',
              value: data.amount.toFixed(2),
            },
          },
        };
        
        console.log('Tokenize payload:', JSON.stringify(tokenizePayload, null, 2));
        
        let result;
        try {
          console.log('Calling instance.tokenize()...');
          result = await instanceRef.current.tokenize(tokenizePayload);
          console.log('Tokenize returned!');
        } catch (tokenizeError: unknown) {
          console.error('=== QuickPayment tokenize CATCH ===');
          console.error('Error object:', tokenizeError);
          if (tokenizeError && typeof tokenizeError === 'object') {
            console.error('Error keys:', Object.keys(tokenizeError));
            console.error('Error JSON:', JSON.stringify(tokenizeError, null, 2));
          }
          // Re-throw with better message
          const errMsg = tokenizeError instanceof Error 
            ? tokenizeError.message 
            : (tokenizeError as Record<string, unknown>)?.message || 'שגיאה לא ידועה';
          throw new Error(`שגיאה בטוקניזציה: ${errMsg}`);
        }

        console.log('=== QuickPayment tokenize result ===');
        console.log('Result type:', result?.type);
        console.log('Has token:', !!result?.token);
        console.log('Full result:', JSON.stringify(result, null, 2));

        if (!result || result.type !== 'tokenize-success') {
          console.error('Tokenize failed - unexpected type:', result?.type);
          throw new Error(`שגיאה בטוקניזציה: ${result?.type || 'no result'}`);
        }

        return {
          token: result.token,
          cardMask: result.card?.cardMask,
          cardType: undefined, // Not provided in response
        };
      },
      isReady: () => testMode || (fieldsReady && !!instanceRef.current),
    }), [fieldsReady, socialId, testMode]);

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 p-4 text-sm text-red-600 rounded-lg">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>{error}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4" style={{ minHeight: '200px' }}>
        {/* Card Number */}
        <div>
          <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
            {t.payment.cardNumber}
          </label>
          <div
            id="quick-card-number"
            ref={cardNumberRef}
            className={`w-full h-12 border border-gray-200 rounded focus-within:border-black transition-colors bg-white ${isLoading ? 'animate-pulse bg-gray-100' : ''}`}
            style={{ minHeight: '48px' }}
          />
        </div>

        {/* Expiry + CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
              {t.payment.expiration}
            </label>
            <div
              id="quick-card-expiry"
              ref={cardExpiryRef}
              className={`w-full h-12 border border-gray-200 rounded focus-within:border-black transition-colors bg-white ${isLoading ? 'animate-pulse bg-gray-100' : ''}`}
              style={{ minHeight: '48px' }}
            />
          </div>
          <div>
            <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
              {t.payment.cvv}
            </label>
            <div
              id="quick-card-cvc"
              ref={cardCvcRef}
              className={`w-full h-12 border border-gray-200 rounded focus-within:border-black transition-colors bg-white ${isLoading ? 'animate-pulse bg-gray-100' : ''}`}
              style={{ minHeight: '48px' }}
            />
          </div>
        </div>

        {/* Social ID - regular input (required for Israeli cards) */}
        <div>
          <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
            {t.payment.idNumber}
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={9}
            value={socialId}
            onChange={(e) => setSocialId(e.target.value.replace(/\D/g, ''))}
            placeholder="123456789"
            disabled={disabled || isLoading}
            className="w-full h-12 px-4 border border-gray-200 rounded focus:border-black focus:outline-none transition-colors bg-white text-center"
            style={{ minHeight: '48px' }}
          />
        </div>

        {/* Test mode indicator */}
        {testMode && (
          <div className="bg-yellow-50 border border-yellow-100 p-3 text-sm text-yellow-700 flex items-center gap-2 rounded-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>{t.payment.simulationMode}</span>
          </div>
        )}

        {/* Payment methods icons */}
        <div className="flex items-center justify-center gap-4 py-2">
          <div className="text-[10px] tracking-wider text-gray-400 uppercase">{t.payment.paymentMethod}</div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">Visa</span>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">Mastercard</span>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">Amex</span>
          </div>
        </div>

        {/* Security note */}
        <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          {t.payment.securePaymentNote}
        </p>
      </div>
    );
  }
);

export default QuickPaymentForm;
