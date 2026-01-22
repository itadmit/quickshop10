/**
 * Cloudinary Integration for QuickShop
 * 
 * This module provides a complete integration with Cloudinary for:
 * - Direct browser uploads (unsigned)
 * - Server-side uploads (signed)
 * - Image transformations
 * - Automatic optimization
 */

// ===== Configuration =====

export const cloudinaryConfig = {
  // תמיכה בשני הפורמטים של ENV variables
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.CLOUDINARY_API_KEY || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'quickshop_unsigned',
};

// ===== Types =====

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  resource_type: 'image' | 'video' | 'raw';
  created_at: string;
  original_filename: string;
  folder?: string;
  thumbnail_url?: string;
  media_id?: string; // DB record ID from /api/upload
}

export interface UploadOptions {
  folder?: string;
  publicId?: string;
  tags?: string[];
  transformation?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  maxFileSize?: number; // in bytes
  allowedFormats?: string[];
}

export interface CloudinaryError {
  message: string;
  http_code?: number;
}

// ===== Client-Side Upload URL =====

export function getUploadUrl(): string {
  return `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`;
}

// ===== Client-Side Upload (Unsigned) =====

export async function uploadToCloudinary(
  file: File,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  // Debug: בדיקת קונפיגורציה
  console.log('Cloudinary Config Check:', {
    cloudName: cloudinaryConfig.cloudName || 'MISSING!',
    uploadPreset: cloudinaryConfig.uploadPreset || 'MISSING!',
    hasCloudName: Boolean(cloudinaryConfig.cloudName),
    hasPreset: Boolean(cloudinaryConfig.uploadPreset),
  });

  if (!cloudinaryConfig.cloudName) {
    throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME חסר ב-.env');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);
  
  if (options.folder) {
    formData.append('folder', options.folder);
  }
  
  if (options.publicId) {
    formData.append('public_id', options.publicId);
  }
  
  if (options.tags && options.tags.length > 0) {
    formData.append('tags', options.tags.join(','));
  }

  const response = await fetch(getUploadUrl(), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Cloudinary Upload Error:', {
      status: response.status,
      error,
      cloudName: cloudinaryConfig.cloudName,
      uploadPreset: cloudinaryConfig.uploadPreset,
    });
    throw new Error(error.error?.message || error.message || 'Failed to upload to Cloudinary');
  }

  return response.json();
}

// ===== Server-Side Upload (Signed) =====
// Use this for server-side uploads - doesn't require upload preset

export async function uploadToCloudinarySigned(
  file: File | Buffer,
  options: UploadOptions & { filename?: string } = {}
): Promise<CloudinaryUploadResult> {
  const crypto = await import('crypto');
  
  if (!cloudinaryConfig.cloudName || !cloudinaryConfig.apiKey || !cloudinaryConfig.apiSecret) {
    console.error('Cloudinary credentials missing:', {
      hasCloudName: Boolean(cloudinaryConfig.cloudName),
      hasApiKey: Boolean(cloudinaryConfig.apiKey),
      hasApiSecret: Boolean(cloudinaryConfig.apiSecret),
    });
    throw new Error('Cloudinary credentials missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  }

  const timestamp = Math.round(Date.now() / 1000);
  const resourceType = options.resourceType || 'auto';
  
  // Build params for signature
  const params: Record<string, string> = {
    timestamp: timestamp.toString(),
  };
  
  if (options.folder) {
    params.folder = options.folder;
  }
  
  if (options.publicId) {
    params.public_id = options.publicId;
  }
  
  if (options.tags && options.tags.length > 0) {
    params.tags = options.tags.join(',');
  }
  
  // Sort and create signature string
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  const signature = crypto
    .createHash('sha1')
    .update(sortedParams + cloudinaryConfig.apiSecret)
    .digest('hex');
  
  // Create form data
  const formData = new FormData();
  
  if (file instanceof Buffer) {
    // Convert Buffer to Blob for FormData
    const blob = new Blob([file]);
    formData.append('file', blob, options.filename || 'upload');
  } else {
    formData.append('file', file);
  }
  
  formData.append('api_key', cloudinaryConfig.apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  
  // Add other params
  Object.entries(params).forEach(([key, value]) => {
    if (key !== 'timestamp') {
      formData.append(key, value);
    }
  });
  
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType}/upload`;
  
  console.log('🎬 Uploading to Cloudinary (signed):', {
    cloudName: cloudinaryConfig.cloudName,
    resourceType,
    folder: options.folder,
  });
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Cloudinary Signed Upload Error:', {
      status: response.status,
      error,
    });
    throw new Error(error.error?.message || error.message || 'Failed to upload to Cloudinary');
  }

  const result = await response.json();
  console.log('✅ Cloudinary upload successful:', result.secure_url);
  return result;
}

// ===== Image URL Transformations =====

export interface TransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'pad' | 'crop';
  quality?: 'auto' | 'auto:low' | 'auto:eco' | 'auto:good' | 'auto:best' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
  blur?: number;
  radius?: number | 'max';
  effect?: string;
  aspectRatio?: string;
}

export function getOptimizedUrl(
  publicId: string,
  options: TransformOptions = {}
): string {
  const transforms: string[] = [];
  
  // Default optimizations
  transforms.push('f_auto'); // Auto format (webp, avif, etc.)
  transforms.push('q_auto'); // Auto quality
  
  if (options.width) {
    transforms.push(`w_${options.width}`);
  }
  
  if (options.height) {
    transforms.push(`h_${options.height}`);
  }
  
  if (options.crop) {
    transforms.push(`c_${options.crop}`);
  }
  
  if (options.gravity) {
    transforms.push(`g_${options.gravity}`);
  }
  
  if (options.quality && options.quality !== 'auto') {
    transforms.push(`q_${options.quality}`);
  }
  
  if (options.format && options.format !== 'auto') {
    transforms.push(`f_${options.format}`);
  }
  
  if (options.blur) {
    transforms.push(`e_blur:${options.blur}`);
  }
  
  if (options.radius) {
    transforms.push(`r_${options.radius}`);
  }
  
  if (options.aspectRatio) {
    transforms.push(`ar_${options.aspectRatio}`);
  }
  
  if (options.effect) {
    transforms.push(`e_${options.effect}`);
  }
  
  const transformString = transforms.join(',');
  
  return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${transformString}/${publicId}`;
}

// ===== Preset URL Generators =====

export function getThumbnailUrl(publicId: string, size: number = 150): string {
  return getOptimizedUrl(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    gravity: 'auto',
  });
}

export function getProductImageUrl(publicId: string, width: number = 800): string {
  return getOptimizedUrl(publicId, {
    width,
    crop: 'fit',
  });
}

export function getBannerUrl(publicId: string, width: number = 1920): string {
  return getOptimizedUrl(publicId, {
    width,
    crop: 'fill',
    gravity: 'auto',
  });
}

export function getLogoUrl(publicId: string, height: number = 60): string {
  return getOptimizedUrl(publicId, {
    height,
    crop: 'fit',
  });
}

// ===== Extract Public ID from Cloudinary URL =====

export function extractPublicId(url: string): string | null {
  if (!url.includes('cloudinary.com')) {
    return null;
  }
  
  // Match pattern: /upload/v{version}/{public_id}.{format}
  // or: /upload/{transformations}/{public_id}.{format}
  const match = url.match(/\/upload\/(?:v\d+\/)?(?:[^/]+\/)*(.+?)(?:\.[a-z]+)?$/i);
  
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
}

// ===== Check if URL is Cloudinary =====

export function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
}

// ===== Get optimized version of any image URL =====

export function optimizeImageUrl(url: string, options: TransformOptions = {}): string {
  // If it's already a Cloudinary URL, transform it
  if (isCloudinaryUrl(url)) {
    const publicId = extractPublicId(url);
    if (publicId) {
      return getOptimizedUrl(publicId, options);
    }
  }
  
  // For non-Cloudinary URLs, use Cloudinary's fetch feature
  // This allows Cloudinary to optimize any external image
  const transforms: string[] = ['f_auto', 'q_auto'];
  
  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.crop) transforms.push(`c_${options.crop}`);
  
  const transformString = transforms.join(',');
  
  return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/fetch/${transformString}/${encodeURIComponent(url)}`;
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

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

// ===== Format file size for display =====

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// =============================================
// ⚡ PERFORMANCE OPTIMIZATIONS - CDN & SPEED
// =============================================

/**
 * Get responsive image srcset for different screen sizes
 * Supports: 320, 640, 768, 1024, 1280, 1920 widths
 * 
 * Usage in HTML:
 * <img srcset={getResponsiveSrcSet(publicId)} sizes="(max-width: 768px) 100vw, 50vw" />
 */
export function getResponsiveSrcSet(
  publicId: string,
  options: Omit<TransformOptions, 'width'> = {}
): string {
  const widths = [320, 640, 768, 1024, 1280, 1920];
  
  return widths
    .map(w => `${getOptimizedUrl(publicId, { ...options, width: w })} ${w}w`)
    .join(', ');
}

/**
 * Get blur placeholder URL for lazy loading (LQIP - Low Quality Image Placeholder)
 * Creates a tiny blurred version for instant loading
 */
export function getBlurPlaceholder(publicId: string): string {
  return getOptimizedUrl(publicId, {
    width: 20,
    blur: 1000,
    quality: 'auto:low' as any,
  });
}

/**
 * Get base64 blur placeholder for SSR (Server-Side Rendering)
 * Can be used as blurDataURL in next/image
 */
export async function getBlurDataUrl(publicId: string): Promise<string> {
  const url = getBlurPlaceholder(publicId);
  
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  } catch {
    // Return transparent 1x1 pixel as fallback
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }
}

/**
 * Generate next/image loader configuration for Cloudinary
 * Use with next.config.js images.loader = 'custom'
 */
export function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // If it's already a full Cloudinary URL with public ID
  if (isCloudinaryUrl(src)) {
    const publicId = extractPublicId(src);
    if (publicId) {
      return getOptimizedUrl(publicId, {
        width,
        quality: quality ? (quality as any) : 'auto',
      });
    }
  }
  
  // If it's just a public ID
  if (!src.startsWith('http')) {
    return getOptimizedUrl(src, {
      width,
      quality: quality ? (quality as any) : 'auto',
    });
  }
  
  // For external URLs, use fetch
  return optimizeImageUrl(src, { width });
}

/**
 * Get optimized image props for next/image component
 * Includes all performance optimizations
 */
export interface OptimizedImageProps {
  src: string;
  blurDataURL?: string;
  srcSet?: string;
  sizes?: string;
}

export function getOptimizedImageProps(
  urlOrPublicId: string,
  options: {
    width?: number;
    sizes?: string;
  } = {}
): OptimizedImageProps {
  const isCloudinary = isCloudinaryUrl(urlOrPublicId);
  const publicId = isCloudinary ? extractPublicId(urlOrPublicId) : null;
  
  if (publicId) {
    return {
      src: getOptimizedUrl(publicId, { width: options.width }),
      srcSet: getResponsiveSrcSet(publicId),
      sizes: options.sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    };
  }
  
  // Non-Cloudinary URL - use fetch optimization
  return {
    src: options.width 
      ? optimizeImageUrl(urlOrPublicId, { width: options.width })
      : urlOrPublicId,
  };
}

// =============================================
// 🌐 CDN CONFIGURATION
// =============================================

/**
 * Cloudinary CDN Features:
 * 
 * 1. Global CDN - 200+ PoPs worldwide
 *    - res.cloudinary.com automatically routes to nearest edge
 * 
 * 2. Auto Format (f_auto)
 *    - Serves WebP to Chrome/Firefox
 *    - Serves AVIF to supported browsers
 *    - Falls back to JPEG/PNG for others
 * 
 * 3. Auto Quality (q_auto)
 *    - Analyzes image content
 *    - Applies optimal compression
 *    - Reduces size by 40-80% without visible loss
 * 
 * 4. Responsive Delivery
 *    - Serves correct size for device
 *    - Prevents oversized image downloads
 * 
 * 5. Lazy Loading Support
 *    - LQIP (Low Quality Image Placeholder)
 *    - Blur-up effect
 * 
 * 6. HTTP/2 & HTTP/3
 *    - Multiplexed connections
 *    - Faster parallel downloads
 * 
 * 7. Caching
 *    - Edge caching with long TTL
 *    - Browser caching headers
 */

export const CDN_CONFIG = {
  // Base CDN URL
  baseUrl: `https://res.cloudinary.com/${cloudinaryConfig.cloudName}`,
  
  // Default transformations for speed
  defaultTransforms: 'f_auto,q_auto',
  
  // Responsive breakpoints
  breakpoints: [320, 640, 768, 1024, 1280, 1920],
  
  // Quality presets
  quality: {
    thumbnail: 'q_auto:low',
    preview: 'q_auto:eco',
    standard: 'q_auto:good',
    high: 'q_auto:best',
  },
  
  // Delivery type
  deliveryType: 'upload', // or 'fetch' for external URLs
};

/**
 * Check if Cloudinary is properly configured
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset);
}

// =============================================
// 🎥 VIDEO THUMBNAIL GENERATION (DYNAMIC)
// =============================================

/**
 * Generate thumbnail URL from video URL
 * Cloudinary automatically extracts first frame as image
 * 
 * Example:
 * Video:     https://res.cloudinary.com/xxx/video/upload/v123/folder/file.mp4
 * Thumbnail: https://res.cloudinary.com/xxx/video/upload/so_0,f_jpg,q_auto/v123/folder/file.mp4
 * 
 * @param videoUrl - Full Cloudinary video URL
 * @param options - Transformation options
 */
export function getVideoThumbnailUrl(
  videoUrl: string,
  options: {
    width?: number;
    height?: number;
    startOffset?: number; // Frame to capture (default: 0 = first frame)
  } = {}
): string {
  if (!videoUrl || !isCloudinaryUrl(videoUrl)) {
    return videoUrl; // Return as-is if not Cloudinary
  }

  // Build transformation string
  const transforms: string[] = [];
  transforms.push(`so_${options.startOffset || 0}`); // Start offset (frame)
  transforms.push('f_jpg'); // Output as JPEG
  transforms.push('q_auto'); // Auto quality
  
  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  
  const transformString = transforms.join(',');
  
  // Insert transformation into URL
  // Pattern: /video/upload/v123/... -> /video/upload/TRANSFORMS/v123/...
  return videoUrl.replace(
    /\/video\/upload\//,
    `/video/upload/${transformString}/`
  );
}

/**
 * Check if a URL is a video based on extension or resource type
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  
  // Check by extension
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
    return true;
  }
  
  // Check Cloudinary video resource type
  if (url.includes('/video/upload/')) {
    return true;
  }
  
  return false;
}

/**
 * Get CDN status and stats (for debugging)
 */
export function getCdnInfo() {
  return {
    configured: isCloudinaryConfigured(),
    cloudName: cloudinaryConfig.cloudName || 'NOT_SET',
    cdnUrl: CDN_CONFIG.baseUrl,
    features: [
      '✅ Auto Format (WebP/AVIF)',
      '✅ Auto Quality Compression',
      '✅ Global CDN (200+ PoPs)',
      '✅ Responsive Images',
      '✅ Lazy Load Placeholders',
      '✅ HTTP/2 & HTTP/3',
    ],
  };
}

