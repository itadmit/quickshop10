'use client';

/**
 * EditorSlider - Modern slider with theme support and RTL fix
 * סליידר מודרני עם תמיכה בבהיר/כהה ותיקון RTL
 */

import { useState, useEffect } from 'react';

interface EditorSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  showInput?: boolean;
  className?: string;
}

export function EditorSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = 'px',
  showInput = true,
  className = '',
}: EditorSliderProps) {
  const [localValue, setLocalValue] = useState(value);
  
  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSliderChange = (newValue: number) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleInputChange = (newValue: number) => {
    const clampedValue = Math.min(Math.max(newValue, min), max);
    setLocalValue(clampedValue);
    onChange(clampedValue);
  };

  // Calculate percentage for track fill
  const percentage = ((localValue - min) / (max - min)) * 100;

  return (
    <div className={`py-2 group ${className}`}>
      <div className="flex items-center justify-between mb-2">
        {label && (
          <label className="text-xs text-[var(--editor-text-secondary)] group-hover:text-[var(--editor-text-primary)] transition-colors">
            {label}
          </label>
        )}
        {showInput && (
          <div className="flex items-center gap-1 bg-[var(--editor-bg-tertiary)] rounded px-2 py-1 
                          border border-[var(--editor-border-default)] focus-within:border-[var(--editor-border-focus)] transition-colors">
            <input
              type="number"
              value={localValue}
              onChange={(e) => handleInputChange(Number(e.target.value))}
              min={min}
              max={max}
              step={step}
              className="w-10 bg-transparent text-[var(--editor-text-primary)] text-xs text-center outline-none"
              dir="ltr"
            />
            <span className="text-[var(--editor-text-muted)] text-xs">{suffix}</span>
          </div>
        )}
      </div>
      
      {/* Slider container - LTR for correct slider behavior */}
      <div className="relative" dir="ltr">
        {/* Track background */}
        <div className="absolute inset-0 h-1 bg-[var(--editor-border-default)] rounded-full top-1/2 -translate-y-1/2" />
        
        {/* Track fill - from left in LTR */}
        <div 
          className="absolute h-1 bg-[var(--editor-accent-blue)] rounded-full top-1/2 -translate-y-1/2 left-0"
          style={{ width: `${percentage}%` }}
        />
        
        {/* Input slider */}
        <input
          type="range"
          value={localValue}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="relative w-full h-4 bg-transparent appearance-none cursor-pointer z-10
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-3
                     [&::-webkit-slider-thumb]:h-3
                     [&::-webkit-slider-thumb]:bg-white
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:shadow-md
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:transition-transform
                     [&::-webkit-slider-thumb]:hover:scale-110
                     [&::-webkit-slider-thumb]:border
                     [&::-webkit-slider-thumb]:border-gray-300
                     [&::-moz-range-thumb]:w-3
                     [&::-moz-range-thumb]:h-3
                     [&::-moz-range-thumb]:bg-white
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:border-0
                     [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>
    </div>
  );
}

// Dual slider for desktop/mobile - COMPLETELY INDEPENDENT
interface EditorDualSliderProps {
  label: string;
  desktopValue: number;
  mobileValue: number;
  onDesktopChange: (value: number) => void;
  onMobileChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
}

export function EditorDualSlider({
  label,
  desktopValue,
  mobileValue,
  onDesktopChange,
  onMobileChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = 'px',
  className = '',
}: EditorDualSliderProps) {
  // Local states - completely independent
  const [localDesktop, setLocalDesktop] = useState(desktopValue);
  const [localMobile, setLocalMobile] = useState(mobileValue);

  // Sync with props
  useEffect(() => {
    setLocalDesktop(desktopValue);
  }, [desktopValue]);

  useEffect(() => {
    setLocalMobile(mobileValue);
  }, [mobileValue]);

  // Desktop handlers
  const handleDesktopSlider = (val: number) => {
    setLocalDesktop(val);
    onDesktopChange(val);
  };

  const handleDesktopInput = (val: number) => {
    const clamped = Math.min(Math.max(val, min), max);
    setLocalDesktop(clamped);
    onDesktopChange(clamped);
  };

  // Mobile handlers - COMPLETELY SEPARATE
  const handleMobileSlider = (val: number) => {
    setLocalMobile(val);
    onMobileChange(val);
  };

  const handleMobileInput = (val: number) => {
    const clamped = Math.min(Math.max(val, min), max);
    setLocalMobile(clamped);
    onMobileChange(clamped);
  };

  const desktopPercent = ((localDesktop - min) / (max - min)) * 100;
  const mobilePercent = ((localMobile - min) / (max - min)) * 100;

  return (
    <div className={`py-2 ${className}`}>
      <label className="block text-xs text-[var(--editor-text-secondary)] mb-3">{label}</label>
      
      <div className="space-y-4">
        {/* Desktop */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[var(--editor-text-muted)] text-xs flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="1.5"/>
                <path d="M8 21h8m-4-4v4" strokeWidth="1.5"/>
              </svg>
              מחשב
            </span>
            <div className="flex items-center gap-1 bg-[var(--editor-bg-tertiary)] rounded px-2 py-1 border border-[var(--editor-border-default)]">
              <input
                type="number"
                value={localDesktop}
                onChange={(e) => handleDesktopInput(Number(e.target.value))}
                min={min}
                max={max}
                step={step}
                className="w-10 bg-transparent text-[var(--editor-text-primary)] text-xs text-center outline-none"
                dir="ltr"
              />
              <span className="text-[var(--editor-text-muted)] text-xs">{suffix}</span>
            </div>
          </div>
          <div className="relative" dir="ltr">
            <div className="absolute inset-0 h-1 bg-[var(--editor-border-default)] rounded-full top-1/2 -translate-y-1/2" />
            <div 
              className="absolute h-1 bg-[var(--editor-accent-blue)] rounded-full top-1/2 -translate-y-1/2 left-0"
              style={{ width: `${desktopPercent}%` }}
            />
            <input
              type="range"
              value={localDesktop}
              onChange={(e) => handleDesktopSlider(Number(e.target.value))}
              min={min}
              max={max}
              step={step}
              className="relative w-full h-4 bg-transparent appearance-none cursor-pointer z-10
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                         [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md
                         [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-300
                         [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-white
                         [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
            />
          </div>
        </div>
        
        {/* Mobile - SEPARATE */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[var(--editor-text-muted)] text-xs flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="1.5"/>
                <path d="M12 18h.01" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              מובייל
            </span>
            <div className="flex items-center gap-1 bg-[var(--editor-bg-tertiary)] rounded px-2 py-1 border border-[var(--editor-border-default)]">
              <input
                type="number"
                value={localMobile}
                onChange={(e) => handleMobileInput(Number(e.target.value))}
                min={min}
                max={max}
                step={step}
                className="w-10 bg-transparent text-[var(--editor-text-primary)] text-xs text-center outline-none"
                dir="ltr"
              />
              <span className="text-[var(--editor-text-muted)] text-xs">{suffix}</span>
            </div>
          </div>
          <div className="relative" dir="ltr">
            <div className="absolute inset-0 h-1 bg-[var(--editor-border-default)] rounded-full top-1/2 -translate-y-1/2" />
            <div 
              className="absolute h-1 bg-[var(--editor-accent-blue)] rounded-full top-1/2 -translate-y-1/2 left-0"
              style={{ width: `${mobilePercent}%` }}
            />
            <input
              type="range"
              value={localMobile}
              onChange={(e) => handleMobileSlider(Number(e.target.value))}
              min={min}
              max={max}
              step={step}
              className="relative w-full h-4 bg-transparent appearance-none cursor-pointer z-10
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                         [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md
                         [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-300
                         [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-white
                         [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
