'use server';

import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'no-reply@my-quickshop.com';
const fromName = process.env.SENDGRID_FROM_NAME || 'QuickShop';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  try {
    await sgMail.send({
      to,
      from: {
        email: fromEmail,
        name: fromName,
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
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
  
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
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  
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

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  variantTitle?: string;
  image?: string;
}

interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
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
    creditUsed = 0,
    total,
    shippingAddress,
    storeName,
    storeSlug,
    paymentInfo,
  } = data;

  const storeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shops/${storeSlug}`;
  
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0;">
        <div style="display: flex; gap: 12px; direction: rtl;">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />` : ''}
          <div style="text-align: right;">
            <p style="margin: 0; font-weight: 500; color: #1a1a1a;">${item.name}</p>
            ${item.variantTitle ? `<p style="margin: 4px 0 0; font-size: 14px; color: #666;">${item.variantTitle}</p>` : ''}
            <p style="margin: 4px 0 0; font-size: 14px; color: #666;">כמות: ${item.quantity}</p>
          </div>
        </div>
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0; text-align: right; vertical-align: top; white-space: nowrap;">
        <span style="font-weight: 500;">₪${(item.price * item.quantity).toFixed(0)}</span>
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f7f7f7; margin: 0; padding: 20px; direction: rtl; text-align: right; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; direction: rtl; }
        .header { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .header .check { width: 60px; height: 60px; background: #1a1a1a; border: 2px solid white; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; }
        .content { padding: 30px; }
        .order-number { background: #f7f7f7; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
        .order-number p { margin: 0; font-size: 14px; color: #666; }
        .order-number h2 { margin: 8px 0 0; font-size: 20px; color: #1a1a1a; }
        table { width: 100%; border-collapse: collapse; }
        .summary { background: #f7f7f7; padding: 20px; border-radius: 8px; margin-top: 24px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .summary-row.total { font-size: 18px; font-weight: 600; border-top: 1px solid #ddd; padding-top: 12px; margin-top: 12px; }
        .address { background: #f7f7f7; padding: 20px; border-radius: 8px; margin-top: 24px; }
        .button { display: inline-block; background: #1a1a1a; color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; margin-top: 24px; }
        .footer { padding: 24px 30px; border-top: 1px solid #f0f0f0; text-align: center; color: #999; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="check">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1>תודה על ההזמנה!</h1>
          <p style="margin: 8px 0 0; opacity: 0.8;">קיבלנו את ההזמנה שלך ומטפלים בה</p>
        </div>
        
        <div class="content">
          <p style="margin: 0 0 24px; font-size: 16px; color: #333;">
            שלום ${customerName || 'לקוח יקר'}! 👋
          </p>
          
          <div class="order-number">
            <p>מספר הזמנה</p>
            <h2>#${orderNumber}</h2>
          </div>
          
          <h3 style="margin: 0 0 16px; font-size: 16px;">פריטים בהזמנה</h3>
          <table>
            ${itemsHtml}
          </table>
          
          <div class="summary">
            <div class="summary-row">
              <span style="color: #666;">סכום ביניים</span>
              <span>₪${subtotal.toFixed(0)}</span>
            </div>
            ${shippingAmount > 0 ? `
            <div class="summary-row">
              <span style="color: #666;">משלוח</span>
              <span>₪${shippingAmount.toFixed(0)}</span>
            </div>
            ` : `
            <div class="summary-row">
              <span style="color: #666;">משלוח</span>
              <span style="color: #22c55e;">חינם</span>
            </div>
            `}
            ${discountAmount > 0 ? `
            <div class="summary-row" style="color: #22c55e;">
              <span>הנחה</span>
              <span>-₪${discountAmount.toFixed(0)}</span>
            </div>
            ` : ''}
            ${creditUsed > 0 ? `
            <div class="summary-row" style="color: #22c55e;">
              <span>קרדיט</span>
              <span>-₪${creditUsed.toFixed(0)}</span>
            </div>
            ` : ''}
            <div class="summary-row total">
              <span>סה״כ</span>
              <span>₪${total.toFixed(0)}</span>
            </div>
          </div>
          
          ${shippingAddress ? `
          <div class="address">
            <h3 style="margin: 0 0 12px; font-size: 16px;">כתובת למשלוח</h3>
            <p style="margin: 0; line-height: 1.6; color: #333;">
              ${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}<br>
              ${shippingAddress.address || ''}<br>
              ${shippingAddress.city || ''}
              ${shippingAddress.phone ? `<br>טלפון: ${shippingAddress.phone}` : ''}
            </p>
          </div>
          ` : ''}
          
          ${paymentInfo?.lastFour ? `
          <div class="address">
            <h3 style="margin: 0 0 12px; font-size: 16px;">פרטי תשלום</h3>
            <p style="margin: 0; color: #333;">
              כרטיס: •••• ${paymentInfo.lastFour}
              ${paymentInfo.brand ? ` (${paymentInfo.brand})` : ''}
              ${paymentInfo.approvalNum ? `<br>אישור: ${paymentInfo.approvalNum}` : ''}
            </p>
          </div>
          ` : ''}
          
          <div style="text-align: center;">
            <a href="${storeUrl}" class="button">המשך לקנות ב-${storeName}</a>
          </div>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">יש שאלות? צרו קשר בכל עת!</p>
          <p style="margin: 8px 0 0;">© ${storeName} - מופעל על ידי QuickShop</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: customerEmail,
    subject: `אישור הזמנה #${orderNumber} - ${storeName}`,
    html,
  });
}

export async function sendWelcomeEmail(email: string, name?: string, storeName?: string) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
  
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
          <a href="${dashboardUrl}" class="button">כנס לדאשבורד</a>
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

