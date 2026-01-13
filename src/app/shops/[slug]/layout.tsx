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

  // Get SEO settings
  const seoSettings = (store.seoSettings as Record<string, unknown>) || {};
  const siteTitle = (seoSettings.siteTitle as string) || '';
  const siteDescription = (seoSettings.siteDescription as string) || `חנות ${store.name} - קנו אונליין במחירים משתלמים`;
  
  // Build title - use siteTitle if available
  const fullTitle = siteTitle 
    ? `${store.name} | ${siteTitle}`
    : store.name;

  // Build icons config - use store favicon if available
  const icons: { icon?: string; apple?: string } = {};
  if (store.faviconUrl) {
    icons.icon = store.faviconUrl;
    icons.apple = store.faviconUrl;
  }

  // Determine OG image - priority: ogImage > logoUrl > QuickShop default
  const ogImage = (seoSettings.ogImage as string) 
    || store.logoUrl 
    || 'https://quickshop.co.il/quickshop-og.png';

  // Build site URL
  const siteUrl = store.customDomain 
    ? `https://${store.customDomain}` 
    : `https://${store.slug}.quickshop.co.il`;

  return {
    title: fullTitle,
    description: siteDescription,
    ...(Object.keys(icons).length > 0 && { icons }),
    openGraph: {
      title: fullTitle,
      description: siteDescription,
      url: siteUrl,
      siteName: store.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: store.name,
        },
      ],
      locale: 'he_IL',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: siteDescription,
      images: [ogImage],
    },
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

