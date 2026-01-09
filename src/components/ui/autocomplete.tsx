'use client';

import { useState, useRef, useEffect, InputHTMLAttributes } from 'react';

interface AutocompleteOption {
  value: string;
  label: string;
}

interface AutocompleteProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onSelect'> {
  options?: AutocompleteOption[];
  loading?: boolean;
  onSelect?: (option: AutocompleteOption) => void;
  onChange?: (value: string) => void;
  inputClassName?: string;
}

/**
 * קומפוננטת Autocomplete מותאמת לעברית (RTL)
 * 🚀 מהירה - כוללת loading state עם spinner
 */
export function Autocomplete({
  options = [],
  loading = false,
  onSelect,
  onChange,
  value,
  className = '',
  inputClassName = '',
  ...props
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // סגירת הדרופדאון בלחיצה מחוץ לקומפוננטה
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelect = (option: AutocompleteOption) => {
    onChange?.(option.value);
    onSelect?.(option);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || options.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const filteredOptions = (options || []).slice(0, 20);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={`
            w-full py-3 px-4 border border-gray-200 rounded-lg
            focus:outline-none focus:ring-1 focus:ring-black focus:border-black
            transition-colors text-sm
            ${loading ? 'pl-10' : ''}
            ${inputClassName}
          `}
          autoComplete="off"
          {...props}
        />
        
        {/* Loader בצד שמאל של האינפוט */}
        {loading && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-black"></div>
          </div>
        )}
      </div>
      
      {isOpen && (filteredOptions.length > 0 || loading) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
          dir="rtl"
        >
          {loading && filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-black"></div>
              טוען...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">לא נמצאו תוצאות</div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={`${option.value}-${index}`}
                onClick={() => handleSelect(option)}
                className={`
                  px-4 py-2.5 cursor-pointer text-sm text-gray-700 
                  hover:bg-gray-50 transition-colors
                  ${highlightedIndex === index ? 'bg-gray-100' : ''}
                `}
              >
                {option.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

