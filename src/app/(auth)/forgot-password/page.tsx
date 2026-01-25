'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/actions/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('אנא הזן כתובת אימייל');
      return;
    }

    startTransition(async () => {
      const result = await forgotPassword(email);
      if (result.success) {
        setSent(true);
      } else {
        setErrorMsg(result.error || 'שגיאה בשליחת המייל');
      }
    });
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-logo text-gray-900">Quick Shop</h1>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">בדוק את המייל שלך</h2>
            <p className="text-gray-600 mb-6">
              אם קיים חשבון עם האימייל {email}, שלחנו קישור לאיפוס הסיסמה.
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors text-center"
            >
              חזור להתחברות
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-logo text-gray-900">Quick Shop</h1>
          </Link>
          <p className="mt-2 text-gray-600">איפוס סיסמה</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <p className="text-gray-600 text-sm mb-6">
            הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה.
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                אימייל
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'שולח...' : 'שלח קישור לאיפוס'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-gray-600">
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            ← חזור להתחברות
          </Link>
        </p>
      </div>
    </div>
  );
}






