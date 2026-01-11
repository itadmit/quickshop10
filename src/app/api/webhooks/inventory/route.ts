import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productVariants, stores, inventoryLogs, productWaitlist } from '@/lib/db/schema';
import { eq, and, count, isNull } from 'drizzle-orm';
import { getWaitlistSettings } from '@/lib/waitlist-settings';
import { notifyWaitlistForProduct } from '@/lib/waitlist-notifications';

/**
 * POST /api/webhooks/inventory
 * External API for updating inventory (for integrations, ERP systems, etc.)
 * 
 * Authentication: Bearer token (store API key)
 * 
 * Body:
 * {
 *   "sku": "PROD-123" | "productId": "uuid",
 *   "inventory": 50,
 *   "type": "set" | "add" | "subtract",
 *   "reason": "restock" | "sold" | "adjustment"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Extract auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer '

    // Validate API key and get store
    // In a real implementation, you'd have an api_keys table
    // For now, we'll use a simple store settings check
    const [store] = await db
      .select({ 
        id: stores.id, 
        slug: stores.slug,
        settings: stores.settings 
      })
      .from(stores)
      .limit(1); // TODO: Add where clause for API key lookup

    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { sku, productId, variantId, inventory, type = 'set', reason = 'api' } = body;

    // Validate input
    if (!sku && !productId) {
      return NextResponse.json(
        { success: false, error: 'Either sku or productId is required' },
        { status: 400 }
      );
    }

    if (typeof inventory !== 'number' || inventory < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid inventory value' },
        { status: 400 }
      );
    }

    // Find product/variant
    let targetProductId: string | null = null;
    let targetVariantId: string | null = variantId || null;
    let previousInventory = 0;
    let finalInventory = inventory;

    if (variantId) {
      // Update variant by ID
      const [variant] = await db
        .select({
          id: productVariants.id,
          productId: productVariants.productId,
          inventory: productVariants.inventory,
        })
        .from(productVariants)
        .innerJoin(products, eq(products.id, productVariants.productId))
        .where(and(
          eq(productVariants.id, variantId),
          eq(products.storeId, store.id)
        ))
        .limit(1);

      if (!variant) {
        return NextResponse.json(
          { success: false, error: 'Variant not found' },
          { status: 404 }
        );
      }

      targetProductId = variant.productId;
      previousInventory = variant.inventory || 0;

      // Calculate final inventory based on type
      if (type === 'add') {
        finalInventory = previousInventory + inventory;
      } else if (type === 'subtract') {
        finalInventory = Math.max(0, previousInventory - inventory);
      }

      // Update variant
      await db
        .update(productVariants)
        .set({ inventory: finalInventory })
        .where(eq(productVariants.id, variantId));

    } else {
      // Find product by SKU or ID
      const conditions = [eq(products.storeId, store.id)];
      if (sku) {
        conditions.push(eq(products.sku, sku));
      } else if (productId) {
        conditions.push(eq(products.id, productId));
      }

      const [product] = await db
        .select({
          id: products.id,
          hasVariants: products.hasVariants,
          inventory: products.inventory,
        })
        .from(products)
        .where(and(...conditions))
        .limit(1);

      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      if (product.hasVariants) {
        return NextResponse.json(
          { success: false, error: 'Product has variants, specify variantId' },
          { status: 400 }
        );
      }

      targetProductId = product.id;
      previousInventory = product.inventory || 0;

      // Calculate final inventory
      if (type === 'add') {
        finalInventory = previousInventory + inventory;
      } else if (type === 'subtract') {
        finalInventory = Math.max(0, previousInventory - inventory);
      }

      // Update product
      await db
        .update(products)
        .set({ 
          inventory: finalInventory,
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id));
    }

    // Log inventory change
    await db.insert(inventoryLogs).values({
      storeId: store.id,
      productId: targetProductId,
      variantId: targetVariantId,
      previousQuantity: previousInventory,
      newQuantity: finalInventory,
      changeAmount: finalInventory - previousInventory,
      reason: 'api',
      note: `Webhook: ${reason}`,
      changedByName: 'API Webhook',
    });

    // Check waitlist and auto-notify if needed
    let waitlistNotified = false;
    if (previousInventory === 0 && finalInventory > 0) {
      // Stock restored from 0
      const [waitlistResult] = await db
        .select({ count: count() })
        .from(productWaitlist)
        .where(and(
          eq(productWaitlist.storeId, store.id),
          eq(productWaitlist.productId, targetProductId),
          targetVariantId 
            ? eq(productWaitlist.variantId, targetVariantId)
            : isNull(productWaitlist.variantId),
          eq(productWaitlist.isNotified, false)
        ));

      const waitlistCount = waitlistResult?.count || 0;

      if (waitlistCount > 0) {
        const settings = await getWaitlistSettings(store.id);
        
        if (settings.autoNotify && waitlistCount >= settings.notifyThreshold) {
          try {
            const result = await notifyWaitlistForProduct(
              store.id,
              targetProductId,
              targetVariantId
            );
            waitlistNotified = result.success && result.count > 0;
          } catch (error) {
            console.error('Error auto-notifying waitlist from webhook:', error);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      productId: targetProductId,
      variantId: targetVariantId,
      previousInventory,
      newInventory: finalInventory,
      waitlistNotified,
    });

  } catch (error) {
    console.error('Webhook inventory error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

