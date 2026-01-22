'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ============================================
// CRM Customers List - Client Component
// ============================================

interface CrmTag {
  id: string;
  label: string;
  color: string;
  isDefault?: boolean;
}

interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  totalOrders: number | null;
  totalSpent: string | null;
  tags: string[] | null;
  createdAt: Date | null;
  lastOrderAt: Date | null;
  acceptsMarketing: boolean | null;
}

interface CustomersListProps {
  storeId: string;
  storeSlug: string;
  customers: Customer[];
  crmTags: CrmTag[];
  currentSearch: string;
  currentTag: string;
  currentSort: string;
}

export function CustomersList({
  storeId,
  storeSlug,
  customers,
  crmTags,
  currentSearch,
  currentTag,
  currentSort,
}: CustomersListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    if (search) {
      url.searchParams.set('search', search);
    } else {
      url.searchParams.delete('search');
    }
    router.push(url.pathname + url.search);
  };

  const handleTagFilter = (tagId: string) => {
    const url = new URL(window.location.href);
    if (tagId === currentTag) {
      url.searchParams.delete('tag');
    } else {
      url.searchParams.set('tag', tagId);
    }
    router.push(url.pathname + url.search);
  };

  const handleSort = (sortValue: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('sort', sortValue);
    router.push(url.pathname + url.search);
  };

  const formatCurrency = (n: string | null) => n ? `₪${Number(n).toLocaleString()}` : '₪0';
  const formatDate = (d: Date | null) => d ? new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  const getTag = (tagId: string) => crmTags.find(t => t.id === tagId);

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש לפי שם, אימייל, טלפון..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Sort */}
          <select
            value={currentSort}
            onChange={(e) => handleSort(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm"
          >
            <option value="newest">חדשים תחילה</option>
            <option value="oldest">ישנים תחילה</option>
            <option value="most_orders">הכי הרבה הזמנות</option>
            <option value="highest_value">ערך גבוה</option>
          </select>
        </div>

        {/* Tags Filter */}
        {crmTags.length > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
            <span className="text-sm text-slate-500">תגיות:</span>
            {crmTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => handleTagFilter(tag.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  currentTag === tag.id
                    ? 'ring-2 ring-offset-2'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  ...(currentTag === tag.id ? { ringColor: tag.color } : {}),
                }}
              >
                {tag.label}
              </button>
            ))}
            {currentTag && (
              <button
                onClick={() => handleTagFilter(currentTag)}
                className="text-sm text-slate-400 hover:text-slate-600 mr-2"
              >
                × נקה סינון
              </button>
            )}
          </div>
        )}
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">אין לקוחות</h3>
            <p className="text-slate-500">לקוחות יופיעו כאן כשירכשו או יירשמו</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">לקוח</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">תגיות</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">הזמנות</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">סה״כ רכישות</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">הזמנה אחרונה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">נרשם</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map(customer => {
                const name = customer.firstName || customer.lastName 
                  ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                  : '-';
                const customerTags = (customer.tags || []) as string[];
                
                return (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/shops/${storeSlug}/admin/plugins/crm/customers/${customer.id}`}
                        className="flex items-center gap-3"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-violet-400 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {(name !== '-' ? name : customer.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 hover:text-indigo-600 transition-colors">
                            {name !== '-' ? name : customer.email}
                          </p>
                          <p className="text-sm text-slate-500">{customer.email}</p>
                          {customer.phone && (
                            <p className="text-xs text-slate-400">{customer.phone}</p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {customerTags.length === 0 ? (
                          <span className="text-xs text-slate-400">-</span>
                        ) : (
                          customerTags.map(tagId => {
                            const tag = getTag(tagId);
                            if (!tag) return null;
                            return (
                              <span
                                key={tagId}
                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: `${tag.color}20`,
                                  color: tag.color,
                                }}
                              >
                                {tag.label}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">{customer.totalOrders || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">{formatCurrency(customer.totalSpent)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">{formatDate(customer.lastOrderAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">{formatDate(customer.createdAt)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

