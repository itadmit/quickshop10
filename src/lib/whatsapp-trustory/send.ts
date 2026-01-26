/**
 * WhatsApp Send Functions
 * 
 * פונקציות שליחה ברמה גבוהה - משמשות את האוטומציות ודף הדיוור
 */

import { db } from '@/lib/db';
import { storePlugins } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { TrustoryClient, createTrustoryClient, TrustoryResponse } from './client';
import { replaceTemplateVariables, getTemplateById, TemplateVariables } from './templates';

export interface SendWhatsAppParams {
  storeId: string;
  phone: string;
  message: string;
  templateId?: string;
  variables?: TemplateVariables;
  mediaType?: 'text' | 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
}

export interface BulkSendResult {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{ phone: string; error: string }>;
}

/**
 * קבלת הקליינט של טרו סטורי לחנות
 */
async function getTrustoryClientForStore(storeId: string): Promise<TrustoryClient | null> {
  const [plugin] = await db
    .select({ config: storePlugins.config })
    .from(storePlugins)
    .where(
      and(
        eq(storePlugins.storeId, storeId),
        eq(storePlugins.pluginSlug, 'whatsapp-trustory'),
        eq(storePlugins.isActive, true)
      )
    )
    .limit(1);

  if (!plugin) {
    console.log('[WhatsApp] Plugin not installed or inactive for store:', storeId);
    return null;
  }

  const config = plugin.config as { token?: string; instanceId?: string };
  
  if (!config.token || !config.instanceId) {
    console.log('[WhatsApp] Plugin not configured for store:', storeId);
    return null;
  }

  return createTrustoryClient({
    token: config.token,
    instanceId: config.instanceId,
  });
}

/**
 * שליחת הודעת WhatsApp
 * 
 * משמש את:
 * - מערכת האוטומציות (send_whatsapp action)
 * - דף הדיוור (broadcast)
 * - שליחה ידנית
 */
export async function sendWhatsAppMessage(
  params: SendWhatsAppParams
): Promise<TrustoryResponse> {
  const { storeId, phone, message, templateId, variables, mediaType = 'text', mediaUrl } = params;

  // קבלת הקליינט
  const client = await getTrustoryClientForStore(storeId);
  
  if (!client) {
    return {
      success: false,
      message: 'תוסף WhatsApp לא מוגדר או לא פעיל',
    };
  }

  // הכנת ההודעה
  let finalMessage = message;
  
  // אם יש תבנית - השתמש בה
  if (templateId) {
    const template = getTemplateById(templateId);
    if (template && template.content) {
      finalMessage = replaceTemplateVariables(template.content, variables || {});
    }
  } else if (variables) {
    // אם אין תבנית אבל יש משתנים - החלף בהודעה
    finalMessage = replaceTemplateVariables(message, variables);
  }

  // שליחה לפי סוג המדיה
  try {
    switch (mediaType) {
      case 'image':
        if (!mediaUrl) {
          return { success: false, message: 'חסר URL לתמונה' };
        }
        return client.sendImage({ phone, imageUrl: mediaUrl, caption: finalMessage });

      case 'video':
        if (!mediaUrl) {
          return { success: false, message: 'חסר URL לוידאו' };
        }
        return client.sendVideo({ phone, videoUrl: mediaUrl, caption: finalMessage });

      case 'audio':
        if (!mediaUrl) {
          return { success: false, message: 'חסר URL לאודיו' };
        }
        return client.sendAudio({ phone, audioUrl: mediaUrl });

      case 'document':
        if (!mediaUrl) {
          return { success: false, message: 'חסר URL למסמך' };
        }
        return client.sendDocument({ phone, documentUrl: mediaUrl, caption: finalMessage });

      case 'text':
      default:
        return client.sendText({ phone, message: finalMessage });
    }
  } catch (error) {
    console.error('[WhatsApp] Send error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'שגיאה בשליחה',
    };
  }
}

/**
 * שליחת הודעות המוניות
 * 
 * שולח הודעה לרשימת מספרים עם השהייה בין הודעות
 */
export async function sendBulkWhatsAppMessages(
  storeId: string,
  phones: string[],
  message: string,
  options?: {
    templateId?: string;
    variables?: TemplateVariables;
    mediaType?: 'text' | 'image' | 'video' | 'document';
    mediaUrl?: string;
    delayMs?: number; // השהייה בין הודעות (ברירת מחדל: 1000ms)
  }
): Promise<BulkSendResult> {
  const result: BulkSendResult = {
    total: phones.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  const delayMs = options?.delayMs || 1000; // השהייה של שנייה בין הודעות

  for (const phone of phones) {
    try {
      const response = await sendWhatsAppMessage({
        storeId,
        phone,
        message,
        templateId: options?.templateId,
        variables: options?.variables,
        mediaType: options?.mediaType,
        mediaUrl: options?.mediaUrl,
      });

      if (response.success) {
        result.sent++;
      } else {
        result.failed++;
        result.errors.push({ phone, error: response.message });
      }
    } catch (error) {
      result.failed++;
      result.errors.push({ 
        phone, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    // השהייה בין הודעות למניעת חסימה
    if (phones.indexOf(phone) < phones.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`[WhatsApp] Bulk send completed: ${result.sent}/${result.total} sent`);
  return result;
}

/**
 * בדיקת האם התוסף מוגדר ופעיל
 */
export async function isWhatsAppEnabled(storeId: string): Promise<boolean> {
  const client = await getTrustoryClientForStore(storeId);
  return client !== null;
}

