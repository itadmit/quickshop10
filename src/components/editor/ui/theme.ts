/**
 * Editor Theme - Light & Dark mode support
 * ערכת צבעים עם תמיכה בבהיר וכהה
 */

// Theme modes
export type ThemeMode = 'light' | 'dark';

// Theme definitions
export const themes = {
  dark: {
    // Background colors
    bg: {
      primary: '#1a1a2e',      // Header/main background
      secondary: '#252538',     // Panels background
      tertiary: '#2c2c40',      // Inputs/cards
      hover: '#3c3c55',         // Hover state
      active: '#4a4a6a',        // Active/selected state
      canvas: '#1e1e32',        // Preview area background
      panel: '#252538',         // Side panels
    },
    // Text colors
    text: {
      primary: '#ffffff',
      secondary: '#a0a0b0',
      muted: '#6b6b80',
      placeholder: '#505060',
      inverted: '#0f172a',
    },
    // Border colors
    border: {
      default: 'rgba(255,255,255,0.1)',
      hover: 'rgba(255,255,255,0.2)',
      focus: '#0d99ff',
      subtle: 'rgba(255,255,255,0.05)',
    },
  },
  light: {
    // Background colors
    bg: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      hover: '#e2e8f0',
      active: '#cbd5e1',
      canvas: '#e5e7eb',        // Preview area background
      panel: '#ffffff',         // Side panels
    },
    // Text colors
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#94a3b8',
      placeholder: '#cbd5e1',
      inverted: '#ffffff',
    },
    // Border colors
    border: {
      default: '#e2e8f0',
      hover: '#cbd5e1',
      focus: '#0d99ff',
      subtle: '#f1f5f9',
    },
  },
};

// Shared accent colors (same for both themes)
export const accent = {
  blue: '#0d99ff',
  blueHover: '#0b87e0',
  green: '#1bc47d',
  orange: '#ffab00',
  red: '#f24822',
  purple: '#a259ff',
};

// CSS Variables generator - returns object for React style prop
export function getThemeCssVars(mode: ThemeMode = 'dark'): Record<string, string> {
  const t = themes[mode];
  return {
    '--editor-bg-primary': t.bg.primary,
    '--editor-bg-secondary': t.bg.secondary,
    '--editor-bg-tertiary': t.bg.tertiary,
    '--editor-bg-hover': t.bg.hover,
    '--editor-bg-active': t.bg.active,
    '--editor-bg-canvas': t.bg.canvas,
    '--editor-bg-panel': t.bg.panel,
    '--editor-text-primary': t.text.primary,
    '--editor-text-secondary': t.text.secondary,
    '--editor-text-muted': t.text.muted,
    '--editor-text-placeholder': t.text.placeholder,
    '--editor-text-inverted': t.text.inverted,
    '--editor-border-default': t.border.default,
    '--editor-border-hover': t.border.hover,
    '--editor-border-focus': t.border.focus,
    '--editor-border-subtle': t.border.subtle,
    '--editor-accent-blue': accent.blue,
    '--editor-accent-green': accent.green,
    '--editor-accent-orange': accent.orange,
    '--editor-accent-red': accent.red,
    '--editor-accent-purple': accent.purple,
  };
}

// Tailwind-compatible classes that use CSS variables
export const editorClasses = {
  // These classes use CSS variables, so they work with both themes!
  bgPrimary: 'bg-[var(--editor-bg-primary)]',
  bgSecondary: 'bg-[var(--editor-bg-secondary)]',
  bgTertiary: 'bg-[var(--editor-bg-tertiary)]',
  bgHover: 'hover:bg-[var(--editor-bg-hover)]',
  bgCanvas: 'bg-[var(--editor-bg-canvas)]',
  bgPanel: 'bg-[var(--editor-bg-panel)]',
  
  textPrimary: 'text-[var(--editor-text-primary)]',
  textSecondary: 'text-[var(--editor-text-secondary)]',
  textMuted: 'text-[var(--editor-text-muted)]',
  
  borderDefault: 'border-[var(--editor-border-default)]',
  borderSubtle: 'border-[var(--editor-border-subtle)]',
  borderFocus: 'focus:border-[var(--editor-border-focus)]',
  
  // Input field
  input: `bg-[var(--editor-bg-tertiary)] text-[var(--editor-text-primary)] text-xs 
          border border-[var(--editor-border-default)] rounded px-2 py-1.5 outline-none 
          focus:border-[var(--editor-border-focus)] transition-colors
          placeholder:text-[var(--editor-text-placeholder)]`,
  
  // Buttons
  buttonPrimary: `bg-[var(--editor-accent-blue)] hover:opacity-90 text-white text-xs 
                  font-medium px-3 py-1.5 rounded transition-all`,
  buttonSecondary: `bg-[var(--editor-bg-tertiary)] hover:bg-[var(--editor-bg-hover)] 
                    text-[var(--editor-text-primary)] text-xs px-3 py-1.5 rounded 
                    border border-[var(--editor-border-default)] transition-colors`,
  buttonDanger: `bg-transparent hover:bg-[var(--editor-accent-red)]/10 
                 text-[var(--editor-accent-red)] text-xs px-2 py-1 rounded transition-colors`,
  buttonGhost: `bg-transparent hover:bg-[var(--editor-bg-hover)] 
                text-[var(--editor-text-secondary)] hover:text-[var(--editor-text-primary)] 
                text-xs px-2 py-1 rounded transition-colors`,
  
  // Labels
  label: 'text-xs text-[var(--editor-text-secondary)] group-hover:text-[var(--editor-text-primary)] transition-colors',
  
  // Sections
  section: 'border-b border-[var(--editor-border-default)]',
  sectionTitle: 'text-xs font-medium text-[var(--editor-text-secondary)] uppercase tracking-wider',
  
  // Header bar
  header: 'bg-[var(--editor-bg-primary)] border-b border-[var(--editor-border-default)]',
  
  // Panels (left/right)
  panel: 'bg-[var(--editor-bg-panel)] border-[var(--editor-border-default)]',
  
  // Canvas/Preview area
  canvas: 'bg-[var(--editor-bg-canvas)]',
};

// Helper: Get inline Tailwind classes for a theme (for components that can't use CSS vars)
export function getThemeClasses(mode: ThemeMode = 'dark') {
  const t = themes[mode];
  return {
    bgPrimary: `bg-[${t.bg.primary}]`,
    bgSecondary: `bg-[${t.bg.secondary}]`,
    bgTertiary: `bg-[${t.bg.tertiary}]`,
    bgCanvas: `bg-[${t.bg.canvas}]`,
    bgPanel: `bg-[${t.bg.panel}]`,
    textPrimary: `text-[${t.text.primary}]`,
    textSecondary: `text-[${t.text.secondary}]`,
    textMuted: `text-[${t.text.muted}]`,
    borderDefault: `border-[${t.border.default}]`,
  };
}

// Legacy export for backward compatibility
export const editorTheme = themes.dark;
