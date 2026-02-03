/**
 * Public API v1 - Webhooks
 * GET /api/v1/webhooks - List webhooks
 * POST /api/v1/webhooks - Create webhook
 * 
 * Requires: X-API-Key header
 * Scopes: webhooks:read, webhooks:write
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { webhooks, webhookDeliveries } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireApiAuth, apiSuccess, apiError, logApiRequest } from '@/lib/api-auth';
import { randomBytes } from 'crypto';

// Available webhook events
export const WEBHOOK_EVENTS = [
  'order.created',
  'order.updated',
  'order.completed',
  'order.cancelled',
  'order.paid',
  'order.shipped',
  'product.created',
  'product.updated',
  'product.deleted',
  'product.low_stock',
  'product.out_of_stock',
  'customer.created',
  'customer.updated',
  'discount.created',
  'discount.used',
  'contact.created',
  'contact.updated',
] as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[number];

// GET /api/v1/webhooks
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Authenticate
  const result = await requireApiAuth(request, 'webhooks:read');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    
    const offset = (page - 1) * limit;
    
    // Get webhooks with delivery stats
    const webhooksData = await db
      .select({
        id: webhooks.id,
        name: webhooks.name,
        url: webhooks.url,
        events: webhooks.events,
        headers: webhooks.headers,
        is_active: webhooks.isActive,
        last_triggered_at: webhooks.lastTriggeredAt,
        failure_count: webhooks.failureCount,
        created_at: webhooks.createdAt,
        updated_at: webhooks.updatedAt,
        // Recent delivery stats
        success_count: sql<number>`(
          SELECT COUNT(*) FROM webhook_deliveries 
          WHERE webhook_deliveries.webhook_id = ${webhooks.id}
          AND webhook_deliveries.status_code >= 200 
          AND webhook_deliveries.status_code < 300
          AND webhook_deliveries.created_at > now() - interval '7 days'
        )`,
        error_count: sql<number>`(
          SELECT COUNT(*) FROM webhook_deliveries 
          WHERE webhook_deliveries.webhook_id = ${webhooks.id}
          AND (webhook_deliveries.status_code IS NULL OR webhook_deliveries.status_code >= 400)
          AND webhook_deliveries.created_at > now() - interval '7 days'
        )`,
      })
      .from(webhooks)
      .where(eq(webhooks.storeId, auth.store.id))
      .orderBy(desc(webhooks.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(webhooks)
      .where(eq(webhooks.storeId, auth.store.id));
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    
    return apiSuccess(webhooksData.map(w => ({
      ...w,
      // Don't expose secret
      secret: undefined,
      success_count_7d: Number(w.success_count),
      error_count_7d: Number(w.error_count),
    })), {
      pagination: {
        page,
        limit,
        total: Number(count),
        total_pages: Math.ceil(Number(count) / limit),
        has_next: page * limit < Number(count),
        has_prev: page > 1,
      },
      available_events: WEBHOOK_EVENTS,
    });
    
  } catch (error) {
    console.error('API v1 webhooks list error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to fetch webhooks', 500);
  }
}

// POST /api/v1/webhooks
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Authenticate
  const result = await requireApiAuth(request, 'webhooks:write');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return apiError('invalid_request', 'name is required', 400);
    }
    
    if (!body.url) {
      return apiError('invalid_request', 'url is required', 400);
    }
    
    // Validate URL
    try {
      new URL(body.url);
    } catch {
      return apiError('invalid_request', 'Invalid URL format', 400);
    }
    
    if (!body.url.startsWith('https://')) {
      return apiError('invalid_request', 'Webhook URL must use HTTPS', 400);
    }
    
    if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
      return apiError('invalid_request', 'events array is required and must not be empty', 400);
    }
    
    // Validate events
    const invalidEvents = body.events.filter((e: string) => !WEBHOOK_EVENTS.includes(e as WebhookEvent));
    if (invalidEvents.length > 0) {
      return apiError('invalid_request', `Invalid events: ${invalidEvents.join(', ')}`, 400);
    }
    
    // Generate secret for HMAC signing
    const secret = randomBytes(32).toString('hex');
    
    const [newWebhook] = await db.insert(webhooks).values({
      storeId: auth.store.id,
      name: body.name,
      url: body.url,
      secret,
      events: body.events,
      headers: body.headers || {},
      isActive: body.is_active ?? true,
    }).returning();
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 201, Date.now() - startTime);
    
    return apiSuccess({
      id: newWebhook.id,
      name: newWebhook.name,
      url: newWebhook.url,
      secret: newWebhook.secret, // Only returned on creation
      events: newWebhook.events,
      headers: newWebhook.headers,
      is_active: newWebhook.isActive,
      created_at: newWebhook.createdAt,
    }, undefined, 201);
    
  } catch (error) {
    console.error('API v1 webhook create error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to create webhook', 500);
  }
}
