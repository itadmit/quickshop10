/**
 * Mobile Product Inventory API
 * PATCH /api/mobile/products/[id]/inventory
 * 
 * Quick inventory update for mobile app (with adjustment support)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productVariants, inventoryLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireMobileAuthWithStore, hasPermission } from '@/lib/mobile-auth';

// Helper to log inventory change
async function logInventoryChange(
  storeId: string,
  productId: string,
  variantId: string | null,
  previousQuantity: number,
  newQuantity: number,
  userName: string
) {
  await db.insert(inventoryLogs).values({
    storeId,
    productId,
    variantId,
    previousQuantity,
    newQuantity,
    changeAmount: newQuantity - previousQuantity,
    reason: 'mobile',
    note: 'Mobile app inventory update',
    changedByName: userName,
  });
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface InventoryUpdateRequest {
  // For simple products
  inventory?: number;
  
  // For variants
  variants?: Array<{
    id: string;
    inventory: number;
  }>;
  
  // Adjustment mode
  adjustment?: {
    type: 'add' | 'subtract' | 'set';
    value: number;
    variantId?: string;
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireMobileAuthWithStore(request);
    const { id } = await params;
    const body = await request.json() as InventoryUpdateRequest;
    
    // Check permission
    if (!hasPermission(auth, 'products.update')) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Verify product exists
    const [product] = await db
      .select()
      .from(products)
      .where(and(
        eq(products.id, id),
        eq(products.storeId, auth.store.id)
      ))
      .limit(1);
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Handle adjustment mode
    if (body.adjustment) {
      const { type, value, variantId } = body.adjustment;
      
      if (variantId) {
        // Update variant inventory
        const [variant] = await db
          .select()
          .from(productVariants)
          .where(and(
            eq(productVariants.id, variantId),
            eq(productVariants.productId, id)
          ))
          .limit(1);
        
        if (!variant) {
          return NextResponse.json(
            { success: false, error: 'Variant not found' },
            { status: 404 }
          );
        }
        
        let newInventory: number;
        const currentInventory = variant.inventory || 0;
        
        switch (type) {
          case 'add':
            newInventory = currentInventory + value;
            break;
          case 'subtract':
            newInventory = Math.max(0, currentInventory - value);
            break;
          case 'set':
          default:
            newInventory = value;
        }
        
        await db
          .update(productVariants)
          .set({ inventory: newInventory })
          .where(eq(productVariants.id, variantId));
        
        // Log the inventory change
        await logInventoryChange(auth.store.id, id, variantId, currentInventory, newInventory, auth.user.name || 'מובייל');
        
        // Get all variants for response
        const allVariants = await db
          .select({ id: productVariants.id, inventory: productVariants.inventory })
          .from(productVariants)
          .where(eq(productVariants.productId, id));
        
        return NextResponse.json({
          success: true,
          product: {
            id: product.id,
            inventory: null,
            variants: allVariants,
          },
        });
        
      } else {
        // Update product inventory
        if (product.hasVariants) {
          return NextResponse.json(
            { success: false, error: 'Product has variants, specify variantId' },
            { status: 400 }
          );
        }
        
        const currentInventory = product.inventory || 0;
        let newInventory: number;
        
        switch (type) {
          case 'add':
            newInventory = currentInventory + value;
            break;
          case 'subtract':
            newInventory = Math.max(0, currentInventory - value);
            break;
          case 'set':
          default:
            newInventory = value;
        }
        
        const [updated] = await db
          .update(products)
          .set({
            inventory: newInventory,
            updatedAt: new Date(),
            updatedBy: auth.user.id,
          })
          .where(eq(products.id, id))
          .returning();
        
        // Log the inventory change
        await logInventoryChange(auth.store.id, id, null, currentInventory, newInventory, auth.user.name || 'מובייל');
        
        return NextResponse.json({
          success: true,
          product: {
            id: updated.id,
            inventory: updated.inventory,
            variants: [],
          },
        });
      }
    }
    
    // Handle direct inventory set
    if (body.inventory !== undefined && !product.hasVariants) {
      const previousInventory = product.inventory || 0;
      
      const [updated] = await db
        .update(products)
        .set({
          inventory: body.inventory,
          updatedAt: new Date(),
          updatedBy: auth.user.id,
        })
        .where(eq(products.id, id))
        .returning();
      
      // Log the inventory change
      await logInventoryChange(auth.store.id, id, null, previousInventory, body.inventory, auth.user.name || 'מובייל');
      
      return NextResponse.json({
        success: true,
        product: {
          id: updated.id,
          inventory: updated.inventory,
          variants: [],
        },
      });
    }
    
    // Handle variant inventory updates
    if (body.variants && body.variants.length > 0) {
      // Get current inventory for all variants being updated
      const currentVariants = await db
        .select({ id: productVariants.id, inventory: productVariants.inventory })
        .from(productVariants)
        .where(eq(productVariants.productId, id));
      
      const currentInventoryMap = new Map(currentVariants.map(v => [v.id, v.inventory || 0]));
      
      for (const variantUpdate of body.variants) {
        const previousInventory = currentInventoryMap.get(variantUpdate.id) || 0;
        
        await db
          .update(productVariants)
          .set({ inventory: variantUpdate.inventory })
          .where(and(
            eq(productVariants.id, variantUpdate.id),
            eq(productVariants.productId, id)
          ));
        
        // Log each inventory change
        await logInventoryChange(auth.store.id, id, variantUpdate.id, previousInventory, variantUpdate.inventory, auth.user.name || 'מובייל');
      }
      
      // Get all variants for response
      const allVariants = await db
        .select({ id: productVariants.id, inventory: productVariants.inventory })
        .from(productVariants)
        .where(eq(productVariants.productId, id));
      
      // Update product timestamp
      await db
        .update(products)
        .set({
          updatedAt: new Date(),
          updatedBy: auth.user.id,
        })
        .where(eq(products.id, id));
      
      return NextResponse.json({
        success: true,
        product: {
          id: product.id,
          inventory: null,
          variants: allVariants,
        },
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'No inventory update specified' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Mobile inventory update error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}

