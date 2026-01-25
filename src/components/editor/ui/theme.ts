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
      primary: '#1e1e1e',
      secondary: '#252525',
      tertiary: '#2c2c2c',
      hover: '#3c3c3c',
      active: '#404040',
    },
    // Text colors
    text: {
      primary: '#ffffff',
      secondary: '#a0a0a0',
      muted: '#6b6b6b',
      placeholder: '#505050',
    },
    // Border colors
    border: {
      default: '#3c3c3c',
      hover: '#505050',
      focus: '#0d99ff',
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
    },
    // Text colors
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#94a3b8',
      placeholder: '#cbd5e1',
    },
    // Border colors
    border: {
      default: '#e2e8f0',
      hover: '#cbd5e1',
      focus: '#0d99ff',
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

// CSS Variables generator
export function getThemeCssVars(mode: ThemeMode = 'dark'): string {
  const t = themes[mode];
  return `
    --editor-bg-primary: ${t.bg.primary};
    --editor-bg-secondary: ${t.bg.secondary};
    --editor-bg-tertiary: ${t.bg.tertiary};
    --editor-bg-hover: ${t.bg.hover};
    --editor-bg-active: ${t.bg.active};
    --editor-text-primary: ${t.text.primary};
    --editor-text-secondary: ${t.text.secondary};
    --editor-text-muted: ${t.text.muted};
    --editor-text-placeholder: ${t.text.placeholder};
    --editor-border-default: ${t.border.default};
    --editor-border-hover: ${t.border.hover};
    --editor-border-focus: ${t.border.focus};
    --editor-accent-blue: ${accent.blue};
    --editor-accent-green: ${accent.green};
    --editor-accent-red: ${accent.red};
  `;
}

// Tailwind-compatible classes that use CSS variables
export const editorClasses = {
  // These classes use CSS variables, so they work with both themes!
  bgPrimary: 'bg-[var(--editor-bg-primary)]',
  bgSecondary: 'bg-[var(--editor-bg-secondary)]',
  bgTertiary: 'bg-[var(--editor-bg-tertiary)]',
  bgHover: 'hover:bg-[var(--editor-bg-hover)]',
  
  textPrimary: 'text-[var(--editor-text-primary)]',
  textSecondary: 'text-[var(--editor-text-secondary)]',
  textMuted: 'text-[var(--editor-text-muted)]',
  
  borderDefault: 'border-[var(--editor-border-default)]',
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
  
  // Labels
  label: 'text-xs text-[var(--editor-text-secondary)] group-hover:text-[var(--editor-text-primary)] transition-colors',
  
  // Sections
  section: 'border-b border-[var(--editor-border-default)]',
  sectionTitle: 'text-xs font-medium text-[var(--editor-text-secondary)] uppercase tracking-wider',
};

// Helper: Get inline Tailwind classes for a theme (for components that can't use CSS vars)
export function getThemeClasses(mode: ThemeMode = 'dark') {
  const t = themes[mode];
  return {
    bgPrimary: `bg-[${t.bg.primary}]`,
    bgSecondary: `bg-[${t.bg.secondary}]`,
    bgTertiary: `bg-[${t.bg.tertiary}]`,
    textPrimary: `text-[${t.text.primary}]`,
    textSecondary: `text-[${t.text.secondary}]`,
    textMuted: `text-[${t.text.muted}]`,
    borderDefault: `border-[${t.border.default}]`,
  };
}

// Legacy export for backward compatibility
export const editorTheme = themes.dark;
