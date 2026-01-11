'use server';

import { db } from '@/lib/db';
import { products, productVariants, inventoryLogs, productWaitlist } from '@/lib/db/schema';
import { eq, desc, and, count, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getWaitlistSettings } from '@/lib/waitlist-settings';
import { notifyWaitlistForProduct } from '@/lib/waitlist-notifications';

// Helper to get current user info from session
async function getCurrentUserInfo(): Promise<{ userId: string | null; userName: string }> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie?.value) {
      return { userId: null, userName: 'מערכת' };
    }
    
    // Parse session to get user info
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value.split('.')[0], 'base64').toString()
    );
    
    return {
      userId: sessionData.userId || null,
      userName: sessionData.name || sessionData.email || 'משתמש',
    };
  } catch {
    return { userId: null, userName: 'מערכת' };
  }
}

export async function updateInventory(itemId: string, inventory: number, isVariant: boolean) {
  try {
    const { userId, userName } = await getCurrentUserInfo();
    
    let previousQuantity = 0;
    let productId = itemId;
    let storeId: string | null = null;
    let waitlistCount = 0;
    
    if (isVariant) {
      // Get current variant inventory
      const [variant] = await db
        .select({
          inventory: productVariants.inventory,
          productId: productVariants.productId,
        })
        .from(productVariants)
        .where(eq(productVariants.id, itemId))
        .limit(1);
      
      if (variant) {
        previousQuantity = variant.inventory ?? 0;
        productId = variant.productId;
        
        // Get store ID from product
        const [product] = await db
          .select({ storeId: products.storeId })
          .from(products)
          .where(eq(products.id, productId))
          .limit(1);
        storeId = product?.storeId || null;

        // Check if stock is being increased from 0 and there are waitlist entries
        if (storeId && previousQuantity === 0 && inventory > 0) {
          const [waitlistResult] = await db
            .select({ count: count() })
            .from(productWaitlist)
            .where(and(
              eq(productWaitlist.storeId, storeId),
              eq(productWaitlist.variantId, itemId),
              eq(productWaitlist.isNotified, false)
            ));
          waitlistCount = waitlistResult?.count || 0;
        }
      }
      
      await db
        .update(productVariants)
        .set({ inventory })
        .where(eq(productVariants.id, itemId));
    } else {
      // Get current product inventory
      const [product] = await db
        .select({
          inventory: products.inventory,
          storeId: products.storeId,
        })
        .from(products)
        .where(eq(products.id, itemId))
        .limit(1);
      
      if (product) {
        previousQuantity = product.inventory ?? 0;
        storeId = product.storeId;

        // Check if stock is being increased from 0 and there are waitlist entries
        if (storeId && previousQuantity === 0 && inventory > 0) {
          const [waitlistResult] = await db
            .select({ count: count() })
            .from(productWaitlist)
            .where(and(
              eq(productWaitlist.storeId, storeId),
              eq(productWaitlist.productId, itemId),
              isNull(productWaitlist.variantId),
              eq(productWaitlist.isNotified, false)
            ));
          waitlistCount = waitlistResult?.count || 0;
        }
      }
      
      await db
        .update(products)
        .set({ 
          inventory,
          updatedAt: new Date(),
        })
        .where(eq(products.id, itemId));
    }
    
    // Log the inventory change
    if (storeId) {
      await db.insert(inventoryLogs).values({
        storeId,
        productId,
        variantId: isVariant ? itemId : null,
        previousQuantity,
        newQuantity: inventory,
        changeAmount: inventory - previousQuantity,
        reason: 'manual',
        changedByUserId: userId,
        changedByName: userName,
      });

      // Check if should auto-notify waitlist
      if (waitlistCount > 0) {
        const settings = await getWaitlistSettings(storeId);
        
        if (settings.autoNotify && waitlistCount >= settings.notifyThreshold) {
          // Send notifications automatically in background
          try {
            await notifyWaitlistForProduct(
              storeId,
              productId,
              isVariant ? itemId : null
            );
            console.log(`Auto-notified ${waitlistCount} customers for product ${productId}`);
          } catch (error) {
            console.error('Error auto-notifying waitlist:', error);
            // Don't fail the inventory update if notification fails
          }
        }
      }
    }

    revalidatePath('/shops/[slug]/admin/products/inventory', 'page');
    
    // Return with waitlist info if applicable
    return { 
      success: true, 
      waitlistCount: waitlistCount > 0 ? waitlistCount : undefined,
      productId,
      variantId: isVariant ? itemId : undefined,
    };
  } catch (error) {
    console.error('Error updating inventory:', error);
    return { error: 'אירעה שגיאה בעדכון המלאי' };
  }
}

// Fetch inventory history for a product or variant
export async function getInventoryHistory(
  itemId: string,
  isVariant: boolean
): Promise<{
  logs: Array<{
    id: string;
    previousQuantity: number;
    newQuantity: number;
    changeAmount: number;
    reason: string;
    note: string | null;
    changedByName: string | null;
    createdAt: Date;
  }>;
}> {
  try {
    const logs = await db
      .select({
        id: inventoryLogs.id,
        previousQuantity: inventoryLogs.previousQuantity,
        newQuantity: inventoryLogs.newQuantity,
        changeAmount: inventoryLogs.changeAmount,
        reason: inventoryLogs.reason,
        note: inventoryLogs.note,
        changedByName: inventoryLogs.changedByName,
        createdAt: inventoryLogs.createdAt,
      })
      .from(inventoryLogs)
      .where(
        isVariant
          ? eq(inventoryLogs.variantId, itemId)
          : eq(inventoryLogs.productId, itemId)
      )
      .orderBy(desc(inventoryLogs.createdAt))
      .limit(50);
    
    return { logs };
  } catch (error) {
    console.error('Error fetching inventory history:', error);
    return { logs: [] };
  }
}


