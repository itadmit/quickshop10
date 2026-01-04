'use server';

import { db } from '@/lib/db';
import { contacts, stores } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface ContactFormData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  type: 'newsletter' | 'club_member' | 'contact_form' | 'popup_form';
  metadata?: Record<string, unknown>;
  source?: string;
  sourceUrl?: string;
}

export async function createContact(storeId: string, data: ContactFormData, requestInfo?: {
  ipAddress?: string;
  userAgent?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}) {
  try {
    // Check if contact already exists with same email and type
    const existing = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.storeId, storeId),
        eq(contacts.email, data.email),
        eq(contacts.type, data.type)
      ),
    });

    if (existing) {
      // Update existing contact
      await db.update(contacts)
        .set({
          firstName: data.firstName || existing.firstName,
          lastName: data.lastName || existing.lastName,
          phone: data.phone || existing.phone,
          metadata: { ...(existing.metadata as Record<string, unknown>), ...data.metadata },
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, existing.id));
      
      return { success: true, contact: existing, updated: true };
    }

    // Create new contact
    const [contact] = await db.insert(contacts).values({
      storeId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      type: data.type,
      metadata: data.metadata || {},
      source: data.source,
      sourceUrl: data.sourceUrl,
      ipAddress: requestInfo?.ipAddress,
      userAgent: requestInfo?.userAgent,
      utmSource: requestInfo?.utmSource,
      utmMedium: requestInfo?.utmMedium,
      utmCampaign: requestInfo?.utmCampaign,
    }).returning();

    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
      columns: { slug: true },
    });

    if (store) {
      revalidatePath(`/shops/${store.slug}/admin/contacts`);
    }

    return { success: true, contact };
  } catch (error) {
    console.error('Failed to create contact:', error);
    return { success: false, error: 'Failed to create contact' };
  }
}

export async function markContactAsRead(contactId: string, storeId: string) {
  try {
    await db.update(contacts)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(contacts.id, contactId), eq(contacts.storeId, storeId)));

    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
      columns: { slug: true },
    });

    if (store) {
      revalidatePath(`/shops/${store.slug}/admin/contacts`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to mark contact as read:', error);
    return { success: false, error: 'Failed to update contact' };
  }
}

export async function markAllAsRead(storeId: string, type?: 'newsletter' | 'club_member' | 'contact_form' | 'popup_form') {
  try {
    const conditions = [eq(contacts.storeId, storeId), eq(contacts.isRead, false)];
    if (type) {
      conditions.push(eq(contacts.type, type));
    }

    await db.update(contacts)
      .set({ isRead: true, readAt: new Date() })
      .where(and(...conditions));

    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
      columns: { slug: true },
    });

    if (store) {
      revalidatePath(`/shops/${store.slug}/admin/contacts`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    return { success: false, error: 'Failed to update contacts' };
  }
}

export async function updateContactStatus(
  contactId: string, 
  storeId: string, 
  status: 'active' | 'unsubscribed' | 'spam'
) {
  try {
    await db.update(contacts)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(contacts.id, contactId), eq(contacts.storeId, storeId)));

    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
      columns: { slug: true },
    });

    if (store) {
      revalidatePath(`/shops/${store.slug}/admin/contacts`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to update contact status:', error);
    return { success: false, error: 'Failed to update contact' };
  }
}

export async function deleteContact(contactId: string, storeId: string) {
  try {
    await db.delete(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.storeId, storeId)));

    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
      columns: { slug: true },
    });

    if (store) {
      revalidatePath(`/shops/${store.slug}/admin/contacts`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to delete contact:', error);
    return { success: false, error: 'Failed to delete contact' };
  }
}

export async function exportContacts(storeId: string, type?: 'newsletter' | 'club_member' | 'contact_form' | 'popup_form') {
  try {
    const conditions = [eq(contacts.storeId, storeId)];
    if (type) {
      conditions.push(eq(contacts.type, type));
    }

    const data = await db.query.contacts.findMany({
      where: and(...conditions),
      orderBy: desc(contacts.createdAt),
    });

    return { success: true, data };
  } catch (error) {
    console.error('Failed to export contacts:', error);
    return { success: false, error: 'Failed to export contacts' };
  }
}

