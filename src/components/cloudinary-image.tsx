/**
 * OptimizedImage - Unified Image Component
 * 
 * ⚡ Performance Features:
 * - Uses next/image for automatic optimization
 * - Supports both Vercel Blob and Cloudinary URLs
 * - Auto format (WebP/AVIF based on browser)
 * - Auto quality compression
 * - Responsive srcset generation
 * - Blur-up placeholder for lazy loading
 * - Proper aspect ratio to prevent CLS
 * 
 * 🔄 Migration: Works with both storage providers during transition
 */

import Image, { ImageProps } from 'next/image';
import {
  cloudinaryLoader,
  isCloudinaryUrl as isCloudinaryUrlOriginal,
  extractPublicId,
  getOptimizedUrl,
  getBlurPlaceholder,
  cloudinaryConfig,
} from '@/lib/cloudinary';
import { isBlobUrl, getStorageProvider } from '@/lib/blob';

export interface CloudinaryImageProps extends Omit<ImageProps, 'loader' | 'src'> {
  /** Image source - can be URL or Cloudinary public ID */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Width of the image */
  width?: number;
  /** Height of the image */
  height?: number;
  /** Fill the container (requires parent position: relative) */
  fill?: boolean;
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** Priority loading (for above-the-fold images) */
  priority?: boolean;
  /** Quality override (1-100 or 'auto') */
  quality?: number;
  /** Custom className */
  className?: string;
  /** Crop mode */
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'pad';
  /** Gravity for crop */
  gravity?: 'auto' | 'face' | 'center';
  /** Show blur placeholder while loading */
  showPlaceholder?: boolean;
}

/**
 * Optimized Cloudinary Image Component
 * 
 * @example
 * // With Cloudinary public ID
 * <CloudinaryImage 
 *   src="quickshop/products/shirt-123" 
 *   alt="חולצה"
 *   width={400}
 *   height={400}
 * />
 * 
 * @example
 * // With full URL (auto-detects Cloudinary)
 * <CloudinaryImage 
 *   src="https://res.cloudinary.com/xxx/image/upload/v123/product.jpg"
 *   alt="מוצר"
 *   fill
 *   sizes="(max-width: 768px) 100vw, 50vw"
 * />
 * 
 * @example
 * // Priority loading for hero images
 * <CloudinaryImage 
 *   src={heroImage}
 *   alt="באנר ראשי"
 *   fill
 *   priority
 *   quality={90}
 * />
 */
export function CloudinaryImage({
  src,
  alt,
  width,
  height,
  fill,
  sizes,
  priority = false,
  quality,
  className,
  crop = 'fill',
  gravity = 'auto',
  showPlaceholder = true,
  ...props
}: CloudinaryImageProps) {
  // Check if Cloudinary is configured
  const isCloudinaryConfigured = Boolean(cloudinaryConfig.cloudName);
  
  // Determine storage provider
  const storageProvider = getStorageProvider(src);
  
  // Get optimized source URL
  const getImageSrc = (): string => {
    // Vercel Blob URLs - use directly with next/image optimization
    if (storageProvider === 'blob') {
      return src; // next/image will handle optimization
    }
    
    // Cloudinary URLs - use Cloudinary transformations
    if (storageProvider === 'cloudinary' && isCloudinaryConfigured) {
      const publicId = extractPublicId(src);
      if (publicId) {
        return getOptimizedUrl(publicId, {
          width: typeof width === 'number' ? width : undefined,
          height: typeof height === 'number' ? height : undefined,
          crop,
          gravity,
        });
      }
    }
    
    // If it's just a public ID (no http) - assume Cloudinary
    if (!src.startsWith('http') && isCloudinaryConfigured) {
      return getOptimizedUrl(src, {
        width: typeof width === 'number' ? width : undefined,
        height: typeof height === 'number' ? height : undefined,
        crop,
        gravity,
      });
    }
    
    // External URL - return as-is (next/image will optimize)
    return src;
  };

  // Get blur placeholder URL (only for Cloudinary)
  const getPlaceholder = (): string | undefined => {
    if (!showPlaceholder) return undefined;
    
    // For Blob URLs, next/image handles placeholders automatically
    if (storageProvider === 'blob') return undefined;
    
    if (!isCloudinaryConfigured) return undefined;
    
    const publicId = isCloudinaryUrlOriginal(src) 
      ? extractPublicId(src) 
      : (!src.startsWith('http') ? src : null);
    
    if (publicId) {
      return getBlurPlaceholder(publicId);
    }
    
    return undefined;
  };

  const imageSrc = getImageSrc();
  const blurUrl = getPlaceholder();

  // Default sizes for responsive images
  const defaultSizes = fill 
    ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
    : undefined;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={fill ? undefined : (width || 800)}
      height={fill ? undefined : (height || 800)}
      fill={fill}
      sizes={sizes || defaultSizes}
      priority={priority}
      quality={quality || 80}
      className={className}
      placeholder={blurUrl ? 'blur' : 'empty'}
      blurDataURL={blurUrl}
      loading={priority ? 'eager' : 'lazy'}
      {...props}
    />
  );
}

// Export an alias for new code
export const OptimizedImage = CloudinaryImage;

/**
 * Cloudinary Background Image Component
 * For CSS background images with optimization
 */
export function CloudinaryBackground({
  src,
  className = '',
  children,
  overlay = false,
  overlayOpacity = 0.5,
}: {
  src: string;
  className?: string;
  children?: React.ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
}) {
  const isConfigured = Boolean(cloudinaryConfig.cloudName);
  
  const getBackgroundUrl = (): string => {
    if (!isConfigured) return src;
    
    if (isCloudinaryUrlOriginal(src)) {
      const publicId = extractPublicId(src);
      if (publicId) {
        return getOptimizedUrl(publicId, { width: 1920 });
      }
    }
    
    if (!src.startsWith('http')) {
      return getOptimizedUrl(src, { width: 1920 });
    }
    
    return src;
  };

  return (
    <div
      className={`relative bg-cover bg-center bg-no-repeat ${className}`}
      style={{ backgroundImage: `url(${getBackgroundUrl()})` }}
    >
      {overlay && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default CloudinaryImage;


