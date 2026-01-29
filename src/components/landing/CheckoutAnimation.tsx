'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type Step = 'checkout' | 'scrolling' | 'filling' | 'selecting' | 'processing' | 'success';

// Skeleton shimmer component
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
  );
}

// Animated skeleton that fills in
function FillingText({ text, filled, className = '' }: { text: string; filled: boolean; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {filled ? (
        <span className="text-gray-800 animate-fade-in">{text}</span>
      ) : (
        <Skeleton className="h-4 w-full" />
      )}
    </div>
  );
}

export function CheckoutAnimation() {
  const [step, setStep] = useState<Step>('checkout');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [filledFields, setFilledFields] = useState({
    name: false,
    id: false,
    card: false,
    cvv: false,
    exp: false,
  });
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  const resetAnimation = useCallback(() => {
    setStep('checkout');
    setScrollPosition(0);
    setFilledFields({ name: false, id: false, card: false, cvv: false, exp: false });
    setSelectedPayment(null);
  }, []);

  const startAnimation = useCallback(() => {
    // שומר את כל ה-timeouts כדי לנקות אותם אם צריך
    const timeouts: NodeJS.Timeout[] = [];
    
    // 2 שניות - לא קורה כלום, רק מציג מסך
    
    // אחרי 2 שניות - בוחר Apple Pay וגולל למטה
    timeouts.push(setTimeout(() => {
      setSelectedPayment('apple');
      setStep('selecting');
      // מתחיל גלילה
      setScrollPosition(60);
    }, 2000));
    
    timeouts.push(setTimeout(() => setScrollPosition(120), 2300));
    timeouts.push(setTimeout(() => setScrollPosition(180), 2600));
    
    // אחרי הגלילה - מתחיל למלא פרטים (2 שניות למילוי כל הפרטים)
    timeouts.push(setTimeout(() => {
      setStep('filling');
      setFilledFields(f => ({ ...f, name: true }));
    }, 3000));
    
    timeouts.push(setTimeout(() => setFilledFields(f => ({ ...f, id: true })), 3400));
    timeouts.push(setTimeout(() => setFilledFields(f => ({ ...f, card: true })), 3800));
    timeouts.push(setTimeout(() => setFilledFields(f => ({ ...f, exp: true })), 4200));
    timeouts.push(setTimeout(() => setFilledFields(f => ({ ...f, cvv: true })), 4600));

    // מעבד - 2 שניות
    timeouts.push(setTimeout(() => {
      setStep('processing');
    }, 5000));

    // דף תודה - מציג 8 שניות
    timeouts.push(setTimeout(() => {
      setStep('success');
    }, 7000));

    // חוזר להתחלה אחרי 8 שניות של דף תודה
    timeouts.push(setTimeout(() => {
      resetAnimation();
    }, 15000));
    
    return () => timeouts.forEach(t => clearTimeout(t));
  }, [resetAnimation]);

  // Auto-start animation only when step is 'checkout' (initial state)
  useEffect(() => {
    if (step === 'checkout') {
      const timeout = setTimeout(() => {
        startAnimation();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [step, startAnimation]);

  // Success Screen
  if (step === 'success') {
    return (
      <div className="relative bg-white rounded-[40px] shadow-2xl border border-gray-200 w-[280px] h-[560px] overflow-hidden transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
        {/* Phone Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-10" />
        
        {/* Success Content */}
        <div className="h-full flex flex-col items-center justify-center p-8 bg-white">
          {/* Success Icon */}
          <div className="w-24 h-24 rounded-full border-4 border-green-500 flex items-center justify-center mb-6 animate-scale-in">
            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div className="text-center mb-8">
            <div className="text-gray-600 text-sm mb-1">התשלום בוצע</div>
            <div className="text-2xl font-bold text-green-600">בהצלחה!</div>
          </div>
          
          {/* Receipt */}
          <div className="w-full bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm">
            <div className="text-gray-500 text-xs mb-3 text-center font-medium">פרטי תשלום</div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">אסמכתא:</span>
                <span className="font-mono text-gray-800">123456789</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">תאריך:</span>
                <span className="text-gray-800">25/01/26 16:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">כרטיס:</span>
                <span className="font-mono text-gray-800">**** 1234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">סכום:</span>
                <span className="font-bold text-green-600">₪120.00</span>
              </div>
            </div>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes scale-in {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-scale-in {
            animation: scale-in 0.5s ease-out forwards;
          }
        `}</style>
      </div>
    );
  }

  // Checkout Screen
  return (
    <div className="relative bg-white rounded-[40px] shadow-2xl border border-gray-200 w-[280px] h-[560px] overflow-hidden transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
      {/* Status Bar Background */}
      <div className="absolute top-0 left-0 right-0 h-11 bg-white z-10 rounded-t-[40px]" />
      
      {/* Phone Notch - Dynamic Island style */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />
      
      {/* Status Bar - Fixed */}
      <div className="absolute top-2 left-0 right-0 flex items-center justify-between px-4 z-10">
        <span className="text-[9px] font-medium text-gray-700">9:41</span>
        <div className="flex items-center gap-1">
          {/* Signal - subtle */}
          <div className="flex items-end gap-[2px]">
            <div className="w-[2px] h-[3px] bg-gray-600 rounded-[0.5px]" />
            <div className="w-[2px] h-[5px] bg-gray-600 rounded-[0.5px]" />
            <div className="w-[2px] h-[7px] bg-gray-600 rounded-[0.5px]" />
            <div className="w-[2px] h-[9px] bg-gray-300 rounded-[0.5px]" />
          </div>
          {/* WiFi - subtle */}
          <svg className="w-3 h-3 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <circle cx="12" cy="20" r="1" fill="currentColor" />
          </svg>
          {/* Battery - subtle */}
          <div className="flex items-center">
            <div className="w-[18px] h-[9px] border border-gray-500 rounded-[2px] p-[1px]">
              <div className="h-full bg-gray-600 rounded-[1px]" style={{ width: '70%' }} />
            </div>
            <div className="w-[1.5px] h-[4px] bg-gray-500 rounded-r-[0.5px] ml-[0.5px]" />
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div 
        className="absolute top-12 left-0 right-0 bottom-0 overflow-hidden"
        style={{ paddingBottom: '70px' }}
      >
        <div 
          className="transition-transform duration-500 ease-out"
          style={{ transform: `translateY(-${scrollPosition}px)` }}
        >
          {/* Header */}
          <div className="text-center py-2">
            <div className="text-xs text-gray-400">→ חזרה</div>
          </div>

          {/* Price */}
          <div className="text-center py-4">
            <div className="text-3xl font-bold text-gray-900">₪120.00</div>
            <div className="text-xs text-gray-400 mt-1">אמצעי תשלום</div>
          </div>

          {/* Payment Methods */}
          <div className="px-4 space-y-2">
            {/* Apple Pay */}
            <button 
              className={`w-full h-10 rounded-lg flex items-center justify-center transition-all ${
                selectedPayment === 'apple' 
                  ? 'bg-black ring-2 ring-green-500 ring-offset-2' 
                  : 'bg-black'
              }`}
            >
              <span className="text-white text-sm font-medium flex items-center gap-1">
                <span className="text-lg"></span> Pay
              </span>
            </button>

            {/* Google Pay */}
            <button className="w-full h-10 rounded-lg border border-gray-300 flex items-center justify-center bg-white">
              <img 
                src="https://storage.googleapis.com/gweb-uniblog-publish-prod/images/GooglePayLogo.width-500.format-webp.webp" 
                alt="Google Pay" 
                className="h-5 object-contain"
              />
            </button>

            {/* PayPal */}
            <button className="w-full h-10 rounded-lg bg-[#FFC439] flex items-center justify-center">
              <span className="text-[#003087] font-bold text-sm">Pay<span className="text-[#009cde]">Pal</span></span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 px-4 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">או לשלם בדרך אחרת</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Quick Payment Icons */}
          <div className="flex justify-center gap-6 px-4 mb-4">
            {/* כרטיס אשראי */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-10 rounded-lg bg-gray-100 flex items-center justify-center px-2">
                <span className="text-[9px] font-medium text-gray-600 text-center leading-tight">כרטיס אשראי</span>
              </div>
            </div>
            {/* ביט */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <img src="https://upload.wikimedia.org/wikipedia/he/thumb/e/eb/Bit_logo_2024.svg/1200px-Bit_logo_2024.svg.png" alt="Bit" className="w-7 h-7" />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="px-4 space-y-3">
            {/* Name */}
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${filledFields.name ? 'bg-green-500' : 'bg-gray-200'}`}>
                {filledFields.name && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-gray-400 text-right">שם בעל הכרטיס</div>
                <FillingText text="ישראל ישראלי" filled={filledFields.name} className="text-sm text-right" />
              </div>
            </div>

            {/* ID */}
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${filledFields.id ? 'bg-green-500' : 'bg-gray-200'}`}>
                {filledFields.id && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-gray-400 text-right">ת.ז בעל הכרטיס</div>
                <FillingText text="123456789" filled={filledFields.id} className="text-sm text-right font-mono" />
              </div>
            </div>

            {/* Card Number */}
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${filledFields.card ? 'bg-green-500' : 'bg-gray-200'}`}>
                {filledFields.card && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex items-center gap-2 flex-1">
                <img src="https://propsender.com/wp-content/uploads/2020/04/Mastercard-visa-card-logo.png" alt="Cards" className="h-4" />
                <FillingText text="1234 1234 1234 1234" filled={filledFields.card} className="text-sm font-mono flex-1 text-right" />
              </div>
            </div>

            {/* CVV & Exp */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2 flex-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${filledFields.cvv ? 'bg-green-500' : 'bg-gray-200'}`}>
                  {filledFields.cvv && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <FillingText text="123" filled={filledFields.cvv} className="text-sm font-mono" />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${filledFields.exp ? 'bg-green-500' : 'bg-gray-200'}`}>
                  {filledFields.exp && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <FillingText text="12/26" filled={filledFields.exp} className="text-sm font-mono" />
              </div>
            </div>
          </div>
          
          {/* Extra space at bottom for scroll */}
          <div className="h-20" />
        </div>
      </div>

      {/* Pay Button - Fixed at bottom */}
      <div className="absolute bottom-6 left-4 right-4 z-10">
        <button className={`w-full h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
          step === 'processing' ? 'bg-green-600' : 'bg-green-500'
        }`}>
          {step === 'processing' ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>מעבד...</span>
            </>
          ) : (
            <span>לתשלום ₪120.00</span>
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

