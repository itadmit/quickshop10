import { getStoreBySlug, getStoreCustomers } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/ui';
import type { Tab } from '@/components/admin/ui';
import { CustomersDataTable } from './customers-data-table';
import { CustomerForm } from './customer-form';
import { CSVImport } from './csv-import';

// ============================================
// Customers Page - Server Component
// ============================================

interface CustomersPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string; search?: string; page?: string }>;
}

export default async function CustomersPage({ params, searchParams }: CustomersPageProps) {
  const { slug } = await params;
  const { filter, search, page } = await searchParams;
  
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Fetch customers
  const allCustomers = await getStoreCustomers(store.id);
  
  // Filter by tab
  let filteredCustomers = allCustomers;
  if (filter && filter !== 'all') {
    if (filter === 'repeat') {
      filteredCustomers = allCustomers.filter(c => (c.totalOrders || 0) > 1);
    } else if (filter === 'new') {
      filteredCustomers = allCustomers.filter(c => (c.totalOrders || 0) <= 1);
    } else if (filter === 'credit') {
      filteredCustomers = allCustomers.filter(c => Number(c.creditBalance || 0) > 0);
    } else if (filter === 'marketing') {
      filteredCustomers = allCustomers.filter(c => c.acceptsMarketing === true);
    }
  }
  
  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    filteredCustomers = filteredCustomers.filter(c => {
      const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
      return (
        fullName.includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.phone?.toLowerCase().includes(searchLower)
      );
    });
  }
  
  // Pagination
  const perPage = 20;
  const currentPage = parseInt(page || '1', 10);
  const totalPages = Math.ceil(filteredCustomers.length / perPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Count for tabs
  const repeatCustomers = allCustomers.filter(c => (c.totalOrders || 0) > 1).length;
  const newCustomers = allCustomers.filter(c => (c.totalOrders || 0) <= 1).length;
  const withCredit = allCustomers.filter(c => Number(c.creditBalance || 0) > 0).length;
  const acceptsMarketing = allCustomers.filter(c => c.acceptsMarketing === true).length;

  const tabs: Tab[] = [
    { id: 'all', label: 'הכל', count: allCustomers.length },
    { id: 'repeat', label: 'לקוחות חוזרים', count: repeatCustomers },
    { id: 'new', label: 'חדשים', count: newCustomers },
    { id: 'credit', label: 'עם קרדיט', count: withCredit },
    { id: 'marketing', label: 'מאשרים דיוור', count: acceptsMarketing },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="לקוחות"
        description={`${allCustomers.length} לקוחות רשומים`}
        actions={
          <div className="flex gap-2">
            <CSVImport storeId={store.id} />
            <CustomerForm storeId={store.id} />
          </div>
        }
      />

      <CustomersDataTable
        customers={paginatedCustomers}
        storeSlug={slug}
        tabs={tabs}
        currentTab={filter || 'all'}
        searchValue={search}
        pagination={{
          currentPage,
          totalPages,
          totalItems: filteredCustomers.length,
          perPage,
        }}
      />
    </div>
  );
}
