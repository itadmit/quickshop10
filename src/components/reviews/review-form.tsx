'use client';

/**
 * Review Form - Client Component
 * 
 * ⚡ Optimistic UI + Server Action
 * Supports image upload via existing Cloudinary CDN
 */

import { useState, useTransition } from 'react';
import { Star, Upload, X, Loader2 } from 'lucide-react';
import { createReview } from '@/app/shops/[slug]/admin/plugins/product-reviews/actions';

interface ReviewFormProps {
  productId: string;
  storeId: string;
  storeSlug: string;
  customerId?: string;
  customerOrders?: { id: string; orderNumber: string; date: string }[];
  config: {
    requireText: boolean;
    minTextLength: number;
    allowMedia: boolean;
    maxMediaPerReview: number;
  };
  onSuccess?: () => void;
}

interface MediaItem {
  file?: File;
  url: string;
  type: 'image' | 'video';
  uploading?: boolean;
}

export function ReviewForm({
  productId,
  storeId,
  storeSlug,
  customerId,
  customerOrders = [],
  config,
  onSuccess,
}: ReviewFormProps) {
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const displayRating = hoverRating || rating;

  // Handle media upload
  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (media.length + files.length > config.maxMediaPerReview) {
      setError(`ניתן להעלות עד ${config.maxMediaPerReview} קבצים`);
      return;
    }

    for (const file of files) {
      const type = file.type.startsWith('video') ? 'video' : 'image';
      const tempUrl = URL.createObjectURL(file);
      
      // Add with loading state
      setMedia(prev => [...prev, { file, url: tempUrl, type, uploading: true }]);

      // Upload to Vercel Blob (with WebP conversion)
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload-blob', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Upload failed');
        
        const data = await res.json();
        
        // Update with real URL
        setMedia(prev => prev.map(m => 
          m.url === tempUrl 
            ? { ...m, url: data.secure_url || data.url, uploading: false }
            : m
        ));
      } catch {
        // Remove failed upload
        setMedia(prev => prev.filter(m => m.url !== tempUrl));
        setError('שגיאה בהעלאת הקובץ');
      }
    }
  };

  const removeMedia = (url: string) => {
    setMedia(prev => prev.filter(m => m.url !== url));
  };

  // Submit review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (rating === 0) {
      setError('נא לבחור דירוג');
      return;
    }

    if (config.requireText && content.length < config.minTextLength) {
      setError(`נא לכתוב לפחות ${config.minTextLength} תווים`);
      return;
    }

    // Check if any media is still uploading
    if (media.some(m => m.uploading)) {
      setError('נא להמתין לסיום העלאת הקבצים');
      return;
    }

    startTransition(async () => {
      const result = await createReview(storeId, storeSlug, {
        productId,
        customerId,
        orderId: selectedOrderId || undefined,
        rating,
        title: title || undefined,
        content: content || undefined,
        pros: pros || undefined,
        cons: cons || undefined,
        media: media.map(m => ({
          url: m.url,
          type: m.type,
        })),
      });

      if (result.success) {
        setSuccess(true);
        onSuccess?.();
      } else {
        setError(result.error || 'שגיאה בשליחת הביקורת');
      }
    });
  };

  // Success state
  if (success) {
    return (
      <div id="write-review" className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-2">🎉</div>
        <h3 className="text-lg font-medium text-green-800 mb-2">תודה על הביקורת!</h3>
        <p className="text-sm text-green-600">
          הביקורת שלך נשלחה ותפורסם לאחר אישור.
        </p>
      </div>
    );
  }

  return (
    <form id="write-review" onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-medium mb-6">כתוב ביקורת</h3>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          דירוג כולל <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHoverRating(i)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 focus:outline-none"
            >
              <Star 
                className={`w-8 h-8 transition-colors ${
                  i <= displayRating 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Order Selection (if has orders) */}
      {customerOrders.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            בחר הזמנה (לתגית "רכישה מאומתת")
          </label>
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
          >
            <option value="">ללא</option>
            {customerOrders.map(order => (
              <option key={order.id} value={order.id}>
                #{order.orderNumber} - {order.date}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          כותרת
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="סכם את הביקורת במשפט..."
          maxLength={255}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
        />
      </div>

      {/* Content */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          הביקורת שלך {config.requireText && <span className="text-red-500">*</span>}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="ספר לנו על החוויה שלך עם המוצר..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 resize-none"
        />
        {config.requireText && (
          <p className="mt-1 text-xs text-gray-500">
            מינימום {config.minTextLength} תווים ({content.length}/{config.minTextLength})
          </p>
        )}
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            מה אהבת? (אופציונלי)
          </label>
          <input
            type="text"
            value={pros}
            onChange={(e) => setPros(e.target.value)}
            placeholder="איכות, מחיר..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            מה פחות אהבת? (אופציונלי)
          </label>
          <input
            type="text"
            value={cons}
            onChange={(e) => setCons(e.target.value)}
            placeholder="משלוח, אריזה..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
          />
        </div>
      </div>

      {/* Media Upload */}
      {config.allowMedia && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            הוסף תמונות (עד {config.maxMediaPerReview})
          </label>
          <div className="flex flex-wrap gap-2">
            {media.map((m, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-200">
                {m.type === 'image' ? (
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <video src={m.url} className="w-full h-full object-cover" />
                )}
                {m.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
                {!m.uploading && (
                  <button
                    type="button"
                    onClick={() => removeMedia(m.url)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {media.length < config.maxMediaPerReview && (
              <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                <Upload className="w-6 h-6 text-gray-400" />
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || rating === 0}
        className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            שולח...
          </>
        ) : (
          'שלח ביקורת'
        )}
      </button>
    </form>
  );
}


