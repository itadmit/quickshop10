import { headers } from 'next/headers';
import { CustomerLoginForm } from '@/components/customer-login-form';
import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'התחברות',
  description: 'התחברות לחשבון הלקוח',
};

interface LoginPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function CustomerLoginPage({ params, searchParams }: LoginPageProps) {
  const { slug } = await params;
  const { callbackUrl } = await searchParams;
  
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
            התחברות לחשבון
          </h1>
          <p className="text-gray-500 text-sm">
            הזן את האימייל שלך כדי להתחבר או ליצור חשבון
          </p>
        </div>

        {/* Login Form */}
        <CustomerLoginForm 
          basePath={basePath} 
          callbackUrl={callbackUrl}
          storeName={store.name}
        />

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            אין לך חשבון?{' '}
            <Link 
              href={`${basePath}/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
              className="text-black hover:underline font-medium"
            >
              הרשמה
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


