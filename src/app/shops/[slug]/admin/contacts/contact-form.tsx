'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createContact } from './actions';
import { ContactImportForm } from './import-form';

interface ContactFormProps {
  storeId: string;
  storeSlug: string;
  defaultType?: 'newsletter' | 'club_member' | 'contact_form' | 'popup_form';
}

const typeLabels = {
  newsletter: 'ניוזלטר',
  club_member: 'מועדון לקוחות',
  contact_form: 'יצירת קשר',
  popup_form: 'פופאפ',
};

export function ContactForm({ storeId, storeSlug, defaultType = 'club_member' }: ContactFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [contactType, setContactType] = useState<'newsletter' | 'club_member' | 'contact_form' | 'popup_form'>(defaultType);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get('email') as string,
      firstName: formData.get('firstName') as string || undefined,
      lastName: formData.get('lastName') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      type: contactType,
      source: 'admin',
      metadata: contactType === 'contact_form' ? {
        subject: formData.get('subject') as string || '',
        message: formData.get('message') as string || '',
      } : {},
    };

    startTransition(async () => {
      const result = await createContact(storeId, data);
      if (result.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(result.error || 'שגיאה ביצירת איש קשר');
      }
    });
  };

  return (
    <>
      {/* Buttons Group */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          איש קשר חדש
        </button>
        
        <button
          onClick={() => setIsImportOpen(true)}
          className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          ייבוא CSV
        </button>
      </div>

      {/* Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 cursor-pointer" onClick={() => setIsImportOpen(false)} dir="rtl">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-scroll cursor-default text-right" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">ייבוא אנשי קשר מ-CSV</h2>
              <button
                onClick={() => setIsImportOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <ContactImportForm 
                storeId={storeId} 
                storeSlug={storeSlug}
                defaultType={defaultType}
                onClose={() => {
                  setIsImportOpen(false);
                  router.refresh();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Single Contact Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 cursor-pointer" onClick={() => setIsOpen(false)} dir="rtl">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto modal-scroll cursor-default text-right" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">הוספת איש קשר חדש</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}
              
              {/* Contact Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  סוג איש קשר <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(typeLabels) as Array<keyof typeof typeLabels>).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setContactType(type)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
                        contactType === type
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {typeLabels[type]}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם פרטי
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    placeholder="ישראל"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם משפחה
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    placeholder="ישראלי"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  אימייל <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  placeholder="israel@example.com"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  טלפון
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  placeholder="050-1234567"
                  dir="ltr"
                />
              </div>
              
              {/* Contact form specific fields */}
              {contactType === 'contact_form' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      נושא
                    </label>
                    <input
                      type="text"
                      name="subject"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                      placeholder="נושא הפנייה"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      הודעה
                    </label>
                    <textarea
                      name="message"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm resize-none"
                      placeholder="תוכן ההודעה..."
                    />
                  </div>
                </>
              )}
              
              {/* Info about club members */}
              {contactType === 'club_member' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  <p className="font-medium mb-1">💡 חברי מועדון</p>
                  <p>חבר מועדון יוכל להתחבר לאתר עם OTP (קוד חד-פעמי) לאימייל.</p>
                  <p>אם יבצע הזמנה עם סיסמה - יוכל להתחבר גם עם סיסמה.</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isPending ? 'שומר...' : 'הוסף איש קשר'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

