'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import {
  validateFile,
  formatFileSize,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_FILE_SIZE,
} from '@/lib/cloudinary';

interface UploadFormProps {
  storeId: string;
  slug: string;
}

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// Max file size: 15MB
const MAX_UPLOAD_SIZE = 15 * 1024 * 1024;
// Threshold for using client-side upload - only for VIDEOS over 4MB
// Images always go through server for WebP optimization
const CLIENT_UPLOAD_THRESHOLD = 4 * 1024 * 1024;

export function UploadForm({ storeId, slug }: UploadFormProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;

    // Create upload entries
    const newUploads: FileUpload[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    // Validate files
    const validUploads: FileUpload[] = [];
    for (const fileUpload of newUploads) {
      // Check max size (15MB)
      if (fileUpload.file.size > MAX_UPLOAD_SIZE) {
        fileUpload.status = 'error';
        fileUpload.error = 'קובץ גדול מדי. מקסימום 15MB';
        validUploads.push(fileUpload);
        continue;
      }
      
      const validation = validateFile(fileUpload.file, {
        maxSize: MAX_UPLOAD_SIZE,
        allowedTypes: [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES],
      });

      if (!validation.valid) {
        fileUpload.status = 'error';
        fileUpload.error = validation.error;
      }
      validUploads.push(fileUpload);
    }

    setUploads(prev => [...prev, ...validUploads]);

    // Upload valid files
    for (const fileUpload of validUploads) {
      if (fileUpload.status === 'error') continue;

      try {
        setUploads(prev =>
          prev.map(u => u.id === fileUpload.id ? { ...u, status: 'uploading', progress: 10 } : u)
        );

        const cloudinaryFolder = `quickshop/stores/${slug}`;
        const isVideo = fileUpload.file.type.startsWith('video/');
        const isLargeVideo = isVideo && fileUpload.file.size > CLIENT_UPLOAD_THRESHOLD;

        if (isLargeVideo) {
          // Use client-side upload ONLY for large videos
          console.log(`[Upload] Using client upload for large video: ${fileUpload.file.name} (${formatFileSize(fileUpload.file.size)})`);
          
          const extension = fileUpload.file.name.split('.').pop() || 'mp4';
          const uniqueId = crypto.randomUUID().slice(0, 10);
          const pathname = `${cloudinaryFolder}/${uniqueId}.${extension}`;
          
          await upload(pathname, fileUpload.file, {
            access: 'public',
            handleUploadUrl: '/api/upload-blob/client',
            clientPayload: JSON.stringify({
              storeId,
              folder: cloudinaryFolder,
            }),
            onUploadProgress: (progress) => {
              setUploads(prev =>
                prev.map(u => u.id === fileUpload.id ? { ...u, progress: Math.round(progress.percentage) } : u)
              );
            },
          });
        } else {
          // Use server-side upload for images (with WebP optimization) and small videos
          setUploads(prev =>
            prev.map(u => u.id === fileUpload.id ? { ...u, progress: 30 } : u)
          );

          const formData = new FormData();
          formData.append('file', fileUpload.file);
          formData.append('folder', cloudinaryFolder);
          formData.append('tags', ['quickshop', 'media-library', slug].join(','));
          formData.append('storeId', storeId);
          
          const response = await fetch('/api/upload-blob', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            let errorMessage = 'העלאה נכשלה';
            try {
              const contentType = response.headers.get('content-type');
              if (contentType?.includes('application/json')) {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
              } else {
                const text = await response.text();
                if (text.includes('Request Entity Too Large') || response.status === 413) {
                  errorMessage = 'קובץ גדול מדי לעיבוד בשרת. נסה קובץ קטן יותר.';
                } else if (text.includes('timeout') || text.includes('TIMEOUT')) {
                  errorMessage = 'פג הזמן - נסה שוב';
                } else {
                  errorMessage = text.substring(0, 100) || errorMessage;
                }
              }
            } catch {
              if (response.status === 413) {
                errorMessage = 'קובץ גדול מדי';
              } else {
                errorMessage = response.statusText || errorMessage;
              }
            }
            throw new Error(errorMessage);
          }
        }

        setUploads(prev =>
          prev.map(u => u.id === fileUpload.id ? { ...u, status: 'success', progress: 100 } : u)
        );
      } catch (error) {
        console.error('Upload failed:', error);
        setUploads(prev =>
          prev.map(u => u.id === fileUpload.id ? { 
            ...u, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'העלאה נכשלה' 
          } : u)
        );
      }
    }

    // Refresh the page to show new uploads
    startTransition(() => {
      router.refresh();
    });

    // Clear successful uploads after delay
    setTimeout(() => {
      setUploads(prev => prev.filter(u => u.status !== 'success'));
    }, 2000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const isUploading = uploads.some(u => u.status === 'uploading');

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center gap-3">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors font-medium text-sm ${
            dragActive
              ? 'bg-blue-100 border-2 border-blue-400 border-dashed text-blue-700'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
          {isUploading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              מעלה...
            </>
          ) : dragActive ? (
            'שחרר לעליה'
          ) : (
            '+ העלאת קבצים'
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map(upload => (
            <div 
              key={upload.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                upload.status === 'error' 
                  ? 'border-red-200 bg-red-50' 
                  : upload.status === 'success'
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="w-10 h-10 rounded bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                {upload.file.type.startsWith('image/') ? (
                  <img 
                    src={URL.createObjectURL(upload.file)} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{upload.file.name}</p>
                <p className="text-xs text-gray-500">
                  {upload.status === 'uploading' && 'מעלה...'}
                  {upload.status === 'success' && '✓ הועלה בהצלחה'}
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
              {upload.status === 'error' && (
                <button
                  onClick={() => setUploads(prev => prev.filter(u => u.id !== upload.id))}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
