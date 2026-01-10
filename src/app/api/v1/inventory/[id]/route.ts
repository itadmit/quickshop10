/**
 * Public API v1 - Inventory
 * GET /api/v1/inventory/{id} - Get inventory for product/variant
 * PATCH /api/v1/inventory/{id} - Update inventory
 * 
 * Requires: X-API-Key header
 * Scopes: inventory:read, inventory:write
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { products, productVariants, inventoryLogs } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireApiAuth, apiSuccess, apiError, logApiRequest } from '@/lib/api-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/inventory/{id}
export async function GET(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  const result = await requireApiAuth(request, 'inventory:read');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'product'; // product or variant
    
    if (type === 'variant') {
      // Get variant inventory
      const [variant] = await db
        .select({
          id: productVariants.id,
          productId: productVariants.productId,
          title: productVariants.title,
          sku: productVariants.sku,
          inventory: productVariants.inventory,
        })
        .from(productVariants)
        .innerJoin(products, eq(products.id, productVariants.productId))
        .where(and(
          eq(productVariants.id, id),
          eq(products.storeId, auth.store.id)
        ))
        .limit(1);
      
      if (!variant) {
        await logApiRequest(auth.apiKey.id, auth.store.id, request, 404, Date.now() - startTime);
        return apiError('not_found', 'Variant not found', 404);
      }
      
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
      
      return apiSuccess({
        type: 'variant',
        id: variant.id,
        product_id: variant.productId,
        title: variant.title,
        sku: variant.sku,
        inventory: variant.inventory,
      });
    }
    
    // Get product inventory (including all variants if has variants)
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        has_variants: products.hasVariants,
        track_inventory: products.trackInventory,
        inventory: products.inventory,
      })
      .from(products)
      .where(and(
        eq(products.id, id),
        eq(products.storeId, auth.store.id)
      ))
      .limit(1);
    
    if (!product) {
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 404, Date.now() - startTime);
      return apiError('not_found', 'Product not found', 404);
    }
    
    let variants = null;
    if (product.has_variants) {
      variants = await db
        .select({
          id: productVariants.id,
          title: productVariants.title,
          sku: productVariants.sku,
          inventory: productVariants.inventory,
        })
        .from(productVariants)
        .where(eq(productVariants.productId, product.id));
    }
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    
    return apiSuccess({
      type: 'product',
      id: product.id,
      name: product.name,
      sku: product.sku,
      has_variants: product.has_variants,
      track_inventory: product.track_inventory,
      inventory: product.has_variants ? null : product.inventory,
      variants,
    });
    
  } catch (error) {
    console.error('API v1 inventory get error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to get inventory', 500);
  }
}

// PATCH /api/v1/inventory/{id}
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  const result = await requireApiAuth(request, 'inventory:write');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate body
    if (body.adjustment === undefined && body.inventory === undefined) {
      return apiError('invalid_request', 'Either adjustment or inventory is required', 400);
    }
    
    const type = body.type || 'product';
    
    if (type === 'variant') {
      // Update variant inventory
      const [variant] = await db
        .select({
          id: productVariants.id,
          productId: productVariants.productId,
          inventory: productVariants.inventory,
        })
        .from(productVariants)
        .innerJoin(products, eq(products.id, productVariants.productId))
        .where(and(
          eq(productVariants.id, id),
          eq(products.storeId, auth.store.id)
        ))
        .limit(1);
      
      if (!variant) {
        await logApiRequest(auth.apiKey.id, auth.store.id, request, 404, Date.now() - startTime);
        return apiError('not_found', 'Variant not found', 404);
      }
      
      let newInventory: number;
      const currentInventory = variant.inventory || 0;
      
      if (body.adjustment !== undefined) {
        // Adjustment mode (add/subtract)
        newInventory = Math.max(0, currentInventory + body.adjustment);
      } else {
        // Set mode
        newInventory = Math.max(0, body.inventory);
      }
      
      const [updated] = await db
        .update(productVariants)
        .set({ inventory: newInventory })
        .where(eq(productVariants.id, id))
        .returning();
      
      // Log inventory change
      await db.insert(inventoryLogs).values({
        storeId: auth.store.id,
        productId: variant.productId,
        variantId: id,
        previousQuantity: currentInventory,
        newQuantity: newInventory,
        changeAmount: newInventory - currentInventory,
        reason: 'api',
        note: body.reason || 'API inventory update',
        changedByName: 'API',
      });
      
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
      
      return apiSuccess({
        type: 'variant',
        id: updated.id,
        previous_inventory: currentInventory,
        inventory: updated.inventory,
        adjustment: body.adjustment,
      });
    }
    
    // Update product inventory
    const [product] = await db
      .select({
        id: products.id,
        hasVariants: products.hasVariants,
        inventory: products.inventory,
      })
      .from(products)
      .where(and(
        eq(products.id, id),
        eq(products.storeId, auth.store.id)
      ))
      .limit(1);
    
    if (!product) {
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 404, Date.now() - startTime);
      return apiError('not_found', 'Product not found', 404);
    }
    
    if (product.hasVariants) {
      return apiError('invalid_request', 'Product has variants, update variant inventory instead', 400);
    }
    
    let newInventory: number;
    const currentInventory = product.inventory || 0;
    
    if (body.adjustment !== undefined) {
      newInventory = Math.max(0, currentInventory + body.adjustment);
    } else {
      newInventory = Math.max(0, body.inventory);
    }
    
    const [updated] = await db
      .update(products)
      .set({
        inventory: newInventory,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    
    // Log inventory change
    await db.insert(inventoryLogs).values({
      storeId: auth.store.id,
      productId: id,
      variantId: null,
      previousQuantity: currentInventory,
      newQuantity: newInventory,
      changeAmount: newInventory - currentInventory,
      reason: 'api',
      note: body.reason || 'API inventory update',
      changedByName: 'API',
    });
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    
    return apiSuccess({
      type: 'product',
      id: updated.id,
      previous_inventory: currentInventory,
      inventory: updated.inventory,
      adjustment: body.adjustment,
    });
    
  } catch (error) {
    console.error('API v1 inventory update error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to update inventory', 500);
  }
}

