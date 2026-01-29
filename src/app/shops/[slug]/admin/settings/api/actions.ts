'use server';

import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { generateApiKey, API_SCOPES } from '@/lib/api-auth';
import { auth } from '@/lib/auth';

// ============================================
// API Keys Server Actions
// ============================================

export interface CreateApiKeyData {
  name: string;
  description?: string;
  scopes: string[];
  rateLimit?: number;
  expiresAt?: string | null;
}

/**
 * יצירת API Key חדש
 * מחזיר את המפתח המלא - יש להציג אותו פעם אחת בלבד!
 */
export async function createApiKey(
  storeId: string,
  slug: string,
  data: CreateApiKeyData
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'יש להתחבר תחילה' };
    }

    // Validate name
    if (!data.name || data.name.trim().length < 2) {
      return { success: false, error: 'נא להזין שם למפתח' };
    }

    // Validate scopes
    const validScopes = Object.keys(API_SCOPES);
    const invalidScopes = data.scopes.filter(s => !validScopes.includes(s));
    if (invalidScopes.length > 0) {
      return { success: false, error: 'הרשאות לא תקינות: ' + invalidScopes.join(', ') };
    }

    // Generate the key
    const { fullKey, keyPrefix, keyHash, lastFour } = generateApiKey(true);

    // Parse expiration date
    let expiresAt: Date | null = null;
    if (data.expiresAt) {
      expiresAt = new Date(data.expiresAt);
      if (isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
        return { success: false, error: 'תאריך תפוגה לא תקין' };
      }
    }

    // Insert to database
    await db.insert(apiKeys).values({
      storeId,
      userId: session.user.id,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      keyPrefix,
      keyHash,
      lastFour,
      scopes: data.scopes,
      rateLimit: data.rateLimit || 100,
      expiresAt,
      isActive: true,
    });

    revalidatePath(`/shops/\${slug}/admin/settings/api`);
    
    // Return the full key - show only ONCE!
    return { 
      success: true, 
      apiKey: fullKey,
      message: 'המפתח נוצר בהצלחה. שמור אותו עכשיו - לא ניתן לשחזר אותו!'
    };
  } catch (error) {
    console.error('Error creating API key:', error);
    return { success: false, error: 'שגיאה ביצירת המפתח' };
  }
}

/**
 * הפעלה/השבתה של מפתח
 */
export async function toggleApiKey(
  apiKeyId: string,
  slug: string,
  isActive: boolean
) {
  try {
    await db
      .update(apiKeys)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(apiKeys.id, apiKeyId));

    revalidatePath(`/shops/\${slug}/admin/settings/api`);
    return { success: true };
  } catch (error) {
    console.error('Error toggling API key:', error);
    return { success: false, error: 'שגיאה בעדכון המפתח' };
  }
}

/**
 * מחיקת מפתח
 */
export async function deleteApiKey(apiKeyId: string, slug: string) {
  try {
    await db.delete(apiKeys).where(eq(apiKeys.id, apiKeyId));
    revalidatePath(`/shops/\${slug}/admin/settings/api`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting API key:', error);
    return { success: false, error: 'שגיאה במחיקת המפתח' };
  }
}
