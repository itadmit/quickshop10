'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createWebhook } from './actions';

interface WebhookFormProps {
  storeId: string;
  slug: string;
  availableEvents: Array<{ value: string; label: string }>;
}

export function WebhookForm({ storeId, slug, availableEvents }: WebhookFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (selectedEvents.length === 0) {
      setError('יש לבחור לפחות אירוע אחד');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      url: formData.get('url') as string,
      secret: formData.get('secret') as string || undefined,
      events: selectedEvents,
    };

    startTransition(async () => {
      const result = await createWebhook(storeId, slug, data);
      
      if (result.success) {
        (e.target as HTMLFormElement).reset();
        setSelectedEvents([]);
        router.refresh();
      } else {
        setError(result.error || 'שגיאה ביצירת ה-webhook');
      }
    });
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            שם
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="התראות הזמנות"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL
          </label>
          <input
            type="url"
            name="url"
            required
            placeholder="https://example.com/webhook"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
            dir="ltr"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          אירועים
        </label>
        <div className="flex flex-wrap gap-2">
          {availableEvents.map((event) => (
            <button
              key={event.value}
              type="button"
              onClick={() => toggleEvent(event.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                selectedEvents.includes(event.value)
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              {event.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {showAdvanced ? '- הסתר הגדרות מתקדמות' : '+ הגדרות מתקדמות'}
        </button>
      </div>

      {showAdvanced && (
        <div className="border-t border-gray-100 pt-4 mt-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Secret (לאימות חתימה)
          </label>
          <input
            type="text"
            name="secret"
            placeholder="סוד אופציונלי לאימות HMAC"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
            dir="ltr"
          />
          <p className="text-xs text-gray-500 mt-1">
            אם מוגדר, כל בקשה תכלול חתימת HMAC-SHA256 ב-header
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Submit Button */}
      <div className="flex justify-start pt-4 border-t border-gray-100 mt-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer font-medium"
        >
          {isPending ? 'יוצר...' : 'צור Webhook'}
        </button>
      </div>
    </form>
  );
}


