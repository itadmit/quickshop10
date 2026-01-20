import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { getWishlistItems, type WishlistItem } from '@/lib/actions/wishlist';
import { WishlistPageContent } from './wishlist-content';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

interface WishlistPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: WishlistPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  return {
    title: `רשימת משאלות | ${store?.name || 'חנות'}`,
    description: 'המוצרים שאהבת',
  };
}

export default async function WishlistPage({ params }: WishlistPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    return <div>חנות לא נמצאה</div>;
  }

  // Get customer if logged in
  const customer = await getCurrentCustomer();
  
  // Fetch wishlist items for logged-in customers
  let items: WishlistItem[] = [];
  if (customer) {
    items = await getWishlistItems(customer.id);
  }

  // Get base path for links
  const headersList = await headers();
  const customDomain = headersList.get('x-custom-domain');
  const basePath = customDomain ? '' : `/shops/${slug}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">רשימת משאלות</h1>
          <p className="text-gray-500 mt-2">
            {customer 
              ? `${items.length} מוצרים ברשימה` 
              : 'התחבר כדי לשמור את רשימת המשאלות שלך'}
          </p>
        </div>

        {/* Content */}
        <WishlistPageContent 
          initialItems={items}
          basePath={basePath}
          isLoggedIn={!!customer}
          storeId={store.id}
          storeCurrency={store.currency}
        />
      </div>
    </div>
  );
}

