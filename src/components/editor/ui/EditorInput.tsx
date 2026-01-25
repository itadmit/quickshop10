'use client';

/**
 * EditorInput - Modern input fields with theme support
 * שדות קלט מודרניים עם תמיכה בבהיר וכהה
 */

interface EditorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suffix?: string;
  type?: 'text' | 'number' | 'url';
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function EditorInput({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  type = 'text',
  min,
  max,
  step,
  className = '',
}: EditorInputProps) {
  return (
    <div className={`flex items-center justify-between py-2 group ${className}`}>
      <label className="text-xs text-[var(--editor-text-secondary)] group-hover:text-[var(--editor-text-primary)] transition-colors">
        {label}
      </label>
      <div className="flex items-center gap-1 bg-[var(--editor-bg-tertiary)] rounded px-2 py-1.5 
                      border border-[var(--editor-border-default)] focus-within:border-[var(--editor-border-focus)] transition-colors">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className="w-28 bg-transparent text-[var(--editor-text-primary)] text-xs text-left outline-none placeholder:text-[var(--editor-text-placeholder)]"
          dir="ltr"
        />
        {suffix && <span className="text-[var(--editor-text-muted)] text-xs">{suffix}</span>}
      </div>
    </div>
  );
}

// Number input variant
interface EditorNumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
}

export function EditorNumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix,
  className = '',
}: EditorNumberInputProps) {
  return (
    <div className={`flex items-center justify-between py-2 group ${className}`}>
      <label className="text-xs text-[var(--editor-text-secondary)] group-hover:text-[var(--editor-text-primary)] transition-colors">
        {label}
      </label>
      <div className="flex items-center gap-1 bg-[var(--editor-bg-tertiary)] rounded px-2 py-1.5 
                      border border-[var(--editor-border-default)] focus-within:border-[var(--editor-border-focus)] transition-colors">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-14 bg-transparent text-[var(--editor-text-primary)] text-xs text-center outline-none"
          dir="ltr"
        />
        {suffix && <span className="text-[var(--editor-text-muted)] text-xs">{suffix}</span>}
      </div>
    </div>
  );
}

// Textarea variant
interface EditorTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function EditorTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  className = '',
}: EditorTextareaProps) {
  return (
    <div className={`py-2 ${className}`}>
      <label className="block text-xs text-[var(--editor-text-secondary)] mb-2">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-[var(--editor-bg-tertiary)] text-[var(--editor-text-primary)] text-xs rounded px-3 py-2 
                   border border-[var(--editor-border-default)] focus:border-[var(--editor-border-focus)] outline-none 
                   resize-none transition-colors placeholder:text-[var(--editor-text-placeholder)]"
      />
    </div>
  );
}
