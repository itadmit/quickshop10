import { headers } from 'next/headers';
import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { CustomerSecurityForm } from '@/components/customer-security-form';

export const metadata = {
  title: 'אבטחה',
  description: 'הגדרות אבטחה',
};

interface SecurityPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CustomerSecurityPage({ params }: SecurityPageProps) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }
  
  const headersList = await headers();
  const basePath = headersList.get('x-custom-domain') ? '' : `/shops/${slug}`;
  
  // Check if logged in
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect(`${basePath}/login?callbackUrl=${encodeURIComponent(`${basePath}/account/security`)}`);
  }

  const hasPassword = !!customer.passwordHash;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            href={`${basePath}/account`}
            className="text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            חזרה לאיזור האישי
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-light tracking-wide mb-2">
            אבטחה
          </h1>
          <p className="text-gray-500 text-sm">
            {hasPassword ? 'שינוי סיסמה' : 'הגדרת סיסמה לחשבון'}
          </p>
        </div>

        {/* Info Box */}
        {!hasPassword && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-amber-800 text-sm">אין לך עדיין סיסמה</h3>
              <p className="text-xs text-amber-700 mt-1">
                כרגע אתה מתחבר רק עם קוד חד-פעמי במייל. הגדר סיסמה להתחברות מהירה יותר.
              </p>
            </div>
          </div>
        )}

        {/* Form - Client Component */}
        <CustomerSecurityForm 
          hasPassword={hasPassword}
          basePath={basePath}
        />
      </div>
    </div>
  );
}


