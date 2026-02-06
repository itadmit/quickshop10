/**
 * Image Uploader Component
 * Uses QuickShop's Vercel Blob upload endpoint instead of base64
 */
'use client';

import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

interface ImageUploaderProps {
  onUpload: (url: string) => void;
  storeId?: string;
}

export function ImageUploader({ onUpload, storeId }: ImageUploaderProps) {
  const [loading, setLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'app-builder');
      if (storeId) formData.append('storeId', storeId);

      const res = await fetch('/api/upload-blob', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await res.json();
      onUpload(data.secure_url || data.url);
    } catch (err) {
      alert('Upload failed: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div style={styles.container}>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => fileInput.current?.click()}
        disabled={loading}
        style={styles.button}
      >
        <Upload size={12} />
        {loading ? 'Uploading...' : 'Upload Image'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: 4,
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 8px',
    border: '1px solid #ddd',
    background: '#fafafa',
    cursor: 'pointer',
    fontSize: 11,
    letterSpacing: 0.5,
  },
};
