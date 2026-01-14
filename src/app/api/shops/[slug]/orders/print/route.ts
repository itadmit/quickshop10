import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, orders, orderItems, customers } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// Generate printable HTML for orders
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return new NextResponse('Missing order IDs', { status: 400 });
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

    // Parse order IDs
    const orderIds = ids.split(',').filter(Boolean);

    // Fetch all orders
    const ordersData = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.storeId, store.id),
        inArray(orders.id, orderIds)
      ));

    // Fetch items and customers for all orders in parallel
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

    // Sort by selection order
    const sortedOrders = orderIds
      .map(id => ordersWithDetails.find(o => o.id === id))
      .filter(Boolean);

    // Get print settings from store
    const storeSettings = (store.settings as Record<string, unknown>) || {};
    const printSettings = (storeSettings.print as Record<string, boolean>) || {};

    // Generate HTML with settings
    const html = generatePrintHTML(sortedOrders, store, printSettings);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Print error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
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

// Default print settings (all visible)
const defaultPrintSettings = {
  showProductImage: true,
  showProductPrice: true,
  showProductSku: true,
  showProductVariant: true,
  showOrderTotal: true,
  showSubtotal: true,
  showShipping: true,
  showDiscount: true,
  showCustomerDetails: true,
  showShippingAddress: true,
  showCustomerPhone: true,
  showStatusBadges: true,
  showOrderNotes: true,
  showThankYouMessage: true,
  showStoreLogo: true,
};

function generatePrintHTML(orders: any[], store: any, settings: Record<string, boolean>): string {
  // Merge with defaults
  const ps = { ...defaultPrintSettings, ...settings };
  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('he-IL', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const financialLabels: Record<string, string> = {
    pending: 'ממתין לתשלום',
    paid: 'שולם',
    partially_paid: 'שולם חלקית',
    refunded: 'הוחזר',
    partially_refunded: 'הוחזר חלקית',
  };

  const fulfillmentLabels: Record<string, string> = {
    unfulfilled: 'לא נשלח',
    partial: 'נשלח חלקית',
    fulfilled: 'נשלח',
  };

  const statusLabels: Record<string, string> = {
    cancelled: 'בוטל',
  };

  const ordersHTML = orders.map((order, index) => {
    const shippingAddress = order.shippingAddress as ShippingAddress | null;
    
    // Build dynamic table headers based on settings
    const tableHeaders = [
      '<th class="col-product">מוצר</th>',
      ps.showProductSku ? '<th class="col-sku">מק"ט</th>' : '',
      '<th class="col-qty">כמות</th>',
      ps.showProductPrice ? '<th class="col-price">מחיר</th>' : '',
      ps.showProductPrice ? '<th class="col-total">סה"כ</th>' : '',
    ].filter(Boolean).join('');
    
    return `
      <div class="order-page ${index > 0 ? 'page-break' : ''}">
        <!-- Header -->
        <header class="print-header">
          <div class="store-info">
            ${ps.showStoreLogo && store.logoUrl 
              ? `<img src="${store.logoUrl}" alt="${store.name}" class="store-logo" />`
              : `<h1 class="store-name">${store.name}</h1>`
            }
          </div>
          <div class="order-info">
            <h2 class="order-number">הזמנה #${order.orderNumber}</h2>
            <p class="order-date">${formatDate(order.createdAt)}</p>
          </div>
        </header>

        ${ps.showStatusBadges ? `
        <!-- Status -->
        <div class="status-bar">
          <span class="status-badge ${order.financialStatus === 'paid' ? 'paid' : ''}">
            ${financialLabels[order.financialStatus || 'pending']}
          </span>
          <span class="status-badge ${order.fulfillmentStatus === 'fulfilled' ? 'fulfilled' : ''}">
            ${order.status === 'cancelled' ? statusLabels.cancelled : fulfillmentLabels[order.fulfillmentStatus || 'unfulfilled']}
          </span>
        </div>
        ` : ''}

        <!-- Customer & Address -->
        ${ps.showCustomerDetails || ps.showShippingAddress ? `
        <div class="print-columns">
          ${ps.showCustomerDetails ? `
          <div class="print-column">
            <h3>פרטי לקוח</h3>
            <div class="info-block">
              <p class="customer-name">${order.customer?.firstName || ''} ${order.customer?.lastName || ''}</p>
              <p>${order.customer?.email || order.customerEmail || ''}</p>
              ${ps.showCustomerPhone && (order.customer?.phone || order.customerPhone) ? `<p>${order.customer?.phone || order.customerPhone}</p>` : ''}
            </div>
          </div>
          ` : ''}
          ${ps.showShippingAddress ? `
          <div class="print-column">
            <h3>כתובת למשלוח</h3>
            ${shippingAddress ? `
              <div class="info-block">
                <p>${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}</p>
                <p>${shippingAddress.address || shippingAddress.address1 || ''}</p>
                ${shippingAddress.address2 ? `<p>${shippingAddress.address2}</p>` : ''}
                <p>${shippingAddress.city || ''} ${shippingAddress.zip || shippingAddress.zipCode || ''}</p>
                ${shippingAddress.phone ? `<p>טלפון: ${shippingAddress.phone}</p>` : ''}
              </div>
            ` : '<p class="no-data">לא צוינה כתובת</p>'}
          </div>
          ` : ''}
        </div>
        ` : ''}

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              ${tableHeaders}
            </tr>
          </thead>
          <tbody>
            ${order.items.map((item: any) => `
              <tr>
                <td class="col-product">
                  <div class="product-cell">
                    ${ps.showProductImage ? (item.imageUrl 
                      ? `<img src="${item.imageUrl}" alt="${item.name}" class="item-image" />`
                      : `<div class="item-image-placeholder"></div>`
                    ) : ''}
                    <div class="item-details">
                      <span class="item-name">${item.name}</span>
                      ${ps.showProductVariant && item.variantTitle ? `<span class="item-variant">${item.variantTitle}</span>` : ''}
                    </div>
                  </div>
                </td>
                ${ps.showProductSku ? `<td class="col-sku">${item.sku || '-'}</td>` : ''}
                <td class="col-qty">${item.quantity}</td>
                ${ps.showProductPrice ? `<td class="col-price">₪${Number(item.price).toFixed(2)}</td>` : ''}
                ${ps.showProductPrice ? `<td class="col-total">₪${Number(item.total).toFixed(2)}</td>` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Summary -->
        ${ps.showSubtotal || ps.showDiscount || ps.showShipping || ps.showOrderTotal ? `
        <div class="order-summary">
          ${ps.showSubtotal ? `
          <div class="summary-row">
            <span>סכום ביניים (${order.items.length} פריטים)</span>
            <span>₪${Number(order.subtotal).toFixed(2)}</span>
          </div>
          ` : ''}
          ${ps.showDiscount && Number(order.discountAmount) > 0 ? `
            <div class="summary-row discount">
              <span>הנחה ${order.discountCode ? `(${order.discountCode})` : ''}</span>
              <span>-₪${Number(order.discountAmount).toFixed(2)}</span>
            </div>
          ` : ''}
          ${ps.showShipping ? `
          <div class="summary-row">
            <span>משלוח</span>
            <span>${Number(order.shippingAmount) === 0 ? 'חינם' : `₪${Number(order.shippingAmount).toFixed(2)}`}</span>
          </div>
          ` : ''}
          ${ps.showOrderTotal ? `
          <div class="summary-row total">
            <span>סה"כ לתשלום</span>
            <span>₪${Number(order.total).toFixed(2)}</span>
          </div>
          ` : ''}
        </div>
        ` : ''}

        ${ps.showOrderNotes && order.note ? `
          <div class="order-notes">
            <h3>הערות הלקוח</h3>
            <p>${order.note}</p>
          </div>
        ` : ''}

        ${ps.showThankYouMessage ? `
          <div class="print-footer">
            <p>תודה על הקנייה!</p>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>הדפסת הזמנות - ${store.name}</title>
  <style>
    /* Reset */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #1a1a1a;
      direction: rtl;
      background: white;
    }
    
    .order-page {
      padding: 20px 40px;
      min-height: 100vh;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    /* Header */
    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 2px solid #1a1a1a;
      margin-bottom: 20px;
    }
    
    .store-logo {
      max-height: 50px;
      max-width: 150px;
      object-fit: contain;
    }
    
    .store-name {
      font-size: 24px;
      font-weight: 700;
    }
    
    .order-info {
      text-align: left;
    }
    
    .order-number {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 4px 0;
    }
    
    .order-date {
      font-size: 12px;
      color: #666;
    }
    
    /* Status */
    .status-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 24px;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 4px;
      background: #f0f0f0;
      color: #666;
    }
    
    .status-badge.paid {
      background: #d4edda;
      color: #155724;
    }
    
    .status-badge.fulfilled {
      background: #d1ecf1;
      color: #0c5460;
    }
    
    /* Columns */
    .print-columns {
      display: flex;
      gap: 40px;
      margin-bottom: 24px;
    }
    
    .print-column {
      flex: 1;
    }
    
    .print-column h3 {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      margin: 0 0 10px 0;
      padding-bottom: 6px;
      border-bottom: 1px solid #eee;
    }
    
    .info-block p {
      margin: 0 0 4px 0;
    }
    
    .customer-name {
      font-weight: 600;
    }
    
    .no-data {
      color: #999;
      font-style: italic;
    }
    
    /* Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    
    .items-table th {
      background: #f8f8f8;
      padding: 10px 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      border-bottom: 2px solid #e0e0e0;
    }
    
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }
    
    .items-table tr:last-child td {
      border-bottom: 2px solid #e0e0e0;
    }
    
    .col-product { text-align: right; width: 40%; }
    .col-sku { text-align: center; width: 15%; color: #666; }
    .col-qty { text-align: center; width: 10%; }
    .col-price { text-align: left; width: 15%; }
    .col-total { text-align: left; width: 20%; font-weight: 600; }
    
    /* Product cell with image */
    .product-cell {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    
    .item-image {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #eee;
      flex-shrink: 0;
    }
    
    .item-image-placeholder {
      width: 40px;
      height: 40px;
      background: #f5f5f5;
      border-radius: 4px;
      border: 1px solid #eee;
      flex-shrink: 0;
    }
    
    .item-details {
      flex: 1;
      min-width: 0;
    }
    
    .item-name { display: block; font-weight: 500; }
    .item-variant { display: block; font-size: 11px; color: #666; margin-top: 2px; }
    
    /* Summary */
    .order-summary {
      width: 280px;
      margin-right: auto;
      margin-bottom: 24px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 13px;
    }
    
    .summary-row.discount { color: #28a745; }
    
    .summary-row.total {
      font-size: 16px;
      font-weight: 700;
      padding-top: 12px;
      border-top: 2px solid #1a1a1a;
      margin-top: 4px;
    }
    
    /* Notes */
    .order-notes {
      background: #f8f8f8;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    
    .order-notes h3 {
      font-size: 12px;
      font-weight: 700;
      color: #666;
      margin: 0 0 8px 0;
    }
    
    .order-notes p { margin: 0; font-size: 13px; }
    
    /* Footer */
    .print-footer {
      text-align: center;
      padding-top: 24px;
      margin-top: 24px;
      border-top: 1px solid #eee;
    }
    
    .print-footer p {
      margin: 0;
      font-size: 14px;
      color: #666;
    }
    
    @media print {
      .order-page {
        padding: 0;
      }
      
      /* Ensure images print properly */
      .item-image, .store-logo {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  ${ordersHTML}
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() {
        window.close();
      };
    };
  </script>
</body>
</html>
  `;
}

