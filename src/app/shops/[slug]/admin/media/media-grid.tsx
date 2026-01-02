'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteMedia } from './actions';

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
    <div className="flex gap-6">
      {/* Grid */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {media.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                item.id === selectedId 
                  ? 'border-black shadow-lg' 
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              {isImage(item.mimeType) ? (
                <img
                  src={item.thumbnailUrl || item.url}
                  alt={item.alt || item.filename}
                  className="w-full h-full object-cover"
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
            </button>
          ))}
        </div>
      </div>

      {/* Details Panel */}
      {selectedMedia && (
        <div className="w-72 bg-white rounded-xl border border-gray-200 p-4 h-fit sticky top-4">
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
            {isImage(selectedMedia.mimeType) ? (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.alt || selectedMedia.filename}
                className="w-full h-full object-contain"
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
                className="w-full px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                {isPending ? 'מוחק...' : 'מחק קובץ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

