import { getStoreBySlug } from '@/lib/db/queries';
import { notFound, redirect } from 'next/navigation';
import { getStorePlugin } from '@/lib/plugins/loader';
import { db } from '@/lib/db';
import { customers, orders, crmNotes, crmTasks, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import Link from 'next/link';
import { CustomerDetailView } from './customer-detail-view';

// ============================================
// CRM Customer Detail Page
// Full customer profile with tags, notes, tasks
// ============================================

interface CustomerDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function CRMCustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { slug, id } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }

  // Check if plugin is installed
  const plugin = await getStorePlugin(store.id, 'crm');
  if (!plugin || !plugin.isActive) {
    redirect(`/shops/${slug}/admin/plugins?install=crm`);
  }

  // Get customer
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

  // Get CRM tags
  const crmTags = (store.crmTags as Array<{
    id: string;
    label: string;
    color: string;
    isDefault?: boolean;
  }>) || [];

  // Get customer orders
  const customerOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      financialStatus: orders.financialStatus,
      fulfillmentStatus: orders.fulfillmentStatus,
      total: orders.total,
      createdAt: orders.createdAt,
      utmSource: orders.utmSource,
      createdByName: users.name,
    })
    .from(orders)
    .leftJoin(users, eq(orders.createdById, users.id))
    .where(eq(orders.customerId, id))
    .orderBy(desc(orders.createdAt))
    .limit(20);

  // Get CRM notes
  const notes = await db
    .select({
      id: crmNotes.id,
      content: crmNotes.content,
      createdAt: crmNotes.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(crmNotes)
    .leftJoin(users, eq(crmNotes.userId, users.id))
    .where(eq(crmNotes.customerId, id))
    .orderBy(desc(crmNotes.createdAt));

  // Get CRM tasks
  const tasks = await db
    .select({
      id: crmTasks.id,
      title: crmTasks.title,
      description: crmTasks.description,
      status: crmTasks.status,
      priority: crmTasks.priority,
      dueDate: crmTasks.dueDate,
      createdAt: crmTasks.createdAt,
      assignedToName: users.name,
    })
    .from(crmTasks)
    .leftJoin(users, eq(crmTasks.assignedTo, users.id))
    .where(eq(crmTasks.customerId, id))
    .orderBy(desc(crmTasks.createdAt));

  const customerName = customer.firstName || customer.lastName
    ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
    : customer.email;

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href={`/shops/${slug}/admin/plugins/crm/customers`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          חזרה ללקוחות
        </Link>
      </div>

      <CustomerDetailView
        storeId={store.id}
        storeSlug={slug}
        customer={customer}
        customerName={customerName}
        customerTags={(customer.tags || []) as string[]}
        crmTags={crmTags}
        orders={customerOrders}
        notes={notes.map(n => ({
          ...n,
          createdAt: n.createdAt!,
        }))}
        tasks={tasks.map(t => ({
          ...t,
          createdAt: t.createdAt!,
        }))}
      />
    </div>
  );
}

