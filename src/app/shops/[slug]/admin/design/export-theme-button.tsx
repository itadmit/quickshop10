'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Download, Code } from 'lucide-react';

interface ExportThemeButtonProps {
  templateId: string;
  template: {
    id: string;
    name: string;
    description: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
  } | undefined;
  storeSlug: string;
}

export function ExportThemeButton({ templateId, template, storeSlug }: ExportThemeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = () => {
    if (!template) return;
    
    const themeData = {
      templateId,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        colors: template.colors,
        fonts: template.fonts,
      },
      storeSlug,
      exportDate: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(themeData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `theme-${storeSlug}-${templateId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="אפשרויות"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>

      {/* Dropdown Menu - Opens upward */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[100]">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-right"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>הורד תבנית</span>
          </button>
          <Link
            href={`/shops/${storeSlug}/admin/design/custom-code`}
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-right"
          >
            <Code className="w-4 h-4 text-gray-500" />
            <span>קוד מותאם</span>
          </Link>
        </div>
      )}
    </div>
  );
}
