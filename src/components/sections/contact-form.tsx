'use client';

import { useState } from 'react';
import { CheckCircle2, Send, Loader2 } from 'lucide-react';
import { tracker } from '@/lib/tracking';

interface ContactFormProps {
  storeSlug: string;
  sectionId?: string;
  submitButtonText?: string;
  formTag?: string; // תגית שתישמר עם הפנייה
  // Button styling
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  buttonBorderRadius?: number;
  buttonPadding?: number;
  buttonSize?: number;
  buttonWeight?: string;
  // Input styling
  inputBackgroundColor?: string;
  inputBorderColor?: string;
  inputBorderRadius?: number;
  inputSize?: number;
  inputColor?: string;
  // Label styling
  labelSize?: number;
  labelColor?: string;
  labelWeight?: string;
}

export function ContactForm({
  storeSlug,
  sectionId,
  submitButtonText = 'שליחה',
  formTag,
  // Button defaults
  buttonBackgroundColor = '#000',
  buttonTextColor = '#fff',
  buttonBorderRadius = 4,
  buttonPadding = 12,
  buttonSize = 14,
  buttonWeight = 'medium',
  // Input defaults
  inputBackgroundColor = '#ffffff',
  inputBorderColor = '#d1d5db',
  inputBorderRadius = 4,
  inputSize = 14,
  inputColor = '#111827',
  // Label defaults
  labelSize = 12,
  labelColor = '#6b7280',
  labelWeight = 'normal',
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
      tag: formTag, // תגית מותאמת אישית
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

  // Input styles
  const inputStyle = {
    backgroundColor: inputBackgroundColor,
    borderColor: inputBorderColor,
    borderRadius: `${inputBorderRadius}px`,
    fontSize: `${inputSize}px`,
    color: inputColor,
  };

  // Label styles
  const labelStyle = {
    fontSize: `${labelSize}px`,
    color: labelColor,
    fontWeight: labelWeight,
  };

  // Button styles
  const buttonStyle = {
    backgroundColor: buttonBackgroundColor,
    color: buttonTextColor,
    borderRadius: `${buttonBorderRadius}px`,
    padding: `${buttonPadding}px ${buttonPadding * 2}px`,
    fontSize: `${buttonSize}px`,
    fontWeight: buttonWeight,
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
    <form onSubmit={handleSubmit} className="space-y-6" data-contact-form>
      <div>
        <label 
          htmlFor="contact-name" 
          className="block uppercase tracking-widest mb-2"
          style={labelStyle}
          data-contact-label
        >
          שם מלא *
        </label>
        <input
          type="text"
          id="contact-name"
          name="name"
          required
          className="w-full px-3 py-3 border focus:outline-none focus:ring-2 focus:ring-black/20 transition-colors"
          style={inputStyle}
          placeholder=""
          data-contact-input
        />
      </div>
      
      <div>
        <label 
          htmlFor="contact-email" 
          className="block uppercase tracking-widest mb-2"
          style={labelStyle}
          data-contact-label
        >
          אימייל *
        </label>
        <input
          type="email"
          id="contact-email"
          name="email"
          required
          className="w-full px-3 py-3 border focus:outline-none focus:ring-2 focus:ring-black/20 transition-colors"
          style={inputStyle}
          placeholder=""
          dir="ltr"
          data-contact-input
        />
      </div>
      
      <div>
        <label 
          htmlFor="contact-phone" 
          className="block uppercase tracking-widest mb-2"
          style={labelStyle}
          data-contact-label
        >
          טלפון
        </label>
        <input
          type="tel"
          id="contact-phone"
          name="phone"
          className="w-full px-3 py-3 border focus:outline-none focus:ring-2 focus:ring-black/20 transition-colors"
          style={inputStyle}
          placeholder=""
          dir="ltr"
          data-contact-input
        />
      </div>
      
      <div>
        <label 
          htmlFor="contact-message" 
          className="block uppercase tracking-widest mb-2"
          style={labelStyle}
          data-contact-label
        >
          הודעה *
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={4}
          className="w-full px-3 py-3 border focus:outline-none focus:ring-2 focus:ring-black/20 transition-colors resize-none"
          style={inputStyle}
          placeholder=""
          data-contact-input
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
        className="w-full uppercase tracking-[0.1em] transition-all duration-200 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={buttonStyle}
        data-contact-button
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
