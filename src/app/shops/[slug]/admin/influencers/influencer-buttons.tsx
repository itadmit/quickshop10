'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteInfluencer, toggleInfluencerStatus } from './actions';

interface InfluencerButtonsProps {
  influencerId: string;
  slug: string;
}

export function InfluencerButtons({ influencerId, slug }: InfluencerButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!confirm('האם למחוק את המשפיען? פעולה זו לא ניתנת לביטול.')) {
      return;
    }

    startTransition(async () => {
      const result = await deleteInfluencer(influencerId, slug);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
      title="מחק"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}

