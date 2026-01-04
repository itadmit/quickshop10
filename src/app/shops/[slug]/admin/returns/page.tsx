import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/ui';
import { getStoreReturnRequests } from '@/lib/db/queries/returns';
import { ReturnsDataTable } from './returns-data-table';

export const metadata = {
  title: 'החזרות והחלפות',
  description: 'ניהול בקשות החזרה והחלפה',
};

interface ReturnsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function AdminReturnsPage({ params, searchParams }: ReturnsPageProps) {
  const { slug } = await params;
  const { status, search } = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }

  const requests = await getStoreReturnRequests(store.id);

  // Filter by status
  let filteredRequests = requests;
  if (status && status !== 'all') {
    if (status === 'pending') {
      filteredRequests = requests.filter(r => r.status === 'pending' || r.status === 'under_review');
    } else if (status === 'approved') {
      filteredRequests = requests.filter(r => ['approved', 'awaiting_shipment', 'item_received'].includes(r.status));
    } else if (status === 'completed') {
      filteredRequests = requests.filter(r => r.status === 'completed');
    } else if (status === 'rejected') {
      filteredRequests = requests.filter(r => r.status === 'rejected' || r.status === 'cancelled');
    }
  }

  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    filteredRequests = filteredRequests.filter(r =>
      r.requestNumber.toLowerCase().includes(searchLower) ||
      r.orderNumber.toLowerCase().includes(searchLower) ||
      (r.customerName && r.customerName.toLowerCase().includes(searchLower)) ||
      (r.customerEmail && r.customerEmail.toLowerCase().includes(searchLower))
    );
  }

  // Count by status
  const pendingCount = requests.filter(r => r.status === 'pending' || r.status === 'under_review').length;
  const approvedCount = requests.filter(r => ['approved', 'awaiting_shipment', 'item_received'].includes(r.status)).length;
  const completedCount = requests.filter(r => r.status === 'completed').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected' || r.status === 'cancelled').length;

  const tabs = [
    { id: 'all', label: 'הכל', count: requests.length },
    { id: 'pending', label: 'ממתינות', count: pendingCount },
    { id: 'approved', label: 'בטיפול', count: approvedCount },
    { id: 'completed', label: 'הושלמו', count: completedCount },
    { id: 'rejected', label: 'נדחו/בוטלו', count: rejectedCount },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="החזרות והחלפות"
        description={`${requests.length} בקשות`}
      />

      <ReturnsDataTable
        requests={filteredRequests}
        storeSlug={slug}
        tabs={tabs}
        currentTab={status || 'all'}
        searchValue={search}
      />
    </div>
  );
}

