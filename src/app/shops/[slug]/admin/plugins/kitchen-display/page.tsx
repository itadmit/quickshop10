import { getStoreBySlug } from '@/lib/db/queries';
import { notFound, redirect } from 'next/navigation';
import { getStorePlugin } from '@/lib/plugins/loader';
import Link from 'next/link';
import { Monitor, Bell, BellOff, ExternalLink } from 'lucide-react';
import { KitchenDisplaySettings } from './settings';

// ============================================
// Kitchen Display Settings Page
// Server Component - מהיר כמו PHP!
// ============================================

interface KitchenDisplayPageProps {
  params: Promise<{ slug: string }>;
}

export default async function KitchenDisplayPage({ params }: KitchenDisplayPageProps) {
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

  // Get custom order statuses from store
  const customStatuses = (store.customOrderStatuses as Array<{
    id: string;
    name: string;
    color: string;
  }>) || [];

  // Default config
  const defaultConfig = {
    // סטטוסים להצגה
    displayOrderStatuses: ['pending', 'confirmed', 'processing'],
    displayFinancialStatuses: ['paid'],
    displayFulfillmentStatuses: ['unfulfilled', 'partial'],
    // פעולות
    successStatus: 'processing',
    successCustomStatus: null as string | null,
    cancelStatus: 'cancelled',
    cancelCustomStatus: null as string | null,
    // צליל
    soundEnabled: true,
    soundVolume: 80,
    refreshInterval: 60,
    // תצוגה
    sortOrder: 'oldest_first' as const,
    showCustomerPhone: true,
    showCustomerName: true,
    showOrderNotes: true,
    showProductImages: true,
    cardSize: 'medium' as const,
    darkMode: true,
    warningTimeMinutes: 5,
    dangerTimeMinutes: 10,
  };

  const config = { ...defaultConfig, ...(plugin.config as Partial<typeof defaultConfig>) };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Monitor className="w-7 h-7 text-orange-500" />
            מסך מטבח
          </h1>
          <p className="text-gray-500">הצג הזמנות בזמן אמת על מסך ייעודי</p>
        </div>
        <Link
          href={`/shops/${slug}/admin/plugins/kitchen-display/display`}
          target="_blank"
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl"
        >
          <ExternalLink className="w-5 h-5" />
          פתח מסך תצוגה
        </Link>
      </div>

      {/* Quick Launch Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
            <Monitor className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-1">מסך תצוגת הזמנות</h2>
            <p className="text-slate-300 text-sm mb-4">
              פתח את מסך התצוגה על טאבלט או מסך נפרד במטבח. ההזמנות יוצגו בזמן אמת עם שעון סופר והתראות קוליות.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-slate-300">רענון כל {config.refreshInterval} שניות</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                {config.soundEnabled ? (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>התראות פעילות</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4" />
                    <span>התראות כבויות</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form - Client Component for interactivity */}
      <KitchenDisplaySettings
        storeId={store.id}
        storeSlug={slug}
        config={config}
        customStatuses={customStatuses}
      />
    </div>
  );
}

