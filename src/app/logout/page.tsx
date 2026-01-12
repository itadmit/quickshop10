'use client';

import { signOut } from 'next-auth/react';

export default function LogoutPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">התנתקות</h1>
          <p className="text-gray-600 mb-6">האם אתה בטוח שברצונך להתנתק?</p>
          
          <div className="space-y-3">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full py-3 px-4 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              כן, התנתק
            </button>
            
            <button
              onClick={() => window.history.back()}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



