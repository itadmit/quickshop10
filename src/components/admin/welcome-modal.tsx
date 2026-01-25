'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Settings, X, PartyPopper } from 'lucide-react';

// Simple confetti particles
function Confetti() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; size: number; rotation: number; delay: number }>>([]);

  useEffect(() => {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const newParticles = [];
    
    for (let i = 0; i < 100; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.5,
      });
    }
    
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${p.delay}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti-fall 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

interface WelcomeModalProps {
  storeName: string;
  storeSlug: string;
}

export function WelcomeModal({ storeName, storeSlug }: WelcomeModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Check if we should show the modal
    if (searchParams.get('welcome') === 'true') {
      setIsOpen(true);
      setShowConfetti(true);
      
      // Stop confetti after 3 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Remove the welcome param from URL
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const handleDontShowAgain = useCallback(() => {
    // Save to localStorage to not show again
    localStorage.setItem(`welcome_dismissed_${storeSlug}`, 'true');
    handleClose();
  }, [storeSlug, handleClose]);

  const handleGoToSettings = useCallback(() => {
    handleClose();
    router.push(`/shops/${storeSlug}/admin/settings`);
  }, [storeSlug, router, handleClose]);

  if (!isOpen) return null;

  return (
    <>
      {showConfetti && <Confetti />}
      
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-8 text-center relative">
            <button
              onClick={handleClose}
              className="absolute top-4 left-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
              <PartyPopper className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              ברכותינו! 🎉
            </h2>
            <p className="text-white/90">
              יצרת את החנות <span className="font-semibold">{storeName}</span> בהצלחה!
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-gray-600 text-center leading-relaxed">
              אתה יכול להתחיל להזין קטגוריות, מוצרים ולהגדיר את החנות שלך.
            </p>

            {/* Info box */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 text-sm">
                <span className="font-semibold">שים לב:</span> יצרנו עבורך 4 קטגוריות ו-4 מוצרים כדי שיהיה לך קל לראות את החנות. החנות כרגע סגורה לציבור אבל ניתן לפתוח אותה בהגדרות.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleGoToSettings}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
              >
                <Settings className="w-5 h-5" />
                מעבר להגדרות
              </button>
              
              <button
                onClick={handleDontShowAgain}
                className="w-full py-2.5 px-4 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
              >
                סגור ואל תופיע יותר
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}





