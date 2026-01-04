'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markNotificationRead, markAllNotificationsRead } from './actions';

interface MarkReadButtonProps {
  notificationId: string;
}

export function MarkReadButton({ notificationId }: MarkReadButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    startTransition(async () => {
      await markNotificationRead(notificationId);
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
      title="סמן כנקרא"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </button>
  );
}

interface MarkAllReadButtonProps {
  storeId: string;
}

export function MarkAllReadButton({ storeId }: MarkAllReadButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    startTransition(async () => {
      await markAllNotificationsRead(storeId);
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
    >
      {isPending ? 'מעדכן...' : 'סמן הכל כנקרא'}
    </button>
  );
}


