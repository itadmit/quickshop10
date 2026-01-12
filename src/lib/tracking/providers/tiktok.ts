/**
 * TikTok Pixel Provider
 * 
 * Handles client-side TikTok Pixel events
 * Event mapping follows TikTok's standard e-commerce events
 */

import type { TrackingEventType, TrackingEventPayload, ProductData } from '../types';

declare global {
  interface Window {
    ttq?: {
      load: (pixelId: string) => void;
      page: () => void;
      track: (eventName: string, params?: Record<string, unknown>) => void;
      identify: (params: Record<string, unknown>) => void;
    };
    TiktokAnalyticsObject?: string;
  }
}

// Map our events to TikTok standard events
const TIKTOK_EVENT_MAP: Record<TrackingEventType, string | null> = {
  PageView: 'PageView',
  ViewHomePage: 'PageView',
  Search: 'Search',
  ViewCategory: 'ViewCategory', // Custom via track
  ViewContent: 'ViewContent',
  AddToCart: 'AddToCart',
  RemoveFromCart: 'RemoveFromCart', // Custom
  UpdateCart: null, // Not supported in TikTok
  InitiateCheckout: 'InitiateCheckout',
  AddShippingInfo: 'AddShippingInfo', // Custom
  AddPaymentInfo: 'AddPaymentInfo',
  Purchase: 'CompletePayment', // TikTok uses CompletePayment for purchase
  CompleteRegistration: 'CompleteRegistration',
  Contact: 'Contact',
};

export function initTikTokPixel(pixelId: string): void {
  if (typeof window === 'undefined' || !pixelId) return;
  
  // Don't reinitialize
  if (window.ttq) return;

  // Official TikTok Pixel initialization pattern
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const d = document;
  const t = 'ttq';
  
  w.TiktokAnalyticsObject = t;
  const ttq = w[t] = w[t] || [];
  
  ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
  ttq.setAndDefer = function(t: unknown, e: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t as any)[e] = function() {
      // eslint-disable-next-line prefer-rest-params
      (t as any).push([e].concat(Array.prototype.slice.call(arguments, 0)));
    };
  };
  
  for (let i = 0; i < ttq.methods.length; i++) {
    ttq.setAndDefer(ttq, ttq.methods[i]);
  }
  
  ttq.instance = function(t: string) {
    const e = ttq._i[t] || [];
    for (let n = 0; n < ttq.methods.length; n++) {
      ttq.setAndDefer(e, ttq.methods[n]);
    }
    return e;
  };
  
  ttq.load = function(e: string, n?: unknown) {
    const i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
    ttq._i = ttq._i || {};
    ttq._i[e] = [];
    ttq._i[e]._u = i;
    ttq._t = ttq._t || {};
    ttq._t[e] = +new Date();
    ttq._o = ttq._o || {};
    ttq._o[e] = n || {};
    
    const o = d.createElement('script');
    o.type = 'text/javascript';
    o.async = true;
    o.src = i + '?sdkid=' + e + '&lib=' + t;
    const a = d.getElementsByTagName('script')[0];
    if (a && a.parentNode) {
      a.parentNode.insertBefore(o, a);
    } else {
      d.head.appendChild(o);
    }
  };
  
  // Load the pixel
  ttq.load(pixelId);
  ttq.page();
  
  // Set window.ttq for our tracking functions
  window.ttq = {
    load: ttq.load,
    page: () => ttq.page(),
    track: (event: string, params?: Record<string, unknown>) => ttq.track(event, params),
    identify: (params: Record<string, unknown>) => ttq.identify(params),
  };
}

export function trackTikTokEvent<T extends TrackingEventType>(
  eventType: T,
  payload: TrackingEventPayload[T],
  currency: string = 'ILS'
): void {
  if (typeof window === 'undefined' || !window.ttq) return;

  const tiktokEventName = TIKTOK_EVENT_MAP[eventType];
  
  // Skip unsupported events
  if (!tiktokEventName) return;

  const params = buildTikTokParams(eventType, payload, currency);
  
  if (eventType === 'PageView' || eventType === 'ViewHomePage') {
    window.ttq.page();
  } else {
    window.ttq.track(tiktokEventName, params);
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[TikTok Pixel] track:`, tiktokEventName, params);
  }
}

function buildTikTokParams<T extends TrackingEventType>(
  eventType: T,
  payload: TrackingEventPayload[T],
  currency: string
): Record<string, unknown> {
  switch (eventType) {
    case 'Search': {
      const searchData = payload as TrackingEventPayload['Search'];
      return {
        query: searchData.query,
      };
    }

    case 'ViewCategory': {
      const categoryData = payload as TrackingEventPayload['ViewCategory'];
      return {
        content_type: 'product_group',
        content_id: categoryData.categoryId,
        content_name: categoryData.categoryName,
      };
    }

    case 'ViewContent': {
      const product = payload as TrackingEventPayload['ViewContent'];
      return {
        content_type: 'product',
        content_id: product.id,
        content_name: product.name,
        price: product.price,
        currency,
      };
    }

    case 'AddToCart': {
      const cartProduct = payload as TrackingEventPayload['AddToCart'];
      return {
        content_type: 'product',
        content_id: cartProduct.id,
        content_name: cartProduct.name,
        quantity: cartProduct.quantity,
        price: cartProduct.price,
        value: cartProduct.price * cartProduct.quantity,
        currency,
      };
    }

    case 'RemoveFromCart': {
      const removedProduct = payload as TrackingEventPayload['RemoveFromCart'];
      return {
        content_type: 'product',
        content_id: removedProduct.id,
        content_name: removedProduct.name,
        quantity: removedProduct.quantity,
        value: removedProduct.price * removedProduct.quantity,
        currency,
      };
    }

    case 'InitiateCheckout': {
      const checkout = payload as TrackingEventPayload['InitiateCheckout'];
      return {
        content_type: 'product',
        contents: checkout.items.map(item => ({
          content_id: item.id,
          content_name: item.name,
          quantity: item.quantity || 1,
          price: item.price,
        })),
        value: checkout.totalValue,
        currency: checkout.currency || currency,
      };
    }

    case 'AddShippingInfo': {
      const shipping = payload as TrackingEventPayload['AddShippingInfo'];
      return {
        value: shipping.totalValue,
        currency: shipping.currency || currency,
      };
    }

    case 'AddPaymentInfo': {
      const payment = payload as TrackingEventPayload['AddPaymentInfo'];
      return {
        value: payment.totalValue,
        currency: payment.currency || currency,
      };
    }

    case 'Purchase': {
      const order = payload as TrackingEventPayload['Purchase'];
      return {
        content_type: 'product',
        contents: order.items.map(item => ({
          content_id: item.id,
          content_name: item.name,
          quantity: item.quantity || 1,
          price: item.price,
        })),
        value: order.value,
        currency: order.currency,
      };
    }

    case 'CompleteRegistration': {
      return {};
    }

    case 'Contact': {
      return {};
    }

    default:
      return {};
  }
}

