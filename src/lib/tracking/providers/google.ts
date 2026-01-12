/**
 * Google Analytics 4 Provider
 * 
 * Handles client-side GA4 events using gtag
 * Event mapping follows Google's recommended e-commerce events
 */

import type { TrackingEventType, TrackingEventPayload, ProductData } from '../types';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// Map our events to GA4 standard events
const GA4_EVENT_MAP: Record<TrackingEventType, string> = {
  PageView: 'page_view',
  ViewHomePage: 'page_view',
  Search: 'search',
  ViewCategory: 'view_item_list',
  ViewContent: 'view_item',
  AddToCart: 'add_to_cart',
  RemoveFromCart: 'remove_from_cart',
  UpdateCart: 'update_cart', // Custom
  InitiateCheckout: 'begin_checkout',
  AddShippingInfo: 'add_shipping_info',
  AddPaymentInfo: 'add_payment_info',
  Purchase: 'purchase',
  CompleteRegistration: 'sign_up',
  Contact: 'generate_lead',
};

export function initGoogleAnalytics(measurementId: string): void {
  if (typeof window === 'undefined' || !measurementId) return;
  
  // Don't reinitialize
  if (window.gtag) return;

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  
  // IMPORTANT: gtag must push arguments, not an array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.gtag = function() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: true, // Let GA4 handle page views automatically
    cookie_flags: 'SameSite=None;Secure',
  });

  // Load script FIRST (before calling gtag)
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);
}

export function trackGoogleEvent<T extends TrackingEventType>(
  eventType: T,
  payload: TrackingEventPayload[T],
  currency: string = 'ILS'
): void {
  if (typeof window === 'undefined' || !window.gtag) return;

  const eventName = GA4_EVENT_MAP[eventType];
  const params = buildGA4Params(eventType, payload, currency);
  
  window.gtag('event', eventName, params);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[GA4] event:`, eventName, params);
  }
}

function formatProduct(product: ProductData, currency: string, index: number = 0): Record<string, unknown> {
  return {
    item_id: product.id,
    item_name: product.name,
    price: product.price,
    quantity: product.quantity || 1,
    item_category: product.category,
    item_variant: product.variant,
    currency,
    index,
  };
}

function buildGA4Params<T extends TrackingEventType>(
  eventType: T,
  payload: TrackingEventPayload[T],
  currency: string
): Record<string, unknown> {
  switch (eventType) {
    case 'PageView':
    case 'ViewHomePage': {
      const pageData = payload as TrackingEventPayload['PageView'];
      return {
        page_location: pageData.url,
        page_title: pageData.title,
      };
    }

    case 'Search': {
      const searchData = payload as TrackingEventPayload['Search'];
      return {
        search_term: searchData.query,
      };
    }

    case 'ViewCategory': {
      const categoryData = payload as TrackingEventPayload['ViewCategory'];
      return {
        item_list_id: categoryData.categoryId,
        item_list_name: categoryData.categoryName,
      };
    }

    case 'ViewContent': {
      const product = payload as TrackingEventPayload['ViewContent'];
      return {
        currency,
        value: product.price,
        items: [formatProduct(product, currency)],
      };
    }

    case 'AddToCart': {
      const cartProduct = payload as TrackingEventPayload['AddToCart'];
      return {
        currency,
        value: cartProduct.price * cartProduct.quantity,
        items: [formatProduct(cartProduct, currency)],
      };
    }

    case 'RemoveFromCart': {
      const removedProduct = payload as TrackingEventPayload['RemoveFromCart'];
      return {
        currency,
        value: removedProduct.price * removedProduct.quantity,
        items: [formatProduct(removedProduct, currency)],
      };
    }

    case 'UpdateCart': {
      const updateData = payload as TrackingEventPayload['UpdateCart'];
      return {
        item_id: updateData.productId,
        old_quantity: updateData.oldQuantity,
        new_quantity: updateData.newQuantity,
      };
    }

    case 'InitiateCheckout': {
      const checkout = payload as TrackingEventPayload['InitiateCheckout'];
      return {
        currency: checkout.currency || currency,
        value: checkout.totalValue,
        items: checkout.items.map((item, index) => formatProduct(item, checkout.currency || currency, index)),
      };
    }

    case 'AddShippingInfo': {
      const shipping = payload as TrackingEventPayload['AddShippingInfo'];
      return {
        currency: shipping.currency || currency,
        value: shipping.totalValue,
        shipping_tier: shipping.shippingMethod,
        items: shipping.items.map((item, index) => formatProduct(item, shipping.currency || currency, index)),
      };
    }

    case 'AddPaymentInfo': {
      const payment = payload as TrackingEventPayload['AddPaymentInfo'];
      return {
        currency: payment.currency || currency,
        value: payment.totalValue,
        payment_type: payment.paymentMethod,
        items: payment.items.map((item, index) => formatProduct(item, payment.currency || currency, index)),
      };
    }

    case 'Purchase': {
      const order = payload as TrackingEventPayload['Purchase'];
      return {
        transaction_id: order.orderNumber,
        currency: order.currency,
        value: order.value,
        tax: order.taxAmount,
        shipping: order.shippingCost,
        coupon: order.couponCode,
        items: order.items.map((item, index) => formatProduct(item, order.currency, index)),
      };
    }

    case 'CompleteRegistration': {
      const reg = payload as TrackingEventPayload['CompleteRegistration'];
      return {
        method: reg.method,
      };
    }

    case 'Contact': {
      const contact = payload as TrackingEventPayload['Contact'];
      return {
        form_id: 'contact',
        form_name: contact.subject || 'Contact Form',
      };
    }

    default:
      return {};
  }
}



