'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  ChevronDown,
  Unlink,
  Palette,
  Image as ImageIcon,
  Quote,
  Minus,
} from 'lucide-react';

// ============================================
// Rich Text Editor - Shopify Style (Hebrew)
// Lightweight - No external dependencies
// ============================================

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  hint?: string;
  minHeight?: number;
  maxHeight?: number;
}

// Common text colors - Extended palette
const TEXT_COLORS = [
  // Neutrals
  { value: '#000000', label: 'שחור' },
  { value: '#1F2937', label: 'אפור כהה מאוד' },
  { value: '#374151', label: 'אפור כהה' },
  { value: '#6B7280', label: 'אפור' },
  { value: '#9CA3AF', label: 'אפור בהיר' },
  { value: '#D1D5DB', label: 'אפור בהיר מאוד' },
  { value: '#F3F4F6', label: 'אפור חיוור' },
  { value: '#FFFFFF', label: 'לבן' },
  
  // Reds
  { value: '#7F1D1D', label: 'אדום כהה' },
  { value: '#DC2626', label: 'אדום' },
  { value: '#EF4444', label: 'אדום בהיר' },
  { value: '#FCA5A5', label: 'אדום חיוור' },
  
  // Oranges
  { value: '#9A3412', label: 'כתום כהה' },
  { value: '#EA580C', label: 'כתום' },
  { value: '#F97316', label: 'כתום בהיר' },
  { value: '#FDBA74', label: 'כתום חיוור' },
  
  // Yellows/Golds
  { value: '#854D0E', label: 'זהב כהה' },
  { value: '#CA8A04', label: 'זהב' },
  { value: '#EAB308', label: 'צהוב' },
  { value: '#FDE047', label: 'צהוב בהיר' },
  
  // Greens
  { value: '#14532D', label: 'ירוק כהה' },
  { value: '#16A34A', label: 'ירוק' },
  { value: '#22C55E', label: 'ירוק בהיר' },
  { value: '#86EFAC', label: 'ירוק חיוור' },
  
  // Teals
  { value: '#134E4A', label: 'טורקיז כהה' },
  { value: '#0D9488', label: 'טורקיז' },
  { value: '#14B8A6', label: 'טורקיז בהיר' },
  { value: '#5EEAD4', label: 'טורקיז חיוור' },
  
  // Blues
  { value: '#1E3A8A', label: 'כחול כהה' },
  { value: '#2563EB', label: 'כחול' },
  { value: '#3B82F6', label: 'כחול בהיר' },
  { value: '#93C5FD', label: 'כחול חיוור' },
  
  // Purples
  { value: '#581C87', label: 'סגול כהה' },
  { value: '#7C3AED', label: 'סגול' },
  { value: '#8B5CF6', label: 'סגול בהיר' },
  { value: '#C4B5FD', label: 'סגול חיוור' },
  
  // Pinks
  { value: '#831843', label: 'ורוד כהה' },
  { value: '#DB2777', label: 'ורוד' },
  { value: '#EC4899', label: 'ורוד בהיר' },
  { value: '#F9A8D4', label: 'ורוד חיוור' },
];

// Block formats
const BLOCK_FORMATS = [
  { value: 'p', label: 'פסקה', tag: 'p' },
  { value: 'h1', label: 'כותרת 1', tag: 'h1' },
  { value: 'h2', label: 'כותרת 2', tag: 'h2' },
  { value: 'h3', label: 'כותרת 3', tag: 'h3' },
  { value: 'h4', label: 'כותרת 4', tag: 'h4' },
  { value: 'blockquote', label: 'ציטוט', tag: 'blockquote' },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'הזן טקסט...',
  label,
  hint,
  minHeight = 150,
  maxHeight = 400,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showSourceCode, setShowSourceCode] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBlockFormat, setShowBlockFormat] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [currentBlockFormat, setCurrentBlockFormat] = useState('p');
  const [isFocused, setIsFocused] = useState(false);
  
  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && !showSourceCode) {
      // Only update if content is different to prevent cursor jumping
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, showSourceCode]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // Clean up empty divs that browsers add
      const cleanHtml = html === '<br>' || html === '<div><br></div>' ? '' : html;
      onChange(cleanHtml);
    }
  }, [onChange]);

  // Execute formatting command
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  // Handle paste - clean HTML
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  // Check if format is active
  const isFormatActive = useCallback((command: string): boolean => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  }, []);

  // Detect current block format from selection
  const detectBlockFormat = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    let node: Node | null = selection.anchorNode;
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = (node as Element).tagName.toLowerCase();
        if (['h1', 'h2', 'h3', 'h4', 'blockquote', 'p'].includes(tagName)) {
          setCurrentBlockFormat(tagName);
          return;
        }
      }
      node = node.parentNode;
    }
    setCurrentBlockFormat('p');
  }, []);

  // Handle link creation
  const handleLink = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setShowLinkInput(true);
    } else {
      // No selection - show message
      alert('יש לסמן טקסט לפני הוספת קישור');
    }
  }, []);

  const applyLink = useCallback(() => {
    if (linkUrl) {
      execCommand('createLink', linkUrl);
      setLinkUrl('');
    }
    setShowLinkInput(false);
  }, [linkUrl, execCommand]);

  // Handle block format change
  const handleBlockFormat = useCallback((format: string) => {
    execCommand('formatBlock', `<${format}>`);
    setCurrentBlockFormat(format);
    setShowBlockFormat(false);
  }, [execCommand]);

  // Toolbar button component - prevents focus loss with onMouseDown
  const ToolbarButton = ({ 
    onClick, 
    active = false, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    active?: boolean; 
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()} // Prevent focus loss from editor
      title={title}
      className={`p-1.5 rounded transition-all duration-150 cursor-pointer
        ${active 
          ? 'bg-[var(--editor-accent-blue)]/20 text-[var(--editor-accent-blue)] shadow-sm' 
          : 'text-[var(--editor-text-secondary)] hover:bg-[var(--editor-bg-hover)] hover:text-[var(--editor-text-primary)] active:bg-[var(--editor-bg-tertiary)]'
        }`}
    >
      {children}
    </button>
  );

  // Divider component
  const Divider = () => <div className="w-px h-5 bg-[var(--editor-border-default)] mx-1" />;

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm text-[var(--editor-text-secondary)] mb-1.5">{label}</label>
      )}
      
      <div className={`border rounded-lg overflow-hidden transition-colors ${
        isFocused ? 'border-[var(--editor-accent-blue)] ring-1 ring-[var(--editor-accent-blue)]' : 'border-[var(--editor-border-default)]'
      }`}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-[var(--editor-bg-secondary)] border-b border-[var(--editor-border-default)]">
          {/* Block Format Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBlockFormat(!showBlockFormat)}
              onMouseDown={(e) => e.preventDefault()}
              className="flex items-center gap-1 px-2 py-1 text-sm text-[var(--editor-text-primary)] hover:bg-[var(--editor-bg-hover)] active:bg-[var(--editor-bg-tertiary)] rounded transition-colors cursor-pointer"
            >
              <span>{BLOCK_FORMATS.find(f => f.value === currentBlockFormat)?.label || 'פסקה'}</span>
              <ChevronDown size={14} />
            </button>
            
            {showBlockFormat && (
              <>
                {/* Backdrop to close on outside click */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowBlockFormat(false)}
                />
                {/* Dropdown */}
                <div className="absolute top-full right-0 mt-1 bg-[var(--editor-bg-primary)] border border-[var(--editor-border-default)] rounded-lg shadow-lg z-20 min-w-[120px]">
                  {BLOCK_FORMATS.map(format => (
                    <button
                      key={format.value}
                      type="button"
                      onClick={() => handleBlockFormat(format.value)}
                      onMouseDown={(e) => e.preventDefault()}
                      className="w-full px-3 py-1.5 text-right text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      {format.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <Divider />

          {/* Text Formatting */}
          <ToolbarButton
            onClick={() => execCommand('bold')}
            active={isFormatActive('bold')}
            title="מודגש (Ctrl+B)"
          >
            <Bold size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => execCommand('italic')}
            active={isFormatActive('italic')}
            title="נטוי (Ctrl+I)"
          >
            <Italic size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => execCommand('underline')}
            active={isFormatActive('underline')}
            title="קו תחתון (Ctrl+U)"
          >
            <Underline size={16} />
          </ToolbarButton>

          <Divider />

          {/* Text Color */}
          <div className="relative">
            <ToolbarButton
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="צבע טקסט"
            >
              <Palette size={16} />
            </ToolbarButton>
            
            {showColorPicker && (
              <>
                {/* Backdrop to close on outside click */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowColorPicker(false)}
                />
                {/* Color picker popover - Compact, opens to the left */}
                <div className="absolute top-full left-0 mt-1 p-3 bg-[var(--editor-bg-primary)] border border-[var(--editor-border-default)] rounded-xl shadow-xl z-20 w-64">
                  <p className="text-xs text-[var(--editor-text-muted)] mb-2 text-right font-medium">בחר צבע</p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {TEXT_COLORS.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => {
                          execCommand('foreColor', color.value);
                          setShowColorPicker(false);
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        title={color.label}
                        className="w-7 h-7 rounded-md border-2 border-[var(--editor-border-default)] hover:border-[var(--editor-accent-blue)] hover:scale-110 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                        style={{ backgroundColor: color.value }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <Divider />

          {/* Text Alignment */}
          <ToolbarButton
            onClick={() => execCommand('justifyRight')}
            active={isFormatActive('justifyRight')}
            title="יישור לימין"
          >
            <AlignRight size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => execCommand('justifyCenter')}
            active={isFormatActive('justifyCenter')}
            title="יישור למרכז"
          >
            <AlignCenter size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => execCommand('justifyLeft')}
            active={isFormatActive('justifyLeft')}
            title="יישור לשמאל"
          >
            <AlignLeft size={16} />
          </ToolbarButton>

          <Divider />

          {/* Lists */}
          <ToolbarButton
            onClick={() => execCommand('insertUnorderedList')}
            active={isFormatActive('insertUnorderedList')}
            title="רשימה"
          >
            <List size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => execCommand('insertOrderedList')}
            active={isFormatActive('insertOrderedList')}
            title="רשימה ממוספרת"
          >
            <ListOrdered size={16} />
          </ToolbarButton>

          <Divider />

          {/* Link */}
          <ToolbarButton
            onClick={handleLink}
            title="הוסף קישור"
          >
            <LinkIcon size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => execCommand('unlink')}
            title="הסר קישור"
          >
            <Unlink size={16} />
          </ToolbarButton>

          <Divider />

          {/* Quote & HR */}
          <ToolbarButton
            onClick={() => handleBlockFormat('blockquote')}
            title="ציטוט"
          >
            <Quote size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => execCommand('insertHorizontalRule')}
            title="קו הפרדה"
          >
            <Minus size={16} />
          </ToolbarButton>

          <div className="flex-1" />

          {/* Source Code Toggle */}
          <ToolbarButton
            onClick={() => setShowSourceCode(!showSourceCode)}
            active={showSourceCode}
            title="קוד מקור"
          >
            <Code size={16} />
          </ToolbarButton>
        </div>

        {/* Link Input Modal */}
        {showLinkInput && (
          <div className="absolute top-12 right-0 z-30 bg-[var(--editor-bg-primary)] border border-[var(--editor-border-default)] rounded-lg shadow-lg p-3">
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-48 px-2 py-1 text-sm border border-[var(--editor-border-default)] rounded focus:outline-none focus:border-[var(--editor-accent-blue)] bg-[var(--editor-bg-primary)] text-[var(--editor-text-primary)]"
                onKeyDown={(e) => e.key === 'Enter' && applyLink()}
                autoFocus
              />
              <button
                type="button"
                onClick={applyLink}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                הוסף
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLinkInput(false);
                  setLinkUrl('');
                }}
                className="px-3 py-1 text-[var(--editor-text-secondary)] text-sm hover:bg-[var(--editor-bg-hover)] rounded"
              >
                ביטול
              </button>
            </div>
          </div>
        )}

        {/* Editor / Source Code */}
        {showSourceCode ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 text-sm font-mono text-[var(--editor-text-primary)] bg-[var(--editor-bg-secondary)] resize-none focus:outline-none"
            style={{ minHeight, maxHeight }}
            dir="ltr"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              setShowColorPicker(false);
              setShowBlockFormat(false);
            }}
            onClick={detectBlockFormat}
            onKeyUp={detectBlockFormat}
            data-placeholder={placeholder}
            className="w-full p-4 text-sm text-[var(--editor-text-primary)] focus:outline-none overflow-y-auto leading-relaxed bg-[var(--editor-bg-primary)]
              [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-[var(--editor-text-placeholder)] [&:empty]:before:pointer-events-none
              [&_a]:text-blue-600 [&_a]:underline [&_a]:font-medium
              [&_b]:font-bold [&_strong]:font-bold
              [&_i]:italic [&_em]:italic
              [&_u]:underline
              [&_blockquote]:border-r-4 [&_blockquote]:border-blue-400 [&_blockquote]:bg-blue-50 [&_blockquote]:pr-4 [&_blockquote]:py-3 [&_blockquote]:pl-3 [&_blockquote]:my-3 [&_blockquote]:text-gray-600 [&_blockquote]:italic [&_blockquote]:rounded-l-lg
              [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-5 [&_h1]:text-gray-900 [&_h1]:leading-tight
              [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-4 [&_h2]:text-gray-900 [&_h2]:leading-tight
              [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-gray-800
              [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mb-2 [&_h4]:mt-2 [&_h4]:text-gray-800
              [&_ul]:list-disc [&_ul]:pr-6 [&_ul]:my-2 [&_ul]:mr-2
              [&_ol]:list-decimal [&_ol]:pr-6 [&_ol]:my-2 [&_ol]:mr-2
              [&_li]:mb-1.5 [&_li]:leading-relaxed
              [&_p]:mb-2
              [&_hr]:my-4 [&_hr]:border-[var(--editor-border-default)]"
            style={{ minHeight, maxHeight }}
            dir="rtl"
          />
        )}
      </div>

      {hint && (
        <p className="text-xs text-[var(--editor-text-muted)] mt-1">{hint}</p>
      )}
    </div>
  );
}

// Simple wrapper for backward compatibility - replaces TextAreaField for rich text
export function RichTextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <RichTextEditor
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      hint={hint}
      minHeight={120}
    />
  );
}

export default RichTextEditor;

