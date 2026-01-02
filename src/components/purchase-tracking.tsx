'use client';

import { useEffect, useRef } from 'react';

interface PurchaseTrackingProps {
  orderNumber: string;
  total: number;
  currency?: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

// Extend Window interface for tracking pixels
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function PurchaseTracking({ orderNumber, total, currency = 'ILS', items }: PurchaseTrackingProps) {
  const tracked = useRef(false);

  useEffect(() => {
    // Prevent double tracking
    if (tracked.current) return;
    tracked.current = true;

    const contentIds = items.map(item => item.productId);
    const contents = items.map(item => ({
      id: item.productId,
      quantity: item.quantity,
      item_price: item.price,
    }));

    // Facebook Pixel - Purchase Event
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        value: total,
        currency: currency,
        content_ids: contentIds,
        content_type: 'product',
        contents: contents,
        order_id: orderNumber,
        num_items: items.reduce((sum, item) => sum + item.quantity, 0),
      });
      console.log('[Tracking] Facebook Pixel Purchase event fired');
    }

    // Google Analytics 4 - purchase event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: orderNumber,
        value: total,
        currency: currency,
        items: items.map(item => ({
          item_id: item.productId,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });
      console.log('[Tracking] Google Analytics purchase event fired');
    }

    // Google Tag Manager dataLayer push
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'purchase',
        ecommerce: {
          transaction_id: orderNumber,
          value: total,
          currency: currency,
          items: items.map(item => ({
            item_id: item.productId,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      });
      console.log('[Tracking] GTM dataLayer purchase event pushed');
    }

    // Log for debugging (can be removed in production)
    console.log('[Tracking] Purchase tracked:', {
      orderNumber,
      total,
      currency,
      itemCount: items.length,
    });
  }, [orderNumber, total, currency, items]);

  // This component doesn't render anything visible
  return null;
}

