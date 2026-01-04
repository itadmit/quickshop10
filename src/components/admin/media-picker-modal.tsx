'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Upload, Check, Image as ImageIcon, Loader2 } from 'lucide-react';

// Types
export interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  filename: string;
  publicId?: string | null;
  width?: number | null;
  height?: number | null;
  size?: number | null;
  mimeType?: string | null;
}

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (items: MediaItem[]) => void;
  storeId: string;
  storeSlug: string;
  multiple?: boolean;
  maxSelect?: number;
  selectedIds?: string[];
}

// ===== Server Upload =====
async function uploadToServer(
  file: File,
  options: { folder?: string; storeId?: string }
): Promise<MediaItem> {
  const formData = new FormData();
  formData.append('file', file);
  if (options.folder) formData.append('folder', options.folder);
  if (options.storeId) formData.append('storeId', options.storeId);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  const result = await response.json();
  return {
    id: result.media_id || result.public_id,
    url: result.secure_url,
    thumbnailUrl: result.thumbnail_url,
    filename: result.original_filename,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    size: result.bytes,
  };
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  storeId,
  storeSlug,
  multiple = true,
  maxSelect = 10,
  selectedIds = [],
}: MediaPickerModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ name: string; progress: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch media from API
  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shops/${storeSlug}/media`);
      if (response.ok) {
        const data = await response.json();
        setMedia(data.media || []);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  // Load media when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMedia();
      setSelected(new Set(selectedIds));
    }
  }, [isOpen, fetchMedia, selectedIds]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Toggle selection
  const toggleSelect = useCallback((item: MediaItem) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        if (!multiple) {
          next.clear();
        }
        if (next.size < maxSelect) {
          next.add(item.id);
        }
      }
      return next;
    });
  }, [multiple, maxSelect]);

  // Handle file upload
  const handleUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setUploading(true);
    const uploadList = Array.from(files).map(f => ({ name: f.name, progress: 0 }));
    setUploadProgress(uploadList);

    const newMedia: MediaItem[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        setUploadProgress(prev => 
          prev.map((p, idx) => idx === i ? { ...p, progress: 50 } : p)
        );
        
        const result = await uploadToServer(files[i], {
          folder: `quickshop/stores/${storeSlug}`,
          storeId,
        });
        
        newMedia.push(result);
        
        setUploadProgress(prev => 
          prev.map((p, idx) => idx === i ? { ...p, progress: 100 } : p)
        );
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }

    // Add new media to list and select them
    if (newMedia.length > 0) {
      setMedia(prev => [...newMedia, ...prev]);
      setSelected(prev => {
        const next = new Set(prev);
        newMedia.forEach(m => {
          if (next.size < maxSelect) {
            next.add(m.id);
          }
        });
        return next;
      });
    }

    setUploading(false);
    setUploadProgress([]);
  };

  // Confirm selection
  const handleConfirm = () => {
    const selectedItems = media.filter(m => selected.has(m.id));
    onSelect(selectedItems);
    onClose();
  };

  // Filter media by search
  const filteredMedia = search.trim()
    ? media.filter(m => 
        m.filename?.toLowerCase().includes(search.toLowerCase())
      )
    : media;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">בחירת תמונות</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50">
          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            העלה חדש
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
            className="hidden"
          />

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש..."
              className="w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-gray-400 outline-none"
            />
          </div>

          {/* Selection count */}
          {selected.size > 0 && (
            <span className="text-sm text-gray-600">
              נבחרו {selected.size} {multiple && `מתוך ${maxSelect}`}
            </span>
          )}
        </div>

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="px-6 py-2 bg-blue-50 border-b border-blue-100">
            {uploadProgress.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                <span className="text-blue-800 truncate">{p.name}</span>
                <div className="flex-1 h-1 bg-blue-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <ImageIcon className="w-12 h-12 mb-2 text-gray-300" />
              <p>{search ? 'לא נמצאו תוצאות' : 'אין תמונות בספרייה'}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 text-sm text-gray-900 underline hover:no-underline"
              >
                העלה תמונה חדשה
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {filteredMedia.map((item) => {
                const isSelected = selected.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSelect(item)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group
                      ${isSelected 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-transparent hover:border-gray-300'
                      }`}
                  >
                    {/* Thumbnail - use thumbnailUrl for speed */}
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt={item.filename || ''}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    
                    {/* Selection indicator */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity
                      ${isSelected ? 'bg-blue-500/20' : 'bg-black/0 group-hover:bg-black/10'}`}
                    >
                      {isSelected && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="inline-flex items-center gap-2 px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4" />
            בחר {selected.size > 0 && `(${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MediaPickerModal;

