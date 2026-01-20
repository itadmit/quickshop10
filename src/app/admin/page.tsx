import { db } from '@/lib/db';
import { stores, users, orders, storeSubscriptions } from '@/lib/db/schema';
import { sql, desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { Store, Users, ShoppingCart, DollarSign, TrendingUp, ArrowUpRight, Clock, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PlatformAdminPage() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get platform stats
  const [storeStats] = await db
    .select({
      totalStores: sql<number>`COUNT(*)::int`,
      activeStores: sql<number>`COUNT(*) FILTER (WHERE ${stores.isActive} = true)::int`,
      newStores: sql<number>`COUNT(*) FILTER (WHERE ${stores.createdAt} >= ${sevenDaysAgo})::int`,
    })
    .from(stores);

  const [userStats] = await db
    .select({
      totalUsers: sql<number>`COUNT(*)::int`,
      newUsers: sql<number>`COUNT(*) FILTER (WHERE ${users.createdAt} >= ${sevenDaysAgo})::int`,
      activeToday: sql<number>`COUNT(*) FILTER (WHERE ${users.lastLoginAt} >= ${new Date(Date.now() - 24 * 60 * 60 * 1000)})::int`,
    })
    .from(users);

  const [orderStats] = await db
    .select({
      totalOrders: sql<number>`COUNT(*) FILTER (WHERE ${orders.financialStatus} = 'paid')::int`,
      totalRevenue: sql<string>`COALESCE(SUM(${orders.total}::numeric) FILTER (WHERE ${orders.financialStatus} = 'paid'), 0)`,
      recentOrders: sql<number>`COUNT(*) FILTER (WHERE ${orders.createdAt} >= ${thirtyDaysAgo} AND ${orders.financialStatus} = 'paid')::int`,
      recentRevenue: sql<string>`COALESCE(SUM(${orders.total}::numeric) FILTER (WHERE ${orders.createdAt} >= ${thirtyDaysAgo} AND ${orders.financialStatus} = 'paid'), 0)`,
    })
    .from(orders);

  // Get subscription stats
  const subscriptionStats = await db
    .select({
      plan: storeSubscriptions.plan,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(storeSubscriptions)
    .groupBy(storeSubscriptions.plan);

  const planCountMap = subscriptionStats.reduce((acc, { plan, count }) => {
    acc[plan] = count;
    return acc;
  }, {} as Record<string, number>);

  // Get recent stores with owner info
  const recentStores = await db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      plan: stores.plan,
      isActive: stores.isActive,
      createdAt: stores.createdAt,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(stores)
    .leftJoin(users, eq(stores.ownerId, users.id))
    .orderBy(desc(stores.createdAt))
    .limit(5);

  // Get recent users
  const recentUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(5);

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatRelativeTime = (date: Date | null) => {
    if (!date) return 'אף פעם';
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'עכשיו';
    if (diffMins < 60) return `לפני ${diffMins} דק׳`;
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    return new Date(date).toLocaleDateString('he-IL');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">סקירת פלטפורמה</h1>
        <p className="text-sm sm:text-base text-gray-500">ברוך הבא למערכת הניהול של QuickShop</p>
      </div>

      {/* Main Stats - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
        <StatCard
          icon={Store}
          label="חנויות"
          value={storeStats.totalStores}
          subtext={`${storeStats.activeStores} פעילות`}
          trend={storeStats.newStores > 0 ? `+${storeStats.newStores}` : undefined}
          color="emerald"
        />
        <StatCard
          icon={Users}
          label="משתמשים"
          value={userStats.totalUsers}
          subtext={`${userStats.activeToday} פעילים היום`}
          trend={userStats.newUsers > 0 ? `+${userStats.newUsers}` : undefined}
          color="blue"
        />
        <StatCard
          icon={ShoppingCart}
          label="הזמנות"
          value={orderStats.totalOrders}
          subtext={`${orderStats.recentOrders} ב-30 יום`}
          color="purple"
        />
        <StatCard
          icon={DollarSign}
          label="הכנסות"
          value={formatCurrency(orderStats.totalRevenue)}
          subtext={`${formatCurrency(orderStats.recentRevenue)} ב-30 יום`}
          color="amber"
        />
      </div>

      {/* Subscription Stats */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <Activity className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base sm:text-lg font-bold text-gray-900">התפלגות מנויים</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-linear-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 sm:p-4 border border-blue-200">
            <p className="text-2xl sm:text-3xl font-bold text-blue-700">{planCountMap['trial'] || 0}</p>
            <p className="text-sm text-blue-600 font-medium">נסיון</p>
            <p className="text-xs text-blue-500 mt-1 hidden sm:block">7 ימים חינם</p>
          </div>
          <div className="bg-linear-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 sm:p-4 border border-purple-200">
            <p className="text-2xl sm:text-3xl font-bold text-purple-700">{planCountMap['branding'] || 0}</p>
            <p className="text-sm text-purple-600 font-medium">תדמית</p>
            <p className="text-xs text-purple-500 mt-1 hidden sm:block">₪299/חודש</p>
          </div>
          <div className="bg-linear-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 sm:p-4 border border-emerald-200">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{planCountMap['quickshop'] || 0}</p>
            <p className="text-sm text-emerald-600 font-medium">קוויק שופ</p>
            <p className="text-xs text-emerald-500 mt-1 hidden sm:block">₪399/חודש</p>
          </div>
          <div className="bg-linear-to-br from-gray-50 to-gray-100/50 rounded-xl p-3 sm:p-4 border border-gray-200">
            <p className="text-2xl sm:text-3xl font-bold text-gray-700">
              {(planCountMap['trial'] || 0) + (planCountMap['branding'] || 0) + (planCountMap['quickshop'] || 0)}
            </p>
            <p className="text-sm text-gray-600 font-medium">סה״כ מנויים</p>
            <p className="text-xs text-gray-500 mt-1 hidden sm:block">כל התוכניות</p>
          </div>
        </div>
      </div>

      {/* Recent Stores & Users - Stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Stores */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-gray-900">חנויות אחרונות</h2>
            </div>
            <Link href="/admin/stores" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
              הכל
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentStores.map((store) => (
              <Link
                key={store.id}
                href={`/admin/stores/${store.id}`}
                className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-linear-to-br from-emerald-100 to-green-100 rounded-xl flex items-center justify-center border border-emerald-200 flex-shrink-0">
                    <Store className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{store.name}</p>
                    <p className="text-xs text-gray-500 truncate">{store.ownerEmail}</p>
                  </div>
                </div>
                <div className="text-left flex-shrink-0 mr-2">
                  <span className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs rounded-full font-medium ${
                    store.plan === 'quickshop' ? 'bg-emerald-100 text-emerald-700' :
                    store.plan === 'branding' ? 'bg-purple-100 text-purple-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {store.plan === 'quickshop' ? 'קוויק שופ' : 
                     store.plan === 'branding' ? 'תדמית' : 'נסיון'}
                  </span>
                </div>
              </Link>
            ))}
            {recentStores.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Store className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>אין חנויות עדיין</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-gray-900">משתמשים אחרונים</h2>
            </div>
            <Link href="/admin/users" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
              הכל
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.map((user) => (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden shadow-md flex-shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-medium text-sm">
                        {(user.name || user.email)?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{user.name || 'ללא שם'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0 mr-2">
                  <Clock className="w-3.5 h-3.5 hidden sm:block" />
                  <span className="hidden sm:inline">{formatRelativeTime(user.lastLoginAt)}</span>
                </div>
              </Link>
            ))}
            {recentUsers.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>אין משתמשים עדיין</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext, 
  trend, 
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  subtext: string;
  trend?: string;
  color: 'emerald' | 'blue' | 'purple' | 'amber';
}) {
  const colors = {
    emerald: {
      bg: 'from-emerald-50 to-green-50',
      border: 'border-emerald-200',
      icon: 'text-emerald-600 bg-emerald-100',
      trend: 'text-emerald-600 bg-emerald-100',
    },
    blue: {
      bg: 'from-blue-50 to-cyan-50',
      border: 'border-blue-200',
      icon: 'text-blue-600 bg-blue-100',
      trend: 'text-blue-600 bg-blue-100',
    },
    purple: {
      bg: 'from-purple-50 to-fuchsia-50',
      border: 'border-purple-200',
      icon: 'text-purple-600 bg-purple-100',
      trend: 'text-purple-600 bg-purple-100',
    },
    amber: {
      bg: 'from-amber-50 to-orange-50',
      border: 'border-amber-200',
      icon: 'text-amber-600 bg-amber-100',
      trend: 'text-amber-600 bg-amber-100',
    },
  };

  const c = colors[color];

  return (
    <div className={`bg-linear-to-br ${c.bg} rounded-xl sm:rounded-2xl border ${c.border} p-3 sm:p-5 shadow-sm`}>
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${c.icon}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${c.trend}`}>
            <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-xl sm:text-3xl font-bold text-gray-900 mb-0.5 sm:mb-1">{value}</p>
      <p className="text-xs sm:text-sm font-medium text-gray-600">{label}</p>
      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{subtext}</p>
    </div>
  );
}
