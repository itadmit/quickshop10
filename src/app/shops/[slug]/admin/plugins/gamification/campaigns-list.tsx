'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toggleCampaignStatus, deleteCampaign } from './actions';
import { Target, Ticket, Pencil, BarChart3, Trash2 } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  type: 'wheel' | 'scratch';
  isActive: boolean;
  title: string;
  primaryColor: string;
  impressions: number;
  plays: number;
  conversions: number;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
}

interface CampaignsListProps {
  campaigns: Campaign[];
  storeSlug: string;
}

export function CampaignsList({ campaigns, storeSlug }: CampaignsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggle = async (campaignId: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleCampaignStatus(campaignId, !currentStatus);
      router.refresh();
    });
  };

  const handleDelete = async (campaignId: string, name: string) => {
    if (!confirm(`האם למחוק את הקמפיין "${name}"? פעולה זו בלתי הפיכה.`)) {
      return;
    }
    
    startTransition(async () => {
      await deleteCampaign(campaignId);
      router.refresh();
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">קמפיין</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase w-24">סטטוס</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase w-24">צפיות</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase w-24">משחקים</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase w-24">המרות</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase w-28">אחוז המרה</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase w-32">פעולות</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {campaigns.map((campaign) => {
            const conversionRate = campaign.plays > 0 
              ? ((campaign.conversions / campaign.plays) * 100).toFixed(1) 
              : '0';

            return (
              <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4">
                  <Link 
                    href={`/shops/${storeSlug}/admin/plugins/gamification/${campaign.id}`}
                    className="flex items-center gap-3 group"
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ 
                        backgroundColor: campaign.primaryColor + '20',
                        color: campaign.primaryColor,
                      }}
                    >
                      {campaign.type === 'wheel' ? (
                        <Target className="w-5 h-5" />
                      ) : (
                        <Ticket className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {campaign.type === 'wheel' ? 'גלגל מזל' : 'כרטיס גירוד'}
                        {campaign.startDate && (
                          <> • החל מ-{new Date(campaign.startDate).toLocaleDateString('he-IL')}</>
                        )}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => handleToggle(campaign.id, campaign.isActive)}
                    disabled={isPending}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      campaign.isActive ? 'bg-green-500' : 'bg-gray-300'
                    } ${isPending ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        campaign.isActive ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-sm font-medium text-gray-900">
                    {campaign.impressions.toLocaleString()}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-sm font-medium text-gray-900">
                    {campaign.plays.toLocaleString()}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-sm font-medium text-green-600">
                    {campaign.conversions.toLocaleString()}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    parseFloat(conversionRate) >= 10 
                      ? 'bg-green-100 text-green-700' 
                      : parseFloat(conversionRate) >= 5
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}>
                    {conversionRate}%
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1 justify-end">
                    <Link
                      href={`/shops/${storeSlug}/admin/plugins/gamification/${campaign.id}`}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:scale-95 rounded-lg transition-all"
                      title="עריכה"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/shops/${storeSlug}/admin/plugins/gamification/${campaign.id}/stats`}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:scale-95 rounded-lg transition-all"
                      title="סטטיסטיקות"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(campaign.id, campaign.name)}
                      disabled={isPending}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 active:scale-95 rounded-lg transition-all disabled:opacity-50"
                      title="מחיקה"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

