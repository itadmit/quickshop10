'use server';

import { sendEmail } from '@/lib/email';

const RECIPIENT_EMAILS = ['itadmit@gmail.com', '0547359@gmail.com'];
const SUBJECT = 'מועמד חדש';

export async function submitCareerApplication(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const position = formData.get('position') as string;
    const message = formData.get('message') as string;
    const resume = formData.get('resume') as File | null;

    // Validate required fields
    if (!name || !email || !phone || !position) {
      return { success: false, error: 'נא למלא את כל השדות הנדרשים' };
    }

    // Get position label
    const positionLabels: Record<string, string> = {
      'project-manager': 'מנהל/ת פרויקטים והקמות – E-Commerce',
      'other': 'משרה אחרת',
    };
    const positionLabel = positionLabels[position] || position;

    // Process resume file if provided
    let resumeAttachment = null;
    if (resume && resume.size > 0 && resume.size <= 5 * 1024 * 1024) { // Max 5MB
      try {
        const arrayBuffer = await resume.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Content = buffer.toString('base64');
        
        // Determine MIME type
        const mimeTypes: Record<string, string> = {
          '.pdf': 'application/pdf',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };
        const extension = resume.name.substring(resume.name.lastIndexOf('.')).toLowerCase();
        const mimeType = mimeTypes[extension] || 'application/octet-stream';
        
        resumeAttachment = {
          content: base64Content,
          filename: resume.name,
          type: mimeType,
          disposition: 'attachment',
        };
      } catch (error) {
        console.error('Error processing resume file:', error);
        // Continue without attachment
      }
    }

    // Build email HTML
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f9fafb; margin: 0; padding: 20px; direction: rtl; text-align: right;">
        
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
          <tr>
            <td style="background: white; border-radius: 16px; padding: 40px; border: 1px solid #e5e7eb;">
              
              <!-- Header -->
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1a1a1a; text-align: center;">
                מועמד חדש - ${positionLabel}
              </h1>
              
              <!-- Details -->
              <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #6b7280; font-size: 14px;">שם:</span>
                      <span style="color: #1a1a1a; font-weight: 500; margin-right: 8px;">${name}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #6b7280; font-size: 14px;">אימייל:</span>
                      <span style="color: #1a1a1a; font-weight: 500; margin-right: 8px;" dir="ltr">${email}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #6b7280; font-size: 14px;">טלפון:</span>
                      <span style="color: #1a1a1a; font-weight: 500; margin-right: 8px;">${phone}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <span style="color: #6b7280; font-size: 14px;">משרה מבוקשת:</span>
                      <span style="color: #1a1a1a; font-weight: 500; margin-right: 8px;">${positionLabel}</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              ${message ? `
              <!-- Message -->
              <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 500; color: #1a1a1a;">הודעה מהמועמד:</h3>
                <div style="background: #f9fafb; border-radius: 8px; padding: 16px; color: #4b5563; line-height: 1.6; white-space: pre-wrap;">
                  ${message}
                </div>
              </div>
              ` : ''}
              
              ${resume && resume.size > 0 ? `
              <!-- Resume Info -->
              <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  <strong>קורות חיים מצורפים:</strong> ${resume.name} (${(resume.size / 1024).toFixed(2)} KB)
                </p>
                ${resumeAttachment ? (
                  '<p style="margin: 8px 0 0; color: #16a34a; font-size: 12px;">✓ הקובץ מצורף למייל</p>'
                ) : (
                  '<p style="margin: 8px 0 0; color: #f59e0b; font-size: 12px;">⚠️ הקובץ גדול מדי או לא נתמך - יש לבקש מהמועמד</p>'
                )}
              </div>
              ` : ''}
              
              <!-- Footer -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  בקשה זו נשלחה דרך טופס הדרושים באתר קוויק שופ
                </p>
              </div>
              
            </td>
          </tr>
        </table>
        
      </body>
      </html>
    `;

    // Send email to all recipients
    const emailPromises = RECIPIENT_EMAILS.map(recipient =>
      sendEmail({
        to: recipient,
        subject: `${SUBJECT} - ${positionLabel} - ${name}`,
        html,
        attachments: resumeAttachment ? [resumeAttachment] : undefined,
      })
    );

    const results = await Promise.all(emailPromises);
    const allSuccess = results.every(r => r.success);

    if (!allSuccess) {
      console.error('Some emails failed to send:', results);
      return { success: false, error: 'שגיאה בשליחת המייל' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error submitting career application:', error);
    return { success: false, error: 'שגיאה לא צפויה' };
  }
}

