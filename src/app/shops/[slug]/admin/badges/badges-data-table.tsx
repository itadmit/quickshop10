'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { deleteBadge, toggleBadgeStatus } from './actions';
import type { ProductBadge } from '@/lib/db/schema';

interface Category {
  id: string;
  name: string;
}

interface BadgesDataTableProps {
  badges: ProductBadge[];
  storeSlug: string;
  storeId: string;
  categories: Category[];
  appliesToLabels: Record<string, string>;
  positionLabels: Record<string, string>;
}

export function BadgesDataTable({ 
  badges: initialBadges, 
  storeSlug,
  categories,
  appliesToLabels,
  positionLabels,
}: BadgesDataTableProps) {
  const [badges, setBadges] = useState(initialBadges);
  const [isPending, startTransition] = useTransition();
  
  const handleDelete = async (badgeId: string) => {
    if (!confirm('למחוק את המדבקה?')) return;
    
    startTransition(async () => {
      const result = await deleteBadge(badgeId, storeSlug);
      if (result.success) {
        setBadges(badges.filter(b => b.id !== badgeId));
      }
    });
  };
  
  const handleToggleStatus = async (badgeId: string, currentStatus: boolean) => {
    startTransition(async () => {
      const result = await toggleBadgeStatus(badgeId, storeSlug, !currentStatus);
      if (result.success) {
        setBadges(badges.map(b => 
          b.id === badgeId ? { ...b, isActive: !currentStatus } : b
        ));
      }
    });
  };

  // Get category names for badge
  const getCategoryNames = (categoryIds: string[] | null) => {
    if (!categoryIds || categoryIds.length === 0) return '-';
    const names = categoryIds
      .map(id => categories.find(c => c.id === id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : '-';
  };
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
              מדבקה
            </th>
            <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
              אופן החלה
            </th>
            <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
              מיקום
            </th>
            <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
              סטטוס
            </th>
            <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
              פעולות
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {badges.map(badge => (
            <tr key={badge.id} className={`hover:bg-gray-50 ${!badge.isActive ? 'opacity-50' : ''}`}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <span 
                    className="px-3 py-1 text-sm font-medium"
                    style={{ 
                      backgroundColor: badge.backgroundColor,
                      color: badge.textColor,
                    }}
                  >
                    {badge.text}
                  </span>
                  <span className="text-sm text-gray-500">{badge.name}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div>
                  <span className="text-sm text-gray-900">
                    {appliesToLabels[badge.appliesTo] || badge.appliesTo}
                  </span>
                  {badge.appliesTo === 'new' && (
                    <span className="text-xs text-gray-500 block">
                      {badge.newProductDays} ימים
                    </span>
                  )}
                  {badge.appliesTo === 'category' && (
                    <span className="text-xs text-gray-500 block">
                      {getCategoryNames(badge.categoryIds as string[])}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-900">
                  {positionLabels[badge.position] || badge.position}
                </span>
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => handleToggleStatus(badge.id, badge.isActive)}
                  disabled={isPending}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    badge.isActive 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {badge.isActive ? 'פעיל' : 'מושבת'}
                </button>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/shops/${storeSlug}/admin/badges/${badge.id}`}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="עריכה"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDelete(badge.id)}
                    disabled={isPending}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="מחיקה"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

