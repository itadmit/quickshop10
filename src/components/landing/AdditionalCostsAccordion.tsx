'use client';

import { useState } from 'react';
import { ChevronDownIcon, CheckCircleIcon } from '@/components/admin/icons';
import { X } from 'lucide-react';

const additionalCosts = [
  { name: "עמלת Bit", price: "1.5%", desc: "על כל תשלום ב-Bit" },
  { name: "עמלת Apple Pay / Google Pay", price: "0.5%", desc: "תוספת לעמלה הבסיסית" },
  { name: "החזר כספי (Refund)", price: "₪3", desc: "לכל החזר" },
  { name: "תשלומים (קרדיט)", price: "0.8%", desc: "תוספת לכל תשלום מעל 1" },
];

interface AdditionalCostsAccordionProps {
  signupUrl: string;
}

export function AdditionalCostsAccordion({ signupUrl }: AdditionalCostsAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hasSeenCosts, setHasSeenCosts] = useState(false);

  const handleSignupClick = () => {
    if (!hasSeenCosts && !isOpen) {
      setShowModal(true);
    } else {
      window.location.href = signupUrl;
    }
  };

  const handleOpenAccordion = () => {
    setShowModal(false);
    setIsOpen(true);
    setHasSeenCosts(true);
  };

  const handleContinueAnyway = () => {
    setShowModal(false);
    setHasSeenCosts(true);
    window.location.href = signupUrl;
  };

  return (
    <>
      <div className="mb-6">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) setHasSeenCosts(true);
          }}
          className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800/70 rounded-xl border border-slate-700/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-medium text-slate-300">עלויות נלוות ושירותים נוספים</span>
            {hasSeenCosts && (
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
            )}
          </div>
          <ChevronDownIcon 
            className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>
        
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 mt-3' : 'max-h-0'}`}>
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-4 space-y-3">
            {additionalCosts.map((cost, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0"
              >
                <div>
                  <div className="font-medium text-slate-200">{cost.name}</div>
                  <div className="text-xs text-slate-500">{cost.desc}</div>
                </div>
                <div className="text-green-400 font-bold">{cost.price}</div>
              </div>
            ))}
            <div className="pt-2 text-xs text-slate-500 text-center">
              * כל המחירים לפני מע״מ
            </div>
          </div>
        </div>
      </div>

      {/* Signup Button */}
      <button 
        onClick={handleSignupClick}
        className="w-full rounded-xl bg-green-500 hover:bg-green-400 shadow-lg shadow-green-500/25 text-lg py-4 font-bold text-white flex items-center justify-center gap-2 transition-all"
      >
        אני רוצה להתחיל עכשיו
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      {/* Transparency Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                רגע, בלי אותיות קטנות!
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                אנחנו מאמינים בשקיפות מלאה.
                <br />
                <strong>יש עלויות נלוות</strong> שחשוב שתראה לפני ההצטרפות.
                <br />
                תראה הכל, ואז תחליט.
              </p>

              <div className="space-y-3">
                <button 
                  onClick={handleOpenAccordion}
                  className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  הראה לי את כל העלויות
                </button>
                
                <button 
                  onClick={handleContinueAnyway}
                  className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors text-sm"
                >
                  ראיתי כבר, אני רוצה להמשיך
                </button>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 text-center border-t border-green-100">
              <p className="text-xs text-green-700 font-medium">
                שקיפות מלאה היא הערך המרכזי שלנו
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

