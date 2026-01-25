/**
 * Loyalty Program Plugin Schema
 * 
 * מועדון לקוחות PRO - תוסף לניהול רמות, נקודות והטבות
 */

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  decimal, 
  integer,
  boolean, 
  timestamp, 
  jsonb, 
  pgEnum,
  uniqueIndex, 
  index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { stores } from './schema';
import { customers } from './schema';
import { contacts } from './schema';
import { orders } from './schema';
import { discounts } from './schema';
import { products } from './schema';

// ============ ENUMS ============

export const loyaltyProgressionTypeEnum = pgEnum('loyalty_progression_type', [
  'total_spent',    // לפי סכום רכישות
  'total_orders',   // לפי מספר הזמנות
  'points_earned'   // לפי נקודות שנצברו
]);

export const loyaltyTransactionTypeEnum = pgEnum('loyalty_transaction_type', [
  'earn',      // צבירה מהזמנה
  'redeem',    // פדיון
  'expire',    // פג תוקף
  'adjust',    // התאמה ידנית
  'bonus',     // בונוס (יום הולדת, הרשמה וכו')
  'refund'     // החזר מביטול הזמנה
]);

// ============ TABLES ============

/**
 * הגדרות תוכנית הנאמנות לחנות
 * טבלה אחת לכל חנות
 */
export const loyaltyPrograms = pgTable('loyalty_programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  
  // Main settings
  isEnabled: boolean('is_enabled').default(false).notNull(),
  name: varchar('name', { length: 255 }).default('מועדון לקוחות').notNull(),
  
  // Points settings
  pointsEnabled: boolean('points_enabled').default(true).notNull(),
  pointsPerIls: decimal('points_per_ils', { precision: 10, scale: 2 }).default('1').notNull(),
  pointsRedemptionRate: decimal('points_redemption_rate', { precision: 10, scale: 4 }).default('0.1').notNull(),
  minPointsToRedeem: integer('min_points_to_redeem').default(100).notNull(),
  pointsExpireDays: integer('points_expire_days'), // NULL = לא פג תוקף
  
  // Tier progression
  progressionType: loyaltyProgressionTypeEnum('progression_type').default('total_spent').notNull(),
  
  // Display settings
  showProgressBar: boolean('show_progress_bar').default(true).notNull(),
  showPointsInHeader: boolean('show_points_in_header').default(true).notNull(),
  
  // Welcome bonus
  welcomeBonus: integer('welcome_bonus').default(0).notNull(), // נקודות בונוס בהרשמה
  birthdayBonus: integer('birthday_bonus').default(0).notNull(), // נקודות ביום הולדת
  
  // Additional settings JSONB
  settings: jsonb('settings').default({}).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  storeIdx: uniqueIndex('loyalty_programs_store_idx').on(table.storeId),
}));

/**
 * רמות המועדון
 * כל רמה מגדירה יעד והטבות
 */
export const loyaltyTiers = pgTable('loyalty_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  programId: uuid('program_id').references(() => loyaltyPrograms.id, { onDelete: 'cascade' }).notNull(),
  
  // Tier info
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull(),
  level: integer('level').notNull(), // 1, 2, 3, 4 לסדר
  color: varchar('color', { length: 7 }).default('#CD7F32').notNull(),
  icon: varchar('icon', { length: 50 }), // emoji או icon name
  
  // Requirements - מינימום להגעה לרמה
  minValue: decimal('min_value', { precision: 12, scale: 2 }).default('0').notNull(),
  
  // Benefits
  pointsMultiplier: decimal('points_multiplier', { precision: 3, scale: 2 }).default('1.0').notNull(),
  discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }).default('0').notNull(),
  freeShippingThreshold: decimal('free_shipping_threshold', { precision: 10, scale: 2 }),
  
  // Description for display
  description: text('description'),
  benefitsList: jsonb('benefits_list').default([]).notNull(), // ["משלוח חינם", "20% הנחה"]
  
  // Is default tier for new members
  isDefault: boolean('is_default').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  programLevelIdx: uniqueIndex('loyalty_tiers_program_level_idx').on(table.programId, table.level),
  programIdx: index('loyalty_tiers_program_idx').on(table.programId),
}));

/**
 * חברי מועדון
 * מקשר לקוח/איש קשר לרמה ומעקב נקודות
 */
export const loyaltyMembers = pgTable('loyalty_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  
  // Current status
  currentTierId: uuid('current_tier_id').references(() => loyaltyTiers.id, { onDelete: 'set null' }),
  
  // Points tracking
  totalPointsEarned: decimal('total_points_earned', { precision: 12, scale: 2 }).default('0').notNull(),
  totalPointsRedeemed: decimal('total_points_redeemed', { precision: 12, scale: 2 }).default('0').notNull(),
  currentPoints: decimal('current_points', { precision: 12, scale: 2 }).default('0').notNull(),
  
  // Progression tracking
  totalSpentQualifying: decimal('total_spent_qualifying', { precision: 12, scale: 2 }).default('0').notNull(),
  totalOrdersQualifying: integer('total_orders_qualifying').default(0).notNull(),
  
  // Timestamps
  tierUpdatedAt: timestamp('tier_updated_at').defaultNow().notNull(),
  pointsExpireAt: timestamp('points_expire_at'),
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  storeCustomerIdx: uniqueIndex('loyalty_members_store_customer_idx').on(table.storeId, table.customerId),
  storeContactIdx: index('loyalty_members_store_contact_idx').on(table.storeId, table.contactId),
  storeIdx: index('loyalty_members_store_idx').on(table.storeId),
  tierIdx: index('loyalty_members_tier_idx').on(table.currentTierId),
}));

/**
 * תנועות נקודות
 * כל שינוי בנקודות נרשם כאן
 */
export const loyaltyTransactions = pgTable('loyalty_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').references(() => loyaltyMembers.id, { onDelete: 'cascade' }).notNull(),
  
  // Transaction type
  type: loyaltyTransactionTypeEnum('type').notNull(),
  
  // Points (positive for earn/bonus, negative for redeem/expire)
  points: decimal('points', { precision: 12, scale: 2 }).notNull(),
  
  // Related entities
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  
  // For redemption: discount code generated
  discountId: uuid('discount_id').references(() => discounts.id, { onDelete: 'set null' }),
  
  // Details
  description: varchar('description', { length: 255 }),
  metadata: jsonb('metadata').default({}).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'), // For earned points
}, (table) => ({
  memberIdx: index('loyalty_transactions_member_idx').on(table.memberId),
  orderIdx: index('loyalty_transactions_order_idx').on(table.orderId),
  typeIdx: index('loyalty_transactions_type_idx').on(table.memberId, table.type),
  createdAtIdx: index('loyalty_transactions_created_idx').on(table.memberId, table.createdAt),
}));

/**
 * מוצרים בלעדיים לרמה
 */
export const loyaltyTierProducts = pgTable('loyalty_tier_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tierId: uuid('tier_id').references(() => loyaltyTiers.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  
  // Optional: special price for this tier
  tierPrice: decimal('tier_price', { precision: 10, scale: 2 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tierProductIdx: uniqueIndex('loyalty_tier_products_unique_idx').on(table.tierId, table.productId),
  tierIdx: index('loyalty_tier_products_tier_idx').on(table.tierId),
  productIdx: index('loyalty_tier_products_product_idx').on(table.productId),
}));

// ============ RELATIONS ============

export const loyaltyProgramsRelations = relations(loyaltyPrograms, ({ one, many }) => ({
  store: one(stores, {
    fields: [loyaltyPrograms.storeId],
    references: [stores.id],
  }),
  tiers: many(loyaltyTiers),
}));

export const loyaltyTiersRelations = relations(loyaltyTiers, ({ one, many }) => ({
  program: one(loyaltyPrograms, {
    fields: [loyaltyTiers.programId],
    references: [loyaltyPrograms.id],
  }),
  members: many(loyaltyMembers),
  tierProducts: many(loyaltyTierProducts),
}));

export const loyaltyMembersRelations = relations(loyaltyMembers, ({ one, many }) => ({
  store: one(stores, {
    fields: [loyaltyMembers.storeId],
    references: [stores.id],
  }),
  customer: one(customers, {
    fields: [loyaltyMembers.customerId],
    references: [customers.id],
  }),
  contact: one(contacts, {
    fields: [loyaltyMembers.contactId],
    references: [contacts.id],
  }),
  currentTier: one(loyaltyTiers, {
    fields: [loyaltyMembers.currentTierId],
    references: [loyaltyTiers.id],
  }),
  transactions: many(loyaltyTransactions),
}));

export const loyaltyTransactionsRelations = relations(loyaltyTransactions, ({ one }) => ({
  member: one(loyaltyMembers, {
    fields: [loyaltyTransactions.memberId],
    references: [loyaltyMembers.id],
  }),
  order: one(orders, {
    fields: [loyaltyTransactions.orderId],
    references: [orders.id],
  }),
  discount: one(discounts, {
    fields: [loyaltyTransactions.discountId],
    references: [discounts.id],
  }),
}));

export const loyaltyTierProductsRelations = relations(loyaltyTierProducts, ({ one }) => ({
  tier: one(loyaltyTiers, {
    fields: [loyaltyTierProducts.tierId],
    references: [loyaltyTiers.id],
  }),
  product: one(products, {
    fields: [loyaltyTierProducts.productId],
    references: [products.id],
  }),
}));

// ============ TYPES ============

export type LoyaltyProgram = typeof loyaltyPrograms.$inferSelect;
export type NewLoyaltyProgram = typeof loyaltyPrograms.$inferInsert;

export type LoyaltyTier = typeof loyaltyTiers.$inferSelect;
export type NewLoyaltyTier = typeof loyaltyTiers.$inferInsert;

export type LoyaltyMember = typeof loyaltyMembers.$inferSelect;
export type NewLoyaltyMember = typeof loyaltyMembers.$inferInsert;

export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type NewLoyaltyTransaction = typeof loyaltyTransactions.$inferInsert;

export type LoyaltyTierProduct = typeof loyaltyTierProducts.$inferSelect;
export type NewLoyaltyTierProduct = typeof loyaltyTierProducts.$inferInsert;





