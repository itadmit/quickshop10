'use client';

import { useState, useTransition } from 'react';

/**
 * Newsletter Form Component
 * 
 * Client component for newsletter subscription.
 * Uses optimistic UI for instant feedback.
 * 
 * PERFORMANCE: Minimal JS, simple form with fetch
 */

interface NewsletterFormProps {
  storeSlug: string;
  placeholder?: string;
  buttonText?: string;
}

export function NewsletterForm({ 
  storeSlug, 
  placeholder = 'כתובת אימייל',
  buttonText = 'הרשמה',
}: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'נא להזין כתובת אימייל תקינה' });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/shops/${storeSlug}/newsletter/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (data.success) {
          setMessage({ type: 'success', text: data.message });
          setEmail('');
        } else {
          setMessage({ type: 'error', text: data.error || 'שגיאה בהרשמה' });
        }
      } catch {
        setMessage({ type: 'error', text: 'שגיאה בהרשמה, נסו שוב' });
      }
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setMessage(null);
          }}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 border border-current/20 rounded-lg text-sm bg-transparent placeholder:opacity-50 focus:outline-none focus:border-current/40"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-current text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: 'currentColor' }}
        >
          <span className="text-white mix-blend-difference">
            {isPending ? '...' : buttonText}
          </span>
        </button>
      </form>
      
      {message && (
        <p className={`mt-2 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}


