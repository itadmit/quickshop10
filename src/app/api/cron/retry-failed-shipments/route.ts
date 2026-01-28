/**
 * Cron job to retry failed shipment sends
 * 
 * Run periodically (e.g., every 15 minutes) to retry orders that failed with "fetch failed"
 * 
 * Can be triggered by:
 * - QStash: POST /api/cron/retry-failed-shipments
 * - Manual call: GET /api/cron/retry-failed-shipments?secret=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { db } from '@/lib/db';
import { orders, shippingProviders, shipments } from '@/lib/db/schema';
import { eq, and, isNotNull, sql, desc } from 'drizzle-orm';
import { getConfiguredShippingProvider } from '@/lib/shipping/factory';
import type { CreateShipmentRequest, ShipmentAddress, ShipmentPackage } from '@/lib/shipping/types';

// Errors that should be retried
const RETRYABLE_ERRORS = ['fetch failed', 'timeout', 'ECONNREFUSED', 'ETIMEDOUT', 'network'];

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max for this endpoint

// QStash receiver for signature verification
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || '',
});

/**
 * POST - Called by QStash
 */
export async function POST(request: NextRequest) {
  try {
    // Verify QStash signature
    const signature = request.headers.get('upstash-signature');
    const body = await request.text();
    
    if (signature) {
      const isValid = await receiver.verify({
        signature,
        body,
      });
      
      if (!isValid) {
        console.error('[RetryShipments] Invalid QStash signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    return executeRetry();
  } catch (error) {
    console.error('[RetryShipments] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Manual trigger
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (for security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const urlSecret = request.nextUrl.searchParams.get('secret');
    
    // Allow in development or with valid secret
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev && cronSecret && authHeader !== `Bearer ${cronSecret}` && urlSecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return executeRetry();
  } catch (error) {
    console.error('[RetryShipments] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function executeRetry() {
    
    console.log('[RetryShipments] Starting retry job...');
    
    // Find orders with retryable errors (in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // 1. Orders with retryable errors
    const ordersWithErrors = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        storeId: orders.storeId,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        shippingAddress: orders.shippingAddress,
        shipmentError: orders.shipmentError,
        shipmentErrorAt: orders.shipmentErrorAt,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(
          isNotNull(orders.shipmentError),
          eq(orders.fulfillmentStatus, 'unfulfilled'),
          eq(orders.financialStatus, 'paid'),
          sql`${orders.shipmentErrorAt} > ${sevenDaysAgo}`
        )
      )
      .orderBy(desc(orders.shipmentErrorAt))
      .limit(20);
    
    // 2. 🔧 NEW: Orders that were paid but never got shipment (no error, just missed)
    // Look for orders from last 3 days with no shipment error
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const missedOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        storeId: orders.storeId,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        shippingAddress: orders.shippingAddress,
        shipmentError: orders.shipmentError,
        shipmentErrorAt: orders.shipmentErrorAt,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(
          sql`${orders.shipmentError} IS NULL`, // No error recorded
          eq(orders.fulfillmentStatus, 'unfulfilled'),
          eq(orders.financialStatus, 'paid'),
          sql`${orders.status} != 'cancelled'`,
          sql`${orders.createdAt} > ${threeDaysAgo}`,
          sql`${orders.createdAt} < NOW() - INTERVAL '5 minutes'` // Give 5 min grace period
        )
      )
      .orderBy(desc(orders.createdAt))
      .limit(10);
    
    console.log(`[RetryShipments] Found ${ordersWithErrors.length} orders with errors, ${missedOrders.length} missed orders`);
    
    // Filter errored orders to only retryable errors
    const retryableErrorOrders = ordersWithErrors.filter(order => 
      RETRYABLE_ERRORS.some(err => 
        order.shipmentError?.toLowerCase().includes(err.toLowerCase())
      )
    );
    
    // Combine both lists (errored + missed)
    const allOrdersToRetry = [...retryableErrorOrders, ...missedOrders];
    
    if (allOrdersToRetry.length === 0) {
      console.log('[RetryShipments] No orders to retry');
      return NextResponse.json({ 
        success: true, 
        message: 'No orders to retry',
        checkedWithErrors: ordersWithErrors.length,
        checkedMissed: missedOrders.length,
      });
    }
    
    console.log(`[RetryShipments] Processing ${allOrdersToRetry.length} orders (${retryableErrorOrders.length} with errors, ${missedOrders.length} missed)`);
    
    const results: Array<{
      orderNumber: string;
      success: boolean;
      trackingNumber?: string;
      error?: string;
    }> = [];
    
    for (const order of allOrdersToRetry) {
      const isMissed = !order.shipmentError;
      console.log(`[RetryShipments] ${isMissed ? 'Processing missed' : 'Retrying'} ${order.orderNumber}...`);
      
      try {
        // Check if shipment already exists (maybe it was created manually)
        const existingShipment = await db
          .select({ id: shipments.id })
          .from(shipments)
          .where(eq(shipments.orderId, order.id))
          .limit(1);
        
        if (existingShipment.length > 0) {
          console.log(`[RetryShipments] ${order.orderNumber} already has a shipment, skipping`);
          
          // Clear the error and mark as fulfilled
          await db
            .update(orders)
            .set({
              fulfillmentStatus: 'fulfilled',
              shipmentError: null,
              shipmentErrorAt: null,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));
          
          results.push({
            orderNumber: order.orderNumber,
            success: true,
            trackingNumber: 'already_exists',
          });
          continue;
        }
        
        // Get shipping provider config
        const [providerConfig] = await db
          .select()
          .from(shippingProviders)
          .where(
            and(
              eq(shippingProviders.storeId, order.storeId),
              eq(shippingProviders.isActive, true),
              eq(shippingProviders.isDefault, true)
            )
          )
          .limit(1);
        
        if (!providerConfig) {
          console.log(`[RetryShipments] No shipping provider for store ${order.storeId}`);
          results.push({
            orderNumber: order.orderNumber,
            success: false,
            error: 'No shipping provider configured',
          });
          continue;
        }
        
        const settings = providerConfig.settings as Record<string, unknown>;
        
        // Get provider instance
        const provider = await getConfiguredShippingProvider(order.storeId, providerConfig.provider);
        
        if (!provider) {
          results.push({
            orderNumber: order.orderNumber,
            success: false,
            error: `Provider ${providerConfig.provider} not available`,
          });
          continue;
        }
        
        // Build shipment request
        const shippingAddr = (order.shippingAddress || {}) as Record<string, string>;
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
        
        const sender: ShipmentAddress = {
          name: (settings.senderName as string) || '',
          phone: (settings.senderPhone as string) || '',
          street: (settings.senderStreet as string) || '',
          city: (settings.senderCity as string) || '',
          zipCode: (settings.senderZipCode as string) || undefined,
        };
        
        const pkg: ShipmentPackage = {
          weight: (settings.defaultWeight as number) || 1,
          width: (settings.defaultWidth as number) || 20,
          height: (settings.defaultHeight as number) || 20,
          length: (settings.defaultLength as number) || 20,
          quantity: 1,
        };
        
        const request: CreateShipmentRequest = {
          storeId: order.storeId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          recipient,
          sender,
          package: pkg,
        };
        
        // Create shipment
        const response = await provider.createShipment(request);
        
        if (!response.success) {
          // Check if shipment already exists in provider
          const providerResponse = response.providerResponse as Record<string, unknown> | undefined;
          const alreadyExists = providerResponse?.already_exists === true;
          const existingShipmentNumber = providerResponse?.ship_create_num as string | undefined;
          
          if (alreadyExists && existingShipmentNumber) {
            console.log(`[RetryShipments] ${order.orderNumber} - Shipment already exists: ${existingShipmentNumber}`);
            
            // Check if we already have this shipment in our database
            const [existingShipment] = await db
              .select({ id: shipments.id })
              .from(shipments)
              .where(eq(shipments.orderId, order.id))
              .limit(1);
            
            if (existingShipment) {
              // Shipment already in DB, just clear the error
              await db
                .update(orders)
                .set({
                  fulfillmentStatus: 'fulfilled',
                  shipmentError: null,
                  shipmentErrorAt: null,
                  updatedAt: new Date(),
                })
                .where(eq(orders.id, order.id));
              
              results.push({
                orderNumber: order.orderNumber,
                success: true,
                trackingNumber: existingShipmentNumber,
              });
              continue;
            }
            
            // Shipment exists in provider but not in our DB - save it
            // Build label URL for Focus provider
            const FOCUS_BASE_URL = 'https://focusdelivery.co.il/RunCom.Server/Request.aspx';
            const labelUrl = `${FOCUS_BASE_URL}?APPNAME=run&PRGNAME=ship_print_ws&ARGUMENTS=-N${existingShipmentNumber},-A,-A,-A,-A,-A,-A,-N,-A${order.orderNumber || ''}`;
            
            await db.insert(shipments).values({
              storeId: order.storeId,
              orderId: order.id,
              provider: providerConfig.provider,
              providerShipmentId: existingShipmentNumber,
              trackingNumber: existingShipmentNumber,
              status: 'created',
              statusDescription: 'נוצר אוטומטית (retry - משלוח קיים)',
              labelUrl,
              recipientName: recipient.name,
              recipientPhone: recipient.phone,
              recipientAddress: recipient,
              providerResponse: providerResponse,
            });
            
            // Update order - mark as fulfilled and clear error
            await db
              .update(orders)
              .set({
                fulfillmentStatus: 'fulfilled',
                shipmentError: null,
                shipmentErrorAt: null,
                updatedAt: new Date(),
              })
              .where(eq(orders.id, order.id));
            
            console.log(`[RetryShipments] ${order.orderNumber} SUCCESS - Saved existing shipment ${existingShipmentNumber}`);
            
            results.push({
              orderNumber: order.orderNumber,
              success: true,
              trackingNumber: existingShipmentNumber,
            });
            continue;
          }
          
          console.error(`[RetryShipments] ${order.orderNumber} failed: ${response.errorMessage}`);
          
          // Update error (but keep trying later)
          await db
            .update(orders)
            .set({
              shipmentError: response.errorMessage || 'Failed to create shipment',
              shipmentErrorAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));
          
          results.push({
            orderNumber: order.orderNumber,
            success: false,
            error: response.errorMessage,
          });
          continue;
        }
        
        // Save shipment to database
        await db.insert(shipments).values({
          storeId: order.storeId,
          orderId: order.id,
          provider: providerConfig.provider,
          providerShipmentId: response.providerShipmentId,
          trackingNumber: response.trackingNumber,
          status: 'created',
          statusDescription: 'נוצר אוטומטית (retry)',
          labelUrl: response.labelUrl,
          recipientName: recipient.name,
          recipientPhone: recipient.phone,
          recipientAddress: recipient,
          estimatedDelivery: response.estimatedDelivery,
          providerResponse: response.providerResponse,
        });
        
        // Update order - mark as fulfilled and clear error
        await db
          .update(orders)
          .set({
            fulfillmentStatus: 'fulfilled',
            shipmentError: null,
            shipmentErrorAt: null,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));
        
        console.log(`[RetryShipments] ${order.orderNumber} SUCCESS - ${response.trackingNumber}`);
        
        results.push({
          orderNumber: order.orderNumber,
          success: true,
          trackingNumber: response.trackingNumber,
        });
        
      } catch (error) {
        console.error(`[RetryShipments] ${order.orderNumber} exception:`, error);
        results.push({
          orderNumber: order.orderNumber,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      // Small delay between orders to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`[RetryShipments] Completed: ${successCount} success, ${failCount} failed`);
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      successCount,
      failCount,
      results,
    });
}

