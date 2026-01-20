/**
 * Universal Product Add-ons HTML Parser
 * 
 * Parses HTML from various e-commerce platforms and converts it to our addon format.
 * Supports: WooCommerce, Shopify, Magento
 */

export interface ParsedAddonOption {
  label: string;
  value: string;
  priceAdjustment: number;
}

export interface ParsedAddon {
  name: string;
  fieldType: 'text' | 'select' | 'checkbox' | 'radio' | 'date';
  placeholder?: string;
  description?: string;
  options?: ParsedAddonOption[];
  priceAdjustment: number;
  isRequired: boolean;
  suggestedFieldType?: 'text' | 'select' | 'checkbox' | 'radio' | 'date';
  warning?: string;
  source?: 'woocommerce' | 'shopify' | 'magento' | 'generic';
}

export interface ParseResult {
  addons: ParsedAddon[];
  errors: string[];
  warnings: string[];
  detectedPlatform?: 'woocommerce' | 'shopify' | 'magento' | 'generic';
}

/**
 * Detect if multiple checkboxes with same name should be radio/select based on description
 */
function detectSingleSelectFromDescription(description: string): boolean {
  const singleSelectPhrases = [
    'בחרו אחד',
    'בחרו אחת',
    'בחר אחד',
    'בחר אחת',
    'choose one',
    'select one',
    'pick one',
    'אפשרות אחת',
    'רק אחד',
    'רק אחת',
  ];
  
  const lowerDesc = description.toLowerCase();
  return singleSelectPhrases.some(phrase => lowerDesc.includes(phrase.toLowerCase()));
}

/**
 * Detect the e-commerce platform from HTML
 */
function detectPlatform(doc: Document): 'woocommerce' | 'shopify' | 'magento' | 'generic' {
  // WooCommerce indicators
  if (doc.querySelector('.wc-pao-addon, .wc-pao-addon-container, [class*="woocommerce"]')) {
    return 'woocommerce';
  }
  
  // Shopify indicators
  if (doc.querySelector('[data-product-form], .product-form__input, [class*="shopify"], .product__option')) {
    return 'shopify';
  }
  
  // Magento indicators
  if (doc.querySelector('.product-options-wrapper, .field.configurable, [class*="magento"], .product-custom-option')) {
    return 'magento';
  }
  
  return 'generic';
}

// ==================== WooCommerce Parser ====================

function parseWooCommerceAddon(container: Element): ParsedAddon | null {
  const legend = container.querySelector('.wc-pao-addon-name, .wc-pao-legend');
  const name = legend?.getAttribute('data-addon-name') || legend?.textContent?.replace('*', '').trim();
  
  if (!name) return null;

  const isRequired = container.classList.contains('wc-pao-required-addon') ||
    container.querySelector('[required]') !== null ||
    container.querySelector('[data-restrictions*="required"]') !== null;

  const descriptionEl = container.querySelector('.wc-pao-addon-description');
  const description = descriptionEl?.textContent?.trim();

  const textInput = container.querySelector('input[type="text"].wc-pao-addon-field');
  const checkboxes = container.querySelectorAll('input[type="checkbox"].wc-pao-addon-field');
  const radioButtons = container.querySelectorAll('input[type="radio"].wc-pao-addon-field');
  const selectEl = container.querySelector('select.wc-pao-addon-field');
  const dateInput = container.querySelector('input[type="date"].wc-pao-addon-field');

  let fieldType: ParsedAddon['fieldType'] = 'text';
  let options: ParsedAddonOption[] = [];
  let priceAdjustment = 0;
  let placeholder = '';
  let suggestedFieldType: ParsedAddon['suggestedFieldType'];
  let warning: string | undefined;

  if (textInput) {
    fieldType = 'text';
    placeholder = textInput.getAttribute('placeholder') || '';
    const price = textInput.getAttribute('data-price');
    if (price) priceAdjustment = parseFloat(price) || 0;
  } else if (dateInput) {
    fieldType = 'date';
  } else if (checkboxes.length > 0) {
    fieldType = 'checkbox';
    
    checkboxes.forEach(checkbox => {
      const label = checkbox.getAttribute('data-label') ||
        checkbox.closest('div')?.querySelector('label')?.textContent?.trim() || '';
      const value = checkbox.getAttribute('value') || label;
      const price = parseFloat(checkbox.getAttribute('data-price') || '0');
      
      options.push({
        label,
        value: decodeURIComponent(value),
        priceAdjustment: price,
      });
    });

    if (checkboxes.length > 1 && description && detectSingleSelectFromDescription(description)) {
      suggestedFieldType = 'radio';
      warning = 'זוהה checkbox עם הנחיה "בחרו אחד" - מומלץ להמיר ל-radio';
    }

    if (checkboxes.length === 1) {
      priceAdjustment = parseFloat(checkboxes[0].getAttribute('data-price') || '0');
      options = [];
    }
  } else if (radioButtons.length > 0) {
    fieldType = 'radio';
    
    radioButtons.forEach(radio => {
      const label = radio.getAttribute('data-label') ||
        radio.closest('div')?.querySelector('label')?.textContent?.trim() || '';
      const value = radio.getAttribute('value') || label;
      const price = parseFloat(radio.getAttribute('data-price') || '0');
      
      options.push({
        label,
        value: decodeURIComponent(value),
        priceAdjustment: price,
      });
    });
  } else if (selectEl) {
    fieldType = 'select';
    
    selectEl.querySelectorAll('option').forEach(option => {
      const label = option.textContent?.trim() || '';
      const value = option.getAttribute('value') || label;
      const price = parseFloat(option.getAttribute('data-price') || '0');
      
      if (value && !option.disabled) {
        options.push({
          label,
          value: decodeURIComponent(value),
          priceAdjustment: price,
        });
      }
    });
  } else {
    const heading = container.querySelector('.wc-pao-addon-heading');
    if (heading) return null;
  }

  return {
    name,
    fieldType,
    placeholder: placeholder || undefined,
    description: description || undefined,
    options: options.length > 0 ? options : undefined,
    priceAdjustment,
    isRequired,
    suggestedFieldType,
    warning,
    source: 'woocommerce',
  };
}

// ==================== Shopify Parser ====================

function parseShopifyAddon(container: Element): ParsedAddon | null {
  // Shopify uses different class structures for product options
  const labelEl = container.querySelector('label, .product-form__label, .form__label');
  const name = labelEl?.textContent?.replace('*', '').trim();
  
  if (!name) return null;

  const isRequired = container.querySelector('[required]') !== null ||
    container.classList.contains('required');

  const descriptionEl = container.querySelector('.product-form__description, .option-description');
  const description = descriptionEl?.textContent?.trim();

  // Check for text input
  const textInput = container.querySelector('input[type="text"], input[type="email"], textarea');
  // Check for select
  const selectEl = container.querySelector('select');
  // Check for radio buttons (Shopify swatches)
  const radioButtons = container.querySelectorAll('input[type="radio"]');
  // Check for checkboxes
  const checkboxes = container.querySelectorAll('input[type="checkbox"]');

  let fieldType: ParsedAddon['fieldType'] = 'text';
  let options: ParsedAddonOption[] = [];
  let priceAdjustment = 0;
  let placeholder = '';

  if (textInput) {
    fieldType = 'text';
    placeholder = textInput.getAttribute('placeholder') || '';
  } else if (selectEl) {
    fieldType = 'select';
    
    selectEl.querySelectorAll('option').forEach(option => {
      const label = option.textContent?.trim() || '';
      const value = option.getAttribute('value') || label;
      // Shopify sometimes has price in data attributes or in the text
      const priceMatch = label.match(/\+?\$?(\d+(?:\.\d{2})?)/);
      const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
      
      if (value && value !== '') {
        options.push({
          label: label.replace(/\+?\$?\d+(?:\.\d{2})?/, '').trim() || label,
          value,
          priceAdjustment: price,
        });
      }
    });
  } else if (radioButtons.length > 0) {
    fieldType = 'radio';
    
    radioButtons.forEach(radio => {
      const radioLabel = container.querySelector(`label[for="${radio.id}"]`);
      const label = radioLabel?.textContent?.trim() || radio.getAttribute('value') || '';
      const value = radio.getAttribute('value') || label;
      
      options.push({
        label,
        value,
        priceAdjustment: 0,
      });
    });
  } else if (checkboxes.length > 0) {
    fieldType = 'checkbox';
    
    if (checkboxes.length === 1) {
      // Single checkbox
      const checkboxLabel = container.querySelector(`label[for="${checkboxes[0].id}"]`);
      placeholder = checkboxLabel?.textContent?.trim() || '';
    } else {
      checkboxes.forEach(checkbox => {
        const checkboxLabel = container.querySelector(`label[for="${checkbox.id}"]`);
        const label = checkboxLabel?.textContent?.trim() || checkbox.getAttribute('value') || '';
        const value = checkbox.getAttribute('value') || label;
        
        options.push({
          label,
          value,
          priceAdjustment: 0,
        });
      });
    }
  }

  return {
    name,
    fieldType,
    placeholder: placeholder || undefined,
    description: description || undefined,
    options: options.length > 0 ? options : undefined,
    priceAdjustment,
    isRequired,
    source: 'shopify',
  };
}

// ==================== Magento Parser ====================

function parseMagentoAddon(container: Element): ParsedAddon | null {
  const labelEl = container.querySelector('label, .label, .product-option-label');
  const name = labelEl?.textContent?.replace('*', '').replace('Required', '').trim();
  
  if (!name) return null;

  const isRequired = container.classList.contains('required') ||
    container.querySelector('.required') !== null ||
    container.querySelector('[required]') !== null;

  const descriptionEl = container.querySelector('.note, .option-description');
  const description = descriptionEl?.textContent?.trim();

  // Check for different input types
  const textInput = container.querySelector('input[type="text"], input[type="email"], textarea');
  const selectEl = container.querySelector('select');
  const radioButtons = container.querySelectorAll('input[type="radio"]');
  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  const dateInput = container.querySelector('input[type="date"], .ui-datepicker-trigger');

  let fieldType: ParsedAddon['fieldType'] = 'text';
  let options: ParsedAddonOption[] = [];
  let priceAdjustment = 0;
  let placeholder = '';

  if (textInput) {
    fieldType = 'text';
    placeholder = textInput.getAttribute('placeholder') || '';
  } else if (dateInput) {
    fieldType = 'date';
  } else if (selectEl) {
    fieldType = 'select';
    
    selectEl.querySelectorAll('option').forEach(option => {
      const label = option.textContent?.trim() || '';
      const value = option.getAttribute('value') || label;
      // Magento often has price in data-price attribute
      const price = parseFloat(option.getAttribute('data-price') || '0');
      
      if (value && value !== '' && value !== 'none') {
        options.push({
          label,
          value,
          priceAdjustment: price,
        });
      }
    });
  } else if (radioButtons.length > 0) {
    fieldType = 'radio';
    
    radioButtons.forEach(radio => {
      const radioLabel = container.querySelector(`label[for="${radio.id}"]`) ||
        radio.closest('div')?.querySelector('label');
      const label = radioLabel?.textContent?.trim() || radio.getAttribute('value') || '';
      const value = radio.getAttribute('value') || label;
      const price = parseFloat(radio.getAttribute('data-price') || '0');
      
      options.push({
        label,
        value,
        priceAdjustment: price,
      });
    });
  } else if (checkboxes.length > 0) {
    fieldType = 'checkbox';
    
    checkboxes.forEach(checkbox => {
      const checkboxLabel = container.querySelector(`label[for="${checkbox.id}"]`) ||
        checkbox.closest('div')?.querySelector('label');
      const label = checkboxLabel?.textContent?.trim() || checkbox.getAttribute('value') || '';
      const value = checkbox.getAttribute('value') || label;
      const price = parseFloat(checkbox.getAttribute('data-price') || '0');
      
      options.push({
        label,
        value,
        priceAdjustment: price,
      });
    });
    
    if (checkboxes.length === 1) {
      priceAdjustment = parseFloat(checkboxes[0].getAttribute('data-price') || '0');
      options = [];
    }
  }

  return {
    name,
    fieldType,
    placeholder: placeholder || undefined,
    description: description || undefined,
    options: options.length > 0 ? options : undefined,
    priceAdjustment,
    isRequired,
    source: 'magento',
  };
}

// ==================== Generic Parser ====================

function parseGenericAddon(container: Element): ParsedAddon | null {
  // Try to find any label
  const labelEl = container.querySelector('label, legend, .label, h3, h4');
  const name = labelEl?.textContent?.replace('*', '').trim();
  
  if (!name) return null;

  const isRequired = container.querySelector('[required]') !== null ||
    container.textContent?.includes('*') || false;

  // Check for all input types
  const textInput = container.querySelector('input[type="text"], input[type="email"], textarea');
  const selectEl = container.querySelector('select');
  const radioButtons = container.querySelectorAll('input[type="radio"]');
  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  const dateInput = container.querySelector('input[type="date"]');

  let fieldType: ParsedAddon['fieldType'] = 'text';
  let options: ParsedAddonOption[] = [];
  let placeholder = '';

  if (textInput) {
    fieldType = 'text';
    placeholder = textInput.getAttribute('placeholder') || '';
  } else if (dateInput) {
    fieldType = 'date';
  } else if (selectEl) {
    fieldType = 'select';
    selectEl.querySelectorAll('option').forEach(option => {
      const label = option.textContent?.trim() || '';
      const value = option.getAttribute('value') || label;
      if (value) {
        options.push({ label, value, priceAdjustment: 0 });
      }
    });
  } else if (radioButtons.length > 0) {
    fieldType = 'radio';
    radioButtons.forEach(radio => {
      const label = radio.closest('label')?.textContent?.trim() ||
        container.querySelector(`label[for="${radio.id}"]`)?.textContent?.trim() ||
        radio.getAttribute('value') || '';
      options.push({ label, value: radio.getAttribute('value') || label, priceAdjustment: 0 });
    });
  } else if (checkboxes.length > 0) {
    fieldType = 'checkbox';
    if (checkboxes.length > 1) {
      checkboxes.forEach(checkbox => {
        const label = checkbox.closest('label')?.textContent?.trim() ||
          container.querySelector(`label[for="${checkbox.id}"]`)?.textContent?.trim() ||
          checkbox.getAttribute('value') || '';
        options.push({ label, value: checkbox.getAttribute('value') || label, priceAdjustment: 0 });
      });
    }
  }

  return {
    name,
    fieldType,
    placeholder: placeholder || undefined,
    options: options.length > 0 ? options : undefined,
    priceAdjustment: 0,
    isRequired,
    source: 'generic',
  };
}

// ==================== Main Parser ====================

/**
 * Main parser function - takes HTML from any platform and returns parsed addons
 */
export function parseAddonsHtml(html: string): ParseResult {
  const result: ParseResult = {
    addons: [],
    errors: [],
    warnings: [],
  };

  if (typeof window === 'undefined') {
    result.errors.push('Server-side parsing requires jsdom - please use client-side parsing');
    return result;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Detect platform
  const platform = detectPlatform(doc);
  result.detectedPlatform = platform;

  // Get containers based on platform
  let containers: NodeListOf<Element> | Element[] = [];

  switch (platform) {
    case 'woocommerce':
      containers = doc.querySelectorAll('.wc-pao-addon-container, .wc-pao-addon');
      break;
    case 'shopify':
      containers = doc.querySelectorAll('.product-form__input, .product__option, [data-option], .selector-wrapper');
      break;
    case 'magento':
      containers = doc.querySelectorAll('.product-custom-option, .field.configurable, .product-options-wrapper > .field');
      break;
    default:
      // Generic: look for any form field containers
      containers = doc.querySelectorAll('.form-group, .field, .option, fieldset, [class*="option"], [class*="field"]');
  }

  if (containers.length === 0) {
    result.errors.push('לא נמצאו תוספות בקוד HTML. נסה להדביק את כל קוד הטופס מעמוד המוצר.');
    return result;
  }

  result.warnings.push(`זוהתה פלטפורמה: ${platform === 'woocommerce' ? 'WooCommerce' : platform === 'shopify' ? 'Shopify' : platform === 'magento' ? 'Magento' : 'כללי'}`);

  containers.forEach((container, index) => {
    try {
      let addon: ParsedAddon | null = null;

      switch (platform) {
        case 'woocommerce':
          addon = parseWooCommerceAddon(container);
          break;
        case 'shopify':
          addon = parseShopifyAddon(container);
          break;
        case 'magento':
          addon = parseMagentoAddon(container);
          break;
        default:
          addon = parseGenericAddon(container);
      }

      if (addon) {
        result.addons.push(addon);
        if (addon.warning) {
          result.warnings.push(`${addon.name}: ${addon.warning}`);
        }
      }
    } catch (error) {
      result.errors.push(`שגיאה בניתוח תוספת ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Remove duplicate addons by name
  const uniqueAddons = result.addons.filter((addon, index, self) =>
    index === self.findIndex(a => a.name === addon.name)
  );
  result.addons = uniqueAddons;

  return result;
}

/**
 * Convert parsed addon to our AddonFormData format
 */
export function convertToAddonFormData(parsed: ParsedAddon) {
  const fieldType = parsed.suggestedFieldType || parsed.fieldType;
  
  return {
    name: parsed.name,
    fieldType,
    placeholder: parsed.placeholder,
    options: parsed.options?.map(opt => ({
      label: opt.label,
      value: opt.value.toLowerCase().replace(/\s+/g, '_'),
      priceAdjustment: opt.priceAdjustment,
    })),
    priceAdjustment: parsed.priceAdjustment,
    isRequired: parsed.isRequired,
    maxLength: undefined,
    isActive: true,
  };
}

