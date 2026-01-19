'use client';

/**
 * Stories Bar - Instagram-style stories for products
 * 
 * ⚡ Performance:
 * - Only renders when plugin is active
 * - Lazy loads viewer modal
 * - Uses CSS transitions for smooth animations
 */

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StoryViewer } from './story-viewer';

export interface Story {
  id: string;
  productId: string;
  position: number;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  // Custom media - overrides product image if set
  customMediaUrl?: string | null;
  customMediaType?: 'image' | 'video' | null;
  product: {
    id: string;
    title: string;
    handle: string;
    price: number;
    compareAtPrice: number | null;
    description: string | null;
    image: string | null;
    // Inventory fields for stock validation
    trackInventory?: boolean;
    inventory?: number | null;
    allowBackorder?: boolean;
    hasVariants?: boolean;
  };
  isViewed: boolean;
  isLiked: boolean;
  variants?: Array<{
    id: string;
    title: string;
    price: number;
    inventory?: number | null;
  }>;
}

export interface StoriesSettings {
  displayMode: string;
  autoAdvanceSeconds: number;
  showProductInfo: boolean;
  allowLikes: boolean;
  allowComments: boolean;
  allowQuickAdd: boolean;
  circleBorderColor: string;
  viewedBorderColor: string;
}

interface StoriesBarProps {
  storeSlug: string;
  stories: Story[];
  settings: StoriesSettings;
  pageType?: 'home' | 'category' | 'product' | 'other';
  basePath: string;
}

export function StoriesBar({
  storeSlug,
  stories: initialStories,
  settings,
  pageType = 'home',
  basePath,
}: StoriesBarProps) {
  const [stories, setStories] = useState(initialStories);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  // Keep a stable sorted list for the viewer (only sort when viewer is closed)
  const [viewerStories, setViewerStories] = useState<Story[]>([]);

  // Animate in on mount
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  // Update scroll buttons
  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [stories]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Handle story viewed
  const handleStoryViewed = (storyId: string) => {
    setStories(prev =>
      prev.map(story =>
        story.id === storyId ? { ...story, isViewed: true } : story
      )
    );
  };

  // Handle like toggled
  const handleLikeToggled = (storyId: string, isLiked: boolean, likesCount: number) => {
    setStories(prev =>
      prev.map(story =>
        story.id === storyId
          ? { ...story, isLiked, likesCount }
          : story
      )
    );
  };

  // Check display mode
  const shouldDisplay =
    settings.displayMode === 'everywhere' ||
    (settings.displayMode === 'home_only' && pageType === 'home') ||
    (settings.displayMode === 'category' && (pageType === 'home' || pageType === 'category'));

  if (!shouldDisplay || stories.length === 0) return null;

  // Sort: unviewed first, then viewed (for display in bar)
  const sortedStories = [...stories].sort((a, b) => {
    if (a.isViewed === b.isViewed) return a.position - b.position;
    return a.isViewed ? 1 : -1;
  });

  // Open viewer with a snapshot of the current sorted stories
  const handleOpenViewer = (index: number) => {
    // Create snapshot of stories at the moment of opening - this prevents reordering while viewing
    setViewerStories([...sortedStories]);
    setSelectedStoryIndex(index);
  };

  // Close viewer and clear the snapshot
  const handleCloseViewer = () => {
    setSelectedStoryIndex(null);
    setViewerStories([]);
  };

  return (
    <>
      <div
        className="w-full border-b border-gray-100 relative overflow-hidden transition-all duration-500 ease-out"
        style={{
          maxHeight: isVisible ? '150px' : '0px',
          paddingTop: isVisible ? '1rem' : '0',
          paddingBottom: isVisible ? '1rem' : '0',
          opacity: isVisible ? 1 : 0,
        }}
      >
        {/* Scroll Right Button (RTL) */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="גלול ימינה"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Scroll Left Button (RTL) */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="גלול שמאלה"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Stories Container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto px-4 md:px-6 justify-center"
          onScroll={updateScrollButtons}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {sortedStories.map((story, index) => (
            <button
              key={story.id}
              onClick={() => handleOpenViewer(index)}
              className="flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer"
            >
              {/* Story Circle */}
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[3px] transition-all duration-300"
                style={{
                  background: story.isViewed
                    ? settings.viewedBorderColor
                    : `linear-gradient(135deg, ${settings.circleBorderColor}, ${settings.circleBorderColor}dd)`,
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-white p-[2px]">
                  {/* Always show product image in preview circle (even for video stories) */}
                  {story.product.image ? (
                    <Image
                      src={story.product.image}
                      alt={story.product.title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover rounded-full group-hover:grayscale transition-all duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xl">
                      📷
                    </div>
                  )}
                </div>
              </div>

              {/* Story Title */}
              <span className="text-xs text-gray-700 max-w-[70px] md:max-w-[80px] truncate text-center">
                {story.product.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Story Viewer Modal - uses snapshot of stories to prevent reordering */}
      {selectedStoryIndex !== null && viewerStories.length > 0 && (
        <StoryViewer
          stories={viewerStories}
          initialIndex={selectedStoryIndex}
          settings={settings}
          storeSlug={storeSlug}
          basePath={basePath}
          onClose={handleCloseViewer}
          onStoryViewed={handleStoryViewed}
          onLikeToggled={handleLikeToggled}
        />
      )}
    </>
  );
}

