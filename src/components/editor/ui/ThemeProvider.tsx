'use client';

/**
 * EditorThemeProvider - Theme context for editor
 * מאפשר החלפה בין בהיר לכהה
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeMode, themes, getThemeCssVars, editorClasses } from './theme';
import { Moon, Sun } from 'lucide-react';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  theme: typeof themes.dark;
  classes: typeof editorClasses;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Hook to use theme
export function useEditorTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useEditorTheme must be used within EditorThemeProvider');
  }
  return context;
}

// Hook that works outside of provider (returns null if not in context)
export function useEditorThemeOptional() {
  return useContext(ThemeContext);
}

interface EditorThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

export function EditorThemeProvider({ 
  children, 
  defaultMode = 'dark' 
}: EditorThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(defaultMode);
  const [mounted, setMounted] = useState(false);

  // Load saved preference
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('editor-theme') as ThemeMode;
    if (saved && (saved === 'light' || saved === 'dark')) {
      setMode(saved);
    }
  }, []);

  // Save preference
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('editor-theme', mode);
    }
  }, [mode, mounted]);

  const toggle = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const theme = themes[mode];
  const cssVars = getThemeCssVars(mode);
  const isDark = mode === 'dark';

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggle, theme, classes: editorClasses, isDark }}>
      <div 
        style={cssVars as React.CSSProperties}
        className="h-full"
        data-editor-theme={mode}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// Theme toggle button
interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'header';
}

export function ThemeToggle({ className = '', variant = 'default' }: ThemeToggleProps) {
  const { mode, toggle } = useEditorTheme();

  if (variant === 'header') {
    return (
      <button
        onClick={toggle}
        className={`p-2 rounded-lg transition-all duration-200 cursor-pointer
                   bg-[var(--editor-bg-tertiary)]/50 hover:bg-[var(--editor-bg-hover)]
                   text-[var(--editor-text-secondary)] hover:text-[var(--editor-text-primary)]
                   border border-[var(--editor-border-default)]
                   ${className}`}
        title={mode === 'dark' ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
      >
        {mode === 'dark' ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-lg transition-colors cursor-pointer
                 bg-[var(--editor-bg-tertiary)] hover:bg-[var(--editor-bg-hover)]
                 text-[var(--editor-text-secondary)] hover:text-[var(--editor-text-primary)]
                 ${className}`}
      title={mode === 'dark' ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
    >
      {mode === 'dark' ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}

// Simple wrapper for panels that just needs theme styles
interface EditorPanelWrapperProps {
  children: ReactNode;
  className?: string;
}

export function EditorPanelWrapper({ children, className = '' }: EditorPanelWrapperProps) {
  return (
    <div className={`bg-[var(--editor-bg-primary)] text-[var(--editor-text-primary)] ${className}`}>
      {children}
    </div>
  );
}

