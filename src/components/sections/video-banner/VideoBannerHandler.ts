/**
 * VideoBannerHandler - DOM update logic for video banner section
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

export function handleVideoBannerUpdate(element: Element, updates: Partial<Section>): void {
  const el = element as HTMLElement;
  applyCommonUpdates(element, updates);

  // Video URL
  if (updates.content?.videoUrl !== undefined) {
    const video = el.querySelector('[data-video]') as HTMLVideoElement;
    if (video) {
      video.src = updates.content.videoUrl as string;
    }
  }
}

export const defaultContent = { videoUrl: '', imageUrl: '', buttonText: '', buttonLink: '' };
export const defaultSettings = {
  titleSize: 48, titleSizeMobile: 32, titleColor: '#ffffff', titleWeight: 'bold',
  subtitleSize: 20, subtitleSizeMobile: 16, subtitleColor: '#ffffff',
  overlay: 0.3, backgroundColor: '#1f2937', minHeight: 500,
  paddingTop: 0, paddingBottom: 0, isVisible: true,
};

