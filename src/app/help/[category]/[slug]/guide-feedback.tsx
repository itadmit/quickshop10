'use client';

import { useState } from 'react';

interface GuideFeedbackProps {
  guideId: string;
}

export function GuideFeedback({ guideId }: GuideFeedbackProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (type: 'up' | 'down') => {
    setFeedback(type);
    setSubmitted(true);
    
    // Could send to analytics/DB here
    // await fetch('/api/guides/feedback', { ... })
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-emerald-600">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-medium">תודה על המשוב!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleFeedback('up')}
        className={`p-2.5 rounded-xl border-2 transition-all ${
          feedback === 'up'
            ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
            : 'border-gray-200 text-gray-400 hover:border-emerald-200 hover:text-emerald-500 hover:bg-emerald-50'
        }`}
        aria-label="כן, שימושי"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      </button>
      <button
        onClick={() => handleFeedback('down')}
        className={`p-2.5 rounded-xl border-2 transition-all ${
          feedback === 'down'
            ? 'border-red-500 bg-red-50 text-red-600'
            : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50'
        }`}
        aria-label="לא, לא שימושי"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
        </svg>
      </button>
    </div>
  );
}

