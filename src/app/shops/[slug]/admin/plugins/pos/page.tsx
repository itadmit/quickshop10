import { getStoreBySlug } from '@/lib/db/queries';
import { notFound, redirect } from 'next/navigation';
import { getStorePlugin } from '@/lib/plugins/loader';
import { db } from '@/lib/db';
import { products, productImages, categories, customers, paymentProviders } from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { POSTerminal } from './pos-terminal';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

// ============================================
// POS Page - Server Component
// Loads products and customers for the POS terminal
// ============================================

interface POSPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ payment?: string }>;
}

export default async function POSPage({ params, searchParams }: POSPageProps) {
  const { slug } = await params;
  const { payment } = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }

  // Check if plugin is installed
  const plugin = await getStorePlugin(store.id, 'pos');
  if (!plugin || !plugin.isActive) {
    redirect(`/shops/${slug}/admin/plugins?install=pos`);
  }

  // Fetch recent products (active)
  const productResults = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      comparePrice: products.comparePrice,
      sku: products.sku,
      barcode: products.barcode,
      hasVariants: products.hasVariants,
      inventory: products.inventory,
    })
    .from(products)
    .where(
      and(
        eq(products.storeId, store.id),
        eq(products.isActive, true)
      )
    )
    .orderBy(desc(products.updatedAt))
    .limit(12);

  // Get primary images for these products
  const productIds = productResults.map(p => p.id);
  const images = productIds.length > 0 ? await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
    })
    .from(productImages)
    .where(
      and(
        inArray(productImages.productId, productIds),
        eq(productImages.isPrimary, true)
      )
    ) : [];

  const imageMap = new Map(images.map(img => [img.productId, img.url]));
  
  const recentProducts = productResults.map(p => ({
    ...p,
    imageUrl: imageMap.get(p.id) || null,
  }));

  // Fetch categories for filtering
  const storeCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categories)
    .where(eq(categories.storeId, store.id))
    .orderBy(categories.name);

  // Fetch recent customers
  const recentCustomers = await db
    .select({
      id: customers.id,
      email: customers.email,
      firstName: customers.firstName,
      lastName: customers.lastName,
      phone: customers.phone,
      defaultAddress: customers.defaultAddress,
      totalOrders: customers.totalOrders,
    })
    .from(customers)
    .where(eq(customers.storeId, store.id))
    .orderBy(desc(customers.totalOrders))
    .limit(10);

  // 🆕 Check for Quick Payments configuration
  const [quickPaymentProvider] = await db
    .select({
      credentials: paymentProviders.credentials,
      testMode: paymentProviders.testMode,
      isActive: paymentProviders.isActive,
    })
    .from(paymentProviders)
    .where(
      and(
        eq(paymentProviders.storeId, store.id),
        eq(paymentProviders.provider, 'quick_payments'),
        eq(paymentProviders.isActive, true)
      )
    )
    .limit(1);

  // Use platform's shared PayMe public key from environment
  const platformPublicKey = process.env.PAYME_PUBLIC_KEY;
  
  const quickPaymentConfig = quickPaymentProvider && platformPublicKey ? {
    enabled: true,
    publicKey: platformPublicKey,
    testMode: quickPaymentProvider.testMode ?? false,
  } : {
    enabled: false,
  };

  // Get current user for CRM tracking (who created the order)
  const currentUser = await getCurrentUser();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/shops/${slug}/admin`}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">קופה</h1>
                  <p className="text-sm text-gray-500">{store.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Payment Status Message */}
      {payment === 'success' && (
        <div className="bg-green-50 border-b border-green-100 px-4 py-3">
          <div className="flex items-center gap-2 text-green-700">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">התשלום התקבל בהצלחה!</span>
          </div>
        </div>
      )}
      {payment === 'failed' && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-3">
          <div className="flex items-center gap-2 text-red-700">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">התשלום נכשל. נסה שוב.</span>
          </div>
        </div>
      )}

      {/* POS Terminal */}
      <POSTerminal
        storeId={store.id}
        storeSlug={slug}
        initialProducts={recentProducts}
        categories={storeCategories}
        recentCustomers={recentCustomers}
        quickPaymentConfig={quickPaymentConfig}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}

