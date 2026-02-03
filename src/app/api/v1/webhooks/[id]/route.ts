/**
 * Public API v1 - Single Webhook
 * GET /api/v1/webhooks/{id} - Get webhook details
 * PATCH /api/v1/webhooks/{id} - Update webhook
 * DELETE /api/v1/webhooks/{id} - Delete webhook
 * 
 * Requires: X-API-Key header
 * Scopes: webhooks:read, webhooks:write
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { webhooks, webhookDeliveries } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireApiAuth, apiSuccess, apiError, logApiRequest } from '@/lib/api-auth';
import { WEBHOOK_EVENTS, WebhookEvent } from '../route';
import { randomBytes } from 'crypto';

// GET /api/v1/webhooks/{id}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;
  
  // Authenticate
  const result = await requireApiAuth(request, 'webhooks:read');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const [webhook] = await db
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
      })
      .from(webhooks)
      .where(and(eq(webhooks.id, id), eq(webhooks.storeId, auth.store.id)))
      .limit(1);
    
    if (!webhook) {
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 404, Date.now() - startTime);
      return apiError('not_found', 'Webhook not found', 404);
    }
    
    // Get recent deliveries
    const recentDeliveries = await db
      .select({
        id: webhookDeliveries.id,
        status_code: webhookDeliveries.statusCode,
        error: webhookDeliveries.error,
        duration: webhookDeliveries.duration,
        created_at: webhookDeliveries.createdAt,
      })
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.webhookId, id))
      .orderBy(desc(webhookDeliveries.createdAt))
      .limit(20);
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    
    return apiSuccess({
      ...webhook,
      recent_deliveries: recentDeliveries,
    });
    
  } catch (error) {
    console.error('API v1 webhook get error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to fetch webhook', 500);
  }
}

// PATCH /api/v1/webhooks/{id}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;
  
  // Authenticate
  const result = await requireApiAuth(request, 'webhooks:write');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const body = await request.json();
    
    // Check if webhook exists
    const [existing] = await db
      .select({ id: webhooks.id })
      .from(webhooks)
      .where(and(eq(webhooks.id, id), eq(webhooks.storeId, auth.store.id)))
      .limit(1);
    
    if (!existing) {
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 404, Date.now() - startTime);
      return apiError('not_found', 'Webhook not found', 404);
    }
    
    // Build update object
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    
    if (body.name !== undefined) updateData.name = body.name;
    
    if (body.url !== undefined) {
      try {
        new URL(body.url);
      } catch {
        return apiError('invalid_request', 'Invalid URL format', 400);
      }
      if (!body.url.startsWith('https://')) {
        return apiError('invalid_request', 'Webhook URL must use HTTPS', 400);
      }
      updateData.url = body.url;
    }
    
    if (body.events !== undefined) {
      if (!Array.isArray(body.events) || body.events.length === 0) {
        return apiError('invalid_request', 'events must be a non-empty array', 400);
      }
      const invalidEvents = body.events.filter((e: string) => !WEBHOOK_EVENTS.includes(e as WebhookEvent));
      if (invalidEvents.length > 0) {
        return apiError('invalid_request', `Invalid events: ${invalidEvents.join(', ')}`, 400);
      }
      updateData.events = body.events;
    }
    
    if (body.headers !== undefined) updateData.headers = body.headers;
    if (body.is_active !== undefined) updateData.isActive = body.is_active;
    
    // Allow regenerating secret
    if (body.regenerate_secret === true) {
      updateData.secret = randomBytes(32).toString('hex');
    }
    
    const [updated] = await db
      .update(webhooks)
      .set(updateData)
      .where(and(eq(webhooks.id, id), eq(webhooks.storeId, auth.store.id)))
      .returning();
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    
    return apiSuccess({
      id: updated.id,
      name: updated.name,
      url: updated.url,
      events: updated.events,
      headers: updated.headers,
      is_active: updated.isActive,
      // Return new secret only if it was regenerated
      ...(body.regenerate_secret === true ? { secret: updated.secret } : {}),
      updated_at: updated.updatedAt,
    });
    
  } catch (error) {
    console.error('API v1 webhook update error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to update webhook', 500);
  }
}

// DELETE /api/v1/webhooks/{id}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;
  
  // Authenticate
  const result = await requireApiAuth(request, 'webhooks:write');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const deleteResult = await db
      .delete(webhooks)
      .where(and(eq(webhooks.id, id), eq(webhooks.storeId, auth.store.id)))
      .returning({ id: webhooks.id });
    
    if (deleteResult.length === 0) {
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 404, Date.now() - startTime);
      return apiError('not_found', 'Webhook not found', 404);
    }
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    return apiSuccess({ deleted: true, id });
    
  } catch (error) {
    console.error('API v1 webhook delete error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to delete webhook', 500);
  }
}
