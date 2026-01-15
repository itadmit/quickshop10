'use client';

import { useState, useRef, useCallback } from 'react';
import {
  validateFile,
  formatFileSize,
  getVideoThumbnailUrl,
  isVideoUrl,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_FILE_SIZE,
  CloudinaryUploadResult,
} from '@/lib/cloudinary';

// Combined types for media uploader (images + videos)
export const ALLOWED_MEDIA_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
import { MediaPickerModal, MediaItem } from './media-picker-modal';

// ===== Server Upload (WebP conversion + Vercel Blob storage) =====
async function uploadToServer(
  file: File,
  options: { folder?: string; tags?: string[]; storeId?: string } = {}
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  if (options.folder) formData.append('folder', options.folder);
  if (options.tags) formData.append('tags', options.tags.join(','));
  if (options.storeId) formData.append('storeId', options.storeId); // Save to media library

  // Use Vercel Blob for new uploads (with WebP conversion)
  const response = await fetch('/api/upload-blob', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}

// ===== Server Delete (Remove from Blob/Cloudinary + DB) =====
async function deleteFromServer(publicId: string, mediaId?: string): Promise<void> {
  // Try to delete from Vercel Blob first (for new uploads)
  const blobResponse = await fetch(`/api/upload-blob?url=${encodeURIComponent(publicId)}`, {
    method: 'DELETE',
  });

  // If Blob delete failed and it looks like a Cloudinary URL, try Cloudinary
  if (!blobResponse.ok && publicId.includes('cloudinary')) {
    const cloudinaryResponse = await fetch(`/api/upload/${encodeURIComponent(publicId)}`, {
      method: 'DELETE',
    });

    if (!cloudinaryResponse.ok) {
      const error = await cloudinaryResponse.json();
      console.error('Cloudinary delete failed:', error);
    }
  }

  // Delete from media library DB if mediaId exists
  if (mediaId) {
    const dbResponse = await fetch(`/api/media/${encodeURIComponent(mediaId)}`, {
      method: 'DELETE',
    });

    if (!dbResponse.ok) {
      const error = await dbResponse.json();
      console.error('DB delete failed:', error);
    }
  }
}

// ===== Types =====

export interface UploadedMedia {
  id: string;
  url: string;
  publicId?: string;
  mediaId?: string; // DB record ID for deletion
  filename: string;
  size: number;
  width?: number;
  height?: number;
  isPrimary?: boolean;
  // Video support
  mediaType?: 'image' | 'video';
  thumbnailUrl?: string; // Video poster (first frame)
  duration?: number; // Video duration in seconds
  displayAsCard?: boolean; // Show video thumbnail in category/home product cards
}

export interface MediaUploaderProps {
  /** Current uploaded files */
  value: UploadedMedia[];
  /** Callback when files change */
  onChange: (files: UploadedMedia[]) => void;
  /** Maximum number of files allowed */
  maxFiles?: number;
  /** Allow multiple files */
  multiple?: boolean;
  /** Folder in Cloudinary to upload to */
  folder?: string;
  /** Store ID - if provided, saves to media library */
  storeId?: string;
  /** Store slug - required for media picker */
  storeSlug?: string;
  /** Show primary badge and allow setting primary */
  showPrimary?: boolean;
  /** Aspect ratio for preview (e.g., "1:1", "16:9", "4:3") */
  aspectRatio?: string;
  /** Compact mode - smaller preview */
  compact?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Accepted file types (default: images only, use ALLOWED_MEDIA_TYPES for images+video) */
  accept?: string;
  /** Allow video uploads (max 20MB, generates thumbnail automatically) */
  allowVideo?: boolean;
  /** Custom placeholder text */
  placeholder?: string;
  /** Class name for outer container */
  className?: string;
}

interface FileWithProgress {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: CloudinaryUploadResult;
}

// ===== Component =====

export function MediaUploader({
  value = [],
  onChange,
  maxFiles = 10,
  multiple = true,
  folder = 'quickshop',
  storeId,
  storeSlug,
  showPrimary = false,
  aspectRatio = '1:1',
  compact = false,
  disabled = false,
  accept,
  allowVideo = false,
  placeholder,
  className = '',
}: MediaUploaderProps) {
  // Determine accepted file types
  const acceptedTypes = accept || (allowVideo ? ALLOWED_MEDIA_TYPES.join(',') : ALLOWED_IMAGE_TYPES.join(','));
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<FileWithProgress[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Handle selection from media picker
  const handlePickerSelect = useCallback((items: MediaItem[]) => {
    const newMedia: UploadedMedia[] = items.map((item, index) => ({
      id: item.id,
      url: item.url,
      publicId: item.publicId || undefined,
      mediaId: item.id,
      filename: item.filename,
      size: item.size || 0,
      width: item.width || undefined,
      height: item.height || undefined,
      isPrimary: value.length === 0 && index === 0 && showPrimary,
    }));
    
    // Filter out duplicates
    const existingIds = new Set(value.map(v => v.id));
    const uniqueNewMedia = newMedia.filter(m => !existingIds.has(m.id));
    
    // Respect maxFiles limit
    const availableSlots = maxFiles - value.length;
    const mediaToAdd = uniqueNewMedia.slice(0, availableSlots);
    
    if (mediaToAdd.length > 0) {
      onChange([...value, ...mediaToAdd]);
    }
  }, [value, onChange, maxFiles, showPrimary]);

  // Calculate aspect ratio for CSS
  const getAspectRatioPadding = () => {
    const [w, h] = aspectRatio.split(':').map(Number);
    return `${(h / w) * 100}%`;
  };

  // Handle file selection
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    const remainingSlots = maxFiles - value.length;
    const filesToUpload = multiple ? fileArray.slice(0, remainingSlots) : [fileArray[0]];

    if (filesToUpload.length === 0) return;

    // Validate files
    const validFiles: File[] = [];
    for (const file of filesToUpload) {
      const validation = validateFile(file, {
        maxSize: MAX_FILE_SIZE,
        allowedTypes: acceptedTypes.split(','),
      });

      if (!validation.valid) {
        alert(validation.error);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Create upload entries
    const newUploads: FileWithProgress[] = validFiles.map(file => ({
      file,
      id: crypto.randomUUID(),
      progress: 0,
      status: 'pending',
    }));

    setUploading(prev => [...prev, ...newUploads]);

    // Upload files and collect results
    const uploadedMedia: UploadedMedia[] = [];
    
    for (const upload of newUploads) {
      try {
        setUploading(prev =>
          prev.map(u => u.id === upload.id ? { ...u, status: 'uploading', progress: 10 } : u)
        );

        // Use server upload for WebP conversion + signed upload
        // Pass storeId to save to media library
        const result = await uploadToServer(upload.file, {
          folder,
          tags: ['quickshop', 'product'],
          storeId,
        });

        setUploading(prev =>
          prev.map(u => u.id === upload.id ? { ...u, status: 'success', progress: 100, result } : u)
        );

        // Collect uploaded media (include mediaId for DB deletion)
        // Detect if video based on resource_type from Cloudinary
        const isVideo = result.resource_type === 'video';
        
        const newMedia: UploadedMedia = {
          id: result.public_id,
          url: result.secure_url,
          publicId: result.public_id,
          mediaId: result.media_id, // DB record ID
          filename: result.original_filename,
          size: result.bytes,
          width: result.width,
          height: result.height,
          isPrimary: (value.length === 0 && uploadedMedia.length === 0) && showPrimary,
          // Video support
          mediaType: isVideo ? 'video' : 'image',
          thumbnailUrl: isVideo ? result.thumbnail_url : undefined,
        };

        uploadedMedia.push(newMedia);
      } catch (error) {
        console.error('Upload failed:', error);
        setUploading(prev =>
          prev.map(u => u.id === upload.id ? { 
            ...u, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'העלאה נכשלה' 
          } : u)
        );
      }
    }
    
    // Update value once with all uploaded media
    if (uploadedMedia.length > 0) {
      onChange([...value, ...uploadedMedia]);
    }

    // Clear completed uploads after a delay
    setTimeout(() => {
      setUploading(prev => prev.filter(u => u.status !== 'success'));
    }, 1000);
  }, [disabled, maxFiles, value, multiple, acceptedTypes, folder, showPrimary, onChange, storeId]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, handleFiles]);

  // Remove file - deletes from Cloudinary + DB
  const handleRemove = useCallback((id: string) => {
    const itemToRemove = value.find(v => v.id === id);
    const newValue = value.filter(v => v.id !== id);
    
    // If removed item was primary and there are others, make first one primary
    if (showPrimary && itemToRemove?.isPrimary && newValue.length > 0) {
      newValue[0].isPrimary = true;
    }
    
    // Delete from Cloudinary + DB (async, don't wait)
    if (itemToRemove?.publicId) {
      deleteFromServer(itemToRemove.publicId, itemToRemove.mediaId);
    }
    
    onChange(newValue);
  }, [value, onChange, showPrimary]);

  // Set primary
  const handleSetPrimary = useCallback((id: string) => {
    if (!showPrimary) return;
    
    onChange(value.map(v => ({
      ...v,
      isPrimary: v.id === id,
    })));
  }, [value, onChange, showPrimary]);

  // Reorder files (drag within gallery)
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    const newValue = [...value];
    const [removed] = newValue.splice(fromIndex, 1);
    newValue.splice(toIndex, 0, removed);
    onChange(newValue);
  }, [value, onChange]);

  const canAddMore = !multiple ? value.length === 0 : value.length < maxFiles;
  const isUploading = uploading.some(u => u.status === 'uploading');
  
  // Drag state for visual feedback
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  
  // Accordion state - show all images
  const [showAll, setShowAll] = useState(false);
  const MAX_VISIBLE = 6; // 1 large + 5 small (2 rows of 3 minus 1)

  // Render single image card with drag & drop
  const renderImageCard = (media: UploadedMedia, index: number, size: 'large' | 'small') => {
    const isDragging = draggingId === media.id;
    const isDragOver = dragOverId === media.id && draggingId !== media.id;
    const isPrimaryImage = index === 0;
    
    return (
      <div
        key={media.id}
        className={`relative group ${isDragging ? 'opacity-40 scale-95' : ''} transition-all duration-150`}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', index.toString());
          setDraggingId(media.id);
        }}
        onDragEnd={() => {
          setDraggingId(null);
          setDragOverId(null);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (draggingId !== media.id) {
            setDragOverId(media.id);
          }
        }}
        onDragLeave={(e) => {
          // Only reset if leaving the actual element
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverId(null);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
          if (!isNaN(fromIndex) && fromIndex !== index) {
            handleReorder(fromIndex, index);
          }
          setDragOverId(null);
          setDraggingId(null);
        }}
      >
        <div 
          className={`relative overflow-hidden rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing
            ${isDragOver ? 'border-blue-500 ring-2 ring-blue-200 scale-105' : 'border-gray-200 hover:border-gray-300'}`}
          style={{ paddingBottom: '100%' }}
        >
          {/* Show thumbnail for videos, image otherwise */}
          <img
            src={(media.mediaType === 'video' || isVideoUrl(media.url)) 
              ? (media.thumbnailUrl || getVideoThumbnailUrl(media.url)) 
              : media.url}
            alt={media.filename || ''}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            draggable={false}
          />
          
          {/* Video play indicator */}
          {(media.mediaType === 'video' || isVideoUrl(media.url)) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
          
          {/* Video "Display as Card" checkbox */}
          {(media.mediaType === 'video' || isVideoUrl(media.url)) && (
            <label 
              className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-black/70 rounded text-white text-[10px] cursor-pointer hover:bg-black/80 transition-colors z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={media.displayAsCard || false}
                onChange={(e) => {
                  e.stopPropagation();
                  const updated = value.map(m => 
                    m.id === media.id ? { ...m, displayAsCard: e.target.checked } : m
                  );
                  onChange(updated);
                }}
                className="w-3 h-3 rounded border-white/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
              />
              <span>הצג בכרטיס</span>
            </label>
          )}
          
          {/* Drop indicator overlay */}
          {isDragOver && (
            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center z-10">
              <div className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded">
                שחרר כאן
              </div>
            </div>
          )}
          
          {/* Hover overlay with actions */}
          {!isDragOver && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(media.id);
                }}
                className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                title="הסר"
              >
                <TrashIcon />
              </button>
            </div>
          )}

          {/* Primary badge */}
          {showPrimary && isPrimaryImage && (
            <span className="absolute top-2 right-2 px-2 py-0.5 bg-blue-500 text-white text-[11px] font-medium rounded shadow-sm">
              ראשית
            </span>
          )}
        </div>
      </div>
    );
  };

  // Calculate visible images
  const hiddenCount = value.length - MAX_VISIBLE;
  const hasMore = hiddenCount > 0 && !showAll;
  const visibleImages = showAll ? value : value.slice(0, MAX_VISIBLE);

  return (
    <div className={`media-uploader ${className}`} dir="rtl">
      {/* Shopify-style Gallery: Primary (40%) + 3 columns grid */}
      {value.length > 0 && !compact && showPrimary && (
        <div className="flex gap-3 mb-4">
          {/* Primary Image - 40% width */}
          <div className="w-2/5 flex-shrink-0">
            {renderImageCard(value[0], 0, 'large')}
          </div>
          
          {/* Secondary Images - 3 columns grid */}
          {value.length > 1 && (
            <div className="flex-1 grid grid-cols-3 gap-2 content-start">
              {visibleImages.slice(1).map((media, idx) => renderImageCard(media, idx + 1, 'small'))}
              
              {/* "+X more" button */}
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="relative rounded-xl border-2 border-gray-200 bg-gray-100 hover:bg-gray-200 hover:border-gray-300 transition-all cursor-pointer"
                  style={{ paddingBottom: '100%' }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-600">+{hiddenCount}</span>
                    <span className="text-xs text-gray-500">לחץ להצגה</span>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Collapse button when expanded */}
      {showAll && value.length > MAX_VISIBLE && !compact && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="mb-3 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
          הסתר תמונות
        </button>
      )}
      
      {/* Simple grid for compact mode or no primary */}
      {value.length > 0 && (compact || !showPrimary) && (
        <div className={`grid gap-3 mb-4 ${compact ? 'grid-cols-6' : 'grid-cols-4'}`}>
          {value.map((media, index) => renderImageCard(media, index, 'small'))}
        </div>
      )}

      {/* Upload progress */}
      {uploading.length > 0 && (
        <div className="space-y-2 mb-4">
          {uploading.map(upload => (
            <div 
              key={upload.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                upload.status === 'error' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                {upload.status === 'uploading' ? (
                  <SpinnerIcon />
                ) : upload.status === 'success' ? (
                  <CheckIcon className="text-green-500" />
                ) : upload.status === 'error' ? (
                  <XIcon className="text-red-500" />
                ) : (
                  <ImageIcon className="text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{upload.file.name}</p>
                <p className="text-xs text-gray-500">
                  {upload.status === 'uploading' && 'מעלה...'}
                  {upload.status === 'success' && 'הועלה בהצלחה'}
                  {upload.status === 'error' && (upload.error || 'העלאה נכשלה')}
                  {upload.status === 'pending' && formatFileSize(upload.file.size)}
                </p>
              </div>
              {upload.status === 'uploading' && (
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canAddMore && (
        <div
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`
            relative rounded-xl border-2 border-dashed transition-all cursor-pointer
            ${isDragging 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${compact ? 'p-4' : 'p-8'}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={acceptedTypes}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
            disabled={disabled}
          />
          
          <div className="flex flex-col items-center text-center">
            <div className={`rounded-full bg-gray-100 mb-3 flex items-center justify-center ${compact ? 'w-10 h-10' : 'w-14 h-14'}`}>
              {isUploading ? (
                <SpinnerIcon className="w-6 h-6 text-blue-500" />
              ) : (
                <UploadIcon className={`${compact ? 'w-5 h-5' : 'w-7 h-7'} text-gray-400`} />
              )}
            </div>
            
            <div>
              <p className={`font-medium text-gray-700 ${compact ? 'text-sm' : 'text-base'}`}>
                {isDragging ? 'שחרר לעליה' : (placeholder || 'גרור תמונות או לחץ לבחירה')}
              </p>
              {!compact && (
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, WEBP עד {Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB
                  {multiple && maxFiles > 1 && ` • עד ${maxFiles} תמונות`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {canAddMore && !compact && (
        <div className="mt-4 flex items-center gap-3">
          {/* Media Picker Button - only if storeId and storeSlug provided */}
          {storeId && storeSlug && (
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <GalleryIcon className="w-4 h-4" />
              בחר מספרייה
            </button>
          )}
          
          {/* URL input fallback */}
          <UrlInput
            onAdd={(url) => {
              const newMedia: UploadedMedia = {
                id: crypto.randomUUID(),
                url,
                filename: url.split('/').pop() || 'image',
                size: 0,
                isPrimary: value.length === 0 && showPrimary,
              };
              onChange([...value, newMedia]);
            }}
          />
        </div>
      )}

      {/* Media Picker Modal */}
      {storeId && storeSlug && (
        <MediaPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelect={handlePickerSelect}
          storeId={storeId}
          storeSlug={storeSlug}
          multiple={multiple}
          maxSelect={maxFiles - value.length}
          selectedIds={value.map(v => v.id)}
        />
      )}
    </div>
  );
}

// ===== URL Input Component =====

function UrlInput({ onAdd }: { onAdd: (url: string) => void }) {
  const [url, setUrl] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAdd = () => {
    if (!url.trim()) return;
    try {
      new URL(url); // Validate URL
      onAdd(url.trim());
      setUrl('');
      setIsExpanded(false);
    } catch {
      alert('כתובת URL לא תקינה');
    }
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <LinkIcon className="w-4 h-4" />
        הוסף מ-URL
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com/image.jpg"
        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none"
        dir="ltr"
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={!url.trim()}
        className="px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        הוסף
      </button>
      <button
        type="button"
        onClick={() => setIsExpanded(false)}
        className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
      >
        ביטול
      </button>
    </div>
  );
}

// ===== Icons =====

function UploadIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 16.5V18a3 3 0 003 3h10a3 3 0 003-3v-1.5M12 15V3m0 0l4 4m-4-4L8 7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  );
}

function SpinnerIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
    </svg>
  );
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function XIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function ImageIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}

function LinkIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}

function GalleryIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}

export default MediaUploader;


