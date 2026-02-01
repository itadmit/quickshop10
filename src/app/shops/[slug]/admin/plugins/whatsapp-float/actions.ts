'use server';

/**
 * WhatsApp Float Plugin Server Actions
 */

import { updatePluginConfig } from '@/lib/plugins/loader';
import { revalidatePath } from 'next/cache';

interface WhatsAppFloatConfig {
  enabled: boolean;
  phoneNumber: string;
  buttonColor: string;
  position: 'left' | 'right';
  showBubble: boolean;
  bubbleText: string;
  bubbleDelaySeconds: number;
  defaultMessage: string;
  showOnMobile: boolean;
  showOnDesktop: boolean;
  showPulse: boolean;
  bottomOffset: number;
  sideOffset: number;
}

export async function updateWhatsAppFloatConfig(
  storeId: string,
  config: WhatsAppFloatConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate phone number format
    const cleanPhone = config.phoneNumber.replace(/[^0-9]/g, '');
    
    if (config.enabled && !cleanPhone) {
      return { success: false, error: 'יש להזין מספר וואטסאפ' };
    }

    // Clean and validate the config
    const cleanConfig: WhatsAppFloatConfig = {
      enabled: Boolean(config.enabled),
      phoneNumber: cleanPhone,
      buttonColor: config.buttonColor || '#25D366',
      position: config.position === 'right' ? 'right' : 'left',
      showBubble: Boolean(config.showBubble),
      bubbleText: String(config.bubbleText || '').trim(),
      bubbleDelaySeconds: Math.max(0, Math.min(60, Number(config.bubbleDelaySeconds) || 3)),
      defaultMessage: String(config.defaultMessage || '').trim(),
      showOnMobile: Boolean(config.showOnMobile),
      showOnDesktop: Boolean(config.showOnDesktop),
      showPulse: Boolean(config.showPulse),
      bottomOffset: Math.max(0, Math.min(200, Number(config.bottomOffset) || 20)),
      sideOffset: Math.max(0, Math.min(200, Number(config.sideOffset) || 20)),
    };

    const result = await updatePluginConfig(storeId, 'whatsapp-float', cleanConfig as unknown as Record<string, unknown>);
    
    if (result.success) {
      // Revalidate the storefront
      revalidatePath(`/shops/[slug]`, 'layout');
    }

    return result;
  } catch (error) {
    console.error('Error updating WhatsApp float config:', error);
    return { success: false, error: 'שגיאה בשמירת ההגדרות' };
  }
}
