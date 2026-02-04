import { getStoreBySlug, getCategoriesByStore, getFooterMenuItems } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { StoreFooter } from '@/components/store-footer';
import { TrackingForm } from './tracking-form';
import type { Metadata } from 'next';

interface TrackPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order?: string; tracking?: string }>;
}

export async function generateMetadata({ params }: TrackPageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    return { title: 'עמוד לא נמצא' };
  }
  
  return {
    title: `מעקב משלוח | ${store.name}`,
    description: `עקוב אחרי המשלוח שלך מ-${store.name}`,
  };
}

export default async function TrackingPage({ params, searchParams }: TrackPageProps) {
  const { slug } = await params;
  const { order, tracking } = await searchParams;
  
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const [categories, footerMenuItems] = await Promise.all([
    getCategoriesByStore(store.id),
    getFooterMenuItems(store.id),
  ]);

  const basePath = `/shops/${slug}`;
  const storeSettings = (store.settings || {}) as Record<string, unknown>;

  // Get store primary color for theming
  const primaryColor = (storeSettings.primaryColor as string) || '#000000';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Icon */}
          <div className="text-center mb-8">
            <div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <svg 
                width="40" 
                height="40" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke={primaryColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="1" y="3" width="15" height="13" rx="2"/>
                <path d="M16 8h4l3 3v5a2 2 0 01-2 2h-1"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">מעקב משלוח</h1>
            <p className="text-gray-500">הזינו את מספר ההזמנה או מספר המעקב</p>
          </div>

          {/* Tracking Form */}
          <TrackingForm 
            storeId={store.id}
            storeSlug={slug}
            initialOrderNumber={order}
            initialTrackingNumber={tracking}
            primaryColor={primaryColor}
          />
        </div>
      </main>

      {/* Footer */}
      <StoreFooter 
        storeName={store.name}
        storeSlug={slug}
        logoUrl={store.logoUrl}
        categories={categories} 
        basePath={basePath}
        settings={storeSettings}
        footerMenuItems={footerMenuItems}
      />
    </div>
  );
}

