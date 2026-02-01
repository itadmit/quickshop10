'use client';

// ============================================
// MetricCard - בסגנון Untitled UI Dashboard 03
// Client Component רק בגלל הגרף האינטראקטיבי
// ============================================

interface MetricCardProps {
  label: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  data?: number[];
  /** צבע הגרף */
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

export function MetricCard({ 
  label, 
  value, 
  trend, 
  trendLabel,
  data,
  color = 'blue',
}: MetricCardProps) {
  const colors = {
    blue: { line: '#7C3AED', fill: '#7C3AED' },
    green: { line: '#10B981', fill: '#10B981' },
    purple: { line: '#8B5CF6', fill: '#8B5CF6' },
    orange: { line: '#F59E0B', fill: '#F59E0B' },
  };

  const chartColor = trend !== undefined && trend < 0 
    ? { line: '#EF4444', fill: '#EF4444' }
    : colors[color];

  return (
    <div className="relative bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow group">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-gray-500">
          {label}
        </h3>
        {/* Menu dots */}
        <button className="p-1 -m-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-gray-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Value + Trend */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-semibold text-gray-900 tracking-tight">
          {value}
        </span>
        {trend !== undefined && (
          <span className={`
            inline-flex items-center gap-0.5 text-sm font-medium
            ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}
          `}>
            {trend >= 0 ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Sparkline */}
      {data && data.length > 1 && (
        <div className="h-12 w-full">
          <Sparkline data={data} color={chartColor.line} />
        </div>
      )}

      {/* Trend Label */}
      {trendLabel && (
        <p className="text-xs text-gray-400 mt-2">{trendLabel}</p>
      )}
    </div>
  );
}

// ============================================
// Sparkline - גרף קו מינימלי
// ============================================

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;

  const width = 100;
  const height = 40;
  const padding = 2;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (d - min) / range) * (height - padding * 2);
    return [x, y];
  });

  // יצירת path חלק עם curves
  const pathD = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point[0]},${point[1]}`;
    
    const [x0, y0] = arr[i - 1];
    const [x1, y1] = point;
    const cpx = (x0 + x1) / 2;
    
    return `${acc} C ${cpx},${y0} ${cpx},${y1} ${x1},${y1}`;
  }, '');

  // Fill path
  const fillPath = `${pathD} L ${points[points.length - 1][0]},${height} L ${points[0][0]},${height} Z`;

  return (
    <svg 
      width="100%" 
      height="100%" 
      viewBox={`0 0 ${width} ${height}`} 
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      {/* Gradient fill */}
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Fill under curve */}
      <path 
        d={fillPath}
        fill={`url(#gradient-${color.replace('#', '')})`}
      />
      
      {/* Line */}
      <path 
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      
      {/* End dot */}
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r="3"
        fill={color}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </svg>
  );
}

// ============================================
// MetricsRow - שורת מטריקות (3-4 בשורה)
// ============================================

interface MetricsRowProps {
  children: React.ReactNode;
}

export function MetricsRow({ children }: MetricsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {children}
    </div>
  );
}











