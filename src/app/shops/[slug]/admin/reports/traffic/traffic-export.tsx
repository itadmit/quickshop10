'use client';

import { useCallback } from 'react';

interface TrafficSource {
  source: string;
  visits: number;
  orders: number;
  revenue: number;
  conversionRate: number;
  isOffline: boolean;
}

interface ExportData {
  sources: TrafficSource[];
  devices: Array<{ deviceType: string; sessions: number }>;
  utmMedium: Array<{ medium: string; sessions: number }>;
  utmCampaign: Array<{ campaign: string; sessions: number }>;
  utmContent: Array<{ content: string; sessions: number }>;
  landingPages: Array<{ page: string; sessions: number }>;
  funnel: Array<{ step: string; count: number; rate: number }>;
  totals: {
    visits: number;
    orders: number;
    revenue: number;
    conversionRate: number;
  };
}

interface TrafficReportExportProps {
  data: ExportData;
  period: string;
  sourceLabels: Record<string, string>;
}

const deviceLabels: Record<string, string> = {
  mobile: 'מובייל',
  desktop: 'דסקטופ',
  tablet: 'טאבלט',
  unknown: 'אחר',
};

export function TrafficReportExport({ data, period, sourceLabels }: TrafficReportExportProps) {
  const handleExport = useCallback(() => {
    const lines: string[] = [];
    
    // Header
    lines.push('דוח תנועה');
    lines.push(`תקופה: ${period}`);
    lines.push(`תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}`);
    lines.push('');
    
    // Summary
    lines.push('סיכום');
    lines.push('מדד,ערך');
    lines.push(`ביקורים באתר,${data.totals.visits}`);
    lines.push(`הזמנות,${data.totals.orders}`);
    lines.push(`הכנסות,₪${data.totals.revenue.toFixed(2)}`);
    lines.push(`שיעור המרה,${data.totals.conversionRate.toFixed(1)}%`);
    lines.push('');
    
    // Traffic Sources
    lines.push('מקורות תנועה והמרות');
    lines.push('מקור,ביקורים,הזמנות,הכנסות,שיעור המרה');
    data.sources.forEach(s => {
      const sourceName = sourceLabels[s.source] || s.source;
      const visits = s.isOffline ? 'לא באתר' : s.visits;
      const conversion = s.isOffline ? '-' : `${s.conversionRate.toFixed(1)}%`;
      lines.push(`${sourceName},${visits},${s.orders},₪${s.revenue.toFixed(2)},${conversion}`);
    });
    lines.push('');
    
    // Devices
    if (data.devices.length > 0) {
      lines.push('מכשירים');
      lines.push('סוג מכשיר,ביקורים');
      data.devices.forEach(d => {
        lines.push(`${deviceLabels[d.deviceType] || d.deviceType},${d.sessions}`);
      });
      lines.push('');
    }
    
    // UTM Medium
    if (data.utmMedium.length > 0) {
      lines.push('UTM Medium');
      lines.push('Medium,ביקורים');
      data.utmMedium.forEach(u => {
        lines.push(`${u.medium},${u.sessions}`);
      });
      lines.push('');
    }
    
    // UTM Campaign
    if (data.utmCampaign.length > 0) {
      lines.push('UTM Campaign');
      lines.push('Campaign,ביקורים');
      data.utmCampaign.forEach(u => {
        // Escape commas in campaign names
        const campaign = u.campaign.includes(',') ? `"${u.campaign}"` : u.campaign;
        lines.push(`${campaign},${u.sessions}`);
      });
      lines.push('');
    }
    
    // UTM Content
    if (data.utmContent.length > 0) {
      lines.push('UTM Content');
      lines.push('Content,ביקורים');
      data.utmContent.forEach(u => {
        const content = u.content.includes(',') ? `"${u.content}"` : u.content;
        lines.push(`${content},${u.sessions}`);
      });
      lines.push('');
    }
    
    // Landing Pages
    if (data.landingPages.length > 0) {
      lines.push('דפי נחיתה');
      lines.push('דף,ביקורים');
      data.landingPages.forEach(p => {
        const page = p.page.includes(',') ? `"${p.page}"` : p.page;
        lines.push(`${page},${p.sessions}`);
      });
      lines.push('');
    }
    
    // Conversion Funnel
    if (data.funnel.length > 0) {
      lines.push('משפך המרה');
      lines.push('שלב,כמות,אחוז');
      data.funnel.forEach(f => {
        lines.push(`${f.step},${f.count},${f.rate.toFixed(1)}%`);
      });
    }
    
    // Create and download CSV
    const csv = `\uFEFF${lines.join('\n')}`; // BOM for Hebrew
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `traffic-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data, period, sourceLabels]);

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      ייצוא דוח
    </button>
  );
}

