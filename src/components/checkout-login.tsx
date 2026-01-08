'use client';

import { useState, useRef, useEffect } from 'react';

interface CustomerData {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  defaultAddress?: {
    address?: string;
    city?: string;
    zipCode?: string;
  } | null;
  hasPassword?: boolean;
}

interface CheckoutLoginProps {
  onLoginSuccess: (customer: CustomerData) => void;
  onClose: () => void;
  initialEmail?: string;
  storeId: string;
}

type LoginStep = 'email' | 'password' | 'otp';

export function CheckoutLogin({ onLoginSuccess, onClose, initialEmail = '', storeId }: CheckoutLoginProps) {
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first OTP input when entering OTP step
  useEffect(() => {
    if (step === 'otp' && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  // Check if email exists and has password
  const checkEmail = async () => {
    if (!email || !email.includes('@')) {
      setError('נא להזין כתובת אימייל תקינה');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/customer/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, storeId }),
      });
      
      const data = await response.json();
      
      if (!data.exists) {
        setError('לא נמצא חשבון עם כתובת מייל זו');
        return;
      }

      setHasPassword(data.hasAccount);
      
      if (data.hasAccount) {
        setStep('password');
      } else {
        // User exists but no password - send OTP
        await sendOtp();
      }
    } catch {
      setError('שגיאה בבדיקת המייל');
    } finally {
      setIsLoading(false);
    }
  };

  // Send OTP code
  const sendOtp = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/customer/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, storeId }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'שגיאה בשליחת קוד אימות');
        return;
      }

      setStep('otp');
      setOtp(['', '', '', '', '', '']);
    } catch {
      setError('שגיאה בשליחת קוד אימות');
    } finally {
      setIsLoading(false);
    }
  };

  // Login with password
  const loginWithPassword = async () => {
    if (!password) {
      setError('נא להזין סיסמה');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/customer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, storeId }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        if (data.needsOtp) {
          // Password doesn't exist, need OTP
          setHasPassword(false);
          await sendOtp();
          return;
        }
        setError(data.error || 'שגיאה בהתחברות');
        return;
      }

      onLoginSuccess(data.customer);
    } catch {
      setError('שגיאה בהתחברות');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('נא להזין את כל ספרות הקוד');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/customer/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode, storeId }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'קוד אימות שגוי');
        return;
      }

      onLoginSuccess(data.customer);
    } catch {
      setError('שגיאה באימות הקוד');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Pasted text - distribute across inputs
      const chars = value.replace(/\D/g, '').split('').slice(0, 6);
      const newOtp = [...otp];
      chars.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      
      // Focus next empty input or last input
      const nextIndex = Math.min(index + chars.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return; // Only digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP keydown (backspace)
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      verifyOtp();
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 'email') {
      checkEmail();
    } else if (step === 'password') {
      loginWithPassword();
    } else if (step === 'otp') {
      verifyOtp();
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-lg">התחברות לחשבון</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Email Step */}
        {step === 'email' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                אימייל
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 focus:border-black transition-colors"
                placeholder="your@email.com"
                autoFocus
              />
            </div>
            
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary"
            >
              {isLoading ? 'בודק...' : 'המשך'}
            </button>
          </div>
        )}

        {/* Password Step */}
        {step === 'password' && (
          <div className="space-y-4">
            <div className="bg-gray-50 px-4 py-3 rounded text-sm">
              <span className="text-gray-500">התחברות עבור: </span>
              <span className="font-medium">{email}</span>
              <button
                type="button"
                onClick={() => { setStep('email'); setError(null); }}
                className="mr-2 text-blue-600 hover:underline text-xs"
              >
                שנה
              </button>
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                סיסמה
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 focus:border-black transition-colors"
                placeholder="הזן סיסמה"
                autoFocus
              />
            </div>

            <button
              type="button"
              onClick={sendOtp}
              className="text-sm text-gray-500 hover:text-black transition-colors"
            >
              שכחת סיסמה? קבל קוד חד-פעמי במייל
            </button>
            
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep('email'); setError(null); }}
                className="flex-1 btn-secondary"
              >
                חזרה
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn-primary"
              >
                {isLoading ? 'מתחבר...' : 'התחבר'}
              </button>
            </div>
          </div>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <div className="space-y-4">
            <div className="bg-gray-50 px-4 py-3 rounded text-sm">
              <p className="text-gray-600 mb-1">
                שלחנו קוד אימות לכתובת:
              </p>
              <span className="font-medium">{email}</span>
              <button
                type="button"
                onClick={() => { setStep('email'); setError(null); }}
                className="mr-2 text-blue-600 hover:underline text-xs"
              >
                שנה
              </button>
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2 text-center">
                קוד אימות (6 ספרות)
              </label>
              <div className="flex gap-2 justify-center" dir="ltr">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-mono border border-gray-200 focus:border-black transition-colors rounded"
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={sendOtp}
              disabled={isLoading}
              className="w-full text-sm text-gray-500 hover:text-black transition-colors"
            >
              לא קיבלת? שלח שוב
            </button>

            {!hasPassword && (
              <p className="text-xs text-gray-500 text-center">
                לאחר ההתחברות תוכל להגדיר סיסמה באיזור האישי
              </p>
            )}
            
            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { 
                  setStep(hasPassword ? 'password' : 'email'); 
                  setError(null); 
                }}
                className="flex-1 btn-secondary"
              >
                חזרה
              </button>
              <button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="flex-1 btn-primary"
              >
                {isLoading ? 'מאמת...' : 'אמת קוד'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}


