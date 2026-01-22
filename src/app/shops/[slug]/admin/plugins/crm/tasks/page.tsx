import { getStoreBySlug } from '@/lib/db/queries';
import { notFound, redirect } from 'next/navigation';
import { getStorePlugin } from '@/lib/plugins/loader';
import { db } from '@/lib/db';
import { crmTasks, users, customers, orders, storeMembers } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { TasksList } from './tasks-list';

// ============================================
// CRM Tasks Page
// List all tasks with filtering and management
// ============================================

interface TasksPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ 
    status?: string;
    assignedTo?: string;
    priority?: string;
  }>;
}

export default async function CRMTasksPage({ params, searchParams }: TasksPageProps) {
  const { slug } = await params;
  const { status, assignedTo, priority } = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }

  // Check if plugin is installed
  const plugin = await getStorePlugin(store.id, 'crm');
  if (!plugin || !plugin.isActive) {
    redirect(`/shops/${slug}/admin/plugins?install=crm`);
  }

  // Build query conditions
  const conditions = [eq(crmTasks.storeId, store.id)];
  
  if (status && status !== 'all') {
    conditions.push(eq(crmTasks.status, status as 'pending' | 'in_progress' | 'completed' | 'cancelled'));
  }
  
  if (assignedTo && assignedTo !== 'all') {
    conditions.push(eq(crmTasks.assignedTo, assignedTo));
  }
  
  if (priority && priority !== 'all') {
    conditions.push(eq(crmTasks.priority, priority as 'low' | 'medium' | 'high'));
  }

  // Fetch tasks with related data
  const tasks = await db
    .select({
      id: crmTasks.id,
      title: crmTasks.title,
      description: crmTasks.description,
      dueDate: crmTasks.dueDate,
      priority: crmTasks.priority,
      status: crmTasks.status,
      completedAt: crmTasks.completedAt,
      createdAt: crmTasks.createdAt,
      customer: {
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email,
      },
      order: {
        id: orders.id,
        orderNumber: orders.orderNumber,
      },
      assignedToUser: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(crmTasks)
    .leftJoin(customers, eq(crmTasks.customerId, customers.id))
    .leftJoin(orders, eq(crmTasks.orderId, orders.id))
    .leftJoin(users, eq(crmTasks.assignedTo, users.id))
    .where(and(...conditions))
    .orderBy(desc(crmTasks.createdAt));

  // Get team members for assignment filter
  const teamMembers = await db
    .select({
      userId: storeMembers.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(storeMembers)
    .leftJoin(users, eq(storeMembers.userId, users.id))
    .where(eq(storeMembers.storeId, store.id));

  // Count stats
  const allTasks = await db
    .select({ status: crmTasks.status })
    .from(crmTasks)
    .where(eq(crmTasks.storeId, store.id));

  const stats = {
    pending: allTasks.filter(t => t.status === 'pending').length,
    inProgress: allTasks.filter(t => t.status === 'in_progress').length,
    completed: allTasks.filter(t => t.status === 'completed').length,
    total: allTasks.length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">משימות</h1>
        <p className="text-slate-500">{stats.total} משימות • {stats.pending} ממתינות</p>
      </div>

      <TasksList
        storeId={store.id}
        storeSlug={slug}
        tasks={tasks}
        teamMembers={teamMembers.map(m => ({
          id: m.userId,
          name: m.userName || m.userEmail || 'משתמש',
        }))}
        stats={stats}
        currentFilters={{
          status: status || 'all',
          assignedTo: assignedTo || 'all',
          priority: priority || 'all',
        }}
      />
    </div>
  );
}
