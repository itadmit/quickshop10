import Link from 'next/link';

// ============================================
// StatCard - Server Component (Zero JS)
// כרטיס סטטיסטי קטן לפעולות/התראות
// ============================================

interface StatCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  href?: string;
  /** האם להציג כהתראה */
  alert?: boolean;
  icon?: React.ReactNode;
}

export function StatCard({ 
  label, 
  value, 
  subLabel, 
  href,
  alert,
  icon,
}: StatCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="text-xs sm:text-sm font-medium text-gray-600 truncate">{label}</span>
        {icon && (
          <span className={`hidden sm:block flex-shrink-0 ${alert ? 'text-amber-500' : 'text-gray-400'}`}>
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
        <span className={`text-xl sm:text-2xl font-semibold ${alert ? 'text-amber-600' : 'text-gray-900'}`}>
          {value}
        </span>
        {subLabel && (
          <span className="text-xs sm:text-sm text-gray-500">{subLabel}</span>
        )}
      </div>
      {href && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
          <span className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-900 transition-colors flex items-center gap-1">
            צפה בפרטים
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      )}
    </>
  );

  const baseClasses = `
    bg-white rounded-xl border p-3 sm:p-5 transition-all duration-150
    ${alert ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'}
    ${href ? 'hover:shadow-md hover:border-gray-300 cursor-pointer group' : ''}
  `;

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}

// ============================================
// StatCardGrid - גריד של כרטיסים
// ============================================

interface StatCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export function StatCardGrid({ children, columns = 4 }: StatCardGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-3 sm:gap-4`}>
      {children}
    </div>
  );
}

