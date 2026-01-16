import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { stores, storeSubscriptions, platformInvoices } from '@/lib/db/schema';
import { sql, desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { getSubscriptionPricing, getFeeRates } from '@/lib/billing/platform-settings';
import { CreditCard, Store, FileText, TrendingUp, AlertCircle, Check, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PlatformBillingPage() {
  const session = await auth();
  
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    redirect('/login');
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get billing stats
  const [billingStats] = await db
    .select({
      totalInvoices: sql<number>`COUNT(*)::int`,
      paidInvoices: sql<number>`COUNT(*) FILTER (WHERE ${platformInvoices.status} = 'paid')::int`,
      pendingInvoices: sql<number>`COUNT(*) FILTER (WHERE ${platformInvoices.status} IN ('pending', 'draft'))::int`,
      failedInvoices: sql<number>`COUNT(*) FILTER (WHERE ${platformInvoices.status} = 'failed')::int`,
      totalRevenue: sql<string>`COALESCE(SUM(${platformInvoices.totalAmount}::numeric) FILTER (WHERE ${platformInvoices.status} = 'paid'), 0)`,
      monthlyRevenue: sql<string>`COALESCE(SUM(${platformInvoices.totalAmount}::numeric) FILTER (WHERE ${platformInvoices.status} = 'paid' AND ${platformInvoices.paidAt} >= ${thirtyDaysAgo}), 0)`,
    })
    .from(platformInvoices);

  // Get subscription stats
  const [subscriptionStats] = await db
    .select({
      totalSubscriptions: sql<number>`COUNT(*)::int`,
      trialSubscriptions: sql<number>`COUNT(*) FILTER (WHERE ${storeSubscriptions.status} = 'trial')::int`,
      activeSubscriptions: sql<number>`COUNT(*) FILTER (WHERE ${storeSubscriptions.status} = 'active')::int`,
      pastDueSubscriptions: sql<number>`COUNT(*) FILTER (WHERE ${storeSubscriptions.status} = 'past_due')::int`,
      brandingPlans: sql<number>`COUNT(*) FILTER (WHERE ${storeSubscriptions.plan} = 'branding')::int`,
      quickshopPlans: sql<number>`COUNT(*) FILTER (WHERE ${storeSubscriptions.plan} = 'quickshop')::int`,
    })
    .from(storeSubscriptions);

  // Get stores with their billing summary
  const storesWithBilling = await db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      plan: storeSubscriptions.plan,
      status: storeSubscriptions.status,
      trialEndsAt: storeSubscriptions.trialEndsAt,
      currentPeriodEnd: storeSubscriptions.currentPeriodEnd,
      hasPaymentMethod: sql<boolean>`${storeSubscriptions.payplusTokenUid} IS NOT NULL`,
      cardLastFour: storeSubscriptions.cardLastFour,
      totalPaid: sql<string>`COALESCE((
        SELECT SUM(total_amount::numeric) 
        FROM platform_invoices pi 
        WHERE pi.store_id = ${stores.id} AND pi.status = 'paid'
      ), 0)`,
      pendingFees: sql<string>`COALESCE((
        SELECT SUM(total_amount::numeric) 
        FROM platform_invoices pi 
        WHERE pi.store_id = ${stores.id} AND pi.status IN ('pending', 'failed')
      ), 0)`,
      transactionVolume: sql<string>`COALESCE((
        SELECT SUM(total::numeric) 
        FROM orders o 
        WHERE o.store_id = ${stores.id} AND o.financial_status = 'paid'
      ), 0)`,
    })
    .from(stores)
    .leftJoin(storeSubscriptions, eq(stores.id, storeSubscriptions.storeId))
    .orderBy(desc(stores.createdAt))
    .limit(50);

  // Get recent invoices
  const recentInvoices = await db
    .select({
      id: platformInvoices.id,
      invoiceNumber: platformInvoices.invoiceNumber,
      type: platformInvoices.type,
      status: platformInvoices.status,
      totalAmount: platformInvoices.totalAmount,
      storeName: stores.name,
      storeSlug: stores.slug,
      issuedAt: platformInvoices.issuedAt,
      paidAt: platformInvoices.paidAt,
    })
    .from(platformInvoices)
    .leftJoin(stores, eq(platformInvoices.storeId, stores.id))
    .orderBy(desc(platformInvoices.createdAt))
    .limit(20);

  // Get pricing from DB for MRR calculation
  const subscriptionPricing = await getSubscriptionPricing();
  const feeRates = await getFeeRates();
  const vatMultiplier = 1 + feeRates.vatRate;

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'past_due': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'active': return 'פעיל';
      case 'trial': return 'נסיון';
      case 'past_due': return 'חוב';
      case 'cancelled': return 'מבוטל';
      case 'expired': return 'פג תוקף';
      default: return 'לא מוגדר';
    }
  };

  const getPlanLabel = (plan: string | null) => {
    switch (plan) {
      case 'branding': return 'תדמית';
      case 'quickshop': return 'קוויק שופ';
      case 'trial': return 'נסיון';
      default: return 'לא מוגדר';
    }
  };

  const getInvoiceTypeLabel = (type: string) => {
    switch (type) {
      case 'subscription': return 'מנוי';
      case 'transaction_fee': return 'עמלות';
      case 'plugin': return 'תוספים';
      default: return type;
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getInvoiceStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'שולם';
      case 'pending': return 'ממתין';
      case 'failed': return 'נכשל';
      case 'cancelled': return 'בוטל';
      case 'draft': return 'טיוטה';
      default: return status;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3 mb-1">
            <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
            ניהול חיובים
          </h1>
          <p className="text-sm sm:text-base text-gray-500">מעקב אחר הכנסות, מנויים וחשבוניות</p>
        </div>
      </div>

      {/* Revenue Stats - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
          <p className="text-xl sm:text-3xl font-bold text-green-600">{formatCurrency(billingStats.totalRevenue)}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">סה״כ הכנסות</p>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
          <p className="text-xl sm:text-3xl font-bold text-blue-600">{formatCurrency(billingStats.monthlyRevenue)}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">הכנסות החודש</p>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
          <p className="text-xl sm:text-3xl font-bold text-gray-900">{billingStats.paidInvoices}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">חשבוניות שולמו</p>
          <p className="text-[10px] sm:text-xs text-yellow-600 mt-1 sm:mt-2">{billingStats.pendingInvoices} ממתינות</p>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
          <p className="text-xl sm:text-3xl font-bold text-red-600">{billingStats.failedInvoices}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">חיובים נכשלו</p>
        </div>
      </div>

      {/* Subscription Stats - Responsive */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{subscriptionStats.totalSubscriptions}</p>
          <p className="text-[10px] sm:text-xs text-gray-500">סה״כ</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-green-600">{subscriptionStats.activeSubscriptions}</p>
          <p className="text-[10px] sm:text-xs text-gray-500">פעילים</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-blue-600">{subscriptionStats.trialSubscriptions}</p>
          <p className="text-[10px] sm:text-xs text-gray-500">בנסיון</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-red-600">{subscriptionStats.pastDueSubscriptions}</p>
          <p className="text-[10px] sm:text-xs text-gray-500">בחוב</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-purple-600">{subscriptionStats.brandingPlans}</p>
          <p className="text-[10px] sm:text-xs text-gray-500">תדמית</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-indigo-600">{subscriptionStats.quickshopPlans}</p>
          <p className="text-[10px] sm:text-xs text-gray-500">קוויק שופ</p>
        </div>
      </div>

      {/* Tables Grid - Stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Stores Billing */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Store className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">חנויות וחיובים</h2>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right p-3 text-xs font-medium text-gray-500">חנות</th>
                  <th className="text-right p-3 text-xs font-medium text-gray-500">מסלול</th>
                  <th className="text-right p-3 text-xs font-medium text-gray-500">סטטוס</th>
                  <th className="text-right p-3 text-xs font-medium text-gray-500">שולם</th>
                  <th className="text-right p-3 text-xs font-medium text-gray-500">פתוח</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {storesWithBilling.slice(0, 10).map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <Link 
                        href={`/admin/billing/stores/${store.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {store.name}
                      </Link>
                      <p className="text-xs text-gray-500">/{store.slug}</p>
                    </td>
                    <td className="p-3 text-gray-600">{getPlanLabel(store.plan)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(store.status)}`}>
                        {getStatusLabel(store.status)}
                      </span>
                    </td>
                    <td className="p-3 text-green-600 font-medium">{formatCurrency(store.totalPaid)}</td>
                    <td className="p-3">
                      {Number(store.pendingFees) > 0 && (
                        <span className="text-red-600">{formatCurrency(store.pendingFees)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-gray-100">
            {storesWithBilling.slice(0, 8).map((store) => (
              <Link 
                key={store.id}
                href={`/admin/billing/stores/${store.id}`}
                className="block p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{store.name}</span>
                  <span className={`px-2 py-0.5 text-[10px] rounded-full ${getStatusColor(store.status)}`}>
                    {getStatusLabel(store.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{getPlanLabel(store.plan)}</span>
                  <span className="text-green-600 font-medium">{formatCurrency(store.totalPaid)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">חשבוניות אחרונות</h2>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right p-3 text-xs font-medium text-gray-500">מספר</th>
                  <th className="text-right p-3 text-xs font-medium text-gray-500">חנות</th>
                  <th className="text-right p-3 text-xs font-medium text-gray-500">סוג</th>
                  <th className="text-right p-3 text-xs font-medium text-gray-500">סכום</th>
                  <th className="text-right p-3 text-xs font-medium text-gray-500">סטטוס</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentInvoices.slice(0, 10).map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs">{invoice.invoiceNumber}</td>
                    <td className="p-3 text-gray-600">{invoice.storeName}</td>
                    <td className="p-3 text-xs text-gray-500">{getInvoiceTypeLabel(invoice.type)}</td>
                    <td className="p-3 font-medium">{formatCurrency(invoice.totalAmount)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getInvoiceStatusColor(invoice.status)}`}>
                        {getInvoiceStatusLabel(invoice.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-gray-100">
            {recentInvoices.slice(0, 8).map((invoice) => (
              <div key={invoice.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-gray-600">{invoice.invoiceNumber}</span>
                  <span className={`px-2 py-0.5 text-[10px] rounded-full ${getInvoiceStatusColor(invoice.status)}`}>
                    {getInvoiceStatusLabel(invoice.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{invoice.storeName}</span>
                  <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MRR Calculation */}
      <div className="mt-6 sm:mt-8 bg-linear-to-r from-green-50 to-blue-50 rounded-xl sm:rounded-2xl border border-green-200 p-4 sm:p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          הכנסה חודשית צפויה (MRR)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <p className="text-xs sm:text-sm text-gray-600">מנויי תדמית ({subscriptionStats.brandingPlans}) × ₪{subscriptionPricing.branding}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              {formatCurrency(subscriptionStats.brandingPlans * subscriptionPricing.branding * vatMultiplier)}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">מנויי קוויק שופ ({subscriptionStats.quickshopPlans}) × ₪{subscriptionPricing.quickshop}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              {formatCurrency(subscriptionStats.quickshopPlans * subscriptionPricing.quickshop * vatMultiplier)}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">סה״כ MRR</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">
              {formatCurrency(
                (subscriptionStats.brandingPlans * subscriptionPricing.branding * vatMultiplier) +
                (subscriptionStats.quickshopPlans * subscriptionPricing.quickshop * vatMultiplier)
              )}
            </p>
          </div>
        </div>
        <p className="text-[10px] sm:text-xs text-gray-500 mt-4">
          * לא כולל עמלות עסקאות ({(feeRates.transactionFee * 100).toFixed(1)}%) ותוספים
        </p>
      </div>
    </div>
  );
}
