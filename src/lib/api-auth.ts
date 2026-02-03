/**
 * Public API Authentication
 * Handles API Key authentication for the public developer API (/api/v1/*)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys, apiKeyLogs, stores } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { createHash } from 'crypto';

// Available API Scopes
export const API_SCOPES = {
  // Orders
  'orders:read': 'Read orders',
  'orders:write': 'Create and update orders',
  
  // Products
  'products:read': 'Read products',
  'products:write': 'Create, update, delete products',
  
  // Customers
  'customers:read': 'Read customers',
  'customers:write': 'Create and update customers',
  
  // Discounts
  'discounts:read': 'Read discounts and coupons',
  'discounts:write': 'Create and manage discounts',
  
  // Inventory
  'inventory:read': 'Read inventory levels',
  'inventory:write': 'Update inventory levels',
  
  // Analytics
  'analytics:read': 'Read store analytics',
  
  // Webhooks
  'webhooks:read': 'Read webhook configurations',
  'webhooks:write': 'Manage webhooks',
} as const;

export type ApiScope = keyof typeof API_SCOPES;

export interface ApiAuthResult {
  apiKey: {
    id: string;
    name: string;
    scopes: ApiScope[];
    rateLimit: number;
  };
  store: {
    id: string;
    slug: string;
    name: string;
  };
}

/**
 * Hash an API key for storage/comparison
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a new API key
 * Returns both the full key (to show once) and the data to store
 */
export function generateApiKey(isLive: boolean = true): {
  fullKey: string;
  keyPrefix: string;
  keyHash: string;
  lastFour: string;
} {
  const prefix = isLive ? 'qs_live_' : 'qs_test_';
  const randomPart = Array.from(
    { length: 32 },
    () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
      Math.floor(Math.random() * 62)
    ]
  ).join('');
  
  const fullKey = `${prefix}${randomPart}`;
  
  return {
    fullKey,
    keyPrefix: fullKey.substring(0, 12), // qs_live_xxxx
    keyHash: hashApiKey(fullKey),
    lastFour: fullKey.slice(-4),
  };
}

/**
 * Validate API key from request headers
 */
export async function validateApiKey(request: NextRequest): Promise<ApiAuthResult | null> {
  const apiKeyHeader = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!apiKeyHeader) {
    return null;
  }
  
  // Check if it's our API key format
  if (!apiKeyHeader.startsWith('qs_live_') && !apiKeyHeader.startsWith('qs_test_')) {
    return null;
  }
  
  const keyHash = hashApiKey(apiKeyHeader);
  
  // Find API key
  const [apiKey] = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      storeId: apiKeys.storeId,
      scopes: apiKeys.scopes,
      rateLimit: apiKeys.rateLimit,
      isActive: apiKeys.isActive,
      expiresAt: apiKeys.expiresAt,
      allowedIps: apiKeys.allowedIps,
    })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);
  
  if (!apiKey) {
    return null;
  }
  
  // Check if active
  if (!apiKey.isActive) {
    return null;
  }
  
  // Check expiration
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    return null;
  }
  
  // Check IP whitelist if configured
  if (apiKey.allowedIps && Array.isArray(apiKey.allowedIps) && apiKey.allowedIps.length > 0) {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip');
    if (clientIp && !apiKey.allowedIps.includes(clientIp)) {
      return null;
    }
  }
  
  // Get store info
  const [store] = await db
    .select({
      id: stores.id,
      slug: stores.slug,
      name: stores.name,
    })
    .from(stores)
    .where(eq(stores.id, apiKey.storeId))
    .limit(1);
  
  if (!store) {
    return null;
  }
  
  // Update last used
  await db
    .update(apiKeys)
    .set({
      lastUsedAt: new Date(),
      totalRequests: sql`${apiKeys.totalRequests} + 1`,
    })
    .where(eq(apiKeys.id, apiKey.id));
  
  return {
    apiKey: {
      id: apiKey.id,
      name: apiKey.name,
      scopes: apiKey.scopes as ApiScope[],
      rateLimit: apiKey.rateLimit,
    },
    store,
  };
}

/**
 * Check if API key has required scope
 */
export function hasScope(auth: ApiAuthResult, requiredScope: ApiScope): boolean {
  // Check for wildcard
  if (auth.apiKey.scopes.includes('*' as ApiScope)) {
    return true;
  }
  
  // Check exact match
  if (auth.apiKey.scopes.includes(requiredScope)) {
    return true;
  }
  
  // Check for read scope when write scope is present
  // e.g., orders:write implies orders:read
  const [resource, action] = requiredScope.split(':');
  if (action === 'read' && auth.apiKey.scopes.includes(`${resource}:write` as ApiScope)) {
    return true;
  }
  
  return false;
}

/**
 * Log API request
 */
export async function logApiRequest(
  apiKeyId: string,
  storeId: string,
  request: NextRequest,
  statusCode: number,
  responseTimeMs: number,
  errorMessage?: string
): Promise<void> {
  try {
    await db.insert(apiKeyLogs).values({
      apiKeyId,
      storeId,
      method: request.method,
      endpoint: new URL(request.url).pathname,
      statusCode,
      responseTimeMs,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                 request.headers.get('x-real-ip') || 
                 undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      errorMessage,
    });
  } catch (error) {
    console.error('Failed to log API request:', error);
  }
}

/**
 * Middleware helper to require API auth with specific scope
 */
export async function requireApiAuth(
  request: NextRequest,
  requiredScope?: ApiScope
): Promise<{ auth: ApiAuthResult } | { error: NextResponse }> {
  const startTime = Date.now();
  
  const auth = await validateApiKey(request);
  
  if (!auth) {
    return {
      error: NextResponse.json(
        {
          error: {
            code: 'unauthorized',
            message: 'Invalid or missing API key',
          },
        },
        { status: 401 }
      ),
    };
  }
  
  if (requiredScope && !hasScope(auth, requiredScope)) {
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 403, Date.now() - startTime, 'Insufficient scope');
    
    return {
      error: NextResponse.json(
        {
          error: {
            code: 'forbidden',
            message: `Missing required scope: ${requiredScope}`,
            required_scope: requiredScope,
            your_scopes: auth.apiKey.scopes,
          },
        },
        { status: 403 }
      ),
    };
  }
  
  return { auth };
}

/**
 * Standard API error response
 */
export function apiError(
  code: string,
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...details,
      },
    },
    { status }
  );
}

/**
 * Standard API success response
 */
export function apiSuccess<T>(data: T, meta?: Record<string, unknown>, status: number = 200): NextResponse {
  return NextResponse.json({
    data,
    meta,
  }, { status });
}

