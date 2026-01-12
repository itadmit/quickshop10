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
  // Style customization
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  inputBorderColor?: string;
  // Optional class overrides
  className?: string;
}

export function NewsletterForm({ 
  storeSlug, 
  placeholder = 'כתובת אימייל',
  buttonText = 'הרשמה',
  buttonBackgroundColor = '#000000',
  buttonTextColor = '#ffffff',
  inputBorderColor = '#e5e7eb',
  className = '',
}: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
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
          // Check if already subscribed
          if (data.alreadySubscribed) {
            setMessage({ type: 'info', text: data.message || 'האימייל כבר רשום לניוזלטר' });
          } else {
            setMessage({ type: 'success', text: data.message || 'נרשמת בהצלחה!' });
            setEmail('');
          }
        } else {
          setMessage({ type: 'error', text: data.error || 'שגיאה בהרשמה' });
        }
      } catch {
        setMessage({ type: 'error', text: 'שגיאה בהרשמה, נסו שוב' });
      }
    });
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setMessage(null);
          }}
          placeholder={placeholder}
          className="flex-1 px-6 py-4 text-sm focus:outline-none transition-colors bg-white"
          style={{ 
            borderColor: inputBorderColor, 
            borderWidth: '1px', 
            borderStyle: 'solid',
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
          }}
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-8 py-4 text-[11px] tracking-[0.15em] uppercase hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50"
          style={{ 
            backgroundColor: buttonBackgroundColor,
            color: buttonTextColor,
          }}
        >
          {isPending ? '...' : buttonText}
        </button>
      </form>
      
      {message && (
        <p className={`mt-3 text-sm text-center ${
          message.type === 'success' ? 'text-green-600' : 
          message.type === 'info' ? 'text-blue-600' : 
          'text-red-600'
        }`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
