'use server';

import { db } from '@/lib/db';
import { orders, shipments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getConfiguredShippingProvider } from '@/lib/shipping/factory';
import type { ShippingProviderType } from '@/lib/shipping/types';

export interface TrackingEvent {
  timestamp: Date;
  description: string;
  location?: string;
  status?: string;
}

export interface TrackingResult {
  success: boolean;
  error?: string;
  orderNumber?: string;
  trackingNumber?: string;
  provider?: string;
  status?: string;
  statusDescription?: string;
  estimatedDelivery?: Date;
  lastUpdate?: Date;
  events?: TrackingEvent[];
}

interface TrackShipmentParams {
  storeId: string;
  orderNumber?: string;
  trackingNumber?: string;
}

export async function trackShipment(params: TrackShipmentParams): Promise<TrackingResult> {
  const { storeId, orderNumber, trackingNumber } = params;

  try {
    // Find shipment by order number or tracking number
    let shipment;

    if (orderNumber) {
      // First find the order
      const [order] = await db
        .select({ id: orders.id, orderNumber: orders.orderNumber })
        .from(orders)
        .where(and(
          eq(orders.storeId, storeId),
          eq(orders.orderNumber, orderNumber)
        ))
        .limit(1);

      if (!order) {
        return { success: false, error: 'לא נמצאה הזמנה עם מספר זה' };
      }

      // Find shipment for this order
      const [foundShipment] = await db
        .select()
        .from(shipments)
        .where(eq(shipments.orderId, order.id))
        .limit(1);

      shipment = foundShipment;
    } else if (trackingNumber) {
      // Find by tracking number directly
      const [foundShipment] = await db
        .select()
        .from(shipments)
        .where(and(
          eq(shipments.storeId, storeId),
          eq(shipments.trackingNumber, trackingNumber)
        ))
        .limit(1);

      shipment = foundShipment;
    } else {
      return { success: false, error: 'נא לספק מספר הזמנה או מספר מעקב' };
    }

    if (!shipment) {
      return { success: false, error: 'לא נמצא משלוח עבור הזמנה זו' };
    }

    // Get order number if we searched by tracking
    let resolvedOrderNumber = orderNumber;
    if (!resolvedOrderNumber && shipment.orderId) {
      const [order] = await db
        .select({ orderNumber: orders.orderNumber })
        .from(orders)
        .where(eq(orders.id, shipment.orderId))
        .limit(1);
      resolvedOrderNumber = order?.orderNumber;
    }

    // Try to get live tracking from provider
    let liveTrackingResult: TrackingResult | null = null;

    if (shipment.provider && shipment.trackingNumber) {
      try {
        const provider = await getConfiguredShippingProvider(
          storeId, 
          shipment.provider as ShippingProviderType
        );

        if (provider) {
          const trackingInfo = await provider.getTrackingInfo({
            storeId,
            providerShipmentId: shipment.providerShipmentId || undefined,
            trackingNumber: shipment.trackingNumber,
          });

          if (trackingInfo.success) {
            liveTrackingResult = {
              success: true,
              orderNumber: resolvedOrderNumber,
              trackingNumber: shipment.trackingNumber,
              provider: shipment.provider,
              status: trackingInfo.status,
              statusDescription: trackingInfo.statusDescription,
              estimatedDelivery: trackingInfo.estimatedDelivery,
              lastUpdate: trackingInfo.actualDelivery,
              events: trackingInfo.events,
            };
          }
        }
      } catch (err) {
        console.error('[Track] Error getting live tracking:', err);
        // Continue with stored data
      }
    }

    // If we got live tracking, return it
    if (liveTrackingResult) {
      return liveTrackingResult;
    }

    // Fall back to stored data
    return {
      success: true,
      orderNumber: resolvedOrderNumber,
      trackingNumber: shipment.trackingNumber || undefined,
      provider: shipment.provider,
      status: shipment.status,
      statusDescription: shipment.statusDescription || undefined,
      estimatedDelivery: shipment.estimatedDelivery || undefined,
      lastUpdate: shipment.updatedAt,
      events: undefined, // No events stored
    };

  } catch (err) {
    console.error('[Track] Error:', err);
    return { success: false, error: 'אירעה שגיאה בחיפוש המשלוח' };
  }
}

