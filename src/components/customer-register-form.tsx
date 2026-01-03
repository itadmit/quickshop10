'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { tracker } from '@/lib/tracking';

interface CustomerRegisterFormProps {
  basePath: string;
  storeId: string;
  callbackUrl?: string;
  initialEmail?: string;
}

export function CustomerRegisterForm({ basePath, storeId, callbackUrl, initialEmail = '' }: CustomerRegisterFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: initialEmail,
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptMarketing: false,
  });

  const redirectUrl = callbackUrl || `${basePath}/account`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.email || !formData.email.includes('@')) {
      setError('נא להזין כתובת אימייל תקינה');
      return;
    }
    if (!formData.firstName.trim()) {
      setError('נא להזין שם פרטי');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/customer/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          password: formData.password || undefined,
          acceptMarketing: formData.acceptMarketing,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'שגיאה בהרשמה');
        return;
      }

      // Track successful registration
      tracker.completeRegistration('email');
      
      // Set user data for enhanced matching
      tracker.setUser({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
      });

      // Success - redirect with refresh
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setError('שגיאה בהרשמה. נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
            אימייל *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3.5 border border-gray-200 focus:border-black transition-colors text-base"
            placeholder="your@email.com"
            dir="ltr"
            required
          />
        </div>

        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
              שם פרטי *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 focus:border-black transition-colors text-base"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
              שם משפחה
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 focus:border-black transition-colors text-base"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
            טלפון
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3.5 border border-gray-200 focus:border-black transition-colors text-base"
            placeholder="05X-XXXXXXX"
            dir="ltr"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
            סיסמה (אופציונלי)
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3.5 border border-gray-200 focus:border-black transition-colors text-base"
            placeholder="לפחות 6 תווים"
          />
          <p className="text-xs text-gray-400 mt-1">
            ניתן גם להתחבר עם קוד חד-פעמי במייל
          </p>
        </div>

        {/* Confirm Password */}
        {formData.password && (
          <div>
            <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
              אימות סיסמה
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 focus:border-black transition-colors text-base"
            />
          </div>
        )}

        {/* Marketing Consent */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="acceptMarketing"
            checked={formData.acceptMarketing}
            onChange={handleChange}
            className="mt-1 w-4 h-4 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-600">
            אשמח לקבל עדכונים ומבצעים במייל
            <span className="text-gray-400 block text-xs">ניתן לבטל בכל עת</span>
          </span>
        </label>

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
              יוצר חשבון...
            </span>
          ) : 'צור חשבון'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          בלחיצה על "צור חשבון" אתה מסכים ל
          <a href="#" className="underline hover:text-gray-600">תנאי השימוש</a>
          {' '}ול
          <a href="#" className="underline hover:text-gray-600">מדיניות הפרטיות</a>
        </p>
      </form>
    </div>
  );
}

