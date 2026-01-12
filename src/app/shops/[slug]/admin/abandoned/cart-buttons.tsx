'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { sendRecoveryEmail } from './actions';

interface AbandonedCartButtonsProps {
  cartId: string;
  slug: string;
}

export function AbandonedCartButtons({ cartId, slug }: AbandonedCartButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const handleSendEmail = () => {
    startTransition(async () => {
      const result = await sendRecoveryEmail(cartId, slug);
      if (result.success) {
        setSent(true);
        router.refresh();
      }
    });
  };

  if (sent) {
    return (
      <span className="px-3 py-1 text-xs text-green-600">
        נשלח ✓
      </span>
    );
  }

  return (
    <button
      onClick={handleSendEmail}
      disabled={isPending}
      className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
    >
      {isPending ? '...' : 'שלח תזכורת'}
    </button>
  );
}



