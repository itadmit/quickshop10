'use client';

import { useState, useEffect } from 'react';

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

// Default placeholder SVG as data URI - image icon centered in gray background
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Cg transform='translate(152, 152)' fill='none' stroke='%23d1d5db' stroke-width='4'%3E%3Crect x='12' y='12' width='72' height='72' rx='8'/%3E%3Ccircle cx='34' cy='34' r='6'/%3E%3Cpolyline points='84 60 64 40 20 84'/%3E%3C/g%3E%3C/svg%3E`;

export function ProductImage({ src, alt, className = '', loading = 'lazy' }: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src || PLACEHOLDER_SVG);
  const [hasError, setHasError] = useState(false);

  // Update imgSrc when src prop changes
  useEffect(() => {
    if (src) {
      setImgSrc(src);
      setHasError(false);
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

  return (
    <img 
      src={imgSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
    />
  );
}
