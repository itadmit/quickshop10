import { db } from '@/lib/db';
import { productWaitlist, products, productVariants, stores } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';

interface WaitlistEmailData {
  email: string;
  firstName: string | null;
  productName: string;
  productSlug: string;
  variantTitle: string | null;
  price: string;
  imageUrl: string | null;
  storeSlug: string;
  storeName: string;
}

/**
 * Generate waitlist back-in-stock email HTML
 * שמאל לימין בהתאם לשפה של המייל
 */
function generateWaitlistEmail(data: WaitlistEmailData): string {
  const {
    firstName,
    productName,
    variantTitle,
    price,
    imageUrl,
    storeSlug,
    storeName,
    productSlug,
  } = data;

  const productUrl = `https://${storeSlug}.quickshop.co.il/product/${productSlug}`;
  const greeting = firstName ? `שלום ${firstName},` : 'שלום,';

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <!--[if mso]>
      <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
      </style>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; direction: rtl;" dir="rtl">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;">
              <!-- Header -->
              <tr>
                <td style="background: #ffffff; border-radius: 12px 12px 0 0; padding: 32px 32px 24px 32px; text-align: right;" dir="rtl" align="right">
                  <div style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px 0; text-align: right;" dir="rtl" align="right">${storeName}</div>
                  <div style="height: 3px; width: 60px; background: #3b82f6; border-radius: 3px;"></div>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="background: #ffffff; padding: 24px 32px; text-align: right;" dir="rtl" align="right">
                  
                  <!-- Greeting -->
                  <h1 style="font-size: 22px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0; text-align: right; line-height: 1.4;" dir="rtl" align="right">${greeting}</h1>
                  
                  <!-- Message -->
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: right;" dir="rtl" align="right">
                    המוצר שחיכית לו חזר למלאי! 🎉
                  </p>

                  <!-- Product Card -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f9fafb; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                    <tr>
                      <td>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <!-- Product Image -->
                            ${imageUrl ? `
                            <td width="140" style="padding: 16px;">
                              <img src="${imageUrl}" alt="${productName}" style="width: 140px; height: 140px; object-fit: cover; border-radius: 8px; display: block;" width="140" height="140">
                            </td>
                            ` : ''}
                            
                            <!-- Product Info -->
                            <td style="padding: 16px; text-align: right; vertical-align: top;" dir="rtl" align="right">
                              <h2 style="font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px 0; text-align: right;" dir="rtl" align="right">${productName}</h2>
                              
                              ${variantTitle ? `
                              <p style="font-size: 14px; color: #6b7280; margin: 0 0 12px 0; text-align: right;" dir="rtl" align="right">
                                <strong>וריאציה:</strong> ${variantTitle}
                              </p>
                              ` : ''}
                              
                              <p style="font-size: 20px; font-weight: 700; color: #3b82f6; margin: 0 0 16px 0; text-align: right;" dir="rtl" align="right">
                                ${price}
                              </p>

                              <!-- CTA Button -->
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                  <td style="text-align: right;" align="right">
                                    <a href="${productUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 8px; text-align: center;">
                                      לצפייה במוצר
                                    </a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Note -->
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; text-align: right;" dir="rtl" align="right">
                    מספר היחידות במלאי מוגבל. מומלץ להזדרז! 🚀
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: #f9fafb; border-radius: 0 0 12px 12px; padding: 24px 32px; text-align: center;" align="center">
                  <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;" align="center">
                    קיבלת מייל זה כי ביקשת להתעדכן כשהמוצר יחזור למלאי.<br>
                    © ${new Date().getFullYear()} ${storeName}. כל הזכויות שמורות.
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
}

/**
 * Send back-in-stock notification to a specific waitlist entry
 */
export async function sendWaitlistNotification(waitlistId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get waitlist entry with product data
    const [entry] = await db
      .select({
        id: productWaitlist.id,
        email: productWaitlist.email,
        firstName: productWaitlist.firstName,
        productId: productWaitlist.productId,
        productName: products.name,
        productSlug: products.slug,
        productPrice: products.price,
        productImage: products.images,
        variantId: productWaitlist.variantId,
        variantTitle: productVariants.title,
        variantPrice: productVariants.price,
        storeId: productWaitlist.storeId,
        storeName: stores.name,
        storeSlug: stores.slug,
      })
      .from(productWaitlist)
      .leftJoin(products, eq(products.id, productWaitlist.productId))
      .leftJoin(productVariants, eq(productVariants.id, productWaitlist.variantId))
      .leftJoin(stores, eq(stores.id, productWaitlist.storeId))
      .where(eq(productWaitlist.id, waitlistId))
      .limit(1);

    if (!entry) {
      return { success: false, error: 'רשומת המתנה לא נמצאה' };
    }

    // Get image URL
    let imageUrl: string | null = null;
    if (entry.productImage && Array.isArray(entry.productImage)) {
      const images = entry.productImage as Array<{ url: string; isPrimary?: boolean }>;
      const primaryImage = images.find(img => img.isPrimary) || images[0];
      imageUrl = primaryImage?.url || null;
    }

    // Prepare email data
    const emailData: WaitlistEmailData = {
      email: entry.email,
      firstName: entry.firstName,
      productName: entry.productName || 'מוצר',
      productSlug: entry.productSlug || '',
      variantTitle: entry.variantTitle,
      price: `₪${entry.variantPrice || entry.productPrice || '0'}`,
      imageUrl,
      storeSlug: entry.storeSlug || '',
      storeName: entry.storeName || 'החנות',
    };

    // Send email
    const subject = `${emailData.productName} חזר למלאי! 🎉`;
    const html = generateWaitlistEmail(emailData);

    const result = await sendEmail({
      to: entry.email,
      subject,
      html,
      senderName: entry.storeName || undefined,
    });

    if (result.success) {
      // Mark as notified
      await db
        .update(productWaitlist)
        .set({
          isNotified: true,
          notifiedAt: new Date(),
        })
        .where(eq(productWaitlist.id, waitlistId));
    }

    return result;
  } catch (error) {
    console.error('Error sending waitlist notification:', error);
    return { success: false, error: 'שגיאה בשליחת המייל' };
  }
}

/**
 * Send notifications to all waiting for a product/variant
 */
export async function notifyWaitlistForProduct(
  storeId: string,
  productId: string,
  variantId?: string | null
): Promise<{ success: boolean; count: number; errors: string[] }> {
  try {
    // Get all waiting entries for this product/variant
    const conditions = [
      eq(productWaitlist.storeId, storeId),
      eq(productWaitlist.productId, productId),
      eq(productWaitlist.isNotified, false),
    ];

    if (variantId) {
      conditions.push(eq(productWaitlist.variantId, variantId));
    } else {
      // For simple products, only get entries without variant
      conditions.push(eq(productWaitlist.variantId, null));
    }

    const entries = await db
      .select({ id: productWaitlist.id })
      .from(productWaitlist)
      .where(and(...conditions));

    if (entries.length === 0) {
      return { success: true, count: 0, errors: [] };
    }

    // Send notifications
    const errors: string[] = [];
    let successCount = 0;

    for (const entry of entries) {
      const result = await sendWaitlistNotification(entry.id);
      if (result.success) {
        successCount++;
      } else {
        errors.push(result.error || 'שגיאה לא ידועה');
      }
    }

    return {
      success: successCount > 0,
      count: successCount,
      errors,
    };
  } catch (error) {
    console.error('Error notifying waitlist:', error);
    return { success: false, count: 0, errors: ['שגיאה כללית בשליחת ההתראות'] };
  }
}

