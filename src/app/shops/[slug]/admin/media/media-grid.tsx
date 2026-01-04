'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { deleteMedia, bulkDeleteMedia } from './actions';

interface MediaItem {
  id: string;
  filename: string;
  originalFilename: string | null;
  mimeType: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  url: string;
  thumbnailUrl: string | null;
  alt: string | null;
  folder: string | null;
  createdAt: Date;
}

interface MediaGridProps {
  media: MediaItem[];
  slug: string;
}

export function MediaGrid({ media, slug }: MediaGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedMedia = media.find(m => m.id === selectedId);

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    if (!confirm('האם למחוק את הקובץ?')) return;
    
    startTransition(async () => {
      await deleteMedia(id, slug);
      setSelectedId(null);
      router.refresh();
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`האם למחוק ${selectedIds.size} קבצים?`)) return;
    
    startTransition(async () => {
      await bulkDeleteMedia(Array.from(selectedIds), slug);
      setSelectedIds(new Set());
      setIsSelectMode(false);
      router.refresh();
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(media.map(m => m.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleItemClick = (item: MediaItem) => {
    if (isSelectMode) {
      toggleSelect(item.id);
    } else {
      setSelectedId(item.id === selectedId ? null : item.id);
    }
  };

  const isImage = (mimeType: string | null) => mimeType?.startsWith('image/');

  if (media.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <p className="text-gray-500">אין קבצים בספרייה</p>
        <p className="text-sm text-gray-400 mt-1">העלה קבצים כדי להתחיל</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selection Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              if (isSelectMode) {
                setSelectedIds(new Set());
              }
            }}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              isSelectMode
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isSelectMode ? 'ביטול בחירה' : 'בחירת קבצים'}
          </button>

          {isSelectMode && (
            <>
              <button
                onClick={selectedIds.size === media.length ? deselectAll : selectAll}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {selectedIds.size === media.length ? 'בטל הכל' : 'בחר הכל'}
              </button>
              
              <span className="text-sm text-gray-500">
                {selectedIds.size} נבחרו
              </span>
            </>
          )}
        </div>

        {isSelectMode && selectedIds.size > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            {isPending ? 'מוחק...' : `מחק ${selectedIds.size} קבצים`}
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Grid */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {media.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  isSelectMode && selectedIds.has(item.id)
                    ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
                    : item.id === selectedId && !isSelectMode
                    ? 'border-black shadow-lg' 
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                {/* Checkbox overlay in select mode */}
                {isSelectMode && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedIds.has(item.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white/80 border-gray-400'
                    }`}>
                      {selectedIds.has(item.id) && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}

                {isImage(item.mimeType) ? (
                  <Image
                    src={item.thumbnailUrl || item.url}
                    alt={item.alt || item.filename}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    className="object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                    </svg>
                    <span className="text-xs mt-1">{item.mimeType?.split('/')[1] || 'file'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Details Panel - only show when not in select mode */}
        {selectedMedia && !isSelectMode && (
          <div className="w-72 bg-white rounded-xl border border-gray-200 p-4 h-fit sticky top-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4 relative">
              {/* Loading skeleton */}
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              
              {isImage(selectedMedia.mimeType) ? (
                /* Using regular img for instant display (cached from thumbnail) */
                <img
                  src={selectedMedia.thumbnailUrl || selectedMedia.url}
                  alt={selectedMedia.alt || selectedMedia.filename}
                  className="w-full h-full object-contain relative z-10"
                  onLoad={(e) => {
                    // Hide skeleton when image loads
                    const skeleton = e.currentTarget.previousElementSibling;
                    if (skeleton) skeleton.classList.add('hidden');
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs">שם קובץ</p>
                <p className="font-medium truncate">{selectedMedia.originalFilename || selectedMedia.filename}</p>
              </div>

              {selectedMedia.width && selectedMedia.height && (
                <div>
                  <p className="text-gray-500 text-xs">מימדים</p>
                  <p>{selectedMedia.width} × {selectedMedia.height} px</p>
                </div>
              )}

              <div>
                <p className="text-gray-500 text-xs">גודל</p>
                <p>{formatBytes(selectedMedia.size)}</p>
              </div>

              <div>
                <p className="text-gray-500 text-xs">סוג</p>
                <p>{selectedMedia.mimeType || 'N/A'}</p>
              </div>

              <div>
                <p className="text-gray-500 text-xs">תאריך העלאה</p>
                <p>{new Date(selectedMedia.createdAt).toLocaleDateString('he-IL')}</p>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-2">
                <button
                  onClick={() => handleCopyUrl(selectedMedia.url, selectedMedia.id)}
                  className="w-full px-3 py-2 text-sm bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {copiedId === selectedMedia.id ? 'הועתק!' : 'העתק קישור'}
                </button>
                
                <button
                  onClick={() => handleDelete(selectedMedia.id)}
                  disabled={isPending}
                  className="w-full px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? 'מוחק...' : 'מחק קובץ'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
