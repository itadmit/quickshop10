'use server';

import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface CustomerData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptsMarketing?: boolean;
  tags?: string[];
  note?: string;
}

export async function createCustomer(storeId: string, data: CustomerData) {
  try {
    // Check if email already exists
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(
        eq(customers.storeId, storeId),
        eq(customers.email, data.email.toLowerCase())
      ))
      .limit(1);
    
    if (existing.length > 0) {
      return { success: false, error: 'לקוח עם אימייל זה כבר קיים' };
    }

    // Combine tags and note into notes field
    const tagsNote = data.tags && data.tags.length > 0 ? `תגיות: ${data.tags.join(', ')}` : '';
    const combinedNotes = [data.note, tagsNote].filter(Boolean).join('\n');

    await db.insert(customers).values({
      storeId,
      email: data.email.toLowerCase(),
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      acceptsMarketing: data.acceptsMarketing || false,
      notes: combinedNotes || null,
    });

    revalidatePath(`/shops/[slug]/admin/customers`);
    return { success: true };
  } catch (error) {
    console.error('Error creating customer:', error);
    return { success: false, error: 'שגיאה ביצירת לקוח' };
  }
}

export async function updateCustomer(customerId: string, data: Partial<CustomerData>) {
  try {
    // Build notes if tags provided
    const tagsNote = data.tags && data.tags.length > 0 ? `תגיות: ${data.tags.join(', ')}` : '';
    const combinedNotes = data.note || data.tags ? [data.note, tagsNote].filter(Boolean).join('\n') : undefined;
    
    await db
      .update(customers)
      .set({
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.acceptsMarketing !== undefined && { acceptsMarketing: data.acceptsMarketing }),
        ...(combinedNotes !== undefined && { notes: combinedNotes || null }),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));

    revalidatePath(`/shops/[slug]/admin/customers`);
    return { success: true };
  } catch (error) {
    console.error('Error updating customer:', error);
    return { success: false, error: 'שגיאה בעדכון לקוח' };
  }
}

export async function deleteCustomer(customerId: string) {
  try {
    await db.delete(customers).where(eq(customers.id, customerId));
    revalidatePath(`/shops/[slug]/admin/customers`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting customer:', error);
    return { success: false, error: 'שגיאה במחיקת לקוח' };
  }
}

interface CSVRow {
  email?: string;
  first_name?: string;
  firstname?: string;
  last_name?: string;
  lastname?: string;
  phone?: string;
  tags?: string;
}

export async function importCustomersFromCSV(storeId: string, rows: CSVRow[]) {
  try {
    if (!rows || rows.length === 0) {
      return { success: false, error: 'הקובץ ריק' };
    }

    // Get existing emails
    const existingCustomers = await db
      .select({ email: customers.email })
      .from(customers)
      .where(eq(customers.storeId, storeId));
    
    const existingEmails = new Set(existingCustomers.map(c => c.email.toLowerCase()));

    const toInsert: Array<{
      storeId: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      notes: string | null;
      acceptsMarketing: boolean;
    }> = [];
    const errors: string[] = [];
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const email = row.email?.toLowerCase().trim();
      
      if (!email) {
        errors.push(`שורה ${i + 2}: חסר אימייל`);
        continue;
      }
      
      // Simple email validation
      if (!email.includes('@') || !email.includes('.')) {
        errors.push(`שורה ${i + 2}: אימייל לא תקין (${email})`);
        continue;
      }
      
      if (existingEmails.has(email)) {
        skipped++;
        continue;
      }
      
      // Parse tags into notes
      const tagsString = row.tags || '';
      const tags = tagsString.split(',').map(t => t.trim()).filter(Boolean);
      const notes = tags.length > 0 ? `תגיות: ${tags.join(', ')}` : null;
      
      toInsert.push({
        storeId,
        email,
        firstName: row.first_name || row.firstname || null,
        lastName: row.last_name || row.lastname || null,
        phone: row.phone || null,
        notes,
        acceptsMarketing: false,
      });
      
      existingEmails.add(email); // Prevent duplicates within the CSV
    }

    // Batch insert (chunks of 100)
    const chunkSize = 100;
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize);
      if (chunk.length > 0) {
        await db.insert(customers).values(chunk);
      }
    }

    revalidatePath(`/shops/[slug]/admin/customers`);
    
    return {
      success: true,
      imported: toInsert.length,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('Error importing customers:', error);
    return { success: false, error: 'שגיאה בייבוא לקוחות' };
  }
}

export async function addCreditToCustomer(customerId: string, amount: number, reason: string) {
  try {
    const [customer] = await db
      .select({ creditBalance: customers.creditBalance, storeId: customers.storeId })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);
    
    if (!customer) {
      return { success: false, error: 'לקוח לא נמצא' };
    }

    const currentBalance = Number(customer.creditBalance || 0);
    const newBalance = currentBalance + amount;

    await db
      .update(customers)
      .set({
        creditBalance: newBalance.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));

    revalidatePath(`/shops/[slug]/admin/customers`);
    return { success: true, newBalance };
  } catch (error) {
    console.error('Error adding credit:', error);
    return { success: false, error: 'שגיאה בהוספת קרדיט' };
  }
}

