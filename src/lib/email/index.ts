'use server';

import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'no-reply@my-quickshop.com';
const fromName = process.env.SENDGRID_FROM_NAME || 'QuickShop';

/**
 * Get the base app URL - never localhost in production
 * Returns null if not configured, allowing callers to handle gracefully
 */
function getAppUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    console.error('NEXT_PUBLIC_APP_URL is not configured - emails will not contain valid links');
    return null;
  }
  return url;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  senderName?: string; // Custom sender name (e.g., store name)
}

export async function sendEmail({ to, subject, html, text, senderName }: SendEmailOptions) {
  try {
    await sgMail.send({
      to,
      from: {
        email: fromEmail,
        name: senderName || fromName,
      },
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============ EMAIL TEMPLATES ============

export async function sendVerificationEmail(email: string, token: string, name?: string) {
  const baseUrl = getAppUrl();
  if (!baseUrl) {
    console.error('Cannot send verification email - NEXT_PUBLIC_APP_URL not configured');
    return { success: false, error: 'App URL not configured' };
  }
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f7f7f7; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; }
        .logo { font-size: 28px; font-weight: bold; color: #1a1a1a; margin-bottom: 30px; }
        h1 { font-size: 24px; color: #1a1a1a; margin: 0 0 16px; }
        p { color: #666; line-height: 1.6; margin: 0 0 20px; }
        .button { display: inline-block; background: #1a1a1a; color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">Quick Shop</div>
        <h1>שלום ${name || 'לך'}! 👋</h1>
        <p>תודה שנרשמת ל-QuickShop. כדי להפעיל את החשבון שלך, אנא לחץ על הכפתור:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" class="button">אמת את האימייל שלי</a>
        </p>
        <p style="font-size: 14px; color: #999;">
          אם לא נרשמת לשירות, אפשר להתעלם מהמייל הזה.
        </p>
        <div class="footer">
          <p>© QuickShop - פלטפורמת החנויות המובילה</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    subject: 'אמת את האימייל שלך - QuickShop',
    html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, name?: string) {
  const baseUrl = getAppUrl();
  if (!baseUrl) {
    console.error('Cannot send password reset email - NEXT_PUBLIC_APP_URL not configured');
    return { success: false, error: 'App URL not configured' };
  }
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f7f7f7; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; }
        .logo { font-size: 28px; font-weight: bold; color: #1a1a1a; margin-bottom: 30px; }
        h1 { font-size: 24px; color: #1a1a1a; margin: 0 0 16px; }
        p { color: #666; line-height: 1.6; margin: 0 0 20px; }
        .button { display: inline-block; background: #1a1a1a; color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">Quick Shop</div>
        <h1>איפוס סיסמה</h1>
        <p>היי ${name || 'שם'}! קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור כדי ליצור סיסמה חדשה:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" class="button">אפס סיסמה</a>
        </p>
        <p style="font-size: 14px; color: #999;">
          הקישור יפוג תוך שעה. אם לא ביקשת לאפס סיסמה, התעלם מהמייל הזה.
        </p>
        <div class="footer">
          <p>© QuickShop - פלטפורמת החנויות המובילה</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    subject: 'איפוס סיסמה - QuickShop',
    html,
  });
}

// ============ ORDER CONFIRMATION ============

interface OrderItemAddon {
  name: string;
  displayValue: string;
  priceAdjustment: number;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  variantTitle?: string;
  image?: string;
  addons?: OrderItemAddon[];
  addonTotal?: number;
  // Discount info per item
  hasDiscount?: boolean;
  discountedPrice?: number;
  discountedTotal?: number;
  discountPercent?: number;
}

// Type for discount details in email
interface DiscountDetailEmail {
  type: 'coupon' | 'auto' | 'gift_card' | 'credit' | 'member';
  code?: string;
  name: string;
  description?: string;
  amount: number;
}

interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  discountDetails?: DiscountDetailEmail[]; // Detailed breakdown
  creditUsed?: number;
  total: number;
  shippingAddress?: {
    address?: string;
    city?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  storeName: string;
  storeSlug: string;
  paymentInfo?: {
    lastFour?: string;
    brand?: string;
    approvalNum?: string;
  };
  freeShippingReason?: string; // e.g., "משלוח חינם בקנייה מעל ₪249"
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationData) {
  const {
    orderNumber,
    customerName,
    customerEmail,
    items,
    subtotal,
    shippingAmount,
    discountAmount,
    discountDetails = [],
    creditUsed = 0,
    total,
    shippingAddress,
    storeName,
    storeSlug,
    paymentInfo,
    freeShippingReason,
  } = data;

  const baseUrl = getAppUrl();
  if (!baseUrl) {
    console.error('Cannot send order confirmation email - NEXT_PUBLIC_APP_URL not configured');
    return { success: false, error: 'App URL not configured' };
  }

  const storeUrl = `${baseUrl}/shops/${storeSlug}`;
  
  const itemsHtml = items.map(item => {
    // Ensure image URL is absolute
    const imageUrl = item.image 
      ? (item.image.startsWith('http') ? item.image : `${baseUrl}${item.image.startsWith('/') ? '' : '/'}${item.image}`)
      : null;
    
    // Calculate item total including addons
    const addonTotal = item.addonTotal || 0;
    const itemTotal = (item.price + addonTotal) * item.quantity;
    
    // Build addons HTML if present
    const addonsHtml = item.addons && item.addons.length > 0 
      ? `<div style="margin-top: 8px; padding: 8px; background: #f9fafb; border-radius: 6px;">
          ${item.addons.map(addon => `
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
              ${addon.name}: <span style="color: #1a1a1a;">${addon.displayValue}</span>
              ${addon.priceAdjustment > 0 ? `<span style="color: #16a34a;"> (+₪${addon.priceAdjustment.toFixed(2)})</span>` : ''}
            </p>
          `).join('')}
        </div>`
      : '';
    
    // Build price HTML with discount indication
    const priceHtml = item.hasDiscount 
      ? `<p style="margin: 4px 0 0 0; font-size: 14px;">
          <span style="color: #9ca3af; text-decoration: line-through;">₪${item.price.toFixed(2)}</span>
          <span style="color: #16a34a; font-weight: 500; margin-right: 6px;">₪${item.discountedPrice?.toFixed(2)}</span>
          <span style="background: #dcfce7; color: #16a34a; font-size: 11px; padding: 2px 6px; border-radius: 4px;">-${item.discountPercent}%</span>
        </p>`
      : `<p style="margin: 4px 0 0 0; font-size: 14px; color: #1a1a1a;">₪${item.price.toFixed(2)}</p>`;
    
    // Build total HTML with discount indication
    const displayTotal = item.hasDiscount ? item.discountedTotal : itemTotal;
    const totalHtml = item.hasDiscount 
      ? `<div>
          <span style="font-size: 13px; color: #9ca3af; text-decoration: line-through; display: block;">₪${itemTotal.toFixed(2)}</span>
          <span style="font-weight: 600; font-size: 18px; color: #16a34a;">₪${displayTotal?.toFixed(2)}</span>
        </div>`
      : `<span style="font-weight: 600; font-size: 18px; color: #1a1a1a;">₪${itemTotal.toFixed(2)}</span>`;
    
    return `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0;" colspan="2">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <!-- Image on RIGHT (first in RTL) -->
            <td style="width: 80px; vertical-align: top;">
              ${imageUrl ? `
              <img src="${imageUrl}" alt="${item.name.replace(/"/g, '&quot;')}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #f0f0f0;" />
              ` : `
              <div style="width: 80px; height: 80px; background: #f3f4f6; border-radius: 8px;"></div>
              `}
            </td>
            <!-- Text in middle -->
            <td style="padding: 0 16px; vertical-align: top; text-align: right;">
              <p style="margin: 0 0 4px 0; font-weight: 500; color: #1a1a1a; font-size: 16px;">${item.name}</p>
              ${item.variantTitle ? `<p style="margin: 0 0 4px 0; font-size: 14px; color: #666;">${item.variantTitle}</p>` : ''}
              <p style="margin: 0; font-size: 14px; color: #666;">כמות: ${item.quantity}</p>
              ${priceHtml}
              ${addonsHtml}
            </td>
            <!-- Price on LEFT -->
            <td style="width: 100px; vertical-align: top; text-align: left;">
              ${totalHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f9fafb; margin: 0; padding: 20px; direction: rtl; text-align: right;">
      
      <!-- Success Header - Like Thank You Page -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: white; border-bottom: 1px solid #f0f0f0; padding: 48px 24px; text-align: center; border-radius: 16px 16px 0 0;">
            <!-- Green Checkmark Circle - Table based for email compatibility -->
            <table cellpadding="0" cellspacing="0" style="margin: 0 auto 24px;">
              <tr>
                <td style="width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; text-align: center; vertical-align: middle;">
                  <span style="color: #16a34a; font-size: 32px; font-weight: bold; line-height: 64px;">✓</span>
                </td>
              </tr>
            </table>
            <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 300; letter-spacing: 0.5px; color: #1a1a1a;">תודה על הזמנתך!</h1>
            <p style="margin: 0; color: #6b7280; font-size: 16px;">
              הזמנה מספר <strong style="color: #1a1a1a;">${orderNumber}</strong> התקבלה בהצלחה
            </p>
            <p style="margin: 8px 0 0; color: #9ca3af; font-size: 14px;">
              אישור נשלח לכתובת ${customerEmail}
            </p>
          </td>
        </tr>
      </table>
      
      <!-- Order Details Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 16px auto 0;">
        <tr>
          <td style="background: white; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden;">
            
            <!-- Items Section -->
            <div style="padding: 24px; border-bottom: 1px solid #f0f0f0;">
              <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 500; color: #1a1a1a;">
                פריטים בהזמנה
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
              </table>
            </div>
            
            <!-- Payment Info -->
            ${paymentInfo?.lastFour ? `
            <div style="padding: 24px; border-bottom: 1px solid #f0f0f0;">
              <h2 style="margin: 0 0 12px; font-size: 16px; font-weight: 500; color: #1a1a1a;">
                פרטי תשלום
              </h2>
              <p style="margin: 0; color: #4b5563; line-height: 1.6;">
                כרטיס: •••• ${paymentInfo.lastFour}${paymentInfo.brand ? ` (${paymentInfo.brand})` : ''}<br>
                ${paymentInfo.approvalNum ? `אישור: ${paymentInfo.approvalNum}<br>` : ''}
                סה״כ שולם: <strong>₪${total.toFixed(2)}</strong>
              </p>
            </div>
            ` : ''}
            
            <!-- Shipping Address -->
            ${shippingAddress ? `
            <div style="padding: 24px; border-bottom: 1px solid #f0f0f0;">
              <h2 style="margin: 0 0 12px; font-size: 16px; font-weight: 500; color: #1a1a1a;">
                כתובת למשלוח
              </h2>
              <p style="margin: 0; color: #4b5563; line-height: 1.8;">
                ${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}<br>
                ${shippingAddress.address || ''}<br>
                ${shippingAddress.city || ''}
                ${shippingAddress.phone ? `<br>טלפון: ${shippingAddress.phone}` : ''}
              </p>
            </div>
            ` : ''}
            
            <!-- Summary -->
            <div style="padding: 24px; background: #f9fafb;">
              <table width="100%" cellpadding="0" cellspacing="0" style="direction: rtl;">
                <tr>
                  <td style="padding: 12px 0; color: #6b7280; text-align: right; width: 50%;">סכום לפני הנחות</td>
                  <td style="padding: 12px 0; text-align: left; font-weight: 500; color: #1a1a1a; width: 50%;">₪${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6b7280; text-align: right;">משלוח</td>
                  <td style="padding: 12px 0; text-align: left; font-weight: 500; color: ${shippingAmount > 0 ? '#1a1a1a' : '#16a34a'};">
                    ${shippingAmount > 0 ? `₪${shippingAmount.toFixed(2)}` : `✓ חינם${freeShippingReason ? ` (${freeShippingReason})` : ''}`}
                  </td>
                </tr>
                ${discountDetails.length > 0 ? discountDetails.map(d => `
                <tr>
                  <td style="padding: 12px 0; color: ${d.type === 'gift_card' ? '#9333ea' : d.type === 'credit' ? '#2563eb' : '#16a34a'}; text-align: right;">
                    ${d.type === 'coupon' ? `קופון ${d.code}${d.description ? ` (${d.description})` : ''}` :
                      d.type === 'gift_card' ? `גיפט קארד ${d.code}` :
                      d.type === 'auto' ? `הנחה אוטומטית: ${d.name}` :
                      d.type === 'member' ? 'הנחת חברי מועדון' :
                      d.type === 'credit' ? 'קרדיט' : d.name}
                  </td>
                  <td style="padding: 12px 0; text-align: left; font-weight: 500; color: ${d.type === 'gift_card' ? '#9333ea' : d.type === 'credit' ? '#2563eb' : '#16a34a'};">
                    -₪${d.amount.toFixed(2)}
                  </td>
                </tr>
                `).join('') : discountAmount > 0 ? `
                <tr>
                  <td style="padding: 12px 0; color: #16a34a; text-align: right;">הנחה</td>
                  <td style="padding: 12px 0; text-align: left; font-weight: 500; color: #16a34a;">-₪${discountAmount.toFixed(2)}</td>
                </tr>
                ` : ''}
                ${creditUsed > 0 && !discountDetails.some(d => d.type === 'credit') ? `
                <tr>
                  <td style="padding: 12px 0; color: #2563eb; text-align: right;">קרדיט</td>
                  <td style="padding: 12px 0; text-align: left; font-weight: 500; color: #2563eb;">-₪${creditUsed.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td colspan="2" style="padding-top: 16px;">
                    <div style="border-top: 2px solid #e5e7eb; padding-top: 16px;">
                      <table width="100%">
                        <tr>
                          <td style="font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: right;">סה״כ</td>
                          <td style="font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: left;">₪${total.toFixed(2)}</td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
            
          </td>
        </tr>
      </table>
      
      <!-- CTA Button -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 24px auto 0;">
        <tr>
          <td style="text-align: center;">
            <a href="${storeUrl}" style="display: inline-block; background: #1a1a1a; color: white !important; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 500; font-size: 16px;">
              המשך לקנות ב-${storeName}
            </a>
          </td>
        </tr>
      </table>
      
      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 32px auto 0;">
        <tr>
          <td style="text-align: center; padding: 24px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #9ca3af; font-size: 14px;">יש שאלות? צרו קשר בכל עת!</p>
            <p style="margin: 8px 0 0; color: #9ca3af; font-size: 14px;">© ${storeName} - מופעל על ידי QuickShop</p>
          </td>
        </tr>
      </table>
      
    </body>
    </html>
  `;
  
  return sendEmail({
    to: customerEmail,
    subject: `אישור הזמנה #${orderNumber} - ${storeName}`,
    html,
  });
}

// ============ ABANDONED CART RECOVERY EMAIL ============

interface AbandonedCartItem {
  name: string;
  quantity: number;
  price: number;
  variantTitle?: string;
  image?: string;
}

interface AbandonedCartEmailData {
  customerEmail: string;
  customerName?: string;
  items: AbandonedCartItem[];
  subtotal: number;
  recoveryUrl: string;
  storeName: string;
  storeSlug: string;
  senderName?: string; // שם השולח המותאם
}

export async function sendAbandonedCartEmail(data: AbandonedCartEmailData) {
  const {
    customerEmail,
    customerName,
    items,
    subtotal,
    recoveryUrl,
    storeName,
    storeSlug,
    senderName,
  } = data;

  const baseUrl = getAppUrl();
  if (!baseUrl) {
    console.error('Cannot send abandoned cart email - NEXT_PUBLIC_APP_URL not configured');
    return { success: false, error: 'App URL not configured' };
  }

  const storeUrl = `${baseUrl}/shops/${storeSlug}`;
  
  const itemsHtml = items.slice(0, 3).map(item => {
    const imageUrl = item.image 
      ? (item.image.startsWith('http') ? item.image : `${baseUrl}${item.image.startsWith('/') ? '' : '/'}${item.image}`)
      : null;
    
    return `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 60px; vertical-align: top;">
              ${imageUrl ? `
              <img src="${imageUrl}" alt="${item.name.replace(/"/g, '&quot;')}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #f0f0f0;" />
              ` : `
              <div style="width: 60px; height: 60px; background: #f3f4f6; border-radius: 8px;"></div>
              `}
            </td>
            <td style="padding: 0 12px; vertical-align: top; text-align: right;">
              <p style="margin: 0 0 4px 0; font-weight: 500; color: #1a1a1a; font-size: 14px;">${item.name}</p>
              ${item.variantTitle ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${item.variantTitle}</p>` : ''}
              <p style="margin: 0; font-size: 12px; color: #666;">כמות: ${item.quantity}</p>
            </td>
            <td style="width: 80px; vertical-align: top; text-align: left;">
              <span style="font-weight: 600; font-size: 14px; color: #1a1a1a;">₪${(item.price * item.quantity).toFixed(2)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
  }).join('');

  const moreItemsText = items.length > 3 ? `<p style="margin: 12px 0 0; font-size: 14px; color: #666; text-align: center;">+ ${items.length - 3} פריטים נוספים</p>` : '';

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f9fafb; margin: 0; padding: 20px; direction: rtl; text-align: right;">
      
      <!-- Header with Cart Icon -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: white; padding: 48px 24px; text-align: center; border-radius: 16px 16px 0 0;">
            <!-- Orange Shopping Cart Circle -->
            <table cellpadding="0" cellspacing="0" style="margin: 0 auto 24px;">
              <tr>
                <td style="width: 64px; height: 64px; background: #fff7ed; border-radius: 50%; text-align: center; vertical-align: middle;">
                  <span style="color: #ea580c; font-size: 28px; line-height: 64px;">🛒</span>
                </td>
              </tr>
            </table>
            <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 400; color: #1a1a1a;">שכחת משהו?</h1>
            <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.5;">
              היי ${customerName || 'לך'}! שמנו לב שנשארו פריטים בעגלה שלך.<br>
              <span style="color: #ea580c;">הם עדיין מחכים לך!</span>
            </p>
          </td>
        </tr>
      </table>
      
      <!-- Cart Items Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: white; border: 1px solid #e5e7eb; border-top: none;">
            
            <!-- Items Section -->
            <div style="padding: 24px;">
              <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 500; color: #1a1a1a;">
                הפריטים בעגלה שלך
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
              </table>
              ${moreItemsText}
            </div>
            
            <!-- Subtotal -->
            <div style="padding: 20px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 16px; font-weight: 500; color: #1a1a1a; text-align: right;">סה״כ בעגלה</td>
                  <td style="font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: left;">₪${subtotal.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
          </td>
        </tr>
      </table>
      
      <!-- CTA Button -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: white; padding: 32px 24px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
            <a href="${recoveryUrl}" style="display: inline-block; background: #ea580c; color: white !important; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px;">
              השלם את הרכישה
            </a>
            <p style="margin: 16px 0 0; font-size: 14px; color: #9ca3af;">
              או <a href="${storeUrl}" style="color: #1a1a1a; text-decoration: underline;">המשך לגלוש בחנות</a>
            </p>
          </td>
        </tr>
      </table>
      
      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 32px auto 0;">
        <tr>
          <td style="text-align: center; padding: 24px;">
            <p style="margin: 0 0 8px; color: #9ca3af; font-size: 14px;">קיבלת מייל זה כי נשארו פריטים בעגלת הקניות שלך ב-${storeName}.</p>
            <p style="margin: 0; color: #9ca3af; font-size: 14px;">© ${storeName}</p>
          </td>
        </tr>
      </table>
      
    </body>
    </html>
  `;
  
  // Use custom sender name if provided
  const customFrom = senderName 
    ? { email: fromEmail, name: senderName }
    : { email: fromEmail, name: storeName };

  try {
    await sgMail.send({
      to: customerEmail,
      from: customFrom,
      subject: `שכחת משהו? הפריטים שלך עדיין בעגלה 🛒 - ${storeName}`,
      html,
      text: `היי ${customerName || 'לך'}! שמנו לב שנשארו ${items.length} פריטים בעגלה שלך ב-${storeName}. לחץ כאן להשלמת הרכישה: ${recoveryUrl}`,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending abandoned cart email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============ RETURN REQUEST EMAILS ============

interface ReturnRequestEmailData {
  requestNumber: string;
  orderNumber: string;
  customerEmail: string;
  customerName?: string;
  items: Array<{ name: string; quantity: number; price: number; imageUrl?: string }>;
  totalValue: number;
  requestType: 'return' | 'exchange';
  requestedResolution: string;
  storeName: string;
  storeSlug: string;
}

export async function sendReturnRequestReceivedEmail(data: ReturnRequestEmailData) {
  const baseUrl = getAppUrl();
  if (!baseUrl) {
    console.error('Cannot send return request email - NEXT_PUBLIC_APP_URL not configured');
    return { success: false, error: 'App URL not configured' };
  }

  const storeUrl = `${baseUrl}/shops/${data.storeSlug}`;
  const accountUrl = `${storeUrl}/account/returns`;

  const resolutionLabels: Record<string, string> = {
    exchange: 'החלפה למוצר אחר',
    store_credit: 'קרדיט לחנות',
    refund: 'זיכוי כספי',
  };

  const itemsHtml = data.items.map(item => {
    const imageUrl = item.imageUrl 
      ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${baseUrl}${item.imageUrl}`)
      : null;
    
    return `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 60px; vertical-align: top;">
              ${imageUrl ? `<img src="${imageUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />` : ''}
            </td>
            <td style="padding: 0 12px; vertical-align: top; text-align: right;">
              <p style="margin: 0 0 4px 0; font-weight: 500; color: #1a1a1a; font-size: 14px;">${item.name}</p>
              <p style="margin: 0; font-size: 12px; color: #666;">כמות: ${item.quantity}</p>
            </td>
            <td style="width: 80px; vertical-align: top; text-align: left;">
              <span style="font-weight: 600; font-size: 14px; color: #1a1a1a;">₪${(item.price * item.quantity).toFixed(2)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f9fafb; margin: 0; padding: 20px; direction: rtl; text-align: right;">
      
      <!-- Header -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: white; padding: 48px 24px; text-align: center; border-radius: 16px 16px 0 0;">
            <table cellpadding="0" cellspacing="0" style="margin: 0 auto 24px;">
              <tr>
                <td style="width: 64px; height: 64px; background: #fef3c7; border-radius: 50%; text-align: center; vertical-align: middle;">
                  <span style="color: #d97706; font-size: 28px; line-height: 64px;">↩️</span>
                </td>
              </tr>
            </table>
            <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 400; color: #1a1a1a;">בקשתך התקבלה!</h1>
            <p style="margin: 0; color: #6b7280; font-size: 16px;">
              בקשה מספר <strong style="color: #1a1a1a;">${data.requestNumber}</strong>
            </p>
          </td>
        </tr>
      </table>
      
      <!-- Content -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: white; border: 1px solid #e5e7eb; border-top: none;">
            
            <div style="padding: 24px;">
              <p style="margin: 0 0 16px; color: #4b5563; line-height: 1.6;">
                היי ${data.customerName || 'לקוח יקר'},
              </p>
              <p style="margin: 0 0 16px; color: #4b5563; line-height: 1.6;">
                קיבלנו את בקשת ה${data.requestType === 'exchange' ? 'החלפה' : 'החזרה'} שלך מהזמנה <strong>#${data.orderNumber}</strong>.
              </p>
              
              <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <table width="100%">
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">פתרון מבוקש:</td>
                    <td style="text-align: left; font-weight: 500; color: #1a1a1a; font-size: 14px;">${resolutionLabels[data.requestedResolution] || data.requestedResolution}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding-top: 8px;">ערך הפריטים:</td>
                    <td style="text-align: left; font-weight: 500; color: #1a1a1a; font-size: 14px;">₪${data.totalValue.toFixed(2)}</td>
                  </tr>
                </table>
              </div>

              <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 500; color: #1a1a1a;">פריטים בבקשה</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
              </table>
            </div>
            
            <div style="padding: 20px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #4b5563; font-size: 14px;">
                📋 הבקשה תיבדק על ידי הצוות שלנו ותקבל מענה תוך 1-3 ימי עסקים.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                תוכל לעקוב אחרי הסטטוס באזור האישי שלך.
              </p>
            </div>
            
          </td>
        </tr>
      </table>
      
      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: white; padding: 32px 24px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
            <a href="${accountUrl}" style="display: inline-block; background: #1a1a1a; color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 500; font-size: 14px;">
              צפייה בבקשות שלי
            </a>
          </td>
        </tr>
      </table>
      
      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 32px auto 0;">
        <tr>
          <td style="text-align: center; padding: 24px;">
            <p style="margin: 0; color: #9ca3af; font-size: 14px;">© ${data.storeName} - מופעל על ידי QuickShop</p>
          </td>
        </tr>
      </table>
      
    </body>
    </html>
  `;

  return sendEmail({
    to: data.customerEmail,
    subject: `בקשת ${data.requestType === 'exchange' ? 'החלפה' : 'החזרה'} #${data.requestNumber} התקבלה - ${data.storeName}`,
    html,
  });
}

interface ReturnRequestUpdateEmailData {
  requestNumber: string;
  orderNumber: string;
  customerEmail: string;
  customerName?: string;
  status: 'approved' | 'rejected' | 'completed';
  resolution?: string;
  creditAmount?: number;
  refundAmount?: number;
  customerNotes?: string;
  storeName: string;
  storeSlug: string;
}

export async function sendReturnRequestUpdateEmail(data: ReturnRequestUpdateEmailData) {
  const baseUrl = getAppUrl();
  if (!baseUrl) {
    console.error('Cannot send return request update email - NEXT_PUBLIC_APP_URL not configured');
    return { success: false, error: 'App URL not configured' };
  }

  const storeUrl = `${baseUrl}/shops/${data.storeSlug}`;
  const accountUrl = `${storeUrl}/account/returns`;

  const statusConfig: Record<string, { title: string; icon: string; color: string; bgColor: string }> = {
    approved: { title: 'בקשתך אושרה!', icon: '✓', color: '#16a34a', bgColor: '#dcfce7' },
    rejected: { title: 'לצערנו, בקשתך נדחתה', icon: '✕', color: '#dc2626', bgColor: '#fee2e2' },
    completed: { title: 'הבקשה הושלמה!', icon: '✓', color: '#16a34a', bgColor: '#dcfce7' },
  };

  const resolutionLabels: Record<string, string> = {
    exchange: 'החלפה למוצר אחר',
    store_credit: 'קרדיט לחנות',
    refund: 'זיכוי כספי',
  };

  const config = statusConfig[data.status] || statusConfig.approved;

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f9fafb; margin: 0; padding: 20px; direction: rtl; text-align: right;">
      
      <!-- Header -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: white; padding: 48px 24px; text-align: center; border-radius: 16px 16px 0 0;">
            <table cellpadding="0" cellspacing="0" style="margin: 0 auto 24px;">
              <tr>
                <td style="width: 64px; height: 64px; background: ${config.bgColor}; border-radius: 50%; text-align: center; vertical-align: middle;">
                  <span style="color: ${config.color}; font-size: 28px; font-weight: bold; line-height: 64px;">${config.icon}</span>
                </td>
              </tr>
            </table>
            <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 400; color: #1a1a1a;">${config.title}</h1>
            <p style="margin: 0; color: #6b7280; font-size: 16px;">
              בקשה מספר <strong style="color: #1a1a1a;">${data.requestNumber}</strong>
            </p>
          </td>
        </tr>
      </table>
      
      <!-- Content -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 24px;">
            
            <p style="margin: 0 0 16px; color: #4b5563; line-height: 1.6;">
              היי ${data.customerName || 'לקוח יקר'},
            </p>
            
            ${data.status === 'approved' ? `
            <p style="margin: 0 0 16px; color: #4b5563; line-height: 1.6;">
              שמחים לעדכן שבקשתך מהזמנה <strong>#${data.orderNumber}</strong> אושרה.
            </p>
            ${data.resolution ? `
            <div style="background: ${config.bgColor}; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <p style="margin: 0; font-weight: 500; color: ${config.color};">
                פתרון: ${resolutionLabels[data.resolution] || data.resolution}
              </p>
              ${data.creditAmount && data.creditAmount > 0 ? `
              <p style="margin: 8px 0 0; color: ${config.color};">
                קרדיט שהוזן לחשבון: ₪${data.creditAmount.toFixed(2)}
              </p>
              ` : ''}
              ${data.refundAmount && data.refundAmount > 0 ? `
              <p style="margin: 8px 0 0; color: ${config.color};">
                סכום הזיכוי: ₪${data.refundAmount.toFixed(2)}
              </p>
              ` : ''}
            </div>
            ` : ''}
            ` : ''}
            
            ${data.status === 'rejected' ? `
            <p style="margin: 0 0 16px; color: #4b5563; line-height: 1.6;">
              לצערנו, בקשתך מהזמנה <strong>#${data.orderNumber}</strong> נדחתה.
            </p>
            ${data.customerNotes ? `
            <div style="background: #fee2e2; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <p style="margin: 0; font-weight: 500; color: #dc2626;">סיבה:</p>
              <p style="margin: 8px 0 0; color: #7f1d1d;">${data.customerNotes}</p>
            </div>
            ` : ''}
            <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">
              אם יש לך שאלות, אל תהסס ליצור איתנו קשר.
            </p>
            ` : ''}
            
            ${data.status === 'completed' ? `
            <p style="margin: 0 0 16px; color: #4b5563; line-height: 1.6;">
              הטיפול בבקשתך מהזמנה <strong>#${data.orderNumber}</strong> הושלם בהצלחה!
            </p>
            ${data.creditAmount && data.creditAmount > 0 ? `
            <div style="background: ${config.bgColor}; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <p style="margin: 0; font-weight: 500; color: ${config.color};">
                ✓ קרדיט של ₪${data.creditAmount.toFixed(2)} הוזן לחשבונך
              </p>
            </div>
            ` : ''}
            ` : ''}
            
            ${data.customerNotes && data.status !== 'rejected' ? `
            <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <p style="margin: 0; font-weight: 500; color: #0369a1;">הודעה מהחנות:</p>
              <p style="margin: 8px 0 0; color: #1e40af;">${data.customerNotes}</p>
            </div>
            ` : ''}
            
          </td>
        </tr>
      </table>
      
      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: white; padding: 32px 24px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
            <a href="${storeUrl}" style="display: inline-block; background: #1a1a1a; color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 500; font-size: 14px;">
              המשך לקנות ב-${data.storeName}
            </a>
          </td>
        </tr>
      </table>
      
      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 32px auto 0;">
        <tr>
          <td style="text-align: center; padding: 24px;">
            <p style="margin: 0; color: #9ca3af; font-size: 14px;">© ${data.storeName} - מופעל על ידי QuickShop</p>
          </td>
        </tr>
      </table>
      
    </body>
    </html>
  `;

  const subjectMap: Record<string, string> = {
    approved: `בקשה #${data.requestNumber} אושרה ✓`,
    rejected: `בקשה #${data.requestNumber} נדחתה`,
    completed: `בקשה #${data.requestNumber} הושלמה ✓`,
  };

  return sendEmail({
    to: data.customerEmail,
    subject: `${subjectMap[data.status]} - ${data.storeName}`,
    html,
  });
}

// Exchange Payment Email - sent when customer needs to pay price difference
interface ExchangePaymentEmailData {
  customerEmail: string;
  customerName?: string;
  storeName: string;
  storeSlug: string;
  orderNumber: string;
  originalProductName: string;
  newProductName: string;
  originalValue: number;
  newProductPrice: number;
  priceDifference: number;
  paymentUrl: string;
}

export async function sendExchangePaymentEmail(data: ExchangePaymentEmailData) {
  const baseUrl = getAppUrl();
  if (!baseUrl) {
    console.error('Cannot send exchange payment email - NEXT_PUBLIC_APP_URL not configured');
    return { success: false, error: 'App URL not configured' };
  }

  const storeUrl = `${baseUrl}/shops/${data.storeSlug}`;

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f9fafb; margin: 0; padding: 20px; direction: rtl; text-align: right;">
      
      <!-- Header -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: white; padding: 48px 24px; text-align: center; border-radius: 16px 16px 0 0;">
            <table cellpadding="0" cellspacing="0" style="margin: 0 auto 24px;">
              <tr>
                <td style="width: 64px; height: 64px; background: #dbeafe; border-radius: 50%; text-align: center; vertical-align: middle;">
                  <span style="color: #2563eb; font-size: 28px; line-height: 64px;">↔️</span>
                </td>
              </tr>
            </table>
            <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 400; color: #1a1a1a;">בקשת ההחלפה שלך אושרה!</h1>
            <p style="margin: 0; color: #6b7280; font-size: 16px;">
              נותר הפרש קטן לתשלום
            </p>
          </td>
        </tr>
      </table>
      
      <!-- Content -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 24px;">
            
            <p style="margin: 0 0 16px; color: #4b5563; line-height: 1.6;">
              היי ${data.customerName || 'לקוח יקר'},
            </p>
            
            <p style="margin: 0 0 24px; color: #4b5563; line-height: 1.6;">
              שמחים לעדכן שבקשת ההחלפה שלך אושרה! המוצר החדש שבחרת יקר מעט יותר מהמוצר המקורי, ולכן נדרש תשלום הפרש קטן.
            </p>
            
            <!-- Exchange Details -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px; font-size: 14px; color: #6b7280; font-weight: 500;">פרטי ההחלפה</h3>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280;">מוצר מקורי:</span>
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: left;">
                    <span style="color: #1a1a1a;">${data.originalProductName}</span>
                    <span style="color: #6b7280; margin-right: 8px;">₪${data.originalValue.toFixed(2)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280;">מוצר חדש:</span>
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: left;">
                    <span style="color: #1a1a1a;">${data.newProductName}</span>
                    <span style="color: #6b7280; margin-right: 8px;">₪${data.newProductPrice.toFixed(2)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="font-weight: 600; color: #1a1a1a;">הפרש לתשלום:</span>
                  </td>
                  <td style="padding: 12px 0; text-align: left;">
                    <span style="font-size: 20px; font-weight: 600; color: #2563eb;">₪${data.priceDifference.toFixed(2)}</span>
                  </td>
                </tr>
              </table>
            </div>
            
            <p style="margin: 0 0 8px; color: #4b5563; line-height: 1.6; text-align: center;">
              לאחר התשלום, המוצר החדש יישלח אליך בהקדם.
            </p>
            
          </td>
        </tr>
      </table>
      
      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: white; padding: 32px 24px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
            <a href="${data.paymentUrl}" style="display: inline-block; background: #2563eb; color: white !important; text-decoration: none; padding: 16px 48px; border-radius: 10px; font-weight: 600; font-size: 16px;">
              לתשלום הפרש ₪${data.priceDifference.toFixed(2)}
            </a>
            <p style="margin: 16px 0 0; color: #9ca3af; font-size: 12px;">
              הזמנה #${data.orderNumber}
            </p>
          </td>
        </tr>
      </table>
      
      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 32px auto 0;">
        <tr>
          <td style="text-align: center; padding: 24px;">
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
              <a href="${storeUrl}" style="color: #6b7280; text-decoration: none;">${data.storeName}</a>
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">מופעל על ידי QuickShop</p>
          </td>
        </tr>
      </table>
      
    </body>
    </html>
  `;

  return sendEmail({
    to: data.customerEmail,
    subject: `תשלום הפרש להחלפה - הזמנה #${data.orderNumber} - ${data.storeName}`,
    html,
  });
}

// ============ INFLUENCER WELCOME EMAIL ============

interface InfluencerWelcomeEmailData {
  email: string;
  name: string;
  storeName: string;
  storeSlug: string;
  loginUrl: string;
  tempPassword?: string;
}

export async function sendInfluencerWelcomeEmail(data: InfluencerWelcomeEmailData) {
  const { email, name, storeName, storeSlug, loginUrl, tempPassword } = data;

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f9fafb; margin: 0; padding: 20px; direction: rtl; text-align: right;">
      
      <!-- Header -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 48px 24px; text-align: center; border-radius: 16px 16px 0 0;">
            <table cellpadding="0" cellspacing="0" style="margin: 0 auto 24px;">
              <tr>
                <td style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; text-align: center; vertical-align: middle;">
                  <span style="color: white; font-size: 28px; line-height: 64px;">👑</span>
                </td>
              </tr>
            </table>
            <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 400; color: white;">ברוך הבא לצוות המשפיענים!</h1>
            <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 16px;">
              ${storeName}
            </p>
          </td>
        </tr>
      </table>
      
      <!-- Content -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 32px;">
            
            <p style="margin: 0 0 20px; color: #4b5563; line-height: 1.7; font-size: 16px;">
              היי ${name}! 👋
            </p>
            
            <p style="margin: 0 0 24px; color: #4b5563; line-height: 1.7; font-size: 16px;">
              שמחים לעדכן שצורפת כמשפיען/ית של <strong>${storeName}</strong>!
              <br><br>
              בפאנל המשפיענים תוכל/י לעקוב אחרי:
            </p>
            
            <ul style="margin: 0 0 24px; padding-right: 20px; color: #4b5563; line-height: 2;">
              <li>📊 סטטיסטיקות מכירות בזמן אמת</li>
              <li>💰 עמלות שהורווחו</li>
              <li>🎟️ קופונים ייחודיים משלך</li>
              <li>📋 רשימת הזמנות עם הקוד שלך</li>
            </ul>
            
            <!-- Login Details Box -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #1a1a1a;">פרטי התחברות</h3>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">אימייל:</td>
                  <td style="padding: 8px 0; text-align: left; font-weight: 500; color: #1a1a1a;" dir="ltr">${email}</td>
                </tr>
                ${tempPassword ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">סיסמה זמנית:</td>
                  <td style="padding: 8px 0; text-align: left; font-weight: 500; color: #1a1a1a; font-family: monospace; background: #fef3c7; padding: 4px 8px; border-radius: 4px;" dir="ltr">${tempPassword}</td>
                </tr>
                ` : ''}
              </table>
              ${tempPassword ? `
              <p style="margin: 12px 0 0; font-size: 12px; color: #f59e0b;">
                ⚠️ מומלץ לשנות את הסיסמה לאחר ההתחברות הראשונה
              </p>
              ` : ''}
            </div>
            
          </td>
        </tr>
      </table>
      
      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: white; padding: 32px 24px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white !important; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px;">
              כניסה לפאנל המשפיענים
            </a>
            <p style="margin: 16px 0 0; font-size: 13px; color: #9ca3af;">
              או העתק את הקישור:
              <br>
              <span style="color: #6b7280; font-size: 12px; word-break: break-all;" dir="ltr">${loginUrl}</span>
            </p>
          </td>
        </tr>
      </table>
      
      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 32px auto 0;">
        <tr>
          <td style="text-align: center; padding: 24px;">
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
              יש שאלות? צרו קשר עם צוות ${storeName}
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${storeName} - מופעל על ידי QuickShop</p>
          </td>
        </tr>
      </table>
      
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `הצטרפת כמשפיען/ית ל-${storeName}! 👑`,
    html,
  });
}

export async function sendWelcomeEmail(email: string, name?: string, storeName?: string) {
  const baseUrl = getAppUrl();
  if (!baseUrl) {
    console.error('Cannot send welcome email - NEXT_PUBLIC_APP_URL not configured');
    return { success: false, error: 'App URL not configured' };
  }
  const dashboardUrl = `${baseUrl}/dashboard`;
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f7f7f7; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; }
        .logo { font-size: 28px; font-weight: bold; color: #1a1a1a; margin-bottom: 30px; }
        h1 { font-size: 24px; color: #1a1a1a; margin: 0 0 16px; }
        p { color: #666; line-height: 1.6; margin: 0 0 20px; }
        .button { display: inline-block; background: #1a1a1a; color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 14px; }
        .feature { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
        .feature:last-child { border-bottom: none; }
        .feature-icon { width: 40px; height: 40px; background: #f7f7f7; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">Quick Shop</div>
        <h1>ברוך הבא ל-QuickShop! 🎉</h1>
        <p>היי ${name || 'שם'}! החשבון שלך נוצר בהצלחה${storeName ? ` והחנות "${storeName}" מוכנה` : ''}.</p>
        
        <div style="margin: 30px 0;">
          <div class="feature">
            <div class="feature-icon">📦</div>
            <div>
              <strong>הוסף מוצרים</strong>
              <p style="margin: 0; font-size: 14px;">התחל להוסיף מוצרים לחנות שלך</p>
            </div>
          </div>
          <div class="feature">
            <div class="feature-icon">🎨</div>
            <div>
              <strong>עצב את החנות</strong>
              <p style="margin: 0; font-size: 14px;">התאם אישית צבעים ולוגו</p>
            </div>
          </div>
          <div class="feature">
            <div class="feature-icon">🚀</div>
            <div>
              <strong>התחל למכור</strong>
              <p style="margin: 0; font-size: 14px;">שתף את החנות עם הלקוחות שלך</p>
            </div>
          </div>
        </div>
        
        <p style="text-align: center;">
          <a href="${dashboardUrl}" class="button">כנס לדשבורד</a>
        </p>
        
        <div class="footer">
          <p>יש שאלות? אנחנו כאן לעזור! support@quickshop.co.il</p>
          <p>© QuickShop - פלטפורמת החנויות המובילה</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    subject: 'ברוך הבא ל-QuickShop! 🎉',
    html,
  });
}

// ============ CLUB MEMBER WELCOME EMAIL ============

interface ClubMemberWelcomeEmailData {
  email: string;
  customerName?: string;
  storeName: string;
  storeSlug: string;
}

export async function sendClubMemberWelcomeEmail(data: ClubMemberWelcomeEmailData) {
  const { email, customerName, storeName, storeSlug } = data;

  const baseUrl = getAppUrl();
  if (!baseUrl) {
    console.error('Cannot send club member welcome email - NEXT_PUBLIC_APP_URL not configured');
    return { success: false, error: 'App URL not configured' };
  }

  const storeUrl = `${baseUrl}/shops/${storeSlug}`;
  const accountUrl = `${storeUrl}/account`;

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f9fafb; margin: 0; padding: 20px; direction: rtl; text-align: right;">
      
      <!-- Header with Celebration -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 48px 24px; text-align: center; border-radius: 16px 16px 0 0;">
            <!-- Star/Crown Icon -->
            <table cellpadding="0" cellspacing="0" style="margin: 0 auto 24px;">
              <tr>
                <td style="width: 72px; height: 72px; background: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; vertical-align: middle;">
                  <span style="color: #ffd700; font-size: 36px; line-height: 72px;">⭐</span>
                </td>
              </tr>
            </table>
            <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 300; letter-spacing: 1px; color: white;">ברוך הבא למועדון!</h1>
            <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 16px;">
              ${storeName}
            </p>
          </td>
        </tr>
      </table>
      
      <!-- Content -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 40px 32px;">
            
            <p style="margin: 0 0 24px; color: #1a1a1a; line-height: 1.8; font-size: 18px;">
              היי ${customerName || 'חבר יקר'}! 👋
            </p>
            
            <p style="margin: 0 0 32px; color: #4b5563; line-height: 1.8; font-size: 16px;">
              שמחים לבשר לך שהצטרפת בהצלחה למועדון הלקוחות של <strong style="color: #1a1a1a;">${storeName}</strong>!
            </p>
            
            <!-- Benefits Box -->
            <div style="background: #fafafa; border-radius: 16px; padding: 28px; margin-bottom: 32px;">
              <h2 style="margin: 0 0 20px; font-size: 16px; font-weight: 600; color: #1a1a1a; text-align: center;">
                ההטבות שלך כחבר מועדון
              </h2>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 48px; vertical-align: top;">
                          <div style="width: 40px; height: 40px; background: #fef3c7; border-radius: 10px; text-align: center; line-height: 40px;">
                            🎁
                          </div>
                        </td>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <span style="color: #1a1a1a; font-weight: 500;">הטבות בלעדיות</span>
                          <br>
                          <span style="color: #6b7280; font-size: 14px;">מבצעים והנחות רק לחברי מועדון</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 48px; vertical-align: top;">
                          <div style="width: 40px; height: 40px; background: #dbeafe; border-radius: 10px; text-align: center; line-height: 40px;">
                            📦
                          </div>
                        </td>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <span style="color: #1a1a1a; font-weight: 500;">מעקב הזמנות</span>
                          <br>
                          <span style="color: #6b7280; font-size: 14px;">צפייה בהיסטוריית ההזמנות שלך</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 48px; vertical-align: top;">
                          <div style="width: 40px; height: 40px; background: #dcfce7; border-radius: 10px; text-align: center; line-height: 40px;">
                            ⚡
                          </div>
                        </td>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <span style="color: #1a1a1a; font-weight: 500;">צ'קאאוט מהיר</span>
                          <br>
                          <span style="color: #6b7280; font-size: 14px;">הפרטים שלך נשמרים לרכישות עתידיות</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 48px; vertical-align: top;">
                          <div style="width: 40px; height: 40px; background: #f3e8ff; border-radius: 10px; text-align: center; line-height: 40px;">
                            🔔
                          </div>
                        </td>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <span style="color: #1a1a1a; font-weight: 500;">עדכונים ראשונים</span>
                          <br>
                          <span style="color: #6b7280; font-size: 14px;">תקבל הודעות על מוצרים חדשים ומבצעים</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </div>
            
          </td>
        </tr>
      </table>
      
      <!-- CTA Buttons -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td style="background: white; padding: 32px 24px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
            <a href="${storeUrl}" style="display: inline-block; background: #1a1a1a; color: white !important; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 500; font-size: 16px;">
              התחל לקנות
            </a>
            <p style="margin: 16px 0 0;">
              <a href="${accountUrl}" style="color: #6b7280; text-decoration: underline; font-size: 14px;">
                או היכנס לאזור האישי שלך
              </a>
            </p>
          </td>
        </tr>
      </table>
      
      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 32px auto 0;">
        <tr>
          <td style="text-align: center; padding: 24px;">
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
              יש שאלות? צרו איתנו קשר!
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              © ${storeName} - מופעל על ידי QuickShop
            </p>
          </td>
        </tr>
      </table>
      
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `ברוך הבא למועדון ${storeName}! ⭐`,
    html,
    senderName: storeName,
  });
}

// ============ GIFT CARD EMAIL ============

interface GiftCardEmailData {
  recipientEmail: string;
  recipientName: string;
  senderName?: string;
  message?: string;
  giftCardCode: string;
  amount: number;
  storeName: string;
  storeSlug: string;
  cardImage?: string | null;
  expiresAt?: Date | null;
}

export async function sendGiftCardEmail(data: GiftCardEmailData) {
  const {
    recipientEmail,
    recipientName,
    senderName,
    message,
    giftCardCode,
    amount,
    storeName,
    storeSlug,
    cardImage,
    expiresAt,
  } = data;

  const baseUrl = getAppUrl();
  if (!baseUrl) {
    console.error('Cannot send gift card email - NEXT_PUBLIC_APP_URL not configured');
    return { success: false, error: 'App URL not configured' };
  }

  const storeUrl = `${baseUrl}/shops/${storeSlug}`;
  const expiryText = expiresAt 
    ? `תקף עד: ${expiresAt.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}`
    : 'ללא תאריך תפוגה';

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #f5f3ff 0%, #fdf2f8 100%); margin: 0; padding: 40px 20px; direction: rtl; text-align: right;">
      
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; margin: 0 auto;">
        <tr>
          <td>
            
            <!-- Header -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); border-radius: 24px 24px 0 0; padding: 40px 32px; text-align: center;">
              <tr>
                <td>
                  <div style="font-size: 48px; margin-bottom: 16px;">🎁</div>
                  <h1 style="margin: 0 0 8px; color: white; font-size: 28px; font-weight: bold;">קיבלת גיפט קארד!</h1>
                  <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 16px;">מ-${storeName}</p>
                </td>
              </tr>
            </table>
            
            <!-- Card Image or Default -->
            ${cardImage ? `
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background: white; padding: 24px 24px 0;">
                  <img src="${cardImage}" alt="גיפט קארד" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 16px;" />
                </td>
              </tr>
            </table>
            ` : ''}
            
            <!-- Amount -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background: white; padding: 32px;">
              <tr>
                <td style="text-align: center;">
                  <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">סכום הכרטיס</p>
                  <p style="margin: 0; font-size: 48px; font-weight: bold; color: #1a1a1a;">₪${amount}</p>
                </td>
              </tr>
            </table>
            
            <!-- Sender Message -->
            ${senderName || message ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="background: white; padding: 0 32px 24px;">
              <tr>
                <td>
                  <div style="background: linear-gradient(135deg, #f5f3ff 0%, #fdf2f8 100%); border-radius: 16px; padding: 24px;">
                    ${senderName ? `<p style="margin: 0 0 8px; font-weight: 600; color: #7c3aed;">מאת: ${senderName}</p>` : ''}
                    ${message ? `<p style="margin: 0; color: #374151; line-height: 1.6; font-style: italic;">"${message}"</p>` : ''}
                  </div>
                </td>
              </tr>
            </table>
            ` : ''}
            
            <!-- Gift Card Code -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background: white; padding: 0 32px 32px;">
              <tr>
                <td>
                  <div style="background: #1a1a1a; border-radius: 16px; padding: 24px; text-align: center;">
                    <p style="margin: 0 0 12px; color: rgba(255,255,255,0.7); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">קוד הגיפט קארד שלך</p>
                    <p style="margin: 0; color: white; font-size: 24px; font-weight: bold; letter-spacing: 2px; font-family: monospace;">${giftCardCode}</p>
                  </div>
                </td>
              </tr>
            </table>
            
            <!-- How to Use -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background: white; padding: 0 32px 32px;">
              <tr>
                <td>
                  <p style="margin: 0 0 16px; font-weight: 600; color: #374151;">איך להשתמש?</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 8px 0;">
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="width: 28px; height: 28px; background: #f3e8ff; border-radius: 50%; text-align: center; vertical-align: middle; color: #7c3aed; font-weight: bold; font-size: 14px;">1</td>
                            <td style="padding-right: 12px; color: #4b5563;">היכנס לחנות ${storeName}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="width: 28px; height: 28px; background: #f3e8ff; border-radius: 50%; text-align: center; vertical-align: middle; color: #7c3aed; font-weight: bold; font-size: 14px;">2</td>
                            <td style="padding-right: 12px; color: #4b5563;">בחר מוצרים והוסף לעגלה</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="width: 28px; height: 28px; background: #f3e8ff; border-radius: 50%; text-align: center; vertical-align: middle; color: #7c3aed; font-weight: bold; font-size: 14px;">3</td>
                            <td style="padding-right: 12px; color: #4b5563;">בעמוד התשלום, הזן את הקוד</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background: white; padding: 0 32px 32px;">
              <tr>
                <td style="text-align: center;">
                  <a href="${storeUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: white !important; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                    התחל לקנות
                  </a>
                </td>
              </tr>
            </table>
            
            <!-- Expiry -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background: white; border-radius: 0 0 24px 24px; padding: 0 32px 32px;">
              <tr>
                <td style="text-align: center; color: #9ca3af; font-size: 12px;">
                  ${expiryText}
                </td>
              </tr>
            </table>
            
            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
              <tr>
                <td style="text-align: center; padding: 24px;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    © ${storeName} - מופעל על ידי QuickShop
                  </p>
                </td>
              </tr>
            </table>
            
          </td>
        </tr>
      </table>
      
    </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `🎁 ${senderName ? `${senderName} שלח לך` : 'קיבלת'} גיפט קארד מ-${storeName}!`,
    html,
    senderName: storeName,
  });
}

