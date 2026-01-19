'use client';

import { useState } from 'react';
import { CheckCircle2, Send, Loader2 } from 'lucide-react';
import { tracker } from '@/lib/tracking';

interface ContactFormProps {
  storeSlug: string;
  sectionId?: string;
  submitButtonText?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
}

export function ContactForm({
  storeSlug,
  sectionId,
  submitButtonText = 'שליחה',
  buttonBackgroundColor = '#000',
  buttonTextColor = '#fff',
}: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      message: formData.get('message') as string,
      sectionId,
    };
    
    try {
      const response = await fetch(`/api/shops/${storeSlug}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsSuccess(true);
        // Reset form
        (e.target as HTMLFormElement).reset();
        
        // Track Contact event for successful form submission
        tracker.contact('contact_form');
      } else {
        setError(result.error || 'אירעה שגיאה בשליחת הטופס');
      }
    } catch {
      setError('אירעה שגיאה בשליחת הטופס');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isSuccess) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-medium text-gray-900">הפנייה נשלחה בהצלחה!</h3>
        <p className="text-gray-600">תודה על פנייתך. נחזור אליך בהקדם.</p>
        <button
          type="button"
          onClick={() => setIsSuccess(false)}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
        >
          שלח פנייה נוספת
        </button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="contact-name" className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
          שם מלא *
        </label>
        <input
          type="text"
          id="contact-name"
          name="name"
          required
          className="w-full px-0 py-3 bg-transparent border-0 border-b border-gray-300 focus:outline-none focus:border-black transition-colors text-sm"
          placeholder=""
        />
      </div>
      
      <div>
        <label htmlFor="contact-email" className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
          אימייל *
        </label>
        <input
          type="email"
          id="contact-email"
          name="email"
          required
          className="w-full px-0 py-3 bg-transparent border-0 border-b border-gray-300 focus:outline-none focus:border-black transition-colors text-sm"
          placeholder=""
          dir="ltr"
        />
      </div>
      
      <div>
        <label htmlFor="contact-phone" className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
          טלפון
        </label>
        <input
          type="tel"
          id="contact-phone"
          name="phone"
          className="w-full px-0 py-3 bg-transparent border-0 border-b border-gray-300 focus:outline-none focus:border-black transition-colors text-sm"
          placeholder=""
          dir="ltr"
        />
      </div>
      
      <div>
        <label htmlFor="contact-message" className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
          הודעה *
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={4}
          className="w-full px-0 py-3 bg-transparent border-0 border-b border-gray-300 focus:outline-none focus:border-black transition-colors text-sm resize-none"
          placeholder=""
        />
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 px-8 text-xs font-normal tracking-[0.2em] uppercase transition-all duration-200 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          backgroundColor: buttonBackgroundColor,
          color: buttonTextColor,
        }}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            שולח...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            {submitButtonText}
          </>
        )}
      </button>
    </form>
  );
}

