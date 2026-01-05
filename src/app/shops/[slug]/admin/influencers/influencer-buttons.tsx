'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteInfluencer, toggleInfluencerStatus } from './actions';

interface InfluencerButtonsProps {
  influencerId: string;
  slug: string;
}

export function InfluencerButtons({ influencerId, slug }: InfluencerButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
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

  const handleCopyLoginLink = async () => {
    const baseUrl = window.location.origin;
    const loginUrl = `${baseUrl}/shops/${slug}/influencer/login`;
    
    try {
      await navigator.clipboard.writeText(loginUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      {/* Copy Login Link Button */}
      <button
        onClick={handleCopyLoginLink}
        className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
        title={copied ? 'הועתק!' : 'העתק לינק התחברות'}
      >
        {copied ? (
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )}
      </button>
      
      {/* Delete Button */}
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
    </>
  );
}

