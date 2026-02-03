import { getStoreBySlug } from '@/lib/db/queries';
import { notFound, redirect } from 'next/navigation';
import { getStorePlugin } from '@/lib/plugins/loader';
import { db } from '@/lib/db';
import { customers, orders, crmTasks, crmNotes, users, storeMembers } from '@/lib/db/schema';
import { eq, and, desc, count, sql, gte } from 'drizzle-orm';
import Link from 'next/link';
import { CrmNav } from './crm-nav';
import { StatCard, StatCardGrid } from '@/components/admin/ui';

// ============================================
// CRM Dashboard - Professional Overview
// ============================================

interface CRMPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CRMPage({ params }: CRMPageProps) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }

  // Check if plugin is installed
  const plugin = await getStorePlugin(store.id, 'crm');
  if (!plugin || !plugin.isActive) {
    redirect(`/shops/${slug}/admin/plugins?install=crm`);
  }

  // Get CRM tags for this store
  const crmTags = (store.crmTags as Array<{
    id: string;
    label: string;
    color: string;
    isDefault?: boolean;
  }>) || [];

  // Date ranges
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - 7);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Get basic stats (these tables always exist)
  const [
    customerStats,
    posStatsToday,
    posStatsWeek,
    posStatsMonth,
    recentCustomers,
    topAgents,
    taggedCustomers,
  ] = await Promise.all([
    // Total customers
    db.select({ count: count() })
      .from(customers)
      .where(eq(customers.storeId, store.id)),
    
    // Today's POS sales
    db.select({ 
      count: count(),
      total: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
    })
      .from(orders)
      .where(and(
        eq(orders.storeId, store.id),
        eq(orders.utmSource, 'pos'),
        eq(orders.financialStatus, 'paid'),
        gte(orders.createdAt, startOfDay)
      )),
    
    // This week's POS sales
    db.select({ 
      count: count(),
      total: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
    })
      .from(orders)
      .where(and(
        eq(orders.storeId, store.id),
        eq(orders.utmSource, 'pos'),
        eq(orders.financialStatus, 'paid'),
        gte(orders.createdAt, startOfWeek)
      )),
    
    // This month's POS sales
    db.select({ 
      count: count(),
      total: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
    })
      .from(orders)
      .where(and(
        eq(orders.storeId, store.id),
        eq(orders.utmSource, 'pos'),
        eq(orders.financialStatus, 'paid'),
        gte(orders.createdAt, startOfMonth)
      )),
    
    // Recent customers
    db.select({
      id: customers.id,
      email: customers.email,
      firstName: customers.firstName,
      lastName: customers.lastName,
      totalOrders: customers.totalOrders,
      totalSpent: customers.totalSpent,
      tags: customers.tags,
      createdAt: customers.createdAt,
    })
      .from(customers)
      .where(eq(customers.storeId, store.id))
      .orderBy(desc(customers.createdAt))
      .limit(5),
    
    // Top agents (by order count)
    db.select({
      agentId: orders.createdByUserId,
      agentName: users.name,
      orderCount: count(),
      totalSales: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
    })
      .from(orders)
      .leftJoin(users, eq(orders.createdByUserId, users.id))
      .where(and(
        eq(orders.storeId, store.id),
        eq(orders.utmSource, 'pos'),
        sql`${orders.createdByUserId} IS NOT NULL`,
        gte(orders.createdAt, startOfMonth)
      ))
      .groupBy(orders.createdByUserId, users.name)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(5),

    // Customers by tag count
    db.select({
      id: customers.id,
      tags: customers.tags,
    })
      .from(customers)
      .where(eq(customers.storeId, store.id)),
  ]);

  // CRM-specific queries (wrapped in try-catch for tables that might not exist yet)
  let pendingTasks: { count: number }[] = [{ count: 0 }];
  let overdueTasks: { count: number }[] = [{ count: 0 }];
  let recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: Date | null;
    customerId: string | null;
    customerName: string | null;
  }> = [];
  let recentNotes: Array<{
    id: string;
    content: string;
    createdAt: Date | null;
    customerName: string | null;
    customerEmail: string | null;
    userName: string | null;
  }> = [];

  try {
    [pendingTasks, overdueTasks, recentTasks, recentNotes] = await Promise.all([
      db.select({ count: count() })
        .from(crmTasks)
        .where(and(
          eq(crmTasks.storeId, store.id),
          eq(crmTasks.status, 'pending')
        )),

      db.select({ count: count() })
        .from(crmTasks)
        .where(and(
          eq(crmTasks.storeId, store.id),
          eq(crmTasks.status, 'pending'),
          sql`${crmTasks.dueDate} < NOW()`
        )),
      
      db.select({
        id: crmTasks.id,
        title: crmTasks.title,
        status: crmTasks.status,
        priority: crmTasks.priority,
        dueDate: crmTasks.dueDate,
        customerId: crmTasks.customerId,
        customerName: customers.firstName,
      })
        .from(crmTasks)
        .leftJoin(customers, eq(crmTasks.customerId, customers.id))
        .where(eq(crmTasks.storeId, store.id))
        .orderBy(desc(crmTasks.createdAt))
        .limit(5),

      db.select({
        id: crmNotes.id,
        content: crmNotes.content,
        createdAt: crmNotes.createdAt,
        customerName: customers.firstName,
        customerEmail: customers.email,
        userName: users.name,
      })
        .from(crmNotes)
        .leftJoin(customers, eq(crmNotes.customerId, customers.id))
        .leftJoin(users, eq(crmNotes.userId, users.id))
        .where(eq(crmNotes.storeId, store.id))
        .orderBy(desc(crmNotes.createdAt))
        .limit(5),
    ]);
  } catch (error) {
    console.error('[CRM] Error fetching CRM data (tables may not exist):', error);
  }

  // Calculate tag distribution
  const tagCounts: Record<string, number> = {};
  taggedCustomers.forEach(c => {
    const tags = (c.tags || []) as string[];
    tags.forEach(tagId => {
      tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
    });
  });

  const formatCurrency = (n: number) => `₪${n.toLocaleString()}`;
  const formatDate = (d: Date | null) => d ? new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }) : '-';

  const priorityIcons: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' };
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">מערכת CRM</h1>
        <p className="text-gray-500">ניהול לקוחות, משימות ודוחות</p>
      </div>

      {/* Navigation */}
      <CrmNav storeSlug={slug} />

      {/* Stats Grid */}
      <StatCardGrid columns={4}>
        <StatCard 
          label="סה״כ לקוחות" 
          value={customerStats[0]?.count || 0}
          href={`/shops/${slug}/admin/plugins/crm/customers`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <StatCard 
          label="מכירות היום" 
          value={formatCurrency(Number(posStatsToday[0]?.total || 0))}
          subLabel={`${posStatsToday[0]?.count || 0} עסקאות`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          }
        />
        <StatCard 
          label="מכירות השבוע" 
          value={formatCurrency(Number(posStatsWeek[0]?.total || 0))}
          subLabel={`${posStatsWeek[0]?.count || 0} עסקאות`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
        />
        <StatCard 
          label="משימות פתוחות" 
          value={pendingTasks[0]?.count || 0}
          subLabel={(overdueTasks[0]?.count || 0) > 0 ? `${overdueTasks[0].count} באיחור` : undefined}
          alert={(overdueTasks[0]?.count || 0) > 0}
          href={`/shops/${slug}/admin/plugins/crm/tasks`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </StatCardGrid>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="col-span-2 space-y-6">
          {/* Agent Performance */}
          {topAgents.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">ביצועי סוכנים - החודש</h2>
                <Link href={`/shops/${slug}/admin/plugins/crm/reports`} className="text-sm text-indigo-600 hover:text-indigo-700">
                  דוח מלא
                </Link>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {topAgents.map((agent, i) => (
                    <div key={agent.agentId || i} className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{agent.agentName || 'משתמש'}</p>
                        <p className="text-sm text-slate-500">{agent.orderCount} הזמנות</p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900">{formatCurrency(Number(agent.totalSales))}</p>
                        <p className="text-xs text-slate-400">מכירות</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Tasks */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">משימות אחרונות</h2>
              <Link href={`/shops/${slug}/admin/plugins/crm/tasks`} className="text-sm text-indigo-600 hover:text-indigo-700">
                כל המשימות
              </Link>
            </div>
            {recentTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p>אין משימות</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentTasks.map(task => (
                  <div key={task.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{priorityIcons[task.priority] || '⚪'}</span>
                      <div>
                        <p className="font-medium text-slate-900">{task.title}</p>
                        {task.customerName && (
                          <p className="text-sm text-slate-500">לקוח: {task.customerName}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {task.dueDate && (
                        <span className="text-sm text-slate-400">{formatDate(task.dueDate)}</span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[task.status] || ''}`}>
                        {task.status === 'pending' ? 'ממתין' : task.status === 'in_progress' ? 'בביצוע' : 'הושלם'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Notes */}
          {recentNotes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">הערות אחרונות</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {recentNotes.map(note => (
                  <div key={note.id} className="px-6 py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{note.customerName || note.customerEmail}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-sm text-slate-500">{note.userName || 'משתמש'}</span>
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(note.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Monthly Overview */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white">
            <h3 className="text-sm font-medium text-indigo-100 mb-4">סיכום חודשי</h3>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold">{formatCurrency(Number(posStatsMonth[0]?.total || 0))}</p>
                <p className="text-sm text-indigo-200">הכנסות מקופה</p>
              </div>
              <div className="pt-4 border-t border-white/20">
                <p className="text-2xl font-bold">{posStatsMonth[0]?.count || 0}</p>
                <p className="text-sm text-indigo-200">עסקאות בקופה</p>
              </div>
            </div>
          </div>

          {/* Tags Distribution */}
          {crmTags.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">תגיות לקוחות</h3>
                <Link href={`/shops/${slug}/admin/plugins/crm/settings`} className="text-xs text-slate-400 hover:text-slate-600">
                  ערוך
                </Link>
              </div>
              <div className="space-y-3">
                {crmTags.map(tag => {
                  const tagCount = tagCounts[tag.id] || 0;
                  const percentage = customerStats[0]?.count ? Math.round((tagCount / customerStats[0].count) * 100) : 0;
                  
                  return (
                    <div key={tag.id} className="flex items-center gap-3">
                      <span 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm text-slate-700 flex-1">{tag.label}</span>
                      <span className="text-sm font-medium text-slate-900">{tagCount}</span>
                      <span className="text-xs text-slate-400 w-10 text-left">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Customers */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">לקוחות חדשים</h3>
              <Link href={`/shops/${slug}/admin/plugins/crm/customers`} className="text-xs text-indigo-600 hover:text-indigo-700">
                הצג הכל
              </Link>
            </div>
            {recentCustomers.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <p className="text-sm">אין לקוחות</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentCustomers.map(customer => {
                  const name = customer.firstName || customer.lastName 
                    ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                    : customer.email;
                  const customerTagIds = (customer.tags || []) as string[];
                  
                  return (
                    <Link
                      key={customer.id}
                      href={`/shops/${slug}/admin/plugins/crm/customers/${customer.id}`}
                      className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-slate-600">
                            {name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {customerTagIds.slice(0, 2).map(tagId => {
                              const tag = crmTags.find(t => t.id === tagId);
                              if (!tag) return null;
                              return (
                                <span
                                  key={tagId}
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: tag.color }}
                                  title={tag.label}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(customer.createdAt)}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
