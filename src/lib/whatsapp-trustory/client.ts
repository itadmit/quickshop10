/**
 * True Story WhatsApp API Client
 * 
 * API Documentation: https://true-story.net/api/docs
 * All requests are GET with query parameters
 */

const BASE_URL = 'https://true-story.net/api/v1';

export interface TrustoryConfig {
  token: string;
  instanceId: string;
}

export interface TrustoryResponse {
  success: boolean;
  message: string;
  response?: string;
}

export interface SendTextParams {
  phone: string;
  message: string;
}

export interface SendImageParams {
  phone: string;
  imageUrl: string;
  caption?: string;
}

export interface SendVideoParams {
  phone: string;
  videoUrl: string;
  caption?: string;
}

export interface SendAudioParams {
  phone: string;
  audioUrl: string;
}

export interface SendDocumentParams {
  phone: string;
  documentUrl: string;
  caption?: string;
}

/**
 * המרת מספר טלפון ישראלי ל-JID של WhatsApp
 * 
 * Examples:
 * - 0501234567 → 972501234567@s.whatsapp.net
 * - 972501234567 → 972501234567@s.whatsapp.net
 * - +972-50-123-4567 → 972501234567@s.whatsapp.net
 */
export function phoneToJid(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Israeli numbers starting with 0
  if (cleaned.startsWith('0')) {
    cleaned = '972' + cleaned.substring(1);
  }
  
  // Handle numbers that might start with 972 already
  if (!cleaned.startsWith('972') && cleaned.length === 9) {
    // Assume Israeli number without prefix (e.g., 501234567)
    cleaned = '972' + cleaned;
  }
  
  return `${cleaned}@s.whatsapp.net`;
}

/**
 * True Story API Client
 */
export class TrustoryClient {
  private token: string;
  private instanceId: string;

  constructor(config: TrustoryConfig) {
    this.token = config.token;
    this.instanceId = config.instanceId;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params: Record<string, string>): string {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.set('token', this.token);
    url.searchParams.set('instance_id', this.instanceId);
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      }
    }
    
    return url.toString();
  }

  /**
   * Make API request
   */
  private async request(endpoint: string, params: Record<string, string>): Promise<TrustoryResponse> {
    const url = this.buildUrl(endpoint, params);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const data = await response.json();
      return data as TrustoryResponse;
    } catch (error) {
      console.error('[Trustory] API Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * שליחת הודעת טקסט
   */
  async sendText({ phone, message }: SendTextParams): Promise<TrustoryResponse> {
    const jid = phoneToJid(phone);
    return this.request('/send-text', {
      jid,
      msg: message,
    });
  }

  /**
   * שליחת תמונה
   */
  async sendImage({ phone, imageUrl, caption }: SendImageParams): Promise<TrustoryResponse> {
    const jid = phoneToJid(phone);
    return this.request('/send-image', {
      jid,
      imageurl: imageUrl,
      caption: caption || '',
    });
  }

  /**
   * שליחת וידאו
   */
  async sendVideo({ phone, videoUrl, caption }: SendVideoParams): Promise<TrustoryResponse> {
    const jid = phoneToJid(phone);
    return this.request('/send-video', {
      jid,
      videourl: videoUrl,
      caption: caption || '',
    });
  }

  /**
   * שליחת אודיו
   */
  async sendAudio({ phone, audioUrl }: SendAudioParams): Promise<TrustoryResponse> {
    const jid = phoneToJid(phone);
    return this.request('/send-audio', {
      jid,
      audiourl: audioUrl,
    });
  }

  /**
   * שליחת מסמך
   */
  async sendDocument({ phone, documentUrl, caption }: SendDocumentParams): Promise<TrustoryResponse> {
    const jid = phoneToJid(phone);
    return this.request('/send-doc', {
      jid,
      docurl: documentUrl,
      caption: caption || '',
    });
  }

  /**
   * בדיקת חיבור - שולח הודעת בדיקה למספר נתון
   */
  async testConnection(testPhone: string): Promise<TrustoryResponse> {
    return this.sendText({
      phone: testPhone,
      message: '✅ חיבור WhatsApp פעיל! הודעה זו נשלחה מ-QuickShop.',
    });
  }
}

/**
 * יצירת instance של הקליינט מהגדרות התוסף
 */
export function createTrustoryClient(config: TrustoryConfig): TrustoryClient | null {
  if (!config.token || !config.instanceId) {
    return null;
  }
  return new TrustoryClient(config);
}

