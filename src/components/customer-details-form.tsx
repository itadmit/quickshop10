'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CustomerData {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  acceptsMarketing?: boolean | null;
}

interface CustomerDetailsFormProps {
  customer: CustomerData;
  basePath: string;
}

export function CustomerDetailsForm({ customer, basePath }: CustomerDetailsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: customer.firstName || '',
    lastName: customer.lastName || '',
    phone: customer.phone || '',
    acceptsMarketing: customer.acceptsMarketing || false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/customer/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'שגיאה בעדכון הפרטים');
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError('שגיאה בעדכון הפרטים');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email - Read Only */}
        <div>
          <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
            אימייל
          </label>
          <input
            type="email"
            value={customer.email}
            disabled
            className="w-full px-4 py-3.5 border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
            dir="ltr"
          />
          <p className="text-xs text-gray-400 mt-1">
            לא ניתן לשנות את כתובת האימייל
          </p>
        </div>

        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
              שם פרטי
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
              שם משפחה
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border border-gray-200 focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[11px] tracking-[0.15em] uppercase text-gray-500 mb-2">
            טלפון
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3.5 border border-gray-200 focus:border-black transition-colors"
            placeholder="05X-XXXXXXX"
            dir="ltr"
          />
        </div>

        {/* Marketing Consent */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="acceptsMarketing"
            checked={formData.acceptsMarketing}
            onChange={handleChange}
            className="mt-1 w-4 h-4 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-600">
            אשמח לקבל עדכונים ומבצעים במייל
          </span>
        </label>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            הפרטים עודכנו בהצלחה ✓
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary py-4"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              שומר...
            </span>
          ) : 'שמור שינויים'}
        </button>
      </form>
    </div>
  );
}




