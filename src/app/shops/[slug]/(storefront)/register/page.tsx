import { CustomerRegisterForm } from '@/components/customer-register-form';
import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'הרשמה',
  description: 'יצירת חשבון חדש',
};

interface RegisterPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ callbackUrl?: string; email?: string }>;
}

export default async function CustomerRegisterPage({ params, searchParams }: RegisterPageProps) {
  const { slug } = await params;
  const { callbackUrl, email } = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }
  
  const headersList = await headers();
  const basePath = headersList.get('x-custom-domain') ? '' : `/shops/${slug}`;
  
  // If already logged in, redirect
  const customer = await getCurrentCustomer();
  if (customer) {
    redirect(callbackUrl || `${basePath}/account`);
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href={basePath} className="inline-block mb-6">
            <span className="font-display text-2xl tracking-[0.3em] text-black font-light uppercase">
              {store.name}
            </span>
          </Link>
          <h1 className="text-2xl font-light tracking-wide mb-2">
            יצירת חשבון
          </h1>
          <p className="text-gray-500 text-sm">
            הצטרף למועדון הלקוחות שלנו וקבל הטבות בלעדיות
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-white border border-gray-100 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-sm mb-1">יתרונות חברי מועדון</h3>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• מעקב הזמנות בקלות</li>
                <li>• הנחות והטבות בלעדיות</li>
                <li>• שמירת כתובות למשלוח מהיר</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Register Form */}
        <CustomerRegisterForm 
          basePath={basePath}
          storeId={store.id}
          callbackUrl={callbackUrl}
          initialEmail={email}
        />

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            כבר יש לך חשבון?{' '}
            <Link 
              href={`${basePath}/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
              className="text-black hover:underline font-medium"
            >
              התחברות
            </Link>
          </p>
        </div>

        {/* Continue as Guest */}
        <div className="mt-6 text-center">
          <Link 
            href={`${basePath}/checkout`}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            המשך כאורח ←
          </Link>
        </div>
      </div>
    </div>
  );
}


