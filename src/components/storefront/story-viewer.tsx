'use client';

/**
 * Story Viewer - Full-screen story viewing experience
 * 
 * ⚡ Performance (REQUIREMENTS.md compliant):
 * - Optimistic UI for likes - instant feedback
 * - Double-tap to like (Instagram-style)
 * - Single tap to pause/resume
 * - Toast notification for cart
 * - CSS animations for smooth transitions
 */

import { useState, useEffect, useCallback, useRef, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import {
  X, Heart, MessageCircle, ShoppingCart,
  ChevronLeft, ChevronRight, Share2, Pause, Play, Send, Loader2, Check,
} from 'lucide-react';
import type { Story, StoriesSettings } from './stories-bar';
import { decodeHtmlEntities } from '@/lib/format-price';

interface Comment {
  id: string;
  visitorName: string;
  content: string;
  createdAt: string;
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  settings: StoriesSettings;
  storeSlug: string;
  basePath: string;
  onClose: () => void;
  onStoryViewed: (storyId: string) => void;
  onLikeToggled: (storyId: string, isLiked: boolean, likesCount: number) => void;
}

export function StoryViewer({
  stories,
  initialIndex,
  settings,
  storeSlug,
  basePath,
  onClose,
  onStoryViewed,
  onLikeToggled,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showCartToast, setShowCartToast] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [localCommentsCount, setLocalCommentsCount] = useState<Record<string, number>>({});
  
  // Optimistic state for likes
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, { isLiked: boolean; count: number }>>({});
  
  // Double-tap detection
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Like animation
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const currentStory = stories[currentIndex];
  
  // Get optimistic like state or fall back to server state
  const getCurrentLikeState = useCallback(() => {
    const optimistic = optimisticLikes[currentStory?.id];
    if (optimistic) {
      return optimistic;
    }
    return {
      isLiked: currentStory?.isLiked || false,
      count: currentStory?.likesCount || 0,
    };
  }, [currentStory, optimisticLikes]);

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !currentStory.isViewed) {
      onStoryViewed(currentStory.id);
      
      // Fire-and-forget API call
      fetch(`/api/storefront/stories/${currentStory.id}/view`, {
        method: 'POST',
      }).catch(() => {});
    }
  }, [currentStory?.id]);

  // Auto-advance progress
  useEffect(() => {
    if (isPaused || showComments) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      return;
    }

    setProgress(0);
    const duration = settings.autoAdvanceSeconds * 1000;
    const interval = 50;
    let elapsed = 0;

    progressInterval.current = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);

      if (elapsed >= duration) {
        goToNext();
      }
    }, interval);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentIndex, isPaused, showComments, settings.autoAdvanceSeconds]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToNext();
      if (e.key === 'ArrowRight') goToPrevious();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(p => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // ⚡ Optimistic Like - instant feedback!
  const handleLike = useCallback(() => {
    if (!currentStory || !settings.allowLikes) return;
    
    const currentState = getCurrentLikeState();
    const newIsLiked = !currentState.isLiked;
    const newCount = newIsLiked ? currentState.count + 1 : Math.max(0, currentState.count - 1);
    
    // ⚡ OPTIMISTIC UPDATE - instant feedback!
    setOptimisticLikes(prev => ({
      ...prev,
      [currentStory.id]: { isLiked: newIsLiked, count: newCount },
    }));
    
    // Show like animation if liking
    if (newIsLiked) {
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 1000);
    }
    
    // Update parent state optimistically
    onLikeToggled(currentStory.id, newIsLiked, newCount);
    
    // Fire-and-forget API call (don't block UI)
    fetch(`/api/storefront/stories/${currentStory.id}/like`, {
      method: 'POST',
    }).then(res => {
      if (res.ok) {
        return res.json();
      }
      throw new Error('Failed');
    }).then(data => {
      // Sync with server response
      setOptimisticLikes(prev => ({
        ...prev,
        [currentStory.id]: { isLiked: data.isLiked, count: data.likesCount },
      }));
      onLikeToggled(currentStory.id, data.isLiked, data.likesCount);
    }).catch(() => {
      // Revert on error
      setOptimisticLikes(prev => ({
        ...prev,
        [currentStory.id]: currentState,
      }));
      onLikeToggled(currentStory.id, currentState.isLiked, currentState.count);
    });
  }, [currentStory, settings.allowLikes, getCurrentLikeState, onLikeToggled]);

  // Handle tap on story image (single tap = pause, double tap = like)
  const handleImageTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected - LIKE!
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      handleLike();
      lastTapRef.current = 0;
    } else {
      // First tap - wait to see if it's a double tap
      lastTapRef.current = now;
      
      // If no second tap within 300ms, toggle pause
      tapTimeoutRef.current = setTimeout(() => {
        setIsPaused(p => !p);
        tapTimeoutRef.current = null;
      }, 300);
    }
  }, [handleLike]);

  // Like button click handler
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleLike();
  };

  // Load comments
  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/storefront/stories/${currentStory.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  // Open comments modal
  const handleOpenComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsPaused(true);
    setShowComments(true);
    loadComments();
  };

  // Submit comment
  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/storefront/stories/${currentStory.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorName: commentName.trim() || 'אורח',
          content: commentText.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments(prev => [data.comment, ...prev]);
        setCommentText('');
        setLocalCommentsCount(prev => ({
          ...prev,
          [currentStory.id]: (prev[currentStory.id] ?? currentStory.commentsCount) + 1,
        }));
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Get current comments count
  const getCommentsCount = (storyId: string, defaultCount: number) => {
    return localCommentsCount[storyId] ?? defaultCount;
  };

  // Handle add to cart with toast
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!currentStory || addingToCart) return;

    setAddingToCart(true);
    try {
      // Add to local storage cart (store-specific key)
      const cartKey = `quickshop_cart_${storeSlug}`;
      const existingCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      
      const variant = currentStory.variants?.[0];
      const cartItem = {
        id: crypto.randomUUID(),
        productId: currentStory.product.id,
        variantId: variant?.id,
        quantity: 1,
        name: currentStory.product.title,
        variantTitle: variant?.title || '',
        price: variant?.price || currentStory.product.price,
        image: currentStory.product.image || '',
      };

      // Check if already in cart
      const existingIndex = existingCart.findIndex(
        (item: any) => item.productId === cartItem.productId && item.variantId === cartItem.variantId
      );

      if (existingIndex >= 0) {
        existingCart[existingIndex].quantity += 1;
      } else {
        existingCart.push(cartItem);
      }

      localStorage.setItem(cartKey, JSON.stringify(existingCart));

      // Dispatch event for cart update
      window.dispatchEvent(new CustomEvent('cart-updated'));
      
      // Show toast ⚡
      setShowCartToast(true);
      setTimeout(() => setShowCartToast(false), 2500);
    } finally {
      setAddingToCart(false);
    }
  };

  // Share
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = `${window.location.origin}${basePath}/product/${currentStory.product.handle}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentStory.product.title,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      // Copy to clipboard
      await navigator.clipboard.writeText(url);
      alert('הקישור הועתק!');
    }
  };

  // Handle WhatsApp share
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = `${window.location.origin}${basePath}/product/${currentStory.product.handle}`;
    const text = `צפה במוצר: ${currentStory.product.title}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  };

  if (!currentStory) return null;
  
  const likeState = getCurrentLikeState();

  const content = (
    <div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 p-2">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-50"
              style={{
                width:
                  index < currentIndex
                    ? '100%'
                    : index === currentIndex
                    ? `${progress}%`
                    : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 z-50 flex items-center justify-between px-4 pt-4">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden relative">
            {currentStory.product.image ? (
              <Image
                src={currentStory.product.image}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
          </div>
          <span className="text-white font-medium text-sm max-w-[150px] truncate">
            {currentStory.product.title}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPaused(p => !p);
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors cursor-pointer"
        >
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation areas (left/right sides) */}
      <button
        onClick={goToPrevious}
        className="absolute right-0 top-20 bottom-40 w-[15%] z-40"
        aria-label="הקודם"
      />
      <button
        onClick={goToNext}
        className="absolute left-0 top-20 bottom-40 w-[15%] z-40"
        aria-label="הבא"
      />

      {/* Navigation arrows (desktop) */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 hidden md:flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}
      {currentIndex < stories.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 hidden md:flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Main Image - Tap to pause, Double-tap to like */}
      <div 
        className="w-full h-full max-w-lg mx-auto relative flex items-center justify-center p-4 z-30"
        onClick={handleImageTap}
      >
        {currentStory.product.image ? (
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-h-[70vh] relative">
            <Image
              src={currentStory.product.image}
              alt={currentStory.product.title}
              width={400}
              height={500}
              className="max-w-full max-h-[60vh] object-contain select-none"
              draggable={false}
              priority
            />
            
            {/* Like Animation Heart (shows on double-tap) */}
            {showLikeAnimation && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Heart 
                  className="w-24 h-24 text-red-500 fill-red-500 animate-ping"
                  style={{ animationDuration: '0.8s' }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
            <span className="text-6xl">📷</span>
          </div>
        )}
        
        {/* Pause indicator */}
        {isPaused && !showComments && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center">
              <Pause className="w-8 h-8 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Side Actions */}
      <div className="absolute left-4 bottom-32 flex flex-col gap-4 z-[60]">
        {/* Like */}
        {settings.allowLikes && (
          <button
            onClick={handleLikeClick}
            className="flex flex-col items-center gap-1 cursor-pointer hover:scale-110 transition-transform active:scale-95"
          >
            <Heart
              className={`w-8 h-8 transition-all duration-150 ${
                likeState.isLiked ? 'text-red-500 fill-red-500 scale-110' : 'text-white'
              }`}
            />
            <span className="text-white text-xs">{likeState.count}</span>
          </button>
        )}

        {/* Comments */}
        {settings.allowComments && (
          <button 
            onClick={handleOpenComments}
            className="flex flex-col items-center gap-1 cursor-pointer hover:scale-110 transition-transform"
          >
            <MessageCircle className="w-8 h-8 text-white" />
            <span className="text-white text-xs">{getCommentsCount(currentStory.id, currentStory.commentsCount)}</span>
          </button>
        )}

        {/* WhatsApp */}
        <button 
          onClick={handleWhatsApp}
          className="flex flex-col items-center gap-1 cursor-pointer hover:scale-110 transition-transform"
        >
          <Send className="w-7 h-7 text-white" />
        </button>

        {/* Share */}
        <button 
          onClick={handleShare} 
          className="flex flex-col items-center gap-1 cursor-pointer hover:scale-110 transition-transform"
        >
          <Share2 className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <div 
          className="absolute inset-0 z-[70] flex items-end justify-center"
          onClick={(e) => {
            e.stopPropagation();
            setShowComments(false);
            setIsPaused(false);
          }}
        >
          <div 
            className="bg-white rounded-t-2xl w-full max-w-lg max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">
                תגובות ({getCommentsCount(currentStory.id, currentStory.commentsCount)})
              </h3>
              <button
                onClick={() => {
                  setShowComments(false);
                  setIsPaused(false);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingComments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>אין תגובות עדיין</p>
                  <p className="text-sm">היה הראשון להגיב!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {comment.visitorName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">
                          {comment.visitorName}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {new Date(comment.createdAt).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleSubmitComment} className="p-4 border-t bg-gray-50">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  placeholder="השם שלך (אופציונלי)"
                  className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="הוסף תגובה..."
                  className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || submittingComment}
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {submittingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Info & Add to Cart */}
      {settings.showProductInfo && (
        <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
          <div className="max-w-lg mx-auto relative">
            <h3 className="text-white text-lg font-bold mb-1">
              {currentStory.product.title}
            </h3>
            {currentStory.product.description && (
              <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                {decodeHtmlEntities(currentStory.product.description.replace(/<[^>]*>/g, ''))}
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white text-xl font-bold">
                  ₪{currentStory.product.price.toFixed(2)}
                </span>
                {currentStory.product.compareAtPrice && (
                  <span className="text-gray-400 line-through text-sm">
                    ₪{currentStory.product.compareAtPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Add to Cart Button with Toast */}
            {settings.allowQuickAdd && (
              <div className="relative mt-3">
                {/* Toast notification */}
                {showCartToast && (
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200 whitespace-nowrap">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">המוצר נוסף לסל!</span>
                  </div>
                )}
                
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="w-full py-3 bg-white text-black rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {addingToCart ? 'מוסיף...' : 'הוסף מהר'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Use portal to render at document body level
  if (typeof window !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
}
