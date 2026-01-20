import { db } from '@/lib/db';
import { users, stores, storeSubscriptions, orders, storeMembers } from '@/lib/db/schema';
import { eq, sql, desc, inArray } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Mail, User, Calendar, Clock, Store, Shield } from 'lucide-react';
import { UserEditForm } from './user-edit-form';

export const dynamic = 'force-dynamic';

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;

  // Get user details
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!user) {
    notFound();
  }

  // Get user's stores (owned)
  const ownedStores = await db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      plan: stores.plan,
      isActive: stores.isActive,
      createdAt: stores.createdAt,
    })
    .from(stores)
    .where(eq(stores.ownerId, user.id))
    .orderBy(desc(stores.createdAt));

  // Get stores where user is a member
  const memberStores = await db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      role: storeMembers.role,
    })
    .from(storeMembers)
    .innerJoin(stores, eq(stores.id, storeMembers.storeId))
    .where(eq(storeMembers.userId, user.id));

  // Get total orders across all user's stores
  const storeIds = ownedStores.map(s => s.id);
  let orderStats = { totalOrders: 0, totalRevenue: '0' };
  
  if (storeIds.length > 0) {
    const [stats] = await db
      .select({
        totalOrders: sql<number>`COUNT(*) FILTER (WHERE ${orders.financialStatus} = 'paid')::int`,
        totalRevenue: sql<string>`COALESCE(SUM(${orders.total}::numeric) FILTER (WHERE ${orders.financialStatus} = 'paid'), 0)`,
      })
      .from(orders)
      .where(inArray(orders.storeId, storeIds));
    
    if (stats) {
      orderStats = stats;
    }
  }

  // Get subscription info for stores
  const subscriptions = storeIds.length > 0 
    ? await db.select().from(storeSubscriptions).where(inArray(storeSubscriptions.storeId, storeIds))
    : [];

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (date: Date | null) => {
    if (!date) return 'אף פעם';
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'עכשיו';
    if (diffMins < 60) return `לפני ${diffMins} דקות`;
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    return formatDate(date);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 sm:mb-6">
        <Link href="/admin/users" className="hover:text-emerald-600 transition-colors">
          משתמשים
        </Link>
        <ArrowRight className="w-4 h-4 rotate-180" />
        <span className="text-gray-900 font-medium truncate">{user.name || user.email}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* User Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-linear-to-br from-emerald-500 to-green-600 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden border-2 border-white/30 flex-shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-2xl sm:text-3xl font-bold">
                      {(user.name || user.email)?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 truncate">
                    {user.name || 'ללא שם'}
                  </h1>
                  <p className="text-white/80 text-sm sm:text-base truncate">{user.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'admin' 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-white/20 text-white'
                    }`}>
                      {user.role === 'admin' ? 'מנהל מערכת' : 'סוחר'}
                    </span>
                    {user.emailVerifiedAt && (
                      <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                        מאומת
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
              <div className="p-3 sm:p-4 text-center">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{ownedStores.length}</p>
                <p className="text-xs sm:text-sm text-gray-500">חנויות</p>
              </div>
              <div className="p-3 sm:p-4 text-center">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{orderStats.totalOrders}</p>
                <p className="text-xs sm:text-sm text-gray-500">הזמנות</p>
              </div>
              <div className="p-3 sm:p-4 text-center">
                <p className="text-lg sm:text-2xl font-bold text-emerald-600">{formatCurrency(orderStats.totalRevenue)}</p>
                <p className="text-xs sm:text-sm text-gray-500">מכירות</p>
              </div>
            </div>

            {/* Details */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <DetailRow icon={Mail} label="אימייל" value={user.email} />
              <DetailRow icon={Calendar} label="תאריך הרשמה" value={formatDate(user.createdAt)} />
              <DetailRow 
                icon={Clock} 
                label="התחברות אחרונה" 
                value={formatRelativeTime(user.lastLoginAt)}
                highlight={!!(user.lastLoginAt && (Date.now() - new Date(user.lastLoginAt).getTime()) < 24 * 60 * 60 * 1000)}
              />
              <DetailRow icon={Shield} label="תפקיד" value={user.role === 'admin' ? 'מנהל מערכת' : 'סוחר'} />
            </div>
          </div>

          {/* Owned Stores */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-gray-900">חנויות בבעלות</h2>
              </div>
              <span className="text-sm text-gray-500">{ownedStores.length} חנויות</span>
            </div>
            
            {ownedStores.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {ownedStores.map((store) => {
                  const sub = subscriptions.find(s => s.storeId === store.id);
                  return (
                    <Link
                      key={store.id}
                      href={`/admin/stores/${store.id}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <Store className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{store.name}</p>
                          <p className="text-xs sm:text-sm text-gray-500">/{store.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full font-medium ${
                          sub?.plan === 'quickshop' ? 'bg-emerald-100 text-emerald-700' :
                          sub?.plan === 'branding' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {sub?.plan === 'quickshop' ? 'קוויק שופ' : 
                           sub?.plan === 'branding' ? 'תדמית' : 'נסיון'}
                        </span>
                        <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full font-medium ${
                          store.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {store.isActive ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 sm:p-8 text-center">
                <Store className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm sm:text-base">אין חנויות בבעלות המשתמש</p>
              </div>
            )}
          </div>

          {/* Member Stores */}
          {memberStores.length > 0 && (
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-gray-900">חבר צוות ב-</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {memberStores.map((store) => (
                  <Link
                    key={store.id}
                    href={`/admin/stores/${store.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <Store className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{store.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500">/{store.slug}</p>
                      </div>
                    </div>
                    <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full font-medium bg-gray-100 text-gray-700 self-end sm:self-auto">
                      {store.role}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Edit Form */}
        <div className="space-y-4 sm:space-y-6">
          <UserEditForm 
            user={{
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            }}
            storesCount={ownedStores.length}
          />

          {/* Quick Actions */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">פעולות מהירות</h3>
            <div className="space-y-2">
              {ownedStores.length > 0 && (
                <Link
                  href={`/shops/${ownedStores[0].slug}/admin`}
                  className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-colors"
                >
                  <Store className="w-4 h-4" />
                  כניסה לחנות
                </Link>
              )}
              <button
                className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-colors"
              >
                <Mail className="w-4 h-4" />
                שלח אימייל
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg sm:rounded-xl transition-colors"
              >
                <Shield className="w-4 h-4" />
                השעה משתמש
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ 
  icon: Icon, 
  label, 
  value,
  highlight = false,
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-gray-500">{label}</p>
        <p className={`font-medium text-sm sm:text-base truncate ${highlight ? 'text-emerald-600' : 'text-gray-900'}`}>{value}</p>
      </div>
    </div>
  );
}
