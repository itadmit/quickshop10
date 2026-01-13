import { getStoreBySlug, getStoreCustomersWithTags, type CustomerTag } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/ui';
import type { Tab } from '@/components/admin/ui';
import { CustomersDataTable } from './customers-data-table';
import { CustomerForm } from './customer-form';
import { CSVImport } from './csv-import';

// ============================================
// Customers Page - Server Component
// One record per user with tags (מדבקות)
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

  // Fetch customers with their tags
  const allCustomers = await getStoreCustomersWithTags(store.id);
  
  // Count by tags
  const customersCount = allCustomers.filter(c => c.tags.includes('customer')).length;
  const clubMembersCount = allCustomers.filter(c => c.tags.includes('club_member')).length;
  const newsletterCount = allCustomers.filter(c => c.tags.includes('newsletter')).length;
  const contactFormCount = allCustomers.filter(c => c.tags.includes('contact_form')).length;
  const withCredit = allCustomers.filter(c => Number(c.creditBalance || 0) > 0).length;
  
  // Filter by tag
  let filteredCustomers = allCustomers;
  if (filter && filter !== 'all') {
    if (filter === 'customer') {
      filteredCustomers = allCustomers.filter(c => c.tags.includes('customer'));
    } else if (filter === 'club_member') {
      filteredCustomers = allCustomers.filter(c => c.tags.includes('club_member'));
    } else if (filter === 'newsletter') {
      filteredCustomers = allCustomers.filter(c => c.tags.includes('newsletter'));
    } else if (filter === 'contact_form') {
      filteredCustomers = allCustomers.filter(c => c.tags.includes('contact_form'));
    } else if (filter === 'credit') {
      filteredCustomers = allCustomers.filter(c => Number(c.creditBalance || 0) > 0);
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

  const tabs: Tab[] = [
    { id: 'all', label: 'הכל', count: allCustomers.length },
    { id: 'customer', label: 'לקוחות', count: customersCount },
    { id: 'club_member', label: 'מועדון', count: clubMembersCount },
    { id: 'newsletter', label: 'ניוזלטר', count: newsletterCount },
    { id: 'contact_form', label: 'יצירת קשר', count: contactFormCount },
    { id: 'credit', label: 'עם קרדיט', count: withCredit },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="אנשי קשר"
        description={`${allCustomers.length} רשומות • ${customersCount} לקוחות • ${clubMembersCount} מועדון`}
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
