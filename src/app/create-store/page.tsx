import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CreateStoreForm } from './create-store-form';

export default async function CreateStorePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-logo text-gray-900">Quick Shop</h1>
          <p className="mt-2 text-gray-600">צור את החנות שלך</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 text-center">שלום, {session.user.name || 'משתמש'}!</h2>
            <p className="text-gray-600 text-center mt-1">
              בחר שם לחנות שלך והמערכת תיצור אותה עם מוצרים לדוגמא
            </p>
          </div>

          <CreateStoreForm userId={session.user.id} userEmail={session.user.email || ''} />
        </div>
      </div>
    </div>
  );
}

