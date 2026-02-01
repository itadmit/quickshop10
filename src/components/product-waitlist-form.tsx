'use client';

import { useState } from 'react';
import { Bell, CheckCircle2, Loader2 } from 'lucide-react';

interface ProductWaitlistFormProps {
  storeSlug: string;
  productId: string;
  variantId?: string | null;
  variantTitle?: string | null;
}

export function ProductWaitlistForm({ storeSlug, productId, variantId, variantTitle }: ProductWaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/storefront/${storeSlug}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          variantId,
          email: email.trim(),
          firstName: firstName.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setEmail('');
        setFirstName('');
        setPhone('');
        
        // Hide success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(data.error || 'אירעה שגיאה. אנא נסה שוב');
      }
    } catch (err) {
      setError('אירעה שגיאה בשליחת הבקשה');
      console.error('Waitlist error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 p-4 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-green-900 mb-1">
          נרשמת בהצלחה!
        </h3>
        <p className="text-green-700 text-sm">
          נודיע לך מיד כשהמוצר {variantTitle && `(${variantTitle}) `}יחזור למלאי
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="bg-gray-200 rounded-full p-2">
          <Bell className="w-4 h-4 text-gray-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">
          המוצר אזל מהמלאי
        </h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        השאירו פרטים ונעדכן אתכם כשהמוצר {variantTitle && `(${variantTitle}) `}יחזור למלאי
      </p>

      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Email (Required) */}
        <div>
          <label htmlFor="waitlist-email" className="block text-xs font-medium text-gray-700 mb-1">
            אימייל <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="waitlist-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm border border-gray-300 focus:ring-1 focus:ring-black focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            placeholder="email@example.com"
          />
        </div>

        {/* Optional Fields Toggle */}
        {!showOptionalFields && (
          <button
            type="button"
            onClick={() => setShowOptionalFields(true)}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
          >
            <span className="text-gray-400">+</span> הוסף שם וטלפון
          </button>
        )}

        {/* Optional Fields */}
        {showOptionalFields && (
          <div className="space-y-2 pt-1">
            <div>
              <label htmlFor="waitlist-name" className="block text-xs font-medium text-gray-700 mb-1">
                שם פרטי
              </label>
              <input
                type="text"
                id="waitlist-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm border border-gray-300 focus:ring-1 focus:ring-black focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                placeholder="יוסי"
              />
            </div>

            <div>
              <label htmlFor="waitlist-phone" className="block text-xs font-medium text-gray-700 mb-1">
                טלפון
              </label>
              <input
                type="tel"
                id="waitlist-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm border border-gray-300 focus:ring-1 focus:ring-black focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                placeholder="050-1234567"
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black hover:bg-gray-800 text-white text-sm font-medium py-2.5 transition-colors disabled:bg-gray-600 disabled:cursor-wait flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>שולח...</span>
            </>
          ) : (
            <span>עדכנו אותי כשהמוצר יחזור</span>
          )}
        </button>

        <p className="text-[10px] text-gray-400 text-center">
          בלחיצה על הכפתור אני מאשר/ת את תנאי הפרטיות של האתר
        </p>
      </form>
    </div>
  );
}










