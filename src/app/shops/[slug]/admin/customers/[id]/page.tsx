import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { customers, orders, customerCreditTransactions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { CreditForm } from '@/components/admin/credit-form';

interface CustomerPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerPageProps) {
  const { slug, id } = await params;
  
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Fetch customer
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(
      eq(customers.id, id),
      eq(customers.storeId, store.id)
    ))
    .limit(1);
  
  if (!customer) {
    notFound();
  }

  // Fetch customer orders
  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customer.id))
    .orderBy(desc(orders.createdAt))
    .limit(10);

  // Fetch credit transactions
  const creditTxns = await db
    .select()
    .from(customerCreditTransactions)
    .where(eq(customerCreditTransactions.customerId, customer.id))
    .orderBy(desc(customerCreditTransactions.createdAt))
    .limit(20);

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'ממתין', color: 'bg-amber-100 text-amber-700' },
    confirmed: { label: 'אושר', color: 'bg-blue-100 text-blue-700' },
    processing: { label: 'בהכנה', color: 'bg-purple-100 text-purple-700' },
    shipped: { label: 'נשלח', color: 'bg-indigo-100 text-indigo-700' },
    delivered: { label: 'נמסר', color: 'bg-green-100 text-green-700' },
    cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-700' },
    refunded: { label: 'הוחזר', color: 'bg-gray-100 text-gray-700' },
  };

  const creditTypeLabels: Record<string, { label: string; color: string }> = {
    credit: { label: 'זיכוי', color: 'text-green-600' },
    debit: { label: 'חיוב', color: 'text-red-600' },
    refund: { label: 'החזר', color: 'text-blue-600' },
    adjustment: { label: 'תיקון', color: 'text-amber-600' },
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/shops/${slug}/admin/customers`}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {customer.firstName || customer.lastName
              ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
              : customer.email}
          </h1>
          <p className="text-sm text-gray-500">{customer.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="col-span-8 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">פרטי לקוח</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">אימייל:</span>
                <span className="mr-2 text-gray-900">{customer.email}</span>
              </div>
              <div>
                <span className="text-gray-500">טלפון:</span>
                <span className="mr-2 text-gray-900">{customer.phone || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500">הזמנות:</span>
                <span className="mr-2 text-gray-900">{customer.totalOrders || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">סה״כ קניות:</span>
                <span className="mr-2 text-gray-900">₪{Number(customer.totalSpent || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500">הצטרפות:</span>
                <span className="mr-2 text-gray-900">
                  {new Date(customer.createdAt).toLocaleDateString('he-IL')}
                </span>
              </div>
              <div>
                <span className="text-gray-500">כניסה אחרונה:</span>
                <span className="mr-2 text-gray-900">
                  {customer.lastLoginAt
                    ? new Date(customer.lastLoginAt).toLocaleDateString('he-IL')
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">הזמנות אחרונות</h2>
            </div>
            {customerOrders.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                אין הזמנות עדיין
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      הזמנה
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      סטטוס
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      סכום
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      תאריך
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customerOrders.map((order) => {
                    const status = statusLabels[order.status] || statusLabels.pending;
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/shops/${slug}/admin/orders/${order.id}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            #{order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">₪{Number(order.total).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('he-IL')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Credit History */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">היסטוריית קרדיט</h2>
            </div>
            {creditTxns.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                אין תנועות קרדיט עדיין
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      תאריך
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      סוג
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      סכום
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      יתרה
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      סיבה
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {creditTxns.map((txn) => {
                    const typeInfo = creditTypeLabels[txn.type] || creditTypeLabels.adjustment;
                    const amount = Number(txn.amount);
                    return (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(txn.createdAt).toLocaleDateString('he-IL')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {amount >= 0 ? '+' : ''}₪{Math.abs(amount).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          ₪{Number(txn.balanceAfter).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {txn.reason || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          {/* Credit Balance Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M6 12h4"/>
                </svg>
              </div>
              <span className="text-white/80 text-sm">יתרת קרדיט</span>
            </div>
            <div className="text-4xl font-bold mb-1">
              ₪{Number(customer.creditBalance || 0).toLocaleString()}
            </div>
            <p className="text-white/60 text-sm">זמין לשימוש</p>
          </div>

          {/* Add Credit Form */}
          <CreditForm 
            customerId={customer.id}
            storeId={store.id}
            currentBalance={Number(customer.creditBalance || 0)}
            storeSlug={slug}
          />

          {/* Notes */}
          {customer.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">הערות</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

