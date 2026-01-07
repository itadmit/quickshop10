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

  // Build icons config - use store favicon if available
  const icons: { icon?: string; apple?: string } = {};
  if (store.faviconUrl) {
    icons.icon = store.faviconUrl;
    icons.apple = store.faviconUrl;
  }

  return {
    title: `${store.name} | אופנה בסגנון`,
    description: `חנות ${store.name} - ביגוד, נעליים ואקססוריז`,
    ...(Object.keys(icons).length > 0 && { icons }),
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

