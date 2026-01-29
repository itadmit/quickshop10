import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentInfluencer } from '@/lib/influencer-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { InfluencerLoginForm } from './login-form';

export const metadata = {
  title: 'התחברות משפיענים',
  description: 'התחברות לדשבורד משפיענים',
};

interface LoginPageProps {
  params: Promise<{ slug: string }>;
}

export default async function InfluencerLoginPage({ params }: LoginPageProps) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }
  
  const basePath = `/shops/${slug}`;
  
  // If already logged in, redirect to dashboard
  const influencer = await getCurrentInfluencer();
  if (influencer && influencer.storeId === store.id) {
    redirect(`${basePath}/influencer`);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center">
            <span className="text-2xl font-logo text-gray-900">Quick Shop</span>
          </Link>
          <Link href={basePath || '/'} className="block mt-1">
            <span className="text-base text-gray-500">{store.name}</span>
          </Link>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">דשבורד משפיענים</h1>
            <p className="text-gray-500 text-sm">מעקב ביצועים בזמן אמת</p>
          </div>
          
          <InfluencerLoginForm 
            storeId={store.id} 
            basePath={basePath} 
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link 
            href={basePath || '/'}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            → חזרה לחנות
          </Link>
        </div>
      </div>
    </div>
  );
}

