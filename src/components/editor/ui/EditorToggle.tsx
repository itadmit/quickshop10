'use client';

/**
 * EditorToggle - Modern toggle switch with theme support
 * מתג מודרני עם תמיכה בבהיר וכהה
 */

interface EditorToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
  className?: string;
}

export function EditorToggle({
  label,
  value,
  onChange,
  description,
  className = '',
}: EditorToggleProps) {
  return (
    <div className={`flex items-start justify-between py-2 group ${className}`}>
      <div className="flex-1">
        <label className="text-xs text-[var(--editor-text-secondary)] group-hover:text-[var(--editor-text-primary)] transition-colors cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-[var(--editor-text-placeholder)] mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors shrink-0
                   ${value ? 'bg-[var(--editor-accent-blue)]' : 'bg-[var(--editor-border-default)]'}`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm 
                     transition-all duration-200
                     ${value ? 'right-0.5' : 'left-0.5'}`}
        />
      </button>
    </div>
  );
}

// Checkbox variant
interface EditorCheckboxProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}

export function EditorCheckbox({
  label,
  value,
  onChange,
  className = '',
}: EditorCheckboxProps) {
  return (
    <label className={`flex items-center gap-2 py-2 cursor-pointer group ${className}`}>
      <div
        className={`w-4 h-4 rounded border transition-all flex items-center justify-center
                   ${value 
                     ? 'bg-[var(--editor-accent-blue)] border-[var(--editor-accent-blue)]' 
                     : 'bg-[var(--editor-bg-tertiary)] border-[var(--editor-border-default)] group-hover:border-[var(--editor-border-hover)]'}`}
        onClick={() => onChange(!value)}
      >
        {value && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 12l5 5L20 7" />
          </svg>
        )}
      </div>
      <span className="text-xs text-[var(--editor-text-secondary)] group-hover:text-[var(--editor-text-primary)] transition-colors">
        {label}
      </span>
    </label>
  );
}

// Radio group
interface EditorRadioGroupProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}

export function EditorRadioGroup({
  label,
  value,
  options,
  onChange,
  className = '',
}: EditorRadioGroupProps) {
  return (
    <div className={`py-2 ${className}`}>
      <label className="block text-xs text-[var(--editor-text-secondary)] mb-2">{label}</label>
      <div className="space-y-1">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 py-1 cursor-pointer group"
          >
            <div
              className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center
                         ${value === option.value 
                           ? 'border-[var(--editor-accent-blue)]' 
                           : 'border-[var(--editor-border-default)] group-hover:border-[var(--editor-border-hover)]'}`}
              onClick={() => onChange(option.value)}
            >
              {value === option.value && (
                <div className="w-2 h-2 rounded-full bg-[var(--editor-accent-blue)]" />
              )}
            </div>
            <span className="text-xs text-[var(--editor-text-secondary)] group-hover:text-[var(--editor-text-primary)] transition-colors">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
