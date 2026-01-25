'use client';

/**
 * EditorThemeProvider - Theme context for editor
 * מאפשר החלפה בין בהיר לכהה
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeMode, themes, getThemeCssVars } from './theme';
import { Moon, Sun } from 'lucide-react';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  theme: typeof themes.dark;
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

interface EditorThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

export function EditorThemeProvider({ 
  children, 
  defaultMode = 'light' 
}: EditorThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(defaultMode);

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem('editor-theme') as ThemeMode;
    if (saved && (saved === 'light' || saved === 'dark')) {
      setMode(saved);
    }
  }, []);

  // Save preference
  useEffect(() => {
    localStorage.setItem('editor-theme', mode);
  }, [mode]);

  const toggle = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const theme = themes[mode];
  const cssVars = getThemeCssVars(mode);

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggle, theme }}>
      <div 
        style={cssVars as React.CSSProperties}
        className="h-full"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// Theme toggle button
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { mode, toggle } = useEditorTheme();

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-lg transition-colors
                 bg-[var(--editor-bg-tertiary)] hover:bg-[var(--editor-bg-hover)]
                 text-[var(--editor-text-secondary)] hover:text-[var(--editor-text-primary)]
                 ${className}`}
      title={mode === 'dark' ? 'עבור לבהיר' : 'עבור לכהה'}
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

