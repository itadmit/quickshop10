import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { stores, storeSubscriptions, platformInvoices, storePlugins, orders } from '@/lib/db/schema';
import { sql, desc, eq, gte, and, count, sum } from 'drizzle-orm';
import Link from 'next/link';
import { getSubscriptionPricing, getFeeRates } from '@/lib/billing/platform-settings';
import { CreditCard } from 'lucide-react';

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

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('he-IL');
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
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-1">
            <CreditCard className="w-7 h-7 text-emerald-600" />
            ניהול חיובים
          </h1>
          <p className="text-gray-500">מעקב אחר הכנסות, מנויים וחשבוניות</p>
        </div>
      </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-3xl font-bold text-green-600">{formatCurrency(billingStats.totalRevenue)}</p>
            <p className="text-sm text-gray-500 mt-1">סה״כ הכנסות</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(billingStats.monthlyRevenue)}</p>
            <p className="text-sm text-gray-500 mt-1">הכנסות החודש</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-3xl font-bold text-gray-900">{billingStats.paidInvoices}</p>
            <p className="text-sm text-gray-500 mt-1">חשבוניות שולמו</p>
            <p className="text-xs text-yellow-600 mt-2">{billingStats.pendingInvoices} ממתינות</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-3xl font-bold text-red-600">{billingStats.failedInvoices}</p>
            <p className="text-sm text-gray-500 mt-1">חיובים נכשלו</p>
          </div>
        </div>

        {/* Subscription Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{subscriptionStats.totalSubscriptions}</p>
            <p className="text-xs text-gray-500">סה״כ מנויים</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{subscriptionStats.activeSubscriptions}</p>
            <p className="text-xs text-gray-500">פעילים</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{subscriptionStats.trialSubscriptions}</p>
            <p className="text-xs text-gray-500">בנסיון</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{subscriptionStats.pastDueSubscriptions}</p>
            <p className="text-xs text-gray-500">בחוב</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{subscriptionStats.brandingPlans}</p>
            <p className="text-xs text-gray-500">תדמית</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{subscriptionStats.quickshopPlans}</p>
            <p className="text-xs text-gray-500">קוויק שופ</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Stores Billing Table */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold">חנויות וחיובים</h2>
            </div>
            <div className="overflow-x-auto">
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
                  {storesWithBilling.slice(0, 15).map((store) => (
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
                      <td className="p-3">
                        <span className="text-gray-600">{getPlanLabel(store.plan)}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(store.status)}`}>
                          {getStatusLabel(store.status)}
                        </span>
                        {store.hasPaymentMethod && (
                          <span className="mr-1 text-xs text-green-600">💳</span>
                        )}
                      </td>
                      <td className="p-3 text-green-600">{formatCurrency(store.totalPaid)}</td>
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
          </div>

          {/* Recent Invoices */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold">חשבוניות אחרונות</h2>
            </div>
            <div className="overflow-x-auto">
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
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono text-xs">{invoice.invoiceNumber}</td>
                      <td className="p-3 text-gray-600">{invoice.storeName}</td>
                      <td className="p-3">
                        <span className="text-xs text-gray-500">
                          {getInvoiceTypeLabel(invoice.type)}
                        </span>
                      </td>
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
          </div>
        </div>

        {/* MRR Calculation */}
        <div className="mt-8 bg-linear-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">📊 הכנסה חודשית צפויה (MRR)</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">מנויי תדמית ({subscriptionStats.brandingPlans}) × ₪{subscriptionPricing.branding}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(subscriptionStats.brandingPlans * subscriptionPricing.branding * vatMultiplier)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">מנויי קוויק שופ ({subscriptionStats.quickshopPlans}) × ₪{subscriptionPricing.quickshop}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(subscriptionStats.quickshopPlans * subscriptionPricing.quickshop * vatMultiplier)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">סה״כ MRR</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(
                  (subscriptionStats.brandingPlans * subscriptionPricing.branding * vatMultiplier) +
                  (subscriptionStats.quickshopPlans * subscriptionPricing.quickshop * vatMultiplier)
                )}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            * לא כולל עמלות עסקאות ({(feeRates.transactionFee * 100).toFixed(1)}%) ותוספים
          </p>
        </div>
    </div>
  );
}

