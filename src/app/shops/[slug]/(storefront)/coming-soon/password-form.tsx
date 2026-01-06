'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// Password Form - Client Component
// Allows visitors to bypass Coming Soon with password
// ============================================

interface PasswordFormProps {
  storeSlug: string;
  correctPassword: string;
}

export function PasswordForm({ storeSlug, correctPassword }: PasswordFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (password === correctPassword) {
      // Set cookie to bypass coming soon
      document.cookie = `preview_${storeSlug}=true; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
      router.push(`/shops/${storeSlug}`);
      router.refresh();
    } else {
      setError('סיסמה שגויה');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row max-w-md mx-auto gap-3 animate-slide-up" style={{ animationDelay: '400ms' }}>
      <div className="flex-1 relative">
        <input 
          type="password" 
          placeholder="הכנס סיסמה לצפייה באתר..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full px-6 py-4 bg-white/5 border text-white text-sm placeholder:text-white/30 focus:border-white/30 transition-colors ${
            error ? 'border-red-500/50' : 'border-white/10'
          }`}
        />
        {error && (
          <p className="absolute -bottom-6 right-0 text-xs text-red-400">{error}</p>
        )}
      </div>
      <button 
        type="submit"
        disabled={isSubmitting || !password}
        className="px-8 py-4 bg-white text-black text-[11px] tracking-[0.15em] uppercase hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '...' : 'כניסה'}
      </button>
    </form>
  );
}

