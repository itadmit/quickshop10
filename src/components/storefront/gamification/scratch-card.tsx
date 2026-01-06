'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Prize {
  id: string;
  name: string;
  type: string;
  color: string;
}

interface ScratchCardProps {
  prize: Prize;
  couponCode?: string;
  primaryColor: string;
  secondaryColor: string;
  storeName?: string;
  onReveal: () => void;
  prizeType: string;
}

const CARD_WIDTH = 360;
const CARD_HEIGHT = 240;

export function ScratchCard({ 
  prize, 
  couponCode, 
  primaryColor, 
  secondaryColor,
  storeName = 'QuickShop',
  onReveal,
  prizeType,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [coinPosition, setCoinPosition] = useState({ x: CARD_WIDTH / 2, y: CARD_HEIGHT / 2 });

  // Initialize canvas with scratch layer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create gradient for scratch surface
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#C0C0C0'); // Silver
    gradient.addColorStop(0.5, '#A8A8A8');
    gradient.addColorStop(1, '#C0C0C0');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add coin pattern
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#888';
    
    // Draw subtle pattern
    for (let x = 0; x < canvas.width; x += 20) {
      for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.arc(x + 10, y + 10, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;

    // Add "גרד כאן" text
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('גרד כאן', canvas.width / 2, canvas.height / 2);

  }, []);

  // Track mouse position for coin following cursor
  const updateCoinPosition = useCallback((e: MouseEvent | TouchEvent) => {
    const container = containerRef.current;
    if (!container || isRevealed) return;

    const rect = container.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }

    // Calculate position relative to container
    const x = Math.max(40, Math.min(clientX - rect.left, CARD_WIDTH - 40));
    const y = Math.max(40, Math.min(clientY - rect.top, CARD_HEIGHT - 40));

    setCoinPosition({ x, y });
  }, [isRevealed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', updateCoinPosition);
    container.addEventListener('touchmove', updateCoinPosition);

    return () => {
      container.removeEventListener('mousemove', updateCoinPosition);
      container.removeEventListener('touchmove', updateCoinPosition);
    };
  }, [updateCoinPosition]);

  // Calculate scratch percentage
  const calculateScratchPercent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;

    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }

    return (transparentPixels / (pixels.length / 4)) * 100;
  }, []);

  // Handle scratching
  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (lastPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Draw circle at point
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    lastPointRef.current = { x, y };

    // Check scratch progress
    const percent = calculateScratchPercent();
    setScratchPercent(percent);

    if (percent > 50 && !isRevealed) {
      setIsRevealed(true);
      onReveal();
    }
  }, [calculateScratchPercent, isRevealed, onReveal]);

  const getCanvasCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsScratching(true);
    const coords = getCanvasCoords(e);
    if (coords) {
      lastPointRef.current = coords;
      scratch(coords.x, coords.y);
    }
  }, [getCanvasCoords, scratch]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (coords) {
      scratch(coords.x, coords.y);
    }
  }, [isScratching, getCanvasCoords, scratch]);

  const handleEnd = useCallback(() => {
    setIsScratching(false);
    lastPointRef.current = null;
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Scratch Card */}
      <div 
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden shadow-2xl cursor-none"
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        }}
      >
        {/* Prize content (underneath scratch layer) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
          {prize.type === 'no_prize' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xl font-bold">בפעם הבאה!</p>
              <p className="text-sm opacity-80">נסה שוב מחר</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="text-xl font-bold">{prize.name}</p>
              {couponCode && (
                <div className="mt-4 bg-white/20 rounded-lg px-5 py-3">
                  <p className="text-xs opacity-80 mb-1">קוד קופון:</p>
                  <code className="text-xl font-mono font-bold">{couponCode}</code>
                </div>
              )}
              {prizeType === 'extra_spin' && (
                <p className="text-sm mt-3 opacity-80">קיבלת עוד ניסיון!</p>
              )}
            </>
          )}
        </div>

        {/* Scratch canvas */}
        <canvas
          ref={canvasRef}
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
          className={`absolute inset-0 ${isRevealed ? 'opacity-0 pointer-events-none' : ''}`}
          style={{ 
            touchAction: 'none',
            transition: 'opacity 0.5s ease-out',
            cursor: 'none',
          }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />

        {/* Coin that follows cursor */}
        {!isRevealed && (
          <div 
            className="absolute pointer-events-none transition-transform duration-75"
            style={{
              left: coinPosition.x - 35,
              top: coinPosition.y - 35,
              transform: isScratching ? 'scale(0.9)' : 'scale(1)',
            }}
          >
            <div 
              className="w-[70px] h-[70px] rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: `radial-gradient(circle at 30% 30%, #FFD700, #FFA500, #B8860B)`,
                boxShadow: isScratching 
                  ? 'inset -2px -2px 8px rgba(0,0,0,0.4), inset 2px 2px 8px rgba(255,255,255,0.4), 0 4px 8px rgba(0,0,0,0.3)'
                  : 'inset -3px -3px 10px rgba(0,0,0,0.3), inset 3px 3px 10px rgba(255,255,255,0.5), 0 6px 12px rgba(0,0,0,0.25)',
                border: '3px solid #DAA520',
                color: '#654321',
              }}
            >
              <span className="text-center leading-tight text-[10px]" style={{ textShadow: '1px 1px 1px rgba(255,255,255,0.5)' }}>
                {storeName.substring(0, 8)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      {!isRevealed && scratchPercent > 0 && (
        <div className="mt-5 w-80">
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${Math.min(scratchPercent * 2, 100)}%`,
                background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
              }}
            />
          </div>
          <p className="text-sm text-gray-500 text-center mt-2">
            המשך לגרד לחשיפת הפרס
          </p>
        </div>
      )}

      {/* Revealed state */}
      {isRevealed && (
        <div className="mt-5 text-center animate-bounce-in">
          {couponCode && prize.type !== 'no_prize' && (
            <button
              onClick={() => navigator.clipboard.writeText(couponCode)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-lg transition-all shadow-sm hover:shadow"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span className="font-medium">העתק קוד</span>
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

