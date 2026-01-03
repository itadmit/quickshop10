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
  
  const itemsHtml = items.map(item => {
    // Ensure image URL is absolute
    const imageUrl = item.image 
      ? (item.image.startsWith('http') ? item.image : `${process.env.NEXT_PUBLIC_APP_URL}${item.image.startsWith('/') ? '' : '/'}${item.image}`)
      : null;
    
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
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #1a1a1a;">₪${item.price.toFixed(0)}</p>
            </td>
            <!-- Price on LEFT -->
            <td style="width: 100px; vertical-align: top; text-align: left;">
              <span style="font-weight: 600; font-size: 18px; color: #1a1a1a;">₪${(item.price * item.quantity).toFixed(0)}</span>
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
                סה״כ שולם: <strong>₪${total.toFixed(0)}</strong>
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
                  <td style="padding: 12px 0; color: #6b7280; text-align: right; width: 50%;">סכום ביניים</td>
                  <td style="padding: 12px 0; text-align: left; font-weight: 500; color: #1a1a1a; width: 50%;">₪${subtotal.toFixed(0)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6b7280; text-align: right;">משלוח</td>
                  <td style="padding: 12px 0; text-align: left; font-weight: 500; color: ${shippingAmount > 0 ? '#1a1a1a' : '#16a34a'};">
                    ${shippingAmount > 0 ? `₪${shippingAmount.toFixed(0)}` : 'חינם'}
                  </td>
                </tr>
                ${discountAmount > 0 ? `
                <tr>
                  <td style="padding: 12px 0; color: #16a34a; text-align: right;">הנחה</td>
                  <td style="padding: 12px 0; text-align: left; font-weight: 500; color: #16a34a;">-₪${discountAmount.toFixed(0)}</td>
                </tr>
                ` : ''}
                ${creditUsed > 0 ? `
                <tr>
                  <td style="padding: 12px 0; color: #16a34a; text-align: right;">קרדיט</td>
                  <td style="padding: 12px 0; text-align: left; font-weight: 500; color: #16a34a;">-₪${creditUsed.toFixed(0)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td colspan="2" style="padding-top: 16px;">
                    <div style="border-top: 2px solid #e5e7eb; padding-top: 16px;">
                      <table width="100%">
                        <tr>
                          <td style="font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: right;">סה״כ</td>
                          <td style="font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: left;">₪${total.toFixed(0)}</td>
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

