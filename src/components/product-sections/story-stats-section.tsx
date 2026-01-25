/**
 * Story Stats Section - Server Component
 * 
 * ⚡ Performance (REQUIREMENTS.md compliant):
 * - Pure Server Component - ZERO client JS
 * - Data fetched on server
 * - CSS only styling
 * - Only renders if plugin is active AND story exists for product
 */

import { Eye, Heart, MessageCircle } from 'lucide-react';
import type { StoryStatsSectionSettings } from '@/lib/product-page-sections';

interface StoryStatsData {
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
}

interface StoryStatsSectionProps {
  settings: Partial<StoryStatsSectionSettings>;
  storyStats: StoryStatsData | null;
  sectionId: string;
}

export function StoryStatsSection({ settings, storyStats, sectionId }: StoryStatsSectionProps) {
  // Don't render if no story data
  if (!storyStats) return null;
  
  const {
    showViews = true,
    showLikes = true,
    showComments = true,
    style = 'inline',
    iconColor = '#e91e63',
  } = settings;

  // If nothing to show, return null
  if (!showViews && !showLikes && !showComments) return null;

  // Format number for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const stats = [
    showViews && { icon: Eye, count: storyStats.viewsCount, label: 'צפיות' },
    showLikes && { icon: Heart, count: storyStats.likesCount, label: 'לייקים' },
    showComments && { icon: MessageCircle, count: storyStats.commentsCount, label: 'תגובות' },
  ].filter(Boolean) as { icon: typeof Eye; count: number; label: string }[];

  if (stats.length === 0) return null;

  // Inline style
  if (style === 'inline') {
    return (
      <div 
        className="flex items-center gap-4 py-2"
        data-section-id={sectionId}
        data-section-type="product_story_stats"
        data-section-name="סטטיסטיקות סטורי"
      >
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center gap-1.5 text-sm text-gray-600">
            <stat.icon 
              className="w-4 h-4" 
              style={{ color: iconColor }}
            />
            <span className="font-medium">{formatNumber(stat.count)}</span>
            <span className="text-gray-400">{stat.label}</span>
          </div>
        ))}
      </div>
    );
  }

  // Badges style
  if (style === 'badges') {
    return (
      <div 
        className="flex items-center gap-2 py-2"
        data-section-id={sectionId}
        data-section-type="product_story_stats"
        data-section-name="סטטיסטיקות סטורי"
      >
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm"
          >
            <stat.icon 
              className="w-4 h-4" 
              style={{ color: iconColor }}
            />
            <span className="font-medium text-gray-700">{formatNumber(stat.count)}</span>
          </div>
        ))}
      </div>
    );
  }

  // Minimal style
  return (
    <div 
      className="flex items-center gap-3 py-1 text-xs text-gray-500"
      data-section-id={sectionId}
      data-section-type="product_story_stats"
      data-section-name="סטטיסטיקות סטורי"
    >
      {stats.map((stat, index) => (
        <div key={index} className="flex items-center gap-1">
          <stat.icon 
            className="w-3.5 h-3.5" 
            style={{ color: iconColor }}
          />
          <span>{formatNumber(stat.count)}</span>
        </div>
      ))}
    </div>
  );
}



