import { getStoreBySlug, getCategoriesByStore } from '@/lib/db/queries';
import { ShopHeader } from '@/components/shop-header';
import { CartSidebar } from '@/components/cart-sidebar';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { cache } from 'react';

// Force dynamic rendering because we use cookies for customer auth
export const dynamic = 'force-dynamic';

// Cache store lookup for this request
const getStore = cache(async (slug: string) => {
  return getStoreBySlug(slug);
});

interface StorefrontLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function StorefrontLayout({ children, params }: StorefrontLayoutProps) {
  const { slug } = await params;
  const store = await getStore(slug);
  
  // Store existence is already checked in parent layout
  if (!store) {
    return <>{children}</>;
  }

  // Fetch categories and customer in parallel (server-side)
  const [categories, customer] = await Promise.all([
    getCategoriesByStore(store.id),
    getCurrentCustomer(),
  ]);
  
  const basePath = `/shops/${slug}`;

  // Check if we should show header (only if there's content)
  const showHeader = categories.length > 0;

  // Map customer data for props (only what we need)
  const customerData = customer ? {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    hasPassword: !!customer.passwordHash,
    emailVerified: !!customer.emailVerifiedAt,
  } : null;

  return (
    <>
      {showHeader && (
        <>
          <ShopHeader 
            storeName={store.name} 
            categories={categories} 
            basePath={basePath}
            customer={customerData}
          />
          <CartSidebar basePath={basePath} />
        </>
      )}
      <main>{children}</main>
    </>
  );
}

