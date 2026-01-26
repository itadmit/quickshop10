/**
 * WhatsApp Trustory Plugin
 * 
 * שליחת הודעות WhatsApp דרך True Story API
 */

export { 
  TrustoryClient, 
  createTrustoryClient, 
  phoneToJid,
  type TrustoryConfig,
  type TrustoryResponse,
  type SendTextParams,
  type SendImageParams,
  type SendVideoParams,
  type SendAudioParams,
  type SendDocumentParams,
} from './client';

export {
  MessageTemplates,
  type MessageTemplate,
  type TemplateVariables,
  replaceTemplateVariables,
} from './templates';

export {
  sendWhatsAppMessage,
  sendBulkWhatsAppMessages,
  type BulkSendResult,
} from './send';

