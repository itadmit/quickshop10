import { getStoreBySlug } from '@/lib/db/queries';
import { notFound, redirect } from 'next/navigation';
import { getStorePlugin } from '@/lib/plugins/loader';
import { db } from '@/lib/db';
import { customers, orders } from '@/lib/db/schema';
import { eq, desc, sql, ilike, or, and } from 'drizzle-orm';
import { CustomersList } from './customers-list';
import { CrmNav } from '../crm-nav';

// ============================================
// CRM Customers Page
// List all customers with tags, search, and filters
// ============================================

interface CustomersPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    search?: string;
    tag?: string;
    sort?: string;
  }>;
}

export default async function CRMCustomersPage({ params, searchParams }: CustomersPageProps) {
  const { slug } = await params;
  const { search, tag, sort } = await searchParams;
  
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

  // Build search condition if needed
  const searchCondition = search
    ? or(
        ilike(customers.email, `%${search}%`),
        ilike(customers.firstName, `%${search}%`),
        ilike(customers.lastName, `%${search}%`),
        ilike(customers.phone, `%${search}%`)
      )
    : undefined;

  // Build where clause
  const whereClause = searchCondition
    ? and(eq(customers.storeId, store.id), searchCondition)
    : eq(customers.storeId, store.id);

  // Determine sort order
  const orderByClause = (() => {
    switch (sort) {
      case 'oldest':
        return customers.createdAt;
      case 'most_orders':
        return desc(customers.totalOrders);
      case 'highest_value':
        return desc(sql`CAST(${customers.totalSpent} AS DECIMAL)`);
      case 'newest':
      default:
        return desc(customers.createdAt);
    }
  })();

  // Execute query with lastOrderAt calculated from orders
  const allCustomers = await db
    .select({
      id: customers.id,
      email: customers.email,
      firstName: customers.firstName,
      lastName: customers.lastName,
      phone: customers.phone,
      totalOrders: customers.totalOrders,
      totalSpent: customers.totalSpent,
      tags: customers.tags,
      createdAt: customers.createdAt,
      acceptsMarketing: customers.acceptsMarketing,
      // Calculate lastOrderAt from orders table
      lastOrderAt: sql<Date | null>`(
        SELECT MAX(${orders.createdAt}) 
        FROM ${orders} 
        WHERE ${orders.customerId} = ${customers.id}
      )`,
    })
    .from(customers)
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(100);

  // Filter by tag on client (JSONB array)
  let filteredCustomers = allCustomers;
  if (tag) {
    filteredCustomers = allCustomers.filter(c => {
      const customerTags = (c.tags || []) as string[];
      return customerTags.includes(tag);
    });
  }

  // Get stats
  const stats = {
    total: allCustomers.length,
    withTags: allCustomers.filter(c => ((c.tags || []) as string[]).length > 0).length,
    newThisMonth: allCustomers.filter(c => {
      if (!c.createdAt) return false;
      const d = new Date(c.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">מערכת CRM</h1>
        <p className="text-gray-500">ניהול לקוחות, תגיות והערות</p>
      </div>

      {/* Navigation */}
      <CrmNav storeSlug={slug} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-sm text-slate-500">סה״כ לקוחות</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-indigo-600">{stats.withTags}</p>
          <p className="text-sm text-slate-500">עם תגיות</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-emerald-600">{stats.newThisMonth}</p>
          <p className="text-sm text-slate-500">חדשים החודש</p>
        </div>
      </div>

      <CustomersList
        storeId={store.id}
        storeSlug={slug}
        customers={filteredCustomers}
        crmTags={crmTags}
        currentSearch={search || ''}
        currentTag={tag || ''}
        currentSort={sort || 'newest'}
      />
    </div>
  );
}

