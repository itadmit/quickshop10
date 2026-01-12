'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AcceptInviteFormProps {
  token: string;
  email: string;
  existingUser: boolean;
  storeSlug: string;
  role: string;
}

export function AcceptInviteForm({ token, email, existingUser, storeSlug, role }: AcceptInviteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate password match for new users
    if (!existingUser && formData.password !== formData.confirmPassword) {
      setError('הסיסמאות לא תואמות');
      setLoading(false);
      return;
    }

    if (!existingUser && formData.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: formData.name,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'שגיאה בקבלת ההזמנה');
      }

      // Redirect based on role
      if (role === 'influencer') {
        router.push(`/shops/${storeSlug}/influencer`);
      } else {
        router.push(`/shops/${storeSlug}/admin`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בקבלת ההזמנה');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {existingUser ? (
        // Existing user - just needs password to confirm
        <div>
          <p className="text-sm text-gray-600 mb-4">
            נמצא חשבון קיים עם האימייל הזה. הזן את הסיסמה שלך כדי לאשר את ההצטרפות.
          </p>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            סיסמה
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            dir="ltr"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900"
          />
        </div>
      ) : (
        // New user - needs name and password
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם מלא
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="ישראל ישראלי"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סיסמה
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              dir="ltr"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900"
            />
            <p className="text-xs text-gray-400 mt-1">לפחות 6 תווים</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              אישור סיסמה
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              dir="ltr"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900"
            />
          </div>
        </>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
      >
        {loading ? 'מעבד...' : 'קבל הזמנה והצטרף'}
      </button>
    </form>
  );
}



