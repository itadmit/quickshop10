/**
 * QuickShop Unified Tracker
 * 
 * Central tracking system that:
 * 1. Dispatches events to all enabled platforms
 * 2. Handles deduplication
 * 3. Sends server-side events for better accuracy
 * 4. Uses requestIdleCallback for non-blocking execution
 */

import type { 
  TrackingEventType, 
  TrackingEventPayload, 
  TrackingConfig, 
  UserData,
  ServerEventData 
} from './types';
import { trackFacebookEvent, initFacebookPixel } from './providers/facebook';
import { trackGoogleEvent, initGoogleAnalytics } from './providers/google';
import { trackTikTokEvent, initTikTokPixel } from './providers/tiktok';
import { trackGTMEvent, initGTM } from './providers/gtm';

// Events that should be sent server-side
// 
// PageView/ViewHomePage → NOT saved to PostgreSQL (would create millions of rows)
//                       → SAVED to Redis as counters (lightweight, aggregated)
// 
// Other events → Saved to PostgreSQL (reasonable volume) + Conversions APIs
//
const SERVER_SIDE_EVENTS: TrackingEventType[] = [
  // Traffic events (saved to Redis only - as counters, not rows)
  'PageView',         // Redis: page view counters + online users
  'ViewHomePage',     // Redis: page view counters + online users
  
  // Funnel events (saved to PostgreSQL + Conversions APIs)
  'ViewContent',      // Product views - important for product popularity
  'AddToCart',        // Cart adds - funnel step
  'RemoveFromCart',   // Cart removes - behavior insight
  'InitiateCheckout', // Checkout start - funnel step
  'AddPaymentInfo',   // Payment step - funnel step
  'Purchase',         // Completed orders - revenue reports
  
  // User events
  'CompleteRegistration', // New customers
  
  // Search (moderate volume, valuable for optimization)
  'Search',           // Search queries - helps improve search
];

// Generate unique event ID for deduplication
function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get cookie value
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

class Tracker {
  private config: TrackingConfig | null = null;
  private initialized = false;
  private eventQueue: Array<() => void> = [];
  private userData: UserData = {};

  /**
   * Initialize tracking with store configuration
   */
  init(config: TrackingConfig): void {
    if (this.initialized) return;
    
    this.config = config;
    this.initialized = true;

    // Initialize providers (deferred to not block rendering)
    if (typeof window !== 'undefined') {
      this.scheduleTask(() => {
        if (config.facebookPixelEnabled && config.facebookPixelId) {
          initFacebookPixel(config.facebookPixelId);
        }
        if (config.googleAnalyticsEnabled && config.googleAnalyticsId) {
          initGoogleAnalytics(config.googleAnalyticsId);
        }
        if (config.tiktokPixelEnabled && config.tiktokPixelId) {
          initTikTokPixel(config.tiktokPixelId);
        }
        if (config.gtmEnabled && config.gtmContainerId) {
          initGTM(config.gtmContainerId);
        }
      });

      // Process queued events
      this.eventQueue.forEach(fn => this.scheduleTask(fn));
      this.eventQueue = [];
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Tracker] Initialized with config:', {
        facebook: config.facebookPixelEnabled,
        google: config.googleAnalyticsEnabled,
        tiktok: config.tiktokPixelEnabled,
        gtm: config.gtmEnabled,
        serverSide: config.serverSideEnabled,
      });
    }
  }

  /**
   * Set user data for enhanced matching
   */
  setUser(userData: UserData): void {
    this.userData = { ...this.userData, ...userData };
  }

  /**
   * Track an event across all enabled platforms
   */
  track<T extends TrackingEventType>(
    eventType: T,
    payload: TrackingEventPayload[T],
    userData?: UserData
  ): void {
    // Merge user data
    const mergedUserData = { ...this.userData, ...userData };

    // If not initialized yet, queue the event
    if (!this.initialized || !this.config) {
      this.eventQueue.push(() => this.track(eventType, payload, userData));
      return;
    }

    const config = this.config;
    const eventId = generateEventId();
    const currency = config.currency || 'ILS';

    // Schedule client-side tracking (non-blocking)
    this.scheduleTask(() => {
      // Facebook Pixel
      if (config.facebookPixelEnabled && config.facebookPixelId) {
        trackFacebookEvent(eventType, payload, currency);
      }

      // Google Analytics 4
      if (config.googleAnalyticsEnabled && config.googleAnalyticsId) {
        trackGoogleEvent(eventType, payload, currency);
      }

      // TikTok Pixel
      if (config.tiktokPixelEnabled && config.tiktokPixelId) {
        trackTikTokEvent(eventType, payload, currency);
      }

      // Google Tag Manager
      if (config.gtmEnabled && config.gtmContainerId) {
        trackGTMEvent(eventType, payload, currency);
      }
    });

    // Server-side tracking for important events
    if (config.serverSideEnabled && SERVER_SIDE_EVENTS.includes(eventType)) {
      this.sendServerEvent(eventType, payload, eventId, mergedUserData);
    }
  }

  /**
   * Send event to server for Conversions API
   */
  private async sendServerEvent<T extends TrackingEventType>(
    eventType: T,
    payload: TrackingEventPayload[T],
    eventId: string,
    userData: UserData
  ): Promise<void> {
    if (!this.config) return;

    try {
      const serverEvent: ServerEventData = {
        eventName: eventType,
        eventTime: Math.floor(Date.now() / 1000),
        eventId,
        userData: {
          email: userData.email,
          phone: userData.phone,
          externalId: userData.externalId,
          fbc: getCookie('_fbc'),
          fbp: getCookie('_fbp'),
        },
        customData: payload as Record<string, unknown>,
        eventSourceUrl: typeof window !== 'undefined' ? window.location.href : '',
        actionSource: 'website',
      };

      // Send to our server-side tracking API
      fetch(`/api/tracking/${this.config.storeSlug}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serverEvent),
        keepalive: true, // Ensure request completes even if page navigates
      }).catch(err => {
        console.error('[Tracker] Server-side tracking error:', err);
      });
    } catch (err) {
      console.error('[Tracker] Failed to send server event:', err);
    }
  }

  /**
   * Schedule a task to run during idle time (non-blocking)
   */
  private scheduleTask(fn: () => void): void {
    if (typeof window === 'undefined') return;

    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(fn);
    } else {
      // Fallback for Safari
      setTimeout(fn, 1);
    }
  }

  // ==========================================
  // Convenience methods for common events
  // ==========================================

  pageView(url: string, title?: string): void {
    this.track('PageView', { url, title });
  }

  viewHomePage(url: string): void {
    this.track('ViewHomePage', { url });
  }

  search(query: string, resultsCount?: number): void {
    this.track('Search', { query, resultsCount });
  }

  viewCategory(categoryId: string, categoryName: string, productsCount?: number): void {
    this.track('ViewCategory', { categoryId, categoryName, productsCount });
  }

  viewProduct(product: TrackingEventPayload['ViewContent']): void {
    this.track('ViewContent', product);
  }

  addToCart(product: TrackingEventPayload['AddToCart']): void {
    this.track('AddToCart', product);
  }

  removeFromCart(product: TrackingEventPayload['RemoveFromCart']): void {
    this.track('RemoveFromCart', product);
  }

  updateCart(productId: string, oldQuantity: number, newQuantity: number): void {
    this.track('UpdateCart', { productId, oldQuantity, newQuantity });
  }

  initiateCheckout(cart: TrackingEventPayload['InitiateCheckout']): void {
    this.track('InitiateCheckout', cart);
  }

  addShippingInfo(cart: TrackingEventPayload['AddShippingInfo']): void {
    this.track('AddShippingInfo', cart);
  }

  addPaymentInfo(cart: TrackingEventPayload['AddPaymentInfo']): void {
    this.track('AddPaymentInfo', cart);
  }

  purchase(order: TrackingEventPayload['Purchase']): void {
    this.track('Purchase', order);
  }

  completeRegistration(method: 'email' | 'google' | 'phone'): void {
    this.track('CompleteRegistration', { method });
  }

  contact(subject?: string): void {
    this.track('Contact', { subject });
  }
}

// Singleton instance
export const tracker = new Tracker();

// Export for convenience
export type { TrackingConfig, TrackingEventType, TrackingEventPayload };

