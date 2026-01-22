/**
 * Google Tag Manager Provider
 * 
 * Pushes events to dataLayer for GTM processing
 * Uses GA4 ecommerce data structure for compatibility
 */

import type { TrackingEventType, TrackingEventPayload, ProductData } from '../types';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

// Map our events to GTM/GA4 ecommerce events
const GTM_EVENT_MAP: Record<TrackingEventType, string> = {
  PageView: 'page_view',
  ViewHomePage: 'page_view',
  Search: 'search',
  ViewCategory: 'view_item_list',
  ViewContent: 'view_item',
  AddToCart: 'add_to_cart',
  RemoveFromCart: 'remove_from_cart',
  UpdateCart: 'update_cart',
  InitiateCheckout: 'begin_checkout',
  AddShippingInfo: 'add_shipping_info',
  AddPaymentInfo: 'add_payment_info',
  Purchase: 'purchase',
  CompleteRegistration: 'sign_up',
  Contact: 'generate_lead',
};

export function initGTM(containerId: string): void {
  if (typeof window === 'undefined' || !containerId) return;
  
  // Initialize dataLayer if not exists
  window.dataLayer = window.dataLayer || [];
  
  // Push initial GTM configuration
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  });

  // Load GTM script with defer
  const script = document.createElement('script');
  script.async = true;
  script.defer = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
  document.head.appendChild(script);
}

export function trackGTMEvent<T extends TrackingEventType>(
  eventType: T,
  payload: TrackingEventPayload[T],
  currency: string = 'ILS'
): void {
  if (typeof window === 'undefined' || !window.dataLayer) return;

  const eventName = GTM_EVENT_MAP[eventType];
  const dataLayerEvent = buildDataLayerEvent(eventType, eventName, payload, currency);
  
  // Clear previous ecommerce object (GTM best practice)
  window.dataLayer.push({ ecommerce: null });
  
  // Push new event
  window.dataLayer.push(dataLayerEvent);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[GTM] dataLayer.push:`, dataLayerEvent);
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

function buildDataLayerEvent<T extends TrackingEventType>(
  eventType: T,
  eventName: string,
  payload: TrackingEventPayload[T],
  currency: string
): Record<string, unknown> {
  const baseEvent = { event: eventName };

  switch (eventType) {
    case 'PageView':
    case 'ViewHomePage': {
      const pageData = payload as TrackingEventPayload['PageView'];
      return {
        ...baseEvent,
        page_location: pageData.url,
        page_title: pageData.title,
      };
    }

    case 'Search': {
      const searchData = payload as TrackingEventPayload['Search'];
      return {
        ...baseEvent,
        search_term: searchData.query,
        search_results: searchData.resultsCount,
      };
    }

    case 'ViewCategory': {
      const categoryData = payload as TrackingEventPayload['ViewCategory'];
      return {
        ...baseEvent,
        ecommerce: {
          item_list_id: categoryData.categoryId,
          item_list_name: categoryData.categoryName,
        },
      };
    }

    case 'ViewContent': {
      const product = payload as TrackingEventPayload['ViewContent'];
      return {
        ...baseEvent,
        ecommerce: {
          currency,
          value: product.price,
          items: [formatProduct(product, currency)],
        },
      };
    }

    case 'AddToCart': {
      const cartProduct = payload as TrackingEventPayload['AddToCart'];
      return {
        ...baseEvent,
        ecommerce: {
          currency,
          value: cartProduct.price * cartProduct.quantity,
          items: [formatProduct(cartProduct, currency)],
        },
      };
    }

    case 'RemoveFromCart': {
      const removedProduct = payload as TrackingEventPayload['RemoveFromCart'];
      return {
        ...baseEvent,
        ecommerce: {
          currency,
          value: removedProduct.price * removedProduct.quantity,
          items: [formatProduct(removedProduct, currency)],
        },
      };
    }

    case 'UpdateCart': {
      const updateData = payload as TrackingEventPayload['UpdateCart'];
      return {
        ...baseEvent,
        item_id: updateData.productId,
        old_quantity: updateData.oldQuantity,
        new_quantity: updateData.newQuantity,
      };
    }

    case 'InitiateCheckout': {
      const checkout = payload as TrackingEventPayload['InitiateCheckout'];
      return {
        ...baseEvent,
        ecommerce: {
          currency: checkout.currency || currency,
          value: checkout.totalValue,
          items: checkout.items.map((item, index) => formatProduct(item, checkout.currency || currency, index)),
        },
      };
    }

    case 'AddShippingInfo': {
      const shipping = payload as TrackingEventPayload['AddShippingInfo'];
      return {
        ...baseEvent,
        ecommerce: {
          currency: shipping.currency || currency,
          value: shipping.totalValue,
          shipping_tier: shipping.shippingMethod,
          items: shipping.items.map((item, index) => formatProduct(item, shipping.currency || currency, index)),
        },
      };
    }

    case 'AddPaymentInfo': {
      const payment = payload as TrackingEventPayload['AddPaymentInfo'];
      return {
        ...baseEvent,
        ecommerce: {
          currency: payment.currency || currency,
          value: payment.totalValue,
          payment_type: payment.paymentMethod,
          items: payment.items.map((item, index) => formatProduct(item, payment.currency || currency, index)),
        },
      };
    }

    case 'Purchase': {
      const order = payload as TrackingEventPayload['Purchase'];
      return {
        ...baseEvent,
        ecommerce: {
          transaction_id: order.orderNumber,
          currency: order.currency,
          value: order.value,
          tax: order.taxAmount,
          shipping: order.shippingCost,
          coupon: order.couponCode,
          items: order.items.map((item, index) => formatProduct(item, order.currency, index)),
        },
      };
    }

    case 'CompleteRegistration': {
      const reg = payload as TrackingEventPayload['CompleteRegistration'];
      return {
        ...baseEvent,
        method: reg.method,
      };
    }

    case 'Contact': {
      const contact = payload as TrackingEventPayload['Contact'];
      return {
        ...baseEvent,
        form_id: 'contact',
        form_name: contact.subject || 'Contact Form',
      };
    }

    default:
      return baseEvent;
  }
}





