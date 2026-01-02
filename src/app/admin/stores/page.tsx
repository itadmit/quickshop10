import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { stores, orders } from '@/lib/db/schema';
import { sql, desc, eq } from 'drizzle-orm';
import Link from 'next/link';

export default async function PlatformStoresPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; status?: string }>;
}) {
  const session = await auth();
  
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    redirect('/login');
  }

  const { plan, status } = await searchParams;

  // Build filter conditions
  let filterConditions = sql`1=1`;
  if (plan) {
    filterConditions = sql`${filterConditions} AND ${stores.plan} = ${plan}`;
  }
  if (status === 'active') {
    filterConditions = sql`${filterConditions} AND ${stores.isActive} = true`;
  } else if (status === 'inactive') {
    filterConditions = sql`${filterConditions} AND ${stores.isActive} = false`;
  }

  // Get stores with stats
  const allStores = await db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      plan: stores.plan,
      isActive: stores.isActive,
      createdAt: stores.createdAt,
      orderCount: sql<number>`(SELECT COUNT(*) FROM orders WHERE store_id = ${stores.id})::int`,
      totalRevenue: sql<string>`(SELECT COALESCE(SUM(total::numeric), 0) FROM orders WHERE store_id = ${stores.id})`,
    })
    .from(stores)
    .where(filterConditions)
    .orderBy(desc(stores.createdAt));

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  // Get plan counts
  const planCounts = await db
    .select({
      plan: stores.plan,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(stores)
    .groupBy(stores.plan);

  const planCountMap = planCounts.reduce((acc, { plan, count }) => {
    acc[plan] = count;
    return acc;
  }, {} as Record<string, number>);

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
            <Link href="/admin" className="py-4 text-sm text-gray-600 hover:text-black">
              סקירה
            </Link>
            <Link href="/admin/stores" className="py-4 text-sm font-medium border-b-2 border-black">
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">חנויות ({allStores.length})</h1>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Link
            href="/admin/stores"
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              !plan && !status ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            הכל
          </Link>
          {['free', 'basic', 'pro', 'enterprise'].map((p) => (
            <Link
              key={p}
              href={`/admin/stores?plan=${p}`}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                plan === p ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p} ({planCountMap[p] || 0})
            </Link>
          ))}
        </div>

        {/* Stores Table */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right p-4 text-sm font-medium text-gray-500">חנות</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">תוכנית</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">סטטוס</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">הזמנות</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">הכנסות</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">תאריך</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allStores.map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-900">{store.name}</p>
                        <p className="text-sm text-gray-500">/{store.slug}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        store.plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                        store.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                        store.plan === 'basic' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {store.plan}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        store.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {store.isActive ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-900">{store.orderCount}</td>
                    <td className="p-4 text-gray-900">{formatCurrency(store.totalRevenue)}</td>
                    <td className="p-4 text-gray-500 text-sm">
                      {new Date(store.createdAt).toLocaleDateString('he-IL')}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/shops/${store.slug}/admin`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        כניסה →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

