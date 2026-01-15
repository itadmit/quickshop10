/**
 * Vercel Blob Integration for QuickShop
 * 
 * This module provides utilities for working with Vercel Blob storage.
 * Use this instead of Cloudinary for cost-effective image storage.
 * 
 * Note: Vercel Blob is for STORAGE only. Image optimization is handled by:
 * - next/image component (automatic WebP/AVIF, resizing, quality)
 * - Vercel's built-in Image Optimization (included in Pro plan)
 */

// ===== Types =====

export interface BlobUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  thumbnail_url: string;
  format: string;
  width: number | null;
  height: number | null;
  bytes: number;
  resource_type: 'image' | 'video' | 'raw';
  created_at: string;
  original_filename: string;
  folder: string;
  media_id?: string;
  blob_pathname?: string;
  blob_contentType?: string;
}

export interface UploadOptions {
  folder?: string;
  storeId?: string;
  skipMediaRecord?: boolean;
}

// ===== Client-Side Upload =====

export async function uploadToBlob(
  file: File,
  options: UploadOptions = {}
): Promise<BlobUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (options.folder) {
    formData.append('folder', options.folder);
  }
  
  if (options.storeId) {
    formData.append('storeId', options.storeId);
  }
  
  if (options.skipMediaRecord) {
    formData.append('skipMediaRecord', 'true');
  }

  const response = await fetch('/api/upload-blob', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload file');
  }

  return response.json();
}

// ===== Delete Blob =====

export async function deleteBlob(url: string): Promise<void> {
  const response = await fetch('/api/upload-blob', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete file');
  }
}

// ===== URL Helpers =====

/**
 * Check if a URL is a Vercel Blob URL
 */
export function isBlobUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('.public.blob.vercel-storage.com') || 
         url.includes('.blob.vercel-storage.com');
}

/**
 * Check if a URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
}

/**
 * Determine the storage provider from a URL
 */
export function getStorageProvider(url: string): 'blob' | 'cloudinary' | 'external' {
  if (isBlobUrl(url)) return 'blob';
  if (isCloudinaryUrl(url)) return 'cloudinary';
  return 'external';
}

// ===== Validation Helpers =====

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml',
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function validateFile(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const maxSize = options.maxSize || MAX_FILE_SIZE;
  const allowedTypes = options.allowedTypes || [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `הקובץ גדול מדי. גודל מקסימלי: ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `סוג קובץ לא נתמך. סוגים מותרים: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`,
    };
  }
  
  return { valid: true };
}

// ===== Format Helpers =====

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if URL is a video
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
}

