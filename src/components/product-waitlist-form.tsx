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
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          נרשמת בהצלחה!
        </h3>
        <p className="text-green-700 text-sm">
          נודיע לך מיד כשהמוצר {variantTitle && `(${variantTitle}) `}יחזור למלאי
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-blue-100 rounded-full p-2 mt-0.5">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            המוצר אזל מהמלאי
          </h3>
          <p className="text-sm text-gray-600">
            השאירו פרטים ונעדכן אתכם כשהמוצר {variantTitle && `(${variantTitle}) `}יחזור למלאי
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Email (Required) */}
        <div>
          <label htmlFor="waitlist-email" className="block text-sm font-medium text-gray-700 mb-1">
            אימייל <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="waitlist-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            placeholder="email@example.com"
          />
        </div>

        {/* Optional Fields Toggle */}
        {!showOptionalFields && (
          <button
            type="button"
            onClick={() => setShowOptionalFields(true)}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            + הוסף שם וטלפון (אופציונלי)
          </button>
        )}

        {/* Optional Fields */}
        {showOptionalFields && (
          <>
            <div>
              <label htmlFor="waitlist-name" className="block text-sm font-medium text-gray-700 mb-1">
                שם פרטי (אופציונלי)
              </label>
              <input
                type="text"
                id="waitlist-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                placeholder="יוסי"
              />
            </div>

            <div>
              <label htmlFor="waitlist-phone" className="block text-sm font-medium text-gray-700 mb-1">
                טלפון (אופציונלי)
              </label>
              <input
                type="tel"
                id="waitlist-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                placeholder="050-1234567"
              />
            </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !email}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>שולח...</span>
            </>
          ) : (
            <>
              <Bell className="w-5 h-5" />
              <span>עדכנו אותי כשהמוצר יחזור</span>
            </>
          )}
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-3 text-center">
        לא נשתף את הפרטים שלך עם גורם שלישי
      </p>
    </div>
  );
}




