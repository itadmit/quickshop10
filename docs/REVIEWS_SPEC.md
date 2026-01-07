# ⭐ תוסף ביקורות - QuickShop

## 🎯 סקירה כללית

**תוסף ביקורות בתשלום** בסגנון Yotpo - מאפשר ללקוחות לדרג מוצרים, לכתוב ביקורות ולהעלות מדיה.

### פרטי התוסף

| שדה | ערך |
|-----|-----|
| **Slug** | `product-reviews` |
| **שם** | ביקורות מוצרים |
| **קטגוריה** | `marketing` |
| **מחיר** | ₪49.90/חודש |
| **ימי ניסיון** | 14 יום |
| **אייקון** | `Star` (lucide-react) |

### עקרונות מפתח

- **⚡ מהירות** - Server Components, ללא hydration מיותר
- **🔌 תוסף** - לא פעיל כברירת מחדל, נטען רק אם מותקן
- **🏷️ תגיות** - "רכישה מאומתת" אוטומטית
- **🔧 מודרציה** - אישור ביקורות לפני פרסום

---

## 🔌 אינטגרציה במערכת התוספים

### 1. הוספה ל-Registry

```typescript
// src/lib/plugins/registry.ts

{
  slug: 'product-reviews',
  name: 'ביקורות מוצרים',
  description: 'אפשר ללקוחות לדרג מוצרים, לכתוב ביקורות ולהעלות תמונות - עם מודרציה, תגיות ותגובות מנהל',
  type: 'core',
  category: 'marketing',
  version: '1.0.0',
  icon: 'star',
  author: 'QuickShop',
  isFree: false,
  price: 49.90,
  trialDays: 14,
  defaultConfig: {
    enabled: true,
    requireApproval: true,          // דורש אישור מנהל
    requireText: false,             // טקסט חובה
    minTextLength: 10,              // מינימום תווים
    allowMedia: true,               // אפשר תמונות/וידאו
    maxMediaPerReview: 5,           // מקסימום קבצים
    allowGuestReviews: false,       // רק לקוחות רשומים
    autoApproveVerified: true,      // אישור אוטומטי לרכישות מאומתות
    showVerifiedBadge: true,        // הצג תג "רכישה מאומתת"
    emailRequestDays: 7,            // בקשת ביקורת X ימים אחרי משלוח
  },
  metadata: {
    menuItem: {
      icon: 'Star',
      label: 'ביקורות',
      href: '/plugins/product-reviews',
      section: 'marketing',
    },
    features: [
      'דירוג 1-5 כוכבים',
      'תגית "רכישה מאומתת" אוטומטית',
      'העלאת תמונות ווידאו',
      'מודרציה ואישור ביקורות',
      'תגובות מנהל',
      'כפתור "מועיל" להצבעה',
      'תגיות מותאמות אישית',
      'סיכום דירוגים מהיר (cached)',
      'אימייל בקשת ביקורת אוטומטי',
    ],
    screenshots: [
      '/images/plugins/reviews-product.png',
      '/images/plugins/reviews-admin.png',
    ],
  },
},
```

### 2. בדיקת התקנה בדף מוצר

```typescript
// src/app/shops/[slug]/(storefront)/product/[productSlug]/page.tsx

import { isPluginActive } from '@/lib/plugins/loader';

export default async function ProductPage({ params }) {
  const { slug, productSlug } = await params;
  const store = await getStoreBySlug(slug);
  
  // בדיקה האם תוסף ביקורות מותקן ופעיל
  const reviewsEnabled = await isPluginActive(store.id, 'product-reviews');
  
  return (
    <>
      <ProductInfo product={product} />
      
      {/* ביקורות - רק אם התוסף פעיל */}
      {reviewsEnabled && (
        <Suspense fallback={<ReviewsSkeleton />}>
          <ProductReviews productId={product.id} storeId={store.id} />
        </Suspense>
      )}
    </>
  );
}
```

---

## 🗄️ Database Schema

### 1. product_reviews (ביקורות)

```sql
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  
  -- תוכן
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT,
  pros TEXT,                    -- מה אהבתי
  cons TEXT,                    -- מה פחות אהבתי
  
  -- תגיות
  is_verified_purchase BOOLEAN DEFAULT false,
  badges TEXT[] DEFAULT '{}',   -- תגיות מותאמות
  
  -- סטטוס
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- תגובת מנהל
  admin_reply TEXT,
  admin_reply_at TIMESTAMP,
  admin_reply_by UUID REFERENCES users(id),
  
  -- הצבעות
  helpful_count INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  
  -- לאורחים (אם מאפשרים)
  customer_name VARCHAR(100),
  customer_email VARCHAR(255),
  
  -- timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- אינדקסים לביצועים
CREATE INDEX idx_reviews_store_product ON product_reviews(store_id, product_id);
CREATE INDEX idx_reviews_approved ON product_reviews(store_id, is_approved) WHERE is_approved = true;
CREATE INDEX idx_reviews_pending ON product_reviews(store_id, is_approved) WHERE is_approved = false;
CREATE INDEX idx_reviews_customer ON product_reviews(customer_id);
```

### 2. review_media (מדיה)

```sql
CREATE TABLE review_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('image', 'video')),
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),      -- לוידאו
  public_id VARCHAR(255),          -- Cloudinary
  width INT,
  height INT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_review_media_review ON review_media(review_id);
```

### 3. review_votes (הצבעות)

```sql
CREATE TABLE review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  session_id VARCHAR(100),         -- לאורחים
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- כל משתמש יכול להצביע פעם אחת לביקורת
  UNIQUE(review_id, customer_id),
  UNIQUE(review_id, session_id)
);

CREATE INDEX idx_review_votes_review ON review_votes(review_id);
```

### 4. product_review_summary (Denormalized - לביצועים)

```sql
CREATE TABLE product_review_summary (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  total_reviews INT DEFAULT 0,
  average_rating DECIMAL(2,1) DEFAULT 0,
  rating_1_count INT DEFAULT 0,
  rating_2_count INT DEFAULT 0,
  rating_3_count INT DEFAULT 0,
  rating_4_count INT DEFAULT 0,
  rating_5_count INT DEFAULT 0,
  with_media_count INT DEFAULT 0,
  verified_count INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### 5. Drizzle Schema

```typescript
// src/lib/db/schema.ts

// Enums
export const reviewStatusEnum = pgEnum('review_status', ['pending', 'approved', 'rejected']);

// Product Reviews
export const productReviews = pgTable('product_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  
  rating: integer('rating').notNull(),
  title: varchar('title', { length: 255 }),
  content: text('content'),
  pros: text('pros'),
  cons: text('cons'),
  
  isVerifiedPurchase: boolean('is_verified_purchase').default(false).notNull(),
  badges: text('badges').array().default([]),
  
  isApproved: boolean('is_approved').default(false).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  
  adminReply: text('admin_reply'),
  adminReplyAt: timestamp('admin_reply_at'),
  adminReplyBy: uuid('admin_reply_by').references(() => users.id),
  
  helpfulCount: integer('helpful_count').default(0).notNull(),
  notHelpfulCount: integer('not_helpful_count').default(0).notNull(),
  
  customerName: varchar('customer_name', { length: 100 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_reviews_store_product').on(table.storeId, table.productId),
  index('idx_reviews_customer').on(table.customerId),
]);

// Review Media
export const reviewMedia = pgTable('review_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').references(() => productReviews.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 10 }).notNull(), // 'image' | 'video'
  url: varchar('url', { length: 500 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  publicId: varchar('public_id', { length: 255 }),
  width: integer('width'),
  height: integer('height'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_review_media_review').on(table.reviewId),
]);

// Review Votes
export const reviewVotes = pgTable('review_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').references(() => productReviews.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  sessionId: varchar('session_id', { length: 100 }),
  isHelpful: boolean('is_helpful').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_review_votes_review').on(table.reviewId),
  uniqueIndex('idx_review_votes_customer').on(table.reviewId, table.customerId),
]);

// Review Summary (Denormalized)
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
```

---

## 🏷️ מערכת תגיות (Badges)

### תגיות אוטומטיות

| תגית | תנאי | צבע | אייקון |
|------|------|-----|--------|
| **רכישה מאומתת** | `order_id` קיים | ירוק `#22C55E` | ✓ |
| **לקוח רשום** | `customer_id` קיים | כחול `#3B82F6` | 👤 |
| **ממליץ** | `rating >= 4` | צהוב `#F59E0B` | ⭐ |

### תגיות ידניות (מנהל)

| תגית | שימוש | צבע |
|------|-------|-----|
| **בחירת העורך** | ביקורת איכותית | סגול `#8B5CF6` |
| **מבקר מוביל** | לקוח עם הרבה ביקורות | זהב `#FFD700` |
| **מועיל במיוחד** | הרבה לייקים | ירוק `#10B981` |

### הגדרות תגיות (בתוך config)

```typescript
defaultConfig: {
  // ...
  customBadges: [
    { id: 'editors-pick', name: 'בחירת העורך', color: '#8B5CF6', icon: 'crown' },
    { id: 'top-reviewer', name: 'מבקר מוביל', color: '#FFD700', icon: 'trophy' },
    { id: 'helpful', name: 'מועיל במיוחד', color: '#10B981', icon: 'thumbs-up' },
  ],
}
```

---

## 📁 מבנה קבצים

```
src/
├── lib/
│   ├── plugins/
│   │   ├── registry.ts              # + הגדרת product-reviews
│   │   └── loader.ts                # ללא שינוי
│   │
│   └── db/
│       └── schema.ts                # + טבלאות ביקורות
│
├── app/
│   └── shops/[slug]/
│       │
│       ├── (storefront)/
│       │   └── product/[productSlug]/
│       │       └── page.tsx         # + אינטגרציה עם תוסף
│       │
│       └── admin/
│           └── plugins/
│               └── product-reviews/
│                   ├── page.tsx           # רשימת ביקורות
│                   ├── [id]/
│                   │   └── page.tsx       # עריכת ביקורת
│                   ├── settings/
│                   │   └── page.tsx       # הגדרות התוסף
│                   ├── actions.ts         # Server Actions
│                   └── components/
│                       ├── reviews-list.tsx
│                       ├── review-card-admin.tsx
│                       ├── review-edit-form.tsx
│                       └── settings-form.tsx
│
└── components/
    └── reviews/                     # קומפוננטות משותפות
        ├── review-summary.tsx       # סיכום דירוגים (Server)
        ├── review-list.tsx          # רשימה + pagination (Client)
        ├── review-card.tsx          # כרטיס ביקורת (Server)
        ├── review-form.tsx          # טופס כתיבה (Client)
        ├── star-rating.tsx          # כוכבים (Client)
        ├── review-media.tsx         # גלריית מדיה (Client)
        ├── helpful-button.tsx       # כפתור מועיל (Client)
        └── review-badges.tsx        # תגיות (Server)
```

---

## 📱 ממשקים

### A. דף מוצר - סיכום דירוגים (Server Component)

```
┌─────────────────────────────────────────────────────────────────┐
│  ⭐ ביקורות לקוחות                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────┐                      │
│  │  ★★★★☆ 4.3 (128 ביקורות)            │                      │
│  │                                      │                      │
│  │  5 ★ ████████████████████ 72%       │                      │
│  │  4 ★ ██████████░░░░░░░░░░ 18%       │                      │
│  │  3 ★ ██░░░░░░░░░░░░░░░░░░  5%       │                      │
│  │  2 ★ █░░░░░░░░░░░░░░░░░░░  3%       │                      │
│  │  1 ★ █░░░░░░░░░░░░░░░░░░░  2%       │                      │
│  │                                      │                      │
│  │  📷 32 עם תמונות  ✓ 89 רכישות מאומתות│                      │
│  └──────────────────────────────────────┘                      │
│                                                                 │
│  [כתוב ביקורת]                                                 │
│                                                                 │
│  סינון: [כל הדירוגים ▾] [עם תמונות ☐]  מיון: [רלוונטי ▾]      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ★★★★★  "מוצר מעולה!"                   15.01.2026          ││
│  │ 🏷️ רכישה מאומתת  🏷️ ממליץ                                ││
│  │                                                             ││
│  │ שרה כ.                                                     ││
│  │ קניתי את המוצר הזה לפני שבועיים ואני מאוד מרוצה.          ││
│  │ האיכות מעולה והמשלוח הגיע מהר.                             ││
│  │                                                             ││
│  │ ✓ מה אהבתי: איכות, מחיר, משלוח מהיר                        ││
│  │ ✗ מה פחות: האריזה הייתה קצת פגומה                          ││
│  │                                                             ││
│  │ [📷] [📷]                                                   ││
│  │                                                             ││
│  │ 👍 מועיל (23)  👎 (2)                                       ││
│  │                                                             ││
│  │ ┌─ תגובת בעל החנות ─────────────────────────────────────┐ ││
│  │ │ תודה רבה! אנחנו עובדים על שיפור האריזות.              │ ││
│  │ └───────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [טען עוד ביקורות]                                             │
└─────────────────────────────────────────────────────────────────┘
```

### B. טופס ביקורת (Client Component)

```
┌─────────────────────────────────────────────────────────────────┐
│  ✍️ כתוב ביקורת                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  דירוג כולל *                                                  │
│  ☆ ☆ ☆ ☆ ☆  (לחץ לדירוג)                                      │
│                                                                 │
│  כותרת                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  הביקורת שלך *                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📷 הוסף תמונות (עד 5)                                         │
│  [+] [📷] [📷]                                                 │
│                                                                 │
│  ☑️ רכשתי מוצר זה                                              │
│     הזמנה: [#1234 ▾]                                           │
│                                                                 │
│                                    [ביטול]  [שלח ביקורת]       │
└─────────────────────────────────────────────────────────────────┘
```

### C. אדמין - ניהול ביקורות

```
┌─────────────────────────────────────────────────────────────────┐
│  ⭐ ביקורות                                    [⚙️ הגדרות]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │   156    │ │    12    │ │    8     │ │   4.3    │          │
│  │ סה"כ    │ │ ממתינות  │ │ השבוע   │ │ ממוצע   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  [הכל] [ממתינות (12)] [עם תמונות] [מודגשות]                   │
│                                                                 │
│  🔍 [חיפוש...]  מוצר: [הכל ▾]  דירוג: [הכל ▾]                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ☐ │ ★★★★★ │ שרה כ. │ חולצה לבנה │ 15.01 │ ✓ מאושר │ [⋮]    │
│  ☐ │ ★★★☆☆ │ דני מ. │ מכנסיים   │ 14.01 │ ⏳ ממתין │ [⋮]    │
│  ☐ │ ★★★★☆ │ יעל ר. │ שמלה      │ 13.01 │ ✓ מאושר │ [⋮]    │
│                                                                 │
│  פעולות: [✓ אשר] [✗ דחה] [🗑️ מחק] [🏷️ תגית]                  │
└─────────────────────────────────────────────────────────────────┘
```

### D. עריכת ביקורת

```
┌─────────────────────────────────────────────────────────────────┐
│  עריכת ביקורת                                        [← חזור] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  לקוח: שרה כהן (sarah@example.com)                             │
│  מוצר: חולצה לבנה - מידה M                                     │
│  הזמנה: #1234 ✓ רכישה מאומתת                                   │
│  תאריך: 15.01.2026                                             │
│                                                                 │
│  סטטוס: [מאושר ▾]    ☐ ביקורת מודגשת                          │
│                                                                 │
│  דירוג: ★★★★★ (לא ניתן לשינוי)                                 │
│                                                                 │
│  תוכן:                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ מוצר מעולה! האיכות מעולה והמשלוח הגיע מהר.             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  תגיות: [רכישה מאומתת ✓] [+ הוסף]                             │
│                                                                 │
│  תמונות: [📷 ❌] [📷 ❌]                                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  💬 תגובת מנהל                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ תודה רבה על הביקורת!                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                   [שלח תגובה]  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                    [🗑️ מחק]  [💾 שמור]        │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚡ אופטימיזציות ביצועים

### 1. Server Component לסיכום

```typescript
// ReviewSummary - Server Component (no hydration!)
async function ReviewSummary({ productId }: { productId: string }) {
  const summary = await getReviewSummary(productId); // Cached
  
  if (!summary || summary.totalReviews === 0) {
    return <p>אין עדיין ביקורות למוצר זה</p>;
  }
  
  return (
    <div>
      <div className="flex items-center gap-2">
        <StarRating rating={Number(summary.averageRating)} readonly />
        <span>{summary.averageRating} ({summary.totalReviews} ביקורות)</span>
      </div>
      {/* Rating bars */}
    </div>
  );
}
```

### 2. Denormalized Summary

```typescript
// O(1) לקבלת ממוצע - אין צורך ב-COUNT/AVG
export const getReviewSummary = unstable_cache(
  async (productId: string) => {
    const [summary] = await db
      .select()
      .from(productReviewSummary)
      .where(eq(productReviewSummary.productId, productId))
      .limit(1);
    return summary;
  },
  ['review-summary'],
  { revalidate: 300, tags: ['reviews'] }
);
```

### 3. Lazy Loading Reviews

```typescript
// ReviewList - Client Component
function ReviewList({ productId, initialReviews }) {
  const [reviews, setReviews] = useState(initialReviews);
  
  const loadMore = async () => {
    const more = await fetchReviews(productId, { offset: reviews.length });
    setReviews(prev => [...prev, ...more]);
  };
  
  return (
    <>
      {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
      <button onClick={loadMore}>טען עוד</button>
    </>
  );
}
```

### 4. עדכון Summary עם Trigger/Action

```typescript
// After review CRUD - update summary
async function updateReviewSummary(productId: string) {
  const stats = await db
    .select({
      total: count(),
      avg: avg(productReviews.rating),
      r1: count(sql`CASE WHEN rating = 1 THEN 1 END`),
      // ...
    })
    .from(productReviews)
    .where(and(
      eq(productReviews.productId, productId),
      eq(productReviews.isApproved, true)
    ));
  
  await db
    .insert(productReviewSummary)
    .values({ productId, ...stats })
    .onConflictDoUpdate({ target: productReviewSummary.productId, set: stats });
  
  revalidateTag('reviews');
}
```

---

## 🔄 זרימות עבודה

### כתיבת ביקורת

```
לקוח מחובר → לחיצה "כתוב ביקורת"
                    ↓
          בדיקה: רכש מוצר זה?
         /                    \
       כן                      לא
        ↓                       ↓
    בחירת הזמנה              ממשיך ללא
        ↓                       ↓
            מילוי טופס
                ↓
          שליחת ביקורת
                ↓
┌─────────────────────────────────────┐
│ requireApproval?                    │
│ autoApproveVerified + verified?     │
└─────────────────────────────────────┘
        /              \
    אישור             ממתין
    אוטומטי          לאישור
        ↓               ↓
    מתפרסם          התראה
                    לאדמין
```

### מודרציה

```
התראה: ביקורת חדשה ממתינה
            ↓
    כניסה לרשימת ביקורות
            ↓
       צפייה בביקורת
       /     |      \
    אשר   ערוך    דחה
      ↓      ↓       ↓
  מתפרסם  עריכה   אימייל
          + אישור  ללקוח
```

---

## 📧 אימיילים

### בקשת ביקורת (X ימים אחרי משלוח)

```
Subject: מה דעתך על [מוצר]? ⭐

שלום [שם],

קנית [מוצר] לפני [X] ימים.
נשמח לשמוע את דעתך!

[⭐⭐⭐⭐⭐ דרג עכשיו]
```

### ביקורת אושרה

```
Subject: הביקורת שלך פורסמה! 🎉

תודה על הביקורת על [מוצר].
הביקורת פורסמה באתר.
```

---

## ✅ Checklist פיתוח

### Phase 1 - בסיס
- [ ] הוספה ל-Registry
- [ ] Schema + Migration
- [ ] Server Actions (CRUD)
- [ ] תצוגה בדף מוצר (Server Component)
- [ ] טופס כתיבה (Client Component)
- [ ] Summary denormalized

### Phase 2 - אדמין
- [ ] עמוד רשימת ביקורות
- [ ] עריכת ביקורת + תגיות
- [ ] תגובות מנהל
- [ ] הגדרות התוסף

### Phase 3 - מתקדם
- [ ] העלאת מדיה (Cloudinary)
- [ ] כפתור "מועיל"
- [ ] סינון ומיון
- [ ] אימיילים אוטומטיים

---

> ראה `DATABASE.md` להוספת הטבלאות לסכמה המלאה
