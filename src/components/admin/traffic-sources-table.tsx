'use client';

import { useState, useMemo, useCallback } from 'react';
import { ExportButton } from './sortable-table';

// Types
type SortKey = 'source' | 'visits' | 'orders' | 'revenue' | 'conversionRate';
type SortDirection = 'asc' | 'desc';

interface TrafficSource {
  source: string;
  visits: number;
  orders: number;
  revenue: number;
  conversionRate: number;
  isOffline: boolean;
}

interface TrafficSourcesTableProps {
  sources: TrafficSource[];
  sourceLabels: Record<string, string>;
}

// Format helpers (client-side)
function formatCurrency(value: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('he-IL').format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

// Sort icon
function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <span className="inline-flex flex-col mr-1 text-[10px] leading-none">
      <span className={active && direction === 'asc' ? 'text-black' : 'text-gray-300'}>▲</span>
      <span className={active && direction === 'desc' ? 'text-black' : 'text-gray-300'}>▼</span>
    </span>
  );
}

export function TrafficSourcesTable({ sources, sourceLabels }: TrafficSourcesTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('visits');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Handle sort click
  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  }, [sortKey]);

  // Sort data
  const sortedSources = useMemo(() => {
    return [...sources].sort((a, b) => {
      // Offline sources always at bottom
      if (a.isOffline !== b.isOffline) return a.isOffline ? 1 : -1;
      
      let aVal: number | string;
      let bVal: number | string;
      
      switch (sortKey) {
        case 'source':
          aVal = sourceLabels[a.source] || a.source;
          bVal = sourceLabels[b.source] || b.source;
          break;
        case 'visits':
          aVal = a.visits;
          bVal = b.visits;
          break;
        case 'orders':
          aVal = a.orders;
          bVal = b.orders;
          break;
        case 'revenue':
          aVal = a.revenue;
          bVal = b.revenue;
          break;
        case 'conversionRate':
          aVal = a.conversionRate;
          bVal = b.conversionRate;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
      }
      
      return sortDirection === 'desc' 
        ? String(bVal).localeCompare(String(aVal), 'he')
        : String(aVal).localeCompare(String(bVal), 'he');
    });
  }, [sources, sortKey, sortDirection, sourceLabels]);

  // Calculate totals
  const totalVisits = sources.filter(s => !s.isOffline).reduce((sum, s) => sum + s.visits, 0);
  const totalOrders = sources.reduce((sum, s) => sum + s.orders, 0);
  const totalRevenue = sources.reduce((sum, s) => sum + s.revenue, 0);

  // Export data
  const exportData = useMemo(() => 
    sources.map(s => ({
      source: sourceLabels[s.source] || s.source,
      visits: s.isOffline ? 'לא באתר' : s.visits,
      percentage: s.isOffline ? '-' : `${(totalVisits > 0 ? (s.visits / totalVisits) * 100 : 0).toFixed(1)}%`,
      orders: s.orders,
      revenue: s.revenue,
      conversionRate: s.isOffline ? '-' : `${s.conversionRate.toFixed(1)}%`,
    }))
  , [sources, sourceLabels, totalVisits]);

  const exportColumns = [
    { key: 'source', label: 'מקור' },
    { key: 'visits', label: 'ביקורים' },
    { key: 'percentage', label: '% מסה״כ' },
    { key: 'orders', label: 'הזמנות' },
    { key: 'revenue', label: 'הכנסות' },
    { key: 'conversionRate', label: 'שיעור המרה' },
  ];

  if (!sources.length) {
    return <p className="text-gray-500 text-center py-12">אין נתוני תנועה לתקופה זו</p>;
  }

  const SortableHeader = ({ 
    label, 
    sortKeyVal 
  }: { 
    label: string; 
    sortKeyVal: SortKey;
  }) => (
    <th
      className="py-3 px-4 font-medium text-gray-500 text-sm cursor-pointer hover:text-black select-none"
      onClick={() => handleSort(sortKeyVal)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon active={sortKey === sortKeyVal} direction={sortDirection} />
      </span>
    </th>
  );

  return (
    <div>
      {/* Export button */}
      <div className="flex justify-end mb-3">
        <ExportButton 
          data={exportData} 
          columns={exportColumns}
          filename="traffic-sources"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 text-right">
              <SortableHeader label="מקור" sortKeyVal="source" />
              <SortableHeader label="ביקורים" sortKeyVal="visits" />
              <th className="py-3 px-4 font-medium text-gray-500 text-sm">% מסה״כ</th>
              <SortableHeader label="הזמנות" sortKeyVal="orders" />
              <SortableHeader label="הכנסות" sortKeyVal="revenue" />
              <SortableHeader label="שיעור המרה" sortKeyVal="conversionRate" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedSources.map((source) => (
              <tr key={source.source} className="hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">
                  <div className="flex items-center gap-2">
                    {sourceLabels[source.source] || source.source}
                    {source.isOffline && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                        לא באתר
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  {source.isOffline ? (
                    <span className="text-gray-400">—</span>
                  ) : (
                    formatNumber(source.visits)
                  )}
                </td>
                <td className="py-3 px-4">
                  {source.isOffline ? (
                    <span className="text-gray-400">—</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 max-w-20">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${totalVisits > 0 ? (source.visits / totalVisits) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">
                        {totalVisits > 0 ? ((source.visits / totalVisits) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  {source.orders > 0 ? (
                    <span className="font-medium">{formatNumber(source.orders)}</span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </td>
                <td className="py-3 px-4 font-medium">
                  {source.revenue > 0 ? formatCurrency(source.revenue) : <span className="text-gray-400">₪0</span>}
                </td>
                <td className="py-3 px-4">
                  {source.isOffline ? (
                    <span className="text-gray-400">—</span>
                  ) : source.conversionRate > 0 ? (
                    <span className={`${source.conversionRate >= 3 ? 'text-green-600' : source.conversionRate >= 1 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {formatPercent(source.conversionRate)}
                    </span>
                  ) : (
                    <span className="text-gray-400">0%</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-medium">
              <td className="py-3 px-4">סה״כ</td>
              <td className="py-3 px-4">{formatNumber(totalVisits)}</td>
              <td className="py-3 px-4">100%</td>
              <td className="py-3 px-4">{formatNumber(totalOrders)}</td>
              <td className="py-3 px-4">{formatCurrency(totalRevenue)}</td>
              <td className="py-3 px-4">
                <span className={`${(totalOrders / totalVisits) * 100 >= 3 ? 'text-green-600' : 'text-gray-600'}`}>
                  {totalVisits > 0 ? formatPercent((totalOrders / totalVisits) * 100) : '0%'}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

