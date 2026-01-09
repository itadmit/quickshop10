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
  /** אם true - רק בחירה מהרשימה מותרת, לא הקלדה חופשית */
  selectOnly?: boolean;
  /** callback כשהערך לא תקין (נקלד אבל לא נבחר) */
  onValidationChange?: (isValid: boolean) => void;
  /** הודעת שגיאה כשהערך לא תקין */
  errorMessage?: string;
  /** אפשרויות ברירת מחדל להציג כשנפתח לפני הקלדה */
  defaultOptions?: AutocompleteOption[];
  /** הודעה להציג כשהשדה מושבת */
  disabledMessage?: string;
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
  selectOnly = false,
  onValidationChange,
  errorMessage,
  defaultOptions = [],
  disabledMessage,
  ...props
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSelected, setIsSelected] = useState(false); // האם הערך נבחר מהרשימה
  const [showError, setShowError] = useState(false);
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
        
        // בדיקת תקינות כשסוגרים את הדרופדאון במצב selectOnly
        if (selectOnly && value && !isSelected) {
          setShowError(true);
          onValidationChange?.(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, selectOnly, value, isSelected, onValidationChange]);

  // Reset isSelected when value changes externally
  useEffect(() => {
    if (!value) {
      setIsSelected(false);
      setShowError(false);
      onValidationChange?.(true);
    }
  }, [value, onValidationChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
    
    // במצב selectOnly, סימון שהערך עדיין לא נבחר
    if (selectOnly) {
      setIsSelected(false);
      setShowError(false); // מסתירים שגיאה בזמן הקלדה
    }
  };

  const handleSelect = (option: AutocompleteOption) => {
    onChange?.(option.value);
    onSelect?.(option);
    setIsOpen(false);
    setIsSelected(true);
    setShowError(false);
    onValidationChange?.(true);
    inputRef.current?.blur();
  };

  const handleBlur = () => {
    // Delay to allow click on dropdown option
    setTimeout(() => {
      if (selectOnly && value && !isSelected) {
        setShowError(true);
        onValidationChange?.(false);
      }
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentOptions = displayOptions;
    if (!isOpen || currentOptions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < currentOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < currentOptions.length) {
          handleSelect(currentOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  // הצג defaultOptions כשאין ערך או שאין options מהחיפוש
  const filteredOptions = (options || []).slice(0, 20);
  const displayOptions = filteredOptions.length > 0 ? filteredOptions : (value ? [] : defaultOptions.slice(0, 15));
  const hasError = selectOnly && showError && value && !isSelected;
  const isDisabled = props.disabled;

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => !isDisabled && setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`
            w-full py-3 px-4 border rounded-lg
            focus:outline-none focus:ring-1 transition-colors text-sm
            ${loading ? 'pl-10' : selectOnly && isSelected ? 'pl-10' : ''}
            ${hasError 
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-200 focus:ring-black focus:border-black'
            }
            ${isDisabled ? 'bg-gray-100 cursor-not-allowed text-gray-400 border-gray-200' : ''}
            ${inputClassName}
          `}
          autoComplete="off"
          {...props}
        />
        
        {/* Loader בצד שמאל של האינפוט */}
        {loading && !isDisabled && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-black"></div>
          </div>
        )}
        
        {/* V ירוק כשנבחר בהצלחה */}
        {selectOnly && isSelected && value && !loading && !isDisabled && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        )}
        
        {/* אייקון מנעול כשהשדה מושבת */}
        {isDisabled && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
        )}
        
        {/* חץ dropdown כשלא מושבת ולא loading */}
        {!isDisabled && !loading && !(selectOnly && isSelected && value) && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        )}
      </div>
      
      {/* הודעת שגיאה */}
      {hasError && errorMessage && (
        <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
      )}
      
      {/* הודעה כשהשדה מושבת */}
      {isDisabled && disabledMessage && (
        <p className="text-xs text-gray-400 mt-1">{disabledMessage}</p>
      )}
      
      {isOpen && !isDisabled && (displayOptions.length > 0 || loading) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
          dir="rtl"
        >
          {loading && displayOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-black"></div>
              טוען...
            </div>
          ) : displayOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">לא נמצאו תוצאות</div>
          ) : (
            <>
              {/* כותרת לאפשרויות ברירת מחדל */}
              {filteredOptions.length === 0 && defaultOptions.length > 0 && !value && (
                <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100">
                  ערים נפוצות
                </div>
              )}
              {displayOptions.map((option, index) => (
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
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
