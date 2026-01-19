/**
 * Facebook Pixel Provider
 * 
 * Handles client-side Facebook Pixel events
 * Event mapping follows Facebook's standard e-commerce events
 */

import type { TrackingEventType, TrackingEventPayload, ProductData } from '../types';

declare global {
  interface Window {
    fbq?: (
      action: 'init' | 'track' | 'trackCustom',
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
    _fbq?: unknown;
  }
}

// Map our events to Facebook standard events
const FB_EVENT_MAP: Record<TrackingEventType, string> = {
  PageView: 'PageView',
  ViewHomePage: 'ViewHomePage', // Custom event to distinguish from PageView
  Search: 'Search',
  ViewCategory: 'ViewCategory', // Custom
  ViewContent: 'ViewContent',
  AddToCart: 'AddToCart',
  RemoveFromCart: 'RemoveFromCart', // Custom
  UpdateCart: 'UpdateCart', // Custom
  InitiateCheckout: 'InitiateCheckout',
  AddShippingInfo: 'AddShippingInfo', // Custom
  AddPaymentInfo: 'AddPaymentInfo',
  Purchase: 'Purchase',
  CompleteRegistration: 'CompleteRegistration',
  Contact: 'Contact',
};

// Custom events that need trackCustom instead of track
const CUSTOM_EVENTS: TrackingEventType[] = [
  'ViewHomePage', // Custom - to distinguish from regular PageView
  'ViewCategory',
  'RemoveFromCart',
  'UpdateCart',
  'AddShippingInfo',
];

export function initFacebookPixel(pixelId: string): void {
  if (typeof window === 'undefined' || !pixelId) return;
  
  // Don't reinitialize
  if (window.fbq) return;

  // Initialize fbq queue
  interface FbqFunction {
    (...args: unknown[]): void;
    callMethod?: (...args: unknown[]) => void;
    queue: unknown[];
    push: (...args: unknown[]) => void;
    loaded: boolean;
    version: string;
  }

  const fbq: FbqFunction = function(...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  } as FbqFunction;
  
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  
  window.fbq = fbq;
  window._fbq = fbq;

  // Load pixel script with defer
  const script = document.createElement('script');
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);

  // Initialize pixel after assigning to window
  if (window.fbq) {
    window.fbq('init', pixelId);
  }
}

export function trackFacebookEvent<T extends TrackingEventType>(
  eventType: T,
  payload: TrackingEventPayload[T],
  currency: string = 'ILS'
): void {
  if (typeof window === 'undefined' || !window.fbq) return;

  const fbEventName = FB_EVENT_MAP[eventType];
  const isCustom = CUSTOM_EVENTS.includes(eventType);
  const method = isCustom ? 'trackCustom' : 'track';

  const params = buildFacebookParams(eventType, payload, currency);
  
  window.fbq(method, fbEventName, params);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[FB Pixel] ${method}:`, fbEventName, params);
  }
}

function buildFacebookParams<T extends TrackingEventType>(
  eventType: T,
  payload: TrackingEventPayload[T],
  currency: string
): Record<string, unknown> {
  switch (eventType) {
    case 'PageView':
      return {};
      
    case 'ViewHomePage':
      return { page_type: 'home' };

    case 'Search': {
      const searchData = payload as TrackingEventPayload['Search'];
      return {
        search_string: searchData.query,
        content_category: searchData.categoryId,
      };
    }

    case 'ViewCategory': {
      const categoryData = payload as TrackingEventPayload['ViewCategory'];
      return {
        content_category: categoryData.categoryName,
        content_ids: [categoryData.categoryId],
        content_type: 'product_group',
      };
    }

    case 'ViewContent': {
      const product = payload as TrackingEventPayload['ViewContent'];
      return {
        content_ids: [product.id],
        content_name: product.name,
        content_type: 'product',
        content_category: product.category,
        value: product.price,
        currency,
      };
    }

    case 'AddToCart': {
      const cartProduct = payload as TrackingEventPayload['AddToCart'];
      return {
        content_ids: [cartProduct.id],
        content_name: cartProduct.name,
        content_type: 'product',
        value: cartProduct.price * cartProduct.quantity,
        currency,
        contents: [{
          id: cartProduct.id,
          quantity: cartProduct.quantity,
          item_price: cartProduct.price,
        }],
      };
    }

    case 'RemoveFromCart': {
      const removedProduct = payload as TrackingEventPayload['RemoveFromCart'];
      return {
        content_ids: [removedProduct.id],
        content_name: removedProduct.name,
        value: removedProduct.price * removedProduct.quantity,
        currency,
      };
    }

    case 'UpdateCart': {
      const updateData = payload as TrackingEventPayload['UpdateCart'];
      return {
        content_ids: [updateData.productId],
        old_quantity: updateData.oldQuantity,
        new_quantity: updateData.newQuantity,
      };
    }

    case 'InitiateCheckout': {
      const checkout = payload as TrackingEventPayload['InitiateCheckout'];
      return {
        content_ids: checkout.items.map(i => i.id),
        content_type: 'product',
        value: checkout.totalValue,
        currency: checkout.currency || currency,
        num_items: checkout.itemCount,
        contents: checkout.items.map(i => ({
          id: i.id,
          quantity: i.quantity || 1,
          item_price: i.price,
        })),
      };
    }

    case 'AddShippingInfo': {
      const shipping = payload as TrackingEventPayload['AddShippingInfo'];
      return {
        content_ids: shipping.items.map(i => i.id),
        value: shipping.totalValue,
        currency: shipping.currency || currency,
        shipping_method: shipping.shippingMethod,
      };
    }

    case 'AddPaymentInfo': {
      const payment = payload as TrackingEventPayload['AddPaymentInfo'];
      return {
        content_ids: payment.items.map(i => i.id),
        value: payment.totalValue,
        currency: payment.currency || currency,
        payment_method: payment.paymentMethod,
      };
    }

    case 'Purchase': {
      const order = payload as TrackingEventPayload['Purchase'];
      return {
        content_ids: order.items.map(i => i.id),
        content_type: 'product',
        value: order.value,
        currency: order.currency,
        order_id: order.orderNumber,
        num_items: order.items.reduce((sum, i) => sum + (i.quantity || 1), 0),
        contents: order.items.map(i => ({
          id: i.id,
          quantity: i.quantity || 1,
          item_price: i.price,
        })),
      };
    }

    case 'CompleteRegistration': {
      const reg = payload as TrackingEventPayload['CompleteRegistration'];
      return {
        status: 'success',
        registration_method: reg.method,
      };
    }

    case 'Contact':
      return {};

    default:
      return {};
  }
}

