import Link from 'next/link';

// ============================================
// PageHeader - Server Component (Zero JS)
// סגנון Untitled UI - אחיד לכל הדפים
// ============================================

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  badge?: {
    label: string;
    variant?: 'default' | 'success' | 'warning' | 'error';
  };
  actions?: React.ReactNode;
  /** תאריך להצגה (לדשבורד) */
  date?: string;
}

export function PageHeader({ 
  title, 
  description, 
  breadcrumbs,
  badge,
  actions,
  date,
}: PageHeaderProps) {
  return (
    <div className="pb-4 sm:pb-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm mb-2 sm:mb-3 overflow-x-auto">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1.5 flex-shrink-0">
              {index > 0 && (
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              )}
              {crumb.href ? (
                <Link 
                  href={crumb.href}
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-900 font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          {/* Title + Badge */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
              {title}
            </h1>
            {badge && (
              <span className={`
                inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium
                ${badge.variant === 'success' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' : ''}
                ${badge.variant === 'warning' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' : ''}
                ${badge.variant === 'error' ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20' : ''}
                ${!badge.variant || badge.variant === 'default' ? 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/10' : ''}
              `}>
                {badge.label}
              </span>
            )}
          </div>

          {/* Description or Date */}
          {(description || date) && (
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              {description || date}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Button Components
// Primary = שחור (Connect style)
// Secondary = לבן עם בורדר (Share style)
// ============================================

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  icon?: 'plus' | 'download' | 'upload' | 'filter' | 'settings' | 'refresh';
  className?: string;
}

// Icon SVGs
function PlusIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function DownloadIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function UploadIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function FilterIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

function SettingsIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function RefreshIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

const IconComponents = {
  plus: PlusIcon,
  download: DownloadIcon,
  upload: UploadIcon,
  filter: FilterIcon,
  settings: SettingsIcon,
  refresh: RefreshIcon,
};

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  href, 
  icon,
  className = '',
}: ButtonProps) {
  // Base styles
  const baseStyles = "inline-flex items-center justify-center gap-1.5 sm:gap-2 font-medium rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap";
  
  // Variant styles - Primary = Black, Secondary = White with border
  const variants = {
    primary: "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100",
    ghost: "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100",
  };

  // Size styles - more compact on mobile
  const sizes = {
    sm: "px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm",
    md: "px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm",
    lg: "px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm",
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  // Icon component
  const IconComponent = icon ? IconComponents[icon] : null;

  const content = (
    <>
      {IconComponent && <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes}>
      {content}
    </button>
  );
}

// Legacy Icons export for backwards compatibility
export const Icons = {
  plus: 'plus' as const,
  download: 'download' as const,
  upload: 'upload' as const,
  filter: 'filter' as const,
  settings: 'settings' as const,
  refresh: 'refresh' as const,
};
