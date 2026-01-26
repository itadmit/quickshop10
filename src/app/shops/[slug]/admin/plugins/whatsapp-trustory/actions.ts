'use server';

/**
 * WhatsApp Trustory Plugin - Server Actions
 */

import { db } from '@/lib/db';
import { storePlugins, stores, customers, contacts } from '@/lib/db/schema';
import { eq, and, gt, or, ilike, desc, count, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { createTrustoryClient } from '@/lib/whatsapp-trustory/client';
import { sendBulkWhatsAppMessages, type BulkSendResult } from '@/lib/whatsapp-trustory/send';

interface PluginConfig {
  token: string;
  instanceId: string;
  enabled: boolean;
}

/**
 * שמירת הגדרות התוסף
 */
export async function saveWhatsAppConfig(
  storeId: string,
  storeSlug: string,
  config: PluginConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(storePlugins)
      .set({
        config,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(storePlugins.storeId, storeId),
          eq(storePlugins.pluginSlug, 'whatsapp-trustory')
        )
      );

    revalidatePath(`/shops/${storeSlug}/admin/plugins/whatsapp-trustory`);
    return { success: true };
  } catch (error) {
    console.error('[WhatsApp] Config save error:', error);
    return { success: false, error: 'שגיאה בשמירת ההגדרות' };
  }
}

/**
 * בדיקת חיבור
 */
export async function testWhatsAppConnection(
  token: string,
  instanceId: string,
  testPhone: string
): Promise<{ success: boolean; message: string }> {
  try {
    const client = createTrustoryClient({ token, instanceId });
    
    if (!client) {
      return { success: false, message: 'לא ניתן ליצור חיבור - בדוק את ההגדרות' };
    }

    const result = await client.testConnection(testPhone);
    
    return {
      success: result.success,
      message: result.success 
        ? 'הודעת בדיקה נשלחה בהצלחה!' 
        : result.message || 'שליחה נכשלה',
    };
  } catch (error) {
    console.error('[WhatsApp] Test connection error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'שגיאה בבדיקת החיבור' 
    };
  }
}

/**
 * קבלת אנשי קשר לדיוור
 */
export interface ContactForBroadcast {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  type: 'customer' | 'contact';
  source?: string;
  totalOrders?: number;
  totalSpent?: number;
}

export type ContactFilter = 
  | 'all'
  | 'customers'         // לקוחות עם הזמנות שאישרו דיוור
  | 'newsletter'        // רשומים לניוזלטר (אישרו דיוור)
  | 'club_member'       // חברי מועדון
  | 'contact_form'      // יצירת קשר
  | 'popup_form';       // מפופאפ

// ⚠️ חשוב: מסננים רק אנשי קשר שאישרו דיוור (acceptsMarketing)
// או שנרשמו לניוזלטר/מועדון (הסכמה משתמעת)

export async function getContactsForBroadcast(
  storeId: string,
  filter: ContactFilter = 'all',
  search?: string,
  page: number = 1,
  limit: number = 50
): Promise<{ contacts: ContactForBroadcast[]; total: number; hasMore: boolean }> {
  const offset = (page - 1) * limit;
  const results: ContactForBroadcast[] = [];
  let total = 0;

  // Build search condition for customers
  const buildSearchCondition = (searchTerm: string) => {
    const pattern = `%${searchTerm}%`;
    return or(
      ilike(customers.email, pattern),
      ilike(customers.firstName, pattern),
      ilike(customers.lastName, pattern),
      ilike(customers.phone, pattern)
    );
  };

  // Build search condition for contacts
  const buildContactSearchCondition = (searchTerm: string) => {
    const pattern = `%${searchTerm}%`;
    return or(
      ilike(contacts.email, pattern),
      ilike(contacts.firstName, pattern),
      ilike(contacts.lastName, pattern),
      ilike(contacts.phone, pattern)
    );
  };

  if (filter === 'all' || filter === 'customers') {
    // Customers with orders and phone numbers - ONLY those who accepted marketing!
    const customerConditions = [
      eq(customers.storeId, storeId),
      gt(customers.totalOrders, 0),
      eq(customers.acceptsMarketing, true), // ⚠️ רק מי שאישר דיוור!
    ];
    
    if (search) {
      customerConditions.push(buildSearchCondition(search)!);
    }

    const [{ count: customerCount }] = await db
      .select({ count: count() })
      .from(customers)
      .where(and(...customerConditions));

    const customerResults = await db
      .select({
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        phone: customers.phone,
        email: customers.email,
        totalOrders: customers.totalOrders,
        totalSpent: customers.totalSpent,
      })
      .from(customers)
      .where(and(...customerConditions))
      .orderBy(desc(customers.totalSpent))
      .limit(filter === 'customers' ? limit : Math.floor(limit / 2))
      .offset(filter === 'customers' ? offset : 0);

    for (const c of customerResults) {
      if (c.phone) {
        results.push({
          id: c.id,
          name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || 'לקוח',
          phone: c.phone,
          email: c.email,
          type: 'customer',
          totalOrders: c.totalOrders ?? undefined,
          totalSpent: c.totalSpent ? Number(c.totalSpent) : undefined,
        });
      }
    }

    if (filter === 'customers') {
      total = customerCount;
    } else {
      total += customerCount;
    }
  }

  if (filter !== 'customers') {
    // Contacts from various sources
    const contactConditions = [
      eq(contacts.storeId, storeId),
    ];

    // Filter by type
    if (filter === 'newsletter') {
      contactConditions.push(eq(contacts.type, 'newsletter'));
    } else if (filter === 'club_member') {
      contactConditions.push(eq(contacts.type, 'club_member'));
    } else if (filter === 'contact_form') {
      contactConditions.push(eq(contacts.type, 'contact_form'));
    } else if (filter === 'popup_form') {
      contactConditions.push(eq(contacts.type, 'popup_form'));
    }

    if (search) {
      contactConditions.push(buildContactSearchCondition(search)!);
    }

    const [{ count: contactCount }] = await db
      .select({ count: count() })
      .from(contacts)
      .where(and(...contactConditions));

    const contactResults = await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        phone: contacts.phone,
        email: contacts.email,
        type: contacts.type,
        source: contacts.source,
      })
      .from(contacts)
      .where(and(...contactConditions))
      .orderBy(desc(contacts.createdAt))
      .limit(filter === 'all' ? Math.floor(limit / 2) : limit)
      .offset(filter === 'all' ? 0 : offset);

    for (const c of contactResults) {
      if (c.phone) {
        results.push({
          id: c.id,
          name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || 'איש קשר',
          phone: c.phone,
          email: c.email,
          type: 'contact',
          source: c.type,
        });
      }
    }

    if (filter !== 'all') {
      total = contactCount;
    } else {
      total += contactCount;
    }
  }

  // Remove duplicates by phone
  const uniqueByPhone = new Map<string, ContactForBroadcast>();
  for (const contact of results) {
    const normalizedPhone = contact.phone.replace(/\D/g, '');
    if (!uniqueByPhone.has(normalizedPhone)) {
      uniqueByPhone.set(normalizedPhone, contact);
    }
  }

  const uniqueResults = Array.from(uniqueByPhone.values());

  return {
    contacts: uniqueResults.slice(0, limit),
    total,
    hasMore: total > offset + limit,
  };
}

/**
 * שליחת דיוור
 */
export async function sendBroadcast(
  storeId: string,
  storeSlug: string,
  phones: string[],
  message: string,
  options?: {
    templateId?: string;
    mediaType?: 'text' | 'image' | 'video' | 'document';
    mediaUrl?: string;
  }
): Promise<BulkSendResult> {
  // Get store name for variables
  const [store] = await db
    .select({ name: stores.name })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);

  const result = await sendBulkWhatsAppMessages(
    storeId,
    phones,
    message,
    {
      templateId: options?.templateId,
      variables: {
        storeName: store?.name || 'החנות',
      },
      mediaType: options?.mediaType,
      mediaUrl: options?.mediaUrl,
      delayMs: 1500, // 1.5 seconds between messages
    }
  );

  return result;
}

/**
 * קבלת סטטיסטיקות
 * ⚠️ מציג רק אנשי קשר שאישרו דיוור (בהתאם לחוק הספאם)
 */
export async function getWhatsAppStats(storeId: string): Promise<{
  totalCustomersWithPhone: number;
  totalContactsWithPhone: number;
  newsletterCount: number;
  clubMemberCount: number;
}> {
  // רק לקוחות שאישרו דיוור!
  const [customersWithPhone] = await db
    .select({ count: count() })
    .from(customers)
    .where(and(
      eq(customers.storeId, storeId),
      gt(customers.totalOrders, 0),
      eq(customers.acceptsMarketing, true) // ⚠️ רק מי שאישר
    ));

  const [contactsWithPhone] = await db
    .select({ count: count() })
    .from(contacts)
    .where(eq(contacts.storeId, storeId));

  const [newsletterContacts] = await db
    .select({ count: count() })
    .from(contacts)
    .where(and(
      eq(contacts.storeId, storeId),
      eq(contacts.type, 'newsletter')
    ));

  const [clubMembers] = await db
    .select({ count: count() })
    .from(contacts)
    .where(and(
      eq(contacts.storeId, storeId),
      eq(contacts.type, 'club_member')
    ));

  return {
    totalCustomersWithPhone: customersWithPhone.count,
    totalContactsWithPhone: contactsWithPhone.count,
    newsletterCount: newsletterContacts.count,
    clubMemberCount: clubMembers.count,
  };
}

