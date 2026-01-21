'use client';

import { useState } from 'react';

interface JobRequirement {
  text: string;
  isAdvantage?: boolean;
}

interface JobPosition {
  id: string;
  title: string;
  isNew?: boolean;
  isFilled?: boolean;
  location: string;
  type: string; // משרה מלאה / חלקית
  description: string;
  responsibilities: string[];
  requirements: JobRequirement[];
  tags: { label: string; color: string }[];
}

interface JobAccordionProps {
  position: JobPosition;
}

export function JobAccordion({ position }: JobAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (position.isFilled) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 opacity-60 relative">
        <div className="absolute top-4 left-4 bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-bold">
          גוייס ✓
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-500 line-through">{position.title}</h3>
            <p className="text-gray-400 text-sm mt-1">{position.location} • {position.type}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
      position.isNew 
        ? 'bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-300' 
        : 'bg-white border-gray-200 hover:border-emerald-300'
    }`}>
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-right flex items-center justify-between gap-4"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            {position.isNew && (
              <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                חדש!
              </span>
            )}
            <h3 className="text-xl font-bold text-gray-900">{position.title}</h3>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {position.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {position.type}
            </span>
          </p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'bg-emerald-500 text-white rotate-180' : 'bg-gray-100 text-gray-600'
        }`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable Content */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-6 pb-6 space-y-6 border-t border-gray-100 pt-6">
          {/* Description */}
          <div>
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-sm">📋</span>
              תיאור התפקיד
            </h4>
            <p className="text-gray-600 leading-relaxed">{position.description}</p>
          </div>

          {/* Responsibilities */}
          {position.responsibilities.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm">✨</span>
                תחומי אחריות
              </h4>
              <ul className="space-y-1">
                {position.responsibilities.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-600 text-sm">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          <div>
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm">📌</span>
              דרישות התפקיד
            </h4>
            <ul className="space-y-1">
              {position.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-600 text-sm">
                  {req.isAdvantage ? (
                    <span className="text-amber-500 mt-0.5">★</span>
                  ) : (
                    <span className="text-emerald-500 mt-0.5">✓</span>
                  )}
                  <span>
                    {req.text}
                    {req.isAdvantage && <span className="text-amber-600 text-xs mr-1">(יתרון)</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {position.tags.map((tag, index) => (
              <span
                key={index}
                className={`px-3 py-1 rounded-full text-sm font-medium ${tag.color}`}
              >
                {tag.label}
              </span>
            ))}
          </div>

          {/* Apply Button */}
          <div className="pt-4 border-t border-gray-100">
            <a
              href="#apply-form"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-full font-bold hover:bg-emerald-700 transition-colors"
            >
              הגש מועמדות
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

