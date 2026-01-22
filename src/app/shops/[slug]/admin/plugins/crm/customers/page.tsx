import { getStoreBySlug } from '@/lib/db/queries';
import { notFound, redirect } from 'next/navigation';
import { getStorePlugin } from '@/lib/plugins/loader';
import { db } from '@/lib/db';
import { customers, orders } from '@/lib/db/schema';
import { eq, desc, sql, ilike, or } from 'drizzle-orm';
import { CustomersList } from './customers-list';

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

  // Build query
  let query = db
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
      lastOrderAt: customers.lastOrderAt,
      acceptsMarketing: customers.acceptsMarketing,
    })
    .from(customers)
    .where(eq(customers.storeId, store.id));

  // Apply search filter
  if (search) {
    query = query.where(
      or(
        ilike(customers.email, `%${search}%`),
        ilike(customers.firstName, `%${search}%`),
        ilike(customers.lastName, `%${search}%`),
        ilike(customers.phone, `%${search}%`)
      )
    ) as typeof query;
  }

  // Apply sorting
  switch (sort) {
    case 'oldest':
      query = query.orderBy(customers.createdAt) as typeof query;
      break;
    case 'most_orders':
      query = query.orderBy(desc(customers.totalOrders)) as typeof query;
      break;
    case 'highest_value':
      query = query.orderBy(desc(sql`CAST(${customers.totalSpent} AS DECIMAL)`)) as typeof query;
      break;
    case 'newest':
    default:
      query = query.orderBy(desc(customers.createdAt)) as typeof query;
  }

  const allCustomers = await query.limit(100);

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
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">לקוחות</h1>
        <p className="text-slate-500">ניהול לקוחות, תגיות והערות</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
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

