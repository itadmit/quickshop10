'use client';

/**
 * WhatsApp Float Button
 * 
 * כפתור וואטסאפ צף עם בועית הודעה מותאמת אישית
 * 🎨 עיצוב מודרני עם אנימציות חלקות
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export interface WhatsAppFloatConfig {
  phoneNumber: string;
  buttonColor: string;
  position: 'left' | 'right';
  showBubble: boolean;
  bubbleText: string;
  bubbleDelaySeconds: number;
  defaultMessage: string;
  showOnMobile: boolean;
  showOnDesktop: boolean;
  showPulse: boolean;
  bottomOffset: number;
  sideOffset: number;
}

interface WhatsAppFloatButtonProps {
  config: WhatsAppFloatConfig;
}

// WhatsApp Icon SVG
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

export function WhatsAppFloatButton({ config }: WhatsAppFloatButtonProps) {
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show bubble after delay
  useEffect(() => {
    if (!config.showBubble || bubbleDismissed) return;
    
    const timer = setTimeout(() => {
      setShowBubble(true);
    }, config.bubbleDelaySeconds * 1000);

    return () => clearTimeout(timer);
  }, [config.showBubble, config.bubbleDelaySeconds, bubbleDismissed]);

  // Check if should show based on device
  const shouldShow = (isMobile && config.showOnMobile) || (!isMobile && config.showOnDesktop);
  
  if (!shouldShow || !config.phoneNumber) {
    return null;
  }

  // Build WhatsApp URL
  const cleanPhone = config.phoneNumber.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(config.defaultMessage);
  const whatsappUrl = `https://wa.me/${cleanPhone}${config.defaultMessage ? `?text=${encodedMessage}` : ''}`;

  const handleClick = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDismissBubble = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBubble(false);
    setBubbleDismissed(true);
  };

  // Position styles
  const positionStyle = {
    bottom: `${config.bottomOffset}px`,
    ...(config.position === 'left' 
      ? { left: `${config.sideOffset}px` }
      : { right: `${config.sideOffset}px` }
    ),
  };

  // Bubble appears on the opposite side of the button
  const bubblePosition = config.position === 'left'
    ? 'left-full ml-3'
    : 'right-full mr-3';

  return (
    <div 
      className="fixed z-50"
      style={positionStyle}
    >
      {/* Message Bubble */}
      {showBubble && config.bubbleText && (
        <div 
          className={`absolute bottom-3 ${bubblePosition}`}
          style={{ animation: 'whatsapp-fade-in-up 0.3s ease-out forwards' }}
        >
          <div 
            className="relative bg-white rounded-2xl shadow-xl px-4 py-3 whitespace-nowrap"
            dir="rtl"
          >
            {/* Close button */}
            <button
              onClick={handleDismissBubble}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              aria-label="סגור"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
            
            <p className="text-sm text-gray-700 leading-relaxed">
              {config.bubbleText}
            </p>
            
            {/* Bubble tail - points toward the button */}
            <div 
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white transform rotate-45 ${
                config.position === 'left' 
                  ? '-left-1.5' 
                  : '-right-1.5'
              }`}
            />
          </div>
        </div>
      )}

      {/* WhatsApp Button */}
      <button
        onClick={handleClick}
        className="group relative w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
        style={{ 
          backgroundColor: config.buttonColor,
          animation: 'whatsapp-bounce-in 0.5s ease-out forwards'
        }}
        aria-label="שלח הודעה בוואטסאפ"
      >
        <WhatsAppIcon className="w-7 h-7 text-white" />
        
        {/* Pulse effect */}
        {config.showPulse && (
          <span 
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ backgroundColor: config.buttonColor }}
          />
        )}
      </button>

      {/* Animations - using global styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes whatsapp-fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes whatsapp-bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}} />
    </div>
  );
}
