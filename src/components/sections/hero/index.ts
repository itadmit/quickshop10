/**
 * Hero Section - Complete module export
 * סקשן באנר ראשי - כל המודול
 */

export { 
  handleHeroUpdate as handler,
  defaultContent,
  defaultSettings,
} from './HeroHandler';

export const config = {
  type: 'hero',
  name: 'באנר ראשי',
  icon: 'Image',
  defaultTitle: 'כותרת ראשית',
  defaultSubtitle: 'תת-כותרת',
};

