/**
 * Translations Type Definitions
 * 
 * These types define the structure of UI translations throughout the storefront.
 * The structure matches the JSON stored in store_translations.ui_strings
 */

// ============================================
// Supported Locales
// ============================================

export type SupportedLocale = 'he' | 'en' | 'ar' | 'ru' | 'fr';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['he', 'en', 'ar', 'ru', 'fr'];

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  he: 'עברית',
  en: 'English',
  ar: 'العربية',
  ru: 'Русский',
  fr: 'Français',
};

export const LOCALE_DIRECTIONS: Record<SupportedLocale, 'rtl' | 'ltr'> = {
  he: 'rtl',
  en: 'ltr',
  ar: 'rtl',
  ru: 'ltr',
  fr: 'ltr',
};

// ============================================
// UI Translations Structure
// ============================================

export interface CheckoutTranslations {
  title: string;
  emptyCart: string;
  emptyCartDescription: string;
  contactDetails: {
    title: string;
  };
  shipping: {
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
    cityPlaceholder: string;
    street: string;
    streetPlaceholder: string;
    selectCityFirst: string;
    houseNumber: string;
    apartment: string;
    apartmentPlaceholder: string;
    floor: string;
    floorPlaceholder: string;
    zipCode: string;
    company: string;
    companyPlaceholder: string;
    notes: string;
    notesPlaceholder: string;
  };
  payment: {
    title: string;
    placeOrder: string;
    processing: string;
    securePayment: string;
    securePaymentDescription: string;
    creditCard: string;
    paymentMethod: string;
    simulationMode: string;
    tryAgain: string;
    creditBalance: string;
    cardNumber: string;
    cardNumberPlaceholder: string;
    expiration: string;
    expirationPlaceholder: string;
    cvv: string;
    cvvPlaceholder: string;
    idNumber: string;
    idNumberPlaceholder: string;
  };
  account: {
    createAccount: string;
    createAccountDescription: string;
    password: string;
    passwordPlaceholder: string;
    loginPrompt: string;
    existingAccount: string;
    checkingEmail: string;
  };
  marketing: {
    subscribe: string;
    subscribeDescription: string;
  };
  coupon: {
    title: string;
    placeholder: string;
    addAnother: string;
    apply: string;
    remove: string;
  };
  summary: {
    title: string;
    subtotal: string;
    shipping: string;
    shippingFree: string;
    discount: string;
    memberDiscount: string;
    automaticDiscount: string;
    giftCard: string;
    credit: string;
    creditBalance: string;
    useCredit: string;
    total: string;
    vat: string;
    calculatedNext: string;
    beforeDiscounts: string;
    quantity: string;
    addonsTotal: string;
    bundleIncludes: string;
  };
  shippingMethods: {
    title: string;
    standard: string;
    express: string;
    pickup: string;
    free: string;
    freeAbove: string;
    freeShippingAt: string;
    loading: string;
    noOptions: string;
  };
  errors: {
    paymentFailed: string;
    paymentCancelled: string;
    orderFailed: string;
    invalidEmail: string;
    requiredField: string;
    invalidPhone: string;
    selectCity: string;
    selectStreet: string;
    selectShipping: string;
    acceptTerms: string;
  };
  success: {
    orderPlaced: string;
    thankYou: string;
    orderNumber: string;
    orderReceived: string;
    emailSent: string;
    continueShopping: string;
    itemsInOrder: string;
    paymentDetails: string;
    card: string;
    approval: string;
    totalPaid: string;
    shippingAddress: string;
    phone: string;
    coupon: string;
    giftCard: string;
    automaticDiscount: string;
    memberDiscount: string;
    discount: string;
    free: string;
  };
}

export interface CartTranslations {
  title: string;
  empty: string;
  emptyDescription: string;
  subtotal: string;
  shipping: string;
  discount: string;
  total: string;
  checkout: string;
  continueShopping: string;
  remove: string;
  quantity: string;
  giftCard: string;
  giftCardFor: string;
  giftCardEmail: string;
  addonsTotal: string;
  updateQuantity: string;
  itemAdded: string;
  viewCart: string;
  freeShippingProgress: string;
  freeShippingReached: string;
  addons: string;
  maxQuantityReached: string;
  bundleIncludes: string;
}

export interface ProductTranslations {
  addToCart: string;
  addedToCart: string;
  buyNow: string;
  outOfStock: string;
  inStock: string;
  lowStock: string;
  quantity: string;
  sku: string;
  description: string;
  specifications: string;
  reviews: string;
  writeReview: string;
  noReviews: string;
  relatedProducts: string;
  recentlyViewed: string;
  share: string;
  wishlist: string;
  compare: string;
  selectOption: string;
  selectVariant: string;
  priceFrom: string;
  soldOut: string;
  preOrder: string;
  notify: string;
  notifyDescription: string;
}

export interface GeneralTranslations {
  search: string;
  searchPlaceholder: string;
  searchNoResults: string;
  menu: string;
  close: string;
  home: string;
  categories: string;
  allProducts: string;
  products: string;
  sale: string;
  new: string;
  featured: string;
  bestSeller: string;
  loading: string;
  error: string;
  retry: string;
  back: string;
  next: string;
  previous: string;
  showMore: string;
  showLess: string;
  includes: string;
  viewAll: string;
  sortBy: string;
  filter: string;
  filters: string;
  clearFilters: string;
  noResults: string;
  price: string;
  priceRange: string;
  apply: string;
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  required: string;
  optional: string;
  cart: string;
}

export interface AccountTranslations {
  login: string;
  loginTitle: string;
  logout: string;
  register: string;
  registerTitle: string;
  myAccount: string;
  myOrders: string;
  orderHistory: string;
  noOrders: string;
  orderDetails: string;
  orderStatus: string;
  trackOrder: string;
  reorder: string;
  addresses: string;
  defaultAddress: string;
  addAddress: string;
  editAddress: string;
  profile: string;
  updateProfile: string;
  changePassword: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  forgotPassword: string;
  resetPassword: string;
  welcomeBack: string;
  notMember: string;
  alreadyMember: string;
  clubMember: string;
  creditBalance: string;
  loyaltyPoints: string;
}

export interface FooterTranslations {
  contactUs: string;
  aboutUs: string;
  privacyPolicy: string;
  termsOfService: string;
  returnPolicy: string;
  shippingPolicy: string;
  faq: string;
  followUs: string;
  newsletter: string;
  newsletterPlaceholder: string;
  newsletterButton: string;
  newsletterSuccess: string;
  copyright: string;
  allRightsReserved: string;
}

export interface OrderStatusTranslations {
  pending: string;
  confirmed: string;
  processing: string;
  shipped: string;
  delivered: string;
  cancelled: string;
  refunded: string;
  returned: string;
  onHold: string;
}

// ============================================
// Main UI Translations Interface
// ============================================

export interface UITranslations {
  checkout: CheckoutTranslations;
  cart: CartTranslations;
  product: ProductTranslations;
  general: GeneralTranslations;
  account: AccountTranslations;
  footer: FooterTranslations;
  orderStatus: OrderStatusTranslations;
}

// ============================================
// Content Translations (for products, categories, etc.)
// ============================================

export interface ProductContentTranslations {
  name?: string;
  description?: string;
  shortDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CategoryContentTranslations {
  name?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface PageContentTranslations {
  title?: string;
  content?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface MenuItemContentTranslations {
  label?: string;
}

// ============================================
// Utility Types
// ============================================

// Deep partial for overrides
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Store translation record from DB
export interface StoreTranslationRecord {
  id: string;
  storeId: string;
  locale: SupportedLocale;
  uiStrings: DeepPartial<UITranslations>;
  createdAt: Date;
  updatedAt: Date;
}

// Content translation record from DB
export interface ContentTranslationRecord {
  id: string;
  storeId: string;
  entityType: 'product' | 'category' | 'page' | 'menu_item' | 'collection';
  entityId: string;
  locale: SupportedLocale;
  translations: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

