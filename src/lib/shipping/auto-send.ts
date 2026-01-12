/**
 * Auto-send Shipment
 * Creates a shipment automatically after payment
 */

import { db } from '@/lib/db';
import { shippingProviders, shipments, orders, stores } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getConfiguredShippingProvider } from './factory';
import type { CreateShipmentRequest, ShipmentAddress, ShipmentPackage } from './types';

interface OrderData {
  id: string;
  orderNumber: string;
  storeId: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    address?: string;
    street?: string;
    city?: string;
    zipCode?: string;
    apartment?: string;
    floor?: string;
    entrance?: string;
    phone?: string;
    notes?: string;
  } | null;
}

interface AutoSendResult {
  success: boolean;
  trackingNumber?: string;
  labelUrl?: string;
  error?: string;
  shipmentId?: string;
}

/**
 * Check if auto-send is enabled for a store and send shipment
 */
export async function autoSendShipmentOnPayment(
  storeId: string,
  orderId: string
): Promise<AutoSendResult> {
  try {
    console.log(`Auto-send: Checking for store ${storeId}, order ${orderId}`);
    
    // Find default shipping provider with autoSendOnPayment enabled
    const [providerConfig] = await db
      .select()
      .from(shippingProviders)
      .where(
        and(
          eq(shippingProviders.storeId, storeId),
          eq(shippingProviders.isActive, true),
          eq(shippingProviders.isDefault, true)
        )
      )
      .limit(1);
    
    if (!providerConfig) {
      console.log('Auto-send: No default shipping provider configured');
      return { success: false, error: 'No default shipping provider' };
    }
    
    const settings = providerConfig.settings as Record<string, unknown>;
    
    if (!settings.autoSendOnPayment) {
      console.log('Auto-send: Auto-send is disabled for this provider');
      return { success: false, error: 'Auto-send is disabled' };
    }
    
    // Get order details
    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        storeId: orders.storeId,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        shippingAddress: orders.shippingAddress,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    
    if (!order) {
      console.log('Auto-send: Order not found');
      return { success: false, error: 'Order not found' };
    }
    
    // Get store details for sender address
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);
    
    if (!store) {
      return { success: false, error: 'Store not found' };
    }
    
    // Create shipment
    const result = await createShipmentForOrder(order as OrderData, providerConfig, settings);
    
    return result;
    
  } catch (error) {
    console.error('Auto-send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create shipment for an order
 */
async function createShipmentForOrder(
  order: OrderData,
  providerConfig: typeof shippingProviders.$inferSelect,
  settings: Record<string, unknown>
): Promise<AutoSendResult> {
  try {
    // Get provider instance
    const provider = await getConfiguredShippingProvider(order.storeId, providerConfig.provider);
    
    if (!provider) {
      return { success: false, error: `Provider ${providerConfig.provider} not available` };
    }
    
    // Build recipient address
    const shippingAddr = order.shippingAddress || {};
    const recipient: ShipmentAddress = {
      name: `${shippingAddr.firstName || ''} ${shippingAddr.lastName || ''}`.trim() || order.customerName || '',
      phone: shippingAddr.phone || order.customerPhone || '',
      email: order.customerEmail || undefined,
      street: shippingAddr.address || shippingAddr.street || '',
      city: shippingAddr.city || '',
      zipCode: shippingAddr.zipCode,
      apartment: shippingAddr.apartment,
      floor: shippingAddr.floor,
      entrance: shippingAddr.entrance,
      notes: shippingAddr.notes,
    };
    
    // Build sender address from settings
    const sender: ShipmentAddress = {
      name: (settings.senderName as string) || '',
      phone: (settings.senderPhone as string) || '',
      street: (settings.senderStreet as string) || '',
      city: (settings.senderCity as string) || '',
      zipCode: (settings.senderZipCode as string) || undefined,
    };
    
    // Default package
    const pkg: ShipmentPackage = {
      weight: (settings.defaultWeight as number) || 1,
      width: (settings.defaultWidth as number) || 20,
      height: (settings.defaultHeight as number) || 20,
      length: (settings.defaultLength as number) || 20,
      quantity: 1,
    };
    
    // Build request
    const request: CreateShipmentRequest = {
      storeId: order.storeId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      recipient,
      sender,
      package: pkg,
    };
    
    console.log(`Auto-send: Creating shipment for order ${order.orderNumber}`);
    
    // Create shipment via provider
    const response = await provider.createShipment(request);
    
    if (!response.success) {
      const errorMessage = response.errorMessage || 'Failed to create shipment';
      console.error(`Auto-send: Failed to create shipment - ${errorMessage}`);
      
      // Save error to order for visibility in admin
      await db
        .update(orders)
        .set({
          shipmentError: errorMessage,
          shipmentErrorAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));
      
      return {
        success: false,
        error: errorMessage,
      };
    }
    
    // Save shipment to database
    const [shipment] = await db.insert(shipments).values({
      storeId: order.storeId,
      orderId: order.id,
      provider: providerConfig.provider,
      providerShipmentId: response.providerShipmentId,
      trackingNumber: response.trackingNumber,
      status: 'created',
      statusDescription: 'נוצר אוטומטית',
      labelUrl: response.labelUrl,
      recipientName: recipient.name,
      recipientPhone: recipient.phone,
      recipientAddress: recipient,
      estimatedDelivery: response.estimatedDelivery,
      providerResponse: response.providerResponse,
    }).returning();
    
    // Update order fulfillment status to 'fulfilled' and clear any previous error
    await db
      .update(orders)
      .set({
        fulfillmentStatus: 'fulfilled',
        shipmentError: null,
        shipmentErrorAt: null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));
    
    console.log(`Auto-send: Shipment created successfully - ${response.trackingNumber}`);
    
    return {
      success: true,
      trackingNumber: response.trackingNumber,
      labelUrl: response.labelUrl,
      shipmentId: shipment.id,
    };
    
  } catch (error) {
    console.error('Auto-send createShipmentForOrder error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

