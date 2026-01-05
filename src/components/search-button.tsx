'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface SearchButtonProps {
  basePath: string;
}

// Lightweight client component for search
// Opens a modal/dropdown for search input
export function SearchButton({ basePath }: SearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`${basePath}/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-600 hover:text-black transition-colors cursor-pointer"
        aria-label="חיפוש"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Search Modal/Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-xl mx-4 rounded-lg shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit} className="flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="חפש מוצרים..."
                className="flex-1 px-6 py-4 text-lg outline-none"
                dir="rtl"
              />
              <button
                type="submit"
                className="px-6 py-4 text-gray-600 hover:text-black transition-colors cursor-pointer"
                aria-label="חפש"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-4 text-gray-400 hover:text-black transition-colors cursor-pointer"
                aria-label="סגור"
              >
                <X className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

