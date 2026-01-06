import { getDemoStore } from '@/lib/db/queries';
import { StoreProvider } from '@/lib/store-context';
import { CartSidebar } from '@/components/cart-sidebar';
import { notFound } from 'next/navigation';

interface ProductLayoutProps {
  children: React.ReactNode;
}

export default async function ProductLayout({ children }: ProductLayoutProps) {
  const store = await getDemoStore();
  
  if (!store) {
    notFound();
  }

  const settings = (store.settings as Record<string, unknown>) || {};
  const showDecimalPrices = (settings.showDecimalPrices as boolean) ?? true;

  return (
    <StoreProvider 
      storeSlug={store.slug}
      initialSettings={{ 
        showDecimalPrices,
        currency: store.currency 
      }}
    >
      {children}
      <CartSidebar />
    </StoreProvider>
  );
}

