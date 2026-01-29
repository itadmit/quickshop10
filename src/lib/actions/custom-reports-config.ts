// ============================================
// Custom Report Builder - Configuration
// Shared constants (NOT server actions)
// ============================================

export type ReportSubject = 'products' | 'orders' | 'customers' | 'coupons' | 'inventory';

export interface ReportFilter {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  status?: string;
  minValue?: number;
  maxValue?: number;
}

export interface ReportParams {
  storeId: string;
  subject: ReportSubject;
  columns: string[];
  filters: ReportFilter;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  limit?: number;
}

// Column definitions per subject
export const REPORT_COLUMNS = {
  products: {
    name: { label: 'שם מוצר', default: true },
    sku: { label: 'מק"ט', default: true },
    barcode: { label: 'ברקוד', default: false },
    categoryName: { label: 'קטגוריה', default: true },
    price: { label: 'מחיר', default: true },
    comparePrice: { label: 'מחיר לפני הנחה', default: false },
    cost: { label: 'עלות', default: false },
    profit: { label: 'רווח', default: false },
    profitMargin: { label: 'מרווח %', default: false },
    quantitySold: { label: 'כמות נמכרה', default: true },
    revenue: { label: 'הכנסות', default: true },
    inventory: { label: 'מלאי', default: false },
    createdAt: { label: 'תאריך יצירה', default: false },
  },
  orders: {
    orderNumber: { label: 'מס\' הזמנה', default: true },
    createdAt: { label: 'תאריך', default: true },
    customerName: { label: 'לקוח', default: true },
    customerEmail: { label: 'אימייל', default: false },
    customerPhone: { label: 'טלפון', default: false },
    status: { label: 'סטטוס', default: true },
    financialStatus: { label: 'סטטוס תשלום', default: false },
    total: { label: 'סה"כ', default: true },
    subtotal: { label: 'סה"כ לפני הנחה', default: false },
    discountAmount: { label: 'הנחה', default: false },
    discountCode: { label: 'קופון', default: false },
    itemCount: { label: 'פריטים', default: false },
    shippingMethod: { label: 'שיטת משלוח', default: false },
    shippingAmount: { label: 'עלות משלוח', default: false },
    paymentMethod: { label: 'אמצעי תשלום', default: false },
    city: { label: 'עיר', default: false },
    utmSource: { label: 'מקור (UTM)', default: false },
    utmCampaign: { label: 'קמפיין', default: false },
    deviceType: { label: 'מכשיר', default: false },
  },
  customers: {
    name: { label: 'שם', default: true },
    email: { label: 'אימייל', default: true },
    phone: { label: 'טלפון', default: false },
    createdAt: { label: 'תאריך הרשמה', default: true },
    totalOrders: { label: 'הזמנות', default: true },
    totalSpent: { label: 'סה"כ הוצאה', default: true },
    avgOrderValue: { label: 'ממוצע הזמנה', default: false },
    lastOrderDate: { label: 'הזמנה אחרונה', default: false },
    city: { label: 'עיר', default: false },
  },
  coupons: {
    code: { label: 'קוד', default: true },
    title: { label: 'שם', default: true },
    type: { label: 'סוג הנחה', default: true },
    value: { label: 'ערך', default: true },
    usageCount: { label: 'שימושים', default: true },
    revenue: { label: 'הכנסות', default: true },
    totalDiscount: { label: 'סה"כ הנחות', default: false },
    usageLimit: { label: 'מגבלת שימוש', default: false },
    startsAt: { label: 'תאריך התחלה', default: false },
    endsAt: { label: 'תאריך סיום', default: false },
    isActive: { label: 'פעיל', default: false },
  },
  inventory: {
    name: { label: 'שם מוצר', default: true },
    sku: { label: 'מק"ט', default: true },
    variantTitle: { label: 'וריאנט', default: false },
    inventory: { label: 'מלאי', default: true },
    price: { label: 'מחיר', default: true },
    avgDailySales: { label: 'מכירות/יום', default: false },
    daysUntilEmpty: { label: 'ימים עד אזילה', default: false },
    lastSaleDate: { label: 'מכירה אחרונה', default: false },
    inventoryValue: { label: 'שווי מלאי', default: false },
  },
};

// Quick report templates
export const QUICK_REPORTS = {
  products: [
    {
      id: 'top-selling',
      name: 'מוצרים מובילים',
      description: 'Top 20 לפי מכירות',
      columns: ['name', 'sku', 'categoryName', 'quantitySold', 'revenue'],
      sortBy: 'quantitySold',
      sortDirection: 'desc' as const,
      limit: 20,
    },
    {
      id: 'profitable',
      name: 'מוצרים רווחיים',
      description: 'לפי מרווח רווח',
      columns: ['name', 'price', 'cost', 'profit', 'profitMargin', 'quantitySold'],
      sortBy: 'profit',
      sortDirection: 'desc' as const,
      limit: 20,
    },
    {
      id: 'dead-stock',
      name: 'Dead Stock',
      description: 'לא נמכר 30+ יום',
      columns: ['name', 'sku', 'inventory', 'price', 'createdAt'],
      sortBy: 'inventory',
      sortDirection: 'desc' as const,
    },
  ],
  orders: [
    {
      id: 'pending',
      name: 'הזמנות ממתינות',
      description: 'סטטוס: בטיפול',
      columns: ['orderNumber', 'createdAt', 'customerName', 'total', 'status'],
      filters: { status: 'pending' },
      sortBy: 'createdAt',
      sortDirection: 'desc' as const,
    },
    {
      id: 'by-source',
      name: 'הזמנות לפי מקור',
      description: 'עם פרמטרי UTM',
      columns: ['orderNumber', 'createdAt', 'customerName', 'total', 'utmSource', 'utmCampaign'],
      sortBy: 'createdAt',
      sortDirection: 'desc' as const,
    },
    {
      id: 'with-coupon',
      name: 'הזמנות עם קופון',
      description: 'הזמנות שהשתמשו בקופון',
      columns: ['orderNumber', 'createdAt', 'customerName', 'discountCode', 'discountAmount', 'total'],
      sortBy: 'createdAt',
      sortDirection: 'desc' as const,
    },
  ],
  customers: [
    {
      id: 'vip',
      name: 'לקוחות VIP',
      description: 'הוצאה מעל ₪1,000',
      columns: ['name', 'email', 'totalOrders', 'totalSpent', 'lastOrderDate'],
      filters: { minValue: 1000 },
      sortBy: 'totalSpent',
      sortDirection: 'desc' as const,
      limit: 50,
    },
    {
      id: 'new-this-week',
      name: 'לקוחות חדשים השבוע',
      description: 'נרשמו ב-7 ימים אחרונים',
      columns: ['name', 'email', 'phone', 'createdAt', 'totalOrders'],
      sortBy: 'createdAt',
      sortDirection: 'desc' as const,
    },
    {
      id: 'dormant',
      name: 'לקוחות רדומים',
      description: 'לא קנו 60+ יום',
      columns: ['name', 'email', 'totalSpent', 'totalOrders', 'lastOrderDate'],
      sortBy: 'lastOrderDate',
      sortDirection: 'asc' as const,
    },
  ],
  coupons: [
    {
      id: 'top-used',
      name: 'קופונים פופולריים',
      description: 'הכי בשימוש',
      columns: ['code', 'title', 'type', 'value', 'usageCount', 'revenue'],
      sortBy: 'usageCount',
      sortDirection: 'desc' as const,
    },
  ],
  inventory: [
    {
      id: 'low-stock',
      name: 'מלאי קריטי',
      description: 'פחות מ-5 יחידות',
      columns: ['name', 'sku', 'inventory', 'price', 'avgDailySales'],
      filters: { maxValue: 5 },
      sortBy: 'inventory',
      sortDirection: 'asc' as const,
    },
    {
      id: 'out-of-stock',
      name: 'אזל מהמלאי',
      description: 'מלאי = 0',
      columns: ['name', 'sku', 'price', 'lastSaleDate'],
      filters: { maxValue: 0 },
      sortBy: 'name',
      sortDirection: 'asc' as const,
    },
  ],
};

