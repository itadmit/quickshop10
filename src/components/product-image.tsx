'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  sizes?: string;
}

// Default placeholder SVG as data URI - image icon centered in gray background
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Cg transform='translate(152, 152)' fill='none' stroke='%23d1d5db' stroke-width='4'%3E%3Crect x='12' y='12' width='72' height='72' rx='8'/%3E%3Ccircle cx='34' cy='34' r='6'/%3E%3Cpolyline points='84 60 64 40 20 84'/%3E%3C/g%3E%3C/svg%3E`;

// Check if URL is external (not from our domains)
function isExternalUrl(url: string): boolean {
  if (!url) return false;
  // Allow Vercel Blob, Cloudinary, and other known CDNs
  const allowedDomains = [
    'blob.vercel-storage.com',
    'res.cloudinary.com',
    'images.unsplash.com',
    'plus.unsplash.com',
    'cdn.shopify.com',
  ];
  
  try {
    const urlObj = new URL(url);
    return !allowedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

export function ProductImage({ 
  src, 
  alt, 
  className = '', 
  loading = 'lazy',
  priority = false,
  // Default sizes optimized for product cards:
  // - Mobile: 50vw (2 columns)
  // - Tablet: 33vw (3 columns)
  // - Desktop: 25vw (4 columns)
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
}: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src || PLACEHOLDER_SVG);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Update imgSrc when src prop changes
  useEffect(() => {
    if (src) {
      setImgSrc(src);
      setHasError(false);
      setIsLoaded(false); // Reset loaded state for new image
    } else {
      setImgSrc(PLACEHOLDER_SVG);
    }
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(PLACEHOLDER_SVG);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Blur-to-focus animation classes
  const blurClasses = isLoaded 
    ? 'blur-0 scale-100' 
    : 'blur-sm scale-105';

  // If no src or has error, show placeholder with regular img
  if (!src || hasError) {
    return (
      <img 
        src={PLACEHOLDER_SVG}
        alt={alt}
        className={`${className} object-cover`}
        loading={loading}
      />
    );
  }

  // For external/unknown URLs, use regular img with blur effect
  if (isExternalUrl(imgSrc)) {
    return (
      <img 
        src={imgSrc}
        alt={alt}
        className={`${className} object-cover w-full h-full transition-all duration-500 ease-out ${blurClasses}`}
        loading={loading}
        onError={handleError}
        onLoad={handleLoad}
      />
    );
  }

  // Use next/image for optimized loading with blur-to-focus effect
  return (
    <Image 
      src={imgSrc}
      alt={alt}
      fill
      className={`${className} object-cover transition-all duration-500 ease-out ${blurClasses}`}
      loading={priority ? undefined : loading}
      priority={priority}
      sizes={sizes}
      onError={handleError}
      onLoad={handleLoad}
      quality={75}
    />
  );
}
