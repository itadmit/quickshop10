import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { cache } from 'react';

// Cache store lookup for this request
const getStore = cache(async (slug: string) => {
  return getStoreBySlug(slug);
});

interface ShopLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStore(slug);
  
  if (!store) {
    return { title: 'חנות לא נמצאה' };
  }

  return {
    title: `${store.name} | אופנה בסגנון`,
    description: `חנות ${store.name} - ביגוד, נעליים ואקססוריז`,
  };
}

// This is now just a pass-through layout for the shop slug
// The storefront layout handles the header/cart
// The admin layout handles admin UI
export default async function ShopLayout({ children, params }: ShopLayoutProps) {
  const { slug } = await params;
  const store = await getStore(slug);
  
  if (!store) {
    notFound();
  }

  return <>{children}</>;
}

