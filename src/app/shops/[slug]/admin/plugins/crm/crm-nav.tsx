'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ============================================
// CRM Internal Navigation
// Tab-style navigation within CRM pages
// ============================================

interface CrmNavProps {
  storeSlug: string;
}

export function CrmNav({ storeSlug }: CrmNavProps) {
  const pathname = usePathname();
  const basePath = `/shops/${storeSlug}/admin/plugins/crm`;

  const tabs = [
    { href: basePath, label: 'דשבורד', exact: true },
    { href: `${basePath}/customers`, label: 'לקוחות' },
    { href: `${basePath}/tasks`, label: 'משימות' },
    { href: `${basePath}/reports`, label: 'דוחות' },
    { href: `${basePath}/settings`, label: 'הגדרות' },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex gap-1 -mb-px">
        {tabs.map((tab) => {
          const active = isActive(tab.href, tab.exact);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
                ${active
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}







