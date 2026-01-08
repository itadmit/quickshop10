import { headers } from 'next/headers';
import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { CustomerAccountActions } from '@/components/customer-account-actions';

export const metadata = {
  title: 'האיזור האישי',
  description: 'ניהול החשבון שלך',
};

interface AccountPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CustomerAccountPage({ params }: AccountPageProps) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }
  
  const headersList = await headers();
  const basePath = headersList.get('x-custom-domain') ? '' : `/shops/${slug}`;
  
  // Check if logged in
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect(`${basePath}/login?callbackUrl=${encodeURIComponent(`${basePath}/account`)}`);
  }

  // Fetch recent orders (server-side)
  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.customerId, customer.id))
    .orderBy(desc(orders.createdAt))
    .limit(5);

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'ממתין לאישור', color: 'bg-amber-100 text-amber-700' },
    confirmed: { label: 'אושר', color: 'bg-blue-100 text-blue-700' },
    processing: { label: 'בהכנה', color: 'bg-purple-100 text-purple-700' },
    shipped: { label: 'נשלח', color: 'bg-indigo-100 text-indigo-700' },
    delivered: { label: 'נמסר', color: 'bg-green-100 text-green-700' },
    cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-700' },
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-light tracking-wide mb-2">
            שלום, {customer.firstName || 'אורח'}! 👋
          </h1>
          <p className="text-gray-500 text-sm">
            ברוך הבא לאיזור האישי שלך
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center text-xl font-medium">
                  {customer.firstName ? customer.firstName[0].toUpperCase() : customer.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">
                    {customer.firstName} {customer.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{customer.email}</p>
                </div>
              </div>

              <nav className="space-y-1">
                <Link
                  href={`${basePath}/account`}
                  className="flex items-center gap-3 px-4 py-2.5 bg-gray-100 text-black rounded-lg text-sm"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  סקירה כללית
                </Link>
                <Link
                  href={`${basePath}/account/orders`}
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                  ההזמנות שלי
                </Link>
                <Link
                  href={`${basePath}/account/details`}
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  פרטים אישיים
                </Link>
                <Link
                  href={`${basePath}/account/returns`}
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 14l-4-4 4-4"/>
                    <path d="M5 10h11a4 4 0 1 1 0 8h-1"/>
                  </svg>
                  החזרות והחלפות
                </Link>
                <Link
                  href={`${basePath}/account/credit`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="M6 12h4"/>
                    </svg>
                    קרדיט
                  </div>
                  {Number(customer.creditBalance) > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      ₪{Number(customer.creditBalance).toFixed(2)}
                    </span>
                  )}
                </Link>
                {!customer.passwordHash && (
                  <Link
                    href={`${basePath}/account/security`}
                    className="flex items-center gap-3 px-4 py-2.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg text-sm transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    הגדר סיסמה
                  </Link>
                )}
              </nav>

              {/* Logout - Client Component */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <CustomerAccountActions basePath={basePath} />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Link
                href={`${basePath}/account/orders`}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                </div>
                <h3 className="font-medium text-sm">ההזמנות שלי</h3>
                <p className="text-xs text-gray-500 mt-1">צפה בהזמנות ומעקב משלוחים</p>
              </Link>
              
              <Link
                href={basePath || '/'}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                </div>
                <h3 className="font-medium text-sm">המשך בקניות</h3>
                <p className="text-xs text-gray-500 mt-1">חזור לחנות</p>
              </Link>
            </div>

            {/* Recent Orders */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-medium">הזמנות אחרונות</h2>
                <Link
                  href={`${basePath}/account/orders`}
                  className="text-sm text-gray-500 hover:text-black transition-colors"
                >
                  הצג הכל ←
                </Link>
              </div>
              
              {recentOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">אין הזמנות עדיין</p>
                  <Link
                    href={basePath || '/'}
                    className="inline-block btn-primary text-sm px-6"
                  >
                    התחל לקנות
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentOrders.map((order) => {
                    const status = statusLabels[order.status] || statusLabels.pending;
                    return (
                      <Link
                        key={order.id}
                        href={`${basePath}/account/orders/${order.orderNumber}`}
                        className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">הזמנה #{order.orderNumber}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(order.createdAt).toLocaleDateString('he-IL')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="font-medium text-sm">
                            ₪{Number(order.total).toFixed(2)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Account Status */}
            {!customer.passwordHash && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-amber-800 text-sm">הגדר סיסמה לחשבון</h3>
                  <p className="text-xs text-amber-700 mt-1">
                    כרגע אתה מתחבר רק עם קוד חד-פעמי. הגדר סיסמה להתחברות מהירה יותר.
                  </p>
                  <Link
                    href={`${basePath}/account/security`}
                    className="inline-block mt-2 text-xs font-medium text-amber-800 hover:underline"
                  >
                    הגדר סיסמה ←
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

