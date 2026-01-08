import { db } from '@/lib/db';
import { contacts, stores } from '@/lib/db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/ui';
import type { Tab } from '@/components/admin/ui';
import { ContactsDataTable } from './contacts-data-table';
import { ContactForm } from './contact-form';

export const dynamic = 'force-dynamic';

interface ContactsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; search?: string; page?: string }>;
}

const typeLabels: Record<string, string> = {
  all: 'הכל',
  newsletter: 'ניוזלטר',
  club_member: 'מועדון לקוחות',
  contact_form: 'יצירת קשר',
  popup_form: 'פופאפ',
};

export default async function ContactsPage({ params, searchParams }: ContactsPageProps) {
  const { slug } = await params;
  const { type, search, page } = await searchParams;
  
  const store = await db.query.stores.findFirst({
    where: eq(stores.slug, slug),
  });

  if (!store) {
    notFound();
  }

  // Get counts for each type
  const [
    totalCount,
    newsletterCount,
    clubMemberCount,
    contactFormCount,
    popupFormCount,
    unreadCount,
  ] = await Promise.all([
    db.select({ count: count() }).from(contacts).where(eq(contacts.storeId, store.id)),
    db.select({ count: count() }).from(contacts).where(and(eq(contacts.storeId, store.id), eq(contacts.type, 'newsletter'))),
    db.select({ count: count() }).from(contacts).where(and(eq(contacts.storeId, store.id), eq(contacts.type, 'club_member'))),
    db.select({ count: count() }).from(contacts).where(and(eq(contacts.storeId, store.id), eq(contacts.type, 'contact_form'))),
    db.select({ count: count() }).from(contacts).where(and(eq(contacts.storeId, store.id), eq(contacts.type, 'popup_form'))),
    db.select({ count: count() }).from(contacts).where(and(eq(contacts.storeId, store.id), eq(contacts.isRead, false))),
  ]);

  // Build query conditions
  const conditions = [eq(contacts.storeId, store.id)];
  if (type && type !== 'all') {
    conditions.push(eq(contacts.type, type as 'newsletter' | 'club_member' | 'contact_form' | 'popup_form'));
  }

  // Get contacts with customer data (for "לקוח" column)
  let allContacts = await db.query.contacts.findMany({
    where: and(...conditions),
    orderBy: desc(contacts.createdAt),
    with: {
      customer: {
        columns: {
          id: true,
          totalOrders: true,
          totalSpent: true,
        },
      },
    },
  });

  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    allContacts = allContacts.filter(c => 
      c.email.toLowerCase().includes(searchLower) ||
      c.firstName?.toLowerCase().includes(searchLower) ||
      c.lastName?.toLowerCase().includes(searchLower) ||
      c.phone?.toLowerCase().includes(searchLower)
    );
  }

  // Pagination
  const perPage = 25;
  const currentPage = parseInt(page || '1', 10);
  const totalPages = Math.ceil(allContacts.length / perPage);
  const paginatedContacts = allContacts.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Tabs
  const tabs: Tab[] = [
    { id: 'all', label: 'הכל', count: totalCount[0].count },
    { id: 'newsletter', label: 'ניוזלטר', count: newsletterCount[0].count },
    { id: 'club_member', label: 'מועדון לקוחות', count: clubMemberCount[0].count },
    { id: 'contact_form', label: 'יצירת קשר', count: contactFormCount[0].count },
    { id: 'popup_form', label: 'פופאפ', count: popupFormCount[0].count },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="אנשי קשר"
          description={`${totalCount[0].count} אנשי קשר${unreadCount[0].count > 0 ? ` (${unreadCount[0].count} חדשים)` : ''}`}
        />
        <ContactForm storeId={store.id} storeSlug={slug} defaultType={type === 'club_member' ? 'club_member' : type === 'newsletter' ? 'newsletter' : type === 'contact_form' ? 'contact_form' : type === 'popup_form' ? 'popup_form' : 'club_member'} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="ניוזלטר" 
          value={newsletterCount[0].count} 
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          }
        />
        <StatCard 
          label="מועדון לקוחות" 
          value={clubMemberCount[0].count} 
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          }
        />
        <StatCard 
          label="יצירת קשר" 
          value={contactFormCount[0].count} 
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          }
        />
        <StatCard 
          label="פופאפ" 
          value={popupFormCount[0].count} 
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          }
        />
      </div>

      {/* Data Table */}
      <ContactsDataTable
        contacts={paginatedContacts}
        storeId={store.id}
        tabs={tabs}
        currentTab={type || 'all'}
        searchValue={search}
        pagination={{
          currentPage,
          totalPages,
          totalItems: allContacts.length,
          perPage,
        }}
      />
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}


