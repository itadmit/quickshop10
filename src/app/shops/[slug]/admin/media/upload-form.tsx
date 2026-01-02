'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface UploadFormProps {
  storeId: string;
  slug: string;
  currentFolder?: string;
}

export function UploadForm({ storeId, slug, currentFolder }: UploadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dragActive, setDragActive] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [folder, setFolder] = useState(currentFolder || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;

    startTransition(async () => {
      // In a real implementation, this would upload to a storage service
      // For now, we'll simulate the upload and create media records
      
      for (const file of Array.from(files)) {
        // Create a placeholder URL (in production, upload to S3/Cloudinary/etc)
        const fakeUrl = `/api/placeholder/${file.name}`;
        
        // Create media record
        const formData = new FormData();
        formData.append('storeId', storeId);
        formData.append('filename', file.name);
        formData.append('originalFilename', file.name);
        formData.append('mimeType', file.type);
        formData.append('size', file.size.toString());
        formData.append('url', fakeUrl);
        if (folder) formData.append('folder', folder);

        // In production, call your upload API
        // await fetch('/api/media/upload', { method: 'POST', body: formData });
      }

      router.refresh();
    });
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

  return (
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
        {isPending ? (
          'מעלה...'
        ) : dragActive ? (
          'שחרר לעליה'
        ) : (
          '+ העלאת קבצים'
        )}
      </div>
    </div>
  );
}

