'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { removeMember, cancelInvitation } from './actions';

interface MemberButtonsProps {
  memberId: string;
  slug: string;
  type: 'member' | 'invitation';
}

export function MemberButtons({ memberId, slug, type }: MemberButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRemove = () => {
    startTransition(async () => {
      if (type === 'member') {
        await removeMember(memberId, slug);
      } else {
        await cancelInvitation(memberId, slug);
      }
      router.refresh();
    });
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? '...' : 'אישור'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
          className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
        >
          ביטול
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
      title={type === 'member' ? 'הסר חבר צוות' : 'בטל הזמנה'}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" />
      </svg>
    </button>
  );
}




