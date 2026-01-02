import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { stores, users, orders } from '@/lib/db/schema';
import { sql, desc, gte } from 'drizzle-orm';
import Link from 'next/link';

export default async function PlatformAdminPage() {
  const session = await auth();
  
  // Check if user is platform admin
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    redirect('/login');
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get platform stats
  const [storeStats] = await db
    .select({
      totalStores: sql<number>`COUNT(*)::int`,
      activeStores: sql<number>`COUNT(*) FILTER (WHERE ${stores.isActive} = true)::int`,
    })
    .from(stores);

  const [userStats] = await db
    .select({
      totalUsers: sql<number>`COUNT(*)::int`,
    })
    .from(users);

  const [orderStats] = await db
    .select({
      totalOrders: sql<number>`COUNT(*)::int`,
      totalRevenue: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)`,
      recentOrders: sql<number>`COUNT(*) FILTER (WHERE ${orders.createdAt} >= ${thirtyDaysAgo})::int`,
    })
    .from(orders);

  // Get recent stores
  const recentStores = await db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      plan: stores.plan,
      isActive: stores.isActive,
      createdAt: stores.createdAt,
    })
    .from(stores)
    .orderBy(desc(stores.createdAt))
    .limit(10);

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-display text-xl tracking-[0.3em] uppercase">
              QuickShop
            </Link>
            <span className="px-2 py-1 bg-white/20 text-xs rounded">Platform Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/60">{session.user.email}</span>
            <Link href="/logout" className="text-sm text-white/60 hover:text-white">
              התנתק
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <Link href="/admin" className="py-4 text-sm font-medium border-b-2 border-black">
              סקירה
            </Link>
            <Link href="/admin/stores" className="py-4 text-sm text-gray-600 hover:text-black">
              חנויות
            </Link>
            <Link href="/admin/users" className="py-4 text-sm text-gray-600 hover:text-black">
              משתמשים
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">סקירת פלטפורמה</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-3xl font-bold text-gray-900">{storeStats.totalStores}</p>
            <p className="text-sm text-gray-500 mt-1">סה״כ חנויות</p>
            <p className="text-xs text-green-600 mt-2">{storeStats.activeStores} פעילות</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-3xl font-bold text-gray-900">{userStats.totalUsers}</p>
            <p className="text-sm text-gray-500 mt-1">משתמשים</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-3xl font-bold text-gray-900">{orderStats.totalOrders}</p>
            <p className="text-sm text-gray-500 mt-1">סה״כ הזמנות</p>
            <p className="text-xs text-blue-600 mt-2">{orderStats.recentOrders} ב-30 יום</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(orderStats.totalRevenue)}</p>
            <p className="text-sm text-gray-500 mt-1">סה״כ מכירות</p>
          </div>
        </div>

        {/* Recent Stores */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold">חנויות אחרונות</h2>
            <Link href="/admin/stores" className="text-sm text-blue-600 hover:underline">
              הצג הכל →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentStores.map((store) => (
              <div key={store.id} className="p-4 flex items-center justify-between">
                <div>
                  <Link 
                    href={`/shops/${store.slug}/admin`}
                    className="font-medium text-gray-900 hover:text-black"
                  >
                    {store.name}
                  </Link>
                  <p className="text-sm text-gray-500">/{store.slug}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    store.plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                    store.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                    store.plan === 'basic' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {store.plan}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    store.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {store.isActive ? 'פעיל' : 'לא פעיל'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(store.createdAt).toLocaleDateString('he-IL')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

