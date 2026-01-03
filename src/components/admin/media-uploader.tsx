'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  uploadToCloudinary,
  validateFile,
  formatFileSize,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  CloudinaryUploadResult,
} from '@/lib/cloudinary';

// ===== Types =====

export interface UploadedMedia {
  id: string;
  url: string;
  publicId?: string;
  filename: string;
  size: number;
  width?: number;
  height?: number;
  isPrimary?: boolean;
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
  /** Show primary badge and allow setting primary */
  showPrimary?: boolean;
  /** Aspect ratio for preview (e.g., "1:1", "16:9", "4:3") */
  aspectRatio?: string;
  /** Compact mode - smaller preview */
  compact?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Accepted file types */
  accept?: string;
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
  showPrimary = false,
  aspectRatio = '1:1',
  compact = false,
  disabled = false,
  accept = ALLOWED_IMAGE_TYPES.join(','),
  placeholder,
  className = '',
}: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<FileWithProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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
        allowedTypes: accept.split(','),
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

    // Upload files
    for (const upload of newUploads) {
      try {
        setUploading(prev =>
          prev.map(u => u.id === upload.id ? { ...u, status: 'uploading', progress: 10 } : u)
        );

        const result = await uploadToCloudinary(upload.file, {
          folder,
          tags: ['quickshop', 'product'],
        });

        setUploading(prev =>
          prev.map(u => u.id === upload.id ? { ...u, status: 'success', progress: 100, result } : u)
        );

        // Add to value
        const newMedia: UploadedMedia = {
          id: result.public_id,
          url: result.secure_url,
          publicId: result.public_id,
          filename: result.original_filename,
          size: result.bytes,
          width: result.width,
          height: result.height,
          isPrimary: value.length === 0 && showPrimary,
        };

        onChange([...value, newMedia]);
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

    // Clear completed uploads after a delay
    setTimeout(() => {
      setUploading(prev => prev.filter(u => u.status !== 'success'));
    }, 1000);
  }, [disabled, maxFiles, value, multiple, accept, folder, showPrimary, onChange]);

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

  // Remove file
  const handleRemove = useCallback((id: string) => {
    const newValue = value.filter(v => v.id !== id);
    
    // If removed item was primary and there are others, make first one primary
    if (showPrimary && value.find(v => v.id === id)?.isPrimary && newValue.length > 0) {
      newValue[0].isPrimary = true;
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

  return (
    <div className={`media-uploader ${className}`} dir="rtl">
      {/* Gallery of uploaded files */}
      {value.length > 0 && (
        <div className={`grid gap-3 mb-4 ${compact ? 'grid-cols-6' : 'grid-cols-4'}`}>
          {value.map((media, index) => (
            <div
              key={media.id}
              className="relative group"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', index.toString());
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                handleReorder(fromIndex, index);
              }}
            >
              <div 
                className={`relative overflow-hidden rounded-lg border-2 transition-all cursor-move
                  ${media.isPrimary ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}
                style={{ paddingBottom: getAspectRatioPadding() }}
              >
                <img
                  src={media.url}
                  alt={media.filename || ''}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {showPrimary && !media.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(media.id)}
                      className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                      title="הגדר כראשית"
                    >
                      <StarIcon />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(media.id)}
                    className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                    title="הסר"
                  >
                    <TrashIcon />
                  </button>
                </div>

                {/* Primary badge */}
                {showPrimary && media.isPrimary && (
                  <span className="absolute top-1.5 right-1.5 px-2 py-0.5 bg-blue-500 text-white text-[10px] font-medium rounded shadow-sm">
                    ראשית
                  </span>
                )}
              </div>
            </div>
          ))}
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
            accept={accept}
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

      {/* URL input fallback */}
      {canAddMore && !compact && (
        <div className="mt-4">
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

export default MediaUploader;


