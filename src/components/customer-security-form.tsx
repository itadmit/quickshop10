'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CustomerSecurityFormProps {
  hasPassword: boolean;
  basePath: string;
}

export function CustomerSecurityForm({ hasPassword, basePath }: CustomerSecurityFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (formData.newPassword.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/customer/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: hasPassword ? formData.currentPassword : undefined,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'שגיאה בעדכון הסיסמה');
        return;
      }

      setSuccess(true);
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      router.refresh();
    } catch {
      setError('שגיאה בעדכון הסיסמה');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password - Only if has password */}
        {hasPassword && (
          <div>
            <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
              סיסמה נוכחית
            </label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 focus:border-black transition-colors"
              required={hasPassword}
            />
          </div>
        )}

        {/* New Password */}
        <div>
          <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
            {hasPassword ? 'סיסמה חדשה' : 'סיסמה'}
          </label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="w-full px-4 py-3.5 border border-gray-200 focus:border-black transition-colors"
            placeholder="לפחות 6 תווים"
            required
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
            אימות סיסמה
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-3.5 border border-gray-200 focus:border-black transition-colors"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {hasPassword ? 'הסיסמה שונתה בהצלחה ✓' : 'הסיסמה הוגדרה בהצלחה ✓'}
          </div>
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
              שומר...
            </span>
          ) : hasPassword ? 'שנה סיסמה' : 'הגדר סיסמה'}
        </button>

        {/* Tips */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            טיפים לסיסמה חזקה:
          </p>
          <ul className="text-xs text-gray-400 mt-2 space-y-1">
            <li>• לפחות 6 תווים</li>
            <li>• שילוב של אותיות ומספרים</li>
            <li>• אל תשתמש בסיסמה שכבר משתמש בה באתרים אחרים</li>
          </ul>
        </div>
      </form>
    </div>
  );
}





