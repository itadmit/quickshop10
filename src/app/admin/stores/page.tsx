import { db } from '@/lib/db';
import { stores, users, storeSubscriptions } from '@/lib/db/schema';
import { sql, desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { Search, Store, Settings, ShoppingCart, Clock, Check, X } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PlatformStoresPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; plan?: string; status?: string }>;
}) {
  const { search, plan, status } = await searchParams;

  // Get stores with stats and owner info
  const allStores = await db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      plan: stores.plan,
      isActive: stores.isActive,
      createdAt: stores.createdAt,
      ownerName: users.name,
      ownerEmail: users.email,
      orderCount: sql<number>`(SELECT COUNT(*) FROM orders WHERE store_id = ${stores.id} AND financial_status = 'paid')::int`,
      totalRevenue: sql<string>`(SELECT COALESCE(SUM(total::numeric), 0) FROM orders WHERE store_id = ${stores.id} AND financial_status = 'paid')`,
    })
    .from(stores)
    .leftJoin(users, eq(stores.ownerId, users.id))
    .orderBy(desc(stores.createdAt));

  // Get subscriptions
  const subscriptions = await db.select().from(storeSubscriptions);
  const subMap = new Map(subscriptions.map(s => [s.storeId, s]));

  // Filter
  let filteredStores = allStores;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredStores = filteredStores.filter(s => 
      s.name?.toLowerCase().includes(searchLower) ||
      s.slug?.toLowerCase().includes(searchLower) ||
      s.ownerEmail?.toLowerCase().includes(searchLower)
    );
  }
  if (plan) {
    filteredStores = filteredStores.filter(s => {
      const sub = subMap.get(s.id);
      return sub?.plan === plan;
    });
  }
  if (status === 'active') {
    filteredStores = filteredStores.filter(s => s.isActive);
  } else if (status === 'inactive') {
    filteredStores = filteredStores.filter(s => !s.isActive);
  }

  // Stats - count based on subscription status and plan
  const activeCount = allStores.filter(s => s.isActive).length;
  // Trial = stores with status 'trial' OR stores without subscription OR plan is 'trial'
  const trialCount = allStores.filter(s => {
    const sub = subMap.get(s.id);
    if (!sub) return true; // No subscription = trial
    return sub.status === 'trial' || sub.plan === 'trial';
  }).length;
  const brandingCount = subscriptions.filter(s => s.plan === 'branding' && s.status === 'active').length;
  const quickshopCount = subscriptions.filter(s => s.plan === 'quickshop' && s.status === 'active').length;

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">חנויות</h1>
          <p className="text-sm sm:text-base text-gray-500">{allStores.length} חנויות בפלטפורמה</p>
        </div>
      </div>

      {/* Stats - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <Link 
          href="/admin/stores"
          className={`rounded-xl sm:rounded-2xl p-3 sm:p-5 border transition-all shadow-sm ${
            !plan && !status
              ? 'bg-linear-to-br from-emerald-50 to-green-50 border-emerald-300 ring-2 ring-emerald-200' 
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Store className={`w-4 h-4 sm:w-5 sm:h-5 ${!plan && !status ? 'text-emerald-600' : 'text-gray-400'}`} />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{allStores.length}</p>
          <p className="text-xs sm:text-sm text-gray-500">סה״כ</p>
        </Link>
        
        <Link 
          href="/admin/stores?status=active"
          className={`rounded-xl sm:rounded-2xl p-3 sm:p-5 border transition-all shadow-sm ${
            status === 'active'
              ? 'bg-linear-to-br from-green-50 to-emerald-50 border-green-300 ring-2 ring-green-200' 
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Check className={`w-4 h-4 sm:w-5 sm:h-5 ${status === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{activeCount}</p>
          <p className="text-xs sm:text-sm text-gray-500">פעילות</p>
        </Link>

        <Link 
          href="/admin/stores?plan=trial"
          className={`rounded-xl sm:rounded-2xl p-3 sm:p-5 border transition-all shadow-sm ${
            plan === 'trial'
              ? 'bg-linear-to-br from-blue-50 to-cyan-50 border-blue-300 ring-2 ring-blue-200' 
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${plan === 'trial' ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{trialCount}</p>
          <p className="text-xs sm:text-sm text-gray-500">נסיון</p>
        </Link>

        <Link 
          href="/admin/stores?plan=branding"
          className={`rounded-xl sm:rounded-2xl p-3 sm:p-5 border transition-all shadow-sm ${
            plan === 'branding'
              ? 'bg-linear-to-br from-purple-50 to-fuchsia-50 border-purple-300 ring-2 ring-purple-200' 
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Store className={`w-4 h-4 sm:w-5 sm:h-5 ${plan === 'branding' ? 'text-purple-600' : 'text-gray-400'}`} />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{brandingCount}</p>
          <p className="text-xs sm:text-sm text-gray-500">תדמית</p>
        </Link>

        <Link 
          href="/admin/stores?plan=quickshop"
          className={`rounded-xl sm:rounded-2xl p-3 sm:p-5 border transition-all shadow-sm col-span-2 sm:col-span-1 ${
            plan === 'quickshop'
              ? 'bg-linear-to-br from-emerald-50 to-teal-50 border-emerald-300 ring-2 ring-emerald-200' 
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className={`w-4 h-4 sm:w-5 sm:h-5 ${plan === 'quickshop' ? 'text-emerald-600' : 'text-gray-400'}`} />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{quickshopCount}</p>
          <p className="text-xs sm:text-sm text-gray-500">קוויק שופ</p>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4 mb-6 shadow-sm">
        <form className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="חיפוש לפי שם, slug או אימייל..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-10 pl-4 py-2.5 sm:py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>
          <button 
            type="submit"
            className="px-6 py-2.5 sm:py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200"
          >
            חפש
          </button>
        </form>
      </div>

      {/* Stores - Cards on mobile, Table on desktop */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-right p-4 text-sm font-semibold text-gray-600">חנות</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-600">בעלים</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-600">מסלול</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-600">סטטוס</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-600">הזמנות</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-600">הכנסות</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-600">תאריך</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-600">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStores.map((store) => {
              const sub = subMap.get(store.id);
              return (
                <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Store className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{store.name}</p>
                        <p className="text-sm text-gray-500">/{store.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-gray-900">{store.ownerName || 'ללא שם'}</p>
                    <p className="text-sm text-gray-500">{store.ownerEmail}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1.5 text-xs rounded-full font-semibold ${
                      sub?.plan === 'quickshop' ? 'bg-emerald-100 text-emerald-700' :
                      sub?.plan === 'branding' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {sub?.plan === 'quickshop' ? 'קוויק שופ' : 
                       sub?.plan === 'branding' ? 'תדמית' : 'נסיון'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1.5 text-xs rounded-full font-semibold inline-flex items-center gap-1 ${
                      store.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {store.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {store.isActive ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{store.orderCount}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-emerald-600">{formatCurrency(store.totalRevenue)}</span>
                  </td>
                  <td className="p-4 text-gray-500">
                    {new Date(store.createdAt).toLocaleDateString('he-IL')}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/stores/${store.id}`}
                        className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="הגדרות חנות"
                      >
                        <Settings className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/shops/${store.slug}/admin`}
                        className="p-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        title="כניסה לחנות"
                      >
                        <Store className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-gray-100">
          {filteredStores.map((store) => {
            const sub = subMap.get(store.id);
            return (
              <div key={store.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Store className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{store.name}</p>
                      <p className="text-sm text-gray-500 truncate">/{store.slug}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[10px] rounded-full font-semibold flex-shrink-0 ${
                    store.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {store.isActive ? 'פעיל' : 'לא פעיל'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">בעלים</p>
                    <p className="text-sm text-gray-900 truncate">{store.ownerEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">מסלול</p>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-semibold ${
                      sub?.plan === 'quickshop' ? 'bg-emerald-100 text-emerald-700' :
                      sub?.plan === 'branding' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {sub?.plan === 'quickshop' ? 'קוויק שופ' : 
                       sub?.plan === 'branding' ? 'תדמית' : 'נסיון'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">הזמנות</p>
                    <p className="text-sm font-medium text-gray-900">{store.orderCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">הכנסות</p>
                    <p className="text-sm font-semibold text-emerald-600">{formatCurrency(store.totalRevenue)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">{new Date(store.createdAt).toLocaleDateString('he-IL')}</p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/stores/${store.id}`}
                      className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/shops/${store.slug}/admin`}
                      className="p-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Store className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredStores.length === 0 && (
          <div className="p-12 sm:p-16 text-center">
            <Store className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-base sm:text-lg">לא נמצאו חנויות</p>
            <p className="text-gray-400 text-sm mt-1">נסה לשנות את מילות החיפוש</p>
          </div>
        )}
      </div>
    </div>
  );
}
