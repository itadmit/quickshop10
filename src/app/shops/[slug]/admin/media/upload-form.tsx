'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  uploadToCloudinary,
  validateFile,
  formatFileSize,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_FILE_SIZE,
  CloudinaryUploadResult,
} from '@/lib/cloudinary';
import { createMediaRecord } from './actions';

interface UploadFormProps {
  storeId: string;
  slug: string;
  currentFolder?: string;
}

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function UploadForm({ storeId, slug, currentFolder }: UploadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dragActive, setDragActive] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [folder, setFolder] = useState(currentFolder || '');
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
    for (const upload of newUploads) {
      const validation = validateFile(upload.file, {
        maxSize: MAX_FILE_SIZE,
        allowedTypes: [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES],
      });

      if (!validation.valid) {
        upload.status = 'error';
        upload.error = validation.error;
      }
      validUploads.push(upload);
    }

    setUploads(prev => [...prev, ...validUploads]);

    // Upload valid files
    for (const upload of validUploads) {
      if (upload.status === 'error') continue;

      try {
        setUploads(prev =>
          prev.map(u => u.id === upload.id ? { ...u, status: 'uploading', progress: 20 } : u)
        );

        // Upload to Cloudinary
        const cloudinaryFolder = folder 
          ? `quickshop/stores/${slug}/${folder}`
          : `quickshop/stores/${slug}`;

        const result = await uploadToCloudinary(upload.file, {
          folder: cloudinaryFolder,
          tags: ['quickshop', 'media-library', slug],
        });

        setUploads(prev =>
          prev.map(u => u.id === upload.id ? { ...u, progress: 80 } : u)
        );

        // Create media record in database
        await createMediaRecord({
          storeId,
          filename: result.public_id.split('/').pop() || result.original_filename,
          originalFilename: result.original_filename,
          mimeType: `${result.resource_type}/${result.format}`,
          size: result.bytes,
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          folder: folder || undefined,
        });

        setUploads(prev =>
          prev.map(u => u.id === upload.id ? { ...u, status: 'success', progress: 100 } : u)
        );
      } catch (error) {
        console.error('Upload failed:', error);
        setUploads(prev =>
          prev.map(u => u.id === upload.id ? { 
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
      {/* Folder and Upload Button */}
      <div className="flex items-center gap-3">
        {showFolderInput && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="שם תיקייה"
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
            />
            <button
              onClick={() => setShowFolderInput(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        )}
        
        {!showFolderInput && (
          <button
            onClick={() => setShowFolderInput(true)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            + תיקייה
          </button>
        )}

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
