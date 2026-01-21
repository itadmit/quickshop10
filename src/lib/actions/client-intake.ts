"use server";

import { sendEmail } from "@/lib/email";

// Types
interface WizardData {
  designStyle: string[];
  hasExistingBranding: boolean | null;
  logoUrl: string;
  brandColors: string[];
  customColors: string;
  referenceSites: Array<{ url: string; likes: string }>;
  detailLevel: 'minimal' | 'medium' | 'detailed' | null;
  specialFeatures: string[];
  customFeatures: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  additionalNotes: string;
}

// Design style to template mapping
const styleToTemplate: Record<string, { templateId: string; overlay: number; fontStyle: string }> = {
  luxury: { templateId: 'noir', overlay: 0.15, fontStyle: 'elegant' },
  minimal: { templateId: 'noir', overlay: 0.1, fontStyle: 'clean' },
  clean: { templateId: 'noir', overlay: 0.05, fontStyle: 'modern' },
  natural: { templateId: 'noir', overlay: 0.2, fontStyle: 'organic' },
  colorful: { templateId: 'noir', overlay: 0.1, fontStyle: 'playful' },
  young: { templateId: 'noir', overlay: 0.15, fontStyle: 'bold' },
  tech: { templateId: 'noir', overlay: 0.1, fontStyle: 'futuristic' },
};

// Hebrew labels
const styleLabels: Record<string, string> = {
  clean: 'נקי',
  luxury: 'יוקרתי',
  colorful: 'צבעוני',
  minimal: 'מינימליסטי',
  natural: 'טבעי',
  young: 'צעיר',
  tech: 'טכנולוגי',
};

const colorLabels: Record<string, string> = {
  black: 'שחור',
  white: 'לבן',
  gold: 'זהב',
  silver: 'כסף',
  red: 'אדום',
  blue: 'כחול',
  green: 'ירוק',
  pink: 'ורוד',
  purple: 'סגול',
  orange: 'כתום',
  brown: 'חום',
  beige: 'בז׳',
};

const featureLabels: Record<string, string> = {
  video_banner: 'באנר וידאו',
  newsletter: 'ניוזלטר',
  split_banner: 'באנר מפוצל',
  reviews: 'ביקורות',
  instagram: 'פיד אינסטגרם',
  faq: 'שאלות נפוצות',
  blog: 'בלוג',
  loyalty: 'מועדון לקוחות',
  gift_cards: 'גיפט קארד',
  multi_currency: 'מטבעות מרובים',
};

const detailLabels: Record<string, string> = {
  minimal: 'מינימלי (4-5 אזורים)',
  medium: 'בינוני (6-7 אזורים)',
  detailed: 'מפורט (8+ אזורים)',
};

// Generate a template JSON based on the answers
function generateTemplateJson(data: WizardData): object {
  const primaryStyle = data.designStyle[0] || 'clean';
  const templateConfig = styleToTemplate[primaryStyle] || styleToTemplate.clean;
  
  // Determine number of sections based on detail level
  const sectionCounts = {
    minimal: 4,
    medium: 6,
    detailed: 8,
  };
  const targetSections = sectionCounts[data.detailLevel || 'medium'];
  
  // Base sections that are always included
  const sections: object[] = [
    {
      id: `section-hero-${Date.now()}`,
      type: 'hero',
      title: data.businessName.toUpperCase(),
      subtitle: 'ברוכים הבאים לחנות שלנו',
      content: {
        imageUrl: 'https://static.zara.net/assets/public/7d17/93b6/642f4cafb9ab/b570acca9761/image-landscape-d9c8c30a-51dc-4c2c-a132-17471fd14151-default_0/image-landscape-d9c8c30a-51dc-4c2c-a132-17471fd14151-default_0.jpg?ts=1760467352233&w=3420',
        buttonLink: '#products',
        buttonText: 'גלה את הקולקציה',
      },
      settings: {
        height: '90vh',
        overlay: templateConfig.overlay,
      },
      sortOrder: 0,
      isActive: true,
    },
    {
      id: `section-categories-${Date.now()}`,
      type: 'categories',
      title: null,
      subtitle: null,
      content: {
        showAll: true,
        categoryIds: [],
      },
      settings: {
        gap: 8,
        columns: 4,
      },
      sortOrder: 1,
      isActive: true,
    },
    {
      id: `section-products-${Date.now()}`,
      type: 'products',
      title: 'פריטים נבחרים',
      subtitle: 'הבחירות שלנו לעונה',
      content: {
        type: 'all',
        limit: 4,
      },
      settings: {
        gap: 8,
        columns: 4,
      },
      sortOrder: 2,
      isActive: true,
    },
  ];
  
  let sortOrder = 3;
  
  // Add video banner if selected or if detailed
  if (data.specialFeatures.includes('video_banner') || targetSections >= 6) {
    sections.push({
      id: `section-video-${Date.now()}`,
      type: 'video_banner',
      title: 'קולקציה חדשה',
      subtitle: 'חדש בחנות',
      content: {
        videoUrl: 'https://image.hm.com/content/dam/global_campaigns/season_02/women/9000d/9000D-W-6C-16x9-women-spoil.mp4',
        buttonLink: '/products',
        buttonText: 'לצפייה בקולקציה',
      },
      settings: {
        height: '80vh',
        overlay: 0.2,
      },
      sortOrder: sortOrder++,
      isActive: true,
    });
  }
  
  // Add split banner if selected or if medium+
  if (data.specialFeatures.includes('split_banner') || targetSections >= 5) {
    sections.push({
      id: `section-split-${Date.now()}`,
      type: 'split_banner',
      title: null,
      subtitle: null,
      content: {
        items: [
          {
            link: '/products',
            title: 'קטגוריה 1',
            imageUrl: 'https://static.zara.net/assets/public/024c/0dd8/e19e4df78c61/f20fd99a35d2/02335629250-p/02335629250-p.jpg?ts=1752493031914&w=1230',
          },
          {
            link: '/products',
            title: 'קטגוריה 2',
            imageUrl: 'https://static.zara.net/assets/public/a132/8434/0ddd438dbcef/110f9ea930b3/05939539716-p/05939539716-p.jpg?ts=1758270012870&w=2560',
          },
        ],
      },
      settings: {
        height: '70vh',
      },
      sortOrder: sortOrder++,
      isActive: true,
    });
  }
  
  // Add more products if detailed
  if (targetSections >= 6) {
    sections.push({
      id: `section-products2-${Date.now()}`,
      type: 'products',
      title: 'כל המוצרים',
      subtitle: null,
      content: {
        type: 'all',
        limit: 8,
      },
      settings: {
        gap: 8,
        columns: 4,
        showCount: true,
      },
      sortOrder: sortOrder++,
      isActive: true,
    });
  }
  
  // Add newsletter if selected
  if (data.specialFeatures.includes('newsletter') || targetSections >= 4) {
    sections.push({
      id: `section-newsletter-${Date.now()}`,
      type: 'newsletter',
      title: 'הצטרפו למועדון',
      subtitle: 'הרשמו לניוזלטר וקבלו 15% הנחה על ההזמנה הראשונה',
      content: {
        buttonText: 'הרשמה',
        placeholder: 'כתובת אימייל',
      },
      settings: {
        maxWidth: 'xl',
      },
      sortOrder: sortOrder++,
      isActive: true,
    });
  }
  
  return {
    templateId: templateConfig.templateId,
    storeName: data.businessName,
    exportDate: new Date().toISOString(),
    generatedFromIntake: true,
    intakeData: {
      designStyles: data.designStyle,
      detailLevel: data.detailLevel,
      specialFeatures: data.specialFeatures,
    },
    sections,
  };
}

// Format the data for email
function formatEmailHtml(data: WizardData, templateJson: object): string {
  const designStylesHebrew = data.designStyle.map(s => styleLabels[s] || s).join(', ');
  const brandColorsHebrew = data.brandColors.map(c => colorLabels[c] || c).join(', ');
  const featuresHebrew = data.specialFeatures.map(f => featureLabels[f] || f).join(', ');
  const detailHebrew = data.detailLevel ? detailLabels[data.detailLevel] : 'לא צוין';

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .section { margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
        .section:last-child { border-bottom: none; }
        .section-title { font-size: 16px; font-weight: bold; color: #10b981; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .section-title::before { content: ''; width: 4px; height: 20px; background: #10b981; border-radius: 2px; }
        .field { margin-bottom: 8px; }
        .field-label { font-weight: 600; color: #666; }
        .field-value { color: #333; }
        .reference-site { background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 10px; }
        .reference-site a { color: #10b981; }
        .json-block { background: #1e293b; color: #e2e8f0; padding: 20px; border-radius: 8px; font-family: monospace; font-size: 12px; overflow-x: auto; white-space: pre-wrap; direction: ltr; text-align: left; }
        .badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin: 2px; }
        .contact-box { background: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin-top: 20px; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎨 שאלון אפיון חדש!</h1>
          <p>${data.businessName} - ${data.contactName}</p>
        </div>
        
        <div class="content">
          <div class="section">
            <div class="section-title">פרטי יצירת קשר</div>
            <div class="contact-box">
              <div class="field"><span class="field-label">שם העסק:</span> <span class="field-value">${data.businessName}</span></div>
              <div class="field"><span class="field-label">איש קשר:</span> <span class="field-value">${data.contactName}</span></div>
              <div class="field"><span class="field-label">אימייל:</span> <span class="field-value"><a href="mailto:${data.email}">${data.email}</a></span></div>
              <div class="field"><span class="field-label">טלפון:</span> <span class="field-value"><a href="tel:${data.phone}">${data.phone}</a></span></div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">סגנון עיצוב</div>
            <div>${data.designStyle.map(s => `<span class="badge">${styleLabels[s] || s}</span>`).join(' ')}</div>
          </div>
          
          <div class="section">
            <div class="section-title">מיתוג וצבעים</div>
            <div class="field">
              <span class="field-label">יש מיתוג קיים:</span> 
              <span class="field-value">${data.hasExistingBranding ? 'כן' : 'לא'}</span>
            </div>
            ${data.logoUrl ? `<div class="field"><span class="field-label">קישור ללוגו:</span> <span class="field-value"><a href="${data.logoUrl}">${data.logoUrl}</a></span></div>` : ''}
            ${brandColorsHebrew ? `<div class="field"><span class="field-label">צבעים נבחרים:</span> <span class="field-value">${brandColorsHebrew}</span></div>` : ''}
            ${data.customColors ? `<div class="field"><span class="field-label">צבעים מותאמים:</span> <span class="field-value">${data.customColors}</span></div>` : ''}
          </div>
          
          <div class="section">
            <div class="section-title">אתרי השראה</div>
            ${data.referenceSites
              .filter(site => site.url.trim())
              .map((site, idx) => `
                <div class="reference-site">
                  <div class="field"><span class="field-label">אתר ${idx + 1}:</span> <a href="${site.url}" target="_blank">${site.url}</a></div>
                  ${site.likes ? `<div class="field"><span class="field-label">מה אהב:</span> <span class="field-value">${site.likes}</span></div>` : ''}
                </div>
              `).join('')}
          </div>
          
          <div class="section">
            <div class="section-title">רמת פירוט</div>
            <div class="field-value">${detailHebrew}</div>
          </div>
          
          ${data.specialFeatures.length > 0 ? `
          <div class="section">
            <div class="section-title">פיצ'רים מבוקשים</div>
            <div>${data.specialFeatures.map(f => `<span class="badge">${featureLabels[f] || f}</span>`).join(' ')}</div>
            ${data.customFeatures ? `<div class="field" style="margin-top: 10px;"><span class="field-label">פיצ'רים נוספים:</span> <span class="field-value">${data.customFeatures}</span></div>` : ''}
          </div>
          ` : ''}
          
          ${data.additionalNotes ? `
          <div class="section">
            <div class="section-title">הערות נוספות</div>
            <div class="field-value">${data.additionalNotes}</div>
          </div>
          ` : ''}
          
          <div class="section">
            <div class="section-title">תבנית מוצעת (JSON)</div>
            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">ניתן לייבא את התבנית ישירות לאדיטור:</p>
            <div class="json-block">${JSON.stringify(templateJson, null, 2)}</div>
          </div>
        </div>
        
        <div class="footer">
          <p>נשלח מטופס אפיון לקוחות - QuickShop</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function submitClientIntake(data: WizardData): Promise<{ success: boolean; message?: string }> {
  try {
    // Generate template based on answers
    const templateJson = generateTemplateJson(data);
    
    // Format email content
    const emailHtml = formatEmailHtml(data, templateJson);
    
    // Recipients
    const recipients = ['itadmit@gmail.com', '0547359@gmail.com'];
    
    // Send to each recipient
    for (const recipient of recipients) {
      await sendEmail({
        to: recipient,
        subject: `🎨 שאלון אפיון חדש - ${data.businessName}`,
        html: emailHtml,
      });
    }
    
    // Also send a confirmation to the client
    await sendEmail({
      to: data.email,
      subject: `תודה על מילוי השאלון - ${data.businessName}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px; text-align: center; }
            .content h2 { color: #333; margin-bottom: 20px; }
            .content p { color: #666; font-size: 16px; }
            .steps { background: #f0fdf4; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: right; }
            .step { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }
            .step:last-child { margin-bottom: 0; }
            .step-icon { width: 30px; height: 30px; background: #10b981; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>תודה רבה! 🎉</h1>
            </div>
            <div class="content">
              <h2>קיבלנו את הפרטים שלך</h2>
              <p>היי ${data.contactName},<br>תודה שמילאת את שאלון האפיון עבור ${data.businessName}!</p>
              
              <div class="steps">
                <div class="step">
                  <div class="step-icon">1</div>
                  <span>נעבור על התשובות שלך בקפידה</span>
                </div>
                <div class="step">
                  <div class="step-icon">2</div>
                  <span>ניצור תבנית מותאמת אישית לעסק</span>
                </div>
                <div class="step">
                  <div class="step-icon">3</div>
                  <span>ניצור איתך קשר תוך 24 שעות</span>
                </div>
              </div>
              
              <p>יש לך שאלות? אפשר ליצור קשר בכל עת:<br>
              <a href="tel:+972552554432">055-255-4432</a> | 
              <a href="mailto:info@quick-shop.co.il">info@quick-shop.co.il</a></p>
            </div>
            <div class="footer">
              <p>© QuickShop - הפלטפורמה הישראלית לבניית חנויות אונליין</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error submitting client intake:', error);
    return { success: false, message: 'אירעה שגיאה בשליחת הטופס' };
  }
}

