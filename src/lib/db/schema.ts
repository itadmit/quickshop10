import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============ ENUMS ============

export const userRoleEnum = pgEnum('user_role', ['admin', 'merchant']);
// Store plans - includes both legacy (free, basic, pro, enterprise) and new (trial, branding, quickshop) values
export const storePlanEnum = pgEnum('store_plan', ['free', 'basic', 'pro', 'enterprise', 'trial', 'branding', 'quickshop']);

// Platform billing enums
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trial',        // בתקופת נסיון
  'active',       // פעיל ומשלם
  'past_due',     // חוב - לא הצלחנו לגבות
  'cancelled',    // בוטל על ידי המשתמש
  'expired'       // פג תוקף
]);

export const platformInvoiceTypeEnum = pgEnum('platform_invoice_type', [
  'subscription',      // מנוי חודשי
  'transaction_fee',   // עמלות עסקאות (0.5%)
  'plugin',            // תוספים
  'email_package'      // חבילת דיוור
]);

export const platformInvoiceStatusEnum = pgEnum('platform_invoice_status', [
  'draft',      // טיוטה
  'pending',    // ממתין לחיוב
  'paid',       // שולם
  'failed',     // נכשל
  'cancelled'   // בוטל
]);
export const orderStatusEnum = pgEnum('order_status', [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
]);
export const financialStatusEnum = pgEnum('financial_status', [
  'pending', 'paid', 'partially_paid', 'refunded', 'partially_refunded'
]);
export const fulfillmentStatusEnum = pgEnum('fulfillment_status', [
  'unfulfilled', 'partial', 'fulfilled'
]);
export const discountTypeEnum = pgEnum('discount_type', [
  'percentage',           // אחוז הנחה
  'fixed_amount',         // סכום קבוע
  'free_shipping',        // משלוח חינם
  'buy_x_pay_y',         // קנה X מוצרים שלם Y ש"ח
  'buy_x_get_y',         // קנה X קבל Y במתנה (אותו מוצר)
  'gift_product',        // מוצר במתנה (עם תנאים, בחירת מוצר ספציפי)
  'quantity_discount',    // הנחות כמות (קנה 2 = 10%, קנה 3 = 20%)
  'spend_x_pay_y'        // קנה ב-X שלם Y
]);

export const discountAppliesToEnum = pgEnum('discount_applies_to', [
  'all', 'category', 'product', 'member'
]);

export const sectionTypeEnum = pgEnum('section_type', [
  // Original types
  'hero', 'banner', 'split_banner', 'video_banner', 'categories', 'products', 'newsletter', 'custom',
  // New types - all Server Components, zero JS!
  'reviews',        // ביקורות לקוחות
  'google_reviews', // ביקורות גוגל
  'image_text',     // תמונה + טקסט (ימין/שמאל)
  'features',       // יתרונות/אייקונים
  'banner_small',   // באנר קטן (הודעה)
  'gallery',        // גלריית תמונות
  'text_block',     // בלוק טקסט עשיר
  'logos',          // לוגואים של מותגים/שותפים
  'faq',            // שאלות נפוצות
  'contact',        // טופס יצירת קשר
  // Argania Premium sections
  'hero_slider',    // סליידר הירו עם scroll-snap
  'hero_premium',   // הירו פרימיום עם גרדיאנט
  'series_grid',    // גריד סדרות מוצרים
  'quote_banner',   // באנר ציטוט עם פרלקס
  'featured_items', // פריטים מובילים - תמונה + שם + לינק
  // Products slider
  'products_slider' // סליידר מוצרים
]);

export const creditTransactionTypeEnum = pgEnum('credit_transaction_type', [
  'credit', 'debit', 'refund', 'adjustment'
]);

// Analytics enums
export const analyticsEventTypeEnum = pgEnum('analytics_event_type', [
  'page_view', 'product_view', 'category_view', 'search',
  'add_to_cart', 'remove_from_cart', 'begin_checkout', 'purchase'
]);

export const deviceTypeEnum = pgEnum('device_type', ['desktop', 'mobile', 'tablet']);

// Product media type (image or video)
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video']);

export const giftCardStatusEnum = pgEnum('gift_card_status', ['active', 'used', 'expired', 'cancelled']);

export const refundStatusEnum = pgEnum('refund_status', ['pending', 'approved', 'rejected', 'completed']);

// Store team roles
export const storeRoleEnum = pgEnum('store_role', ['owner', 'manager', 'marketing', 'developer', 'influencer', 'agent']);

// Menu link types
export const menuLinkTypeEnum = pgEnum('menu_link_type', ['url', 'page', 'category', 'product']);

// Plugin system enums
export const pluginCategoryEnum = pgEnum('plugin_category', [
  'marketing', 'loyalty', 'analytics', 'payment', 
  'inventory', 'communication', 'operations', 'customization'
]);

export const pluginSubscriptionStatusEnum = pgEnum('plugin_subscription_status', [
  'active', 'trial', 'cancelled', 'expired', 'pending'
]);

// Popup system enums
export const popupTypeEnum = pgEnum('popup_type', ['image', 'text', 'form', 'combined']);
export const popupTriggerEnum = pgEnum('popup_trigger', ['on_load', 'exit_intent', 'scroll', 'time_delay']);
export const popupPositionEnum = pgEnum('popup_position', ['center', 'bottom_right', 'bottom_left', 'full_screen']);
export const popupFrequencyEnum = pgEnum('popup_frequency', ['once', 'once_per_session', 'always', 'every_x_days']);
export const popupTargetEnum = pgEnum('popup_target', ['all', 'homepage', 'products', 'categories', 'custom']);

// Contact types for leads/subscribers
export const contactTypeEnum = pgEnum('contact_type', ['newsletter', 'club_member', 'contact_form', 'popup_form']);
export const contactStatusEnum = pgEnum('contact_status', ['active', 'unsubscribed', 'spam']);

// Return/Exchange system enums
export const returnRequestTypeEnum = pgEnum('return_request_type', ['return', 'exchange']);
export const returnRequestStatusEnum = pgEnum('return_request_status', [
  'pending',           // ממתין לבדיקה
  'under_review',      // בבדיקה
  'approved',          // אושר
  'rejected',          // נדחה
  'awaiting_shipment', // ממתין לשליחת המוצר
  'item_received',     // המוצר התקבל
  'completed',         // הושלם
  'cancelled'          // בוטל
]);
export const returnReasonEnum = pgEnum('return_reason', [
  'wrong_size',        // מידה לא מתאימה
  'defective',         // פגם במוצר
  'not_as_described',  // לא כמתואר
  'changed_mind',      // שינוי דעה
  'wrong_item',        // קיבלתי מוצר שגוי
  'damaged_shipping',  // נזק במשלוח
  'other'              // אחר
]);
export const resolutionTypeEnum = pgEnum('resolution_type', [
  'exchange',          // החלפה ראש בראש
  'store_credit',      // קרדיט לחנות
  'refund',            // זיכוי כספי מלא
  'partial_refund'     // זיכוי חלקי
]);

// Bundle system enums
export const bundleTypeEnum = pgEnum('bundle_type', ['fixed', 'mix_match']);
export const bundlePricingTypeEnum = pgEnum('bundle_pricing_type', [
  'fixed',              // מחיר קבוע ל-Bundle
  'calculated',         // סכום מחירי הרכיבים
  'discount_percentage', // הנחה באחוזים מסכום הרכיבים
  'discount_fixed'      // הנחה בסכום קבוע מסכום הרכיבים
]);

// CRM Plugin enums
export const crmTaskPriorityEnum = pgEnum('crm_task_priority', ['low', 'medium', 'high']);
export const crmTaskStatusEnum = pgEnum('crm_task_status', ['pending', 'in_progress', 'completed', 'cancelled']);

// ============ USERS & AUTH ============

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  role: userRoleEnum('role').default('merchant').notNull(),
  emailVerifiedAt: timestamp('email_verified_at'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires').notNull(),
});

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: integer('expires_at'),
  tokenType: varchar('token_type', { length: 50 }),
  scope: varchar('scope', { length: 255 }),
  idToken: text('id_token'),
});

// ============ STORES ============

export const stores = pgTable('stores', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  customDomain: varchar('custom_domain', { length: 255 }),
  logoUrl: varchar('logo_url', { length: 500 }),
  faviconUrl: varchar('favicon_url', { length: 500 }),
  currency: varchar('currency', { length: 3 }).default('ILS').notNull(),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Jerusalem'),
  settings: jsonb('settings').default({}).notNull(),
  themeSettings: jsonb('theme_settings').default({}).notNull(),
  seoSettings: jsonb('seo_settings').default({}).notNull(),
  // Page sections stored as JSON (no separate table needed - atomic operations)
  homeSections: jsonb('home_sections').default([]).notNull(),
  comingSoonSections: jsonb('coming_soon_sections').default([]).notNull(),
  productPageSections: jsonb('product_page_sections').default([]).notNull(), // Product page V2 - fully editable sections
  plan: storePlanEnum('plan').default('free').notNull(),
  planExpiresAt: timestamp('plan_expires_at'),
  orderCounter: integer('order_counter').default(1000).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isPublished: boolean('is_published').default(false).notNull(), // false = Coming Soon, true = Live
  
  // Localization settings
  defaultLocale: varchar('default_locale', { length: 5 }).default('he').notNull(),
  supportedLocales: varchar('supported_locales', { length: 5 }).array().default(['he']),
  hasCustomTranslations: boolean('has_custom_translations').default(false).notNull(),
  
  // Custom order workflow statuses (e.g., "הועבר למתפרה", "בתפירה", "בהכנה")
  // Array of { id: string, name: string, color: string }
  customOrderStatuses: jsonb('custom_order_statuses').$type<Array<{
    id: string;
    name: string;
    color: string; // hex color for badge
  }>>().default([]),
  
  // CRM Plugin: Customer tag definitions for this store
  // Array of { id: string, label: string, color: string, isDefault?: boolean }
  crmTags: jsonb('crm_tags').$type<Array<{
    id: string;
    label: string;
    color: string;
    isDefault?: boolean;
  }>>().default([]),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_stores_custom_domain').on(table.customDomain),
]);

// ============ STORE TEAM MEMBERS ============

export const storeMembers = pgTable('store_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: storeRoleEnum('role').default('manager').notNull(),
  permissions: jsonb('permissions').default({}).notNull(),
  invitedBy: uuid('invited_by').references(() => users.id),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_store_members_unique').on(table.storeId, table.userId),
  index('idx_store_members_store').on(table.storeId),
  index('idx_store_members_user').on(table.userId),
]);

export const teamInvitations = pgTable('team_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  role: storeRoleEnum('role').default('manager').notNull(),
  invitedBy: uuid('invited_by').references(() => users.id).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_team_invitations_store').on(table.storeId),
  index('idx_team_invitations_email').on(table.email),
]);

// ============ CONTENT PAGES ============

export const pages = pgTable('pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  content: text('content'), // HTML content (legacy)
  // Sections stored as JSON - atomic operations, no sync issues
  sections: jsonb('sections').default([]).notNull(),
  template: varchar('template', { length: 50 }).default('default'),
  isPublished: boolean('is_published').default(false).notNull(),
  publishedAt: timestamp('published_at'),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_pages_store_slug').on(table.storeId, table.slug),
  index('idx_pages_store').on(table.storeId),
]);

// ============ PAGE TEMPLATES ============
// Custom page templates - like Shopify's page templates
// Users can create templates from the editor and reuse them

export const pageTemplates = pgTable('page_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(), // "צור קשר", "אודות", "FAQ"
  description: varchar('description', { length: 255 }),
  // Sections are stored as JSON - same format as page_sections
  sections: jsonb('sections').default([]).notNull(),
  // Preview thumbnail (optional)
  thumbnailUrl: text('thumbnail_url'),
  // Sorting for display
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_page_templates_store').on(table.storeId),
]);

export const pageTemplatesRelations = relations(pageTemplates, ({ one }) => ({
  store: one(stores, {
    fields: [pageTemplates.storeId],
    references: [stores.id],
  }),
}));

// ============ NAVIGATION MENUS ============

export const menus = pgTable('menus', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  handle: varchar('handle', { length: 50 }).notNull(), // 'main', 'footer', 'mobile'
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_menus_store_handle').on(table.storeId, table.handle),
  index('idx_menus_store').on(table.storeId),
]);

export const menuItems = pgTable('menu_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  menuId: uuid('menu_id').references(() => menus.id, { onDelete: 'cascade' }).notNull(),
  parentId: uuid('parent_id'),
  title: varchar('title', { length: 100 }).notNull(),
  linkType: menuLinkTypeEnum('link_type').notNull(),
  linkUrl: varchar('link_url', { length: 500 }),
  linkResourceId: uuid('link_resource_id'),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  imageUrl: text('image_url'), // For mega menu hover images
}, (table) => [
  index('idx_menu_items_menu').on(table.menuId),
  index('idx_menu_items_parent').on(table.parentId),
]);

// ============ MEDIA LIBRARY ============

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalFilename: varchar('original_filename', { length: 255 }),
  mimeType: varchar('mime_type', { length: 100 }),
  size: integer('size'), // bytes
  width: integer('width'),
  height: integer('height'),
  url: varchar('url', { length: 500 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  publicId: varchar('public_id', { length: 255 }), // Cloudinary public_id for deletion
  alt: varchar('alt', { length: 255 }),
  folder: varchar('folder', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_media_store').on(table.storeId),
  index('idx_media_folder').on(table.storeId, table.folder),
]);

// ============ ACTIVITY LOG ============

export const activityLog = pgTable('activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }),
  resourceId: uuid('resource_id'),
  description: text('description'),
  changes: jsonb('changes'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_activity_log_store').on(table.storeId),
  index('idx_activity_log_user').on(table.userId),
  index('idx_activity_log_created').on(table.createdAt),
]);

// ============ PAGE SECTIONS ============

export const pageSections = pgTable('page_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  page: varchar('page', { length: 50 }).default('home').notNull(), // home, about, etc.
  type: sectionTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }),
  subtitle: varchar('subtitle', { length: 500 }),
  content: jsonb('content').default({}).notNull(), // Flexible content based on type
  settings: jsonb('settings').default({}).notNull(), // Layout settings
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_page_sections_store').on(table.storeId),
  index('idx_page_sections_store_page').on(table.storeId, table.page),
]);

// ============ CATEGORIES ============

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  parentId: uuid('parent_id'),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true).notNull(),
  // Out-of-stock product display settings
  hideOutOfStock: boolean('hide_out_of_stock').default(false).notNull(),
  moveOutOfStockToBottom: boolean('move_out_of_stock_to_bottom').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_categories_store_slug').on(table.storeId, table.slug),
  index('idx_categories_store').on(table.storeId),
]);

// ============ PRODUCT CATEGORIES (Many-to-Many) ============

export const productCategories = pgTable('product_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_product_categories_unique').on(table.productId, table.categoryId),
  index('idx_product_categories_product').on(table.productId),
  index('idx_product_categories_category').on(table.categoryId),
]);

// ============ PRODUCTS ============

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 500 }),
  price: decimal('price', { precision: 10, scale: 2 }),
  comparePrice: decimal('compare_price', { precision: 10, scale: 2 }),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  sku: varchar('sku', { length: 100 }),
  barcode: varchar('barcode', { length: 100 }),
  weight: decimal('weight', { precision: 10, scale: 3 }),
  hasVariants: boolean('has_variants').default(false).notNull(),
  trackInventory: boolean('track_inventory').default(true).notNull(),
  inventory: integer('inventory').default(0),
  allowBackorder: boolean('allow_backorder').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  metadata: jsonb('metadata').default({}),
  upsellProductIds: jsonb('upsell_product_ids').default([]), // Array of product IDs to show as upsells
  isBundle: boolean('is_bundle').default(false).notNull(), // Whether this product is a bundle
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_products_store_slug').on(table.storeId, table.slug),
  index('idx_products_store').on(table.storeId),
  index('idx_products_category').on(table.categoryId),
]);

export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  alt: varchar('alt', { length: 255 }),
  sortOrder: integer('sort_order').default(0),
  isPrimary: boolean('is_primary').default(false).notNull(),
  // Video support
  mediaType: mediaTypeEnum('media_type').default('image').notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }), // For video poster (first frame)
  duration: integer('duration'), // Video duration in seconds
  displayAsCard: boolean('display_as_card').default(false).notNull(), // Show video thumbnail in product cards (category/home)
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_product_images_product').on(table.productId),
  // Index for fast video card lookup (displayAsCard + mediaType)
  index('idx_product_images_video_card').on(table.productId, table.displayAsCard, table.mediaType),
]);

// ============ PRODUCT OPTIONS & VARIANTS ============

// Option Display Type Enum
export const optionDisplayTypeEnum = pgEnum('option_display_type', [
  'button',   // כפתור טקסט רגיל
  'color',    // בוחר צבע (עיגול צבעוני)
  'pattern',  // דוגמה/פטרן (CSS pattern)
  'image',    // תמונה
]);

// Product Options (e.g., "Size", "Color")
export const productOptions = pgTable('product_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(), // "מידה", "צבע"
  displayType: optionDisplayTypeEnum('display_type').default('button').notNull(), // סוג התצוגה
  sortOrder: integer('sort_order').default(0),
}, (table) => [
  index('idx_product_options_product').on(table.productId),
]);

// Option Values (e.g., "S", "M", "L" for Size)
// For color type: metadata = { color: "#FF0000" }
// For pattern type: metadata = { pattern: "dots", color: "#000" }
// For image type: metadata = { imageUrl: "https://..." }
export const productOptionValues = pgTable('product_option_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  optionId: uuid('option_id').references(() => productOptions.id, { onDelete: 'cascade' }).notNull(),
  value: varchar('value', { length: 100 }).notNull(), // "S", "M", "אדום"
  metadata: jsonb('metadata').default({}), // Additional data based on option type
  sortOrder: integer('sort_order').default(0),
}, (table) => [
  index('idx_option_values_option').on(table.optionId),
]);

// Product Variants (actual purchasable items with price/inventory)
export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(), // "S / אדום"
  sku: varchar('sku', { length: 100 }),
  barcode: varchar('barcode', { length: 100 }),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  comparePrice: decimal('compare_price', { precision: 10, scale: 2 }),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  inventory: integer('inventory').default(0),
  allowBackorder: boolean('allow_backorder').default(false).notNull(), // Allow ordering when out of stock
  weight: decimal('weight', { precision: 10, scale: 3 }),
  imageUrl: varchar('image_url', { length: 500 }),
  option1: varchar('option1', { length: 100 }), // First option value (e.g., "S")
  option2: varchar('option2', { length: 100 }), // Second option value (e.g., "אדום")
  option3: varchar('option3', { length: 100 }), // Third option value (if exists)
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_variants_product').on(table.productId),
  index('idx_variants_sku').on(table.sku),
]);

// Inventory Logs - track all inventory changes
export const inventoryLogs = pgTable('inventory_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  previousQuantity: integer('previous_quantity').notNull(),
  newQuantity: integer('new_quantity').notNull(),
  changeAmount: integer('change_amount').notNull(), // positive = added, negative = removed
  reason: varchar('reason', { length: 50 }).notNull(), // 'manual', 'order', 'restock', 'adjustment', 'return'
  note: varchar('note', { length: 255 }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  changedByUserId: uuid('changed_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  changedByName: varchar('changed_by_name', { length: 100 }), // Store name for display even if user deleted
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_inventory_logs_product').on(table.productId),
  index('idx_inventory_logs_variant').on(table.variantId),
  index('idx_inventory_logs_store').on(table.storeId),
  index('idx_inventory_logs_created').on(table.storeId, table.createdAt),
]);

// ============ PRODUCT ADDONS ============

// Addon Field Type Enum
export const addonFieldTypeEnum = pgEnum('addon_field_type', [
  'text',       // שדה טקסט חופשי
  'select',     // בחירה מרשימה
  'checkbox',   // תיבת סימון
  'radio',      // בחירה בודדת
  'date'        // בחירת תאריך
]);

// Product Addons - Store-level addon templates
export const productAddons = pgTable('product_addons', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(), // "רקמה אישית"
  fieldType: addonFieldTypeEnum('field_type').notNull(), // text, select, checkbox, radio, date
  placeholder: varchar('placeholder', { length: 255 }), // "הכנס טקסט..."
  
  // Options for select/radio/checkbox types
  // Array of { label: string, value: string, priceAdjustment: number }
  options: jsonb('options').default([]),
  
  // Price adjustment for simple types (text, checkbox, date)
  priceAdjustment: decimal('price_adjustment', { precision: 10, scale: 2 }).default('0'),
  
  isRequired: boolean('is_required').default(false).notNull(),
  maxLength: integer('max_length'), // For text fields
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_product_addons_store').on(table.storeId),
]);

// Product Addon Assignments - Links addons to products
export const productAddonAssignments = pgTable('product_addon_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  addonId: uuid('addon_id').references(() => productAddons.id, { onDelete: 'cascade' }).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  
  // Optional overrides for this specific product
  isRequired: boolean('is_required'), // null = use addon default
  priceOverride: decimal('price_override', { precision: 10, scale: 2 }), // null = use addon default
}, (table) => [
  index('idx_addon_assignments_product').on(table.productId),
  index('idx_addon_assignments_addon').on(table.addonId),
  uniqueIndex('idx_addon_assignments_unique').on(table.productId, table.addonId),
]);

// Category Addon Assignments - Links addons to categories (all products in category get these addons)
export const categoryAddonAssignments = pgTable('category_addon_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  addonId: uuid('addon_id').references(() => productAddons.id, { onDelete: 'cascade' }).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  
  // Optional overrides for this category
  isRequired: boolean('is_required'), // null = use addon default
  priceOverride: decimal('price_override', { precision: 10, scale: 2 }), // null = use addon default
}, (table) => [
  index('idx_category_addon_assignments_category').on(table.categoryId),
  index('idx_category_addon_assignments_addon').on(table.addonId),
  uniqueIndex('idx_category_addon_assignments_unique').on(table.categoryId, table.addonId),
]);

// ============ PRODUCT WAITLIST ============

// Product Waitlist - Customers waiting for out-of-stock products
export const productWaitlist = pgTable('product_waitlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }), // null = simple product
  
  // Customer contact details
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  
  // Tracking
  notifiedAt: timestamp('notified_at'), // When email was sent
  isNotified: boolean('is_notified').default(false).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_waitlist_product').on(table.productId),
  index('idx_waitlist_variant').on(table.variantId),
  index('idx_waitlist_store').on(table.storeId),
  index('idx_waitlist_email').on(table.email),
  // Prevent duplicate entries
  uniqueIndex('idx_waitlist_unique_product').on(table.storeId, table.productId, table.email).where(sql`variant_id IS NULL`),
  uniqueIndex('idx_waitlist_unique_variant').on(table.storeId, table.variantId, table.email).where(sql`variant_id IS NOT NULL`),
]);

// ============ PRODUCT BUNDLES ============

// Bundle settings - one per product
export const productBundles = pgTable('product_bundles', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  
  // Bundle type
  bundleType: bundleTypeEnum('bundle_type').default('fixed').notNull(),
  
  // Mix & Match settings
  minSelections: integer('min_selections').default(1),
  maxSelections: integer('max_selections'),
  
  // Pricing
  pricingType: bundlePricingTypeEnum('pricing_type').default('fixed').notNull(),
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }),
  
  // Display settings
  showComponentsInCart: boolean('show_components_in_cart').default(true).notNull(),
  showComponentsOnPage: boolean('show_components_on_page').default(true).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_bundle_product_unique').on(table.productId),
]);

// Bundle components - products that make up the bundle
export const bundleComponents = pgTable('bundle_components', {
  id: uuid('id').primaryKey().defaultRandom(),
  bundleId: uuid('bundle_id').references(() => productBundles.id, { onDelete: 'cascade' }).notNull(),
  
  // The component product
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  
  // Quantity of this component in the bundle
  quantity: integer('quantity').default(1).notNull(),
  
  // Mix & Match options
  isDefault: boolean('is_default').default(true).notNull(),
  isRequired: boolean('is_required').default(false).notNull(),
  
  // Optional price override for this component
  priceOverride: decimal('price_override', { precision: 10, scale: 2 }),
  
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_bundle_components_bundle').on(table.bundleId),
  index('idx_bundle_components_product').on(table.productId),
]);

// ============ PRODUCT BADGES (מדבקות) ============

export const productBadges = pgTable('product_badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  
  // Content
  name: varchar('name', { length: 50 }).notNull(),      // Internal name
  text: varchar('text', { length: 30 }).notNull(),      // Display text
  
  // Styling
  backgroundColor: varchar('background_color', { length: 20 }).default('#000000').notNull(),
  textColor: varchar('text_color', { length: 20 }).default('#FFFFFF').notNull(),
  position: varchar('position', { length: 20 }).default('top-right').notNull(), // top-right|top-left|bottom-right|bottom-left
  
  // Auto-apply rules
  appliesTo: varchar('applies_to', { length: 20 }).default('manual').notNull(), // manual|category|new|featured|sale
  categoryIds: uuid('category_ids').array().default([]),  // For applies_to='category'
  newProductDays: integer('new_product_days').default(14), // For applies_to='new'
  
  // Meta
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_product_badges_store').on(table.storeId),
]);

// Manual badge assignments (for applies_to='manual')
export const productBadgeAssignments = pgTable('product_badge_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  badgeId: uuid('badge_id').references(() => productBadges.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_badge_assignments_product').on(table.productId),
  index('idx_badge_assignments_badge').on(table.badgeId),
  uniqueIndex('idx_badge_assignments_unique').on(table.productId, table.badgeId),
]);

// ============ CUSTOMERS ============

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  defaultAddress: jsonb('default_address'),
  notes: text('notes'),
  totalOrders: integer('total_orders').default(0),
  totalSpent: decimal('total_spent', { precision: 10, scale: 2 }).default('0'),
  creditBalance: decimal('credit_balance', { precision: 10, scale: 2 }).default('0').notNull(),
  acceptsMarketing: boolean('accepts_marketing').default(false),
  emailVerifiedAt: timestamp('email_verified_at'),
  lastLoginAt: timestamp('last_login_at'),
  // CRM Plugin: Customer tags (array of tag IDs from store.crmTags)
  tags: jsonb('tags').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_customers_store_email').on(table.storeId, table.email),
  index('idx_customers_store').on(table.storeId),
]);

// Customer Sessions (for logged-in customers)
export const customerSessions = pgTable('customer_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_customer_sessions_customer').on(table.customerId),
  index('idx_customer_sessions_token').on(table.sessionToken),
]);

// OTP Codes for passwordless login
export const customerOtpCodes = pgTable('customer_otp_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  attempts: integer('attempts').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_customer_otp_customer').on(table.customerId),
]);

// Customer Credit Transactions (store credit history)
export const customerCreditTransactions = pgTable('customer_credit_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  type: creditTransactionTypeEnum('type').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal('balance_after', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason'),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_credit_transactions_customer').on(table.customerId),
  index('idx_credit_transactions_store').on(table.storeId),
]);

// ============ WISHLIST ============

// Wishlist items - for logged-in customers only (guests use localStorage)
export const wishlists = pgTable('wishlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  // Optional note from customer
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_wishlists_customer').on(table.customerId),
  index('idx_wishlists_store').on(table.storeId),
  index('idx_wishlists_product').on(table.productId),
  // Unique constraint: customer can't add same product+variant twice
  uniqueIndex('idx_wishlists_unique').on(table.customerId, table.productId, table.variantId),
]);

// ============ CONTACTS (LEADS) ============

// Unified table for all types of leads: newsletter, club members, contact form, popup form
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  
  // Contact info
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  
  // Type of contact
  type: contactTypeEnum('type').notNull(),
  status: contactStatusEnum('status').default('active').notNull(),
  
  // Additional data (flexible for different form types)
  // For contact_form: { subject, message }
  // For club_member: { birthday, preferences }
  // For popup_form: { popupId, customFields }
  metadata: jsonb('metadata').default({}).notNull(),
  
  // Source tracking
  source: varchar('source', { length: 100 }), // 'footer_form', 'popup', 'contact_page', 'checkout'
  sourceUrl: text('source_url'),
  popupId: uuid('popup_id').references(() => popups.id, { onDelete: 'set null' }),
  
  // UTM tracking
  utmSource: varchar('utm_source', { length: 100 }),
  utmMedium: varchar('utm_medium', { length: 100 }),
  utmCampaign: varchar('utm_campaign', { length: 100 }),
  
  // Device info
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  // Link to customer if they become a customer
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  
  // Read status for admin
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_contacts_store').on(table.storeId),
  index('idx_contacts_store_type').on(table.storeId, table.type),
  index('idx_contacts_store_email').on(table.storeId, table.email),
  index('idx_contacts_unread').on(table.storeId, table.isRead),
]);

// ============ ORDERS ============

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  orderNumber: varchar('order_number', { length: 50 }).notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  financialStatus: financialStatusEnum('financial_status').default('pending').notNull(),
  fulfillmentStatus: fulfillmentStatusEnum('fulfillment_status').default('unfulfilled').notNull(),
  
  // Shipment error tracking (for auto-send failures)
  shipmentError: text('shipment_error'),
  shipmentErrorAt: timestamp('shipment_error_at'),
  
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  discountCode: varchar('discount_code', { length: 50 }),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
  // Detailed breakdown of all discounts applied
  // Array of { type: 'coupon'|'auto'|'gift_card'|'credit'|'member', code?: string, name: string, description?: string, amount: number }
  discountDetails: jsonb('discount_details').$type<Array<{
    type: 'coupon' | 'auto' | 'gift_card' | 'credit' | 'member';
    code?: string;
    name: string;
    description?: string;
    amount: number;
  }>>(),
  creditUsed: decimal('credit_used', { precision: 10, scale: 2 }).default('0'),
  shippingAmount: decimal('shipping_amount', { precision: 10, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('ILS').notNull(),
  
  // Customer info (denormalized for quick access)
  customerEmail: varchar('customer_email', { length: 255 }),
  customerName: varchar('customer_name', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 50 }),
  
  // Addresses
  shippingAddress: jsonb('shipping_address'),
  billingAddress: jsonb('billing_address'),
  shippingMethod: varchar('shipping_method', { length: 100 }),
  
  // Payment info
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentDetails: jsonb('payment_details'),
  paidAt: timestamp('paid_at'),
  
  // Influencer tracking
  influencerId: uuid('influencer_id').references(() => influencers.id, { onDelete: 'set null' }),
  
  // Traffic source tracking (UTM)
  utmSource: varchar('utm_source', { length: 100 }), // google, facebook, instagram, etc.
  utmMedium: varchar('utm_medium', { length: 100 }), // cpc, organic, social, email
  utmCampaign: varchar('utm_campaign', { length: 255 }), // summer_sale, black_friday
  utmContent: varchar('utm_content', { length: 255 }), // ad variant, button type
  utmTerm: varchar('utm_term', { length: 255 }), // paid search keywords
  
  // Device tracking
  deviceType: deviceTypeEnum('device_type'), // mobile, desktop, tablet
  
  // Notes
  note: text('note'),
  internalNote: text('internal_note'),
  
  // Read status
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  
  // Archive
  archivedAt: timestamp('archived_at'), // null = not archived, timestamp = when archived
  
  // Invoice (Payper)
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  invoiceLink: varchar('invoice_link', { length: 500 }),
  invoiceGeneratedAt: timestamp('invoice_generated_at'),
  
  // Custom workflow status (store-specific, e.g., "הועבר למתפרה", "בתפירה")
  // References customOrderStatuses[].id from stores table
  customStatus: varchar('custom_status', { length: 50 }),
  
  // CRM Plugin: Who created this order (e.g., POS agent)
  createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_orders_store_number').on(table.storeId, table.orderNumber),
  index('idx_orders_store').on(table.storeId),
  index('idx_orders_customer').on(table.customerId),
  index('idx_orders_status').on(table.storeId, table.status),
  index('idx_orders_unread').on(table.storeId, table.isRead),
  index('idx_orders_influencer').on(table.influencerId),
  index('idx_orders_created_by').on(table.createdByUserId),
]);

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  variantTitle: varchar('variant_title', { length: 255 }),
  sku: varchar('sku', { length: 100 }),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  properties: jsonb('properties').default({}),
}, (table) => [
  index('idx_order_items_order').on(table.orderId),
]);

// ============ DISCOUNTS ============

export const discounts = pgTable('discounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }),
  type: discountTypeEnum('type').notNull(),
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  minimumAmount: decimal('minimum_amount', { precision: 10, scale: 2 }),
  usageLimit: integer('usage_limit'),
  usageCount: integer('usage_count').default(0),
  oncePerCustomer: boolean('once_per_customer').default(false).notNull(),
  firstOrderOnly: boolean('first_order_only').default(false).notNull(),
  stackable: boolean('stackable').default(true).notNull(), // Can combine with other coupons
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  isActive: boolean('is_active').default(true).notNull(),
  
  // What the coupon applies to
  appliesTo: discountAppliesToEnum('applies_to').default('all').notNull(),
  categoryIds: jsonb('category_ids').default([]), // Array of category IDs when appliesTo = 'category'
  productIds: jsonb('product_ids').default([]), // Array of product IDs when appliesTo = 'product'
  
  // Exclusions - products/categories to exclude from the coupon even if appliesTo matches
  excludeCategoryIds: jsonb('exclude_category_ids').default([]),
  excludeProductIds: jsonb('exclude_product_ids').default([]),
  
  // ===== ADVANCED DISCOUNT TYPES =====
  
  // For buy_x_pay_y: קנה X מוצרים שלם Y ש"ח
  buyQuantity: integer('buy_quantity'), // כמות לקנייה (buy_x_pay_y, buy_x_get_y)
  payAmount: decimal('pay_amount', { precision: 10, scale: 2 }), // סכום לתשלום (buy_x_pay_y, spend_x_pay_y)
  
  // For buy_x_get_y: קנה X קבל Y במתנה (אותו מוצר או מוצרים מהרשימה)
  getQuantity: integer('get_quantity'), // כמות מוצרים במתנה (buy_x_get_y)
  getDiscountPercent: integer('get_discount_percent').default(100), // אחוז הנחה על Y (100 = חינם, 50 = 50% הנחה)
  giftSameProduct: boolean('gift_same_product').default(true), // האם המתנה היא אותו מוצר (buy_x_get_y)
  
  // For gift_product: מוצר במתנה עם תנאים (מינימום סכום/כמות)
  // giftProductIds משמש גם ל-buy_x_get_y וגם ל-gift_product
  giftProductIds: jsonb('gift_product_ids').default([]), // מזהי מוצרים במתנה (buy_x_get_y, gift_product)
  
  // For quantity_discount: הנחות כמות מדורגות
  // Format: [{ minQuantity: 2, discountPercent: 10 }, { minQuantity: 3, discountPercent: 20 }]
  quantityTiers: jsonb('quantity_tiers').default([]),
  
  // For spend_x_pay_y: קנה ב-X שלם Y
  spendAmount: decimal('spend_amount', { precision: 10, scale: 2 }), // סכום מינימום להוצאה
  
  // For gift_product: תנאים נוספים
  minimumQuantity: integer('minimum_quantity'), // מינימום כמות פריטים בסל (gift_product)
  
  // For gift_product: טריגר על קופונים אחרים
  // כאשר מזינים אחד מהקופונים ברשימה, הקופון הזה (מוצר מתנה) מופעל אוטומטית
  triggerCouponCodes: jsonb('trigger_coupon_codes').default([]), // רשימת קודי קופונים שמפעילים את המתנה
  
  // קופון משולב (combo coupon) - מפעיל קופונים אחרים
  // כאשר מזינים קופון זה, גם הקופונים ברשימה מופעלים אוטומטית
  // דוגמה: קופון "yogev" עם activatesCouponCodes: ["miran", "maria", "danit"]
  activatesCouponCodes: jsonb('activates_coupon_codes').default([]), // רשימת קודי קופונים שהקופון הזה מפעיל
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_discounts_store_code').on(table.storeId, table.code),
  index('idx_discounts_store').on(table.storeId),
]);

// ============ AUTOMATIC DISCOUNTS ============

export const automaticDiscounts = pgTable('automatic_discounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 500 }),
  type: discountTypeEnum('type').notNull(),
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  
  // What the discount applies to
  appliesTo: discountAppliesToEnum('applies_to').notNull(),
  categoryIds: jsonb('category_ids').default([]), // Array of category IDs when appliesTo = 'category'
  productIds: jsonb('product_ids').default([]), // Array of product IDs when appliesTo = 'product'
  
  // Conditions
  minimumAmount: decimal('minimum_amount', { precision: 10, scale: 2 }),
  minimumQuantity: integer('minimum_quantity'),
  
  // Date range
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  
  // Settings
  priority: integer('priority').default(0).notNull(), // Higher = applied first
  stackable: boolean('stackable').default(true).notNull(), // Can combine with other discounts
  
  // ===== ADVANCED DISCOUNT TYPES =====
  
  // For buy_x_pay_y: קנה X מוצרים שלם Y ש"ח
  buyQuantity: integer('buy_quantity'), // כמות לקנייה (buy_x_pay_y, buy_x_get_y)
  payAmount: decimal('pay_amount', { precision: 10, scale: 2 }), // סכום לתשלום (buy_x_pay_y, spend_x_pay_y)
  
  // For buy_x_get_y: קנה X קבל Y במתנה (אותו מוצר או מוצרים מהרשימה)
  getQuantity: integer('get_quantity'), // כמות מוצרים במתנה (buy_x_get_y)
  getDiscountPercent: integer('get_discount_percent').default(100), // אחוז הנחה על Y (100 = חינם, 50 = 50% הנחה)
  giftSameProduct: boolean('gift_same_product').default(true), // האם המתנה היא אותו מוצר (buy_x_get_y)
  
  // For gift_product: מוצר במתנה עם תנאים (מינימום סכום/כמות)
  // giftProductIds משמש גם ל-buy_x_get_y וגם ל-gift_product
  giftProductIds: jsonb('gift_product_ids').default([]), // מזהי מוצרים במתנה (buy_x_get_y, gift_product)
  
  // For quantity_discount: הנחות כמות מדורגות
  quantityTiers: jsonb('quantity_tiers').default([]),
  
  // For spend_x_pay_y: קנה ב-X שלם Y
  spendAmount: decimal('spend_amount', { precision: 10, scale: 2 }),
  
  // Exclusions
  excludeCategoryIds: jsonb('exclude_category_ids').default([]),
  excludeProductIds: jsonb('exclude_product_ids').default([]),
  
  // Usage tracking
  usageCount: integer('usage_count').default(0),
  
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_automatic_discounts_store').on(table.storeId),
  index('idx_automatic_discounts_applies_to').on(table.storeId, table.appliesTo),
]);

// ============ STORE EVENTS (for automations & tracking) ============

export const eventTypeEnum = pgEnum('event_type', [
  'order.created', 'order.paid', 'order.fulfilled', 'order.cancelled',
  'customer.created', 'customer.updated', 'customer.tag_added',
  'product.low_stock', 'product.out_of_stock',
  'discount.used',
  'cart.abandoned',
]);

export const storeEvents = pgTable('store_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  eventType: eventTypeEnum('event_type').notNull(),
  resourceId: uuid('resource_id'), // order_id, customer_id, product_id, etc.
  resourceType: varchar('resource_type', { length: 50 }), // 'order', 'customer', 'product'
  data: jsonb('data').default({}).notNull(), // Event payload
  processedAt: timestamp('processed_at'), // When webhooks were sent
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_store_events_store').on(table.storeId),
  index('idx_store_events_type').on(table.storeId, table.eventType),
  index('idx_store_events_created').on(table.createdAt),
]);

// ============ NOTIFICATIONS (dashboard & mobile app) ============

export const notificationTypeEnum = pgEnum('notification_type', [
  'new_order', 'low_stock', 'out_of_stock', 'new_customer', 'order_cancelled', 'system'
]);

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }), // For dashboard
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message'),
  resourceId: uuid('resource_id'), // Link to order/product/etc.
  resourceType: varchar('resource_type', { length: 50 }),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  // For mobile push notifications
  pushSent: boolean('push_sent').default(false),
  pushSentAt: timestamp('push_sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_notifications_store').on(table.storeId),
  index('idx_notifications_user').on(table.userId),
  index('idx_notifications_unread').on(table.storeId, table.isRead),
]);

// ============ WEBHOOKS (for external automations) ============

export const webhooks = pgTable('webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  secret: varchar('secret', { length: 255 }), // For HMAC signature
  events: jsonb('events').default([]).notNull(), // Array of event types to listen to
  headers: jsonb('headers').default({}), // Custom headers
  isActive: boolean('is_active').default(true).notNull(),
  lastTriggeredAt: timestamp('last_triggered_at'),
  failureCount: integer('failure_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_webhooks_store').on(table.storeId),
  index('idx_webhooks_active').on(table.storeId, table.isActive),
]);

// Webhook delivery log (for debugging)
export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookId: uuid('webhook_id').references(() => webhooks.id, { onDelete: 'cascade' }).notNull(),
  eventId: uuid('event_id').references(() => storeEvents.id, { onDelete: 'set null' }),
  statusCode: integer('status_code'),
  responseBody: text('response_body'),
  error: text('error'),
  duration: integer('duration'), // Response time in ms
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_webhook_deliveries_webhook').on(table.webhookId),
]);

// ============ AUTOMATIONS SYSTEM ============
// "If this then that" automation rules for stores

export const automationTriggerTypeEnum = pgEnum('automation_trigger_type', [
  // Order events
  'order.created',
  'order.paid',
  'order.fulfilled',
  'order.cancelled',
  // Customer events
  'customer.created',
  'customer.updated',
  'customer.tag_added',
  'customer.tag_removed',
  // Product events
  'product.low_stock',
  'product.out_of_stock',
  // Cart events
  'cart.abandoned',
  // Time-based
  'schedule.daily',
  'schedule.weekly',
]);

export const automationActionTypeEnum = pgEnum('automation_action_type', [
  // Core system actions (available to all)
  'send_email',
  'send_sms',
  'send_whatsapp', // WhatsApp Trustory Plugin
  'change_order_status',
  'add_customer_tag',
  'remove_customer_tag',
  'update_marketing_consent',
  'webhook_call',
  // CRM Plugin actions (require CRM plugin)
  'crm.create_task',
  'crm.add_note',
]);

export const automations = pgTable('automations', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  
  // Metadata
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Trigger configuration
  triggerType: automationTriggerTypeEnum('trigger_type').notNull(),
  triggerConditions: jsonb('trigger_conditions').default({}).notNull(), // e.g., { minOrderTotal: 100 }
  
  // Action configuration
  actionType: automationActionTypeEnum('action_type').notNull(),
  actionConfig: jsonb('action_config').default({}).notNull(), // e.g., { template: "abandoned_cart", delay: 60 }
  
  // Timing
  delayMinutes: integer('delay_minutes').default(0).notNull(), // delay before executing action
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  isBuiltIn: boolean('is_built_in').default(false).notNull(), // true for system automations
  
  // Stats
  totalRuns: integer('total_runs').default(0).notNull(),
  totalSuccesses: integer('total_successes').default(0).notNull(),
  totalFailures: integer('total_failures').default(0).notNull(),
  lastRunAt: timestamp('last_run_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_automations_store').on(table.storeId),
  index('idx_automations_store_trigger').on(table.storeId, table.triggerType),
  index('idx_automations_active').on(table.storeId, table.isActive),
]);

export const automationRunStatusEnum = pgEnum('automation_run_status', [
  'pending',
  'scheduled',
  'running',
  'completed',
  'failed',
  'cancelled',
]);

export const automationRuns = pgTable('automation_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  automationId: uuid('automation_id').references(() => automations.id, { onDelete: 'cascade' }).notNull(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  
  // Trigger info
  triggerEventId: uuid('trigger_event_id').references(() => storeEvents.id, { onDelete: 'set null' }),
  triggerData: jsonb('trigger_data').default({}).notNull(), // snapshot of trigger data
  
  // Target info
  resourceId: uuid('resource_id'), // order_id, customer_id, etc.
  resourceType: varchar('resource_type', { length: 50 }), // 'order', 'customer', etc.
  
  // Execution
  status: automationRunStatusEnum('status').default('pending').notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  
  // Result
  result: jsonb('result'), // { success: true, emailSent: true, ... }
  error: text('error'),
  
  // Scheduling (for delayed automations)
  scheduledFor: timestamp('scheduled_for'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_automation_runs_automation').on(table.automationId),
  index('idx_automation_runs_store').on(table.storeId),
  index('idx_automation_runs_status').on(table.status),
  index('idx_automation_runs_scheduled').on(table.scheduledFor),
  index('idx_automation_runs_created').on(table.createdAt),
]);

// ============ CRM PLUGIN ============

// CRM Notes - notes about customers
export const crmNotes = pgTable('crm_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }), // Who wrote the note
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_crm_notes_store').on(table.storeId),
  index('idx_crm_notes_customer').on(table.customerId),
]);

// CRM Tasks - tasks related to customers or orders
export const crmTasks = pgTable('crm_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  dueDate: timestamp('due_date'),
  priority: crmTaskPriorityEnum('priority').default('medium').notNull(),
  status: crmTaskStatusEnum('status').default('pending').notNull(),
  completedAt: timestamp('completed_at'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_crm_tasks_store').on(table.storeId),
  index('idx_crm_tasks_customer').on(table.customerId),
  index('idx_crm_tasks_order').on(table.orderId),
  index('idx_crm_tasks_assigned').on(table.assignedTo),
  index('idx_crm_tasks_status').on(table.storeId, table.status),
  index('idx_crm_tasks_due_date').on(table.storeId, table.dueDate),
]);

// ============ ANALYTICS - Traffic & Behavior ============

// Analytics events - page views, product views, add to cart, etc.
export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  sessionId: varchar('session_id', { length: 100 }).notNull(), // Browser session identifier
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  eventType: analyticsEventTypeEnum('event_type').notNull(),
  
  // Traffic source
  utmSource: varchar('utm_source', { length: 100 }), // google, facebook, instagram
  utmMedium: varchar('utm_medium', { length: 100 }), // cpc, organic, social
  utmCampaign: varchar('utm_campaign', { length: 255 }), // summer_sale
  utmContent: varchar('utm_content', { length: 255 }),
  utmTerm: varchar('utm_term', { length: 255 }),
  referrer: varchar('referrer', { length: 500 }), // Full referrer URL
  referrerDomain: varchar('referrer_domain', { length: 255 }), // Extracted domain
  
  // Page info
  pageUrl: varchar('page_url', { length: 500 }).notNull(),
  pagePath: varchar('page_path', { length: 255 }).notNull(),
  pageTitle: varchar('page_title', { length: 255 }),
  landingPage: varchar('landing_page', { length: 500 }), // First page in session
  
  // Product info (for product_view, add_to_cart)
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: varchar('product_name', { length: 255 }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  categoryName: varchar('category_name', { length: 255 }),
  
  // Order info (for purchase event)
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  orderValue: decimal('order_value', { precision: 10, scale: 2 }),
  
  // Device & Browser
  deviceType: deviceTypeEnum('device_type'),
  browser: varchar('browser', { length: 100 }), // Chrome, Safari, Firefox
  browserVersion: varchar('browser_version', { length: 50 }),
  os: varchar('os', { length: 100 }), // Windows, macOS, iOS, Android
  osVersion: varchar('os_version', { length: 50 }),
  screenWidth: integer('screen_width'),
  screenHeight: integer('screen_height'),
  
  // Location (from IP)
  country: varchar('country', { length: 2 }), // IL, US
  city: varchar('city', { length: 100 }),
  region: varchar('region', { length: 100 }), // מרכז, צפון, דרום
  
  // Timing
  timeOnPage: integer('time_on_page'), // seconds (filled on next page view)
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_analytics_store').on(table.storeId),
  index('idx_analytics_session').on(table.sessionId),
  index('idx_analytics_created').on(table.storeId, table.createdAt),
  index('idx_analytics_event_type').on(table.storeId, table.eventType),
  index('idx_analytics_utm').on(table.storeId, table.utmSource, table.utmMedium),
  index('idx_analytics_product').on(table.productId),
]);

// Analytics Daily - aggregated data from Redis (one row per store per day)
// This table is populated by a Cron job that runs hourly
// Much more efficient than storing every event in the events table
export const analyticsDaily = pgTable('analytics_daily', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  
  // Traffic
  pageViews: integer('page_views').default(0).notNull(),
  uniqueVisitors: integer('unique_visitors').default(0),
  
  // Funnel
  productViews: integer('product_views').default(0).notNull(),
  addToCart: integer('add_to_cart').default(0).notNull(),
  beginCheckout: integer('begin_checkout').default(0).notNull(),
  purchases: integer('purchases').default(0).notNull(),
  
  // Revenue
  revenue: decimal('revenue', { precision: 10, scale: 2 }).default('0').notNull(),
  orders: integer('orders').default(0).notNull(),
  
  // Device breakdown
  desktopViews: integer('desktop_views').default(0),
  mobileViews: integer('mobile_views').default(0),
  tabletViews: integer('tablet_views').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_analytics_daily_store').on(table.storeId),
  index('idx_analytics_daily_date').on(table.storeId, table.date),
]);

// Search queries - what customers search for
export const searchQueries = pgTable('search_queries', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  sessionId: varchar('session_id', { length: 100 }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  query: varchar('query', { length: 255 }).notNull(),
  resultsCount: integer('results_count').default(0),
  clickedProductId: uuid('clicked_product_id').references(() => products.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_search_store').on(table.storeId),
  index('idx_search_created').on(table.storeId, table.createdAt),
  index('idx_search_query').on(table.storeId, table.query),
]);

// Abandoned carts (detailed tracking)
export const abandonedCarts = pgTable('abandoned_carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  sessionId: varchar('session_id', { length: 100 }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  email: varchar('email', { length: 255 }),
  items: jsonb('items').default([]).notNull(), // Cart items snapshot
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  checkoutStep: varchar('checkout_step', { length: 50 }), // cart, shipping, payment
  recoveryToken: varchar('recovery_token', { length: 100 }).unique(),
  reminderSentAt: timestamp('reminder_sent_at'),
  reminderCount: integer('reminder_count').default(0),
  recoveredAt: timestamp('recovered_at'), // When customer completed purchase
  recoveredOrderId: uuid('recovered_order_id').references(() => orders.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_abandoned_store').on(table.storeId),
  index('idx_abandoned_created').on(table.storeId, table.createdAt),
  index('idx_abandoned_email').on(table.email),
]);

// ============ GIFT CARDS ============

export const giftCards = pgTable('gift_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  initialBalance: decimal('initial_balance', { precision: 10, scale: 2 }).notNull(),
  currentBalance: decimal('current_balance', { precision: 10, scale: 2 }).notNull(),
  status: giftCardStatusEnum('status').default('active').notNull(),
  
  // Recipient info
  recipientEmail: varchar('recipient_email', { length: 255 }),
  recipientName: varchar('recipient_name', { length: 255 }),
  senderName: varchar('sender_name', { length: 255 }),
  message: text('message'),
  
  // Purchase info
  purchasedById: uuid('purchased_by_id').references(() => customers.id, { onDelete: 'set null' }),
  purchasedOrderId: uuid('purchased_order_id').references(() => orders.id, { onDelete: 'set null' }),
  
  expiresAt: timestamp('expires_at'),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_gift_cards_store_code').on(table.storeId, table.code),
  index('idx_gift_cards_store').on(table.storeId),
]);

// Gift card transactions (usage history)
export const giftCardTransactions = pgTable('gift_card_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  giftCardId: uuid('gift_card_id').references(() => giftCards.id, { onDelete: 'cascade' }).notNull(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal('balance_after', { precision: 10, scale: 2 }).notNull(),
  note: varchar('note', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_gift_card_transactions_card').on(table.giftCardId),
]);

// ============ DRAFT ORDERS ============

export const draftOrders = pgTable('draft_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerName: varchar('customer_name', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 50 }),
  
  items: jsonb('items').default([]).notNull(), // { productId, variantId, name, price, quantity, imageUrl }
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).default('0'),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
  shipping: decimal('shipping', { precision: 10, scale: 2 }).default('0'),
  tax: decimal('tax', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).default('0'),
  
  shippingAddress: jsonb('shipping_address'),
  billingAddress: jsonb('billing_address'),
  notes: text('notes'),
  tags: jsonb('tags').default([]),
  
  // Converted to real order
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  completedAt: timestamp('completed_at'),
  
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_draft_orders_store').on(table.storeId),
  index('idx_draft_orders_customer').on(table.customerId),
]);

// ============ INFLUENCERS ============

export const influencers = pgTable('influencers', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }), // For login access
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }), // For direct login without user account
  phone: varchar('phone', { length: 50 }),
  
  // Social media
  instagramHandle: varchar('instagram_handle', { length: 100 }),
  instagramFollowers: integer('instagram_followers'),
  tiktokHandle: varchar('tiktok_handle', { length: 100 }),
  tiktokFollowers: integer('tiktok_followers'),
  youtubeChannel: varchar('youtube_channel', { length: 100 }),
  youtubeSubscribers: integer('youtube_subscribers'),
  
  // Commission settings
  commissionType: discountTypeEnum('commission_type').default('percentage'),
  commissionValue: decimal('commission_value', { precision: 10, scale: 2 }), // null = אין עמלה מוגדרת
  
  // Dashboard visibility settings (managed by store admin)
  showCommission: boolean('show_commission').default(true).notNull(),
  showCustomerNames: boolean('show_customer_names').default(true).notNull(),
  showOrderDetails: boolean('show_order_details').default(true).notNull(),
  
  // Linked discounts (coupon or automatic)
  couponCode: varchar('coupon_code', { length: 50 }),
  discountId: uuid('discount_id').references(() => discounts.id, { onDelete: 'set null' }), // deprecated - use discountIds
  discountIds: jsonb('discount_ids').default([]), // מערך מזהי קופונים למשפיען
  automaticDiscountId: uuid('automatic_discount_id').references(() => automaticDiscounts.id, { onDelete: 'set null' }),
  
  // Stats
  totalSales: decimal('total_sales', { precision: 10, scale: 2 }).default('0'),
  totalCommission: decimal('total_commission', { precision: 10, scale: 2 }).default('0'),
  totalOrders: integer('total_orders').default(0),
  totalRefunds: decimal('total_refunds', { precision: 10, scale: 2 }).default('0'),
  
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_influencers_store').on(table.storeId),
  index('idx_influencers_user').on(table.userId),
  uniqueIndex('idx_influencers_coupon').on(table.storeId, table.couponCode),
  uniqueIndex('idx_influencers_email').on(table.storeId, table.email),
]);

// Influencer sales tracking
export const influencerSales = pgTable('influencer_sales', {
  id: uuid('id').primaryKey().defaultRandom(),
  influencerId: uuid('influencer_id').references(() => influencers.id, { onDelete: 'cascade' }).notNull(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  orderTotal: decimal('order_total', { precision: 10, scale: 2 }).notNull(),
  commissionAmount: decimal('commission_amount', { precision: 10, scale: 2 }).notNull(),
  refundAmount: decimal('refund_amount', { precision: 10, scale: 2 }).default('0'),
  netCommission: decimal('net_commission', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, paid, refunded
  commissionPaidAt: timestamp('commission_paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_influencer_sales_influencer').on(table.influencerId),
  index('idx_influencer_sales_order').on(table.orderId),
  index('idx_influencer_sales_status').on(table.influencerId, table.status),
]);

// Influencer commission payouts (periodic payments)
export const influencerPayouts = pgTable('influencer_payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  influencerId: uuid('influencer_id').references(() => influencers.id, { onDelete: 'cascade' }).notNull(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  totalSales: decimal('total_sales', { precision: 10, scale: 2 }).notNull(),
  totalOrders: integer('total_orders').notNull(),
  totalRefunds: decimal('total_refunds', { precision: 10, scale: 2 }).default('0'),
  grossCommission: decimal('gross_commission', { precision: 10, scale: 2 }).notNull(),
  netCommission: decimal('net_commission', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, approved, paid, cancelled
  paidAt: timestamp('paid_at'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentReference: varchar('payment_reference', { length: 255 }),
  notes: text('notes'),
  createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_influencer_payouts_influencer').on(table.influencerId),
  index('idx_influencer_payouts_store').on(table.storeId),
  index('idx_influencer_payouts_status').on(table.status),
]);

// Influencer sessions (for influencer login)
export const influencerSessions = pgTable('influencer_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  influencerId: uuid('influencer_id').references(() => influencers.id, { onDelete: 'cascade' }).notNull(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_influencer_sessions_influencer').on(table.influencerId),
  index('idx_influencer_sessions_token').on(table.sessionToken),
]);

// ============ TAX SETTINGS ============

export const taxRates = pgTable('tax_rates', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  rate: decimal('rate', { precision: 5, scale: 3 }).notNull(), // e.g., 18.000 for 18%
  country: varchar('country', { length: 2 }), // ISO country code, null = all
  region: varchar('region', { length: 100 }), // State/province
  includeInPrice: boolean('include_in_price').default(true), // Tax-inclusive pricing
  applyToShipping: boolean('apply_to_shipping').default(false),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true).notNull(),
  priority: integer('priority').default(0), // Higher = applied first
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_tax_rates_store').on(table.storeId),
  index('idx_tax_rates_country').on(table.storeId, table.country),
]);

// ============ SHIPPING ZONES & METHODS ============

// Shipping Method Type Enum
export const shippingMethodTypeEnum = pgEnum('shipping_method_type', [
  'flat_rate',     // מחיר קבוע
  'free',          // חינם (עם/בלי תנאים)
  'weight_based',  // לפי משקל
  'price_based',   // לפי סכום הזמנה
  'local_pickup',  // איסוף עצמי
]);

// Shipping Zones - אזורי משלוח (לפי מדינות)
export const shippingZones = pgTable('shipping_zones', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(), // "ישראל", "אירופה", "עולמי"
  countries: jsonb('countries').default([]).notNull().$type<string[]>(), // ["IL"], ["DE", "FR"], ["*"]
  isDefault: boolean('is_default').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_shipping_zones_store').on(table.storeId),
]);

// Shipping Methods - שיטות משלוח לכל אזור
export const shippingMethods = pgTable('shipping_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  zoneId: uuid('zone_id').references(() => shippingZones.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(), // "משלוח רגיל", "מהיר", "איסוף"
  description: text('description'), // תיאור נוסף
  type: shippingMethodTypeEnum('type').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).default('0').notNull(), // מחיר בסיס
  
  // Conditions - תנאים (JSONB)
  conditions: jsonb('conditions').default({}).$type<{
    minOrderAmount?: number;  // מינימום הזמנה (משלוח חינם מעל X)
    maxOrderAmount?: number;  // מקסימום הזמנה
    minWeight?: number;       // משקל מינימלי (kg)
    maxWeight?: number;       // משקל מקסימלי (kg)
    weightRate?: number;      // מחיר לכל ק"ג נוסף
    baseWeight?: number;      // משקל בסיס כולל במחיר (ק"ג)
  }>(),
  
  estimatedDays: varchar('estimated_days', { length: 100 }), // "3-5 ימי עסקים"
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_shipping_methods_zone').on(table.zoneId),
]);

// Pickup Locations - נקודות איסוף עצמי
export const pickupLocations = pgTable('pickup_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(), // "סניף תל אביב"
  address: text('address').notNull(), // "דיזנגוף 50"
  city: varchar('city', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  hours: varchar('hours', { length: 255 }), // "א'-ה' 9:00-18:00"
  instructions: text('instructions'), // הוראות הגעה
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_pickup_locations_store').on(table.storeId),
]);

// Relations
export const shippingZonesRelations = relations(shippingZones, ({ one, many }) => ({
  store: one(stores, {
    fields: [shippingZones.storeId],
    references: [stores.id],
  }),
  methods: many(shippingMethods),
}));

export const shippingMethodsRelations = relations(shippingMethods, ({ one }) => ({
  zone: one(shippingZones, {
    fields: [shippingMethods.zoneId],
    references: [shippingZones.id],
  }),
}));

export const pickupLocationsRelations = relations(pickupLocations, ({ one }) => ({
  store: one(stores, {
    fields: [pickupLocations.storeId],
    references: [stores.id],
  }),
}));

// ============ SHIPPING PROVIDERS (External Integrations) ============

// Shipping provider enum
export const shippingProviderEnum = pgEnum('shipping_provider', [
  'focus', 'cheetah', 'hfd', 'boxit', 'baldar', 'manual'
]);

// Shipment status enum
export const shipmentStatusEnum = pgEnum('shipment_status', [
  'pending', 'created', 'picked_up', 'in_transit', 'out_for_delivery', 
  'delivered', 'failed', 'returned', 'cancelled'
]);

// Shipping Providers - ספקי משלוחים מוגדרים לחנות
export const shippingProviders = pgTable('shipping_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  provider: shippingProviderEnum('provider').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  displayName: varchar('display_name', { length: 100 }),
  testMode: boolean('test_mode').default(true).notNull(),
  credentials: jsonb('credentials').default({}).notNull(), // API keys, secrets (encrypted)
  settings: jsonb('settings').default({}).notNull(), // Auto-send, default package, sender address
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_shipping_providers_store').on(table.storeId),
  index('idx_shipping_providers_active').on(table.storeId, table.isActive),
]);

// Shipments - משלוחים
export const shipments = pgTable('shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  provider: shippingProviderEnum('provider').notNull(),
  
  // Provider identifiers
  providerShipmentId: varchar('provider_shipment_id', { length: 100 }),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  
  // Status
  status: shipmentStatusEnum('status').default('pending').notNull(),
  statusDescription: text('status_description'),
  
  // Label
  labelUrl: text('label_url'),
  
  // Recipient info (snapshot at time of shipment)
  recipientName: varchar('recipient_name', { length: 255 }),
  recipientPhone: varchar('recipient_phone', { length: 50 }),
  recipientAddress: jsonb('recipient_address'), // { street, city, zipCode, etc }
  
  // Package info
  packageWeight: decimal('package_weight', { precision: 6, scale: 2 }),
  packageDimensions: jsonb('package_dimensions'), // { width, height, length }
  
  // Dates
  estimatedDelivery: timestamp('estimated_delivery'),
  actualDelivery: timestamp('actual_delivery'),
  pickedUpAt: timestamp('picked_up_at'),
  
  // Tracking events history
  trackingEvents: jsonb('tracking_events').default([]), // Array of { timestamp, status, description, location }
  
  // Provider raw response
  providerResponse: jsonb('provider_response'),
  
  // Notes
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_shipments_store').on(table.storeId),
  index('idx_shipments_order').on(table.orderId),
  index('idx_shipments_tracking').on(table.trackingNumber),
  index('idx_shipments_status').on(table.storeId, table.status),
]);

// Relations
export const shippingProvidersRelations = relations(shippingProviders, ({ one }) => ({
  store: one(stores, {
    fields: [shippingProviders.storeId],
    references: [stores.id],
  }),
}));

export const shipmentsRelations = relations(shipments, ({ one }) => ({
  store: one(stores, {
    fields: [shipments.storeId],
    references: [stores.id],
  }),
  order: one(orders, {
    fields: [shipments.orderId],
    references: [orders.id],
  }),
}));

// ============ REFUNDS ============

export const refunds = pgTable('refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason'),
  status: refundStatusEnum('status').default('pending').notNull(),
  
  // Which items were refunded
  items: jsonb('items').default([]), // Array of { orderItemId, quantity, amount }
  
  // Method of refund
  refundMethod: varchar('refund_method', { length: 50 }), // original_payment, store_credit, manual
  storeCreditsIssued: decimal('store_credits_issued', { precision: 10, scale: 2 }).default('0'),
  
  // Processing
  processedById: uuid('processed_by_id').references(() => users.id, { onDelete: 'set null' }),
  processedAt: timestamp('processed_at'),
  
  internalNote: text('internal_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_refunds_store').on(table.storeId),
  index('idx_refunds_order').on(table.orderId),
  index('idx_refunds_created').on(table.storeId, table.createdAt),
]);

// ============ RETURN REQUESTS ============

export const returnRequests = pgTable('return_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  
  // מספר בקשה ייחודי לתצוגה
  requestNumber: varchar('request_number', { length: 20 }).notNull(),
  
  // סוג הבקשה
  type: returnRequestTypeEnum('type').notNull(), // 'return' | 'exchange'
  
  // סטטוס
  status: returnRequestStatusEnum('status').default('pending').notNull(),
  
  // פריטים לבקשה
  items: jsonb('items').default([]),
  // [{ orderItemId, productId, variantId, name, quantity, price, reason, condition, imageUrl }]
  
  // סיבת ההחזרה
  reason: returnReasonEnum('reason').notNull(),
  reasonDetails: text('reason_details'), // פרטים נוספים מהלקוח
  
  // תמונות (במקרה של פגם)
  images: jsonb('images').default([]), // [{ url, publicId }]
  
  // סוג הפתרון המבוקש ע"י הלקוח
  requestedResolution: resolutionTypeEnum('requested_resolution').notNull(),
  
  // הפתרון בפועל (נקבע ע"י המנהל)
  finalResolution: resolutionTypeEnum('final_resolution'),
  resolutionDetails: jsonb('resolution_details'),
  // { exchangeOrderId, creditAmount, refundAmount, refundTransactionId }
  
  // ערכים כספיים
  totalValue: decimal('total_value', { precision: 10, scale: 2 }).notNull(),
  refundAmount: decimal('refund_amount', { precision: 10, scale: 2 }),
  creditIssued: decimal('credit_issued', { precision: 10, scale: 2 }),
  
  // הזמנת החלפה (אם רלוונטי)
  exchangeOrderId: uuid('exchange_order_id').references(() => orders.id, { onDelete: 'set null' }),
  
  // מעקב משלוח החזרה
  returnTrackingNumber: varchar('return_tracking_number', { length: 100 }),
  returnCarrier: varchar('return_carrier', { length: 50 }),
  itemReceivedAt: timestamp('item_received_at'),
  
  // הערות
  internalNotes: text('internal_notes'),
  customerNotes: text('customer_notes'), // הודעות ללקוח
  
  // מי טיפל
  processedById: uuid('processed_by_id').references(() => users.id, { onDelete: 'set null' }),
  processedAt: timestamp('processed_at'),
  
  // תאריכים
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_return_requests_store').on(table.storeId),
  index('idx_return_requests_order').on(table.orderId),
  index('idx_return_requests_customer').on(table.customerId),
  index('idx_return_requests_status').on(table.storeId, table.status),
  index('idx_return_requests_created').on(table.storeId, table.createdAt),
]);

// ============ RELATIONS ============

export const usersRelations = relations(users, ({ many }) => ({
  stores: many(stores),
  sessions: many(sessions),
  accounts: many(accounts),
  storeMemberships: many(storeMembers),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  owner: one(users, {
    fields: [stores.ownerId],
    references: [users.id],
  }),
  categories: many(categories),
  products: many(products),
  customers: many(customers),
  orders: many(orders),
  discounts: many(discounts),
  automaticDiscounts: many(automaticDiscounts),
  events: many(storeEvents),
  notifications: many(notifications),
  webhooks: many(webhooks),
  automations: many(automations),
  members: many(storeMembers),
  teamInvitations: many(teamInvitations),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  store: one(stores, {
    fields: [categories.storeId],
    references: [stores.id],
  }),
  products: many(products),
  addonAssignments: many(categoryAddonAssignments),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  options: many(productOptions),
  variants: many(productVariants),
  orderItems: many(orderItems),
  addonAssignments: many(productAddonAssignments),
}));

// Product Addons Relations
export const productAddonsRelations = relations(productAddons, ({ one, many }) => ({
  store: one(stores, {
    fields: [productAddons.storeId],
    references: [stores.id],
  }),
  assignments: many(productAddonAssignments),
  categoryAssignments: many(categoryAddonAssignments),
}));

export const productAddonAssignmentsRelations = relations(productAddonAssignments, ({ one }) => ({
  product: one(products, {
    fields: [productAddonAssignments.productId],
    references: [products.id],
  }),
  addon: one(productAddons, {
    fields: [productAddonAssignments.addonId],
    references: [productAddons.id],
  }),
}));

export const categoryAddonAssignmentsRelations = relations(categoryAddonAssignments, ({ one }) => ({
  category: one(categories, {
    fields: [categoryAddonAssignments.categoryId],
    references: [categories.id],
  }),
  addon: one(productAddons, {
    fields: [categoryAddonAssignments.addonId],
    references: [productAddons.id],
  }),
}));

// Bundle relations
export const productBundlesRelations = relations(productBundles, ({ one, many }) => ({
  product: one(products, {
    fields: [productBundles.productId],
    references: [products.id],
  }),
  components: many(bundleComponents),
}));

export const bundleComponentsRelations = relations(bundleComponents, ({ one }) => ({
  bundle: one(productBundles, {
    fields: [bundleComponents.bundleId],
    references: [productBundles.id],
  }),
  product: one(products, {
    fields: [bundleComponents.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [bundleComponents.variantId],
    references: [productVariants.id],
  }),
}));

export const productBadgesRelations = relations(productBadges, ({ one, many }) => ({
  store: one(stores, {
    fields: [productBadges.storeId],
    references: [stores.id],
  }),
  assignments: many(productBadgeAssignments),
}));

export const productBadgeAssignmentsRelations = relations(productBadgeAssignments, ({ one }) => ({
  product: one(products, {
    fields: [productBadgeAssignments.productId],
    references: [products.id],
  }),
  badge: one(productBadges, {
    fields: [productBadgeAssignments.badgeId],
    references: [productBadges.id],
  }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productOptionsRelations = relations(productOptions, ({ one, many }) => ({
  product: one(products, {
    fields: [productOptions.productId],
    references: [products.id],
  }),
  values: many(productOptionValues),
}));

export const productOptionValuesRelations = relations(productOptionValues, ({ one }) => ({
  option: one(productOptions, {
    fields: [productOptionValues.optionId],
    references: [productOptions.id],
  }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  store: one(stores, {
    fields: [customers.storeId],
    references: [stores.id],
  }),
  orders: many(orders),
  sessions: many(customerSessions),
  otpCodes: many(customerOtpCodes),
  creditTransactions: many(customerCreditTransactions),
  contacts: many(contacts),
  wishlists: many(wishlists),
}));

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  store: one(stores, {
    fields: [wishlists.storeId],
    references: [stores.id],
  }),
  customer: one(customers, {
    fields: [wishlists.customerId],
    references: [customers.id],
  }),
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [wishlists.variantId],
    references: [productVariants.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  store: one(stores, {
    fields: [contacts.storeId],
    references: [stores.id],
  }),
  customer: one(customers, {
    fields: [contacts.customerId],
    references: [customers.id],
  }),
  popup: one(popups, {
    fields: [contacts.popupId],
    references: [popups.id],
  }),
}));

export const customerCreditTransactionsRelations = relations(customerCreditTransactions, ({ one }) => ({
  customer: one(customers, {
    fields: [customerCreditTransactions.customerId],
    references: [customers.id],
  }),
  store: one(stores, {
    fields: [customerCreditTransactions.storeId],
    references: [stores.id],
  }),
  order: one(orders, {
    fields: [customerCreditTransactions.orderId],
    references: [orders.id],
  }),
  createdBy: one(users, {
    fields: [customerCreditTransactions.createdById],
    references: [users.id],
  }),
}));

export const customerSessionsRelations = relations(customerSessions, ({ one }) => ({
  customer: one(customers, {
    fields: [customerSessions.customerId],
    references: [customers.id],
  }),
}));

export const customerOtpCodesRelations = relations(customerOtpCodes, ({ one }) => ({
  customer: one(customers, {
    fields: [customerOtpCodes.customerId],
    references: [customers.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  store: one(stores, {
    fields: [orders.storeId],
    references: [stores.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const discountsRelations = relations(discounts, ({ one }) => ({
  store: one(stores, {
    fields: [discounts.storeId],
    references: [stores.id],
  }),
}));

export const pageSectionsRelations = relations(pageSections, ({ one }) => ({
  store: one(stores, {
    fields: [pageSections.storeId],
    references: [stores.id],
  }),
}));

export const automaticDiscountsRelations = relations(automaticDiscounts, ({ one }) => ({
  store: one(stores, {
    fields: [automaticDiscounts.storeId],
    references: [stores.id],
  }),
}));

export const storeEventsRelations = relations(storeEvents, ({ one }) => ({
  store: one(stores, {
    fields: [storeEvents.storeId],
    references: [stores.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  store: one(stores, {
    fields: [notifications.storeId],
    references: [stores.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const webhooksRelations = relations(webhooks, ({ one, many }) => ({
  store: one(stores, {
    fields: [webhooks.storeId],
    references: [stores.id],
  }),
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  webhook: one(webhooks, {
    fields: [webhookDeliveries.webhookId],
    references: [webhooks.id],
  }),
  event: one(storeEvents, {
    fields: [webhookDeliveries.eventId],
    references: [storeEvents.id],
  }),
}));

// Automations relations
export const automationsRelations = relations(automations, ({ one, many }) => ({
  store: one(stores, {
    fields: [automations.storeId],
    references: [stores.id],
  }),
  runs: many(automationRuns),
}));

export const automationRunsRelations = relations(automationRuns, ({ one }) => ({
  automation: one(automations, {
    fields: [automationRuns.automationId],
    references: [automations.id],
  }),
  store: one(stores, {
    fields: [automationRuns.storeId],
    references: [stores.id],
  }),
  triggerEvent: one(storeEvents, {
    fields: [automationRuns.triggerEventId],
    references: [storeEvents.id],
  }),
}));

// CRM Plugin relations
export const crmNotesRelations = relations(crmNotes, ({ one }) => ({
  store: one(stores, {
    fields: [crmNotes.storeId],
    references: [stores.id],
  }),
  customer: one(customers, {
    fields: [crmNotes.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [crmNotes.userId],
    references: [users.id],
  }),
}));

export const crmTasksRelations = relations(crmTasks, ({ one }) => ({
  store: one(stores, {
    fields: [crmTasks.storeId],
    references: [stores.id],
  }),
  customer: one(customers, {
    fields: [crmTasks.customerId],
    references: [customers.id],
  }),
  order: one(orders, {
    fields: [crmTasks.orderId],
    references: [orders.id],
  }),
  assignedToUser: one(users, {
    fields: [crmTasks.assignedTo],
    references: [users.id],
    relationName: 'assignedTo',
  }),
  createdByUser: one(users, {
    fields: [crmTasks.createdBy],
    references: [users.id],
    relationName: 'createdBy',
  }),
}));

// Analytics relations
export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  store: one(stores, {
    fields: [analyticsEvents.storeId],
    references: [stores.id],
  }),
  customer: one(customers, {
    fields: [analyticsEvents.customerId],
    references: [customers.id],
  }),
  product: one(products, {
    fields: [analyticsEvents.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [analyticsEvents.categoryId],
    references: [categories.id],
  }),
  order: one(orders, {
    fields: [analyticsEvents.orderId],
    references: [orders.id],
  }),
}));

export const searchQueriesRelations = relations(searchQueries, ({ one }) => ({
  store: one(stores, {
    fields: [searchQueries.storeId],
    references: [stores.id],
  }),
  customer: one(customers, {
    fields: [searchQueries.customerId],
    references: [customers.id],
  }),
  clickedProduct: one(products, {
    fields: [searchQueries.clickedProductId],
    references: [products.id],
  }),
}));

export const abandonedCartsRelations = relations(abandonedCarts, ({ one }) => ({
  store: one(stores, {
    fields: [abandonedCarts.storeId],
    references: [stores.id],
  }),
  customer: one(customers, {
    fields: [abandonedCarts.customerId],
    references: [customers.id],
  }),
  recoveredOrder: one(orders, {
    fields: [abandonedCarts.recoveredOrderId],
    references: [orders.id],
  }),
}));

// Gift cards relations
export const giftCardsRelations = relations(giftCards, ({ one, many }) => ({
  store: one(stores, {
    fields: [giftCards.storeId],
    references: [stores.id],
  }),
  purchasedBy: one(customers, {
    fields: [giftCards.purchasedById],
    references: [customers.id],
  }),
  purchasedOrder: one(orders, {
    fields: [giftCards.purchasedOrderId],
    references: [orders.id],
  }),
  transactions: many(giftCardTransactions),
}));

export const draftOrdersRelations = relations(draftOrders, ({ one }) => ({
  store: one(stores, {
    fields: [draftOrders.storeId],
    references: [stores.id],
  }),
  customer: one(customers, {
    fields: [draftOrders.customerId],
    references: [customers.id],
  }),
  order: one(orders, {
    fields: [draftOrders.orderId],
    references: [orders.id],
  }),
  createdByUser: one(users, {
    fields: [draftOrders.createdBy],
    references: [users.id],
  }),
}));

export const giftCardTransactionsRelations = relations(giftCardTransactions, ({ one }) => ({
  giftCard: one(giftCards, {
    fields: [giftCardTransactions.giftCardId],
    references: [giftCards.id],
  }),
  order: one(orders, {
    fields: [giftCardTransactions.orderId],
    references: [orders.id],
  }),
}));

// Influencers relations
export const influencersRelations = relations(influencers, ({ one, many }) => ({
  store: one(stores, {
    fields: [influencers.storeId],
    references: [stores.id],
  }),
  user: one(users, {
    fields: [influencers.userId],
    references: [users.id],
  }),
  discount: one(discounts, {
    fields: [influencers.discountId],
    references: [discounts.id],
  }),
  automaticDiscount: one(automaticDiscounts, {
    fields: [influencers.automaticDiscountId],
    references: [automaticDiscounts.id],
  }),
  sales: many(influencerSales),
  payouts: many(influencerPayouts),
  sessions: many(influencerSessions),
}));

export const influencerSalesRelations = relations(influencerSales, ({ one }) => ({
  influencer: one(influencers, {
    fields: [influencerSales.influencerId],
    references: [influencers.id],
  }),
  order: one(orders, {
    fields: [influencerSales.orderId],
    references: [orders.id],
  }),
}));

export const influencerPayoutsRelations = relations(influencerPayouts, ({ one }) => ({
  influencer: one(influencers, {
    fields: [influencerPayouts.influencerId],
    references: [influencers.id],
  }),
  store: one(stores, {
    fields: [influencerPayouts.storeId],
    references: [stores.id],
  }),
  createdBy: one(users, {
    fields: [influencerPayouts.createdById],
    references: [users.id],
  }),
}));

export const influencerSessionsRelations = relations(influencerSessions, ({ one }) => ({
  influencer: one(influencers, {
    fields: [influencerSessions.influencerId],
    references: [influencers.id],
  }),
}));

// Refunds relations
export const refundsRelations = relations(refunds, ({ one }) => ({
  store: one(stores, {
    fields: [refunds.storeId],
    references: [stores.id],
  }),
  order: one(orders, {
    fields: [refunds.orderId],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [refunds.customerId],
    references: [customers.id],
  }),
  processedBy: one(users, {
    fields: [refunds.processedById],
    references: [users.id],
  }),
}));

// Return Requests relations
export const returnRequestsRelations = relations(returnRequests, ({ one }) => ({
  store: one(stores, {
    fields: [returnRequests.storeId],
    references: [stores.id],
  }),
  order: one(orders, {
    fields: [returnRequests.orderId],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [returnRequests.customerId],
    references: [customers.id],
  }),
  exchangeOrder: one(orders, {
    fields: [returnRequests.exchangeOrderId],
    references: [orders.id],
  }),
  processedBy: one(users, {
    fields: [returnRequests.processedById],
    references: [users.id],
  }),
}));

// ============ PAYMENT PROVIDERS ============

// Payment provider enum
export const paymentProviderEnum = pgEnum('payment_provider', [
  'payplus', 'pelecard', 'quick_payments', 'paypal'
]);

// Payment transaction type enum
export const paymentTransactionTypeEnum = pgEnum('payment_transaction_type', [
  'charge', 'refund', 'void', 'authorization'
]);

// Payment transaction status enum
export const paymentTransactionStatusEnum = pgEnum('payment_transaction_status', [
  'pending', 'processing', 'success', 'failed', 'cancelled'
]);

// Store payment providers configuration
export const paymentProviders = pgTable('payment_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  provider: paymentProviderEnum('provider').notNull(),
  isActive: boolean('is_active').default(false).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  displayName: varchar('display_name', { length: 100 }), // Name shown to customers
  testMode: boolean('test_mode').default(true).notNull(),
  
  // Encrypted credentials stored as JSON
  credentials: jsonb('credentials').default({}).notNull(),
  
  // Provider-specific settings
  settings: jsonb('settings').default({}).notNull(),
  
  // Stats
  totalTransactions: integer('total_transactions').default(0).notNull(),
  totalVolume: decimal('total_volume', { precision: 12, scale: 2 }).default('0'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_payment_providers_store_provider').on(table.storeId, table.provider),
  index('idx_payment_providers_store').on(table.storeId),
]);

// Payment transactions log
export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  providerId: uuid('provider_id').references(() => paymentProviders.id, { onDelete: 'set null' }),
  
  provider: paymentProviderEnum('provider').notNull(),
  type: paymentTransactionTypeEnum('type').notNull(),
  status: paymentTransactionStatusEnum('status').default('pending').notNull(),
  
  // Amounts
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('ILS').notNull(),
  
  // Provider references
  providerTransactionId: varchar('provider_transaction_id', { length: 255 }), // transaction_uid from provider
  providerRequestId: varchar('provider_request_id', { length: 255 }), // page_request_uid for PayPlus
  providerApprovalNum: varchar('provider_approval_num', { length: 100 }), // approval number
  
  // For linking to original transaction (refunds)
  parentTransactionId: uuid('parent_transaction_id'),
  
  // Full response from provider
  providerResponse: jsonb('provider_response').default({}),
  
  // Error handling
  errorCode: varchar('error_code', { length: 50 }),
  errorMessage: text('error_message'),
  
  // Metadata for our use
  metadata: jsonb('metadata').default({}), // Store order_number, more_info, etc.
  
  // IP and user agent for fraud detection
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  // Timestamps
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_payment_transactions_store').on(table.storeId),
  index('idx_payment_transactions_order').on(table.orderId),
  index('idx_payment_transactions_provider_tx').on(table.providerTransactionId),
  index('idx_payment_transactions_provider_req').on(table.providerRequestId),
  index('idx_payment_transactions_status').on(table.storeId, table.status),
  index('idx_payment_transactions_created').on(table.storeId, table.createdAt),
]);

// Pending payments (for tracking redirect flow)
export const pendingPayments = pgTable('pending_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  
  // Provider info
  provider: paymentProviderEnum('provider').notNull(),
  providerRequestId: varchar('provider_request_id', { length: 255 }).notNull(), // page_request_uid
  
  // Order data (stored before redirect, used to create order after success)
  orderData: jsonb('order_data').notNull(), // Full order payload
  cartItems: jsonb('cart_items').notNull(), // Cart items
  
  // Customer info
  customerEmail: varchar('customer_email', { length: 255 }),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  
  // Amount
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('ILS').notNull(),
  
  // Status
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, completed, expired, failed
  
  // Discount/coupon used
  discountCode: varchar('discount_code', { length: 50 }),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
  
  // Influencer tracking
  influencerId: uuid('influencer_id').references(() => influencers.id, { onDelete: 'set null' }),
  
  // Result
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }), // Set after successful payment
  transactionId: uuid('transaction_id'), // Links to payment_transactions
  
  // Expiry
  expiresAt: timestamp('expires_at').notNull(),
  completedAt: timestamp('completed_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_pending_payments_provider_req').on(table.providerRequestId),
  index('idx_pending_payments_store').on(table.storeId),
  index('idx_pending_payments_status').on(table.status),
  index('idx_pending_payments_expires').on(table.expiresAt),
]);

// Payment providers relations
export const paymentProvidersRelations = relations(paymentProviders, ({ one, many }) => ({
  store: one(stores, {
    fields: [paymentProviders.storeId],
    references: [stores.id],
  }),
  transactions: many(paymentTransactions),
}));

// Payment transactions relations
export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  store: one(stores, {
    fields: [paymentTransactions.storeId],
    references: [stores.id],
  }),
  order: one(orders, {
    fields: [paymentTransactions.orderId],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [paymentTransactions.customerId],
    references: [customers.id],
  }),
  provider: one(paymentProviders, {
    fields: [paymentTransactions.providerId],
    references: [paymentProviders.id],
  }),
  parentTransaction: one(paymentTransactions, {
    fields: [paymentTransactions.parentTransactionId],
    references: [paymentTransactions.id],
  }),
}));

// Pending payments relations
export const pendingPaymentsRelations = relations(pendingPayments, ({ one }) => ({
  store: one(stores, {
    fields: [pendingPayments.storeId],
    references: [stores.id],
  }),
  customer: one(customers, {
    fields: [pendingPayments.customerId],
    references: [customers.id],
  }),
  order: one(orders, {
    fields: [pendingPayments.orderId],
    references: [orders.id],
  }),
  influencer: one(influencers, {
    fields: [pendingPayments.influencerId],
    references: [influencers.id],
  }),
}));

export const storeMembersRelations = relations(storeMembers, ({ one }) => ({
  store: one(stores, {
    fields: [storeMembers.storeId],
    references: [stores.id],
  }),
  user: one(users, {
    fields: [storeMembers.userId],
    references: [users.id],
  }),
  invitedByUser: one(users, {
    fields: [storeMembers.invitedBy],
    references: [users.id],
    relationName: 'invitedBy',
  }),
}));

export const teamInvitationsRelations = relations(teamInvitations, ({ one }) => ({
  store: one(stores, {
    fields: [teamInvitations.storeId],
    references: [stores.id],
  }),
  invitedByUser: one(users, {
    fields: [teamInvitations.invitedBy],
    references: [users.id],
  }),
}));

export const pagesRelations = relations(pages, ({ one }) => ({
  store: one(stores, {
    fields: [pages.storeId],
    references: [stores.id],
  }),
}));

// ============ PLUGINS (ADDONS) SYSTEM ============

/**
 * Store Plugins - התקנות של תוספים בחנויות
 * כל חנות יכולה להתקין תוספים שונים
 */
export const storePlugins = pgTable('store_plugins', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  pluginSlug: varchar('plugin_slug', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  config: jsonb('config').default({}).notNull(),
  subscriptionStatus: pluginSubscriptionStatusEnum('subscription_status').default('active'),
  trialEndsAt: timestamp('trial_ends_at'),
  installedAt: timestamp('installed_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  lastBillingDate: timestamp('last_billing_date'),
  nextBillingDate: timestamp('next_billing_date'),
  cancelledAt: timestamp('cancelled_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  storePluginUnique: uniqueIndex('store_plugin_unique_idx').on(table.storeId, table.pluginSlug),
  storePluginActiveIdx: index('store_plugin_active_idx').on(table.storeId, table.isActive),
}));

/**
 * Product Stories - סטוריז של מוצרים (תוסף product-stories)
 */
export const productStories = pgTable('product_stories', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  position: integer('position').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  viewsCount: integer('views_count').default(0).notNull(),
  likesCount: integer('likes_count').default(0).notNull(),
  commentsCount: integer('comments_count').default(0).notNull(),
  // Custom media - allows uploading custom image/video instead of product image
  customMediaUrl: varchar('custom_media_url', { length: 500 }),
  customMediaType: varchar('custom_media_type', { length: 20 }), // 'image' | 'video' | null
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  storeProductUnique: uniqueIndex('story_store_product_unique_idx').on(table.storeId, table.productId),
  storePositionIdx: index('story_store_position_idx').on(table.storeId, table.position),
}));

/**
 * Story Views - מעקב צפיות בסטוריז
 */
export const storyViews = pgTable('story_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  storyId: uuid('story_id').references(() => productStories.id, { onDelete: 'cascade' }).notNull(),
  visitorId: varchar('visitor_id', { length: 255 }).notNull(), // מזהה אנונימי או customerId
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  viewedAt: timestamp('viewed_at').defaultNow().notNull(),
}, (table) => ({
  storyVisitorUnique: uniqueIndex('story_visitor_unique_idx').on(table.storyId, table.visitorId),
}));

/**
 * Story Likes - לייקים לסטוריז
 */
export const storyLikes = pgTable('story_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  storyId: uuid('story_id').references(() => productStories.id, { onDelete: 'cascade' }).notNull(),
  visitorId: varchar('visitor_id', { length: 255 }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  storyLikeUnique: uniqueIndex('story_like_unique_idx').on(table.storyId, table.visitorId),
}));

/**
 * Story Comments - תגובות לסטוריז
 */
export const storyComments = pgTable('story_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  storyId: uuid('story_id').references(() => productStories.id, { onDelete: 'cascade' }).notNull(),
  visitorId: varchar('visitor_id', { length: 255 }),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  authorName: varchar('author_name', { length: 100 }).notNull(),
  content: text('content').notNull(),
  isApproved: boolean('is_approved').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  storyApprovedIdx: index('story_comment_approved_idx').on(table.storyId, table.isApproved),
}));

// Store Plugins Relations
export const storePluginsRelations = relations(storePlugins, ({ one }) => ({
  store: one(stores, {
    fields: [storePlugins.storeId],
    references: [stores.id],
  }),
}));

// Product Stories Relations
export const productStoriesRelations = relations(productStories, ({ one, many }) => ({
  store: one(stores, {
    fields: [productStories.storeId],
    references: [stores.id],
  }),
  product: one(products, {
    fields: [productStories.productId],
    references: [products.id],
  }),
  views: many(storyViews),
  likes: many(storyLikes),
  comments: many(storyComments),
}));

export const storyViewsRelations = relations(storyViews, ({ one }) => ({
  story: one(productStories, {
    fields: [storyViews.storyId],
    references: [productStories.id],
  }),
  customer: one(customers, {
    fields: [storyViews.customerId],
    references: [customers.id],
  }),
}));

export const storyLikesRelations = relations(storyLikes, ({ one }) => ({
  story: one(productStories, {
    fields: [storyLikes.storyId],
    references: [productStories.id],
  }),
  customer: one(customers, {
    fields: [storyLikes.customerId],
    references: [customers.id],
  }),
}));

export const storyCommentsRelations = relations(storyComments, ({ one }) => ({
  story: one(productStories, {
    fields: [storyComments.storyId],
    references: [productStories.id],
  }),
  customer: one(customers, {
    fields: [storyComments.customerId],
    references: [customers.id],
  }),
}));

// ============ PRODUCT REVIEWS PLUGIN ============

// Product Reviews (ביקורות מוצרים)
export const productReviews = pgTable('product_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  
  // Content
  rating: integer('rating').notNull(), // 1-5
  title: varchar('title', { length: 255 }),
  content: text('content'),
  pros: text('pros'),
  cons: text('cons'),
  
  // Badges & Status
  isVerifiedPurchase: boolean('is_verified_purchase').default(false).notNull(),
  badges: text('badges').array().default([]),
  isApproved: boolean('is_approved').default(false).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  
  // Admin Reply
  adminReply: text('admin_reply'),
  adminReplyAt: timestamp('admin_reply_at'),
  adminReplyBy: uuid('admin_reply_by').references(() => users.id, { onDelete: 'set null' }),
  
  // Votes
  helpfulCount: integer('helpful_count').default(0).notNull(),
  notHelpfulCount: integer('not_helpful_count').default(0).notNull(),
  
  // Guest info (if allowed)
  customerName: varchar('customer_name', { length: 100 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_reviews_store_product').on(table.storeId, table.productId),
  index('idx_reviews_customer').on(table.customerId),
  index('idx_reviews_approved').on(table.storeId, table.isApproved),
]);

// Review Media (תמונות/וידאו לביקורות)
export const reviewMedia = pgTable('review_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').references(() => productReviews.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 10 }).notNull(), // 'image' | 'video'
  url: varchar('url', { length: 500 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  publicId: varchar('public_id', { length: 255 }), // Cloudinary
  width: integer('width'),
  height: integer('height'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_review_media_review').on(table.reviewId),
]);

// Review Votes (הצבעות "מועיל")
export const reviewVotes = pgTable('review_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').references(() => productReviews.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  sessionId: varchar('session_id', { length: 100 }), // For guests
  isHelpful: boolean('is_helpful').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_review_votes_review').on(table.reviewId),
  uniqueIndex('idx_review_votes_unique').on(table.reviewId, table.customerId),
]);

// Product Review Summary (Denormalized for performance - O(1) lookups)
export const productReviewSummary = pgTable('product_review_summary', {
  productId: uuid('product_id').primaryKey().references(() => products.id, { onDelete: 'cascade' }),
  totalReviews: integer('total_reviews').default(0).notNull(),
  averageRating: decimal('average_rating', { precision: 2, scale: 1 }).default('0').notNull(),
  rating1Count: integer('rating_1_count').default(0).notNull(),
  rating2Count: integer('rating_2_count').default(0).notNull(),
  rating3Count: integer('rating_3_count').default(0).notNull(),
  rating4Count: integer('rating_4_count').default(0).notNull(),
  rating5Count: integer('rating_5_count').default(0).notNull(),
  withMediaCount: integer('with_media_count').default(0).notNull(),
  verifiedCount: integer('verified_count').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Product Reviews Relations
export const productReviewsRelations = relations(productReviews, ({ one, many }) => ({
  store: one(stores, {
    fields: [productReviews.storeId],
    references: [stores.id],
  }),
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
  customer: one(customers, {
    fields: [productReviews.customerId],
    references: [customers.id],
  }),
  order: one(orders, {
    fields: [productReviews.orderId],
    references: [orders.id],
  }),
  media: many(reviewMedia),
  votes: many(reviewVotes),
}));

export const reviewMediaRelations = relations(reviewMedia, ({ one }) => ({
  review: one(productReviews, {
    fields: [reviewMedia.reviewId],
    references: [productReviews.id],
  }),
}));

export const reviewVotesRelations = relations(reviewVotes, ({ one }) => ({
  review: one(productReviews, {
    fields: [reviewVotes.reviewId],
    references: [productReviews.id],
  }),
  customer: one(customers, {
    fields: [reviewVotes.customerId],
    references: [customers.id],
  }),
}));

// ============ SMART ADVISOR ============

// Advisor Quiz (שאלון יועץ)
export const advisorQuizzes = pgTable('advisor_quizzes', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  subtitle: text('subtitle'),
  imageUrl: text('image_url'),
  icon: varchar('icon', { length: 50 }),
  isActive: boolean('is_active').default(false).notNull(),
  showProgressBar: boolean('show_progress_bar').default(true).notNull(),
  showQuestionNumbers: boolean('show_question_numbers').default(true).notNull(),
  allowBackNavigation: boolean('allow_back_navigation').default(true).notNull(),
  resultsCount: integer('results_count').default(3).notNull(),
  primaryColor: varchar('primary_color', { length: 20 }).default('#6366f1').notNull(),
  backgroundColor: varchar('background_color', { length: 20 }).default('#ffffff').notNull(),
  buttonStyle: varchar('button_style', { length: 20 }).default('rounded').notNull(),
  startButtonText: varchar('start_button_text', { length: 100 }).default('בואו נתחיל!').notNull(),
  resultsTitle: varchar('results_title', { length: 255 }).default('המלצות עבורך').notNull(),
  resultsSubtitle: text('results_subtitle'),
  showFloatingButton: boolean('show_floating_button').default(true).notNull(),
  totalStarts: integer('total_starts').default(0).notNull(),
  totalCompletions: integer('total_completions').default(0).notNull(),
  position: integer('position').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  storeSlugIdx: uniqueIndex('advisor_quiz_store_slug_idx').on(table.storeId, table.slug),
  storeActiveIdx: index('advisor_quiz_store_active_idx').on(table.storeId, table.isActive),
}));

// Advisor Question (שאלה בשאלון)
export const advisorQuestions = pgTable('advisor_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id').references(() => advisorQuizzes.id, { onDelete: 'cascade' }).notNull(),
  questionText: text('question_text').notNull(),
  questionSubtitle: text('question_subtitle'),
  imageUrl: text('image_url'),
  questionType: varchar('question_type', { length: 20 }).default('single').notNull(), // single | multiple
  answersLayout: varchar('answers_layout', { length: 20 }).default('grid').notNull(), // grid | list | cards
  columns: integer('columns').default(2).notNull(),
  isRequired: boolean('is_required').default(true).notNull(),
  minSelections: integer('min_selections').default(1).notNull(),
  maxSelections: integer('max_selections'),
  position: integer('position').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  quizPositionIdx: index('advisor_question_quiz_position_idx').on(table.quizId, table.position),
}));

// Advisor Answer (תשובה לשאלה)
export const advisorAnswers = pgTable('advisor_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id').references(() => advisorQuestions.id, { onDelete: 'cascade' }).notNull(),
  answerText: text('answer_text').notNull(),
  answerSubtitle: text('answer_subtitle'),
  imageUrl: text('image_url'),
  icon: varchar('icon', { length: 50 }),
  emoji: varchar('emoji', { length: 10 }),
  color: varchar('color', { length: 20 }),
  value: varchar('value', { length: 100 }),
  position: integer('position').default(0).notNull(),
  totalSelections: integer('total_selections').default(0).notNull(), // Statistics: how many times this answer was selected
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  questionPositionIdx: index('advisor_answer_question_position_idx').on(table.questionId, table.position),
}));

// Advisor Product Rule (כללי התאמת מוצר)
export const advisorProductRules = pgTable('advisor_product_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id').references(() => advisorQuizzes.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  answerWeights: jsonb('answer_weights').default([]).notNull(), // [{ answer_id, weight }]
  baseScore: integer('base_score').default(0).notNull(),
  bonusRules: jsonb('bonus_rules'), // { all_answers: [], bonus: number }
  excludeIfAnswers: jsonb('exclude_if_answers').default([]), // answer_ids to exclude
  priorityBoost: integer('priority_boost').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  quizProductIdx: uniqueIndex('advisor_rule_quiz_product_idx').on(table.quizId, table.productId),
}));

// Advisor Session (סשן של הפעלת יועץ)
export const advisorSessions = pgTable('advisor_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id').references(() => advisorQuizzes.id, { onDelete: 'cascade' }).notNull(),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  answers: jsonb('answers').default([]).notNull(), // [{ question_id, answer_ids }]
  recommendedProducts: jsonb('recommended_products'), // [{ product_id, score, match_percentage }]
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  isCompleted: boolean('is_completed').default(false).notNull(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  convertedToCart: boolean('converted_to_cart').default(false).notNull(),
  convertedToOrder: boolean('converted_to_order').default(false).notNull(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  quizSessionIdx: index('advisor_session_quiz_idx').on(table.quizId),
  sessionIdx: index('advisor_session_session_idx').on(table.sessionId),
}));

// ============ POPUPS ============

export const popups = pgTable('popups', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  
  // Basic info
  name: varchar('name', { length: 255 }).notNull(),
  type: popupTypeEnum('type').notNull(),
  isActive: boolean('is_active').default(false).notNull(),
  
  // Trigger settings
  trigger: popupTriggerEnum('trigger').default('on_load').notNull(),
  triggerValue: integer('trigger_value').default(3), // seconds for time_delay, percentage for scroll
  
  // Display settings
  position: popupPositionEnum('position').default('center').notNull(),
  frequency: popupFrequencyEnum('frequency').default('once').notNull(),
  frequencyDays: integer('frequency_days').default(7), // for every_x_days
  
  // Target pages
  targetPages: popupTargetEnum('target_pages').default('all').notNull(),
  customTargetUrls: jsonb('custom_target_urls').default([]), // for custom targeting
  
  // Device visibility
  showOnDesktop: boolean('show_on_desktop').default(true).notNull(),
  showOnMobile: boolean('show_on_mobile').default(true).notNull(),
  
  // Scheduling
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  
  // Content (JSON for flexibility)
  content: jsonb('content').default({}).notNull(),
  // For type='image': { imageUrl, imageAlt, linkUrl, linkText }
  // For type='text': { title, subtitle, body, buttonText, buttonUrl }
  // For type='form': { title, subtitle, fields: [{ name, type, placeholder, required }], buttonText, successMessage }
  
  // Style settings (JSON)
  style: jsonb('style').default({}).notNull(),
  // { bgColor, textColor, buttonBgColor, buttonTextColor, overlayOpacity, borderRadius, width }
  
  // Analytics
  impressions: integer('impressions').default(0).notNull(),
  clicks: integer('clicks').default(0).notNull(),
  conversions: integer('conversions').default(0).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  storeIdx: index('popup_store_idx').on(table.storeId),
  activeIdx: index('popup_active_idx').on(table.storeId, table.isActive),
}));

// Popup form submissions (for form type popups)
export const popupSubmissions = pgTable('popup_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  popupId: uuid('popup_id').references(() => popups.id, { onDelete: 'cascade' }).notNull(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  
  formData: jsonb('form_data').default({}).notNull(), // { email, name, phone, ... }
  
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  pageUrl: text('page_url'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  popupIdx: index('popup_submission_popup_idx').on(table.popupId),
  storeIdx: index('popup_submission_store_idx').on(table.storeId),
}));

// Popup Relations
export const popupsRelations = relations(popups, ({ one, many }) => ({
  store: one(stores, {
    fields: [popups.storeId],
    references: [stores.id],
  }),
  submissions: many(popupSubmissions),
}));

export const popupSubmissionsRelations = relations(popupSubmissions, ({ one }) => ({
  popup: one(popups, {
    fields: [popupSubmissions.popupId],
    references: [popups.id],
  }),
  store: one(stores, {
    fields: [popupSubmissions.storeId],
    references: [stores.id],
  }),
  customer: one(customers, {
    fields: [popupSubmissions.customerId],
    references: [customers.id],
  }),
}));

// ============ GAMIFICATION (Wheel of Fortune / Scratch Card) ============

export const gamificationTypeEnum = pgEnum('gamification_type', ['wheel', 'scratch']);
export const gamificationPrizeTypeEnum = pgEnum('gamification_prize_type', [
  'coupon_percentage',  // קופון אחוז הנחה
  'coupon_fixed',       // קופון סכום קבוע
  'free_shipping',      // משלוח חינם
  'gift_product',       // מוצר במתנה
  'extra_spin',         // סיבוב נוסף
  'no_prize'            // ללא פרס (עדיף למזל בפעם הבאה)
]);

// קמפיין משחק (גלגל מזל / כרטיס גירוד)
export const gamificationCampaigns = pgTable('gamification_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  
  // Basic settings
  name: varchar('name', { length: 255 }).notNull(),
  type: gamificationTypeEnum('type').notNull(), // wheel or scratch
  isActive: boolean('is_active').default(false).notNull(),
  
  // Display settings
  title: varchar('title', { length: 255 }).default('נסה את מזלך!').notNull(),
  subtitle: varchar('subtitle', { length: 500 }),
  buttonText: varchar('button_text', { length: 100 }).default('סובב עכשיו').notNull(),
  
  // Style
  primaryColor: varchar('primary_color', { length: 7 }).default('#e91e63').notNull(),
  secondaryColor: varchar('secondary_color', { length: 7 }).default('#9c27b0').notNull(),
  backgroundColor: varchar('background_color', { length: 7 }).default('#ffffff').notNull(),
  textColor: varchar('text_color', { length: 7 }).default('#333333').notNull(),
  
  // Form fields to collect
  collectName: boolean('collect_name').default(true).notNull(),
  collectEmail: boolean('collect_email').default(true).notNull(),
  collectPhone: boolean('collect_phone').default(true).notNull(),
  collectBirthday: boolean('collect_birthday').default(false).notNull(),
  
  // Legal
  requireMarketingConsent: boolean('require_marketing_consent').default(true).notNull(),
  requirePrivacyConsent: boolean('require_privacy_consent').default(true).notNull(),
  privacyPolicyUrl: varchar('privacy_policy_url', { length: 500 }),
  termsUrl: varchar('terms_url', { length: 500 }),
  
  // Limits
  maxPlaysPerEmail: integer('max_plays_per_email').default(1).notNull(),
  maxPlaysPerDay: integer('max_plays_per_day'), // null = unlimited
  
  // Scheduling
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  
  // Trigger settings (like popups)
  trigger: popupTriggerEnum('trigger').default('on_load').notNull(),
  triggerValue: integer('trigger_value').default(3),
  frequency: popupFrequencyEnum('frequency').default('once').notNull(),
  frequencyDays: integer('frequency_days').default(7),
  
  // Target pages
  targetPages: popupTargetEnum('target_pages').default('all').notNull(),
  customTargetUrls: jsonb('custom_target_urls').default([]),
  
  // Device
  showOnDesktop: boolean('show_on_desktop').default(true).notNull(),
  showOnMobile: boolean('show_on_mobile').default(true).notNull(),
  
  // Analytics
  impressions: integer('impressions').default(0).notNull(),
  plays: integer('plays').default(0).notNull(),
  conversions: integer('conversions').default(0).notNull(), // Used coupon
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  storeIdx: index('gamification_campaign_store_idx').on(table.storeId),
  activeIdx: index('gamification_campaign_active_idx').on(table.storeId, table.isActive),
}));

// פרסים לקמפיין
export const gamificationPrizes = pgTable('gamification_prizes', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => gamificationCampaigns.id, { onDelete: 'cascade' }).notNull(),
  
  // Prize details
  name: varchar('name', { length: 255 }).notNull(), // "20% הנחה", "משלוח חינם"
  type: gamificationPrizeTypeEnum('type').notNull(),
  value: decimal('value', { precision: 10, scale: 2 }), // For coupon: discount value
  
  // For gift_product type
  giftProductId: uuid('gift_product_id').references(() => products.id, { onDelete: 'set null' }),
  
  // Display
  color: varchar('color', { length: 7 }).default('#FF6B6B').notNull(), // Segment color for wheel
  icon: varchar('icon', { length: 50 }), // Emoji or icon name
  
  // Probability (0-100, total should be 100)
  probability: decimal('probability', { precision: 5, scale: 2 }).notNull(),
  
  // Limits
  totalAvailable: integer('total_available'), // null = unlimited
  totalWon: integer('total_won').default(0).notNull(),
  
  // Coupon settings
  couponPrefix: varchar('coupon_prefix', { length: 20 }), // e.g., "WHEEL" → WHEEL-ABC123
  couponValidDays: integer('coupon_valid_days').default(30),
  couponMinPurchase: decimal('coupon_min_purchase', { precision: 10, scale: 2 }),
  
  // Sort order (for wheel segments)
  sortOrder: integer('sort_order').default(0).notNull(),
  
  isActive: boolean('is_active').default(true).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  campaignIdx: index('gamification_prize_campaign_idx').on(table.campaignId),
  sortIdx: index('gamification_prize_sort_idx').on(table.campaignId, table.sortOrder),
}));

// כניסות למשחק (רישום)
export const gamificationEntries = pgTable('gamification_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => gamificationCampaigns.id, { onDelete: 'cascade' }).notNull(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  
  // Customer info
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  birthday: date('birthday'),
  
  // Consent
  marketingConsent: boolean('marketing_consent').default(false).notNull(),
  privacyConsent: boolean('privacy_consent').default(false).notNull(),
  
  // Link to customer if exists
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  
  // Tracking
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  campaignIdx: index('gamification_entry_campaign_idx').on(table.campaignId),
  emailIdx: index('gamification_entry_email_idx').on(table.campaignId, table.email),
  storeIdx: index('gamification_entry_store_idx').on(table.storeId),
}));

// זכיות
export const gamificationWins = pgTable('gamification_wins', {
  id: uuid('id').primaryKey().defaultRandom(),
  entryId: uuid('entry_id').references(() => gamificationEntries.id, { onDelete: 'cascade' }).notNull(),
  prizeId: uuid('prize_id').references(() => gamificationPrizes.id, { onDelete: 'cascade' }).notNull(),
  campaignId: uuid('campaign_id').references(() => gamificationCampaigns.id, { onDelete: 'cascade' }).notNull(),
  
  // Generated coupon
  couponCode: varchar('coupon_code', { length: 50 }),
  discountId: uuid('discount_id').references(() => discounts.id, { onDelete: 'set null' }),
  
  // Status
  isClaimed: boolean('is_claimed').default(false).notNull(), // Copied/used
  isUsed: boolean('is_used').default(false).notNull(), // Actually used in order
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  claimedAt: timestamp('claimed_at'),
  usedAt: timestamp('used_at'),
}, (table) => ({
  entryIdx: index('gamification_win_entry_idx').on(table.entryId),
  prizeIdx: index('gamification_win_prize_idx').on(table.prizeId),
  campaignIdx: index('gamification_win_campaign_idx').on(table.campaignId),
  couponIdx: uniqueIndex('gamification_win_coupon_idx').on(table.couponCode),
}));

// Gamification Relations
export const gamificationCampaignsRelations = relations(gamificationCampaigns, ({ one, many }) => ({
  store: one(stores, {
    fields: [gamificationCampaigns.storeId],
    references: [stores.id],
  }),
  prizes: many(gamificationPrizes),
  entries: many(gamificationEntries),
  wins: many(gamificationWins),
}));

export const gamificationPrizesRelations = relations(gamificationPrizes, ({ one, many }) => ({
  campaign: one(gamificationCampaigns, {
    fields: [gamificationPrizes.campaignId],
    references: [gamificationCampaigns.id],
  }),
  giftProduct: one(products, {
    fields: [gamificationPrizes.giftProductId],
    references: [products.id],
  }),
  wins: many(gamificationWins),
}));

export const gamificationEntriesRelations = relations(gamificationEntries, ({ one, many }) => ({
  campaign: one(gamificationCampaigns, {
    fields: [gamificationEntries.campaignId],
    references: [gamificationCampaigns.id],
  }),
  store: one(stores, {
    fields: [gamificationEntries.storeId],
    references: [stores.id],
  }),
  customer: one(customers, {
    fields: [gamificationEntries.customerId],
    references: [customers.id],
  }),
  wins: many(gamificationWins),
}));

export const gamificationWinsRelations = relations(gamificationWins, ({ one }) => ({
  entry: one(gamificationEntries, {
    fields: [gamificationWins.entryId],
    references: [gamificationEntries.id],
  }),
  prize: one(gamificationPrizes, {
    fields: [gamificationWins.prizeId],
    references: [gamificationPrizes.id],
  }),
  campaign: one(gamificationCampaigns, {
    fields: [gamificationWins.campaignId],
    references: [gamificationCampaigns.id],
  }),
  discount: one(discounts, {
    fields: [gamificationWins.discountId],
    references: [discounts.id],
  }),
  order: one(orders, {
    fields: [gamificationWins.orderId],
    references: [orders.id],
  }),
}));

// Advisor Relations
export const advisorQuizzesRelations = relations(advisorQuizzes, ({ one, many }) => ({
  store: one(stores, {
    fields: [advisorQuizzes.storeId],
    references: [stores.id],
  }),
  questions: many(advisorQuestions),
  rules: many(advisorProductRules),
  sessions: many(advisorSessions),
}));

export const advisorQuestionsRelations = relations(advisorQuestions, ({ one, many }) => ({
  quiz: one(advisorQuizzes, {
    fields: [advisorQuestions.quizId],
    references: [advisorQuizzes.id],
  }),
  answers: many(advisorAnswers),
}));

export const advisorAnswersRelations = relations(advisorAnswers, ({ one }) => ({
  question: one(advisorQuestions, {
    fields: [advisorAnswers.questionId],
    references: [advisorQuestions.id],
  }),
}));

export const advisorProductRulesRelations = relations(advisorProductRules, ({ one }) => ({
  quiz: one(advisorQuizzes, {
    fields: [advisorProductRules.quizId],
    references: [advisorQuizzes.id],
  }),
  product: one(products, {
    fields: [advisorProductRules.productId],
    references: [products.id],
  }),
}));

export const advisorSessionsRelations = relations(advisorSessions, ({ one }) => ({
  quiz: one(advisorQuizzes, {
    fields: [advisorSessions.quizId],
    references: [advisorQuizzes.id],
  }),
  customer: one(customers, {
    fields: [advisorSessions.customerId],
    references: [customers.id],
  }),
  order: one(orders, {
    fields: [advisorSessions.orderId],
    references: [orders.id],
  }),
}));

// ============ PLATFORM BILLING ============

/**
 * Store Subscriptions - מנויים של חנויות
 * כולל פרטי טוקן PayPlus לחיוב אוטומטי
 */
export const storeSubscriptions = pgTable('store_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull().unique(),
  
  // Plan info
  plan: storePlanEnum('plan').default('trial').notNull(),
  status: subscriptionStatusEnum('status').default('trial').notNull(),
  
  // Trial info
  trialEndsAt: timestamp('trial_ends_at'),
  
  // Current billing period
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  
  // PayPlus payment info
  payplusCustomerUid: varchar('payplus_customer_uid', { length: 255 }),
  payplusTokenUid: varchar('payplus_token_uid', { length: 255 }),
  cardLastFour: varchar('card_last_four', { length: 4 }),
  cardBrand: varchar('card_brand', { length: 50 }),
  cardExpiry: varchar('card_expiry', { length: 7 }), // MM/YYYY
  
  // Billing details
  billingEmail: varchar('billing_email', { length: 255 }),
  billingName: varchar('billing_name', { length: 255 }),
  billingPhone: varchar('billing_phone', { length: 50 }),
  billingAddress: jsonb('billing_address'),
  vatNumber: varchar('vat_number', { length: 50 }), // ח.פ / ע.מ
  
  // Custom pricing
  customMonthlyPrice: decimal('custom_monthly_price', { precision: 10, scale: 2 }), // מחיר חודשי מותאם אישית (אופציונלי)
  customFeePercentage: decimal('custom_fee_percentage', { precision: 5, scale: 4 }), // עמלת עסקאות מותאמת אישית (אופציונלי, ברירת מחדל 0.005 = 0.5%)
  
  // Metadata
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_store_subscriptions_store').on(table.storeId),
  index('idx_store_subscriptions_status').on(table.status),
]);

/**
 * Platform Invoices - חשבוניות פלטפורמה
 * מנוי / עמלות עסקאות / תוספים
 */
export const platformInvoices = pgTable('platform_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  subscriptionId: uuid('subscription_id').references(() => storeSubscriptions.id, { onDelete: 'set null' }),
  
  // Invoice details
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  type: platformInvoiceTypeEnum('type').notNull(),
  status: platformInvoiceStatusEnum('status').default('draft').notNull(),
  
  // Amounts (all in ILS agorot/cents - stored as integers for precision)
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(), // Before VAT
  vatRate: decimal('vat_rate', { precision: 5, scale: 2 }).default('18').notNull(), // 18%
  vatAmount: decimal('vat_amount', { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(), // After VAT
  
  // Period (for transaction fees & plugins)
  periodStart: timestamp('period_start'),
  periodEnd: timestamp('period_end'),
  
  // Description
  description: text('description'),
  
  // PayPlus transaction details
  payplusTransactionUid: varchar('payplus_transaction_uid', { length: 255 }),
  payplusInvoiceNumber: varchar('payplus_invoice_number', { length: 100 }),
  payplusInvoiceUrl: varchar('payplus_invoice_url', { length: 500 }),
  
  // Payment tracking
  chargeAttempts: integer('charge_attempts').default(0).notNull(),
  lastChargeAttempt: timestamp('last_charge_attempt'),
  lastChargeError: text('last_charge_error'),
  
  // Dates
  issuedAt: timestamp('issued_at'),
  dueAt: timestamp('due_at'),
  paidAt: timestamp('paid_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_platform_invoices_store').on(table.storeId),
  index('idx_platform_invoices_status').on(table.status),
  index('idx_platform_invoices_type').on(table.type),
  index('idx_platform_invoices_created').on(table.createdAt),
]);

/**
 * Platform Invoice Items - פריטי חשבונית
 */
export const platformInvoiceItems = pgTable('platform_invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').references(() => platformInvoices.id, { onDelete: 'cascade' }).notNull(),
  
  // Item details
  description: varchar('description', { length: 500 }).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  
  // Reference (e.g., plugin slug, period description)
  referenceType: varchar('reference_type', { length: 50 }), // 'subscription', 'transaction_fee', 'plugin'
  referenceId: varchar('reference_id', { length: 255 }), // plugin slug or period key
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_platform_invoice_items_invoice').on(table.invoiceId),
]);

/**
 * Store Transaction Fees - סיכום עסקאות לחיוב עמלות
 * מחושב כל שבועיים
 */
export const storeTransactionFees = pgTable('store_transaction_fees', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  
  // Period
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  
  // Transaction summary
  totalTransactionsAmount: decimal('total_transactions_amount', { precision: 12, scale: 2 }).notNull(),
  totalTransactionsCount: integer('total_transactions_count').default(0).notNull(),
  
  // Fee calculation
  feePercentage: decimal('fee_percentage', { precision: 5, scale: 4 }).default('0.005').notNull(), // 0.5%
  feeAmount: decimal('fee_amount', { precision: 10, scale: 2 }).notNull(),
  
  // Invoice link
  invoiceId: uuid('invoice_id').references(() => platformInvoices.id, { onDelete: 'set null' }),
  
  // Calculation metadata
  calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
  orderIds: jsonb('order_ids').default([]).notNull(), // IDs of orders included
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_store_transaction_fees_store').on(table.storeId),
  index('idx_store_transaction_fees_period').on(table.periodStart, table.periodEnd),
  uniqueIndex('idx_store_transaction_fees_unique_period').on(table.storeId, table.periodStart, table.periodEnd),
]);

/**
 * Plugin Pricing - מחירי תוספים
 * מגדיר את המחיר לכל תוסף
 */
export const pluginPricing = pgTable('plugin_pricing', {
  id: uuid('id').primaryKey().defaultRandom(),
  pluginSlug: varchar('plugin_slug', { length: 100 }).notNull().unique(),
  
  // Pricing
  monthlyPrice: decimal('monthly_price', { precision: 10, scale: 2 }).notNull(),
  
  // Trial
  trialDays: integer('trial_days').default(14),
  
  // Metadata
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_plugin_pricing_slug').on(table.pluginSlug),
]);

/**
 * Platform Settings - הגדרות פלטפורמה
 * מחירי מנויים, עמלות וכו' - ניתנות לעריכה על ידי הסופר אדמין
 */
export const platformSettings = pgTable('platform_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: jsonb('value').notNull(),
  description: varchar('description', { length: 500 }),
  category: varchar('category', { length: 50 }).default('general').notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_platform_settings_key').on(table.key),
  index('idx_platform_settings_category').on(table.category),
]);

// ============ EMAIL PACKAGES (חבילות דיוור) ============

/**
 * סטטוס מנוי חבילת דיוור
 */
export const emailSubscriptionStatusEnum = pgEnum('email_subscription_status', [
  'active',      // פעיל
  'cancelled',   // בוטל
  'past_due',    // חריגה בתשלום
  'expired'      // פג תוקף
]);

/**
 * Email Packages - הגדרות חבילות דיוור (ניהול פלטפורמה)
 * מגדיר את החבילות הזמינות לרכישה
 */
export const emailPackages = pgTable('email_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 50 }).notNull().unique(), // starter, basic, growth, pro, scale
  
  // Package info
  name: varchar('name', { length: 100 }).notNull(), // 🐣 Starter
  description: text('description'),
  
  // Limits
  monthlyEmails: integer('monthly_emails').notNull(), // 500, 1000, 5000, etc.
  
  // Pricing (before VAT)
  monthlyPrice: decimal('monthly_price', { precision: 10, scale: 2 }).notNull(), // ₪29, ₪49, etc.
  
  // Display
  icon: varchar('icon', { length: 10 }), // 🐣, 📈, 🚀, 💼, 📊
  sortOrder: integer('sort_order').default(0).notNull(),
  isPopular: boolean('is_popular').default(false).notNull(), // להצגת "פופולרי"
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_email_packages_slug').on(table.slug),
  index('idx_email_packages_active').on(table.isActive),
]);

/**
 * Store Email Subscriptions - מנוי דיוור לכל חנות
 * מנהל את המכסה והחיוב
 */
export const storeEmailSubscriptions = pgTable('store_email_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull().unique(),
  packageSlug: varchar('package_slug', { length: 50 }).notNull(), // reference to email_packages.slug
  
  // Status
  status: emailSubscriptionStatusEnum('status').default('active').notNull(),
  
  // Current period
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  
  // Usage tracking
  emailsUsedThisPeriod: integer('emails_used_this_period').default(0).notNull(),
  emailsLimit: integer('emails_limit').notNull(), // copied from package at time of subscription
  
  // Billing
  lastBillingDate: timestamp('last_billing_date'),
  nextBillingDate: timestamp('next_billing_date'),
  
  // Metadata
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_store_email_subscriptions_store').on(table.storeId),
  index('idx_store_email_subscriptions_status').on(table.status),
  index('idx_store_email_subscriptions_next_billing').on(table.nextBillingDate),
]);

/**
 * Store Email Logs - לוג שליחות מיילים
 * לספירה, דיבוג ואנליטיקס
 */
export const storeEmailLogs = pgTable('store_email_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  automationId: uuid('automation_id').references(() => automations.id, { onDelete: 'set null' }),
  
  // Email details
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  emailType: varchar('email_type', { length: 50 }).notNull(), // abandoned_cart, order_confirmation, custom, etc.
  subject: varchar('subject', { length: 500 }),
  
  // Status
  status: varchar('status', { length: 20 }).default('sent').notNull(), // sent, failed, bounced
  errorMessage: text('error_message'),
  
  // Metadata
  metadata: jsonb('metadata').default({}).notNull(), // template, variables, etc.
  
  // Period tracking (for billing)
  billingPeriodStart: timestamp('billing_period_start'),
  billingPeriodEnd: timestamp('billing_period_end'),
  
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_store_email_logs_store').on(table.storeId),
  index('idx_store_email_logs_automation').on(table.automationId),
  index('idx_store_email_logs_sent_at').on(table.sentAt),
  index('idx_store_email_logs_period').on(table.storeId, table.billingPeriodStart, table.billingPeriodEnd),
]);

// Email Package Relations
export const emailPackagesRelations = relations(emailPackages, ({ many }) => ({
  subscriptions: many(storeEmailSubscriptions),
}));

export const storeEmailSubscriptionsRelations = relations(storeEmailSubscriptions, ({ one }) => ({
  store: one(stores, {
    fields: [storeEmailSubscriptions.storeId],
    references: [stores.id],
  }),
}));

export const storeEmailLogsRelations = relations(storeEmailLogs, ({ one }) => ({
  store: one(stores, {
    fields: [storeEmailLogs.storeId],
    references: [stores.id],
  }),
  automation: one(automations, {
    fields: [storeEmailLogs.automationId],
    references: [automations.id],
  }),
}));

// Platform Billing Relations
export const storeSubscriptionsRelations = relations(storeSubscriptions, ({ one, many }) => ({
  store: one(stores, {
    fields: [storeSubscriptions.storeId],
    references: [stores.id],
  }),
  invoices: many(platformInvoices),
}));

export const platformInvoicesRelations = relations(platformInvoices, ({ one, many }) => ({
  store: one(stores, {
    fields: [platformInvoices.storeId],
    references: [stores.id],
  }),
  subscription: one(storeSubscriptions, {
    fields: [platformInvoices.subscriptionId],
    references: [storeSubscriptions.id],
  }),
  items: many(platformInvoiceItems),
}));

export const platformInvoiceItemsRelations = relations(platformInvoiceItems, ({ one }) => ({
  invoice: one(platformInvoices, {
    fields: [platformInvoiceItems.invoiceId],
    references: [platformInvoices.id],
  }),
}));

export const storeTransactionFeesRelations = relations(storeTransactionFees, ({ one }) => ({
  store: one(stores, {
    fields: [storeTransactionFees.storeId],
    references: [stores.id],
  }),
  invoice: one(platformInvoices, {
    fields: [storeTransactionFees.invoiceId],
    references: [platformInvoices.id],
  }),
}));

// ============ API KEYS ============

// API Keys for public developer API
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  
  // Key info
  name: varchar('name', { length: 255 }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 20 }).notNull(), // qs_live_xxxx (12 chars)
  keyHash: varchar('key_hash', { length: 255 }).notNull(), // SHA256
  lastFour: varchar('last_four', { length: 4 }).notNull(),
  
  // Permissions/Scopes
  scopes: jsonb('scopes').default([]).notNull(), // ['orders:read', 'products:write']
  
  // Rate limiting
  rateLimit: integer('rate_limit').default(100).notNull(), // per minute
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  expiresAt: timestamp('expires_at'),
  
  // Usage tracking
  lastUsedAt: timestamp('last_used_at'),
  totalRequests: integer('total_requests').default(0).notNull(),
  
  // Metadata
  description: text('description'),
  allowedIps: jsonb('allowed_ips'),
  allowedOrigins: jsonb('allowed_origins'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_api_keys_store').on(table.storeId),
  index('idx_api_keys_hash').on(table.keyHash),
  index('idx_api_keys_prefix').on(table.keyPrefix),
]);

// API Key Usage Logs
export const apiKeyLogs = pgTable('api_key_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  apiKeyId: uuid('api_key_id').references(() => apiKeys.id, { onDelete: 'cascade' }).notNull(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  
  // Request info
  method: varchar('method', { length: 10 }).notNull(),
  endpoint: varchar('endpoint', { length: 500 }).notNull(),
  statusCode: integer('status_code').notNull(),
  responseTimeMs: integer('response_time_ms'),
  
  // Client info
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  // Error tracking
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_api_key_logs_key').on(table.apiKeyId),
  index('idx_api_key_logs_store').on(table.storeId),
  index('idx_api_key_logs_created').on(table.createdAt),
]);

// API Keys relations
export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  store: one(stores, {
    fields: [apiKeys.storeId],
    references: [stores.id],
  }),
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  logs: many(apiKeyLogs),
}));

export const apiKeyLogsRelations = relations(apiKeyLogs, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [apiKeyLogs.apiKeyId],
    references: [apiKeys.id],
  }),
  store: one(stores, {
    fields: [apiKeyLogs.storeId],
    references: [stores.id],
  }),
}));

// ============ MOBILE DEVICES ============

// Platform enum for mobile devices
export const mobilePlatformEnum = pgEnum('mobile_platform', ['ios', 'android']);

// Mobile devices table for push notifications and mobile sessions
export const mobileDevices = pgTable('mobile_devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'set null' }),
  
  // Device info
  deviceId: varchar('device_id', { length: 255 }).notNull(),
  pushToken: varchar('push_token', { length: 500 }),
  platform: mobilePlatformEnum('platform').notNull(),
  appVersion: varchar('app_version', { length: 50 }),
  osVersion: varchar('os_version', { length: 50 }),
  deviceName: varchar('device_name', { length: 255 }),
  
  // Session
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  refreshToken: varchar('refresh_token', { length: 255 }).unique(),
  expiresAt: timestamp('expires_at').notNull(),
  
  // Notification settings
  notificationsEnabled: boolean('notifications_enabled').default(true).notNull(),
  notifyNewOrders: boolean('notify_new_orders').default(true).notNull(),
  notifyLowStock: boolean('notify_low_stock').default(true).notNull(),
  notifyReturns: boolean('notify_returns').default(true).notNull(),
  
  // Tracking
  lastActiveAt: timestamp('last_active_at'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_mobile_devices_user').on(table.userId),
  index('idx_mobile_devices_store').on(table.storeId),
  index('idx_mobile_devices_token').on(table.sessionToken),
  index('idx_mobile_devices_push').on(table.pushToken),
  uniqueIndex('idx_mobile_devices_user_device').on(table.userId, table.deviceId),
]);

// Mobile devices relations
export const mobileDevicesRelations = relations(mobileDevices, ({ one }) => ({
  user: one(users, {
    fields: [mobileDevices.userId],
    references: [users.id],
  }),
  store: one(stores, {
    fields: [mobileDevices.storeId],
    references: [stores.id],
  }),
}));

// ============ TYPES ============

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type CustomerSession = typeof customerSessions.$inferSelect;
export type NewCustomerSession = typeof customerSessions.$inferInsert;
export type CustomerOtpCode = typeof customerOtpCodes.$inferSelect;
export type NewCustomerOtpCode = typeof customerOtpCodes.$inferInsert;
export type Wishlist = typeof wishlists.$inferSelect;
export type NewWishlist = typeof wishlists.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type Discount = typeof discounts.$inferSelect;
export type NewDiscount = typeof discounts.$inferInsert;
export type ProductOption = typeof productOptions.$inferSelect;
export type NewProductOption = typeof productOptions.$inferInsert;
export type ProductOptionValue = typeof productOptionValues.$inferSelect;
export type NewProductOptionValue = typeof productOptionValues.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type InventoryLog = typeof inventoryLogs.$inferSelect;
export type NewInventoryLog = typeof inventoryLogs.$inferInsert;
export type PageSection = typeof pageSections.$inferSelect;
export type NewPageSection = typeof pageSections.$inferInsert;
export type AutomaticDiscount = typeof automaticDiscounts.$inferSelect;
export type NewAutomaticDiscount = typeof automaticDiscounts.$inferInsert;
export type StoreEvent = typeof storeEvents.$inferSelect;
export type NewStoreEvent = typeof storeEvents.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;

// Automations types
export type Automation = typeof automations.$inferSelect;
export type NewAutomation = typeof automations.$inferInsert;
export type AutomationRun = typeof automationRuns.$inferSelect;
export type NewAutomationRun = typeof automationRuns.$inferInsert;

// CRM Plugin types
export type CrmNote = typeof crmNotes.$inferSelect;
export type NewCrmNote = typeof crmNotes.$inferInsert;
export type CrmTask = typeof crmTasks.$inferSelect;
export type NewCrmTask = typeof crmTasks.$inferInsert;

// Analytics types
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
export type SearchQuery = typeof searchQueries.$inferSelect;
export type NewSearchQuery = typeof searchQueries.$inferInsert;
export type AbandonedCart = typeof abandonedCarts.$inferSelect;
export type NewAbandonedCart = typeof abandonedCarts.$inferInsert;

// Gift cards types
export type GiftCard = typeof giftCards.$inferSelect;
export type NewGiftCard = typeof giftCards.$inferInsert;
export type GiftCardTransaction = typeof giftCardTransactions.$inferSelect;
export type NewGiftCardTransaction = typeof giftCardTransactions.$inferInsert;
export type DraftOrder = typeof draftOrders.$inferSelect;
export type NewDraftOrder = typeof draftOrders.$inferInsert;
export type TaxRate = typeof taxRates.$inferSelect;
export type NewTaxRate = typeof taxRates.$inferInsert;

// Shipping types
export type ShippingZone = typeof shippingZones.$inferSelect;
export type NewShippingZone = typeof shippingZones.$inferInsert;
export type ShippingMethod = typeof shippingMethods.$inferSelect;
export type NewShippingMethod = typeof shippingMethods.$inferInsert;
export type PickupLocation = typeof pickupLocations.$inferSelect;
export type NewPickupLocation = typeof pickupLocations.$inferInsert;

// Shipping providers types
export type ShippingProvider = typeof shippingProviders.$inferSelect;
export type NewShippingProvider = typeof shippingProviders.$inferInsert;
export type Shipment = typeof shipments.$inferSelect;
export type NewShipment = typeof shipments.$inferInsert;

// Influencers types
export type Influencer = typeof influencers.$inferSelect;
export type NewInfluencer = typeof influencers.$inferInsert;
export type InfluencerSale = typeof influencerSales.$inferSelect;
export type NewInfluencerSale = typeof influencerSales.$inferInsert;
export type InfluencerPayout = typeof influencerPayouts.$inferSelect;
export type NewInfluencerPayout = typeof influencerPayouts.$inferInsert;
export type InfluencerSession = typeof influencerSessions.$inferSelect;
export type NewInfluencerSession = typeof influencerSessions.$inferInsert;

// Refunds types
export type Refund = typeof refunds.$inferSelect;
export type NewRefund = typeof refunds.$inferInsert;

// Return Requests types
export type ReturnRequest = typeof returnRequests.$inferSelect;
export type NewReturnRequest = typeof returnRequests.$inferInsert;

// Payment types
export type PaymentProvider = typeof paymentProviders.$inferSelect;
export type NewPaymentProvider = typeof paymentProviders.$inferInsert;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type NewPaymentTransaction = typeof paymentTransactions.$inferInsert;
export type PendingPayment = typeof pendingPayments.$inferSelect;
export type NewPendingPayment = typeof pendingPayments.$inferInsert;

// Plugin types
export type StorePlugin = typeof storePlugins.$inferSelect;
export type NewStorePlugin = typeof storePlugins.$inferInsert;
export type ProductStory = typeof productStories.$inferSelect;
export type NewProductStory = typeof productStories.$inferInsert;
export type StoryView = typeof storyViews.$inferSelect;
export type NewStoryView = typeof storyViews.$inferInsert;
export type StoryLike = typeof storyLikes.$inferSelect;
export type NewStoryLike = typeof storyLikes.$inferInsert;
export type StoryComment = typeof storyComments.$inferSelect;
export type NewStoryComment = typeof storyComments.$inferInsert;

// Advisor types
export type AdvisorQuiz = typeof advisorQuizzes.$inferSelect;
export type NewAdvisorQuiz = typeof advisorQuizzes.$inferInsert;
export type AdvisorQuestion = typeof advisorQuestions.$inferSelect;

// Popup types
export type Popup = typeof popups.$inferSelect;
export type NewPopup = typeof popups.$inferInsert;
export type PopupSubmission = typeof popupSubmissions.$inferSelect;
export type NewPopupSubmission = typeof popupSubmissions.$inferInsert;
export type NewAdvisorQuestion = typeof advisorQuestions.$inferInsert;
export type AdvisorAnswer = typeof advisorAnswers.$inferSelect;
export type NewAdvisorAnswer = typeof advisorAnswers.$inferInsert;
export type AdvisorProductRule = typeof advisorProductRules.$inferSelect;
export type NewAdvisorProductRule = typeof advisorProductRules.$inferInsert;
export type AdvisorSession = typeof advisorSessions.$inferSelect;
export type NewAdvisorSession = typeof advisorSessions.$inferInsert;

// Platform Billing types
export type StoreSubscription = typeof storeSubscriptions.$inferSelect;
export type NewStoreSubscription = typeof storeSubscriptions.$inferInsert;
export type PlatformInvoice = typeof platformInvoices.$inferSelect;
export type NewPlatformInvoice = typeof platformInvoices.$inferInsert;
export type PlatformInvoiceItem = typeof platformInvoiceItems.$inferSelect;
export type NewPlatformInvoiceItem = typeof platformInvoiceItems.$inferInsert;
export type StoreTransactionFee = typeof storeTransactionFees.$inferSelect;
export type NewStoreTransactionFee = typeof storeTransactionFees.$inferInsert;
export type PluginPricing = typeof pluginPricing.$inferSelect;
export type NewPluginPricing = typeof pluginPricing.$inferInsert;

// Gamification types
export type GamificationCampaign = typeof gamificationCampaigns.$inferSelect;
export type NewGamificationCampaign = typeof gamificationCampaigns.$inferInsert;
export type GamificationPrize = typeof gamificationPrizes.$inferSelect;
export type NewGamificationPrize = typeof gamificationPrizes.$inferInsert;
export type GamificationEntry = typeof gamificationEntries.$inferSelect;
export type NewGamificationEntry = typeof gamificationEntries.$inferInsert;
export type GamificationWin = typeof gamificationWins.$inferSelect;
export type NewGamificationWin = typeof gamificationWins.$inferInsert;

// Mobile devices types
export type MobileDevice = typeof mobileDevices.$inferSelect;
export type NewMobileDevice = typeof mobileDevices.$inferInsert;

// API Keys types
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type ApiKeyLog = typeof apiKeyLogs.$inferSelect;
export type NewApiKeyLog = typeof apiKeyLogs.$inferInsert;

// Product Reviews types
export type ProductReview = typeof productReviews.$inferSelect;
export type NewProductReview = typeof productReviews.$inferInsert;
export type ReviewMedia = typeof reviewMedia.$inferSelect;
export type NewReviewMedia = typeof reviewMedia.$inferInsert;
export type ReviewVote = typeof reviewVotes.$inferSelect;
export type NewReviewVote = typeof reviewVotes.$inferInsert;
export type ProductReviewSummary = typeof productReviewSummary.$inferSelect;
export type NewProductReviewSummary = typeof productReviewSummary.$inferInsert;

// Product Addons types
export type ProductAddon = typeof productAddons.$inferSelect;
export type NewProductAddon = typeof productAddons.$inferInsert;
export type ProductAddonAssignment = typeof productAddonAssignments.$inferSelect;
export type NewProductAddonAssignment = typeof productAddonAssignments.$inferInsert;

export type CategoryAddonAssignment = typeof categoryAddonAssignments.$inferSelect;
export type NewCategoryAddonAssignment = typeof categoryAddonAssignments.$inferInsert;

// Product Waitlist types
export type ProductWaitlistEntry = typeof productWaitlist.$inferSelect;
export type NewProductWaitlistEntry = typeof productWaitlist.$inferInsert;

// Product Bundle types
export type ProductBundle = typeof productBundles.$inferSelect;
export type NewProductBundle = typeof productBundles.$inferInsert;
export type BundleComponent = typeof bundleComponents.$inferSelect;
export type NewBundleComponent = typeof bundleComponents.$inferInsert;

// Product Badge types
export type ProductBadge = typeof productBadges.$inferSelect;
export type NewProductBadge = typeof productBadges.$inferInsert;
export type ProductBadgeAssignment = typeof productBadgeAssignments.$inferSelect;
export type NewProductBadgeAssignment = typeof productBadgeAssignments.$inferInsert;

// Platform Settings types
export type PlatformSetting = typeof platformSettings.$inferSelect;
export type NewPlatformSetting = typeof platformSettings.$inferInsert;

// ============================================================================
// HELP GUIDES (Platform-wide guides managed by admin)
// ============================================================================

export const helpGuideCategories = pgTable('help_guide_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  icon: text('icon'), // emoji or icon name
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const helpGuides = pgTable('help_guides', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').references(() => helpGuideCategories.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  content: text('content').notNull(), // markdown content
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Help Guides types
export type HelpGuideCategory = typeof helpGuideCategories.$inferSelect;
export type NewHelpGuideCategory = typeof helpGuideCategories.$inferInsert;
export type HelpGuide = typeof helpGuides.$inferSelect;
export type NewHelpGuide = typeof helpGuides.$inferInsert;

// ============================================================================
// LOCALIZATION / TRANSLATIONS
// ============================================================================

/**
 * Store Translations
 * 
 * Stores UI string overrides per locale per store.
 * Only created when:
 * 1. Store adds additional languages (en, ar, ru)
 * 2. Store customizes default Hebrew strings
 * 
 * Hebrew-only stores with default strings have NO records here = ZERO overhead!
 */
export const storeTranslations = pgTable('store_translations', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  locale: varchar('locale', { length: 5 }).notNull(), // 'he', 'en', 'ar', 'ru'
  
  // UI strings (checkout, cart, product, general, etc.)
  // Structure matches UITranslations type from lib/translations/types.ts
  uiStrings: jsonb('ui_strings').default({}).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_store_translations_unique').on(table.storeId, table.locale),
  index('idx_store_translations_store').on(table.storeId),
]);

/**
 * Content Translations
 * 
 * Stores translations for products, categories, pages, etc.
 * Only used when store has multiple locales.
 */
export const contentTranslations = pgTable('content_translations', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  
  // What entity is being translated
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'product', 'category', 'page', 'menu_item'
  entityId: uuid('entity_id').notNull(),
  locale: varchar('locale', { length: 5 }).notNull(),
  
  // The translated fields (flexible structure)
  // Product: { "name": "...", "description": "...", "shortDescription": "..." }
  // Category: { "name": "...", "description": "..." }
  translations: jsonb('translations').notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_content_translations_unique').on(table.storeId, table.entityType, table.entityId, table.locale),
  index('idx_content_translations_lookup').on(table.storeId, table.entityType, table.entityId),
  index('idx_content_translations_type').on(table.storeId, table.entityType, table.locale),
]);

// Localization types
export type StoreTranslation = typeof storeTranslations.$inferSelect;
export type NewStoreTranslation = typeof storeTranslations.$inferInsert;
export type ContentTranslation = typeof contentTranslations.$inferSelect;
export type NewContentTranslation = typeof contentTranslations.$inferInsert;

// ============================================================================
// GOOGLE BUSINESS PROFILE INTEGRATION
// ============================================================================

/**
 * Store Google Business Integration
 * 
 * Stores OAuth tokens and business info for Google Business Profile API.
 * Each store can connect ONE Google Business Profile.
 */
export const storeGoogleBusiness = pgTable('store_google_business', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull().unique(),
  
  // OAuth Tokens
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiresAt: timestamp('token_expires_at').notNull(),
  scope: text('scope'),
  
  // Google Business Info
  accountId: text('account_id').notNull(),        // accounts/{accountId}
  locationId: text('location_id').notNull(),      // locations/{locationId}
  businessName: text('business_name'),
  businessAddress: text('business_address'),
  businessPhone: text('business_phone'),
  businessWebsite: text('business_website'),
  placeId: text('place_id'),                      // Google Place ID
  
  // Cached Stats
  averageRating: decimal('average_rating', { precision: 2, scale: 1 }),
  totalReviews: integer('total_reviews').default(0),
  lastSyncedAt: timestamp('last_synced_at'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_store_google_business_store').on(table.storeId),
]);

/**
 * Cached Google Reviews
 * 
 * Stores reviews fetched from Google Business Profile API.
 * Helps avoid hitting API rate limits.
 */
export const storeGoogleReviews = pgTable('store_google_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  integrationId: uuid('integration_id').references(() => storeGoogleBusiness.id, { onDelete: 'cascade' }).notNull(),
  
  // Review data from Google
  googleReviewId: text('google_review_id').notNull(),
  authorName: text('author_name').notNull(),
  authorPhotoUrl: text('author_photo_url'),
  rating: integer('rating').notNull(),           // 1-5 stars
  comment: text('comment'),
  relativeTime: text('relative_time'),           // "2 weeks ago"
  reviewTime: timestamp('review_time'),
  reviewReply: text('review_reply'),             // Owner's reply
  replyTime: timestamp('reply_time'),
  
  // Display settings
  isVisible: boolean('is_visible').default(true),
  displayOrder: integer('display_order').default(0),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_store_google_reviews_store').on(table.storeId),
  index('idx_store_google_reviews_integration').on(table.integrationId),
  uniqueIndex('idx_store_google_reviews_unique').on(table.storeId, table.googleReviewId),
]);

// Relations
export const storeGoogleBusinessRelations = relations(storeGoogleBusiness, ({ one, many }) => ({
  store: one(stores, {
    fields: [storeGoogleBusiness.storeId],
    references: [stores.id],
  }),
  reviews: many(storeGoogleReviews),
}));

export const storeGoogleReviewsRelations = relations(storeGoogleReviews, ({ one }) => ({
  store: one(stores, {
    fields: [storeGoogleReviews.storeId],
    references: [stores.id],
  }),
  integration: one(storeGoogleBusiness, {
    fields: [storeGoogleReviews.integrationId],
    references: [storeGoogleBusiness.id],
  }),
}));

// Google Business types
export type StoreGoogleBusiness = typeof storeGoogleBusiness.$inferSelect;
export type NewStoreGoogleBusiness = typeof storeGoogleBusiness.$inferInsert;
export type StoreGoogleReview = typeof storeGoogleReviews.$inferSelect;
export type NewStoreGoogleReview = typeof storeGoogleReviews.$inferInsert;
