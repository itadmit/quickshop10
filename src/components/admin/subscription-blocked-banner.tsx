'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, CreditCard, ArrowLeft } from 'lucide-react';

interface SubscriptionBlockedBannerProps {
  storeSlug: string;
  reason: string;
  isPlatformAdmin?: boolean;
}

export function SubscriptionBlockedBanner({ 
  storeSlug, 
  reason,
  isPlatformAdmin = false,
}: SubscriptionBlockedBannerProps) {
  const pathname = usePathname();
  
  // 📍 Allow access to subscription settings page (so user can pay!)
  const isSubscriptionPage = pathname?.includes('/settings/subscription');
  
  // Platform admins see a warning but are not blocked
  if (isPlatformAdmin) {
    return (
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900">חנות חסומה (מצב אדמין)</h3>
          <p className="text-amber-700 text-sm mt-1">
            החנות חסומה בגלל: <strong>{reason}</strong>. 
            אתה רואה את החנות כי אתה אדמין פלטפורמה.
          </p>
        </div>
      </div>
    );
  }
  
  // 📍 On subscription page, show banner but allow access
  if (isSubscriptionPage) {
    return (
      <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">הגישה לחנות חסומה</h3>
          <p className="text-red-700 text-sm mt-1">
            {reason}. בחר מסלול והשלם את התשלום כדי להמשיך להשתמש בחנות.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 px-6 py-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">הגישה לחנות חסומה</h2>
          <p className="text-red-100">{reason}</p>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-gray-600">
              כדי להמשיך להשתמש בחנות שלך, אנא בחר מסלול והשלם את התשלום.
            </p>
          </div>
          
          {/* Actions */}
          <div className="space-y-3">
            <Link
              href={`/shops/${storeSlug}/admin/settings/subscription`}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              בחר מסלול והמשך
            </Link>
            
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 w-full px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              חזרה לרשימת החנויות
            </Link>
          </div>
          
          {/* Help */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              יש לך שאלות? 
              <a href="mailto:support@quickshop.co.il" className="text-emerald-600 hover:underline mr-1">
                צור קשר עם התמיכה
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

