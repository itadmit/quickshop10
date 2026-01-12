'use client';

import { useState } from 'react';
import { MapPin, Copy, Check, ExternalLink } from 'lucide-react';

interface TrackingPageLinkProps {
  storeSlug: string;
}

export function TrackingPageLink({ storeSlug }: TrackingPageLinkProps) {
  const [copied, setCopied] = useState(false);

  // Build the tracking page URL
  const trackingUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/shops/${storeSlug}/track`
    : `/shops/${storeSlug}/track`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpen = () => {
    window.open(trackingUrl, '_blank');
  };

  return (
    <div className="p-4 bg-gradient-to-l from-green-50 to-white border border-green-200 rounded-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">עמוד מעקב משלוחים</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              הוסף לתפריט שלך כדי שלקוחות יוכלו לעקוב אחרי המשלוח שלהם
            </p>
            
            {/* URL Display */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <code className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-mono rounded-lg select-all" dir="ltr">
                /shops/{storeSlug}/track
              </code>
              
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    הועתק!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    העתק קישור
                  </>
                )}
              </button>

              <button
                onClick={handleOpen}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                פתח
              </button>
            </div>

            {/* Tip */}
            <p className="text-xs text-gray-400 mt-3">
              💡 טיפ: הוסף את הלינק לתפריט הראשי או לפוטר שלך
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

