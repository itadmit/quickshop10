import { getStoreBySlug } from '@/lib/db/queries';
import { notFound, redirect } from 'next/navigation';
import { getStorePlugin } from '@/lib/plugins/loader';
import { db } from '@/lib/db';
import { customers, orders, users } from '@/lib/db/schema';
import { eq, and, desc, count, sql, gte } from 'drizzle-orm';
import Link from 'next/link';
import { CrmNav } from '../crm-nav';

// ============================================
// CRM Reports Page
// Sales by agent, performance by tags, etc.
// ============================================

interface ReportsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    period?: string;
  }>;
}

export default async function CRMReportsPage({ params, searchParams }: ReportsPageProps) {
  const { slug } = await params;
  const { period = 'month' } = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }

  // Check if plugin is installed
  const plugin = await getStorePlugin(store.id, 'crm');
  if (!plugin || !plugin.isActive) {
    redirect(`/shops/${slug}/admin/plugins?install=crm`);
  }

  // Get CRM tags
  const crmTags = (store.crmTags as Array<{
    id: string;
    label: string;
    color: string;
    isDefault?: boolean;
  }>) || [];

  // Calculate date range
  const now = new Date();
  let startDate: Date;
  switch (period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Get all stats in parallel
  const [
    agentPerformance,
    allCustomers,
    dailySales,
    topCustomers,
  ] = await Promise.all([
    // Agent performance
    db.select({
      agentId: orders.createdByUserId,
      agentName: users.name,
      agentEmail: users.email,
      orderCount: count(),
      totalSales: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
      avgOrderValue: sql<number>`COALESCE(AVG(CAST(${orders.total} AS DECIMAL)), 0)`,
    })
      .from(orders)
      .leftJoin(users, eq(orders.createdByUserId, users.id))
      .where(and(
        eq(orders.storeId, store.id),
        eq(orders.utmSource, 'pos'),
        eq(orders.financialStatus, 'paid'),
        sql`${orders.createdByUserId} IS NOT NULL`,
        gte(orders.createdAt, startDate)
      ))
      .groupBy(orders.createdByUserId, users.name, users.email)
      .orderBy(desc(sql`SUM(CAST(${orders.total} AS DECIMAL))`)),

    // All customers with tags
    db.select({
      id: customers.id,
      tags: customers.tags,
      totalOrders: customers.totalOrders,
      totalSpent: customers.totalSpent,
    })
      .from(customers)
      .where(eq(customers.storeId, store.id)),

    // Daily sales for chart
    db.select({
      date: sql<string>`DATE(${orders.createdAt})`,
      posCount: sql<number>`COUNT(*) FILTER (WHERE ${orders.utmSource} = 'pos')`,
      posTotal: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)) FILTER (WHERE ${orders.utmSource} = 'pos'), 0)`,
      onlineCount: sql<number>`COUNT(*) FILTER (WHERE ${orders.utmSource} != 'pos' OR ${orders.utmSource} IS NULL)`,
      onlineTotal: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)) FILTER (WHERE ${orders.utmSource} != 'pos' OR ${orders.utmSource} IS NULL), 0)`,
    })
      .from(orders)
      .where(and(
        eq(orders.storeId, store.id),
        eq(orders.financialStatus, 'paid'),
        gte(orders.createdAt, startDate)
      ))
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`),

    // Top customers
    db.select({
      id: customers.id,
      email: customers.email,
      firstName: customers.firstName,
      lastName: customers.lastName,
      totalOrders: customers.totalOrders,
      totalSpent: customers.totalSpent,
      tags: customers.tags,
    })
      .from(customers)
      .where(eq(customers.storeId, store.id))
      .orderBy(desc(sql`CAST(${customers.totalSpent} AS DECIMAL)`))
      .limit(10),
  ]);

  // Calculate tag stats
  const tagStats = crmTags.map(tag => {
    const customersWithTag = allCustomers.filter(c => {
      const tags = (c.tags || []) as string[];
      return tags.includes(tag.id);
    });
    
    const totalOrders = customersWithTag.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
    const totalSpent = customersWithTag.reduce((sum, c) => sum + Number(c.totalSpent || 0), 0);
    const avgOrderValue = customersWithTag.length > 0 && totalOrders > 0 
      ? totalSpent / totalOrders 
      : 0;
    
    return {
      ...tag,
      customerCount: customersWithTag.length,
      totalOrders,
      totalSpent,
      avgOrderValue,
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);

  // Calculate totals
  const totalPOS = agentPerformance.reduce((sum, a) => sum + Number(a.totalSales), 0);
  const totalPOSOrders = agentPerformance.reduce((sum, a) => sum + Number(a.orderCount), 0);

  const formatCurrency = (n: number) => `₪${n.toLocaleString()}`;
  const periodLabels: Record<string, string> = {
    week: 'השבוע',
    month: 'החודש',
    quarter: 'הרבעון',
    year: 'השנה',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">מערכת CRM</h1>
        <p className="text-gray-500">ניתוח ביצועי מכירות וסוכנים</p>
      </div>

      {/* Navigation */}
      <CrmNav storeSlug={slug} />

      {/* Period Selector */}
      <div className="flex items-center justify-end gap-2">
        {(['week', 'month', 'quarter', 'year'] as const).map(p => (
          <Link
            key={p}
            href={`/shops/${slug}/admin/plugins/crm/reports?period=${p}`}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              period === p
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {periodLabels[p]}
          </Link>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white">
          <p className="text-indigo-100 text-sm mb-1">מכירות POS</p>
          <p className="text-3xl font-bold">{formatCurrency(totalPOS)}</p>
          <p className="text-indigo-200 text-sm mt-2">{totalPOSOrders} עסקאות</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-slate-500 text-sm mb-1">ממוצע לעסקה</p>
          <p className="text-3xl font-bold text-slate-900">
            {formatCurrency(totalPOSOrders > 0 ? totalPOS / totalPOSOrders : 0)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-slate-500 text-sm mb-1">סוכנים פעילים</p>
          <p className="text-3xl font-bold text-slate-900">{agentPerformance.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-slate-500 text-sm mb-1">לקוחות עם תגיות</p>
          <p className="text-3xl font-bold text-slate-900">
            {allCustomers.filter(c => ((c.tags || []) as string[]).length > 0).length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Agent Performance */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">ביצועי סוכנים - {periodLabels[period]}</h2>
          </div>

          {agentPerformance.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p>אין מכירות POS בתקופה זו</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {agentPerformance.map((agent, i) => (
                <div key={agent.agentId || i} className="px-6 py-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                    i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                    i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                    i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{agent.agentName || agent.agentEmail || 'משתמש'}</p>
                    <p className="text-sm text-slate-500">{agent.orderCount} הזמנות • ממוצע {formatCurrency(Number(agent.avgOrderValue))}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(Number(agent.totalSales))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tag Performance */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">ביצועים לפי תגית</h2>
          </div>

          {tagStats.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p>לא הוגדרו תגיות CRM</p>
              <Link 
                href={`/shops/${slug}/admin/plugins/crm/settings`}
                className="text-indigo-600 hover:text-indigo-700 text-sm"
              >
                הגדר תגיות
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tagStats.map(tag => (
                <div key={tag.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium text-slate-900">{tag.label}</span>
                      <span className="text-sm text-slate-400">({tag.customerCount} לקוחות)</span>
                    </div>
                    <span className="font-bold text-slate-900">{formatCurrency(tag.totalSpent)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>{tag.totalOrders} הזמנות</span>
                    <span>•</span>
                    <span>ממוצע {formatCurrency(tag.avgOrderValue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Customers */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">לקוחות מובילים (לפי ערך רכישות)</h2>
        </div>

        {topCustomers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p>אין לקוחות</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">מיקום</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">לקוח</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">תגיות</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">הזמנות</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">סה״כ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topCustomers.map((customer, i) => {
                const name = customer.firstName || customer.lastName 
                  ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                  : customer.email;
                const customerTagIds = (customer.tags || []) as string[];
                
                return (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        i === 0 ? 'bg-amber-100 text-amber-700' :
                        i === 1 ? 'bg-slate-100 text-slate-600' :
                        i === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-50 text-slate-500'
                      }`}>
                        {i + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/shops/${slug}/admin/plugins/crm/customers/${customer.id}`}
                        className="font-medium text-slate-900 hover:text-indigo-600"
                      >
                        {name}
                      </Link>
                      <p className="text-sm text-slate-500">{customer.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {customerTagIds.slice(0, 3).map(tagId => {
                          const tag = crmTags.find(t => t.id === tagId);
                          if (!tag) return null;
                          return (
                            <span
                              key={tagId}
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${tag.color}20`,
                                color: tag.color,
                              }}
                            >
                              {tag.label}
                            </span>
                          );
                        })}
                        {customerTagIds.length > 3 && (
                          <span className="text-xs text-slate-400">+{customerTagIds.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{customer.totalOrders || 0}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(Number(customer.totalSpent || 0))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

