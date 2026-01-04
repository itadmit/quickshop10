import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentInfluencer } from '@/lib/influencer-auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import { InfluencerSidebar } from './influencer-sidebar';
import { InfluencerHeader } from './influencer-header';
import { MobileNav } from './mobile-nav';

interface InfluencerLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    return { title: 'חנות לא נמצאה' };
  }

  return {
    title: `דשבורד משפיענים | ${store.name}`,
  };
}

export default async function InfluencerLayout({ 
  children, 
  params 
}: InfluencerLayoutProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  const basePath = `/shops/${slug}`;
  
  // Check if logged in (except for login page)
  const influencer = await getCurrentInfluencer();
  
  // If this is a protected page (not login) and no influencer, redirect
  // The login page will handle its own redirect logic

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" dir="rtl">
      {influencer && influencer.storeId === store.id ? (
        <>
          {/* Desktop Header - hidden on mobile */}
          <div className="hidden lg:block">
            <InfluencerHeader 
              storeName={store.name} 
              storeSlug={slug}
              influencer={{
                name: influencer.name,
                email: influencer.email,
              }}
            />
          </div>
          
          {/* Mobile Navigation */}
          <MobileNav 
            storeSlug={slug}
            storeName={store.name}
            influencerName={influencer.name}
            showCommission={influencer.showCommission}
          />
          
          <div className="flex min-h-[calc(100vh-56px)]">
            {/* Desktop Sidebar - hidden on mobile */}
            <div className="hidden lg:block">
              <InfluencerSidebar 
                storeSlug={slug} 
                currentPath={(await headers()).get('x-pathname') || ''} 
                showCommission={influencer.showCommission}
              />
            </div>
            
            {/* Main Content */}
            <main className="flex-1 lg:mr-56 mt-14 transition-all duration-300 flex flex-col">
              <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 flex-1">
                {children}
              </div>
              
              {/* Footer */}
              <footer className="py-6 px-4 text-center border-t border-gray-200 bg-white mt-auto">
                <p className="text-sm text-gray-400">
                  מופעל על ידי: <span className="font-medium text-gray-500">QuickShop</span> · מערכת ניהול חנויות אונליין
                </p>
              </footer>
            </main>
          </div>
        </>
      ) : (
        // Login page or unauthenticated state
        children
      )}
    </div>
  );
}

