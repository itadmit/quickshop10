'use client';

/**
 * EditorSection - Collapsible settings group with theme support
 * קבוצת הגדרות מתקפלת עם תמיכה בבהיר וכהה
 */

import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface EditorSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function EditorSection({
  title,
  children,
  defaultOpen = true,
  icon,
  className = '',
}: EditorSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border-b border-[var(--editor-border-default)] ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 group"
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-[var(--editor-text-muted)] group-hover:text-[var(--editor-text-secondary)] transition-colors">
              {icon}
            </span>
          )}
          <span className="text-xs font-medium text-[var(--editor-text-secondary)] uppercase tracking-wider 
                          group-hover:text-[var(--editor-text-primary)] transition-colors">
            {title}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-[var(--editor-text-muted)] transition-transform duration-200
                     ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {isOpen && (
        <div className="pb-4 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}

// Sub-section (no border, smaller title)
interface EditorSubSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function EditorSubSection({
  title,
  children,
  defaultOpen = true,
  className = '',
}: EditorSubSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`mt-2 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-1.5 group"
      >
        <span className="text-xs text-[var(--editor-text-muted)] group-hover:text-[var(--editor-text-secondary)] transition-colors">
          {title}
        </span>
        <ChevronDown 
          className={`w-3 h-3 text-[var(--editor-text-placeholder)] transition-transform duration-200
                     ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {isOpen && (
        <div className="pt-1 pb-2 pr-2 space-y-1 border-r border-[var(--editor-border-default)]">
          {children}
        </div>
      )}
    </div>
  );
}

// Panel header (main section title with actions)
interface EditorPanelHeaderProps {
  title: string;
  onClose?: () => void;
  onMore?: () => void;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export function EditorPanelHeader({
  title,
  onClose,
  onMore,
  isVisible = true,
  onToggleVisibility,
}: EditorPanelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--editor-border-default)] bg-[var(--editor-bg-secondary)]">
      <div className="flex items-center gap-2">
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--editor-bg-hover)] transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-[var(--editor-text-secondary)] rotate-90" />
          </button>
        )}
        <h3 className="text-sm font-medium text-[var(--editor-text-primary)]">{title}</h3>
      </div>
      
      <div className="flex items-center gap-1">
        {onToggleVisibility && (
          <button
            onClick={onToggleVisibility}
            className={`p-1.5 rounded transition-colors
                       ${isVisible ? 'hover:bg-[var(--editor-bg-hover)]' : 'bg-[var(--editor-bg-hover)]'}`}
            title={isVisible ? 'הסתר' : 'הצג'}
          >
            {isVisible ? (
              <svg className="w-4 h-4 text-[var(--editor-text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            ) : (
              <svg className="w-4 h-4 text-[var(--editor-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            )}
          </button>
        )}
        {onMore && (
          <button
            onClick={onMore}
            className="p-1.5 rounded hover:bg-[var(--editor-bg-hover)] transition-colors"
            title="אפשרויות נוספות"
          >
            <svg className="w-4 h-4 text-[var(--editor-text-secondary)]" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="12" cy="19" r="2"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
