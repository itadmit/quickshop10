'use client';

import { useEffect, useRef } from 'react';
import { tracker, type ProductData, type CartData, type OrderData } from '@/lib/tracking';

/**
 * Track ViewContent (product view) event
 */
export function TrackViewProduct({ product }: { product: ProductData }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    
    tracker.viewProduct(product);
  }, [product]);

  return null;
}

/**
 * Track ViewCategory event
 */
export function TrackViewCategory({ 
  categoryId, 
  categoryName, 
  productsCount 
}: { 
  categoryId: string; 
  categoryName: string; 
  productsCount?: number;
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    
    tracker.viewCategory(categoryId, categoryName, productsCount);
  }, [categoryId, categoryName, productsCount]);

  return null;
}

/**
 * Track Search event
 */
export function TrackSearch({ 
  query, 
  resultsCount 
}: { 
  query: string; 
  resultsCount?: number;
}) {
  const lastTrackedQuery = useRef<string | null>(null);

  useEffect(() => {
    // Only track if query is new or changed
    if (!query || lastTrackedQuery.current === query) return;
    lastTrackedQuery.current = query;
    
    tracker.search(query, resultsCount);
  }, [query, resultsCount]);

  return null;
}

/**
 * Track InitiateCheckout event
 */
export function TrackInitiateCheckout({ cart }: { cart: CartData }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    
    tracker.initiateCheckout(cart);
  }, [cart]);

  return null;
}

/**
 * Track Purchase event
 */
export function TrackPurchase({ order }: { order: OrderData }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    
    tracker.purchase(order);
  }, [order]);

  return null;
}

/**
 * Track CompleteRegistration event
 */
export function TrackRegistration({ method }: { method: 'email' | 'google' | 'phone' }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    
    tracker.completeRegistration(method);
  }, [method]);

  return null;
}

/**
 * Track AddShippingInfo event
 */
export function TrackAddShippingInfo({ cart, shippingMethod }: { cart: CartData; shippingMethod?: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    
    tracker.addShippingInfo({ ...cart, shippingMethod });
  }, [cart, shippingMethod]);

  return null;
}

/**
 * Track AddPaymentInfo event
 */
export function TrackAddPaymentInfo({ cart, paymentMethod }: { cart: CartData; paymentMethod?: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    
    tracker.addPaymentInfo({ ...cart, paymentMethod });
  }, [cart, paymentMethod]);

  return null;
}




