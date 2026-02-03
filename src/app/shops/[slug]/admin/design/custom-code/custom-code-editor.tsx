'use client';

import { useState, useTransition, useEffect, useCallback, useRef } from 'react';
import { updateCustomCode } from './actions';
import Link from 'next/link';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';

interface CustomCodeEditorProps {
  storeId: string;
  storeSlug: string;
  initialCode: {
    headCode: string;
    bodyStartCode: string;
    bodyEndCode: string;
    customCss: string;
  };
}

type TabType = 'head' | 'bodyStart' | 'bodyEnd' | 'css';
type ThemeType = 'dark' | 'light';

const tabs: { id: TabType; label: string; description: string }[] = [
  { id: 'css', label: 'CSS', description: 'סטיילים מותאמים אישית' },
  { id: 'head', label: '<head>', description: 'קוד שמתווסף לתוך <head> (מטא, סקריפטים, פונטים)' },
  { id: 'bodyStart', label: '<body> התחלה', description: 'קוד שמתווסף אחרי פתיחת <body>' },
  { id: 'bodyEnd', label: '<body> סוף', description: 'קוד שמתווסף לפני סגירת </body> (סקריפטים, טראקינג)' },
];

// CSS Properties for autocomplete
const cssProperties = [
  'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
  'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'background', 'background-color', 'background-image', 'background-size', 'background-position',
  'color', 'font-family', 'font-size', 'font-weight', 'line-height', 'text-align',
  'border', 'border-radius', 'border-color', 'border-width', 'border-style',
  'flex', 'flex-direction', 'justify-content', 'align-items', 'gap',
  'grid', 'grid-template-columns', 'grid-template-rows', 'grid-gap',
  'opacity', 'visibility', 'overflow', 'cursor', 'transition', 'transform',
  'box-shadow', 'text-shadow', 'filter', 'animation',
];

// CSS Values for common properties
const cssValues: Record<string, string[]> = {
  'display': ['none', 'block', 'inline', 'inline-block', 'flex', 'grid', 'inline-flex', 'table', 'contents'],
  'position': ['static', 'relative', 'absolute', 'fixed', 'sticky'],
  'flex-direction': ['row', 'row-reverse', 'column', 'column-reverse'],
  'justify-content': ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'],
  'align-items': ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'],
  'align-content': ['flex-start', 'flex-end', 'center', 'stretch', 'space-between', 'space-around'],
  'flex-wrap': ['nowrap', 'wrap', 'wrap-reverse'],
  'text-align': ['left', 'right', 'center', 'justify', 'start', 'end'],
  'text-decoration': ['none', 'underline', 'overline', 'line-through'],
  'text-transform': ['none', 'capitalize', 'uppercase', 'lowercase'],
  'font-weight': ['normal', 'bold', 'lighter', 'bolder', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  'font-style': ['normal', 'italic', 'oblique'],
  'overflow': ['visible', 'hidden', 'scroll', 'auto', 'clip'],
  'overflow-x': ['visible', 'hidden', 'scroll', 'auto'],
  'overflow-y': ['visible', 'hidden', 'scroll', 'auto'],
  'cursor': ['pointer', 'default', 'move', 'text', 'wait', 'not-allowed', 'grab', 'grabbing', 'crosshair'],
  'visibility': ['visible', 'hidden', 'collapse'],
  'opacity': ['0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1'],
  'background-size': ['auto', 'cover', 'contain'],
  'background-position': ['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right'],
  'background-repeat': ['repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'space', 'round'],
  'border-style': ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'],
  'white-space': ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line', 'break-spaces'],
  'word-break': ['normal', 'break-all', 'keep-all', 'break-word'],
  'pointer-events': ['auto', 'none'],
  'user-select': ['auto', 'none', 'text', 'all'],
  'box-sizing': ['content-box', 'border-box'],
  'float': ['none', 'left', 'right'],
  'clear': ['none', 'left', 'right', 'both'],
};

// Theme configurations
const themes = {
  dark: {
    bg: 'bg-[#1e1e1e]',
    header: 'bg-[#252526] border-[#3c3c3c]',
    headerText: 'text-white',
    headerMuted: 'text-gray-400 hover:text-white',
    tabBar: 'bg-[#2d2d30]',
    tabBarBorder: 'border-[#3c3c3c]',
    tabActive: 'bg-[#1e1e1e] text-white border-t-2 border-blue-500',
    tabInactive: 'text-gray-400 hover:text-white hover:bg-[#3c3c3c]',
    description: 'bg-[#252526] text-gray-400 border-[#3c3c3c]',
    editor: '#1e1e1e',
    editorText: '#d4d4d4',
    footer: 'bg-[#007acc] text-white',
    themeBtn: 'text-gray-400 hover:text-white',
    autocomplete: 'bg-[#252526] border-[#3c3c3c] text-gray-300',
    autocompleteHover: 'bg-[#094771]',
  },
  light: {
    bg: 'bg-gray-50',
    header: 'bg-white border-gray-200',
    headerText: 'text-gray-900',
    headerMuted: 'text-gray-600 hover:text-gray-900',
    tabBar: 'bg-gray-100',
    tabBarBorder: 'border-gray-200',
    tabActive: 'bg-white text-gray-900 border-t-2 border-blue-500',
    tabInactive: 'text-gray-600 hover:text-gray-900 hover:bg-gray-200',
    description: 'bg-gray-50 text-gray-600 border-gray-200',
    editor: '#ffffff',
    editorText: '#1e1e1e',
    footer: 'bg-blue-600 text-white',
    themeBtn: 'text-gray-600 hover:text-gray-900',
    autocomplete: 'bg-white border-gray-200 text-gray-900',
    autocompleteHover: 'bg-blue-50',
  },
};

export function CustomCodeEditor({ storeId, storeSlug, initialCode }: CustomCodeEditorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('css');
  const [code, setCode] = useState(initialCode);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState<ThemeType>('dark');
  
  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteItems, setAutocompleteItems] = useState<string[]>([]);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [currentWord, setCurrentWord] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  
  const t = themes[theme];

  const handleSave = useCallback(() => {
    startTransition(async () => {
      await updateCustomCode(storeId, storeSlug, {
        customHeadCode: code.headCode,
        customBodyStartCode: code.bodyStartCode,
        customBodyEndCode: code.bodyEndCode,
        customCss: code.customCss,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }, [storeId, storeSlug, code]);

  // ⌨️ Keyboard shortcut: Cmd+S / Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (!isPending) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, isPending]);

  const getCurrentCode = () => {
    switch (activeTab) {
      case 'head': return code.headCode;
      case 'bodyStart': return code.bodyStartCode;
      case 'bodyEnd': return code.bodyEndCode;
      case 'css': return code.customCss;
    }
  };

  const setCurrentCode = (value: string) => {
    switch (activeTab) {
      case 'head': setCode({ ...code, headCode: value }); break;
      case 'bodyStart': setCode({ ...code, bodyStartCode: value }); break;
      case 'bodyEnd': setCode({ ...code, bodyEndCode: value }); break;
      case 'css': setCode({ ...code, customCss: value }); break;
    }
  };

  // Syntax highlighting
  const highlightCode = (code: string) => {
    const language = activeTab === 'css' ? 'css' : 'markup';
    return Prism.highlight(code, Prism.languages[language], language);
  };

  // Handle autocomplete
  const handleCodeChange = (newCode: string) => {
    setCurrentCode(newCode);
    
    if (activeTab === 'css') {
      // Use setTimeout to get updated cursor position after React update
      setTimeout(() => {
        const textarea = editorRef.current?.querySelector('textarea');
        if (!textarea) return;
        
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = newCode.slice(0, cursorPos);
        
        // Check if we're after a colon (value context) or not (property context)
        const lastColon = textBeforeCursor.lastIndexOf(':');
        const lastSemicolon = textBeforeCursor.lastIndexOf(';');
        const lastBrace = textBeforeCursor.lastIndexOf('{');
        const lastCloseBrace = textBeforeCursor.lastIndexOf('}');
        
        let suggestions: string[] = [];
        let word = '';
        
        // Value context: after colon but before semicolon
        if (lastColon > lastSemicolon && lastColon > lastBrace && lastColon > lastCloseBrace) {
          // Get text after the colon
          const afterColon = textBeforeCursor.slice(lastColon + 1).trim();
          const valueMatch = afterColon.match(/([a-z-]+)$/i);
          word = valueMatch ? valueMatch[1].toLowerCase() : '';
          
          // Find the property name
          const beforeColon = textBeforeCursor.slice(0, lastColon);
          const propMatch = beforeColon.match(/([a-z-]+)\s*$/i);
          const prop = propMatch ? propMatch[1].toLowerCase() : '';
          
          // Get suggestions for this property's values
          const values = cssValues[prop] || [];
          if (word.length >= 1) {
            suggestions = values.filter(v => v.toLowerCase().startsWith(word));
          } else if (values.length > 0) {
            // Show all values if just typed colon
            suggestions = values;
          }
        } else {
          // Property context: inside { } or at start
          const propMatch = textBeforeCursor.match(/([a-z-]+)$/i);
          word = propMatch ? propMatch[1].toLowerCase() : '';
          
          if (word.length >= 2) {
            suggestions = cssProperties.filter(p => p.toLowerCase().startsWith(word));
          }
        }
        
        setCurrentWord(word);
        
        if (suggestions.length > 0) {
          setAutocompleteItems(suggestions.slice(0, 10));
          setAutocompleteIndex(0);
          setShowAutocomplete(true);
          
          // Position autocomplete near cursor
          const lines = textBeforeCursor.split('\n');
          const lineNumber = lines.length - 1;
          const charNumber = lines[lineNumber].length;
          setAutocompletePosition({
            top: (lineNumber + 1) * 22 + 60,
            left: Math.min(charNumber * 8.4 + 16, 400),
          });
        } else {
          setShowAutocomplete(false);
        }
      }, 0);
    } else {
      setShowAutocomplete(false);
    }
  };

  // Handle autocomplete selection
  const selectAutocomplete = (item: string) => {
    const currentCode = getCurrentCode();
    const textarea = editorRef.current?.querySelector('textarea');
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const before = currentCode.slice(0, cursorPos - currentWord.length);
      const after = currentCode.slice(cursorPos);
      const newCode = before + item + after;
      setCurrentCode(newCode);
      setShowAutocomplete(false);
      
      // Focus back and set cursor position
      setTimeout(() => {
        textarea.focus();
        const newPos = cursorPos - currentWord.length + item.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    }
  };

  // Handle keyboard navigation in autocomplete
  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (showAutocomplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAutocompleteIndex(i => Math.min(i + 1, autocompleteItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAutocompleteIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectAutocomplete(autocompleteItems[autocompleteIndex]);
      } else if (e.key === 'Escape') {
        setShowAutocomplete(false);
      }
    }
  };

  const activeTabInfo = tabs.find(tab => tab.id === activeTab);

  return (
    <div className={`flex-1 flex flex-col overflow-hidden min-h-0 ${t.bg}`}>
      {/* Editor & Prism theme styles */}
      <style>{`
        .npm__react-simple-code-editor__textarea,
        .npm__react-simple-code-editor__textarea:focus {
          outline: none !important;
          direction: ltr !important;
          text-align: left !important;
        }
        pre[class*="language-"] {
          direction: ltr !important;
          text-align: left !important;
          white-space: pre !important;
        }
        .token.comment,
        .token.prolog,
        .token.doctype,
        .token.cdata {
          color: ${theme === 'dark' ? '#6a9955' : '#008000'};
        }
        .token.punctuation {
          color: ${theme === 'dark' ? '#d4d4d4' : '#1e1e1e'};
        }
        .token.property,
        .token.tag,
        .token.boolean,
        .token.number,
        .token.constant,
        .token.symbol,
        .token.deleted {
          color: ${theme === 'dark' ? '#9cdcfe' : '#0451a5'};
        }
        .token.selector,
        .token.attr-name,
        .token.string,
        .token.char,
        .token.builtin,
        .token.inserted {
          color: ${theme === 'dark' ? '#ce9178' : '#a31515'};
        }
        .token.operator,
        .token.entity,
        .token.url,
        .language-css .token.string,
        .style .token.string {
          color: ${theme === 'dark' ? '#d4d4d4' : '#1e1e1e'};
        }
        .token.atrule,
        .token.attr-value,
        .token.keyword {
          color: ${theme === 'dark' ? '#c586c0' : '#af00db'};
        }
        .token.function,
        .token.class-name {
          color: ${theme === 'dark' ? '#dcdcaa' : '#795e26'};
        }
        .token.regex,
        .token.important,
        .token.variable {
          color: ${theme === 'dark' ? '#d16969' : '#ee0000'};
        }
      `}</style>

      {/* Header */}
      <div className={`${t.header} border-b px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-4">
          <Link 
            href={`/shops/${storeSlug}/admin/design`}
            className={`flex items-center gap-2 ${t.headerMuted} transition-colors`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-sm">חזרה לעיצוב</span>
          </Link>
          <div className={`w-px h-5 ${theme === 'dark' ? 'bg-[#3c3c3c]' : 'bg-gray-200'}`} />
          <h1 className={`${t.headerText} font-medium`}>קוד מותאם</h1>
        </div>
        <div className={`flex items-center gap-3 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
          <span>הקוד מתווסף לכל דפי החנות</span>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-1.5 rounded transition-colors ${t.themeBtn}`}
            title={theme === 'dark' ? 'מצב בהיר' : 'מצב כהה'}
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={`${t.tabBar} flex items-center border-b ${t.tabBarBorder}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setShowAutocomplete(false); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id ? t.tabActive : t.tabInactive
            }`}
          >
            {tab.label}
          </button>
        ))}
        
        <div className="mr-auto px-4">
          <button
            onClick={handleSave}
            disabled={isPending}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors flex items-center gap-2 ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50`}
          >
            {isPending ? 'שומר...' : saved ? 'נשמר ✓' : (
              <>
                <span>שמור שינויים</span>
                <kbd className="text-[11px] bg-blue-500 px-1.5 py-0.5 rounded opacity-70 inline-flex items-center gap-0.5">
                  <span>S</span>
                  <span>+</span>
                  <span className="text-sm">⌘</span>
                </kbd>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Description */}
      <div className={`${t.description} px-4 py-2 text-xs border-b`}>
        {activeTabInfo?.description}
      </div>

      {/* Code Editor */}
      <div className="flex-1 overflow-auto min-h-0 relative" dir="ltr" ref={editorRef}>
        <Editor
          value={getCurrentCode()}
          onValueChange={handleCodeChange}
          highlight={highlightCode}
          onKeyDown={handleEditorKeyDown}
          padding={16}
          style={{
            fontFamily: '"Fira Code", "Fira Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace',
            fontSize: 14,
            lineHeight: 1.5,
            backgroundColor: t.editor,
            color: t.editorText,
            minHeight: '100%',
            direction: 'ltr',
            textAlign: 'left',
          }}
          textareaClassName="focus:outline-none"
          preClassName="!whitespace-pre"
          placeholder={activeTab === 'css' ? '/* Add custom CSS */' : '<!-- Add HTML code here -->'}
        />
        
        {/* Autocomplete dropdown */}
        {showAutocomplete && autocompleteItems.length > 0 && (
          <div 
            className={`absolute z-50 ${t.autocomplete} border rounded shadow-lg py-1 min-w-[200px]`}
            style={{ top: autocompletePosition.top, left: autocompletePosition.left }}
          >
            {autocompleteItems.map((item, index) => (
              <button
                key={item}
                onClick={() => selectAutocomplete(item)}
                className={`w-full text-left px-3 py-1 text-sm font-mono ${
                  index === autocompleteIndex ? t.autocompleteHover : ''
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`${t.footer} px-4 py-1 text-xs flex items-center justify-between`}>
        <div className="flex items-center gap-4">
          <span>{activeTab === 'css' ? 'CSS' : 'HTML'}</span>
          <span>UTF-8</span>
          {activeTab === 'css' && <span className="opacity-70">השלמה אוטומטית פעילה</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>שורות: {getCurrentCode().split('\n').length}</span>
        </div>
      </div>
    </div>
  );
}
