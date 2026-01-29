'use client';

/**
 * Google Business Connect Page
 * 
 * This page opens in a popup and redirects to Google OAuth.
 * After OAuth completes, the callback route sends data back to parent window.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// Google Logo Component
function GoogleLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="flex-shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function GoogleBusinessConnectPage() {
  const params = useParams();
  const storeSlug = params.slug as string;
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to OAuth authorize endpoint
    const redirectToOAuth = async () => {
      try {
        setStatus('redirecting');
        
        // Redirect to authorize endpoint
        window.location.href = `/api/google-business/authorize?storeSlug=${encodeURIComponent(storeSlug)}`;
      } catch (err) {
        console.error('OAuth redirect error:', err);
        setStatus('error');
        setError('אירעה שגיאה בהתחלת תהליך ההתחברות');
      }
    };

    redirectToOAuth();
  }, [storeSlug]);

  const handleCancel = () => {
    window.close();
  };

  const handleRetry = () => {
    setStatus('loading');
    setError(null);
    window.location.href = `/api/google-business/authorize?storeSlug=${encodeURIComponent(storeSlug)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center" dir="rtl">
      <div className="max-w-md mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Google Logo */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gray-50 rounded-2xl">
              <GoogleLogo size={48} />
            </div>
          </div>

          {status === 'loading' || status === 'redirecting' ? (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-3">
                מתחבר ל-Google Business
              </h1>
              <p className="text-gray-600 text-sm mb-6">
                מעביר אותך לדף ההתחברות של Google...
              </p>
              
              {/* Loading Spinner */}
              <div className="flex justify-center mb-6">
                <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-700">
                  <strong>💡 מה יקרה?</strong>
                  <br />
                  Google יבקש ממך לאשר גישה לפרופיל העסקי שלך כדי לטעון את הביקורות.
                </p>
              </div>
            </>
          ) : status === 'error' ? (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-3">
                שגיאה בחיבור
              </h1>
              <p className="text-gray-600 text-sm mb-6">
                {error || 'אירעה שגיאה בתהליך ההתחברות'}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  נסה שוב
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  ביטול
                </button>
              </div>
            </>
          ) : null}
        </div>

        {/* Requirements Info */}
        <div className="mt-6 p-4 bg-white/80 rounded-xl">
          <h3 className="text-sm font-medium text-gray-800 mb-2">דרישות מקדימות:</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              יש לך פרופיל עסקי ב-Google Business
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              הפרופיל מאומת ופעיל
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              יש לך הרשאות ניהול לפרופיל
            </li>
          </ul>
        </div>

        {/* Cancel Link */}
        <button
          onClick={handleCancel}
          className="w-full mt-4 py-3 text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          ביטול וסגירה
        </button>
      </div>
    </div>
  );
}
