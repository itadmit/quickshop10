'use server';

import { db } from '@/lib/db';
import { products, productVariants, inventoryLogs } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

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
    }

    revalidatePath('/shops/[slug]/admin/products/inventory', 'page');
    return { success: true };
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


