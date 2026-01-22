import { getStoreBySlug } from '@/lib/db/queries';
import { notFound, redirect } from 'next/navigation';
import { getStorePlugin } from '@/lib/plugins/loader';
import { db } from '@/lib/db';
import { customers, orders, crmTasks, users, storeMembers } from '@/lib/db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import Link from 'next/link';
import { CRMDashboard } from './crm-dashboard';

// ============================================
// CRM Plugin - Main Page
// Dashboard with quick stats and recent activity
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

  // Get stats
  const [
    customerStats,
    orderStats,
    taskStats,
    recentCustomers,
    teamMembers,
  ] = await Promise.all([
    // Customer count
    db.select({ count: count() })
      .from(customers)
      .where(eq(customers.storeId, store.id)),
    
    // Orders from POS (utmSource = 'pos')
    db.select({ 
      count: count(),
      total: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
    })
      .from(orders)
      .where(and(
        eq(orders.storeId, store.id),
        eq(orders.utmSource, 'pos'),
        eq(orders.financialStatus, 'paid')
      )),
    
    // Pending tasks
    db.select({ count: count() })
      .from(crmTasks)
      .where(and(
        eq(crmTasks.storeId, store.id),
        eq(crmTasks.status, 'pending')
      )),
    
    // Recent customers with tags
    db.select({
      id: customers.id,
      email: customers.email,
      firstName: customers.firstName,
      lastName: customers.lastName,
      phone: customers.phone,
      totalOrders: customers.totalOrders,
      totalSpent: customers.totalSpent,
      tags: customers.tags,
      createdAt: customers.createdAt,
    })
      .from(customers)
      .where(eq(customers.storeId, store.id))
      .orderBy(desc(customers.createdAt))
      .limit(10),
    
    // Team members (for task assignment)
    db.select({
      userId: storeMembers.userId,
      role: storeMembers.role,
      userName: users.name,
      userEmail: users.email,
    })
      .from(storeMembers)
      .leftJoin(users, eq(storeMembers.userId, users.id))
      .where(eq(storeMembers.storeId, store.id)),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/shops/${slug}/admin`}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">CRM</h1>
                  <p className="text-sm text-gray-500">{store.name}</p>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Link
                href={`/shops/${slug}/admin/plugins/crm/settings`}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="הגדרות"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <CRMDashboard
        storeId={store.id}
        storeSlug={slug}
        stats={{
          totalCustomers: customerStats[0]?.count || 0,
          posOrders: orderStats[0]?.count || 0,
          posRevenue: Number(orderStats[0]?.total || 0),
          pendingTasks: taskStats[0]?.count || 0,
        }}
        crmTags={crmTags}
        recentCustomers={recentCustomers}
        teamMembers={teamMembers.map(m => ({
          id: m.userId,
          name: m.userName || m.userEmail || 'משתמש',
          role: m.role,
        }))}
      />
    </div>
  );
}

