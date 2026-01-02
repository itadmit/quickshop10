'use client';

import { useState } from 'react';

interface ProductImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function ProductImage({ src, alt, className = '', fallback }: ProductImageProps) {
  const [error, setError] = useState(false);
  
  if (!src || error) {
    return (
      <>
        {fallback || (
          <div className={`w-full h-full flex items-center justify-center text-gray-400 text-2xl ${className}`}>
            📦
          </div>
        )}
      </>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      onError={() => setError(true)}
    />
  );
}

