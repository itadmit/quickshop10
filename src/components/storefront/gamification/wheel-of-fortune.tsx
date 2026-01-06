'use client';

import { useState, useRef, useCallback } from 'react';

interface Prize {
  id: string;
  name: string;
  type: string;
  color: string;
  icon?: string | null;
}

interface WheelOfFortuneProps {
  prizes: Prize[];
  primaryColor: string;
  secondaryColor: string;
  onSpin: () => Promise<{ prizeIndex: number; prize: Prize; couponCode?: string }>;
  disabled?: boolean;
}

export function WheelOfFortune({ prizes, primaryColor, secondaryColor, onSpin, disabled }: WheelOfFortuneProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ prize: Prize; couponCode?: string } | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const segmentAngle = 360 / prizes.length;

  const handleSpin = useCallback(async () => {
    if (isSpinning || disabled) return;

    setIsSpinning(true);
    setResult(null);

    try {
      const { prizeIndex, prize, couponCode } = await onSpin();

      // Calculate the rotation to land on the winning prize
      // Prize index 0 is at the top (12 o'clock position)
      const targetAngle = 360 - (prizeIndex * segmentAngle) - (segmentAngle / 2);
      const spins = 5 + Math.random() * 3; // 5-8 full rotations
      const totalRotation = rotation + (spins * 360) + targetAngle - (rotation % 360);

      setRotation(totalRotation);

      // Wait for animation to complete
      setTimeout(() => {
        setIsSpinning(false);
        setResult({ prize, couponCode });
      }, 5000); // Match CSS duration
    } catch (error) {
      setIsSpinning(false);
      console.error('Spin error:', error);
    }
  }, [isSpinning, disabled, onSpin, rotation, segmentAngle]);

  // Generate wheel segments
  const renderWheel = () => {
    return prizes.map((prize, index) => {
      const startAngle = index * segmentAngle;
      const endAngle = (index + 1) * segmentAngle;
      
      // Convert to radians
      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);
      
      // Calculate arc path
      const radius = 150;
      const x1 = radius + radius * Math.cos(startRad);
      const y1 = radius + radius * Math.sin(startRad);
      const x2 = radius + radius * Math.cos(endRad);
      const y2 = radius + radius * Math.sin(endRad);
      
      const largeArc = segmentAngle > 180 ? 1 : 0;
      
      const pathD = `
        M ${radius} ${radius}
        L ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
        Z
      `;

      // Calculate text position
      const midAngle = (startAngle + segmentAngle / 2 - 90) * (Math.PI / 180);
      const textRadius = radius * 0.65;
      const textX = radius + textRadius * Math.cos(midAngle);
      const textY = radius + textRadius * Math.sin(midAngle);
      const textRotation = startAngle + segmentAngle / 2;

      return (
        <g key={prize.id}>
          <path
            d={pathD}
            fill={prize.color}
            stroke="#fff"
            strokeWidth="2"
          />
          <text
            x={textX}
            y={textY}
            fill="#fff"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${textRotation}, ${textX}, ${textY})`}
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
          >
            {prize.name.length > 12 ? prize.name.substring(0, 10) + '...' : prize.name}
          </text>
        </g>
      );
    });
  };

  return (
    <div className="flex flex-col items-center">
      {/* Wheel Container */}
      <div className="relative">
        {/* Pointer */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
        >
          <svg width="30" height="40" viewBox="0 0 30 40">
            <polygon 
              points="15,40 0,0 30,0" 
              fill={primaryColor}
              stroke="#fff"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Wheel */}
        <div
          ref={wheelRef}
          className="relative"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          }}
        >
          <svg width="300" height="300" viewBox="0 0 300 300">
            {/* Outer ring */}
            <circle
              cx="150"
              cy="150"
              r="148"
              fill="none"
              stroke={primaryColor}
              strokeWidth="4"
            />
            {renderWheel()}
            {/* Center circle */}
            <circle
              cx="150"
              cy="150"
              r="25"
              fill={secondaryColor}
              stroke="#fff"
              strokeWidth="3"
            />
            <text
              x="150"
              y="150"
              fill="#fff"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              SPIN
            </text>
          </svg>
        </div>

        {/* Decorative lights */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x = 150 + 155 * Math.cos(angle);
            const y = 150 + 155 * Math.sin(angle);
            return (
              <div
                key={i}
                className={`absolute w-3 h-3 rounded-full ${
                  isSpinning ? 'animate-pulse' : ''
                }`}
                style={{
                  left: x - 6,
                  top: y - 6,
                  backgroundColor: i % 2 === 0 ? primaryColor : secondaryColor,
                  boxShadow: `0 0 8px ${i % 2 === 0 ? primaryColor : secondaryColor}`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Spin Button */}
      {!result && (
        <button
          onClick={handleSpin}
          disabled={isSpinning || disabled}
          className="mt-6 px-8 py-3 text-white font-bold text-lg rounded-full shadow-lg transform transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            boxShadow: `0 4px 20px ${primaryColor}50`,
          }}
        >
          {isSpinning ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              מסתובב...
            </span>
          ) : (
            'סובב עכשיו!'
          )}
        </button>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 text-center animate-bounce-in">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">מזל טוב!</h3>
          <p className="text-gray-700 mb-3">זכית ב{result.prize.name}!</p>
          
          {result.couponCode && (
            <div className="bg-gray-100 rounded-lg p-4 inline-block">
              <p className="text-xs text-gray-500 mb-1">קוד הקופון שלך:</p>
              <div className="flex items-center gap-2">
                <code className="text-lg font-mono font-bold text-gray-900">
                  {result.couponCode}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.couponCode!);
                  }}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                  title="העתק"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {result.prize.type === 'extra_spin' && (
            <button
              onClick={() => {
                setResult(null);
              }}
              className="mt-4 px-6 py-2 font-bold rounded-lg text-white"
              style={{ backgroundColor: primaryColor }}
            >
              סובב שוב! 🔄
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

