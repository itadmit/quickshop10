'use client';

import { useState } from 'react';

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

// Default placeholder SVG as data URI
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Cg fill='%23d1d5db'%3E%3Crect x='150' y='130' width='100' height='80' rx='8'/%3E%3Ccircle cx='175' cy='155' r='12'/%3E%3Cpolygon points='155,200 200,160 245,200'/%3E%3Cpolygon points='180,200 220,170 260,200'/%3E%3C/g%3E%3C/svg%3E`;

export function ProductImage({ src, alt, className = '', loading = 'lazy' }: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src || PLACEHOLDER_SVG);
  const [hasError, setHasError] = useState(false);

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
