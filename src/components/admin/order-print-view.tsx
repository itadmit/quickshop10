import './order-print.css';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: string;
  total: string;
  sku: string | null;
  variantTitle: string | null;
  imageUrl: string | null;
}

interface Customer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
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

interface Order {
  id: string;
  orderNumber: string;
  status: string | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  subtotal: string;
  discountCode: string | null;
  discountAmount: string | null;
  shippingAmount: string | null;
  total: string;
  shippingAddress: unknown;
  shippingMethod: string | null;
  note: string | null;
  createdAt: Date | null;
  items: OrderItem[];
  customer: Customer | null;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

interface OrderPrintViewProps {
  order: Order;
  store: Store;
}

function formatDate(date: Date | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('he-IL', { 
    day: '2-digit', 
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

const statusLabels: Record<string, string> = {
  pending: 'ממתין',
  confirmed: 'אושר',
  processing: 'בטיפול',
  shipped: 'נשלח',
  delivered: 'נמסר',
  cancelled: 'בוטל',
  refunded: 'הוחזר',
};

const fulfillmentLabels: Record<string, string> = {
  unfulfilled: 'לא נשלח',
  partial: 'נשלח חלקית',
  fulfilled: 'נשלח',
};

const financialLabels: Record<string, string> = {
  pending: 'ממתין לתשלום',
  paid: 'שולם',
  partially_paid: 'שולם חלקית',
  refunded: 'הוחזר',
  partially_refunded: 'הוחזר חלקית',
};

export function OrderPrintView({ order, store }: OrderPrintViewProps) {
  const shippingAddress = order.shippingAddress as ShippingAddress | null;
  
  return (
    <div className="order-print-page" dir="rtl">
      {/* Header */}
      <header className="print-header">
        <div className="store-info">
          {store.logoUrl ? (
            <img src={store.logoUrl} alt={store.name} className="store-logo" />
          ) : (
            <h1 className="store-name">{store.name}</h1>
          )}
        </div>
        <div className="order-info">
          <h2 className="order-number">הזמנה #{order.orderNumber}</h2>
          <p className="order-date">{formatDate(order.createdAt)}</p>
        </div>
      </header>

      {/* Status Bar */}
      <div className="status-bar">
        <span className={`status-badge ${order.financialStatus === 'paid' ? 'paid' : ''}`}>
          {financialLabels[order.financialStatus || 'pending']}
        </span>
        <span className={`status-badge ${order.fulfillmentStatus === 'fulfilled' ? 'fulfilled' : ''}`}>
          {order.status === 'cancelled' ? statusLabels.cancelled : fulfillmentLabels[order.fulfillmentStatus || 'unfulfilled']}
        </span>
      </div>

      {/* Two Column Layout */}
      <div className="print-columns">
        {/* Customer Info */}
        <div className="print-column">
          <h3>פרטי לקוח</h3>
          <div className="info-block">
            <p className="customer-name">
              {order.customer?.firstName} {order.customer?.lastName}
            </p>
            <p>{order.customer?.email}</p>
            {order.customer?.phone && <p>{order.customer.phone}</p>}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="print-column">
          <h3>כתובת למשלוח</h3>
          {shippingAddress ? (
            <div className="info-block">
              <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
              <p>{shippingAddress.address || shippingAddress.address1}</p>
              {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
              <p>{shippingAddress.city} {shippingAddress.zip || shippingAddress.zipCode}</p>
              {shippingAddress.phone && <p>טלפון: {shippingAddress.phone}</p>}
            </div>
          ) : (
            <p className="no-data">לא צוינה כתובת</p>
          )}
        </div>
      </div>

      {/* Order Items Table */}
      <table className="items-table">
        <thead>
          <tr>
            <th className="col-product">מוצר</th>
            <th className="col-sku">מק"ט</th>
            <th className="col-qty">כמות</th>
            <th className="col-price">מחיר</th>
            <th className="col-total">סה"כ</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td className="col-product">
                <span className="item-name">{item.name}</span>
                {item.variantTitle && (
                  <span className="item-variant">{item.variantTitle}</span>
                )}
              </td>
              <td className="col-sku">{item.sku || '-'}</td>
              <td className="col-qty">{item.quantity}</td>
              <td className="col-price">₪{Number(item.price).toFixed(2)}</td>
              <td className="col-total">₪{Number(item.total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Order Summary */}
      <div className="order-summary">
        <div className="summary-row">
          <span>סכום ביניים ({order.items.length} פריטים)</span>
          <span>₪{Number(order.subtotal).toFixed(2)}</span>
        </div>
        {Number(order.discountAmount) > 0 && (
          <div className="summary-row discount">
            <span>הנחה {order.discountCode && `(${order.discountCode})`}</span>
            <span>-₪{Number(order.discountAmount).toFixed(2)}</span>
          </div>
        )}
        <div className="summary-row">
          <span>משלוח {order.shippingMethod && `(${order.shippingMethod})`}</span>
          <span>
            {Number(order.shippingAmount) === 0 ? 'חינם' : `₪${Number(order.shippingAmount).toFixed(2)}`}
          </span>
        </div>
        <div className="summary-row total">
          <span>סה"כ לתשלום</span>
          <span>₪{Number(order.total).toFixed(2)}</span>
        </div>
      </div>

      {/* Notes */}
      {order.note && (
        <div className="order-notes">
          <h3>הערות הלקוח</h3>
          <p>{order.note}</p>
        </div>
      )}

      {/* Footer */}
      <footer className="print-footer">
        <p>תודה על הקנייה!</p>
        <p className="footer-store">{store.name}</p>
      </footer>
    </div>
  );
}

