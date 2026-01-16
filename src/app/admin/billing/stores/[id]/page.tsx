import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { 
  stores, 
  storeSubscriptions, 
  platformInvoices, 
  platformInvoiceItems,
  storeTransactionFees,
  storePlugins,
  pluginPricing,
  orders 
} from '@/lib/db/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowRight, CreditCard, Package, DollarSign, FileText, Plug } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StoreBillingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    redirect('/login');
  }

  const { id: storeId } = await params;

  // Get store with subscription
  const store = await db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      createdAt: stores.createdAt,
      subscription: {
        id: storeSubscriptions.id,
        plan: storeSubscriptions.plan,
        status: storeSubscriptions.status,
        trialEndsAt: storeSubscriptions.trialEndsAt,
        currentPeriodStart: storeSubscriptions.currentPeriodStart,
        currentPeriodEnd: storeSubscriptions.currentPeriodEnd,
        payplusCustomerUid: storeSubscriptions.payplusCustomerUid,
        payplusTokenUid: storeSubscriptions.payplusTokenUid,
        cardLastFour: storeSubscriptions.cardLastFour,
        cardBrand: storeSubscriptions.cardBrand,
        cardExpiry: storeSubscriptions.cardExpiry,
        billingEmail: storeSubscriptions.billingEmail,
        billingName: storeSubscriptions.billingName,
        cancelledAt: storeSubscriptions.cancelledAt,
        customMonthlyPrice: storeSubscriptions.customMonthlyPrice,
        customFeePercentage: storeSubscriptions.customFeePercentage,
      },
    })
    .from(stores)
    .leftJoin(storeSubscriptions, eq(stores.id, storeSubscriptions.storeId))
    .where(eq(stores.id, storeId))
    .then(rows => rows[0]);

  if (!store) {
    notFound();
  }

  // Get all invoices
  const allInvoices = await db
    .select()
    .from(platformInvoices)
    .where(eq(platformInvoices.storeId, storeId))
    .orderBy(desc(platformInvoices.createdAt));

  // Get transaction fees summary
  const transactionFeesData = await db
    .select()
    .from(storeTransactionFees)
    .where(eq(storeTransactionFees.storeId, storeId))
    .orderBy(desc(storeTransactionFees.periodEnd))
    .limit(10);

  // Get active plugins with pricing
  const activePlugins = await db
    .select({
      pluginSlug: storePlugins.pluginSlug,
      isActive: storePlugins.isActive,
      installedAt: storePlugins.installedAt,
      subscriptionStatus: storePlugins.subscriptionStatus,
      lastBillingDate: storePlugins.lastBillingDate,
      nextBillingDate: storePlugins.nextBillingDate,
      monthlyPrice: pluginPricing.monthlyPrice,
    })
    .from(storePlugins)
    .leftJoin(pluginPricing, eq(storePlugins.pluginSlug, pluginPricing.pluginSlug))
    .where(eq(storePlugins.storeId, storeId));

  // Calculate current period transactions
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const [transactionSummary] = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
      total: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)`,
    })
    .from(orders)
    .where(and(
      eq(orders.storeId, storeId),
      eq(orders.financialStatus, 'paid'),
      gte(orders.paidAt, twoWeeksAgo)
    ));

  // Calculate totals
  const totalPaid = allInvoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + Number(i.totalAmount), 0);

  const totalPending = allInvoices
    .filter(i => ['pending', 'failed'].includes(i.status))
    .reduce((sum, i) => sum + Number(i.totalAmount), 0);

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 2,
    }).format(Number(amount));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'past_due': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string | null | undefined) => {
    switch (status) {
      case 'active': return 'פעיל';
      case 'trial': return 'נסיון';
      case 'past_due': return 'חוב';
      case 'cancelled': return 'מבוטל';
      case 'expired': return 'פג תוקף';
      case 'paid': return 'שולם';
      case 'pending': return 'ממתין';
      case 'failed': return 'נכשל';
      case 'draft': return 'טיוטה';
      default: return status || 'לא מוגדר';
    }
  };

  const getPlanLabel = (plan: string | null | undefined) => {
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
      case 'transaction_fee': return 'עמלות עסקאות';
      case 'plugin': return 'תוספים';
      default: return type;
    }
  };

  // Get fee rate (custom or default 0.5%)
  const feeRate = store.subscription?.customFeePercentage 
    ? Number(store.subscription.customFeePercentage) 
    : 0.005;
  const currentFeeAmount = Number(transactionSummary?.total || 0) * feeRate * 1.18;

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/billing" className="hover:text-emerald-600 flex items-center gap-1">
          <ArrowRight className="w-4 h-4" />
          חיובים
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{store.name}</span>
      </div>

      {/* Store Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <CreditCard className="w-7 h-7 text-emerald-600" />
              {store.name}
            </h1>
            <p className="text-gray-500">/{store.slug}</p>
            <p className="text-sm text-gray-400 mt-1">נוצר: {formatDate(store.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getStatusColor(store.subscription?.status)}`}>
              {getStatusLabel(store.subscription?.status)}
            </span>
            <Link 
              href={`/admin/stores/${storeId}`}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              הגדרות חנות
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Subscription Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">פרטי מנוי</h2>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">מסלול:</span>
              <span className="font-medium">{getPlanLabel(store.subscription?.plan)}</span>
            </div>
            
            {store.subscription?.customMonthlyPrice && (
              <div className="flex justify-between">
                <span className="text-gray-500">מחיר מותאם:</span>
                <span className="font-medium text-amber-600">
                  {formatCurrency(store.subscription.customMonthlyPrice)}
                </span>
              </div>
            )}
            
            {store.subscription?.customFeePercentage && (
              <div className="flex justify-between">
                <span className="text-gray-500">עמלה מותאמת:</span>
                <span className="font-medium text-amber-600">
                  {(Number(store.subscription.customFeePercentage) * 100).toFixed(1)}%
                </span>
              </div>
            )}
            
            {store.subscription?.status === 'trial' && store.subscription?.trialEndsAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">נסיון עד:</span>
                <span className="font-medium text-blue-600">
                  {formatDate(store.subscription.trialEndsAt)}
                </span>
              </div>
            )}
            
            {store.subscription?.currentPeriodEnd && (
              <div className="flex justify-between">
                <span className="text-gray-500">תקופה נוכחית:</span>
                <span className="font-medium">{formatDate(store.subscription.currentPeriodEnd)}</span>
              </div>
            )}
          </div>

          {/* Payment Method */}
          {store.subscription?.cardLastFour && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                אמצעי תשלום
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-medium">
                  {store.subscription.cardBrand || 'Card'}
                </div>
                <span className="font-mono">•••• {store.subscription.cardLastFour}</span>
                {store.subscription.cardExpiry && (
                  <span className="text-gray-400 text-sm">{store.subscription.cardExpiry}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">סיכום כספי</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-xs text-green-600 mb-1">סה״כ שולם</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalPaid)}</p>
            </div>
            
            {totalPending > 0 && (
              <div className="p-4 bg-red-50 rounded-xl">
                <p className="text-xs text-red-600 mb-1">חוב פתוח</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(totalPending)}</p>
              </div>
            )}
            
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-600 mb-1">חשבוניות</p>
              <p className="text-lg font-medium">{allInvoices.length} חשבוניות</p>
            </div>
          </div>
        </div>

        {/* Current Period Fees */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">עמלות תקופה נוכחית</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">14 ימים אחרונים</p>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">עסקאות ששולמו:</span>
              <span className="font-medium">{transactionSummary?.count || 0}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">סה״כ מכירות:</span>
              <span className="font-medium">{formatCurrency(transactionSummary?.total || 0)}</span>
            </div>
            
            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-600">עמלה ({(feeRate * 100).toFixed(1)}% + מע״מ):</span>
                <span className="font-bold text-lg">{formatCurrency(currentFeeAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Plugins */}
      {activePlugins.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Plug className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">תוספים פעילים</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {activePlugins.map((plugin) => (
              <div key={plugin.pluginSlug} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{plugin.pluginSlug}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    plugin.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {plugin.isActive ? 'פעיל' : 'לא פעיל'}
                  </span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(plugin.monthlyPrice || 0)}/חודש</p>
                {plugin.nextBillingDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    חיוב הבא: {formatDate(plugin.nextBillingDate)}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-gray-600">סה״כ תוספים חודשי:</span>
            <span className="font-bold text-xl">
              {formatCurrency(activePlugins.reduce((sum, p) => sum + Number(p.monthlyPrice || 0), 0) * 1.18)}
            </span>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-gray-900">היסטוריית חשבוניות</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-right p-4 text-sm font-medium text-gray-600">מספר</th>
                <th className="text-right p-4 text-sm font-medium text-gray-600">סוג</th>
                <th className="text-right p-4 text-sm font-medium text-gray-600">תקופה</th>
                <th className="text-right p-4 text-sm font-medium text-gray-600">סכום</th>
                <th className="text-right p-4 text-sm font-medium text-gray-600">מע״מ</th>
                <th className="text-right p-4 text-sm font-medium text-gray-600">סה״כ</th>
                <th className="text-right p-4 text-sm font-medium text-gray-600">סטטוס</th>
                <th className="text-right p-4 text-sm font-medium text-gray-600">תאריך</th>
                <th className="text-right p-4 text-sm font-medium text-gray-600">חשבונית</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono text-sm">{invoice.invoiceNumber}</td>
                  <td className="p-4 text-sm">{getInvoiceTypeLabel(invoice.type)}</td>
                  <td className="p-4 text-sm text-gray-500">
                    {invoice.periodStart && invoice.periodEnd ? (
                      `${formatDate(invoice.periodStart)} - ${formatDate(invoice.periodEnd)}`
                    ) : '-'}
                  </td>
                  <td className="p-4 text-sm">{formatCurrency(invoice.subtotal)}</td>
                  <td className="p-4 text-sm text-gray-500">{formatCurrency(invoice.vatAmount)}</td>
                  <td className="p-4 font-medium">{formatCurrency(invoice.totalAmount)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {invoice.paidAt ? formatDate(invoice.paidAt) : formatDate(invoice.issuedAt)}
                  </td>
                  <td className="p-4">
                    {invoice.payplusInvoiceUrl && (
                      <a
                        href={invoice.payplusInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 hover:underline text-sm font-medium"
                      >
                        צפה →
                      </a>
                    )}
                  </td>
                </tr>
              ))}
              {allInvoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">אין חשבוניות עדיין</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Fees History */}
      {transactionFeesData.length > 0 && (
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-900">היסטוריית עמלות עסקאות</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-right p-4 text-sm font-medium text-gray-600">תקופה</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-600">עסקאות</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-600">סה״כ מכירות</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-600">עמלה</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-600">תאריך חישוב</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactionFeesData.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm">
                      {formatDate(fee.periodStart)} - {formatDate(fee.periodEnd)}
                    </td>
                    <td className="p-4 text-sm">{fee.totalTransactionsCount}</td>
                    <td className="p-4 text-sm">{formatCurrency(fee.totalTransactionsAmount)}</td>
                    <td className="p-4 font-medium">{formatCurrency(fee.feeAmount)}</td>
                    <td className="p-4 text-sm text-gray-500">{formatDate(fee.calculatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
