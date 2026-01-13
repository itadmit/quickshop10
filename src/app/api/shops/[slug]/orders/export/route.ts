import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, orders, orderItems, customers } from '@/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  address?: string;
  address1?: string;
  address2?: string;
  city?: string;
  zip?: string;
  zipCode?: string;
  phone?: string;
}

// Status labels in Hebrew
const financialLabels: Record<string, string> = {
  pending: 'ממתין לתשלום',
  paid: 'שולם',
  refunded: 'הוחזר',
  partially_refunded: 'הוחזר חלקית',
};

const fulfillmentLabels: Record<string, string> = {
  unfulfilled: 'לא נשלח',
  partial: 'נשלח חלקית',
  fulfilled: 'נשלח',
};

const statusLabels: Record<string, string> = {
  pending: 'ממתין',
  processing: 'בטיפול',
  completed: 'הושלם',
  cancelled: 'בוטל',
  refunded: 'הוחזר',
};

// Escape CSV field (handle commas, quotes, newlines)
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // If contains comma, quote, or newline - wrap in quotes and escape inner quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Format date for CSV
function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Validate date params
    if (!from || !to) {
      return new NextResponse('Missing from/to date parameters', { status: 400 });
    }

    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return new NextResponse('Store not found', { status: 404 });
    }

    // Parse dates
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    // Fetch orders in date range
    const ordersData = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.storeId, store.id),
        gte(orders.createdAt, fromDate),
        lte(orders.createdAt, toDate)
      ))
      .orderBy(desc(orders.createdAt));

    if (ordersData.length === 0) {
      return new NextResponse('No orders found in the specified date range', { status: 404 });
    }

    // Fetch items and customers for all orders in parallel for speed
    const ordersWithDetails = await Promise.all(
      ordersData.map(async (order) => {
        const [items, customer] = await Promise.all([
          db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
          order.customerId
            ? db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1).then(r => r[0] || null)
            : Promise.resolve(null)
        ]);
        return { ...order, items, customer };
      })
    );

    // CSV Headers
    const headers = [
      'מספר הזמנה',
      'תאריך',
      'סטטוס הזמנה',
      'סטטוס תשלום',
      'סטטוס משלוח',
      'שם לקוח',
      'אימייל',
      'טלפון',
      'עיר',
      'כתובת',
      'שיטת משלוח',
      'שם מוצר',
      'וריאציה',
      'מק"ט',
      'כמות',
      'מחיר יחידה',
      'סה"כ פריט',
      'סכום ביניים',
      'הנחה',
      'קוד קופון',
      'משלוח',
      'סה"כ הזמנה',
      'אמצעי תשלום',
      'הערות לקוח',
      'הערות פנימיות',
      'מקור תנועה',
    ];

    // Build CSV rows - each order item gets its own row
    const rows: string[][] = [];
    
    for (const order of ordersWithDetails) {
      const shippingAddress = order.shippingAddress as ShippingAddress | null;
      const customerName = order.customerName || 
        (order.customer ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() : '');
      const customerEmail = order.customerEmail || order.customer?.email || '';
      const customerPhone = order.customerPhone || order.customer?.phone || '';
      
      // If order has items, create a row per item
      if (order.items.length > 0) {
        for (let i = 0; i < order.items.length; i++) {
          const item = order.items[i];
          const isFirstItem = i === 0;
          
          rows.push([
            order.orderNumber,
            formatDate(order.createdAt),
            statusLabels[order.status] || order.status,
            financialLabels[order.financialStatus || 'pending'] || order.financialStatus || '',
            fulfillmentLabels[order.fulfillmentStatus || 'unfulfilled'] || order.fulfillmentStatus || '',
            // Only show customer details on first item row
            isFirstItem ? customerName : '',
            isFirstItem ? customerEmail : '',
            isFirstItem ? customerPhone : '',
            isFirstItem ? (shippingAddress?.city || '') : '',
            isFirstItem ? `${shippingAddress?.address || shippingAddress?.address1 || ''} ${shippingAddress?.address2 || ''}`.trim() : '',
            isFirstItem ? (order.shippingMethod || '') : '',
            // Item details
            item.name ?? '',
            item.variantTitle ?? '',
            item.sku ?? '',
            String(item.quantity ?? 0),
            String(Number(item.price ?? 0).toFixed(2)),
            String(Number(item.total ?? 0).toFixed(2)),
            // Order totals only on first item
            isFirstItem ? String(Number(order.subtotal ?? 0).toFixed(2)) : '',
            isFirstItem ? String(Number(order.discountAmount ?? 0).toFixed(2)) : '',
            isFirstItem ? (order.discountCode ?? '') : '',
            isFirstItem ? String(Number(order.shippingAmount ?? 0).toFixed(2)) : '',
            isFirstItem ? String(Number(order.total ?? 0).toFixed(2)) : '',
            isFirstItem ? (order.paymentMethod ?? '') : '',
            isFirstItem ? (order.note ?? '') : '',
            isFirstItem ? ((order as { internalNote?: string }).internalNote ?? '') : '',
            isFirstItem ? (order.utmSource ?? '') : '',
          ]);
        }
      } else {
        // Order with no items (edge case)
        rows.push([
          order.orderNumber,
          formatDate(order.createdAt),
          statusLabels[order.status] || order.status,
          financialLabels[order.financialStatus || 'pending'] || order.financialStatus || '',
          fulfillmentLabels[order.fulfillmentStatus || 'unfulfilled'] || order.fulfillmentStatus || '',
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress?.city || '',
          `${shippingAddress?.address || shippingAddress?.address1 || ''} ${shippingAddress?.address2 || ''}`.trim(),
          order.shippingMethod || '',
          '', // No items
          '',
          '',
          '',
          '',
          '',
          String(Number(order.subtotal ?? 0).toFixed(2)),
          String(Number(order.discountAmount ?? 0).toFixed(2)),
          order.discountCode ?? '',
          String(Number(order.shippingAmount ?? 0).toFixed(2)),
          String(Number(order.total ?? 0).toFixed(2)),
          order.paymentMethod ?? '',
          order.note ?? '',
          (order as { internalNote?: string }).internalNote ?? '',
          order.utmSource ?? '',
        ]);
      }
    }

    // Build CSV string with BOM for Hebrew support in Excel
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\r\n');

    // Generate filename
    const filename = `orders_${from}_${to}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Export failed: ${errorMessage}`, { status: 500 });
  }
}

