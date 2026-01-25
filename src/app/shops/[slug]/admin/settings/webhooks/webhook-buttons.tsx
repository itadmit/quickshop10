'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleWebhook, deleteWebhook, testWebhook } from './actions';

interface WebhookButtonsProps {
  webhookId: string;
  slug: string;
  isActive: boolean;
}

export function WebhookButtons({ webhookId, slug, isActive }: WebhookButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleToggle = () => {
    startTransition(async () => {
      await toggleWebhook(webhookId, slug, !isActive);
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteWebhook(webhookId, slug);
      router.refresh();
    });
  };

  const handleTest = () => {
    setTestResult(null);
    startTransition(async () => {
      const result = await testWebhook(webhookId, slug);
      setTestResult(result);
      setTimeout(() => setTestResult(null), 5000);
    });
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? '...' : 'מחק'}
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
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleTest}
          disabled={isPending || !isActive}
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
          title="שלח בקשת בדיקה"
        >
          {isPending ? '...' : 'בדיקה'}
        </button>
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`px-3 py-1 text-xs rounded-lg ${
            isActive 
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          } disabled:opacity-50`}
        >
          {isPending ? '...' : isActive ? 'השבת' : 'הפעל'}
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          title="מחק webhook"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" />
          </svg>
        </button>
      </div>
      {testResult && (
        <span className={`text-xs ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
          {testResult.message}
        </span>
      )}
    </div>
  );
}






