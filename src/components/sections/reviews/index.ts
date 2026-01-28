/**
 * Reviews Section - Complete module export
 * סקשן ביקורות - כל המודול
 */

export { 
  handler,
  handleReviewsUpdate,
  defaultContent,
  defaultSettings,
} from './ReviewsHandler';

export const config = {
  type: 'reviews',
  name: 'ביקורות לקוחות',
  icon: 'Star',
  defaultTitle: 'מה הלקוחות אומרים',
  defaultSubtitle: '',
};

