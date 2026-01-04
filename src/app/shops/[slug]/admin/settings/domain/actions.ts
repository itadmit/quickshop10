'use server';

import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Vercel API configuration
const VERCEL_API_URL = 'https://api.vercel.com';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // Optional, for team accounts

// ============ VERCEL API HELPERS ============

async function addDomainToVercel(domain: string): Promise<{ success: boolean; error?: string }> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    console.warn('Vercel API not configured - skipping automatic domain addition');
    return { success: true }; // Continue without Vercel API
  }

  try {
    const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';
    
    const response = await fetch(
      `${VERCEL_API_URL}/v10/projects/${VERCEL_PROJECT_ID}/domains${teamParam}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: domain }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Domain might already exist - that's fine
      if (data.error?.code === 'domain_already_in_use') {
        return { success: true };
      }
      console.error('Vercel API error:', data);
      return { success: false, error: data.error?.message || 'שגיאה בהוספת הדומיין ל-Vercel' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding domain to Vercel:', error);
    return { success: false, error: 'שגיאה בהתחברות ל-Vercel API' };
  }
}

async function removeDomainFromVercel(domain: string): Promise<{ success: boolean; error?: string }> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return { success: true }; // Continue without Vercel API
  }

  try {
    const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';
    
    const response = await fetch(
      `${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}${teamParam}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const data = await response.json();
      console.error('Vercel API error:', data);
      return { success: false, error: data.error?.message || 'שגיאה בהסרת הדומיין מ-Vercel' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing domain from Vercel:', error);
    return { success: false, error: 'שגיאה בהתחברות ל-Vercel API' };
  }
}

async function getDomainConfigFromVercel(domain: string): Promise<{
  configured: boolean;
  verified: boolean;
  verification?: { type: string; domain: string; value: string }[];
  error?: string;
}> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return { configured: false, verified: false };
  }

  try {
    const teamParam = VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : '';
    
    // Check domain configuration
    const configResponse = await fetch(
      `${VERCEL_API_URL}/v6/domains/${domain}/config?teamId=${VERCEL_TEAM_ID || ''}`,
      {
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
        },
      }
    );

    if (!configResponse.ok) {
      return { configured: false, verified: false };
    }

    const configData = await configResponse.json();
    
    return {
      configured: configData.configured || false,
      verified: configData.verified || false,
      verification: configData.verification,
    };
  } catch (error) {
    console.error('Error checking domain config:', error);
    return { configured: false, verified: false, error: 'שגיאה בבדיקת הדומיין' };
  }
}

// ============ MAIN ACTIONS ============

export async function updateCustomDomain(storeId: string, domain: string) {
  try {
    // Check if domain is already in use by another store
    const existing = await db
      .select({ id: stores.id, customDomain: stores.customDomain })
      .from(stores)
      .where(eq(stores.customDomain, domain))
      .limit(1);

    if (existing.length > 0 && existing[0].id !== storeId) {
      return { error: 'דומיין זה כבר בשימוש על ידי חנות אחרת' };
    }

    // Get the current domain to remove it from Vercel
    const [currentStore] = await db
      .select({ customDomain: stores.customDomain })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    // Remove old domain from Vercel if exists
    if (currentStore?.customDomain && currentStore.customDomain !== domain) {
      await removeDomainFromVercel(currentStore.customDomain);
    }

    // Add new domain to Vercel
    const vercelResult = await addDomainToVercel(domain);
    if (!vercelResult.success) {
      return { error: vercelResult.error };
    }

    // Save to database
    await db
      .update(stores)
      .set({ 
        customDomain: domain,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, storeId));

    revalidatePath('/shops/[slug]/admin/settings/domain', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating custom domain:', error);
    return { error: 'אירעה שגיאה בעדכון הדומיין' };
  }
}

export async function removeDomain(storeId: string) {
  try {
    // Get the current domain
    const [store] = await db
      .select({ customDomain: stores.customDomain })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (store?.customDomain) {
      // Remove from Vercel
      await removeDomainFromVercel(store.customDomain);
    }

    // Remove from database
    await db
      .update(stores)
      .set({ 
        customDomain: null,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, storeId));

    revalidatePath('/shops/[slug]/admin/settings/domain', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error removing domain:', error);
    return { error: 'אירעה שגיאה בהסרת הדומיין' };
  }
}

export async function verifyDomain(domain: string) {
  try {
    // First check Vercel's domain config
    const vercelConfig = await getDomainConfigFromVercel(domain);
    
    if (vercelConfig.configured && vercelConfig.verified) {
      return { verified: true };
    }

    // If not configured in Vercel, do a simple DNS check
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      await fetch(`https://${domain}`, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return { verified: true };
    } catch {
      clearTimeout(timeoutId);
      
      // Return Vercel verification info if available
      if (vercelConfig.verification && vercelConfig.verification.length > 0) {
        return { 
          verified: false, 
          error: 'הדומיין עדיין לא מוגדר נכון. ודא שהגדרות ה-DNS נכונות.',
          verification: vercelConfig.verification,
        };
      }

      return { 
        verified: false, 
        error: 'לא ניתן להגיע לדומיין. ודא שהגדרות ה-DNS נכונות.' 
      };
    }
  } catch (error) {
    return { verified: false, error: 'שגיאה בבדיקת הדומיין' };
  }
}

