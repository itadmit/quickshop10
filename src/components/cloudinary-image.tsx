/**
 * CloudinaryImage - Optimized Image Component
 * 
 * ⚡ Performance Features:
 * - Uses next/image for automatic optimization
 * - Cloudinary CDN with global edge caching
 * - Auto format (WebP/AVIF based on browser)
 * - Auto quality compression
 * - Responsive srcset generation
 * - Blur-up placeholder for lazy loading
 * - Proper aspect ratio to prevent CLS
 */

import Image, { ImageProps } from 'next/image';
import {
  cloudinaryLoader,
  isCloudinaryUrl,
  extractPublicId,
  getOptimizedUrl,
  getBlurPlaceholder,
  cloudinaryConfig,
} from '@/lib/cloudinary';

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
  const isConfigured = Boolean(cloudinaryConfig.cloudName);
  
  // Get optimized source URL
  const getImageSrc = (): string => {
    if (!isConfigured) {
      // Fallback to original URL if Cloudinary not configured
      return src;
    }
    
    // If it's a Cloudinary URL, extract and transform
    if (isCloudinaryUrl(src)) {
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
    
    // If it's just a public ID (no http)
    if (!src.startsWith('http')) {
      return getOptimizedUrl(src, {
        width: typeof width === 'number' ? width : undefined,
        height: typeof height === 'number' ? height : undefined,
        crop,
        gravity,
      });
    }
    
    // External URL - return as-is (could use fetch optimization)
    return src;
  };

  // Get blur placeholder URL
  const getPlaceholder = (): string | undefined => {
    if (!showPlaceholder || !isConfigured) return undefined;
    
    const publicId = isCloudinaryUrl(src) 
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
    
    if (isCloudinaryUrl(src)) {
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


