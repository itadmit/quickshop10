'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CustomerLoginFormProps {
  basePath: string;
  callbackUrl?: string;
  storeName: string;
  storeId: string;
}

type LoginStep = 'email' | 'password' | 'otp';

export function CustomerLoginForm({ basePath, callbackUrl, storeName, storeId }: CustomerLoginFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
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

  const redirectUrl = callbackUrl || `${basePath}/account`;

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
        // User doesn't exist - redirect to register
        router.push(`${basePath}/register?email=${encodeURIComponent(email)}${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`);
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
          setHasPassword(false);
          await sendOtp();
          return;
        }
        setError(data.error || 'שגיאה בהתחברות');
        return;
      }

      // Success - redirect with router.refresh to update server data
      router.push(redirectUrl);
      router.refresh();
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

      // Success - redirect with router.refresh
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setError('שגיאה באימות הקוד');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const chars = value.replace(/\D/g, '').split('').slice(0, 6);
      const newOtp = [...otp];
      chars.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + chars.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      verifyOtp();
    }
  };

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
    <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
      <form onSubmit={handleSubmit}>
        {/* Email Step */}
        {step === 'email' && (
          <div className="space-y-5">
            <div>
              <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
                כתובת אימייל
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-200 focus:border-black transition-colors text-base"
                placeholder="your@email.com"
                autoFocus
                dir="ltr"
              />
            </div>
            
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-4"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  בודק...
                </span>
              ) : 'המשך'}
            </button>
          </div>
        )}

        {/* Password Step */}
        {step === 'password' && (
          <div className="space-y-5">
            <div className="bg-gray-50 px-4 py-3 rounded-lg text-sm">
              <span className="text-gray-500">מתחבר בתור: </span>
              <span className="font-medium">{email}</span>
              <button
                type="button"
                onClick={() => { setStep('email'); setError(null); }}
                className="mr-2 text-black hover:underline text-xs"
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
                className="w-full px-4 py-3.5 border border-gray-200 focus:border-black transition-colors text-base"
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
                className="flex-1 btn-secondary py-4"
              >
                חזרה
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn-primary py-4"
              >
                {isLoading ? 'מתחבר...' : 'התחבר'}
              </button>
            </div>
          </div>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <div className="space-y-5">
            <div className="bg-gray-50 px-4 py-3 rounded-lg text-sm text-center">
              <p className="text-gray-600 mb-1">
                שלחנו קוד אימות לכתובת:
              </p>
              <span className="font-medium">{email}</span>
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-3 text-center">
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
                    className="w-12 h-14 text-center text-xl font-mono border border-gray-200 focus:border-black transition-colors rounded-lg"
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
                className="flex-1 btn-secondary py-4"
              >
                חזרה
              </button>
              <button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="flex-1 btn-primary py-4"
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


