'use client';

/**
 * VideoPlayer - Lightweight click-to-play video component
 * 
 * PERFORMANCE PRINCIPLES (from REQUIREMENTS.md):
 * - Shows thumbnail by default (no video loaded)
 * - Video loads ONLY on click (lazy loading)
 * - Minimal JS footprint (~3KB)
 * - LCP unaffected - thumbnail is just an image
 */

import { useState, useRef } from 'react';

interface VideoPlayerProps {
  /** Video URL (mp4, webm) */
  src: string;
  /** Thumbnail/poster image URL (from Cloudinary first frame) */
  poster: string;
  /** Alt text for accessibility */
  alt?: string;
  /** CSS class for the container */
  className?: string;
  /** Aspect ratio class (e.g., 'aspect-square', 'aspect-video') */
  aspectRatio?: string;
}

export function VideoPlayer({ 
  src, 
  poster, 
  alt = 'וידאו מוצר',
  className = '',
  aspectRatio = 'aspect-square',
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent zoom lightbox from opening
    setIsLoading(true);
    setIsPlaying(true);
  };

  const handleVideoLoaded = () => {
    setIsLoading(false);
    // Auto-play when loaded
    videoRef.current?.play();
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  // Show thumbnail with play button (no video loaded yet)
  if (!isPlaying) {
    return (
      <div 
        className={`relative ${aspectRatio} bg-gray-100 cursor-pointer group ${className}`}
        onClick={handlePlay}
      >
        {/* Thumbnail (poster image) */}
        <img
          src={poster}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-black/60 group-hover:bg-black/80 transition-colors flex items-center justify-center shadow-lg">
            <svg 
              className="w-7 h-7 text-white ml-1" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Video badge */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 rounded text-white text-xs font-medium flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
          וידאו
        </div>
      </div>
    );
  }

  // Show video player
  return (
    <div className={`relative ${aspectRatio} bg-black ${className}`}>
      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
      
      {/* Video element - only rendered when playing */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        playsInline
        className="absolute inset-0 w-full h-full object-contain"
        onLoadedData={handleVideoLoaded}
        onEnded={handleVideoEnded}
      />
    </div>
  );
}

