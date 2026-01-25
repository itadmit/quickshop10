/**
 * Text Block Section - Complete module export
 * סקשן בלוק טקסט - כל המודול
 */

// Handler for real-time DOM updates
export { 
  handleTextBlockUpdate as handler,
  defaultContent,
  defaultSettings,
} from './TextBlockHandler';

// Section configuration
export const config = {
  type: 'text_block',
  name: 'בלוק טקסט',
  icon: 'Type',
  defaultTitle: 'כותרת',
  defaultSubtitle: '',
};

