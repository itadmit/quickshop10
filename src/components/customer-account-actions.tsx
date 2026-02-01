'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CustomerAccountActionsProps {
  basePath: string;
}

export function CustomerAccountActions({ basePath }: CustomerAccountActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/customer/auth/logout', { method: 'POST' });
      router.push(basePath);
      router.refresh();
    } catch {
      // Ignore errors
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-3 w-full px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      {isLoading ? 'מתנתק...' : 'התנתק'}
    </button>
  );
}











