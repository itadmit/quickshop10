import { db } from '@/lib/db';
import { stores, users, storeSubscriptions, orders, platformInvoices, storeEmailSubscriptions } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Store, User, Calendar, Globe, CreditCard, DollarSign, ExternalLink, Mail, Settings } from 'lucide-react';
import { StoreEditForm } from './store-edit-form';
import { OwnerPasswordForm } from './owner-password-form';
import { CustomPricingForm } from './custom-pricing-form';
import { SubscriptionManagementForm } from './subscription-management-form';
import { EmailQuotaForm } from './email-quota-form';
import { getSetting } from '@/lib/billing/platform-settings';

export const dynamic = 'force-dynamic';

interface StoreDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StoreDetailPage({ params }: StoreDetailPageProps) {
  const { id } = await params;

  // Get store with owner
  const store = await db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      plan: stores.plan,
      isActive: stores.isActive,
      createdAt: stores.createdAt,
      customDomain: stores.customDomain,
      logoUrl: stores.logoUrl,
      ownerId: stores.ownerId,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(stores)
    .leftJoin(users, eq(stores.ownerId, users.id))
    .where(eq(stores.id, id))
    .then(rows => rows[0]);

  if (!store) {
    notFound();
  }

  // Get subscription
  const subscription = await db.query.storeSubscriptions.findFirst({
    where: eq(storeSubscriptions.storeId, store.id),
  });

  // Get default pricing from platform settings
  const defaultBrandingPrice = await getSetting('subscription_branding_price');
  const defaultQuickshopPrice = await getSetting('subscription_quickshop_price');
  const defaultPrice = subscription?.plan === 'branding' ? defaultBrandingPrice : defaultQuickshopPrice;

  // Get order stats (only count paid orders for revenue)
  const [orderStats] = await db
    .select({
      totalOrders: sql<number>`COUNT(*) FILTER (WHERE ${orders.financialStatus} = 'paid')::int`,
      totalRevenue: sql<string>`COALESCE(SUM(${orders.total}::numeric) FILTER (WHERE ${orders.financialStatus} = 'paid'), 0)`,
      paidOrders: sql<number>`COUNT(*) FILTER (WHERE ${orders.financialStatus} = 'paid')::int`,
    })
    .from(orders)
    .where(eq(orders.storeId, store.id));

  // Get recent invoices
  const recentInvoices = await db
    .select()
    .from(platformInvoices)
    .where(eq(platformInvoices.storeId, store.id))
    .orderBy(desc(platformInvoices.createdAt))
    .limit(5);

  // Get email subscription
  const emailSubscription = await db.query.storeEmailSubscriptions.findFirst({
    where: eq(storeEmailSubscriptions.storeId, store.id),
  });

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
    });
  };

  const getPlanInfo = (plan: string | null) => {
    switch (plan) {
      case 'quickshop':
        return { name: 'קוויק שופ', price: '₪399', color: 'emerald' };
      case 'branding':
        return { name: 'תדמית', price: '₪299', color: 'purple' };
      case 'trial':
        return { name: 'נסיון', price: 'חינם', color: 'blue' };
      default:
        return { name: 'ללא', price: '—', color: 'gray' };
    }
  };

  const planInfo = getPlanInfo(subscription?.plan || null);

  const getStatusInfo = (status: string | null) => {
    switch (status) {
      case 'active':
        return { name: 'פעיל', color: 'green' };
      case 'trial':
        return { name: 'נסיון', color: 'blue' };
      case 'past_due':
        return { name: 'באיחור', color: 'yellow' };
      case 'cancelled':
        return { name: 'מבוטל', color: 'red' };
      case 'expired':
        return { name: 'פג תוקף', color: 'red' };
      default:
        return { name: 'לא ידוע', color: 'gray' };
    }
  };

  const statusInfo = getStatusInfo(subscription?.status || null);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 sm:mb-6">
        <Link href="/admin/stores" className="hover:text-emerald-600 transition-colors">
          חנויות
        </Link>
        <ArrowRight className="w-4 h-4 rotate-180" />
        <span className="text-gray-900 font-medium truncate">{store.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Store Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-linear-to-br from-emerald-500 to-green-600 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden border-2 border-white/30 flex-shrink-0">
                  {store.logoUrl ? (
                    <img src={store.logoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 truncate">{store.name}</h1>
                  <p className="text-white/80 text-sm sm:text-base">/{store.slug}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-${planInfo.color}-500 text-white`}>
                      {planInfo.name}
                    </span>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                      store.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {store.isActive ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 self-start sm:self-auto">
                  <Link
                    href={`/shops/${store.slug}`}
                    target="_blank"
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    title="צפה בחנות"
                  >
                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </Link>
                  <Link
                    href={`/shops/${store.slug}/admin`}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    title="ניהול חנות"
                  >
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
              <div className="p-3 sm:p-4 text-center">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{orderStats?.totalOrders || 0}</p>
                <p className="text-xs sm:text-sm text-gray-500">הזמנות</p>
              </div>
              <div className="p-3 sm:p-4 text-center">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{orderStats?.paidOrders || 0}</p>
                <p className="text-xs sm:text-sm text-gray-500">שולמו</p>
              </div>
              <div className="p-3 sm:p-4 text-center">
                <p className="text-lg sm:text-2xl font-bold text-emerald-600">{formatCurrency(orderStats?.totalRevenue || 0)}</p>
                <p className="text-xs sm:text-sm text-gray-500">הכנסות</p>
              </div>
            </div>

            {/* Details */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <DetailRow icon={Globe} label="דומיין" value={store.customDomain || `${store.slug}.quickshop.co.il`} />
              <DetailRow icon={Calendar} label="תאריך יצירה" value={formatDate(store.createdAt)} />
              {store.ownerEmail && (
                <DetailRow icon={User} label="בעלים" value={`${store.ownerName || 'ללא שם'} (${store.ownerEmail})`} />
              )}
            </div>
          </div>

          {/* Subscription Info */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-gray-900">מנוי וחיוב</h2>
              </div>
              <Link 
                href={`/admin/billing/stores/${store.id}`}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                פרטים מלאים →
              </Link>
            </div>
            
            {subscription ? (
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">מסלול נוכחי</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-${planInfo.color}-100 text-${planInfo.color}-700`}>
                        {planInfo.name}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-600">{planInfo.price}/חודש</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">סטטוס</p>
                    <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
                      {statusInfo.name}
                    </span>
                  </div>
                  {subscription.trialEndsAt && subscription.status === 'trial' && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">נסיון מסתיים</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">{formatDate(subscription.trialEndsAt)}</p>
                    </div>
                  )}
                  {subscription.currentPeriodEnd && subscription.status === 'active' && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">חידוש הבא</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">{formatDate(subscription.currentPeriodEnd)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">אמצעי תשלום</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900">
                      {subscription.payplusTokenUid ? (
                        <span className="text-emerald-600">✓ כרטיס שמור</span>
                      ) : (
                        <span className="text-gray-400">לא הוגדר</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8 text-center">
                <CreditCard className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm sm:text-base">אין מנוי פעיל</p>
              </div>
            )}
          </div>

          {/* Recent Invoices */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-gray-900">חשבוניות אחרונות</h2>
            </div>
            
            {recentInvoices.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {invoice.type === 'subscription' ? 'מנוי חודשי' :
                         invoice.type === 'transaction_fee' ? 'עמלות עסקאות' : 'תוספים'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">{formatDate(invoice.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">{formatCurrency(invoice.totalAmount)}</span>
                      <span className={`px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full font-medium ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {invoice.status === 'paid' ? 'שולם' :
                         invoice.status === 'pending' ? 'ממתין' : 'נכשל'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 sm:p-8 text-center">
                <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm sm:text-base">אין חשבוניות עדיין</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Edit Form */}
        <div className="space-y-4 sm:space-y-6">
          <StoreEditForm store={{
            id: store.id,
            name: store.name,
            slug: store.slug,
            isActive: store.isActive,
            customDomain: store.customDomain,
          }} />

          {/* Custom Pricing - Available for all stores including trial */}
          <CustomPricingForm
            storeId={store.id}
            currentPrice={subscription?.customMonthlyPrice || null}
            currentFeePercentage={subscription?.customFeePercentage || null}
            defaultPrice={defaultPrice}
            planName={subscription?.plan === 'trial' ? 'נסיון' : planInfo.name}
            isTrial={subscription?.status === 'trial'}
          />

          {/* Subscription Management */}
          <SubscriptionManagementForm
            storeId={store.id}
            storeName={store.name}
            subscription={subscription ? {
              id: subscription.id,
              plan: subscription.plan,
              status: subscription.status,
              trialEndsAt: subscription.trialEndsAt,
              currentPeriodEnd: subscription.currentPeriodEnd,
              hasPaymentMethod: !!subscription.payplusTokenUid,
              billingType: 'automatic', // Default to automatic billing
            } : null}
          />

          {/* Email Quota Management */}
          <EmailQuotaForm
            storeId={store.id}
            emailSubscription={emailSubscription ? {
              id: emailSubscription.id,
              packageSlug: emailSubscription.packageSlug,
              status: emailSubscription.status,
              emailsUsedThisPeriod: emailSubscription.emailsUsedThisPeriod,
              emailsLimit: emailSubscription.emailsLimit,
              currentPeriodEnd: emailSubscription.currentPeriodEnd,
            } : null}
          />

          {/* Owner Password Change */}
          <OwnerPasswordForm 
            storeId={store.id}
            ownerId={store.ownerId}
            ownerEmail={store.ownerEmail}
          />

          {/* Quick Actions */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">פעולות מהירות</h3>
            <div className="space-y-2">
              <Link
                href={`/shops/${store.slug}/admin`}
                className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-colors"
              >
                <Settings className="w-4 h-4" />
                ניהול חנות
              </Link>
              <Link
                href={`/shops/${store.slug}`}
                target="_blank"
                className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                צפה בחנות
              </Link>
              {store.ownerEmail && (
                <a
                  href={`mailto:${store.ownerEmail}`}
                  className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  שלח אימייל לבעלים
                </a>
              )}
              <button
                className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg sm:rounded-xl transition-colors"
              >
                <Store className="w-4 h-4" />
                השעה חנות
              </button>
            </div>
          </div>

          {/* Owner Info */}
          {store.ownerId && (
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">בעל החנות</h3>
              <Link
                href={`/admin/users/${store.ownerId}`}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium text-sm">
                    {(store.ownerName || store.ownerEmail)?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{store.ownerName || 'ללא שם'}</p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{store.ownerEmail}</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ 
  icon: Icon, 
  label, 
  value,
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{value}</p>
      </div>
    </div>
  );
}
