import Link from 'next/link';
import { DateRangePicker } from './date-range-picker';

interface ReportHeaderProps {
  title: string;
  description: string;
  storeSlug: string;
  backHref?: string;
}

// Server Component - uses the client DateRangePicker
export function ReportHeader({ 
  title, 
  description, 
  storeSlug,
  backHref,
}: ReportHeaderProps) {
  const basePath = `/shops/${storeSlug}/admin/reports`;
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        {backHref && (
          <Link 
            href={backHref}
            className="text-gray-400 hover:text-black transition-colors"
          >
            ← חזרה
          </Link>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-medium">{title}</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">{description}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <DateRangePicker basePath={basePath} />
      </div>
    </div>
  );
}

// Helper function to parse date range from search params
export function parseDateRange(searchParams: { 
  period?: string; 
  from?: string; 
  to?: string 
}): { 
  startDate: Date; 
  endDate: Date; 
  periodLabel: string;
} {
  const { period, from, to } = searchParams;
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;
  let periodLabel = '30 יום';

  if (period === 'custom' && from && to) {
    startDate = new Date(from);
    endDate = new Date(to);
    periodLabel = 'תאריך מותאם';
  } else if (period === 'today') {
    startDate = new Date(now.setHours(0, 0, 0, 0));
    endDate = new Date();
    periodLabel = 'היום';
  } else if (period === 'yesterday') {
    startDate = new Date(Date.now() - 86400000);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(Date.now() - 86400000);
    endDate.setHours(23, 59, 59, 999);
    periodLabel = 'אתמול';
  } else if (period === '7d') {
    startDate = new Date(Date.now() - 7 * 86400000);
    periodLabel = 'השבוע';
  } else if (period === '90d') {
    startDate = new Date(Date.now() - 90 * 86400000);
    periodLabel = '90 יום';
  } else if (period === '6m') {
    startDate = new Date(Date.now() - 180 * 86400000);
    periodLabel = 'חצי שנה';
  } else if (period === '1y') {
    startDate = new Date(Date.now() - 365 * 86400000);
    periodLabel = 'שנה';
  } else {
    // Default to 30 days
    startDate = new Date(Date.now() - 30 * 86400000);
    periodLabel = 'החודש';
  }

  return { startDate, endDate, periodLabel };
}

// Convert to legacy period format for existing functions
export function toLegacyPeriod(searchParams: { period?: string }): '7d' | '30d' | '90d' {
  const { period } = searchParams;
  if (period === '7d' || period === 'today' || period === 'yesterday') {
    return '7d';
  }
  if (period === '90d' || period === '6m' || period === '1y') {
    return '90d';
  }
  return '30d';
}


