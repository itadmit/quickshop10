'use client';

import { useState } from 'react';
import Link from 'next/link';

// ============================================
// CRM Dashboard - Client Component
// Stats, recent customers, and quick actions
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
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface CRMDashboardProps {
  storeId: string;
  storeSlug: string;
  stats: {
    totalCustomers: number;
    posOrders: number;
    posRevenue: number;
    pendingTasks: number;
  };
  crmTags: CrmTag[];
  recentCustomers: Customer[];
  teamMembers: TeamMember[];
}

export function CRMDashboard({
  storeId,
  storeSlug,
  stats,
  crmTags,
  recentCustomers,
  teamMembers,
}: CRMDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<'customers' | 'tasks'>('customers');

  // Helper to get tag by ID
  const getTag = (tagId: string) => crmTags.find(t => t.id === tagId);

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              <p className="text-sm text-gray-500">לקוחות</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.posOrders}</p>
              <p className="text-sm text-gray-500">הזמנות POS</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">₪{stats.posRevenue.toLocaleString()}</p>
              <p className="text-sm text-gray-500">הכנסות POS</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</p>
              <p className="text-sm text-gray-500">משימות ממתינות</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href={`/shops/${storeSlug}/admin/plugins/pos`}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900">קופה</p>
            <p className="text-xs text-gray-500">פתח את הקופה</p>
          </div>
        </Link>

        <Link
          href={`/shops/${storeSlug}/admin/contacts`}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900">אנשי קשר</p>
            <p className="text-xs text-gray-500">ניהול לקוחות</p>
          </div>
        </Link>

        <Link
          href={`/shops/${storeSlug}/admin/orders`}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900">הזמנות</p>
            <p className="text-xs text-gray-500">ניהול הזמנות</p>
          </div>
        </Link>

        <Link
          href={`/shops/${storeSlug}/admin/plugins/crm/tasks`}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900">משימות</p>
            <p className="text-xs text-gray-500">ניהול משימות</p>
          </div>
        </Link>
      </div>

      {/* Tags Overview */}
      {crmTags.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">תגיות CRM</h2>
            <Link
              href={`/shops/${storeSlug}/admin/plugins/crm/settings`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ערוך תגיות
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {crmTags.map(tag => (
              <span
                key={tag.id}
                className="px-3 py-1.5 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Customers */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">לקוחות אחרונים</h2>
          <Link
            href={`/shops/${storeSlug}/admin/contacts?type=customer`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            הצג הכל
          </Link>
        </div>
        
        {recentCustomers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>עדיין אין לקוחות</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentCustomers.map(customer => {
              const name = customer.firstName || customer.lastName 
                ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                : customer.email;
              const customerTags = (customer.tags || []) as string[];
              
              return (
                <Link
                  key={customer.id}
                  href={`/shops/${storeSlug}/admin/contacts/${customer.id}`}
                  className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{customer.email}</span>
                        {customer.totalOrders ? (
                          <span>• {customer.totalOrders} הזמנות</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {customerTags.slice(0, 3).map(tagId => {
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
                    })}
                    <span className="text-xs text-gray-400">{formatDate(customer.createdAt)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Team Members */}
      {teamMembers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">צוות החנות</h2>
          <div className="flex flex-wrap gap-3">
            {teamMembers.map(member => (
              <div
                key={member.id}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">
                    {member.role === 'owner' ? 'בעלים' : 
                     member.role === 'manager' ? 'מנהל' :
                     member.role === 'marketing' ? 'שיווק' : member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

