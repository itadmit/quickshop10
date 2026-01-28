import { getStoreBySlug } from '@/lib/db/queries';
import { notFound, redirect } from 'next/navigation';
import { getStorePlugin } from '@/lib/plugins/loader';
import { KitchenDisplayView } from './kitchen-display-view';
import { getKitchenOrders, KitchenDisplayConfig } from '../actions';

// ============================================
// Kitchen Display - Full Screen View
// ============================================

interface KitchenDisplayPageProps {
  params: Promise<{ slug: string }>;
}

export default async function KitchenDisplayViewPage({ params }: KitchenDisplayPageProps) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }

  // Check if plugin is installed
  const plugin = await getStorePlugin(store.id, 'kitchen-display');
  if (!plugin || !plugin.isActive) {
    redirect(`/shops/${slug}/admin/plugins?install=kitchen-display`);
  }

  // Default config
  const defaultConfig: KitchenDisplayConfig = {
    // סטטוסים להצגה
    displayOrderStatuses: ['pending', 'confirmed', 'processing'],
    displayFinancialStatuses: ['paid'],
    displayFulfillmentStatuses: ['unfulfilled', 'partial'],
    // פעולות
    successStatus: 'processing',
    successCustomStatus: null,
    cancelStatus: 'cancelled',
    cancelCustomStatus: null,
    // צליל
    soundEnabled: true,
    soundVolume: 80,
    refreshInterval: 60,
    // תצוגה
    sortOrder: 'oldest_first',
    showCustomerPhone: true,
    showCustomerName: true,
    showOrderNotes: true,
    showProductImages: true,
    cardSize: 'medium',
    darkMode: true,
    warningTimeMinutes: 5,
    dangerTimeMinutes: 10,
  };

  const config: KitchenDisplayConfig = { ...defaultConfig, ...(plugin.config as Partial<KitchenDisplayConfig>) };

  // Get custom order statuses
  const customStatuses = (store.customOrderStatuses as Array<{
    id: string;
    name: string;
    color: string;
  }>) || [];

  // Get initial orders
  const initialOrders = await getKitchenOrders(store.id, config);

  return (
    <KitchenDisplayView
      storeId={store.id}
      storeName={store.name}
      storeSlug={slug}
      config={config}
      customStatuses={customStatuses}
      initialOrders={initialOrders}
    />
  );
}

