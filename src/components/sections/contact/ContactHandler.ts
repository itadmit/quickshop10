/**
 * ContactHandler - DOM update logic for contact section
 * Handles real-time updates in the editor
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

export function handleContactUpdate(element: Element, updates: Partial<Section>): void {
  const el = element as HTMLElement;
  
  // =====================================================
  // COMMON SETTINGS (background, visibility, spacing, animation, etc.)
  // =====================================================
  applyCommonUpdates(el, updates);

  // =====================================================
  // TITLE & SUBTITLE
  // =====================================================
  if (updates.title !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.textContent = updates.title || 'צור קשר';
      titleEl.style.display = updates.title ? 'block' : 'none';
    }
  }

  if (updates.subtitle !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      subtitleEl.textContent = updates.subtitle || '';
      subtitleEl.style.display = updates.subtitle ? 'block' : 'none';
    }
  }

  // =====================================================
  // TYPOGRAPHY - Title
  // =====================================================
  if (updates.settings?.titleColor !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.style.color = updates.settings.titleColor as string;
    }
  }

  if (updates.settings?.titleSize !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      const size = updates.settings.titleSize as number;
      const mobileSizeAttr = el.getAttribute('data-title-size-mobile') || String(size * 0.7);
      
      // Update or create style tag
      let styleEl = el.querySelector('style[data-typography-title]') as HTMLStyleElement;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.setAttribute('data-typography-title', 'true');
        el.appendChild(styleEl);
      }
      
      const sectionId = el.getAttribute('data-section-id');
      styleEl.textContent = `
        [data-section-id="${sectionId}"] [data-section-title] {
          font-size: ${mobileSizeAttr}px !important;
        }
        @media (min-width: 768px) {
          [data-section-id="${sectionId}"] [data-section-title] {
            font-size: ${size}px !important;
          }
        }
      `;
    }
  }

  if (updates.settings?.titleSizeMobile !== undefined) {
    el.setAttribute('data-title-size-mobile', String(updates.settings.titleSizeMobile));
  }

  if (updates.settings?.titleWeight !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.style.fontWeight = updates.settings.titleWeight as string;
    }
  }

  // =====================================================
  // TYPOGRAPHY - Subtitle
  // =====================================================
  if (updates.settings?.subtitleColor !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      subtitleEl.style.color = updates.settings.subtitleColor as string;
    }
  }

  // =====================================================
  // CONTACT INFO - Email
  // =====================================================
  if (updates.content?.email !== undefined) {
    const emailEl = el.querySelector('[data-contact-email]') as HTMLAnchorElement;
    const emailWrapper = el.querySelector('[data-contact-email-wrapper]') as HTMLElement;
    const email = updates.content.email as string;
    if (emailEl) {
      emailEl.textContent = email;
      emailEl.href = email ? `mailto:${email}` : '';
    }
    if (emailWrapper) {
      emailWrapper.style.display = email ? 'block' : 'none';
    }
  }
  
  // =====================================================
  // CONTACT INFO - Phone
  // =====================================================
  if (updates.content?.phone !== undefined) {
    const phoneEl = el.querySelector('[data-contact-phone]') as HTMLAnchorElement;
    const phoneWrapper = el.querySelector('[data-contact-phone-wrapper]') as HTMLElement;
    const phone = updates.content.phone as string;
    if (phoneEl) {
      phoneEl.textContent = phone;
      phoneEl.href = phone ? `tel:${phone}` : '';
    }
    if (phoneWrapper) {
      phoneWrapper.style.display = phone ? 'block' : 'none';
    }
  }
  
  // =====================================================
  // CONTACT INFO - Address
  // =====================================================
  if (updates.content?.address !== undefined) {
    const addressEl = el.querySelector('[data-contact-address]') as HTMLElement;
    const addressWrapper = el.querySelector('[data-contact-address-wrapper]') as HTMLElement;
    if (addressEl) {
      addressEl.textContent = updates.content.address as string;
    }
    if (addressWrapper) {
      addressWrapper.style.display = updates.content.address ? 'block' : 'none';
    }
  }

  // =====================================================
  // CONTACT INFO - Hours
  // =====================================================
  if (updates.content?.hours !== undefined) {
    const hoursEl = el.querySelector('[data-contact-hours]') as HTMLElement;
    const hoursWrapper = el.querySelector('[data-contact-hours-wrapper]') as HTMLElement;
    if (hoursEl) {
      hoursEl.textContent = updates.content.hours as string;
    }
    if (hoursWrapper) {
      hoursWrapper.style.display = updates.content.hours ? 'block' : 'none';
    }
  }

  // =====================================================
  // TYPOGRAPHY - Labels
  // =====================================================
  if (updates.settings?.labelColor !== undefined) {
    el.querySelectorAll('[data-contact-label]').forEach((labelEl) => {
      (labelEl as HTMLElement).style.color = updates.settings!.labelColor as string;
    });
  }

  if (updates.settings?.labelSize !== undefined) {
    el.querySelectorAll('[data-contact-label]').forEach((labelEl) => {
      (labelEl as HTMLElement).style.fontSize = `${updates.settings!.labelSize}px`;
    });
  }

  if (updates.settings?.labelWeight !== undefined) {
    el.querySelectorAll('[data-contact-label]').forEach((labelEl) => {
      (labelEl as HTMLElement).style.fontWeight = updates.settings!.labelWeight as string;
    });
  }

  // =====================================================
  // TYPOGRAPHY - Info Values
  // =====================================================
  if (updates.settings?.infoColor !== undefined) {
    el.querySelectorAll('[data-contact-value]').forEach((valEl) => {
      (valEl as HTMLElement).style.color = updates.settings!.infoColor as string;
    });
  }

  if (updates.settings?.infoSize !== undefined) {
    el.querySelectorAll('[data-contact-value]').forEach((valEl) => {
      (valEl as HTMLElement).style.fontSize = `${updates.settings!.infoSize}px`;
    });
  }

  if (updates.settings?.infoWeight !== undefined) {
    el.querySelectorAll('[data-contact-value]').forEach((valEl) => {
      (valEl as HTMLElement).style.fontWeight = updates.settings!.infoWeight as string;
    });
  }

  // =====================================================
  // INPUT FIELDS STYLING
  // =====================================================
  if (updates.settings?.inputSize !== undefined) {
    el.querySelectorAll('[data-contact-input]').forEach((inputEl) => {
      (inputEl as HTMLElement).style.fontSize = `${updates.settings!.inputSize}px`;
    });
  }

  if (updates.settings?.inputColor !== undefined) {
    el.querySelectorAll('[data-contact-input]').forEach((inputEl) => {
      (inputEl as HTMLElement).style.color = updates.settings!.inputColor as string;
    });
  }

  if (updates.settings?.inputBackgroundColor !== undefined) {
    el.querySelectorAll('[data-contact-input]').forEach((inputEl) => {
      (inputEl as HTMLElement).style.backgroundColor = updates.settings!.inputBackgroundColor as string;
    });
  }

  if (updates.settings?.inputBorderColor !== undefined) {
    el.querySelectorAll('[data-contact-input]').forEach((inputEl) => {
      (inputEl as HTMLElement).style.borderColor = updates.settings!.inputBorderColor as string;
    });
  }

  if (updates.settings?.inputBorderRadius !== undefined) {
    el.querySelectorAll('[data-contact-input]').forEach((inputEl) => {
      (inputEl as HTMLElement).style.borderRadius = `${updates.settings!.inputBorderRadius}px`;
    });
  }

  // =====================================================
  // BUTTON STYLING
  // =====================================================
  if (updates.settings?.buttonBackgroundColor !== undefined) {
    const buttonEl = el.querySelector('[data-contact-button]') as HTMLElement;
    if (buttonEl) {
      buttonEl.style.backgroundColor = updates.settings.buttonBackgroundColor as string;
    }
  }

  if (updates.settings?.buttonTextColor !== undefined) {
    const buttonEl = el.querySelector('[data-contact-button]') as HTMLElement;
    if (buttonEl) {
      buttonEl.style.color = updates.settings.buttonTextColor as string;
    }
  }

  if (updates.settings?.buttonSize !== undefined) {
    const buttonEl = el.querySelector('[data-contact-button]') as HTMLElement;
    if (buttonEl) {
      buttonEl.style.fontSize = `${updates.settings.buttonSize}px`;
    }
  }

  if (updates.settings?.buttonWeight !== undefined) {
    const buttonEl = el.querySelector('[data-contact-button]') as HTMLElement;
    if (buttonEl) {
      buttonEl.style.fontWeight = updates.settings.buttonWeight as string;
    }
  }

  if (updates.settings?.buttonBorderRadius !== undefined) {
    const buttonEl = el.querySelector('[data-contact-button]') as HTMLElement;
    if (buttonEl) {
      buttonEl.style.borderRadius = `${updates.settings.buttonBorderRadius}px`;
    }
  }

  if (updates.settings?.buttonPadding !== undefined) {
    const buttonEl = el.querySelector('[data-contact-button]') as HTMLElement;
    if (buttonEl) {
      buttonEl.style.padding = `${updates.settings.buttonPadding}px ${(updates.settings.buttonPadding as number) * 2}px`;
    }
  }

  // =====================================================
  // TEXT ALIGN
  // =====================================================
  if (updates.settings?.textAlign !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    const infoEl = el.querySelector('[data-contact-info]') as HTMLElement;
    
    const textAlign = updates.settings.textAlign as string;
    
    [titleEl, subtitleEl, infoEl].forEach(elem => {
      if (elem) {
        elem.classList.remove('text-left', 'text-center', 'text-right');
        elem.classList.add(`text-${textAlign}`);
      }
    });
  }

  // =====================================================
  // FORM VISIBILITY
  // =====================================================
  if (updates.content?.showForm !== undefined) {
    const formContainer = el.querySelector('[data-contact-form-container]') as HTMLElement;
    if (formContainer) {
      formContainer.style.display = updates.content.showForm ? 'block' : 'none';
    }
  }

  // =====================================================
  // BUTTON TEXT
  // =====================================================
  if (updates.content?.submitButtonText !== undefined) {
    const buttonEl = el.querySelector('[data-contact-button]') as HTMLElement;
    if (buttonEl) {
      buttonEl.textContent = updates.content.submitButtonText as string || 'שליחה';
    }
  }
}

export function handler(element: Element, updates: Record<string, unknown>) {
  handleContactUpdate(element, updates as Partial<Section>);
}

// Default content for new sections
export const defaultContent = { 
  email: 'info@example.com', 
  phone: '03-1234567', 
  address: '',
  hours: '',
  showForm: true,
  submitButtonText: 'שלח הודעה',
};

// Default settings for new sections
export const defaultSettings = {
  // Title
  titleSize: 30, 
  titleSizeMobile: 24, 
  titleColor: '#000000',
  titleWeight: 'bold',
  // Subtitle
  subtitleSize: 18,
  subtitleSizeMobile: 16,
  subtitleColor: '#666666',
  // Labels (אימייל, טלפון, etc.)
  labelSize: 12,
  labelSizeMobile: 11,
  labelColor: '#6b7280',
  labelWeight: 'normal',
  // Info values
  infoSize: 14,
  infoSizeMobile: 14,
  infoColor: '#111827',
  infoWeight: 'normal',
  // Input fields
  inputSize: 14,
  inputSizeMobile: 14,
  inputColor: '#111827',
  inputBackgroundColor: '#ffffff',
  inputBorderColor: '#d1d5db',
  inputBorderRadius: 4,
  // Button
  buttonSize: 14,
  buttonSizeMobile: 14,
  buttonWeight: 'medium',
  buttonBackgroundColor: '#000000',
  buttonTextColor: '#ffffff',
  buttonBorderRadius: 4,
  buttonPadding: 12,
  // Section
  backgroundColor: '#f9fafb', 
  textColor: '#000000',
  paddingTop: 64, 
  paddingBottom: 64,
  textAlign: 'center',
  sectionWidth: 'full',
  contentWidth: 1200,
  isVisible: true,
};
