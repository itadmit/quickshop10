/**
 * Server-Side Tracking API
 * 
 * Receives events from the client and forwards them to:
 * - Facebook Conversions API
 * - TikTok Events API
 * - Google Analytics Measurement Protocol
 * - Our own analyticsEvents table (for internal reports)
 * 
 * This bypasses ad blockers and iOS 14+ restrictions
 * 
 * SPEED PRINCIPLES:
 * - Fire-and-forget: Don't wait for external APIs
 * - Parallel execution: All platforms receive events simultaneously
 * - Non-blocking DB write: Uses Promise.allSettled
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Lazy load Upstash Redis only if credentials exist (avoids loading in bundle)
const getRedisStats = async () => {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  try {
    const { incrementPageView, trackOnlineUser, incrementFunnelEvent } = await import('@/lib/upstash/page-stats');
    return { incrementPageView, trackOnlineUser, incrementFunnelEvent };
  } catch {
    return null;
  }
};

interface ServerEventRequest {
  eventName: string;
  eventTime: number;
  eventId: string;
  userData: {
    email?: string;
    phone?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbc?: string;
    fbp?: string;
    externalId?: string;
  };
  customData: Record<string, unknown>;
  eventSourceUrl: string;
  actionSource: 'website' | 'app' | 'email';
}

// Hash function for PII data (Facebook requires SHA256)
function hashData(data: string): string {
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

// Map event names to Facebook Conversions API event names
const FB_EVENT_MAP: Record<string, string> = {
  ViewContent: 'ViewContent',
  AddToCart: 'AddToCart',
  InitiateCheckout: 'InitiateCheckout',
  AddPaymentInfo: 'AddPaymentInfo',
  Purchase: 'Purchase',
  CompleteRegistration: 'CompleteRegistration',
};

// Map event names to TikTok Events API event names
const TIKTOK_EVENT_MAP: Record<string, string> = {
  ViewContent: 'ViewContent',
  AddToCart: 'AddToCart',
  InitiateCheckout: 'InitiateCheckout',
  AddPaymentInfo: 'AddPaymentInfo',
  Purchase: 'CompletePayment',
  CompleteRegistration: 'CompleteRegistration',
};


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const event: ServerEventRequest = await request.json();

    // Get store settings
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, storeSlug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const settings = (store.settings as Record<string, unknown>) || {};

    // Get client IP and User Agent
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Enrich event with server-side data
    event.userData.clientIpAddress = clientIp;
    event.userData.clientUserAgent = userAgent;

    // Send to all platforms in parallel (fire-and-forget pattern)
    const promises: Promise<void>[] = [];

    // 1. Save ALL events to Redis (fast, counters, real-time)
    // Redis is the single source of truth for analytics
    // A Cron job aggregates to PostgreSQL for historical reports
    promises.push(saveToRedis(store.id, event, userAgent));

    // 2. Facebook Conversions API
    if (settings.facebookPixelEnabled && settings.facebookAccessToken && settings.facebookPixelId) {
      promises.push(sendToFacebook(event, {
        facebookPixelId: settings.facebookPixelId as string,
        facebookAccessToken: settings.facebookAccessToken as string,
      }));
    }

    // 5. TikTok Events API
    if (settings.tiktokPixelEnabled && settings.tiktokAccessToken && settings.tiktokPixelId) {
      promises.push(sendToTikTok(event, {
        tiktokPixelId: settings.tiktokPixelId as string,
        tiktokAccessToken: settings.tiktokAccessToken as string,
      }));
    }

    // 6. Google Analytics Measurement Protocol
    if (settings.googleAnalyticsEnabled && settings.googleApiSecret && settings.googleAnalyticsId) {
      promises.push(sendToGoogle(event, {
        googleAnalyticsId: settings.googleAnalyticsId as string,
        googleApiSecret: settings.googleApiSecret as string,
      }));
    }

    // Execute all in parallel - don't wait for slow external APIs
    await Promise.allSettled(promises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Server Tracking] Error:', error);
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}

interface FacebookSettings {
  facebookPixelId: string;
  facebookAccessToken: string;
}

async function sendToFacebook(event: ServerEventRequest, settings: FacebookSettings): Promise<void> {
  const fbEventName = FB_EVENT_MAP[event.eventName];
  if (!fbEventName) return;

  const userData: Record<string, string> = {};
  
  // Hash PII data
  if (event.userData.email) {
    userData.em = hashData(event.userData.email);
  }
  if (event.userData.phone) {
    userData.ph = hashData(event.userData.phone.replace(/\D/g, ''));
  }
  if (event.userData.externalId) {
    userData.external_id = hashData(event.userData.externalId);
  }
  if (event.userData.clientIpAddress) {
    userData.client_ip_address = event.userData.clientIpAddress;
  }
  if (event.userData.clientUserAgent) {
    userData.client_user_agent = event.userData.clientUserAgent;
  }
  if (event.userData.fbc) {
    userData.fbc = event.userData.fbc;
  }
  if (event.userData.fbp) {
    userData.fbp = event.userData.fbp;
  }

  const fbEvent = {
    event_name: fbEventName,
    event_time: event.eventTime,
    event_id: event.eventId,
    event_source_url: event.eventSourceUrl,
    action_source: event.actionSource,
    user_data: userData,
    custom_data: event.customData,
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${settings.facebookPixelId}/events?access_token=${settings.facebookAccessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [fbEvent] }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Facebook CAPI] Error:', error);
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[Facebook CAPI] Event sent:', fbEventName);
    }
  } catch (error) {
    console.error('[Facebook CAPI] Request failed:', error);
  }
}

interface TikTokSettings {
  tiktokPixelId: string;
  tiktokAccessToken: string;
}

async function sendToTikTok(event: ServerEventRequest, settings: TikTokSettings): Promise<void> {
  const ttEventName = TIKTOK_EVENT_MAP[event.eventName];
  if (!ttEventName) return;

  const userData: Record<string, string> = {};
  
  // Hash PII data (TikTok also uses SHA256)
  if (event.userData.email) {
    userData.email = hashData(event.userData.email);
  }
  if (event.userData.phone) {
    userData.phone = hashData(event.userData.phone.replace(/\D/g, ''));
  }
  if (event.userData.externalId) {
    userData.external_id = hashData(event.userData.externalId);
  }

  const ttEvent = {
    event: ttEventName,
    event_time: event.eventTime,
    event_id: event.eventId,
    user: {
      ...userData,
      ip: event.userData.clientIpAddress,
      user_agent: event.userData.clientUserAgent,
    },
    properties: event.customData,
    page: {
      url: event.eventSourceUrl,
    },
  };

  try {
    const response = await fetch(
      'https://business-api.tiktok.com/open_api/v1.3/pixel/track/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Token': settings.tiktokAccessToken,
        },
        body: JSON.stringify({
          pixel_code: settings.tiktokPixelId,
          event: ttEvent.event,
          event_id: ttEvent.event_id,
          timestamp: new Date(event.eventTime * 1000).toISOString(),
          context: {
            ip: event.userData.clientIpAddress,
            user_agent: event.userData.clientUserAgent,
            page: { url: event.eventSourceUrl },
            user: userData,
          },
          properties: event.customData,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[TikTok Events API] Error:', error);
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[TikTok Events API] Event sent:', ttEventName);
    }
  } catch (error) {
    console.error('[TikTok Events API] Request failed:', error);
  }
}

interface GoogleSettings {
  googleAnalyticsId: string;
  googleApiSecret: string;
}

async function sendToGoogle(event: ServerEventRequest, settings: GoogleSettings): Promise<void> {
  // Google Measurement Protocol event mapping
  const eventMap: Record<string, string> = {
    ViewContent: 'view_item',
    AddToCart: 'add_to_cart',
    InitiateCheckout: 'begin_checkout',
    AddPaymentInfo: 'add_payment_info',
    Purchase: 'purchase',
    CompleteRegistration: 'sign_up',
  };

  const gaEventName = eventMap[event.eventName];
  if (!gaEventName) return;

  // Generate client_id from external_id or random
  const clientId = event.userData.externalId 
    ? hashData(event.userData.externalId).substring(0, 32)
    : `${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;

  const gaEvent = {
    client_id: clientId,
    events: [
      {
        name: gaEventName,
        params: {
          ...event.customData,
          engagement_time_msec: 100,
        },
      },
    ],
  };

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${settings.googleAnalyticsId}&api_secret=${settings.googleApiSecret}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gaEvent),
      }
    );

    // GA Measurement Protocol returns 204 on success
    if (response.status !== 204 && !response.ok) {
      console.error('[GA Measurement Protocol] Error:', response.status);
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[GA Measurement Protocol] Event sent:', gaEventName);
    }
  } catch (error) {
    console.error('[GA Measurement Protocol] Request failed:', error);
  }
}

// ============================================
// REDIS STORAGE (Single Source of Truth)
// 
// ALL events go to Redis:
// - PageView → page counters + online users
// - ViewContent → product views counter
// - AddToCart → cart events counter
// - Purchase → revenue + orders counter
// - etc.
// 
// A Cron job aggregates to PostgreSQL for historical reports
// ============================================

// Map our events to Redis funnel types
const REDIS_EVENT_MAP: Record<string, 'product_view' | 'add_to_cart' | 'remove_from_cart' | 'begin_checkout' | 'purchase' | 'search' | 'registration' | null> = {
  PageView: null, // Handled separately with incrementPageView
  ViewHomePage: null, // Handled separately with incrementPageView
  ViewContent: 'product_view',
  AddToCart: 'add_to_cart',
  RemoveFromCart: 'remove_from_cart',
  InitiateCheckout: 'begin_checkout',
  AddPaymentInfo: 'begin_checkout',
  Purchase: 'purchase',
  Search: 'search',
  CompleteRegistration: 'registration',
};

async function saveToRedis(
  storeId: string,
  event: ServerEventRequest,
  userAgent: string
): Promise<void> {
  try {
    // Lazy load Redis functions only if configured
    const redisStats = await getRedisStats();
    if (!redisStats) {
      // No Redis configured - fall back to PostgreSQL (legacy mode)
      console.warn('[Redis] Not configured - events not tracked');
      return;
    }

    // Parse URL and extract metadata
    let pageUrl = '/';
    let utmSource: string | undefined;
    let referrer: string | undefined;

    try {
      const url = new URL(event.eventSourceUrl);
      pageUrl = url.pathname;
      utmSource = url.searchParams.get('utm_source') || undefined;
    } catch {
      pageUrl = event.eventSourceUrl;
    }

    // Parse device type from user agent
    const isMobile = /Mobile|Android|iPhone/i.test(userAgent);
    const isTablet = /Tablet|iPad/i.test(userAgent);
    const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

    // Extract data from customData
    const customData = event.customData as Record<string, unknown>;
    const productId = (customData.productId as string) || 
                      (customData.id as string) || 
                      undefined;
    const value = (customData.value as number) || 
                  (customData.price as number) || 
                  (customData.totalValue as number) || 
                  undefined;

    // 1. Track online user (for all events)
    const sessionId = event.userData.fbp || 
                      event.userData.externalId || 
                      `anon_${Date.now()}`;
    await redisStats.trackOnlineUser(storeId, sessionId);

    // 2. Handle PageView events (counters + top pages)
    if (event.eventName === 'PageView' || event.eventName === 'ViewHomePage') {
      await redisStats.incrementPageView(storeId, pageUrl, {
        deviceType,
        utmSource,
        referrer,
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('[Redis] PageView tracked:', { storeId, pageUrl });
      }
      return;
    }

    // 3. Handle funnel events (product_view, add_to_cart, purchase, etc.)
    const funnelEventType = REDIS_EVENT_MAP[event.eventName];
    if (funnelEventType) {
      await redisStats.incrementFunnelEvent(storeId, funnelEventType, {
        productId,
        value,
        currency: (customData.currency as string) || 'ILS',
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('[Redis] Funnel event tracked:', { storeId, type: funnelEventType, productId, value });
      }
    }
  } catch (error) {
    // Silently fail - don't block the response
    console.error('[Redis] Failed to track event:', error);
  }
}

