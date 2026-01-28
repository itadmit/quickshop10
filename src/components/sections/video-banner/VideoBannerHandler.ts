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
    const video = el.querySelector('[data-content-video]') as HTMLVideoElement;
    if (video) {
      video.src = updates.content.videoUrl as string;
    }
  }
  
  // Video settings
  const video = el.querySelector('[data-content-video]') as HTMLVideoElement;
  if (video) {
    if (updates.settings?.autoplay !== undefined) {
      video.autoplay = updates.settings.autoplay as boolean;
      if (updates.settings.autoplay) video.play();
    }
    if (updates.settings?.muted !== undefined) {
      video.muted = updates.settings.muted as boolean;
    }
    if (updates.settings?.loop !== undefined) {
      video.loop = updates.settings.loop as boolean;
    }
    if (updates.settings?.controls !== undefined) {
      video.controls = updates.settings.controls as boolean;
    }
  }
  
  // Min Height
  if (updates.settings?.minHeight !== undefined || updates.settings?.minHeightUnit !== undefined) {
    const minHeight = (updates.settings?.minHeight as number) || 90;
    const unit = (updates.settings?.minHeightUnit as string) || 'vh';
    el.style.minHeight = `${minHeight}${unit}`;
  }
  
  // Vertical Align - uses justify-* in flex-col container (main axis is vertical)
  if (updates.settings?.verticalAlign !== undefined) {
    const container = el.querySelector('[data-content-container]') as HTMLElement;
    if (container) {
      // Ensure flex-col is applied
      container.classList.add('flex-col');
      container.classList.remove('justify-start', 'justify-center', 'justify-end', 'pt-20', 'pb-20');
      const align = updates.settings.verticalAlign as string;
      if (align === 'top') {
        container.classList.add('justify-start', 'pt-20');
      } else if (align === 'bottom') {
        container.classList.add('justify-end', 'pb-20');
      } else {
        container.classList.add('justify-center');
      }
    }
  }
  
  // Text Align - uses items-* in flex-col container (cross axis is horizontal)
  if (updates.settings?.textAlign !== undefined) {
    const container = el.querySelector('[data-content-container]') as HTMLElement;
    const textContainer = container?.querySelector('div') as HTMLElement;
    if (container && textContainer) {
      // Ensure flex-col is applied
      container.classList.add('flex-col');
      container.classList.remove('items-start', 'items-center', 'items-end');
      textContainer.classList.remove('text-left', 'text-center', 'text-right');
      
      const align = updates.settings.textAlign as string;
      if (align === 'left') {
        // In RTL: left visually = items-end
        container.classList.add('items-end');
        textContainer.classList.add('text-left');
      } else if (align === 'right') {
        // In RTL: right visually = items-start
        container.classList.add('items-start');
        textContainer.classList.add('text-right');
      } else {
        container.classList.add('items-center');
        textContainer.classList.add('text-center');
      }
    }
  }
  
  // Overlay
  if (updates.settings?.overlay !== undefined) {
    const overlayEl = el.querySelector('[data-overlay]') as HTMLElement;
    if (overlayEl) {
      overlayEl.style.backgroundColor = `rgba(0,0,0,${updates.settings.overlay})`;
    }
  }
}

export const defaultContent = { 
  videoUrl: 'https://imagine-public.x.ai/imagine-public/share-videos/7ea822ec-5653-4f9a-ae8f-de25454ef9e1_hd.mp4', 
  buttonText: 'צפה עכשיו', 
  buttonLink: '/products' 
};

export const defaultSettings = {
  titleSize: 48, titleSizeMobile: 32, titleColor: '#ffffff', titleWeight: 'bold',
  subtitleSize: 20, subtitleSizeMobile: 16, subtitleColor: '#ffffff',
  overlay: 0.4, backgroundColor: '#000000', 
  minHeight: 90, minHeightUnit: 'vh',
  verticalAlign: 'center', textAlign: 'center',
  sectionWidth: 'full',
  paddingTop: 0, paddingBottom: 0, isVisible: true,
};

