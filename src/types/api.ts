/**
 * Shared TypeScript Types for Mobile API
 * 
 * These types can be used by both the backend API and the mobile application
 * to ensure type safety and consistency across the stack.
 */

// ============ API Response Wrapper ============

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============ Store Configuration ============

export interface StorefrontConfig {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  currency: string;
  timezone: string;
  isPublished: boolean;
  settings: StoreSettings;
  theme: StoreTheme;
  localization: StoreLocalization;
}

export interface StoreSettings {
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  showDecimalPrices: boolean;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  returnPolicyDays?: number;
}

export interface StoreTheme {
  primaryColor: string;
  secondaryColor?: string;
  headerLayout?: string;
  headerSticky?: boolean;
  announcementEnabled?: boolean;
  announcementText?: string | null;
  announcementBgColor?: string;
  announcementTextColor?: string;
}

export interface StoreLocalization {
  defaultLocale: string;
  supportedLocales: string[];
}

// ============ Products ============

export interface StorefrontProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  price: number | null;
  comparePrice: number | null;
  hasVariants: boolean;
  inStock: boolean;
  isFeatured: boolean;
  image: string | null;
  imageAlt: string;
  createdAt: Date;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  shortDescription: string | null;
  description: string | null;
  price: number | null;
  comparePrice: number | null;
  weight: number | null;
  hasVariants: boolean;
  trackInventory: boolean;
  inventory: number | null;
  allowBackorder: boolean;
  inStock: boolean;
  isFeatured: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  seoTitle: string | null;
  seoDescription: string | null;
  images: ProductImage[];
  primaryImage: string | null;
  options: ProductOption[];
  variants: ProductVariant[];
  category: ProductCategory | null;
  categories: ProductCategory[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
  mediaType: string | null;
  thumbnailUrl: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  displayType: string | null;
  sortOrder: number;
  values: ProductOptionValue[];
}

export interface ProductOptionValue {
  id: string;
  value: string;
  metadata: Record<string, unknown> | null;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  title: string | null;
  sku: string | null;
  barcode: string | null;
  price: number;
  comparePrice: number | null;
  weight: number | null;
  inventory: number | null;
  allowBackorder: boolean;
  inStock: boolean;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

// ============ Categories ============

export interface StorefrontCategory {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
  hideOutOfStock: boolean;
  moveOutOfStockToBottom: boolean;
  createdAt: Date;
  subcategories?: StorefrontCategory[];
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

// ============ Orders ============

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  financialStatus: string;
  fulfillmentStatus: string;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  creditUsed: number;
  total: number;
  currency: string;
  discountCode: string | null;
  discountDetails: DiscountDetail[] | null;
  itemCount: number;
  totalQuantity: number;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  financialStatus: string;
  fulfillmentStatus: string;
  subtotal: number;
  discountCode: string | null;
  discountAmount: number;
  discountDetails: DiscountDetail[] | null;
  creditUsed: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
  currency: string;
  customerEmail: string | null;
  customerName: string | null;
  customerPhone: string | null;
  shippingAddress: Address | null;
  billingAddress: Address | null;
  shippingMethod: string | null;
  paymentMethod: string | null;
  tracking: OrderTracking | null;
  note: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
}

export interface OrderTracking {
  trackingNumber: string | null;
  status: string;
  labelUrl: string | null;
  estimatedDelivery: Date | null;
  actualDelivery: Date | null;
  pickedUpAt: Date | null;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  name: string;
  variantTitle: string | null;
  sku: string | null;
  quantity: number;
  price: number;
  total: number;
  imageUrl: string | null;
  properties: Record<string, unknown> | null;
}

export interface DiscountDetail {
  type: 'coupon' | 'auto' | 'gift_card' | 'credit' | 'member' | 'loyalty_tier';
  code?: string;
  name: string;
  description?: string;
  amount: number;
}

export interface Address {
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  state?: string;
}

// ============ Wishlist ============

export interface WishlistItem {
  id: string;
  productId: string;
  variantId: string | null;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number | null;
    comparePrice: number | null;
    hasVariants: boolean;
    inStock: boolean;
    image: string | null;
  };
  variant?: {
    id: string;
    title: string | null;
    price: number;
    inStock: boolean;
  };
}

export interface WishlistData {
  items: WishlistItem[];
  count: number;
}

// ============ Customer ============

export interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  defaultAddress: Address | null;
  creditBalance: number;
  acceptsMarketing: boolean;
  totalOrders?: number;
  totalSpent?: number;
  createdAt: Date;
}

export interface CustomerAddress {
  id: string;
  isDefault: boolean;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  country: string;
  state: string | null;
}

// ============ Push Notifications ============

export interface DeviceRegistration {
  deviceToken: string;
  platform: 'ios' | 'android';
  deviceId: string;
}

export interface NotificationPreferences {
  orderUpdates: boolean;
  promotions: boolean;
  backInStock: boolean;
}

// ============ Shipping ============

export interface ShippingMethod {
  id: string;
  name: string;
  description: string | null;
  price: number;
  estimatedDays: string | null;
  type: 'standard' | 'express' | 'pickup';
}

export interface PickupLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  instructions: string | null;
}

// ============ Discount Validation ============

export interface CouponValidation {
  valid: boolean;
  error?: string;
  discount?: {
    code: string;
    type: string;
    value: number;
    appliesTo: string;
    minimumAmount: number | null;
  };
}

// ============ Search ============

export interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image: string | null;
  inStock: boolean;
}
