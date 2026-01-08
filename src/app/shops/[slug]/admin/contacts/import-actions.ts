'use server';

/**
 * Contact Import Actions - Optimized for Speed
 * ייבוא אנשי קשר מקובץ CSV
 * 
 * ⚡ אופטימיזציה למהירות (REQUIREMENTS.md):
 * - Batch queries לבדיקת כפולים
 * - Batch inserts במקום הכנסות בודדות
 * - מינימום round-trips ל-DB
 */

import { db } from '@/lib/db';
import { contacts } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// תוצאת ייבוא
export interface ContactImportResult {
  success: boolean;
  imported: number;
  failed: number;
  skipped: number; // דילוג על כפולים
  errors: string[];
  totalInFile?: number;
  isTestMode?: boolean;
}

// מיפוי עמודות
export interface ContactColumnMapping {
  email: number;      // חובה - אינדקס העמודה
  firstName: number;
  lastName: number;
  phone: number;
  birthday: number;
}

/**
 * Full CSV Parser
 */
function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  // Remove BOM if present
  const text = csvText.replace(/^\uFEFF/, '');
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        currentRow.push(currentField);
        if (currentRow.length > 0 && currentRow.some(f => f.trim())) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentField += char;
      }
    }
  }
  
  currentRow.push(currentField);
  if (currentRow.length > 0 && currentRow.some(f => f.trim())) {
    rows.push(currentRow);
  }
  
  return rows;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Parse date string to ISO format
 */
function parseDate(dateStr: string): string | null {
  if (!dateStr || !dateStr.trim()) return null;
  
  const cleaned = dateStr.trim();
  
  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // YYYY-MM-DD (ISO format)
  const iso = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return cleaned;
  }
  
  // DD.MM.YYYY
  const dotFormat = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotFormat) {
    const [, day, month, year] = dotFormat;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return null;
}

// Parsed contact data for batch operations
interface ParsedContact {
  rowNum: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  birthday: string | null;
}

/**
 * Import contacts from CSV with column mapping
 * ⚡ אופטימיזציה: Batch operations
 */
export async function importContactsFromCSV(
  storeId: string,
  storeSlug: string,
  csvText: string,
  mapping: ContactColumnMapping,
  contactType: 'newsletter' | 'club_member' | 'contact_form' | 'popup_form',
  limit?: number
): Promise<ContactImportResult> {
  const errors: string[] = [];
  let imported = 0;
  let failed = 0;
  let skipped = 0;

  try {
    // Parse CSV
    const allRows = parseCSV(csvText);
    
    if (allRows.length < 2) {
      return {
        success: false,
        imported: 0,
        failed: 0,
        skipped: 0,
        errors: ['הקובץ ריק או לא בפורמט נכון'],
      };
    }

    // First row is header, rest is data
    const totalInFile = allRows.length - 1;
    const dataRows = limit && limit > 0 
      ? allRows.slice(1, limit + 1) 
      : allRows.slice(1);

    console.log('[Contact Import] Starting:', {
      totalInFile,
      processingRows: dataRows.length,
      contactType,
    });

    // STEP 1: Parse all rows and validate
    const validContacts: ParsedContact[] = [];
    const allEmails: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2; // +2 because 1-indexed and skip header

      const getValue = (colIndex: number): string => {
        if (colIndex < 0 || colIndex >= row.length) return '';
        return row[colIndex]?.trim() || '';
      };

      // Get email (required)
      const email = getValue(mapping.email).toLowerCase();
      
      if (!email) {
        errors.push(`שורה ${rowNum}: חסר אימייל`);
        failed++;
        continue;
      }

      if (!isValidEmail(email)) {
        errors.push(`שורה ${rowNum}: אימייל לא תקין - ${email}`);
        failed++;
        continue;
      }

      // Check for duplicate emails in the same file
      if (allEmails.includes(email)) {
        skipped++;
        continue;
      }
      allEmails.push(email);

      // Get other fields
      const firstName = getValue(mapping.firstName) || null;
      const lastName = getValue(mapping.lastName) || null;
      const phone = getValue(mapping.phone) || null;
      const birthdayStr = getValue(mapping.birthday);
      const birthday = parseDate(birthdayStr);

      validContacts.push({
        rowNum,
        email,
        firstName,
        lastName,
        phone,
        birthday,
      });
    }

    // STEP 2: Batch check for existing contacts (single query!)
    if (validContacts.length === 0) {
      return {
        success: true,
        imported: 0,
        failed,
        skipped,
        errors,
        totalInFile,
        isTestMode: limit !== undefined && limit > 0,
      };
    }

    const emailsToCheck = validContacts.map(c => c.email);
    
    // Single query to get all existing emails
    const existingContacts = await db
      .select({ email: contacts.email })
      .from(contacts)
      .where(
        and(
          eq(contacts.storeId, storeId),
          eq(contacts.type, contactType),
          inArray(contacts.email, emailsToCheck)
        )
      );

    const existingEmailSet = new Set(existingContacts.map(c => c.email));
    
    // Filter out existing contacts
    const newContacts = validContacts.filter(c => {
      if (existingEmailSet.has(c.email)) {
        skipped++;
        return false;
      }
      return true;
    });

    console.log('[Contact Import] After duplicate check:', {
      valid: validContacts.length,
      existing: existingEmailSet.size,
      toInsert: newContacts.length,
    });

    // STEP 3: Batch insert all new contacts
    if (newContacts.length > 0) {
      const BATCH_SIZE = 100; // Insert in batches of 100 for better performance
      
      for (let i = 0; i < newContacts.length; i += BATCH_SIZE) {
        const batch = newContacts.slice(i, i + BATCH_SIZE);
        
        try {
          const insertValues = batch.map(contact => ({
            storeId,
            email: contact.email,
            firstName: contact.firstName,
            lastName: contact.lastName,
            phone: contact.phone,
            type: contactType,
            status: 'active' as const,
            source: 'csv_import',
            metadata: contact.birthday ? { birthday: contact.birthday } : {},
          }));

          await db.insert(contacts).values(insertValues);
          imported += batch.length;
          
        } catch (error) {
          console.error(`[Contact Import] Batch error:`, error);
          // On batch error, try individual inserts as fallback
          for (const contact of batch) {
            try {
              await db.insert(contacts).values({
                storeId,
                email: contact.email,
                firstName: contact.firstName,
                lastName: contact.lastName,
                phone: contact.phone,
                type: contactType,
                status: 'active',
                source: 'csv_import',
                metadata: contact.birthday ? { birthday: contact.birthday } : {},
              });
              imported++;
            } catch (individualError) {
              errors.push(`שורה ${contact.rowNum}: שגיאה בשמירה`);
              failed++;
            }
          }
        }
      }
    }

    // Revalidate path
    revalidatePath(`/shops/${storeSlug}/admin/contacts`);

    console.log('[Contact Import] Complete:', { imported, failed, skipped });

    return {
      success: true,
      imported,
      failed,
      skipped,
      errors,
      totalInFile,
      isTestMode: limit !== undefined && limit > 0,
    };

  } catch (error) {
    console.error('[Contact Import] Error:', error);
    return {
      success: false,
      imported,
      failed,
      skipped,
      errors: [error instanceof Error ? error.message : 'שגיאה בייבוא'],
    };
  }
}

