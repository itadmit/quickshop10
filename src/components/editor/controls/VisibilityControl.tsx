'use client';

/**
 * VisibilityControl - Control section visibility per device type
 * 
 * Usage:
 * <VisibilityControl
 *   settings={section.settings}
 *   onChange={updateSettings}
 * />
 * 
 * Settings keys used:
 * - hideOnMobile: boolean (hides on mobile & tablet)
 * - hideOnDesktop: boolean (hides on desktop)
 */

interface VisibilityControlProps {
  settings: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function VisibilityControl({ settings, onChange }: VisibilityControlProps) {
  const hideOnMobile = (settings.hideOnMobile as boolean) || false;
  const hideOnDesktop = (settings.hideOnDesktop as boolean) || false;

  return (
    <div className="space-y-3">
      <span className="block text-xs text-[var(--editor-text-secondary)] mb-2">נראות</span>
      
      {/* Hide on Mobile/Tablet */}
      <label className="flex items-center justify-between cursor-pointer group">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--editor-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12" y2="18" />
          </svg>
          <span className="text-xs text-[var(--editor-text-primary)]">הסתר במובייל/טאבלט</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={hideOnMobile}
          onClick={() => onChange('hideOnMobile', !hideOnMobile)}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors border
                     ${hideOnMobile 
                       ? 'bg-[var(--editor-accent-blue)] border-[var(--editor-accent-blue)]' 
                       : 'bg-[var(--editor-bg-tertiary)] border-[var(--editor-border-default)]'}`}
        >
          <span
            className={`absolute h-3 w-3 rounded-full bg-white shadow-sm transition-all duration-200
                       ${hideOnMobile ? 'right-1' : 'right-[18px]'}`}
          />
        </button>
      </label>

      {/* Hide on Desktop */}
      <label className="flex items-center justify-between cursor-pointer group">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--editor-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span className="text-xs text-[var(--editor-text-primary)]">הסתר במחשב</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={hideOnDesktop}
          onClick={() => onChange('hideOnDesktop', !hideOnDesktop)}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors border
                     ${hideOnDesktop 
                       ? 'bg-[var(--editor-accent-blue)] border-[var(--editor-accent-blue)]' 
                       : 'bg-[var(--editor-bg-tertiary)] border-[var(--editor-border-default)]'}`}
        >
          <span
            className={`absolute h-3 w-3 rounded-full bg-white shadow-sm transition-all duration-200
                       ${hideOnDesktop ? 'right-1' : 'right-[18px]'}`}
          />
        </button>
      </label>

      {/* Info text when something is hidden */}
      {(hideOnMobile || hideOnDesktop) && (
        <p className="text-[10px] text-[var(--editor-text-muted)] mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="8" />
          </svg>
          הסקשן יוצג דהוי בעורך אך יוסתר בחנות
        </p>
      )}
    </div>
  );
}

