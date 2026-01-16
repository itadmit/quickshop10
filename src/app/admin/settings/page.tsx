/**
 * Platform Settings Admin Page
 * הגדרות כלליות של הפלטפורמה
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Settings, Info, Globe, Mail, Shield } from 'lucide-react';
import Link from 'next/link';

export default async function PlatformSettingsPage() {
  const session = await auth();
  
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    redirect('/login');
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3 mb-1">
            <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
            הגדרות פלטפורמה
          </h1>
          <p className="text-sm sm:text-base text-gray-500">הגדרות כלליות של המערכת</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link 
            href="/admin/pricing"
            className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 hover:border-emerald-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors flex-shrink-0">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 group-hover:text-white transition-colors" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 mb-1">מחירים ותעריפים</h3>
                <p className="text-sm text-gray-500">ניהול מחירי מנויים, עמלות, חריגים ומשלמים</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/admin/plugins"
            className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 hover:border-purple-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-500 transition-colors flex-shrink-0">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 mb-1">מחירי תוספים</h3>
                <p className="text-sm text-gray-500">הגדרת מחירים וימי נסיון לכל תוסף</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Platform Info */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <Info className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">מידע על הפלטפורמה</h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-600 mb-1 block">שם הפלטפורמה</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium">QuickShop</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-600 mb-1 block">גרסה</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium">1.0.0</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-600 mb-1 block">סביבה</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium">
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs sm:text-sm">
                    {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-600 mb-1 block">מנהל ראשי</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium truncate">{session.user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Features */}
        <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            הגדרות נוספות (בקרוב)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white/60 rounded-xl p-3 sm:p-4 border border-gray-200/50">
              <Globe className="w-5 h-5 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">הגדרות דומיין</p>
              <p className="text-xs text-gray-500">ניהול דומיינים ו-SSL</p>
            </div>
            <div className="bg-white/60 rounded-xl p-3 sm:p-4 border border-gray-200/50">
              <Mail className="w-5 h-5 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">הגדרות אימייל</p>
              <p className="text-xs text-gray-500">תבניות והתראות</p>
            </div>
            <div className="bg-white/60 rounded-xl p-3 sm:p-4 border border-gray-200/50">
              <Shield className="w-5 h-5 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">אבטחה</p>
              <p className="text-xs text-gray-500">הגדרות אבטחה ו-2FA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
