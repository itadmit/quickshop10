/**
 * Section System - Content Types
 * טיפוסי תוכן לסקשנים שונים
 */

// ============================================
// REVIEWS
// ============================================
export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date?: string;
  avatar?: string;
  verified?: boolean;
}

export interface ReviewsContent {
  reviews?: Review[];
}

// ============================================
// FEATURES
// ============================================
export interface Feature {
  id?: string;
  icon?: string;
  emoji?: string; // Legacy support
  title: string;
  description?: string;
}

export interface FeaturesContent {
  features?: Feature[];
}

// ============================================
// GALLERY
// ============================================
export interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  link?: string;
  caption?: string;
}

export interface GalleryContent {
  images?: GalleryImage[];
}

// ============================================
// LOGOS
// ============================================
export interface Logo {
  id: string;
  url: string;
  alt?: string;
  link?: string;
}

export interface LogosContent {
  logos?: Logo[];
}

// ============================================
// FAQ
// ============================================
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQContent {
  items?: FAQItem[];
}

// ============================================
// HERO / BANNER
// ============================================
export interface HeroContent {
  imageUrl?: string;
  mobileImageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
}

export interface VideoBannerContent {
  videoUrl?: string;
  imageUrl?: string;
  mobileVideoUrl?: string;
  mobileImageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
}

// ============================================
// SLIDER
// ============================================
export interface HeroSlide {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  textPosition?: 'center' | 'bottom-center' | 'bottom-right' | 'bottom-left';
}

export interface HeroSliderContent {
  slides?: HeroSlide[];
  autoPlay?: boolean;
  interval?: number;
}

// ============================================
// SPLIT BANNER
// ============================================
export interface SplitBannerSide {
  title?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  link?: string;
}

export interface SplitBannerContent {
  right?: SplitBannerSide;
  left?: SplitBannerSide;
  // Legacy support
  items?: {
    title: string;
    imageUrl: string;
    mobileImageUrl?: string;
    link: string;
  }[];
}

// ============================================
// TEXT BLOCK
// ============================================
export interface TextBlockContent {
  text?: string;
  buttonText?: string;
  buttonLink?: string;
}

// ============================================
// IMAGE + TEXT
// ============================================
export interface ImageTextContent {
  imageUrl?: string;
  text?: string;
  buttonText?: string;
  buttonLink?: string;
}

// ============================================
// NEWSLETTER
// ============================================
export interface NewsletterContent {
  placeholder?: string;
  buttonText?: string;
}

